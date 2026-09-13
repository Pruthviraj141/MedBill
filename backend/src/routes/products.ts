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
