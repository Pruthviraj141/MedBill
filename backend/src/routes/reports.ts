import { Hono } from 'hono';
import { Env } from '../types/env';

export const reportsRouter = new Hono<{ Bindings: Env }>();

const getReportForTimeframe = async (c: any, timeModifier: string) => {
  try {
    // Determine the base timestamp to filter from (e.g. 'now', '-1 day', '-7 days', '-1 month')
    // and filter for COMPLETED only.
    
    // 1. Basic Stats
    const statsQuery = await c.env.DB.prepare(`
      SELECT 
        COUNT(id) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(AVG(total), 0) as averageBill
      FROM orders 
      WHERE status = 'COMPLETED' 
      AND created_at >= datetime('now', ?)
    `).bind(timeModifier).first();

    // 2. Payment Breakdown
    const { results: payments } = await c.env.DB.prepare(`
      SELECT payment_method as method, COALESCE(SUM(total), 0) as amount
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY payment_method
    `).bind(timeModifier).all();

    // 3. Top Products
    const { results: topProducts } = await c.env.DB.prepare(`
      SELECT oi.name_snapshot as name, COALESCE(SUM(oi.quantity), 0) as sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'COMPLETED' AND o.created_at >= datetime('now', ?)
      GROUP BY oi.product_id, oi.name_snapshot
      ORDER BY sold DESC
      LIMIT 5
    `).bind(timeModifier).all();

    // 4. Peak Hours (UTC for now, as tz isn't dynamically passed)
    const { results: peakHours } = await c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY hour
      ORDER BY orders DESC
    `).bind(timeModifier).all();

    // 5. Weekday Pattern
    const { results: weekdayPattern } = await c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%w', created_at) AS INTEGER) as dayNum,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY dayNum
      ORDER BY dayNum ASC
    `).bind(timeModifier).all();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mappedWeekdays = weekdayPattern.map((r: any) => ({
      day: dayNames[r.dayNum] || 'Unknown',
      orders: r.orders,
      revenue: r.revenue
    }));

    const peakHour = peakHours.length > 0 ? `${String(peakHours[0].hour).padStart(2, '0')}:00` : null;

    return c.json({
      revenue: Number(statsQuery.totalRevenue),
      orders: Number(statsQuery.totalOrders),
      averageBill: Number(statsQuery.averageBill),
      peakHour,
      topProducts,
      paymentBreakdown: payments,
      peakHours,
      weekdayPattern: mappedWeekdays
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

reportsRouter.get('/today', (c) => getReportForTimeframe(c, '-1 day'));
reportsRouter.get('/week', (c) => getReportForTimeframe(c, '-7 days'));
reportsRouter.get('/month', (c) => getReportForTimeframe(c, '-1 month'));
