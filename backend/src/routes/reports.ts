import { Hono } from 'hono';
import { Env } from '../types/env';

export const reportsRouter = new Hono<{ Bindings: Env }>();

/**
 * Compute the UTC ISO string for the start of the current day in a given timezone.
 *
 * D1/SQLite stores all timestamps as UTC ISO-8601 strings (e.g. "2026-09-15T18:30:00.000Z").
 * "Today" must be computed relative to the café's local timezone (IST = UTC+05:30 = 330 min).
 *
 * Logic:
 *   1. Get current UTC unix ms.
 *   2. Add tz offset to find the local date.
 *   3. Compute midnight of that local date in UTC by subtracting the offset again.
 *
 * Example (IST, offset=330):
 *   now = 2026-09-16T00:00:00Z (midnight UTC)
 *   local = 2026-09-16T05:30:00 IST → local date is Sep 16
 *   utcMidnightOfLocalDay = 2026-09-15T18:30:00Z  ← this is the correct start-of-IST-day in UTC
 *
 * A bill created at 2026-09-15T23:59 IST = 2026-09-15T18:29Z is >= 18:30Z? NO → it belongs to
 * yesterday IST. CORRECT.
 * A bill created at 2026-09-16T00:01 IST = 2026-09-15T18:31Z is >= 18:30Z? YES → belongs to today IST. CORRECT.
 */
function getUtcDayBoundaries(tzOffsetMinutes: number): { startUtc: string; endUtc: string } {
  const nowMs = Date.now();
  const offsetMs = tzOffsetMinutes * 60 * 1000;

  // Compute the local date by shifting now into the local timezone
  const localMs = nowMs + offsetMs;
  const localDate = new Date(localMs);

  // Extract local year/month/day
  const y = localDate.getUTCFullYear();
  const m = localDate.getUTCMonth();
  const d = localDate.getUTCDate();

  // Local midnight in UTC
  const localMidnightMs = Date.UTC(y, m, d) - offsetMs;
  const localEndMs = localMidnightMs + 24 * 60 * 60 * 1000;

  return {
    startUtc: new Date(localMidnightMs).toISOString(),
    endUtc: new Date(localEndMs).toISOString(),
  };
}

function getUtcStartForPeriod(tzOffsetMinutes: number, period: string): string {
  if (period === 'all') return '1970-01-01T00:00:00.000Z';
  const { startUtc } = getUtcDayBoundaries(tzOffsetMinutes);
  const midnightMs = new Date(startUtc).getTime();

  if (period === 'today') return startUtc;
  if (period === 'week') return new Date(midnightMs - 6 * 24 * 60 * 60 * 1000).toISOString();
  // month: go back 29 full days so "this month" covers up to 30 days
  return new Date(midnightMs - 29 * 24 * 60 * 60 * 1000).toISOString();
}

const getReportForPeriod = async (c: any, period: string) => {
  try {
    // Accept tz_offset_minutes from query, default to 330 (IST = UTC+5:30)
    const rawTz = parseInt(c.req.query('tz_offset_minutes') || '330', 10);
    const tzOffsetMinutes = Number.isFinite(rawTz) ? rawTz : 330;
    const sinceUtc = getUtcStartForPeriod(tzOffsetMinutes, period);

    // 1. Basic Stats — COMPLETED orders since sinceUtc
    const q1 = c.env.DB.prepare(`
      SELECT 
        COUNT(id) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(AVG(total), 0) as averageBill
      FROM orders 
      WHERE status = 'COMPLETED' 
      AND created_at >= ?
    `).bind(sinceUtc);

    // 2. Payment Breakdown
    const q2 = c.env.DB.prepare(`
      SELECT payment_method as method, COALESCE(SUM(total), 0) as amount
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= ?
      GROUP BY payment_method
    `).bind(sinceUtc);

    // 3. Top Products (bounded to top 10 for fast transfer)
    const q3 = c.env.DB.prepare(`
      SELECT oi.name_snapshot as name, COALESCE(SUM(oi.quantity), 0) as sold, COALESCE(SUM(oi.line_total), 0) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'COMPLETED' AND o.created_at >= ?
      GROUP BY oi.product_id, oi.name_snapshot
      ORDER BY sold DESC
      LIMIT 10
    `).bind(sinceUtc);

    // 4. Peak Hours (stored as UTC; for meaningful reporting, shift by tz offset)
    const q4 = c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', datetime(created_at, '+${tzOffsetMinutes} minutes')) AS INTEGER) as hour,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= ?
      GROUP BY hour
      ORDER BY orders DESC
    `).bind(sinceUtc);

    // 5. Weekday Pattern (shifted to local tz)
    const q5 = c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%w', datetime(created_at, '+${tzOffsetMinutes} minutes')) AS INTEGER) as dayNum,
        COUNT(id) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= ?
      GROUP BY dayNum
      ORDER BY dayNum ASC
    `).bind(sinceUtc);

    // 6. Recent Orders (limit 5 for instant dashboard display without extra network calls)
    const q6 = c.env.DB.prepare(`
      SELECT id, invoice_number as invoiceNumber, status, total as grandTotal, payment_method as paymentMethod, created_at as createdAt
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const batchResults = await c.env.DB.batch([q1, q2, q3, q4, q5, q6]);

    const statsQuery = batchResults[0].results[0] || { totalOrders: 0, totalRevenue: 0, averageBill: 0 };
    const payments = batchResults[1].results;
    const topProducts = batchResults[2].results;
    const peakHours = batchResults[3].results;
    const weekdayPattern = batchResults[4].results;
    const recentOrders = batchResults[5].results;
    
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
      weekdayPattern: mappedWeekdays,
      recentOrders: recentOrders || [],
      // Diagnostic: expose the UTC boundary used, so frontend can verify
      _debug: { period, sinceUtc, tzOffsetMinutes }
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

reportsRouter.get('/today', (c) => getReportForPeriod(c, 'today'));
reportsRouter.get('/week', (c) => getReportForPeriod(c, 'week'));
reportsRouter.get('/month', (c) => getReportForPeriod(c, 'month'));
reportsRouter.get('/all', (c) => getReportForPeriod(c, 'all'));
