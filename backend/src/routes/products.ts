import { Hono } from 'hono';
import { connectDB } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { ObjectId } from 'mongodb';
import { startTime, endTime } from 'hono/timing';

export const productsRouter = new Hono();

productsRouter.use('*', authMiddleware());

productsRouter.get('/', async (c) => {
  startTime(c, 'total_route');
  try {
    const payload = c.get('jwtPayload') as any;
    startTime(c, 'connectDB');
    const db = await connectDB((c.env as any));
    endTime(c, 'connectDB');
    
    // Only fetch fields rendered in billing/product list (FIX 4b)
    startTime(c, 'find_cursor');
    const cursor = db.collection('products').find(
      { cafeId: payload.cafeId, active: { $ne: false } },
      { projection: { name: 1, category: 1, price: 1, icon: 1 } }
    );
    endTime(c, 'find_cursor');

    startTime(c, 'toArray');
    const products = await cursor.toArray();
    endTime(c, 'toArray');
    
    startTime(c, 'serialization');
    const response = c.json({
      success: true,
      data: {
        products: products.map((p: any) => ({
          ...p,
          id: p._id.toString()
        }))
      }
    });
    endTime(c, 'serialization');
    endTime(c, 'total_route');
    return response;
  } catch (err: any) {
    console.error('Explicit Products Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Product catalog offline' }
    }, 503);
  }
});

productsRouter.post('/', requireRole(['OWNER', 'MANAGER']), async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const db = await connectDB((c.env as any));
    const body = await c.req.json();
    
    if (!body.name || !body.price) {
      return c.json({ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Name and price required' } }, 400);
    }

    const doc = {
      cafeId: payload.cafeId,
      name: body.name,
      categoryId: body.categoryId || 'General',
      price: Number(body.price),
      active: true,
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await db.collection('products').insertOne(doc);
    return c.json({ 
      success: true, 
      data: { product: { ...doc, id: res.insertedId.toString(), _id: res.insertedId.toString() } } 
    }, 201);
  } catch (err: any) {
    console.error('Explicit Products POST Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Unable to save product' }
    }, 503);
  }
});

productsRouter.patch('/:id', requireRole(['OWNER', 'MANAGER']), async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const db = await connectDB((c.env as any));
    const id = c.req.param('id');
    const body = await c.req.json();
    
    delete body._id; // prevent overwrite
    body.updatedAt = new Date().toISOString();

    const res = await db.collection('products').updateOne(
      { _id: new ObjectId(id), cafeId: payload.cafeId },
      { $set: body }
    );

    return c.json({ 
      success: true,
      data: { acknowledged: res.modifiedCount > 0 } 
    });
  } catch (err: any) {
    console.error('Explicit Products PATCH Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Unable to update product' }
    }, 503);
  }
});

productsRouter.delete('/:id', requireRole(['OWNER', 'MANAGER']), async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const db = await connectDB((c.env as any));
    const id = c.req.param('id');
    
    // Soft delete
    const res = await db.collection('products').updateOne(
      { _id: new ObjectId(id), cafeId: payload.cafeId },
      { $set: { active: false, updatedAt: new Date().toISOString() } }
    );

    return c.json({ 
      success: true,
      data: { acknowledged: res.modifiedCount > 0 }
    });
  } catch (err: any) {
    console.error('Explicit Products DELETE Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Unable to delete product' }
    }, 503);
  }
});
