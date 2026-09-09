import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { HTTPException } from 'hono/http-exception';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { connectDB } from './db';
import { authMiddleware, requireRole } from './middleware/auth';

import { reportsRouter } from './routes/reports';

type Bindings = {
  WEB_ORIGIN?: string;
  MONGODB_URI?: string;
  MONGODB_DB_NAME?: string;
  AUTH_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', timing({ crossOrigin: true }));

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Server-Timing']
}))

app.onError((err, c) => {
  console.error('Fatal Edge Error:', err);

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        code: err.status === 401 ? 'UNAUTHORIZED' : 'HTTP_ERROR',
        message: err.message || 'Request failed'
      }
    }, err.status);
  }

  return c.json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Internal Server Error'
    }
  }, 500);
});

app.get('/api/health', c => c.json({ ok: true, service: 'cafe-pos-api' }));

app.get('/api/health/db', async (c) => {
  try {
    const db = await connectDB(c.env as any);
    await db.command({ ping: 1 });
    return c.json({
      success: true,
      data: { database: 'connected' }
    });
  } catch (err: any) {
    console.error('Diagnostic DB Error:', err);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database unavailable'
      }
    }, 503);
  }
});

app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/reports', reportsRouter);

export default app;
