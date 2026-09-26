import React, { useState, useMemo } from 'react';
import { Loader2, Search, Clock, CheckCircle, XCircle, ShoppingBag, BarChart3, Banknote, Sparkles, Trash2, ArrowRight, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatMoney } from '../../../utils/format';
import { Order } from '../../../types';
import { useOrders } from '../../../hooks/useOrders';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ordersRepository } from '../../../db/repositories/ordersRepository';
import {
  buildDailyTokenMap,
  formatToken,
  getItemCount,
  getItemsSummary,
  getOrderTotal,
  getPaymentMethod,
  matchesOrderSearch,
  orderDayKey,
} from '../../../utils/orderDisplay';

export function DesktopOrders() {
  const queryClient = useQueryClient();
  const ordersQuery = useOrders();
  const rawData = ordersQuery.data;
  const orders = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (rawData && Array.isArray((rawData as any)?.orders)) return (rawData as any).orders;
    return [];
  }, [rawData]);
  const isLoading = ordersQuery.isLoading;

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
      if (pin !== '2110') throw new Error('Invalid PIN');
      await ordersRepository.voidOrder(id, 'Admin voided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert('Transaction successfully archived and voided.');
      setSelectedOrder(null);
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

  const tokenMap = useMemo(() => buildDailyTokenMap(orders as any), [orders]);

  const selectedToken = useMemo(() => {
    if (!selectedOrder) return undefined;
    const id = String((selectedOrder as any).id || (selectedOrder as any)._id || '');
    return tokenMap.get(id);
  }, [selectedOrder, tokenMap]);

  if (isLoading) {
     return <div className="w-full h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary opacity-50" size={48}/></div>;
  }

  const filtered = (orders || [])
    .filter((o: any) => {
      if (!o) return false;
      const id = String(o.id || o._id || '');
      return matchesOrderSearch(o, tokenMap.get(id), search);
    })
    .sort((a: any, b: any) => {
      const ta = new Date(a.created_at || a.createdAt || 0).getTime();
      const tb = new Date(b.created_at || b.createdAt || 0).getTime();
      return tb - ta;
    });

  const totalSales = filtered.reduce((sum: number, o: any) => {
    try {
      if (!o || o.status === 'VOIDED') return sum;
      return sum + getOrderTotal(o);
    } catch (err) {
      return sum;
    }
  }, 0);

  return (
    <div className="flex flex-col gap-6 pt-4 h-[calc(100vh-220px)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Orders</h1>
          <p className="text-muted-foreground font-semibold mt-1">View and manage all your café orders</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search order no. or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card/60 backdrop-blur-md border border-border/80 focus:ring-2 focus:ring-primary text-sm font-bold transition-all shadow-sm outline-none placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-1 flex flex-col gap-5 pb-12 scroll-smooth">

          <div className="w-full flex-none bg-[#1F1710] dark:bg-[#1E1915] border border-border/60 rounded-3xl p-6 px-10 flex items-center justify-start gap-12 overflow-hidden relative shadow-sm">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 min-w-[300px] pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1F1710] dark:from-[#1E1915] to-transparent z-10" />
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background/5 to-transparent flex items-center justify-end pr-10">
                <span className="text-3xl font-script tracking-widest text-primary/30 rotate-[-10deg] italic opacity-60">
                  Good Food<br/><span className="pl-6">Better Mood</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 z-10 w-[240px]">
              <div className="w-16 h-16 rounded-[20px] bg-black/40 border border-white/5 flex items-center justify-center text-[#EFA773] shadow-inner">
                <ShoppingBag size={26} strokeWidth={2.5}/>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/50">Total Orders</span>
                <strong className="text-3xl font-black text-white/90 tabular-nums tracking-tight leading-tight">{filtered.length}</strong>
                <span className="text-xs font-semibold text-white/40">All Time</span>
              </div>
            </div>

            <div className="w-[1px] h-12 bg-white/10 z-10" />

            <div className="flex items-center gap-5 z-10 w-[300px]">
              <div className="w-16 h-16 rounded-[20px] bg-black/40 border border-white/5 flex items-center justify-center text-[#EFA773] shadow-inner">
                <BarChart3 size={26} strokeWidth={2.5}/>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/50">Total Sales</span>
                <strong className="text-3xl font-black text-[#EFA773] tabular-nums tracking-tighter leading-tight">
                  {formatMoney(totalSales)}
                </strong>
                <span className="text-xs font-semibold text-white/40">All Time</span>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4 opacity-70">
               <ShoppingBag size={64} strokeWidth={1} />
               <p className="text-lg font-bold">No orders found.</p>
             </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="hidden md:grid grid-cols-[64px_1fr_130px_120px_44px] items-center gap-4 px-5 pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
                <span>Order</span>
                <span>Items</span>
                <span className="text-right">Total</span>
                <span className="text-right">Status</span>
                <span />
              </div>
              {filtered.map((order: any, idx: number) => {
                const id = String(order?.id || order?._id || idx);
                const token = tokenMap.get(id);
                const method = getPaymentMethod(order);
                const totalAmount = getOrderTotal(order);
                const count = getItemCount(order);
                 const dRaw = (order as any).created_at || (order as any).createdAt;
                 let d = dRaw ? new Date(dRaw) : new Date();
                 if (isNaN(d.getTime())) d = new Date();
                 const dayLabel = orderDayKey(d.toISOString()) === orderDayKey(new Date().toISOString())
                   ? `Today · ${format(d, 'h:mm a')}`
                   : `${format(d, 'dd MMM')} · ${format(d, 'h:mm a')}`;

                 const isVoid = order?.status === 'VOIDED';

                 return (
                  <div
                    key={id}
                    onClick={() => setSelectedOrder(order as any)}
                    className={`group grid grid-cols-[64px_1fr_auto] md:grid-cols-[64px_1fr_130px_120px_44px] items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 rounded-2xl border bg-card dark:bg-[#1A1A1A] border-border/80 dark:border-white/5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer ${isVoid ? 'opacity-60' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl grid place-items-center text-[15px] font-black tabular-nums ${isVoid ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {formatToken(token)}
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <strong className="text-[15px] font-extrabold tracking-tight truncate">
                          Order {formatToken(token)}
                        </strong>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${method === 'UPI' ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-[#EFA773]'}`}>
                          {method === 'UPI' ? <Sparkles size={12} strokeWidth={2.5}/> : <Banknote size={12} strokeWidth={2.5}/>}
                          {method}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-muted-foreground truncate">
                        {getItemsSummary(order, 3)}
                      </p>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80">
                        <Clock size={11} className="opacity-60" />
                        {dayLabel} · {count} item{count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex md:contents items-center gap-2 justify-end">
                      <strong className={`text-lg md:text-xl font-black tabular-nums tracking-tight md:text-right ${isVoid ? 'line-through text-muted-foreground' : ''}`}>
                        {formatMoney(totalAmount)}
                      </strong>
                      <div className="hidden md:flex justify-end">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest">
                            <XCircle size={13} strokeWidth={2.5} /> Voided
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-500 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={13} strokeWidth={2.5} /> Paid
                          </span>
                        )}
                      </div>
                      <div className="hidden md:flex justify-end">
                        <span className="w-9 h-9 rounded-full grid place-items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                          <ChevronRight size={16} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>

                    <div className="md:hidden col-span-3 flex items-center justify-between pt-1">
                      {isVoid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                          <XCircle size={12} strokeWidth={2.5} /> Voided
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-green-500/10 text-green-700 dark:text-green-500 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle size={12} strokeWidth={2.5} /> Paid
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        View <ArrowRight size={13} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
       </div>

       {selectedOrder && (
          <DesktopViewOrderModal order={selectedOrder} token={selectedToken} onClose={() => setSelectedOrder(null)} onDelete={handleDelete} />
       )}
     </div>
   );
 }

function DesktopViewOrderModal({ order, token, onClose, onDelete }: { order: Order, token?: number, onClose: () => void, onDelete: (e: React.MouseEvent, id: string) => void }) {
  const items = (order as any)?.items || [];
  const createdAtRaw = (order as any)?.created_at || (order as any)?.createdAt;
  let d = createdAtRaw ? new Date(createdAtRaw) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const isVoid = order?.status === 'VOIDED';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div
        className="relative flex flex-col w-[500px] max-h-[85vh] bg-[#F2F0ED] dark:bg-[#0C0A09] rounded-3xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-border/40 bg-card/50">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-black text-foreground tracking-tight">
               Order {formatToken(token)}
             </h2>
             <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Clock size={12} className="opacity-70" />
                {format(d, 'hh:mm a • dd MMM yyyy')}
             </span>
          </div>
          <button className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:scale-105 active:scale-95 transition-transform" onClick={onClose}>
             <XCircle size={20} className="text-foreground" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 bg-background">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pl-1">
             Order Items
          </div>
          <div className="flex flex-col gap-3">
             {items.map((item: any, i: number) => (
                <div key={i} className="flex flex-col p-4 bg-card border border-border/60 rounded-2xl">
                   <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-sm">
                           {item.quantity}x
                        </div>
                        <strong className="text-sm font-black">{item.name_snapshot || item.name}</strong>
                     </div>
                     <strong className="text-sm border border-border/50 bg-background px-3 py-1 rounded-full tabular-nums opacity-90 font-bold">
                        {formatMoney(item.line_total ?? item.total ?? (item.quantity * (item.unitPrice || 0)))}
                     </strong>
                   </div>
                </div>
             ))}
             {items.length === 0 && (
                <div className="text-sm font-bold text-muted-foreground opacity-60 text-center py-4">Item data not synced properly.</div>
             )}
          </div>
        </div>

        <div className="p-8 pb-10 bg-card border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="flex items-center justify-between mb-4 text-sm font-bold text-muted-foreground">
             <span>Payment Method</span>
             <span className="uppercase text-foreground">{getPaymentMethod(order as any)}</span>
           </div>

           <div className="flex items-center justify-between mb-2 text-sm font-bold text-muted-foreground">
             <span>Subtotal</span>
             <span className="tabular-nums font-black">{formatMoney(order.subtotal ?? 0)}</span>
           </div>

           <div className="flex items-center justify-between pt-4 border-t border-border/60">
             <span className="text-base font-black uppercase tracking-wider text-muted-foreground">Total</span>
             <strong className={`text-3xl font-black tabular-nums tracking-tighter ${isVoid ? 'text-destructive line-through opacity-70' : 'text-[#EFA773]'}`}>
               {formatMoney(getOrderTotal(order as any))}
             </strong>
           </div>

           {isVoid ? (
             <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-center text-xs font-black uppercase border border-destructive/20">
                This transaction has been voided.
             </div>
           ) : (
             <button
               onClick={(e) => onDelete(e, String(order.id || (order as any)._id))}
               className="mt-4 w-full py-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-destructive/20"
             >
               <Trash2 size={16} strokeWidth={2.5} /> Void & Delete Transaction
             </button>
           )}
        </div>
      </div>
    </div>
  )
}
