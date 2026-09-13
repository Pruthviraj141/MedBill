import { getDB } from '../database';
import { Capacitor } from '@capacitor/core';
import { webApiClient } from '../../lib/webApiClient';

// ----------------------------------------------------------------------
// NATIVE IMPLEMENTATION
// ----------------------------------------------------------------------
const nativeImpl = {
  getSalesSummary: async (datePrefix: string) => {
    const db = await getDB();
    const search = `${datePrefix}%`;
    const res = await db.query(
      `SELECT COUNT(id) as orders, SUM(total) as revenue 
       FROM orders 
       WHERE status = 'COMPLETED' AND created_at LIKE ?`,
      [search]
    );
    const row = res.values?.[0];
    return {
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
      averageBill: row?.orders ? Math.round((row?.revenue || 0) / row?.orders) : 0
    };
  },

  getPaymentMix: async (datePrefix: string) => {
    const db = await getDB();
    const search = `${datePrefix}%`;
    const res = await db.query(
      `SELECT payment_method, SUM(total) as amount
       FROM orders 
       WHERE status = 'COMPLETED' AND created_at LIKE ?
       GROUP BY payment_method`,
      [search]
    );
    return res.values || [];
  },

  getTopProducts: async (datePrefix: string, limit = 5) => {
    const db = await getDB();
    const search = `${datePrefix}%`;
    const res = await db.query(
      `SELECT i.name_snapshot as name, SUM(i.quantity) as sold
       FROM order_items i
       JOIN orders o ON o.id = i.order_id
       WHERE o.status = 'COMPLETED' AND o.created_at LIKE ?
       GROUP BY i.name_snapshot
       ORDER BY sold DESC
       LIMIT ?`,
      [search, limit]
    );
    return res.values || [];
  },

  getDailyMetrics: async (periodStr: string) => {
    const now = new Date();
    if (periodStr === 'yesterday') {
      now.setDate(now.getDate() - 1);
    }
    const prefix = now.toISOString().split('T')[0];

    const [summary, paymentBreakdown, topProducts] = await Promise.all([
      nativeImpl.getSalesSummary(prefix),
      nativeImpl.getPaymentMix(prefix),
      nativeImpl.getTopProducts(prefix, 10)
    ]);

    return {
      revenue: summary.revenue,
      orders: summary.orders,
      averageBill: summary.averageBill,
      paymentBreakdown: paymentBreakdown.map((r: any) => ({ method: r.payment_method, amount: r.amount })),
      topProducts: topProducts.map((p: any) => ({ name: p.name, sold: p.sold })),
      peakHour: null as string | null,
      peakHours: [] as any[],
      weekdayPattern: [] as any[],
      hourlyActivity: [] as any[]
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
    // Maps standard period strings ('today', 'week', 'month', 'yesterday') 
    // to actual available D1 API endpoints '/reports/today', '/reports/week', '/reports/month'
    let endpoint = '/reports/today';

    if (periodStr === 'week' || periodStr === '7d') endpoint = '/reports/week';
    if (periodStr === 'month' || periodStr === '30d') endpoint = '/reports/month';

    const data = await webApiClient.get(endpoint);

    // Map exact response structure from API to Dashboard UI
    return {
      revenue: data.revenue || 0,
      orders: data.orders || 0,
      averageBill: data.averageBill || 0,
      paymentBreakdown: data.paymentBreakdown || [], // already in { method, amount }
      topProducts: data.topProducts || [],           // already in { name, sold }
      peakHour: data.peakHour || null,
      peakHours: data.peakHours || [],
      weekdayPattern: (data.weekdayPattern || []).map((w: any) => ({
        ...w,
        day: w.day ? w.day.slice(0, 3) : 'Unknown'
      })),
      hourlyActivity: data.peakHours || []           // Used similarly
    };
  }
};

export const dashboardRepository = Capacitor.isNativePlatform() ? nativeImpl : webImpl;
