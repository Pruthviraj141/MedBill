import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../../hooks/useDashboard';
import { useOrders } from '../../../hooks/useOrders';
import { Loader2, TrendingUp, ShoppingBag, Clock, CreditCard, Banknote, Coffee, ArrowRight, BarChart3, Receipt, Sparkles, RefreshCw, X } from 'lucide-react';
import { formatMoney, formatTime } from '../../../utils/format';
import { getDensePeakHours, getDenseWeekdays, getValidPaymentsData, getDonutGradient, getTopProducts } from '../../../utils/dashboardUtils';

const periods = ['today', 'week', 'month'] as const;

export function DesktopDashboard({ onGo }: { onGo: (v: string) => void }) {
  const [period, setPeriod] = useState<(typeof periods)[number]>('today');
  const [activePeakHour, setActivePeakHour] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [topProductsOpen, setTopProductsOpen] = useState(false);

  // Exclusively using existing hooks per Rule 1
  const reportQuery = useDashboard(period);
  const ordersQuery = useOrders();

  const report = reportQuery.data;
  const orders = ordersQuery.data?.orders ?? [];

  const topProducts = useMemo(() => {
    return getTopProducts(orders, report?.topProducts ?? [], period);
  }, [orders, report?.topProducts, period]);

  if (reportQuery.isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  // ZERO DUPLICATION: Re-using exact pure functions from the refactored dashboardUtils.ts
  const rawPeakHours = report?.peakHours ?? [];
  const densePeakHours = getDensePeakHours(rawPeakHours);

  const rawWeekdays = report?.weekdayPattern ?? [];
  const denseWeekdays = getDenseWeekdays(rawWeekdays);
  
  const allPayments = report?.paymentBreakdown ?? [];
  const { validPaymentsTotal, upiPct, cashPct } = getValidPaymentsData(allPayments);

  const maxHourOrders = Math.max(...densePeakHours.map(h => h.orders), 1);
  const maxWeekdayRevenue = Math.max(...denseWeekdays.map(d => d.revenue), 1);

  // Dynamic metrics for the Hero card
  const revenue = report?.revenue ?? 0;
  const numOrders = report?.orders ?? 0;
  const avgBill = report?.averageBill ?? 0;

  // Peak Hour logic with interactive hover state mapping
  const globalPeak = rawPeakHours.length > 0 ? rawPeakHours.reduce((prev: any, current: any) => (prev.orders > current.orders) ? prev : current) : null;
  const peak = activePeakHour !== null ? densePeakHours.find(h => h.hour === activePeakHour) : globalPeak;
  const peakHourStr = peak ? `${peak.hour > 12 ? peak.hour-12 : (peak.hour===0?12:peak.hour)} ${peak.hour >= 12 ? 'PM' : 'AM'}` : '--';

  const donutGradient = getDonutGradient(validPaymentsTotal, upiPct, cashPct);

  return (
    <div className="flex flex-col gap-6 pt-4 h-[calc(100vh-220px)] overflow-y-auto no-scrollbar font-sans tracking-tight" onClick={() => setActivePeakHour(null)}>
      
      {/* 
        HEADER & PERIOD FILTERS
        Aligned horizontally for desktop width 
      */}
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground font-semibold mt-1 flex items-center gap-2">
            Business Performance
            <button 
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full active:scale-95 transition-all text-muted-foreground" 
              onClick={async (e) => {
                 e.stopPropagation();
                 setIsRefreshing(true);
                 await Promise.all([reportQuery.refetch(), ordersQuery.refetch()]);
                 setTimeout(() => setIsRefreshing(false), 400);
              }}
            >
              <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin text-primary' : ''}`} strokeWidth={3} />
            </button>
          </p>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-1.5 bg-[#171615] dark:bg-[#131313] p-1.5 rounded-full border border-[#2B2B2B] shadow-sm relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
             {periods.map((item) => (
               <button 
                 key={item} 
                 className={`flex items-center justify-center h-[36px] px-6 rounded-full text-[13px] font-bold transition-all active:scale-[0.98] ${period === item ? 'bg-[#EAD6C0] text-[#1A1917] shadow-md' : 'bg-transparent text-white/50 hover:text-white/90 hover:bg-white/10'}`} 
                 onClick={() => setPeriod(item)}
               >
                 {item === 'today' ? 'Today' : item === 'week' ? 'Week' : 'Month'}
               </button>
             ))}
           </div>
          <button 
            onClick={() => onGo('billing')}
            className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-primary/20"
          >
            New Order <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-24">
        
        {/* =========================================
            LEFT COLUMN (Cols 0-8)
            ========================================= */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* HERO CARD (Desktop Scaled) */}
          <div className="desktop-card bg-gradient-to-br from-[#3E2009] to-[#8E4A1C] text-white p-8 relative overflow-hidden group shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="absolute right-0 top-0 h-full w-[250px] bg-gradient-to-l from-white/10 to-transparent flex items-center justify-end pr-4 pointer-events-none opacity-40">
               <span className="text-[140px] filter drop-shadow-lg brightness-75 -mt-4">☕</span>
            </div>
            <div className="relative z-10 flex gap-12 items-start">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <div className="w-[24px] h-[24px] bg-[#EAD6C0]/20 rounded flex items-center justify-center">
                    <BarChart3 size={14} className="text-[#EAD6C0]" strokeWidth={3} />
                  </div>
                  <span className="text-[12px] font-bold text-[#EAD6C0] uppercase tracking-wider">{period.toUpperCase()}'S SALES</span>
                </div>
                <h2 className="text-5xl font-black mt-1 tracking-tighter tabular-nums">
                   {formatMoney(revenue).replace(/\.00$/, '')}
                </h2>
              </div>
              
              <div className="flex gap-8 mt-2 pl-8 border-l border-white/10">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                     <ShoppingBag size={22} className="text-[#EAD6C0]" strokeWidth={2.5} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-2xl font-black text-white leading-tight tabular-nums">{numOrders}</span>
                     <span className="text-sm font-medium text-white/60">Orders</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                     <Receipt size={22} className="text-[#EAD6C0]" strokeWidth={2.5} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-2xl font-black text-white leading-tight tabular-nums">{formatMoney(avgBill).replace(/\.00$/, '')}</span>
                     <span className="text-sm font-medium text-white/60">Avg. Bill</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* HISTOGRAM CHART */}
          <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/80 px-8 py-6 shadow-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-primary dark:text-[#EAD6C0]" />
                <h3 className="text-lg font-bold text-foreground">Activity Timeline</h3>
              </div>
            </div>

            <div className="relative flex flex-col w-full h-[220px] pt-4 border-b border-border/40">
               {/* Grid lines overlay */}
               <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 pointer-events-none z-0">
                 <div className="w-full border-t border-border/40 border-dashed" />
                 <div className="w-full border-t border-border/40 border-dashed" />
                 <div className="w-full border-t border-border/40 border-dashed" />
                 <div className="w-full border-t border-border/40 border-dashed" />
               </div>
               
               <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1 px-2 text-xs font-bold text-muted-foreground z-10 w-16">
                 <span>Max</span>
                 <span>Avg</span>
                 <span>Low</span>
                 <span>0</span>
               </div>

               <div className="relative z-10 flex items-end justify-between ml-[72px] h-full px-2 gap-3">
                 {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => {
                    const max = period === 'today' ? maxHourOrders : maxWeekdayRevenue;
                    const val = period === 'today' ? pt.orders : pt.revenue;
                    const h = Math.max(2, (val / max) * 100);
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#2C1809] dark:bg-[#C9956A] rounded-t-md hover:opacity-80 transition-all duration-700 ease-out cursor-pointer relative group" 
                        style={{ height: `${h}%` }}
                      >
                         {/* Desktop Hover Tooltip */}
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold py-1 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {val} {period === 'today' ? 'orders' : 'divrs'}
                         </div>
                      </div>
                    );
                 })}
               </div>
            </div>
            
            <div className="flex items-center justify-between ml-[72px] px-2 h-8 mt-2 text-xs font-bold text-muted-foreground relative">
              {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => (
                   <div key={i} className="flex-1 flex justify-center relative h-full pt-2">
                     <span className="whitespace-nowrap text-center">
                       {period === 'today' 
                         ? (pt.hour % 2 === 0 ? `${pt.hour > 12 ? pt.hour-12 : (pt.hour===0?12:pt.hour)}${pt.hour >= 12 ? 'PM' : 'AM'}` : '') 
                         : pt.day.slice(0,3)}
                     </span>
                   </div>
              ))}
            </div>
          </div>

           {/* TOP PRODUCTS DESKTOP */}
           <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/80 px-8 py-6 shadow-sm cursor-pointer hover:border-primary/40 transition-all hover:scale-[1.01] active:scale-[0.99]" onClick={(e) => { e.stopPropagation(); setTopProductsOpen(true); }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp size={20} className="text-primary dark:text-[#EAD6C0]" />
                  <h3 className="text-lg font-bold text-foreground">Top Products</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                 {topProducts.length === 0 ? (
                   <div className="col-span-full py-8 text-center text-muted-foreground font-bold">No product activity documented within this frame.</div>
                 ) : topProducts.slice(0, 5).map((prod: any, i: number) => (
                   <div key={i} className="flex flex-col items-start gap-3 p-4 bg-background dark:bg-black/20 border border-border/50 rounded-2xl shadow-sm hover:scale-[1.02] transition-transform">
                     <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black text-muted-foreground">{String(i+1).padStart(2, '0')}</span>
                        <div className="w-8 h-8 flex-none bg-muted rounded-full flex items-center justify-center text-xs shadow-sm">☕</div>
                     </div>
                     <span className="text-sm font-bold text-foreground line-clamp-2 min-h-[40px]">{prod.name}</span>
                     <div className="border-t border-border/50 w-full pt-3 mt-auto flex items-center justify-between">
                       <span className="text-xs font-medium text-muted-foreground tracking-wide">{prod.sold} sold</span>
                       <strong className="text-sm text-foreground tracking-tight tabular-nums">₹{prod.revenue?.toLocaleString() || 0}</strong>
                     </div>
                   </div>
                 ))}
              </div>
           </div>

        </div>


        {/* =========================================
            RIGHT COLUMN (Cols 8-12)
            ========================================= */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* PEAK HOUR MINI-CARD */}
          <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/80 p-6 shadow-sm cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary dark:text-[#EAD6C0]" />
                <h3 className="text-sm font-bold text-foreground">Peak Hour</h3>
              </div>
            </div>
            <strong className="text-3xl font-black text-foreground mb-1 leading-none transition-all">{peakHourStr}</strong>
            <span className="text-sm font-semibold text-muted-foreground transition-all block mt-1">{peak?.orders || 0} orders</span>
            
            <div className="relative flex items-end justify-between h-[60px] mt-6 gap-1 opacity-90 z-20" onMouseLeave={() => setActivePeakHour(null)}>
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 z-0">
                 <div className="w-full border-t border-border/80 dark:border-white/20 border-dashed" />
                 <div className="w-full border-t border-border/80 dark:border-white/20 border-dashed" />
               </div>
               {densePeakHours.slice(-12).map((h: any, i: number) => (
                 <div 
                   key={i} 
                   onMouseEnter={() => setActivePeakHour(h.hour)}
                   onClick={(e) => { e.stopPropagation(); setActivePeakHour(h.hour); }}
                   className={`relative z-10 flex-1 rounded-t border-b-0 cursor-pointer transition-all ${((activePeakHour !== null ? h.hour === activePeakHour : h.orders === globalPeak?.orders) && (h.orders ?? 0) > 0) ? 'bg-[#110904] dark:bg-[#EAD6C0] scale-105' : 'bg-[#3E2009] dark:bg-white/20 hover:bg-[#2C1809]'}`} 
                   style={{ height: `${Math.max(10, (h.orders / maxHourOrders) * 100)}%` }} 
                 />
               ))}
            </div>
          </div>

          {/* PAYMENT MIX CARD */}
          <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/80 p-6 shadow-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard size={18} className="text-primary dark:text-[#EAD6C0]" />
                <h3 className="text-sm font-bold text-foreground">Payment Mix</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* CSS Donut Chart */}
              <div 
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center shadow-lg relative flex-none"
                style={{ background: donutGradient }}
              >
                <div className="w-[70px] h-[70px] bg-card rounded-full absolute flex flex-col items-center justify-center leading-none">
                  <span className="text-[13px] font-black text-foreground tabular-nums tracking-tighter">
                     {formatMoney(validPaymentsTotal).replace('₹ ', '₹')}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 px-2 border-l border-border/50">
                <div className="flex items-center justify-between gap-2 text-xs font-bold bg-background/50 p-2 rounded-lg">
                  <span className="flex items-center gap-2 uppercase tracking-wide"><div className="w-2.5 h-2.5 rounded-full bg-[#EAD6C0]" /> UPI</span>
                  <span className="text-foreground">{upiPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs font-bold bg-background/50 p-2 rounded-lg">
                  <span className="flex items-center gap-2 uppercase tracking-wide"><div className="w-2.5 h-2.5 rounded-full bg-[#8A5A33]" /> Cash</span>
                  <span className="text-foreground">{cashPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ORDERS COMPACT LIST */}
          <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/80 p-6 flex-1 flex flex-col shadow-sm cursor-pointer hover:border-primary/30 transition-colors" onClick={() => onGo('orders')}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt size={18} className="text-primary dark:text-[#EAD6C0]" />
                <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
              </div>
              <ArrowRight size={16} className="opacity-50" />
            </div>
            
            <div className="flex flex-col gap-3 flex-1 overflow-hidden pointer-events-none">
              {orders.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-sm text-muted-foreground font-bold">No orders found</div>
               ) : orders.slice(0, 5).map((order: any) => (
                <div className="flex flex-col gap-2 p-3 bg-background/50 dark:bg-black/10 rounded-xl border border-border/40" key={order.id || order._id}>
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black text-foreground tracking-tight uppercase">#{String(order.id || order._id).slice(-6)}</strong>
                    <div className="bg-[#24412B]/90 text-[#7BB88C] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      {order.status || 'Completed'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/40">
                     <span className="text-xs font-medium text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                     <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-muted-foreground opacity-70">{formatTime(order.createdAt)}</span>
                       <strong className="text-sm font-black tabular-nums tracking-tighter">{formatMoney(order.grandTotal)}</strong>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Desktop Modal for Top Products */}
      {topProductsOpen && (
         <DesktopTopProductsModal onClose={() => setTopProductsOpen(false)} currentPeriod={period} />
      )}
    </div>
  );
}

function DesktopTopProductsModal({ onClose, currentPeriod }: { onClose: () => void, currentPeriod: string }) {
  const modalPeriods = ['today', 'week', 'month', 'all'] as const;
  const [modalPeriod, setModalPeriod] = useState<(typeof modalPeriods)[number]>(currentPeriod as any);
  
  const { data, isLoading } = useDashboard(modalPeriod);
  const products = data?.topProducts || [];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div 
        className="relative flex flex-col w-[600px] max-h-[80vh] bg-[#F2F0ED] dark:bg-[#0C0A09] rounded-3xl overflow-hidden shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
             <TrendingUp className="text-primary dark:text-[#EAD6C0]" size={24} />
             <h2 className="text-2xl font-black text-foreground tracking-tight">Top Products</h2>
          </div>
          <button className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:scale-105 active:scale-95 transition-transform" onClick={onClose}>
             <X size={20} className="text-foreground" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Modal Toggles */}
        <div className="flex flex-col px-8 py-5 border-b border-border/40 bg-card">
           <div className="flex items-center w-full p-1 bg-background rounded-xl border border-border overflow-hidden">
             {modalPeriods.map(item => (
               <button 
                 key={item} 
                 className={`flex-1 h-10 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${modalPeriod === item ? 'bg-[#2C1809] text-white dark:bg-[#EAD6C0] dark:text-[#1A1917] shadow-sm' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`} 
                 onClick={() => setModalPeriod(item)}
               >
                 {item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'All Time'}
               </button>
             ))}
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3 bg-background group">
          {isLoading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="w-full h-16 rounded-xl bg-card animate-pulse border border-border/50" />
             ))
          ) : products.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-muted-foreground font-bold">No product activity documented within this frame.</div>
          ) : products.map((prod: any, i: number) => (
             <div key={prod.name} className="flex items-center justify-between p-4 px-5 bg-card border border-border/70 rounded-xl shadow-sm hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-background text-muted-foreground flex items-center justify-center text-sm font-black border border-border shadow-sm">{String(i+1).padStart(2, '0')}</div>
                   <div className="flex flex-col">
                      <strong className="text-base font-black text-foreground">{prod.name}</strong>
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <ShoppingBag size={12} className="opacity-70"/> {prod.sold} units sold
                      </span>
                   </div>
                </div>
                <strong className="text-lg font-black tracking-tighter tabular-nums text-foreground">
                   {formatMoney(prod.revenue ?? 0)}
                </strong>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
