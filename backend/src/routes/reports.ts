import { Hono } from 'hono';
import { connectDB } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

export const reportsRouter = new Hono();
reportsRouter.use('*', authMiddleware(), requireRole(['OWNER', 'MANAGER']));

reportsRouter.get('/:timeframe', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any;
    const timeframe = c.req.param('timeframe');

    // Strict constraint: NO cache staleness. Real-time dashboards.

    const db = await connectDB(c.env as any);

    const timeMatch: any = { cafeId: payload.cafeId, status: 'COMPLETED' };
    const now = new Date();
    if (timeframe === 'today') {
      timeMatch.createdAt = { $gte: new Date(new Date(now).setHours(0, 0, 0, 0)).toISOString() };
    } else if (timeframe === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      timeMatch.createdAt = { $gte: d.toISOString() };
    } else if (timeframe === 'month') {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      timeMatch.createdAt = { $gte: d.toISOString() };
    } else if (timeframe === 'all') {
      // Unbounded full history match, retain base cafeId match only
    } else {
      return c.json({ success: false, error: { code: 'INVALID_TIMEFRAME', message: 'Unknown frame' } }, 400);
    }

    // Single $facet aggregate — one Atlas round trip
    const pipeline = [
      { $match: timeMatch },
      { 
        $addFields: { 
          parsedDate: { 
            $convert: { 
              input: "$createdAt", 
              to: "date",
              onError: new Date("2024-01-01T00:00:00Z"),
              onNull: new Date("2024-01-01T00:00:00Z")
            } 
          } 
        } 
      },
      {
        $facet: {
          metrics: [
            { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }
          ],
          payments: [
            { $group: { _id: '$paymentMethod', total: { $sum: '$grandTotal' } } }
          ],
          products: [
            { $unwind: '$items' },
            { $group: { _id: '$items.name', sold: { $sum: '$items.quantity' }, total: { $sum: '$items.total' } } },
            { $sort: { sold: -1 } },
            { $limit: 200 }
          ],
          peakHours: [
            { $group: { _id: { $hour: "$parsedDate" }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          weekdays: [
            { $group: { _id: { $dayOfWeek: "$parsedDate" }, revenue: { $sum: "$grandTotal" } } },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];

    const results = await db.collection('orders').aggregate(pipeline).toArray();
    const facet = results[0] || {};
    const summary = facet.metrics?.[0] || { revenue: 0, orders: 0 };
    const payments: any[] = facet.payments || [];
    const products: any[] = facet.products || [];
    const rawPeakHours: any[] = facet.peakHours || [];
    const rawWeekdays: any[] = facet.weekdays || [];

    const dayNames = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const body = JSON.stringify({
      success: true,
      data: {
        revenue: summary.revenue || 0,
        orders: summary.orders || 0,
        averageBill: summary.orders ? Math.round((summary.revenue / summary.orders) * 100) / 100 : 0,
        peakHours: rawPeakHours.map(p => ({ hour: p._id, orders: p.orders })),
        weekdayPattern: rawWeekdays.map(d => ({ day: dayNames[d._id] || "Unk", revenue: d.revenue })),
        topProducts: products.map(p => ({ name: p._id, sold: p.sold, revenue: p.total || 0 })),
        paymentBreakdown: payments.map(p => ({ method: p._id, amount: p.total }))
      }
    });

    const response = new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

    return response;

  } catch (err: any) {
    console.error('Reports Route Crash:', err.message, err.stack);
    return c.json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message || 'Report generated offline' }
    }, 500, { 'Access-Control-Allow-Origin': '*' });
  }
});
