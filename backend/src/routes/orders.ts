import { Hono } from 'hono';
import { connectDB } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { startTime, endTime } from 'hono/timing';

export const ordersRouter = new Hono();

ordersRouter.use('*', authMiddleware());

const orderInputSchema = z.object({
  deviceId: z.string(),
  localId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })).min(1),
  paymentMethod: z.enum(['CASH', 'UPI'])
});

ordersRouter.post('/', requireRole(['OWNER', 'MANAGER', 'CASHIER']), async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const db = await connectDB((c.env as any));
    
    const parsed = orderInputSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Malformed order payload' } }, 400);
    }
    
    // 1. Idempotency Check (Prevent duplicate charges on spotty mobile networks)
    if (parsed.data.idempotencyKey) {
      startTime(c, 'idempotency');
      const existingOrder = await db.collection('orders').findOne({
        cafeId: payload.cafeId,
        idempotencyKey: parsed.data.idempotencyKey
      });
      endTime(c, 'idempotency');
      if (existingOrder) {
        return c.json({
          success: true,
          data: { ...existingOrder, id: existingOrder._id.toString() }
        });
      }
    }

    // 2 & 4 (parallel): Product lookup and invoice counter are independent — run together.
    const productIds = parsed.data.items.map(i => new ObjectId(i.productId));
    startTime(c, 'product_lookup_and_counter');
    const [dbProducts, seqRes] = await Promise.all([
      db.collection('products').find(
        { _id: { $in: productIds }, cafeId: payload.cafeId, active: { $ne: false } },
        { projection: { name: 1, price: 1 } }
      ).toArray(),
      db.collection<any>('counters').findOneAndUpdate(
        { _id: `invoice_${payload.cafeId}` },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      )
    ]);
    endTime(c, 'product_lookup_and_counter');

    const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));
    const invoiceNumber = `INV-${seqRes?.seq?.toString()?.padStart(5, '0') || Math.floor(Math.random() * 10000)}`;

    // 3. Recalculate totals server-side and snapshot info
    const items = [];
    let subtotal = 0;

    for (const item of parsed.data.items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return c.json({ success: false, error: { code: 'PRODUCT_ERROR', message: `Product ${item.productId} invalid/inactive` } }, 400);
      }
      
      const lineTotal = dbProduct.price * item.quantity;
      subtotal += lineTotal;
      
      items.push({
        productId: item.productId,
        name: dbProduct.name,   // snapshot
        unitPrice: dbProduct.price, // snapshot
        quantity: item.quantity,
        total: lineTotal
      });
    }

    const discount = 0;
    const grandTotal = subtotal;
    
    const now = new Date().toISOString();

    // 5. Create Order
    const orderDoc = {
      cafeId: payload.cafeId,
      cashierId: payload.id,
      deviceId: parsed.data.deviceId,
      localId: parsed.data.localId,
      idempotencyKey: parsed.data.idempotencyKey,
      invoiceNumber,
      items,
      subtotal,
      discount,
      grandTotal,
      paymentMethod: parsed.data.paymentMethod,
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now
    };

    startTime(c, 'order_insert');
    const res = await db.collection('orders').insertOne(orderDoc);
    endTime(c, 'order_insert');

    return c.json({ 
      success: true, 
      data: { ...orderDoc, id: res.insertedId.toString(), _id: res.insertedId.toString() } 
    }, 201);
    
  } catch (err: any) {
    console.error('Explicit Orders Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Transaction failed' }
    }, 503);
  }
});

ordersRouter.get('/', requireRole(['OWNER', 'MANAGER', 'CASHIER']), async (c) => {
  startTime(c, 'total_route');
  try {
    const payload = c.get('jwtPayload') as any;
    startTime(c, 'connectDB');
    const db = await connectDB((c.env as any));
    endTime(c, 'connectDB');

    // Only fetch fields rendered in the orders list view (FIX 4a)
    startTime(c, 'find_cursor');
    const cursor = db.collection('orders').find(
      { cafeId: payload.cafeId },
      { projection: { createdAt: 1, paymentMethod: 1, status: 1, grandTotal: 1, items: 1, invoiceNumber: 1 } }
    ).sort({ createdAt: -1 }).limit(50);
    endTime(c, 'find_cursor');

    startTime(c, 'toArray');
    const orders = await cursor.toArray();
    endTime(c, 'toArray');
    
    startTime(c, 'serialization');
    const response = c.json({
      success: true,
      data: { orders: orders.map(o => ({ ...o, id: o._id.toString() })) }
    });
    endTime(c, 'serialization');
    endTime(c, 'total_route');
    return response;
  } catch (err: any) {
    console.error('Explicit Orders GET Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Unable to fetch orders' }
    }, 503);
  }
});

ordersRouter.post('/delete-transaction', requireRole(['OWNER', 'MANAGER', 'CASHIER']), async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const db = await connectDB((c.env as any));
    const { id: orderId, pin } = await c.req.json();

    if (pin !== '2110') {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED_PIN', message: 'Invalid Admin PIN provided.' } }, 403);
    }
    
    let objectId;
    try { objectId = new ObjectId(orderId); } catch (e) {
      return c.json({ success: false, error: { message: 'Invalid Order ID' } }, 400); 
    }

    // Optimize to a single findOneAndUpdate operation
    const now = new Date().toISOString();
    const result = await db.collection('orders').findOneAndUpdate(
      { _id: objectId, cafeId: payload.cafeId },
      { 
        $set: { 
          status: 'VOIDED', 
          voidedAt: now,
          voidReason: 'Admin Void'
        } 
      }
    );
    
    // Handle both Node MongoDB Driver v4/v5 format ({value: Document}) and v6 format (Document)
    const orderDoc = result && (result as any).value !== undefined ? (result as any).value : result;
    if (!orderDoc) {
      return c.json({ success: false, error: { message: 'Order missing or already removed' } }, 404);
    }

    return c.json({ success: true, data: { id: orderId } });
  } catch (err: any) {
    return c.json({ success: false, error: { message: err.message || 'Action failed' } }, 503);
  }
});
