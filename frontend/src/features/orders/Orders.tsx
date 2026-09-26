import { useMemo, useState } from 'react';
import { Clock3, Search, CreditCard, Banknote, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useOrders } from '../../hooks/useOrders';
import { ordersRepository } from '../../db/repositories/ordersRepository';
import { StateView } from '../../components/ui/StateView';
import { formatMoney, formatTime } from '../../utils/format';
import {
  buildDailyTokenMap,
  formatToken,
  getItemCount,
  getItemsSummary,
  getOrderTotal,
  getPaymentMethod,
  matchesOrderSearch,
} from '../../utils/orderDisplay';

const periods = ['today', 'yesterday', 'earlier'] as const;

function PaymentIcon({ method }: { method: string }) {
  if (method === 'UPI') return <Sparkles size={13} style={{ color: '#7656b8' }} />;
  if (method === 'CASH') return <Banknote size={13} style={{ color: '#b77a2f' }} />;
  return <CreditCard size={13} style={{ color: '#3f7894' }} />;
}

export function Orders() {
  const queryClient = useQueryClient();
  const ordersQuery = useOrders();
  const [period, setPeriod] = useState<(typeof periods)[number]>('today');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string, pin: string }) => {
      if (pin !== '2110') throw new Error('Invalid PIN');
      await ordersRepository.voidOrder(id, 'Admin voided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setExpandedId(null);
      alert('Transaction successfully archived and voided.');
    },
    onError: (e: any) => {
      alert(`Deletion failed: ${e.message}`);
    }
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const pin = window.prompt('Enter ADMIN PIN [2110] to permanently void and archive this transaction:');
    if (pin) {
      deleteMutation.mutate({ id, pin });
    }
  };

  const allOrders = ordersQuery.data?.orders ?? [];
  const tokenMap = useMemo(() => buildDailyTokenMap(allOrders as any), [allOrders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    return allOrders
      .filter((order) => {
        const orderTime = new Date(order.createdAt).getTime();
        const matchesPeriod =
          period === 'today' ? orderTime >= today :
            period === 'yesterday' ? (orderTime >= yesterday && orderTime < today) :
              orderTime < yesterday;
        if (!matchesPeriod) return false;
        const id = String(order.id || order._id || '');
        return matchesOrderSearch(order as any, tokenMap.get(id), search);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, period, search, tokenMap]);

  const totalSales = filteredOrders.reduce((sum, order) => sum + getOrderTotal(order as any), 0);

  return (
    <div className="page bl-page" style={{ paddingBottom: 100 }}>
      <div className="bl-search-wrap" style={{ marginTop: 10 }}>
        <Search size={18} className="bl-search-ico" />
        <input
          className="bl-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order no. or item…"
          aria-label="Search orders"
        />
      </div>

      <div className="bl-chips" role="tablist">
        {periods.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={period === item}
            className={`bl-chip${period === item ? ' bl-chip--on' : ''}`}
            onClick={() => setPeriod(item)}
            style={{ textTransform: 'capitalize' }}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="metric-pair" style={{ marginBottom: 12 }}>
        <div className="metric-card" style={{ gridTemplateColumns: '1fr', padding: '12px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--bl-muted)', fontWeight: 800 }}>ORDERS</span>
          <strong style={{ fontSize: 22, color: 'var(--bl-ink)' }}>{filteredOrders.length}</strong>
        </div>
        <div className="metric-card" style={{ gridTemplateColumns: '1fr', padding: '12px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--bl-muted)', fontWeight: 800 }}>SALES</span>
          <strong style={{ fontSize: 22, color: 'var(--bl-accent)' }}>{formatMoney(totalSales)}</strong>
        </div>
      </div>

      {ordersQuery.isLoading && <StateView kind="loading">Loading orders</StateView>}
      {ordersQuery.isError && <StateView kind="error" onRetry={() => ordersQuery.refetch()}>Orders could not be loaded</StateView>}

      {!ordersQuery.isLoading && !ordersQuery.isError && filteredOrders.length === 0 && (
        <div className="bl-empty" style={{ marginTop: 20 }}>
          <span className="bl-empty-ico">📋</span>
          <strong>No orders found</strong>
          <span>Try a different filter or search.</span>
        </div>
      )}

      {filteredOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredOrders.map((order) => {
            const id = String(order.id || order._id || '');
            const token = tokenMap.get(id);
            const itemCount = getItemCount(order as any);
            const method = getPaymentMethod(order as any);
            const total = getOrderTotal(order as any);
            const isVoided = order.status === 'VOIDED';
            const expanded = expandedId === id;
            const fullItems = (order.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

            return (
              <button
                key={id}
                onClick={() => setExpandedId(expanded ? null : id)}
                className="bl-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 12px',
                  opacity: isVoided ? 0.62 : 1,
                  border: expanded ? '1.5px solid var(--bl-accent)' : undefined,
                }}
              >
                <span
                  style={{
                    flex: '0 0 auto',
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: '-0.3px',
                    color: isVoided ? '#fff' : 'var(--bl-ink)',
                    background: isVoided ? '#c0594b' : 'var(--bl-brown-lt)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatToken(token)}
                </span>

                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 14, fontWeight: 800, color: 'var(--bl-ink)' }}>
                      Order {formatToken(token)}
                      <span style={{ fontWeight: 600, color: 'var(--bl-muted)', fontSize: 12 }}>
                        {'  '}· {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </span>
                    </strong>
                    <strong style={{ fontSize: 15, fontWeight: 900, color: isVoided ? 'var(--bl-muted)' : 'var(--bl-accent)', fontVariantNumeric: 'tabular-nums', textDecoration: isVoided ? 'line-through' : 'none' }}>
                      {formatMoney(total)}
                    </strong>
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--bl-ink)', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {expanded ? fullItems : getItemsSummary(order as any)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: 'var(--bl-ink)' }}>
                      <PaymentIcon method={method} />
                      {method}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--bl-muted)', fontWeight: 700 }}>
                        <Clock3 size={12} /> {formatTime(order.createdAt)}
                      </span>
                      {isVoided && (
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: '#f8d7da', color: '#721c24', fontSize: 10, fontWeight: 900 }}>
                          VOIDED
                        </span>
                      )}
                    </span>
                    {expanded && !isVoided ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDelete(e as any, id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 900, color: '#b3261e' }}
                      >
                        <Trash2 size={12} strokeWidth={2.5} /> VOID
                      </span>
                    ) : (
                      <ChevronRight size={15} style={{ color: 'var(--bl-muted)', opacity: 0.7 }} />
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
