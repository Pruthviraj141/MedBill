import { Hono } from 'hono';
import { Env } from '../types/env';

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.post('/login', async (c) => {
  try {
    const { pin } = await c.req.json();
    
    // Validate PIN from settings table, fallback to '1234'
    const setting = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('pin').first<{value: string}>();
    const validPin = setting?.value || '1234';
    
    if (pin === validPin) {
      return c.json({ success: true, token: 'simple-local-token' });
    }
    
    return c.json({ success: false, message: 'Invalid PIN' }, 401);
  } catch (error) {
    return c.json({ success: false, message: 'Invalid payload' }, 400);
  }
});
