import { Hono } from 'hono';
import { Env } from '../types/env';

export const settingsRouter = new Hono<{ Bindings: Env }>();

settingsRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
  const settings: Record<string, string> = {};
  for (const row of results) {
    settings[row.key as string] = row.value as string;
  }
  return c.json({ settings });
});

settingsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const stmts = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
         stmts.push(c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, value));
      }
    }
    
    if (stmts.length > 0) {
      await c.env.DB.batch(stmts);
    }
    return c.json({ success: true });
  } catch (err: any) {
     return c.json({ success: false, error: err.message }, 500);
  }
});
