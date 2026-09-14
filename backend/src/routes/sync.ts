import { Hono } from 'hono';
import { Env } from '../types/env';

export const syncRouter = new Hono<{ Bindings: Env }>();

syncRouter.post('/orders', async (c) => {
  const body = await c.req.json();
  const { orders } = body;
  if (!Array.isArray(orders)) return c.json({ error: 'Invalid payload, expected { orders: [] }' }, 400);

  const statements = [];
  const processedIds: string[] = [];
  
  for (const payload of orders) {
    const order = payload.order || payload;
    const items = payload.items || [];

    if (!order.id || !order.invoice_number) continue;
    
    // We use INSERT OR IGNORE for true idempotency
    statements.push(
      c.env.DB.prepare(
        `INSERT OR IGNORE INTO orders 
         (id, invoice_number, status, subtotal, total, payment_method, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        order.id, order.invoice_number, order.status, order.subtotal, order.total, order.payment_method, order.created_at
      )
    );
    
    if (Array.isArray(items)) {
      for (const item of items) {
        statements.push(
          c.env.DB.prepare(
            `INSERT OR IGNORE INTO order_items 
             (id, order_id, product_id, name_snapshot, unit_price, quantity, line_total) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            item.id, item.order_id, item.product_id, item.name_snapshot, item.unit_price, item.quantity, item.line_total
          )
        );
      }
    }
    processedIds.push(order.id);
  }

  if (statements.length > 0) {
    await c.env.DB.batch(statements);
  }

  return c.json({ success: true, processed: processedIds });
});

syncRouter.post('/voids', async (c) => {
  const body = await c.req.json();
  const { voids } = body;
  if (!Array.isArray(voids)) return c.json({ error: 'Invalid payload, expected { voids: [] }' }, 400);

  const statements = [];
  const processedIds: string[] = [];

  for (const v of voids) {
    const targetId = v.order_id || v.id;
    if (!targetId) continue;
    statements.push(
      c.env.DB.prepare(
        `UPDATE orders SET status = 'VOIDED', void_reason = ?, voided_at = ? 
         WHERE id = ? AND status != 'VOIDED'`
      ).bind(v.reason || v.void_reason || null, v.voided_at || null, targetId)
    );
    processedIds.push(targetId);
  }

  if (statements.length > 0) {
    await c.env.DB.batch(statements);
  }

  return c.json({ success: true, processed: processedIds });
});

syncRouter.get('/orders', async (c) => {
  const lastSync = c.req.query('last_sync') || '1970-01-01T00:00:00.000Z';
  
  const { results: orders } = await c.env.DB.prepare(
    `SELECT * FROM orders WHERE created_at > ? OR voided_at > ? ORDER BY created_at ASC LIMIT 200`
  ).bind(lastSync, lastSync).all();

  if (!orders || orders.length === 0) return c.json({ orders: [] });

  const orderIds = orders.map(o => `'${o.id}'`).join(',');
  const { results: items } = await c.env.DB.prepare(
    `SELECT * FROM order_items WHERE order_id IN (${orderIds})`
  ).all();

  const formattedOrders = orders.map(o => {
    return {
      order: o,
      items: items.filter(i => i.order_id === o.id)
    };
  });

  return c.json({ orders: formattedOrders });
});

syncRouter.get('/products', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM products').all();
  return c.json({ products: results || [] });
});

syncRouter.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
  return c.json({ settings: results || [] });
});
