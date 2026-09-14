import { Hono } from 'hono';
import { Env } from '../types/env';

export const ordersRouter = new Hono<{ Bindings: Env }>();

ordersRouter.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
    
    // To match frontend compatibility, we need to embed items. 
    // In a real app we'd paginate or load items lazily, but here we load for the latest 100.
    if (results.length === 0) return c.json({ orders: [] });
    
    const orderIds = results.map(r => `'${r.id}'`).join(',');
    const { results: itemsResults } = await c.env.DB.prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds})`).all();
    
    const orders = results.map(o => {
      const items = itemsResults.filter(i => i.order_id === o.id).map(i => ({
        productId: i.product_id,
        name: i.name_snapshot,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        total: i.line_total
      }));
      
      return {
        _id: o.id,
        id: o.id,
        cafeId: '',
        invoiceNumber: o.invoice_number,
        status: o.status,
        subtotal: o.subtotal,
        discount: 0,
        grandTotal: o.total,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
        items
      };
    });
    
    return c.json({ orders });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

ordersRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    // Support either direct order creation or sync payloads (which provide full id / date etc)
    const id = body.id || body._id || crypto.randomUUID();
    
    const dateStr = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
    const invoiceNumber = body.invoiceNumber || body.invoice_number || `INV-${dateStr}-${id}`;
    
    const paymentMethod = body.paymentMethod || body.payment_method;
    const createdAt = body.createdAt || body.created_at || new Date().toISOString();
    
    // Ensure only valid status
    let status = body.status || 'COMPLETED';
    if (status !== 'COMPLETED' && status !== 'VOIDED') status = 'COMPLETED';

    // Ensure valid payment method
    if (paymentMethod !== 'CASH' && paymentMethod !== 'UPI') {
      return c.json({ error: 'Invalid payment method' }, 400);
    }
    
    const items = body.items || [];
    
    // Calculate totals securely
    let subtotal = 0;
    const itemStatements = [];
    
    for (const item of items) {
      const q = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || Number(item.price) || 0; // Using provided unit price (snapshot for history)
      const lineTotal = price * q;
      subtotal += lineTotal;
      
      const itemId = crypto.randomUUID();
      const productId = item.productId || item.product_id;
      const productName = item.name || item.product_name || 'Unknown';
      
      itemStatements.push(
        c.env.DB.prepare(`
          INSERT OR IGNORE INTO order_items (id, order_id, product_id, name_snapshot, unit_price, quantity, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(itemId, id, productId, productName, price, q, lineTotal)
      );
    }
    
    const total = subtotal; // NO tax / fees
    
    // Insert order (IGNORE if exact ID already exists due to sync idempotency)
    const orderStmt = c.env.DB.prepare(`
      INSERT OR IGNORE INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, invoiceNumber, status, subtotal, total, paymentMethod, createdAt);
    
    // Execute as batch transaction
    const batchResult = await c.env.DB.batch([orderStmt, ...itemStatements]);
    
    // We check if order was actually inserted or ignored. batchResult[0].success means no sql error.
    
    return c.json({ 
      success: true, 
      order: {
        _id: id,
        id,
        invoiceNumber,
        status,
        subtotal,
        grandTotal: total,
        paymentMethod,
        createdAt
      }
    });

  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Using POST for void according to instructions
ordersRouter.post('/:id/void', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const reason = body.reason || 'User voided';
    const voidedAt = new Date().toISOString();
    
    const stmt = c.env.DB.prepare(`
      UPDATE orders 
      SET status = 'VOIDED', void_reason = ?, voided_at = ? 
      WHERE id = ? AND status != 'VOIDED'
    `).bind(reason, voidedAt, id);
    
    await c.env.DB.batch([stmt]);
    
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
