import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersRepository } from '../../../db/repositories/ordersRepository';
import { Loader2, Search, Clock, CheckCircle, XCircle, ShoppingBag, BarChart3, Banknote, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatMoney } from '../../../utils/format';
import { Order } from '../../../types';


export function DesktopOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersRepository.getOrders(200)
  });

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  if (isLoading) {
     return <div className="w-full h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary opacity-50" size={48}/></div>;
  }

  const nowMs = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Categorize orders by time
  const filtered = orders.filter(o => {
    // 1. Text Search Filter
    const inv = (o as any).invoice_number || (o as any).invoiceNumber || o.id || '';
    const matchesSearch = search === '' || 
      inv.toLowerCase().includes(search.toLowerCase()) ||
      (search.toLowerCase() === 'voided' && o.status === 'VOIDED') ||
      (search.toLowerCase() === 'upi' && ((o as any).payment_method === 'UPI' || (o as any).paymentMethod === 'UPI')) ||
      (search.toLowerCase() === 'cash' && ((o as any).payment_method === 'CASH' || (o as any).paymentMethod === 'CASH'));
      
    if (!matchesSearch) return false;

    return matchesSearch;
  });

  const totalSales = filtered.reduce((sum, o) => {
     if (o.status === 'VOIDED') return sum;
     return sum + ((o as any).total ?? (o as any).grandTotal ?? 0);
  }, 0);



  return (
    <div className="flex flex-col gap-6 pt-4 h-[calc(100vh-220px)] animate-in fade-in duration-500">
      {/* 1. HEADER ROW */}
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
              placeholder="Search invoice number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-card/60 backdrop-blur-md border border-border/80 focus:ring-2 focus:ring-primary text-sm font-bold transition-all shadow-sm outline-none placeholder:font-medium"
            />
          </div>
          

        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full px-1 flex flex-col gap-5 pb-12 scroll-smooth">
      
         {/* 2. STATS BANNER */}
         <div className="w-full flex-none bg-[#1F1710] dark:bg-[#1E1915] border border-border/60 rounded-3xl p-6 px-10 flex items-center justify-start gap-12 overflow-hidden relative shadow-sm">
           {/* Graphic Background element */}
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

         {/* 3. ORDERS GRID */}
         {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4 opacity-70">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="text-lg font-bold">No orders found.</p>
            </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 auto-rows-max">
             {filtered.map((order, idx) => {
               const items = (order as any).items || [];
               const itemsStr = items.map((i: any) => `${i.quantity}x ${i.name_snapshot || i.name}`).join(', ');
               const totalAmount = (order as any).total ?? (order as any).grandTotal ?? 0;
               const d = (order as any).created_at || (order as any).createdAt ? new Date((order as any).created_at || (order as any).createdAt) : new Date();
               
               const isVoid = order.status === 'VOIDED';
               
               return (
                 <div key={order.id || idx} className="bg-card dark:bg-[#1A1A1A] border border-border/80 dark:border-white/5 rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:border-primary/30 transition-colors">
                   
                   {/* Card Top Row */}
                   <div className="flex items-start justify-between w-full">
                     <div className="flex items-start gap-4">
                       <div className="w-[72px] h-[72px] bg-background dark:bg-black/40 rounded-[20px] flex items-center justify-center border border-border/50 text-muted-foreground shadow-inner overflow-hidden">
                          {/* If items array has an image, render it. We don't have it in scope, so fallback gracefully */}
                          <ShoppingBag size={28} className="opacity-40" strokeWidth={1.5} />
                       </div>
                       
                       <div className="flex flex-col gap-1 pt-1">
                        <strong className="text-xl font-black tracking-tight text-foreground uppercase">
                             #{((order as any).invoice_number || (order as any).invoiceNumber || 'UNKN').replace('INV-', '')}
                          </strong>
                          <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                             <Clock size={12} className="opacity-60"/>
                             {format(d, 'h:mm a')} • {format(d, 'dd MMM yyyy')}
                          </span>
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-end pt-1 cursor-pointer">
                        <strong className={`flex items-center gap-1 text-2xl font-black tracking-tighter tabular-nums ${isVoid ? 'line-through text-muted-foreground' : 'text-[#EFA773]'}`}>
                          {formatMoney(totalAmount)}
                          <ArrowRight size={18} className="opacity-40 translate-y-[2px]" />
                        </strong>
                        <span className="text-xs font-bold text-muted-foreground">
                          {items.reduce((s: number, i: any) => s + (Number(i.quantity)||1), 0)} items
                        </span>
                     </div>
                   </div>

                   {/* Items Pill */}
                   <div className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 py-2.5">
                     <p className="text-xs font-bold text-foreground opacity-80 truncate">
                        {itemsStr || 'Synced item data missing'}
                     </p>
                   </div>

                   {/* Card Bottom Actions Row */}
                   <div className="flex items-center justify-between w-full pt-1">
                     <span className={`inline-flex items-center gap-1.5 font-black uppercase text-[11px] tracking-widest ${
                         ((order as any).payment_method || (order as any).paymentMethod) === 'UPI' ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-[#EFA773]'
                     }`}>
                       {((order as any).payment_method || (order as any).paymentMethod) === 'UPI' ? <Sparkles size={16} strokeWidth={2.5}/> : <Banknote size={16} strokeWidth={2.5}/>}
                       {((order as any).payment_method || (order as any).paymentMethod) || 'UNKNOWN'}
                     </span>
                     
                     <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all">
                           <Trash2 size={15} strokeWidth={2.5} />
                        </button>
                        
                        {isVoid ? (
                          <div className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-black uppercase tracking-widest">
                            <XCircle size={14} strokeWidth={2.5} />
                            VOIDED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-500 text-[11px] font-black uppercase tracking-widest">
                            <CheckCircle size={14} strokeWidth={2.5} />
                            COMPLETED
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setSelectedOrder(order as any)}
                          className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-black/5 border border-black/10 dark:bg-white/5 dark:border-white/10 hover:bg-foreground hover:text-background transition-colors text-foreground text-[11px] font-black uppercase tracking-widest"
                        >
                          View Order <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                     </div>
                   </div>

                 </div>
               )
             })}
           </div>
         )}
      </div>

      {/* 4. VIEW ORDER MODAL */}
      {selectedOrder && (
         <DesktopViewOrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function DesktopViewOrderModal({ order, onClose }: { order: Order, onClose: () => void }) {
  const items = (order as any).items || [];
  const createdAtRaw = (order as any).created_at || (order as any).createdAt;
  const d = createdAtRaw ? new Date(createdAtRaw) : new Date();
  const isVoid = order.status === 'VOIDED';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div 
        className="relative flex flex-col w-[500px] max-h-[85vh] bg-[#F2F0ED] dark:bg-[#0C0A09] rounded-3xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-border/40 bg-card/50">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
               #{ ((order as any).invoice_number || (order as any).invoiceNumber || '').replace('INV-', '') }
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
        
        {/* Items List */}
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

        {/* Footer Summary */}
        <div className="p-8 pb-10 bg-card border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="flex items-center justify-between mb-4 text-sm font-bold text-muted-foreground">
             <span>Payment Method</span>
             <span className="uppercase text-foreground">{((order as any).payment_method || (order as any).paymentMethod) || 'UNKNOWN'}</span>
           </div>
           
           <div className="flex items-center justify-between mb-2 text-sm font-bold text-muted-foreground">
             <span>Subtotal</span>
             <span className="tabular-nums font-black">{formatMoney(order.subtotal ?? 0)}</span>
           </div>
           
           <div className="flex items-center justify-between pt-4 border-t border-border/60">
             <span className="text-base font-black uppercase tracking-wider text-muted-foreground">Total</span>
             <strong className={`text-3xl font-black tabular-nums tracking-tighter ${isVoid ? 'text-destructive line-through opacity-70' : 'text-[#EFA773]'}`}>
               {formatMoney((order as any).total ?? (order as any).grandTotal ?? 0)}
             </strong>
           </div>
           
           {isVoid && (
             <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-center text-xs font-black uppercase border border-destructive/20">
                This transaction has been voided.
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

