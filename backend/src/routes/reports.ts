import { Hono } from 'hono';
import { Env } from '../types/env';

export const reportsRouter = new Hono<{ Bindings: Env }>();

const getReportForTimeframe = async (c: any, timeModifier: string) => {
  try {
    // Determine the base timestamp to filter from (e.g. 'now', '-1 day', '-7 days', '-1 month')
    // and filter for COMPLETED only.
    
    // 1. Basic Stats
    const q1 = c.env.DB.prepare(`
      SELECT 
        COUNT(id) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(AVG(total), 0) as averageBill
      FROM orders 
      WHERE status = 'COMPLETED' 
      AND created_at >= datetime('now', ?)
    `).bind(timeModifier);

    // 2. Payment Breakdown
    const q2 = c.env.DB.prepare(`
      SELECT payment_method as method, COALESCE(SUM(total), 0) as amount
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY payment_method
    `).bind(timeModifier);

    // 3. Top Products
    const q3 = c.env.DB.prepare(`
      SELECT oi.name_snapshot as name, COALESCE(SUM(oi.quantity), 0) as sold, COALESCE(SUM(oi.line_total), 0) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'COMPLETED' AND o.created_at >= datetime('now', ?)
      GROUP BY oi.product_id, oi.name_snapshot
      ORDER BY sold DESC
      LIMIT 5
    `).bind(timeModifier);

    // 4. Peak Hours (UTC for now, as tz isn't dynamically passed)
    const q4 = c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY hour
      ORDER BY orders DESC
    `).bind(timeModifier);

    // 5. Weekday Pattern
    const q5 = c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%w', created_at) AS INTEGER) as dayNum,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= datetime('now', ?)
      GROUP BY dayNum
      ORDER BY dayNum ASC
    `).bind(timeModifier);

    // Execute concurrently over a single D1 HTTP request
    const batchResults = await c.env.DB.batch([q1, q2, q3, q4, q5]);

    const statsQuery = batchResults[0].results[0] || { totalOrders: 0, totalRevenue: 0, averageBill: 0 };
    const payments = batchResults[1].results;
    const topProducts = batchResults[2].results;
    const peakHours = batchResults[3].results;
    const weekdayPattern = batchResults[4].results;
    
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
