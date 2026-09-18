import { getDB } from '../database';
import { Capacitor } from '@capacitor/core';
import { webApiClient } from '../../lib/webApiClient';
import { IST_OFFSET_MINUTES } from '../../services/syncService';

// ----------------------------------------------------------------------
// IST Utility — compute UTC day boundaries for a given timezone offset
// ----------------------------------------------------------------------

/**
 * Returns the UTC ISO strings for the start and end of "today" in the local
 * timezone (default IST = UTC+5:30 = 330 min).
 *
 * Example:
 *   IST 2026-09-16 00:00 = 2026-09-15T18:30:00Z  (startUtc)
 *   IST 2026-09-17 00:00 = 2026-09-16T18:30:00Z  (endUtc)
 *
 * D1/SQLite stores timestamps in UTC ISO-8601 format. The LIKE '2026-09-16%'
 * approach was WRONG because a bill at 23:55 IST is STILL on the UTC previous
 * day. This function computes the correct UTC range.
 */
function getLocalDayUtcRange(tzOffsetMinutes = IST_OFFSET_MINUTES, dayOffset = 0): { startUtc: string; endUtc: string } {
  const nowMs = Date.now();
  const offsetMs = tzOffsetMinutes * 60 * 1000;
  const localMs = nowMs + offsetMs;
  const localDate = new Date(localMs);

  const y = localDate.getUTCFullYear();
  const m = localDate.getUTCMonth();
  const d = localDate.getUTCDate() + dayOffset;

  const startMs = Date.UTC(y, m, d) - offsetMs;
  const endMs = startMs + 24 * 60 * 60 * 1000;

  return {
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(endMs).toISOString(),
  };
}

// ----------------------------------------------------------------------
// NATIVE IMPLEMENTATION
// ----------------------------------------------------------------------
const nativeImpl = {
  getSalesSummary: async (startUtc: string, endUtc: string) => {
    const db = await getDB();
    const res = await db.query(
      `SELECT COUNT(id) as orders, COALESCE(SUM(total), 0) as revenue 
       FROM orders 
       WHERE status = 'COMPLETED' AND created_at >= ? AND created_at < ?`,
      [startUtc, endUtc]
    );
    const row = res.values?.[0];
    return {
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
      averageBill: row?.orders ? Math.round((row?.revenue || 0) / row?.orders) : 0
    };
  },

  getPaymentMix: async (startUtc: string, endUtc: string) => {
    const db = await getDB();
    const res = await db.query(
      `SELECT payment_method, COALESCE(SUM(total), 0) as amount
       FROM orders 
       WHERE status = 'COMPLETED' AND created_at >= ? AND created_at < ?
       GROUP BY payment_method`,
      [startUtc, endUtc]
    );
    return res.values || [];
  },

  getTopProducts: async (startUtc: string, endUtc: string, limit = 5) => {
    const db = await getDB();
    const res = await db.query(
      `SELECT i.name_snapshot as name, SUM(i.quantity) as sold, SUM(i.line_total) as revenue
       FROM order_items i
       JOIN orders o ON o.id = i.order_id
       WHERE o.status = 'COMPLETED' AND o.created_at >= ? AND o.created_at < ?
       GROUP BY i.name_snapshot
       ORDER BY sold DESC
       LIMIT ?`,
      [startUtc, endUtc, limit]
    );
    return res.values || [];
  },

  getPeakHours: async (startUtc: string, endUtc: string) => {
    const db = await getDB();
    const res = await db.query(
      `SELECT CAST(strftime('%H', datetime(created_at, '+330 minutes')) AS INTEGER) as hour, COUNT(id) as orders
       FROM orders
       WHERE status = 'COMPLETED' AND created_at >= ? AND created_at < ?
       GROUP BY hour
       ORDER BY orders DESC`,
      [startUtc, endUtc]
    );
    return res.values || [];
  },

  getWeekdayPattern: async (startUtc: string, endUtc: string) => {
    const db = await getDB();
    const res = await db.query(
       `SELECT CAST(strftime('%w', datetime(created_at, '+330 minutes')) AS INTEGER) as dayIndex, COALESCE(SUM(total), 0) as revenue
        FROM orders
        WHERE status = 'COMPLETED' AND created_at >= ? AND created_at < ?
        GROUP BY dayIndex`,
        [startUtc, endUtc]
    );
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (res.values || []).map((r: any) => ({ day: dayNames[r.dayIndex], revenue: r.revenue }));
  },

  getDailyMetrics: async (periodStr: string) => {
    let startUtc: string;
    let endUtc: string;

    if (periodStr === 'yesterday') {
      const range = getLocalDayUtcRange(IST_OFFSET_MINUTES, -1);
      startUtc = range.startUtc;
      endUtc = range.endUtc;
    } else if (periodStr === 'week' || periodStr === '7d') {
      // Last 7 completed local days: start 7 days ago, end = now+1day to include today
      const today = getLocalDayUtcRange(IST_OFFSET_MINUTES, 0);
      const weekStart = getLocalDayUtcRange(IST_OFFSET_MINUTES, -6);
      startUtc = weekStart.startUtc;
      endUtc = today.endUtc;
    } else if (periodStr === 'month' || periodStr === '30d') {
      const today = getLocalDayUtcRange(IST_OFFSET_MINUTES, 0);
      const monthStart = getLocalDayUtcRange(IST_OFFSET_MINUTES, -29);
      startUtc = monthStart.startUtc;
      endUtc = today.endUtc;
    } else if (periodStr === 'all' || periodStr === 'lifetime') {
      const today = getLocalDayUtcRange(IST_OFFSET_MINUTES, 0);
      startUtc = '1970-01-01T00:00:00.000Z'; // Genesis
      endUtc = today.endUtc;
    } else {
      // Default: 'today'
      const range = getLocalDayUtcRange(IST_OFFSET_MINUTES, 0);
      startUtc = range.startUtc;
      endUtc = range.endUtc;
    }

    const [summary, paymentBreakdown, topProducts, peakHours, weekdayPattern] = await Promise.all([
      nativeImpl.getSalesSummary(startUtc, endUtc),
      nativeImpl.getPaymentMix(startUtc, endUtc),
      nativeImpl.getTopProducts(startUtc, endUtc, 10),
      nativeImpl.getPeakHours(startUtc, endUtc),
      nativeImpl.getWeekdayPattern(startUtc, endUtc)
    ]);

    const globalPeak = peakHours.length > 0 ? peakHours.reduce((prev, curr) => (prev.orders > curr.orders ? prev : curr)) : null;

    return {
      revenue: summary.revenue,
      orders: summary.orders,
      averageBill: summary.averageBill,
      paymentBreakdown: paymentBreakdown.map((r: any) => ({ method: r.payment_method, amount: r.amount })),
      topProducts: topProducts.map((p: any) => ({ name: p.name, sold: p.sold, revenue: p.revenue })),
      peakHour: globalPeak ? `${globalPeak.hour > 12 ? globalPeak.hour - 12 : (globalPeak.hour === 0 ? 12 : globalPeak.hour)} ${globalPeak.hour >= 12 ? 'PM' : 'AM'}` : null,
      peakHours: peakHours,
      weekdayPattern: weekdayPattern,
      hourlyActivity: peakHours
    };
  }
};

// ----------------------------------------------------------------------
// WEB IMPLEMENTATION
// ----------------------------------------------------------------------
const webImpl = {
  getSalesSummary: async () => ({ revenue: 0, orders: 0, averageBill: 0 }),
  getPaymentMix: async () => ([]),
  getTopProducts: async () => ([]),

  getDailyMetrics: async (periodStr: string) => {
    let endpoint = '/reports/today';
    if (periodStr === 'week' || periodStr === '7d') endpoint = '/reports/week';
    if (periodStr === 'month' || periodStr === '30d') endpoint = '/reports/month';
    if (periodStr === 'all' || periodStr === 'lifetime') endpoint = '/reports/all';

    // Pass tz_offset_minutes so the backend computes the correct IST day boundary
    const data = await webApiClient.get(`${endpoint}?tz_offset_minutes=${IST_OFFSET_MINUTES}`);

    return {
      revenue: data.revenue || 0,
      orders: data.orders || 0,
      averageBill: data.averageBill || 0,
      paymentBreakdown: data.paymentBreakdown || [],
      topProducts: (data.topProducts || []).map((p: any) => ({ name: p.name, sold: p.sold, revenue: p.revenue })),
      peakHour: data.peakHour || null,
      peakHours: data.peakHours || [],
      weekdayPattern: (data.weekdayPattern || []).map((w: any) => ({
        ...w,
        day: w.day ? w.day.slice(0, 3) : 'Unknown'
      })),
      hourlyActivity: data.peakHours || []
    };
  }
};

export const dashboardRepository = Capacitor.isNativePlatform() ? nativeImpl : webImpl;
