import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types/env';

// Import routers
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { ordersRouter } from './routes/orders';
import { reportsRouter } from './routes/reports';
import { settingsRouter } from './routes/settings';
import { syncRouter } from './routes/sync';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE']
}));

// Health Check
app.get('/api/health', async (c) => {
  try {
    // Lightweight D1 query to verify binding
    const { results } = await c.env.DB.prepare('SELECT 1 as alive').all();
    return c.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    return c.json({ status: 'error', db: 'disconnected' }, 500);
  }
});

// Routes
app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/reports', reportsRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/sync', syncRouter);

export default app;
