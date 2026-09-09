import { Hono } from 'hono';
import { connectDB } from '../db';
import { sign } from 'hono/jwt';

export const authRouter = new Hono<{ Bindings: { AUTH_SECRET: string, MONGODB_URI: string, MONGODB_DB_NAME: string } }>();

authRouter.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    const db = await connectDB(c.env);
    
    const user = await db.collection('users').findOne({ username });
    if (!user || user.passwordHash !== password) {
      return c.json({ ok: false, error: 'Invalid credentials' }, 401);
    }

    const token = await sign({
      id: user._id.toString(),
      cafeId: user.cafeId,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }, c.env.AUTH_SECRET, 'HS256');

    return c.json({ ok: true, token, user: { username: user.username, role: user.role, cafeId: user.cafeId } });
  } catch (err: any) {
    console.error("Login Error:", err);
    return c.json({ ok: false, error: err.message || 'Internal Server Error' }, 500);
  }
});
