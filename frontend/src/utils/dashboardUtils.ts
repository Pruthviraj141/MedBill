// src/utils/dashboardUtils.ts

/**
 * Creates dense arrays to cover all 24 hours (12 AM - 11 PM) dynamically.
 */
export function getDensePeakHours(rawPeakHours: any[], period?: string, orders?: any[]) {
  // 1. Establish the dense array using backend data safely (fixing string-number mismatch directly)
  const dense = Array.from({ length: 24 }, (_, k) => k).map(hour => {
    const match = rawPeakHours.find((p: any) => Number(p.hour) === hour);
    return {
      hour,
      orders: match ? Number(match.orders) : 0,
      revenue: match ? Number(match.revenue) : 0
    };
  });

  // 2. Real-time overlay: Instead of discarding backend history for the local cache,
  // we compute the local cache for today and safely merge it using Math.max.
  // This guarantees real-time graph spikes for recent orders before cloud-sync occurs.
  if (period === 'today' && orders && orders.length > 0) {
    const localPeakHours = new Map<number, number>();
    const localPeakRev = new Map<number, number>();
    const todayStr = new Date().toDateString();
    
    orders.forEach((order: any) => {
      const ts = order.createdAt || order.created_at;
      if (!ts) return;
      const date = new Date(ts);
      if (isNaN(date.getTime()) || date.toDateString() !== todayStr) return;
      
      const hour = date.getHours();
      localPeakHours.set(hour, (localPeakHours.get(hour) || 0) + 1);
      
      const orderRev = Number(order.grandTotal ?? order.total ?? 0) || 0;
      localPeakRev.set(hour, (localPeakRev.get(hour) || 0) + orderRev);
    });

    return dense.map(d => {
      const activeLocalCount = localPeakHours.get(d.hour) || 0;
      const activeLocalRev = localPeakRev.get(d.hour) || 0;
      return {
        ...d,
        orders: Math.max(d.orders, activeLocalCount),
        revenue: Math.max(d.revenue ?? 0, activeLocalRev)
      };
    });
  }

  return dense;
}

/**
 * Creates dense arrays for 7 days (Sun-Sat).
 */
export function getDenseWeekdays(rawWeekdays: any[]) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames.map(day => ({
    day,
    revenue: rawWeekdays.find((d: any) => d.day === day)?.revenue || 0
  }));
}

/**
 * Filters out any non CASH/UPI payments and returns the valid payments and total.
 */
export function getValidPaymentsData(allPayments: any[]) {
  const validPayments = allPayments.filter((p: any) => p.method === 'CASH' || p.method === 'UPI');
  const validPaymentsTotal = validPayments.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  
  let upiPct = 0;
  let cashPct = 0;
  
  if (validPaymentsTotal > 0) {
    const upi = validPayments.find((p: any) => p.method === 'UPI')?.amount ?? 0;
    const cash = validPayments.find((p: any) => p.method === 'CASH')?.amount ?? 0;
    upiPct = Math.round((upi / validPaymentsTotal) * 100);
    cashPct = Math.round((cash / validPaymentsTotal) * 100);
  }
  
  return {
    validPayments,
    validPaymentsTotal,
    upiPct,
    cashPct
  };
}

/**
 * Returns the CSS conic-gradient string for the donut chart.
 */
export function getDonutGradient(validPaymentsTotal: number, upiPct: number, cashPct: number) {
  return validPaymentsTotal > 0 
    ? `conic-gradient(from 0deg, #38bdf8 0% ${upiPct}%, #0284c7 ${upiPct}% ${upiPct + cashPct}%, transparent 100%)`
    : `conic-gradient(#0369a1 0% 100%)`;
}

/**
 * Aggregates local active orders into the top products mapping to provide real-time updates
 * before they sync entirely (when period is 'today').
 */
export function getTopProducts(orders: any[], reportTopProducts: any[], period: string) {
  const totals = new Map<string, { revenue: number, sold: number }>();
  
  if (orders.length > 0 && period === 'today') {
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const itemName = item.name || item.name_snapshot || 'Unknown Product';
        const itemQty = Number(item.quantity ?? 1);
        
        let itemRev = Number(item.total ?? item.line_total ?? 0);
        if (itemRev === 0 || isNaN(itemRev)) {
           const itemPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
           itemRev = itemPrice * itemQty;
        }

        totals.set(itemName, {
          revenue: (totals.get(itemName)?.revenue ?? 0) + itemRev,
          sold: (totals.get(itemName)?.sold ?? 0) + itemQty
        });
      });
    });
    
    // Combine from map and return all sorted
    return Array.from(totals.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(x => ({ name: x[0], ...x[1] }));
  }
  
  return (reportTopProducts ?? []).map((x: any) => ({ ...x, revenue: Number(x.revenue ?? 0) }));
}
