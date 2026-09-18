import { useMemo, useState } from 'react';
import { BarChart3, Receipt, ShoppingBag, ChevronRight, Clock, CreditCard, Sparkles, TrendingUp, X, RefreshCw } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useOrders } from '../../hooks/useOrders';
import { formatMoney, formatTime } from '../../utils/format';
import { getDensePeakHours, getDenseWeekdays, getValidPaymentsData, getDonutGradient, getTopProducts } from '../../utils/dashboardUtils';

const periods = ['today', 'week', 'month'] as const;

export function Dashboard({ onGo }: { onGo: (view: string) => void }) {
  const [period, setPeriod] = useState<(typeof periods)[number]>('today');
  const [activePeakHour, setActivePeakHour] = useState<number | null>(null);
  const [topProductsOpen, setTopProductsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const reportQuery = useDashboard(period);
  const ordersQuery = useOrders();
  
  const report = reportQuery.data;
  const orders = ordersQuery.data?.orders ?? [];
  
  const rawPeakHours = report?.peakHours ?? [];
  const densePeakHours = getDensePeakHours(rawPeakHours);

  const rawWeekdays = report?.weekdayPattern ?? [];
  const denseWeekdays = getDenseWeekdays(rawWeekdays);
  
  const allPayments = report?.paymentBreakdown ?? [];
  const { validPaymentsTotal, upiPct, cashPct } = getValidPaymentsData(allPayments);

  const topProducts = useMemo(() => {
    return getTopProducts(orders, report?.topProducts ?? [], period);
  }, [orders, report?.topProducts, period]);
  
  const maxHourOrders = Math.max(...densePeakHours.map(h => h.orders), 1);
  const maxWeekdayRevenue = Math.max(...denseWeekdays.map(d => d.revenue), 1);

  // Dynamic metrics for the Hero card
  const revenue = report?.revenue ?? 0;
  const numOrders = report?.orders ?? 0;
  const avgBill = report?.averageBill ?? 0;

  // Peak Hour logic with interactive touch state mapping
  const globalPeak = rawPeakHours.length > 0 ? rawPeakHours.reduce((prev: any, current: any) => (prev.orders > current.orders) ? prev : current) : null;
  const peak = activePeakHour !== null ? densePeakHours.find(h => h.hour === activePeakHour) : globalPeak;
  const peakHourStr = peak ? `${peak.hour > 12 ? peak.hour-12 : (peak.hour===0?12:peak.hour)} ${peak.hour >= 12 ? 'PM' : 'AM'}` : '--';

  // Payment Mix Conic Gradient
  const donutGradient = getDonutGradient(validPaymentsTotal, upiPct, cashPct);

  return (
    <div className="flex flex-col w-full h-full pb-24 px-4 bg-[#F2F0ED] dark:bg-[#000000] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pt-2 font-sans tracking-tight" onClick={() => setActivePeakHour(null)}>
      
      {/* Top Main Date Filter (Matches screenshot completely) */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5 bg-[#171615] dark:bg-[#131313] p-1.5 rounded-full border border-[#2B2B2B] shadow-sm flex-1 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {periods.map((item) => (
            <button 
              key={item} 
              className={`flex-1 flex items-center justify-center h-[36px] px-3 rounded-full text-[13px] font-medium transition-all active:scale-[0.98] ${period === item ? 'bg-[#EAD6C0] text-[#1A1917] shadow-md' : 'bg-transparent text-white/50 hover:bg-white/10'}`} 
              onClick={() => setPeriod(item)}
            >
              {item === 'today' ? 'Today' : item === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
        <button 
          className="ml-3 p-[9px] bg-[#171615] dark:bg-[#131313] text-white/90 dark:text-[#EAD6C0] rounded-full border border-[#2B2B2B] active:scale-95 transition-all shadow-sm flex-none" 
          onClick={async (e) => {
             e.stopPropagation();
             setIsRefreshing(true);
             await Promise.all([reportQuery.refetch(), ordersQuery.refetch()]);
             setTimeout(() => setIsRefreshing(false), 400); // Visual spin delay
          }}
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin opacity-50 dark:opacity-100' : ''}`} strokeWidth={2.5} />
        </button>
      </div>

      {/* Hero Card */}
      <div className="relative flex flex-col w-full px-6 py-6 mb-5 rounded-[28px] overflow-hidden bg-[#1E1915] dark:bg-[#1C1815] shadow-lg shadow-black/10 border border-[#3E2D20]" onClick={(e) => e.stopPropagation()}>
        
        {/* Background Visual Element */}
        <div className="absolute right-0 top-0 h-full w-[180px] bg-gradient-to-l from-white/10 to-transparent flex items-center justify-end pr-2 pointer-events-none opacity-40">
           <span className="text-[120px] filter drop-shadow-md brightness-75">☕</span>
        </div>
        
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <div className="w-[20px] h-[20px] bg-[#EAD6C0]/20 rounded flex items-center justify-center">
              <BarChart3 size={11} className="text-[#EAD6C0]" strokeWidth={3} />
            </div>
            <span className="text-[11px] font-bold text-[#EAD6C0] uppercase tracking-wider">{period.toUpperCase()}'S SALES</span>
          </div>
          <strong className="text-[40px] font-black text-white leading-none tabular-nums tracking-tighter mb-5">
            {formatMoney(revenue).replace(/\.00$/, '')}
          </strong>
          
          <div className="flex items-center gap-5 mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
                <ShoppingBag size={18} className="text-[#EAD6C0]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-black text-white leading-tight tabular-nums">{numOrders}</span>
                <span className="text-[11px] font-medium text-white/60">Orders</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
                <Receipt size={18} className="text-[#EAD6C0]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-black text-white leading-tight tabular-nums">{formatMoney(avgBill).replace(/\.00$/, '')}</span>
                <span className="text-[11px] font-medium text-white/60">Avg. Bill</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Activity Card */}
      <DashboardCard className="mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#EAD6C0] dark:text-[#EAD6C0]" />
            <h3 className="text-[15px] font-semibold text-[#1A1917] dark:text-white">Sales Activity</h3>
          </div>
          {/* Internal Tabs matching screenshot */}
          <div className="flex items-center bg-[#E8E2D9] dark:bg-[#1E1E1E] p-0.5 rounded-full border border-[#D5CEC4] dark:border-[#2C2C2C]">
            <button className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'today' ? 'bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] shadow-sm' : 'text-foreground/60'}`} onClick={() => setPeriod('today')}>Today</button>
            <button className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'week' ? 'bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] shadow-sm' : 'text-foreground/60'}`} onClick={() => setPeriod('week')}>Week</button>
            <button className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'month' ? 'bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] shadow-sm' : 'text-foreground/60'}`} onClick={() => setPeriod('month')}>Month</button>
          </div>
        </div>

        {/* 
          Histogram Area 
        */}
        <div className="relative flex flex-col w-full h-[140px] pt-4 border-b border-border/40">
           {/* Grid lines overlay */}
           <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 pointer-events-none z-0">
             <div className="w-full border-t border-border/30 border-dashed" />
             <div className="w-full border-t border-border/30 border-dashed" />
             <div className="w-full border-t border-border/30 border-dashed" />
           </div>
           
           <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-1 text-[9px] font-medium text-muted-foreground z-10">
             <span>2K</span>
             <span>1K</span>
             <span>0</span>
           </div>

           <div className="relative z-10 flex items-end justify-between ml-6 h-full px-1 gap-1">
             {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => {
                const max = period === 'today' ? maxHourOrders : maxWeekdayRevenue;
                const val = period === 'today' ? pt.orders : pt.revenue;
                const h = Math.max(2, (val / max) * 100);
                return (
                  <div key={i} className="flex-1 bg-[#C9956A] dark:bg-[#C2966C] rounded-t-[2px] transition-all duration-700 ease-out hover:opacity-80 cursor-pointer" style={{ height: `${h}%` }} />
                );
             })}
           </div>
        </div>
        <div className="flex items-center justify-between ml-6 px-1 h-5 mt-1.5 text-[9px] font-bold text-muted-foreground relative">
          {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => {
            // By building mapped flex-1 elements matching exactly the gaps of the histogram columns,
            // we guarantee perfect visual vertical alignment with the graph matrix.
            return (
               <div key={i} className="flex-1 flex justify-center break-visible relative h-full">
                 <span className="absolute whitespace-nowrap text-center text-[9px] font-bold top-0">
                   {period === 'today' 
                     ? (pt.hour % 3 === 0 ? `${pt.hour > 12 ? pt.hour-12 : (pt.hour===0?12:pt.hour)}${pt.hour >= 12 ? 'PM' : 'AM'}` : '') 
                     : pt.day.slice(0,3)}
                 </span>
               </div>
            )
          })}
        </div>
      </DashboardCard>
      
      {/* 2-Column Masonry Layout */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3">
          {/* Peak Hour Card */}
          <DashboardCard className="py-4 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#EAD6C0]" />
                <h3 className="text-[12px] font-semibold text-[#1A1917] dark:text-white">Peak Hour</h3>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            <strong className="text-[18px] font-black text-foreground mb-1 leading-none transition-all">{peakHourStr}</strong>
            <span className="text-[11px] font-medium text-muted-foreground transition-all">{peak?.orders || 0} orders</span>
            <div className="relative flex items-end justify-between h-[30px] mt-3 gap-0.5 opacity-80 z-20">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 z-0">
                 <div className="w-full border-t border-border/80 dark:border-white/20 border-dashed" />
                 <div className="w-full border-t border-border/80 dark:border-white/20 border-dashed" />
               </div>
               {densePeakHours.slice(-12).map((h: any, i: number) => (
                 <div 
                   key={i} 
                   onClick={(e) => { e.stopPropagation(); setActivePeakHour(h.hour); }}
                   className={`relative z-10 flex-1 rounded-t-[2px] cursor-pointer transition-all active:scale-105 active:opacity-100 ${((activePeakHour !== null ? h.hour === activePeakHour : h.orders === globalPeak?.orders) && (h.orders ?? 0) > 0) ? 'bg-[#EAD6C0]' : 'bg-[#513217] dark:bg-white/10'}`} 
                   style={{ height: `${Math.max(10, (h.orders / maxHourOrders) * 100)}%` }} 
                 />
               ))}
            </div>
          </DashboardCard>

          {/* Top Products Card */}
          <DashboardCard className="py-4 px-3 cursor-pointer active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.06)]" onClick={(e) => { e.stopPropagation(); setTopProductsOpen(true); }}>
            <div className="flex items-center justify-between mb-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#EAD6C0]" />
                <h3 className="text-[12px] font-semibold text-[#1A1917] dark:text-white">Top Products</h3>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            <div className="flex flex-col gap-3 pointer-events-none">
               {topProducts.length === 0 ? (
                 <span className="text-[11px] text-muted-foreground text-center">No products</span>
               ) : topProducts.slice(0, 5).map((prod: any, i: number) => (
                 <div key={i} className="flex items-center justify-between gap-1">
                   <div className="flex items-center gap-1.5 overflow-hidden">
                     <span className="text-[10px] font-black text-muted-foreground min-w-[12px]">{String(i+1).padStart(2, '0')}</span>
                     <div className="w-[18px] h-[18px] flex-none bg-muted rounded-full flex items-center justify-center text-[10px] shadow-sm">☕</div>
                     <span className="text-[10px] font-bold text-foreground truncate">{prod.name}</span>
                   </div>
                   <div className="flex gap-1.5 flex-none items-center text-[9px]">
                     <span className="text-muted-foreground">{prod.sold} sold</span>
                     <strong className="text-foreground tracking-tight tabular-nums">₹{prod.revenue?.toLocaleString() || 0}</strong>
                   </div>
                 </div>
               ))}
            </div>
          </DashboardCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3">
          {/* Payment Mix Card */}
          <DashboardCard className="py-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-[#EAD6C0]" />
                <h3 className="text-[12px] font-semibold text-[#1A1917] dark:text-white">Payment Mix</h3>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            
            <div className="flex items-center justify-center gap-3 mt-4">
              {/* CSS Donut Chart */}
              <div 
                className="w-[85px] h-[85px] rounded-full flex items-center justify-center shadow-lg relative flex-none shadow-black/10"
                style={{ background: donutGradient }}
              >
                <div className="w-[60px] h-[60px] bg-white dark:bg-[#1E1E1E] rounded-full absolute flex flex-col items-center justify-center leading-none">
                  <span className="text-[11px] font-black text-foreground tabular-nums tracking-tighter">
                     {formatMoney(validPaymentsTotal).replace('₹ ', '₹')}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground mt-0.5">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#EAD6C0]" /> UPI</span>
                  <span>{upiPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#8A5A33]" /> Cash</span>
                  <span>{cashPct}%</span>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Recent Orders Card Deep Link via onGo */}
          <DashboardCard className="py-4 px-3 flex-1 flex flex-col cursor-pointer active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(0,0,0,0.06)]" onClick={(e) => { e.stopPropagation(); onGo('orders'); }}>
            <div className="flex items-center justify-between mb-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Receipt size={13} className="text-[#EAD6C0]" />
                <h3 className="text-[12px] font-semibold text-[#1A1917] dark:text-white">Recent Orders</h3>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            <div className="flex flex-col gap-3.5 flex-1 justify-between pointer-events-none">
              {orders.length === 0 ? (
                 <span className="text-[11px] text-muted-foreground text-center">No orders</span>
               ) : orders.slice(0, 5).map((order: any) => (
                <div className="flex items-center justify-between gap-1" key={order.id || order._id}>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <strong className="text-[11px] font-black text-foreground tracking-tight uppercase truncate">#{String(order.id || order._id).slice(-4)}</strong>
                    <span className="text-[9px] font-medium text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-none">
                    <strong className="text-[11px] font-black tabular-nums">{formatMoney(order.grandTotal)}</strong>
                    <span className="text-[9px] font-medium text-muted-foreground">{formatTime(order.createdAt)}</span>
                  </div>
                  <div className="flex-none bg-[#24412B]/90 text-[#7BB88C] px-1.5 py-0.5 rounded-[4px] text-[7px] font-extrabold uppercase uppercase">
                    Completed
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Today's Insight Wide Block */}
      {topProducts.length > 0 && (
        <DashboardCard className="!bg-[#513217] dark:!bg-[#231B15] !border-transparent relative overflow-hidden transition-transform" onClick={(e) => e.stopPropagation()}>
          <div className="absolute right-[-10%] opacity-10 pointer-events-none">
            <Sparkles size={100} />
          </div>
          <div className="flex items-center justify-between relative z-10 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-xl bg-black/20 flex flex-none items-center justify-center">
                <TrendingUp size={20} className="text-[#EAD6C0]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[12px] font-bold text-white/90">Today's Insight</h3>
                <p className="text-[11px] font-medium text-white/60">
                  <strong className="text-white font-bold">{topProducts[0]?.name}</strong> is your top-selling item today.
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#EAD6C0]" />
          </div>
        </DashboardCard>
      )}
      
      {/* Dynamic Overlay Expanded Components */}
      {topProductsOpen && (
        <TopProductsModal onClose={() => setTopProductsOpen(false)} currentPeriod={period} />
      )}

    </div>
  );
}

// Reusable micro-component for standard Dashboard cards
function DashboardCard({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: (e: any) => void }) {
  return (
    <div 
      className={`p-4 rounded-[20px] bg-white dark:bg-[#1C1815] border border-border/80 dark:border-white/5 shadow-sm dark:shadow-none ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}


function TopProductsModal({ onClose, currentPeriod }: { onClose: () => void, currentPeriod: string }) {
  const modalPeriods = ['today', 'week', 'month', 'all'] as const;
  const [modalPeriod, setModalPeriod] = useState<(typeof modalPeriods)[number]>(currentPeriod as any);
  
  // This independent data fetch seamlessly queries the lifetime boundaries if 'all' is toggled!
  const { data, isLoading } = useDashboard(modalPeriod);
  
  const products = data?.topProducts || [];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div 
        className="relative flex flex-col w-full max-w-md h-[85vh] bg-[#F2F0ED] dark:bg-[#000000] rounded-t-[32px] overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-[0_-8px_40px_rgba(0,0,0,0.3)]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-border/40 dark:border-white/5">
          <h2 className="text-[20px] font-black text-foreground tracking-tight">Lifetime Activity</h2>
          <button className="p-2 bg-black/5 dark:bg-white/10 rounded-full active:scale-95 transition-transform" onClick={onClose}>
             <X size={18} className="text-foreground" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Full Modal Toggles */}
        <div className="flex items-center px-5 py-4 border-b border-border/40 dark:border-white/5">
           <div className="flex items-center w-full gap-1 p-1 bg-white dark:bg-[#1E1915] rounded-full border border-border/80 dark:border-white/5 shadow-inner overflow-x-auto no-scrollbar">
             {modalPeriods.map(item => (
               <button 
                 key={item} 
                 className={`flex-1 flex flex-none items-center justify-center min-w-[70px] h-[36px] px-3 rounded-full text-[12px] font-bold transition-all ${modalPeriod === item ? 'bg-[#513217] text-white dark:bg-[#EAD6C0] dark:text-[#1A1917] shadow-sm' : 'text-foreground/60'}`} 
                 onClick={() => setModalPeriod(item)}
               >
                 {item === 'today' ? 'Today' : item === 'week' ? 'This Week' : item === 'month' ? 'This Month' : 'All Time'}
               </button>
             ))}
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-12 flex flex-col gap-3">
          {isLoading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="w-full h-[64px] rounded-2xl bg-white dark:bg-[#1C1815] animate-pulse border border-border/80 dark:border-white/5" />
             ))
          ) : products.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-muted-foreground font-bold">No product activity documented within this frame.</div>
          ) : products.map((prod: any, i: number) => (
             <div key={prod.name} className="flex items-center justify-between p-3.5 px-4 bg-white dark:bg-[#1C1815] border border-border/80 dark:border-white/5 rounded-[22px] shadow-sm active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3.5">
                   <div className="w-[38px] h-[38px] rounded-full bg-[#F2F0ED] dark:bg-black text-muted-foreground flex items-center justify-center text-[13px] font-black border border-border/50 dark:border-white/10">{String(i+1).padStart(2, '0')}</div>
                   <div className="flex flex-col">
                      <strong className="text-[14px] font-black text-foreground">{prod.name}</strong>
                      <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <ShoppingBag size={12} className="opacity-70"/> {prod.sold} units sold
                      </span>
                   </div>
                </div>
                <strong className="text-[15px] font-black tracking-tight tabular-nums opacity-90">
                   {formatMoney(prod.revenue ?? 0).replace(/\.00$/, '')}
                </strong>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
