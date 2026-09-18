// src/utils/dashboardUtils.ts

/**
 * Creates dense arrays to cover 6AM - 11PM (18 hours) to match the dashboard matrix exactly.
 */
export function getDensePeakHours(rawPeakHours: any[]) {
  return Array.from({ length: 18 }, (_, k) => k + 6).map(hour => ({
    hour,
    orders: rawPeakHours.find((p: any) => p.hour === hour)?.orders || 0
  }));
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
    ? `conic-gradient(from 0deg, #EAD6C0 0% ${upiPct}%, #8A5A33 ${upiPct}% ${upiPct + cashPct}%, transparent 100%)`
    : `conic-gradient(#513217 0% 100%)`;
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
