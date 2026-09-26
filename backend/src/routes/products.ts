import { Hono } from 'hono';
import { Env } from '../types/env';

export const productsRouter = new Hono<{ Bindings: Env }>();

productsRouter.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM products WHERE active = 1').all();
    const mapped = results.map((p: any) => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      icon: p.image_url,
      active: p.active === 1
    }));
    return c.json({ products: mapped });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

productsRouter.post('/', async (c) => {
  try {
    const p = await c.req.json();
    if (!p.id || !p.name || !p.price || !p.category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Case-insensitive duplicate check
    const { results: duplicates } = await c.env.DB.prepare(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?) AND id != ?'
    ).bind(p.name, p.id).all();
    
    if (duplicates.length > 0) {
      return c.json({ error: 'Product name already exists globally' }, 400);
    }

    const { success } = await c.env.DB.prepare(
      `INSERT OR REPLACE INTO products (id, name, price, category, image_url, active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      p.id, p.name, p.price, p.category, p.image_url || null, p.active ? 1 : 0, new Date().toISOString()
    ).run();

    return c.json({ success });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

productsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { success } = await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    
    // Also cleanup any order items referencing this if strictly needed, or just let cascade handle it. 
    // D1 might have foreign keys. But order_items only references orders. Products soft-deleted usually.
    // Wait, the POS architecture normally expects active=0 for soft-delete if it's billed. Let's physically delete.
    return c.json({ success });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

