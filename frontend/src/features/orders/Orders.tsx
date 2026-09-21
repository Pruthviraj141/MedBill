import { useMemo, useState } from 'react';
import { Clock3, Search, CreditCard, Banknote, Sparkles, Receipt, CheckCircle2, Trash2 } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useOrders } from '../../hooks/useOrders';
import { ordersRepository } from '../../db/repositories/ordersRepository';
import { StateView } from '../../components/ui/StateView';
import { formatMoney, formatTime } from '../../utils/format';

const periods = ['today', 'yesterday', 'earlier'] as const;

export function Orders() {
  const queryClient = useQueryClient();
  const ordersQuery = useOrders();
  const [period, setPeriod] = useState<(typeof periods)[number]>('today');
  const [search, setSearch] = useState('');

  const deleteMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string, pin: string }) => {
      // In this local-first version, PIN is passed in and if valid we void in SQLite
      if (pin !== '2110') throw new Error('Invalid PIN');
      await ordersRepository.voidOrder(id, 'Admin voided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    return allOrders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      const matchesPeriod =
        period === 'today' ? orderTime >= today :
          period === 'yesterday' ? (orderTime >= yesterday && orderTime < today) :
            orderTime < yesterday;

      if (!matchesPeriod) return false;
      if (!search) return true;

      const q = search.toLowerCase();
      const invoice = String(order.id || order._id || '').toLowerCase();
      return invoice.includes(q);
    });
  }, [allOrders, period, search]);

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.grandTotal, 0);

  return (
    <div className="page bl-page" style={{ paddingBottom: 100 }}>
      {/* ── Search & Filter ────────────────────────────────────────────── */}
      <div className="bl-search-wrap" style={{ marginTop: 10 }}>
        <Search size={18} className="bl-search-ico" />
        <input
          className="bl-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoice number..."
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

      <div className="metric-pair" style={{ marginBottom: 16 }}>
        <div className="metric-card" style={{ gridTemplateColumns: '1fr', padding: '12px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--bl-muted)', fontWeight: 800 }}>ORDERS</span>
          <strong style={{ fontSize: 22, color: 'var(--bl-ink)' }}>{filteredOrders.length}</strong>
        </div>
        <div className="metric-card" style={{ gridTemplateColumns: '1fr', padding: '12px 14px' }}>
          <span style={{ fontSize: 12, color: 'var(--bl-muted)', fontWeight: 800 }}>SALES</span>
          <strong style={{ fontSize: 22, color: 'var(--bl-accent)' }}>{formatMoney(totalSales)}</strong>
        </div>
      </div>

      {/* ── Order List ─────────────────────────────────────────────────── */}
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
        <div className="order-list" style={{ display: 'grid', gap: 10 }}>
          {filteredOrders.map((order) => {
            const invoice = String(order.id || order._id || '').slice(-6).toUpperCase();
            const itemCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);

            const isVoided = order.status === 'VOIDED';

            return (
              <div
                key={order.id || order._id}
                className="bl-card"
                style={{ padding: '14px 16px', cursor: 'pointer', opacity: isVoided ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: isVoided ? '#d9534f' : 'var(--bl-ink)', textDecoration: isVoided ? 'line-through' : 'none' }}>
                      #{invoice}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bl-muted)', fontSize: 12 }}>
                      <Clock3 size={13} /> {formatTime(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--bl-accent)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(order.grandTotal)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--bl-muted)', fontWeight: 700 }}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--bl-brown-lt)', borderRadius: 10, marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--bl-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--bl-ink)' }}>
                    {order.paymentMethod === 'UPI' ? <Sparkles size={14} style={{ color: '#7656b8' }} /> :
                      order.paymentMethod === 'CASH' ? <Banknote size={14} style={{ color: '#b77a2f' }} /> :
                        <CreditCard size={14} />}
                    {order.paymentMethod}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isVoided && (
                      <button
                        onClick={(e) => handleDelete(e, order.id || order._id)}
                        className="flex items-center justify-center p-1.5 rounded-full bg-red-100 text-red-600 active:scale-95 transition-transform disabled:opacity-50"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: isVoided ? '#f8d7da' : '#e4f1e7', color: isVoided ? '#721c24' : '#2c7548', fontSize: 11, fontWeight: 900 }}>
                      {isVoided ? null : <CheckCircle2 size={12} />} {order.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
