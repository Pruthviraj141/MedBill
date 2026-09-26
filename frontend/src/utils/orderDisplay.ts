type AnyOrder = Record<string, any> & {
  id?: string;
  _id?: string;
  createdAt?: string;
  created_at?: string;
  paymentMethod?: string;
  payment_method?: string;
  grandTotal?: number;
  total?: number;
  items?: any[];
};

function orderId(o: AnyOrder): string {
  return String(o.id ?? o._id ?? '');
}

function orderTime(o: AnyOrder): number {
  const raw = o.createdAt ?? o.created_at ?? '';
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function orderDayKey(createdAt: string | undefined | null): string {
  const d = createdAt ? new Date(createdAt) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  const y = safe.getFullYear();
  const m = String(safe.getMonth() + 1).padStart(2, '0');
  const day = String(safe.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Daily running token: first order of the day = 1, second = 2, …
 * Stable regardless of display sort (sorted oldest → newest within each day).
 * Never exposes UUID / invoice internals to the user.
 */
export function buildDailyTokenMap<T extends AnyOrder>(orders: T[]): Map<string, number> {
  const sorted = [...orders].sort((a, b) => orderTime(a) - orderTime(b));
  const counters = new Map<string, number>();
  const map = new Map<string, number>();
  for (const o of sorted) {
    const key = orderDayKey((o.createdAt ?? o.created_at) as string);
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    const id = orderId(o);
    if (id) map.set(id, next);
  }
  return map;
}

export function formatToken(n: number | undefined | null): string {
  if (!n || n <= 0) return '#—';
  return `#${String(n).padStart(2, '0')}`;
}

export function getOrderTotal(o: AnyOrder): number {
  const v = o.grandTotal ?? o.total ?? o.subtotal ?? 0;
  return Number(v) || 0;
}

export function getPaymentMethod(o: AnyOrder): string {
  return String(o.paymentMethod ?? o.payment_method ?? 'CASH').toUpperCase();
}

export function getItemCount(o: AnyOrder): number {
  return (o.items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0);
}

export function getItemsSummary(o: AnyOrder, maxItems = 2): string {
  const items = o.items || [];
  if (items.length === 0) return 'Items unavailable';
  const names = items.map((i: any) => `${i.quantity ?? 1}× ${i.name_snapshot ?? i.name ?? 'Item'}`);
  if (names.length <= maxItems) return names.join('  ·  ');
  return `${names.slice(0, maxItems).join('  ·  ')}  +${names.length - maxItems} more`;
}

export function matchesOrderSearch(o: AnyOrder, token: number | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // token without # / padding, e.g. "7", "07", "#07"
  const tokenStr = token ? String(token) : '';
  const tokenPadded = token ? String(token).padStart(2, '0') : '';
  if (tokenStr && (q === tokenStr || q === `#${tokenStr}` || q === `#${tokenPadded}` || q.replace('#', '') === tokenPadded)) return true;
  if (getItemsSummary(o, 99).toLowerCase().includes(q)) return true;
  if (getPaymentMethod(o).toLowerCase().includes(q)) return true;
  if (String(getOrderTotal(o)).includes(q)) return true;
  if (q === 'voided' && o.status === 'VOIDED') return true;
  if (q === 'completed' && o.status !== 'VOIDED') return true;
  return false;
}
