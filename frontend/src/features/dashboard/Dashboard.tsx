import { useState } from 'react';
import { BarChart3, Receipt, ShoppingBag, ChevronRight, Clock, CreditCard, Sparkles, TrendingUp, X, RefreshCw, Pill, Activity } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { formatMoney, formatTime } from '../../utils/format';
import { getDensePeakHours, getDenseWeekdays, getValidPaymentsData, getDonutGradient } from '../../utils/dashboardUtils';
import { ExportPdfButton } from '../../components/ExportPdfButton';

const periods = ['today', 'week', 'month', 'all'] as const;

export function Dashboard({ onGo }: { onGo: (view: string) => void }) {
  const [period, setPeriod] = useState<(typeof periods)[number]>('today');
  const [activePeakHour, setActivePeakHour] = useState<number | null>(null);
  const [topProductsOpen, setTopProductsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const reportQuery = useDashboard(period);
  const report = reportQuery.data;
  
  const rawPeakHours = report?.peakHours ?? [];
  const densePeakHours = getDensePeakHours(rawPeakHours, period);

  const rawWeekdays = report?.weekdayPattern ?? [];
  const denseWeekdays = getDenseWeekdays(rawWeekdays);
  
  const allPayments = report?.paymentBreakdown ?? [];
  const { validPaymentsTotal, upiPct, cashPct } = getValidPaymentsData(allPayments);

  const topProducts = (report?.topProducts ?? []).map((x: any) => ({ ...x, revenue: Number(x.revenue ?? 0) }));
  const recentOrders = report?.recentOrders ?? [];
  
  const maxHourOrders = Math.max(...densePeakHours.map(h => h.orders), 1);
  const maxWeekdayRevenue = Math.max(...denseWeekdays.map(d => d.revenue), 1);

  // Dynamic metrics for the Hero card
  const revenue = report?.revenue ?? 0;
  const numOrders = report?.orders ?? 0;
  const avgBill = report?.averageBill ?? 0;

  // Peak Hour logic with interactive touch state mapping
  const maxDenseRecord = densePeakHours.reduce((prev: any, current: any) => (prev.orders > current.orders) ? prev : current, { hour: 0, orders: -1 });
  const globalPeak = maxDenseRecord.orders > 0 ? maxDenseRecord : null;
  const peak = activePeakHour !== null ? densePeakHours.find(h => h.hour === activePeakHour) : globalPeak;
  const peakHourStr = peak ? `${peak.hour > 12 ? peak.hour-12 : (peak.hour===0?12:peak.hour)} ${peak.hour >= 12 ? 'PM' : 'AM'}` : '--';

  // Payment Mix Conic Gradient
  const donutGradient = getDonutGradient(validPaymentsTotal, upiPct, cashPct);

  return (
    <div className="flex flex-col w-full h-full pb-24 px-4 bg-slate-50 dark:bg-slate-950 animate-in fade-in slide-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pt-2 font-sans tracking-tight" onClick={() => setActivePeakHour(null)}>
      
      {/* System Owner Tag */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-2.5 bg-sky-50/80 dark:bg-sky-950/40 rounded-xl border border-sky-200/60 dark:border-sky-800/60 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-200">
          <Sparkles size={12} className="text-sky-500" />
          <span>Pharmacy Analytics</span>
        </div>
        <span className="font-extrabold text-sky-700 dark:text-sky-300">@Rudra Info Tech</span>
      </div>

      {/* Top Main Date Filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm flex-1 relative overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
          {periods.map((item) => (
            <button 
              key={item} 
              className={`flex-1 flex items-center justify-center h-[34px] px-2.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.98] whitespace-nowrap ${period === item ? 'bg-sky-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`} 
              onClick={() => setPeriod(item)}
            >
              {item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <ExportPdfButton variant="mobile" period={period} report={report} />
          <button
            className="p-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-sky-400 rounded-full border border-slate-200 dark:border-slate-800 active:scale-95 transition-all shadow-sm flex-none hover:bg-slate-50"
            onClick={async (e) => {
               e.stopPropagation();
               setIsRefreshing(true);
               await reportQuery.refetch();
               setTimeout(() => setIsRefreshing(false), 300);
            }}
          >
            <RefreshCw size={17} className={`${isRefreshing ? 'animate-spin text-sky-600 dark:text-sky-400' : ''}`} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative flex flex-col w-full px-6 py-6 mb-4 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950 text-white shadow-lg shadow-sky-950/20 border border-sky-800/40" onClick={(e) => e.stopPropagation()}>
        
        {/* Background Visual Watermark */}
        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-15 pointer-events-none text-sky-400">
           <Activity size={150} strokeWidth={1.5} />
        </div>
        
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <div className="w-[22px] h-[22px] bg-sky-500/20 rounded-md flex items-center justify-center">
              <BarChart3 size={13} className="text-sky-300" strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
              {period === 'all' ? 'LIFETIME SALES' : `${period.toUpperCase()}'S SALES`}
            </span>
          </div>
          <strong className="text-[40px] font-black text-white leading-none tabular-nums tracking-tighter mb-4">
            {formatMoney(revenue).replace(/\.00$/, '')}
          </strong>
          
          <div className="flex items-center gap-6 mt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <ShoppingBag size={18} className="text-sky-300" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-black text-white leading-tight tabular-nums">{numOrders}</span>
                <span className="text-[11px] font-medium text-sky-200/80">Invoices</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Receipt size={18} className="text-sky-300" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-black text-white leading-tight tabular-nums">{formatMoney(avgBill).replace(/\.00$/, '')}</span>
                <span className="text-[11px] font-medium text-sky-200/80">Avg. Bill</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Activity Card */}
      <DashboardCard className="mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-sky-600 dark:text-sky-400" />
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Activity Overview</h3>
          </div>
          {/* Internal Quick Toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            <button className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'today' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'}`} onClick={() => setPeriod('today')}>Today</button>
            <button className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'week' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'}`} onClick={() => setPeriod('week')}>Week</button>
            <button className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'month' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'}`} onClick={() => setPeriod('month')}>Month</button>
            <button className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${period === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'}`} onClick={() => setPeriod('all')}>All</button>
          </div>
        </div>

        {/* Histogram Area */}
        <div className="relative flex flex-col w-full h-[140px] pt-4 border-b border-slate-100 dark:border-slate-800">
           <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-0 pointer-events-none z-0">
             <div className="w-full border-t border-slate-200 dark:border-slate-800 border-dashed" />
             <div className="w-full border-t border-slate-200 dark:border-slate-800 border-dashed" />
             <div className="w-full border-t border-slate-200 dark:border-slate-800 border-dashed" />
           </div>

           <div className="relative z-10 flex items-end justify-between ml-2 h-full px-1 gap-1">
             {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => {
                const max = period === 'today' ? maxHourOrders : maxWeekdayRevenue;
                const val = period === 'today' ? pt.orders : pt.revenue;
                const h = Math.max(3, (val / max) * 100);
                return (
                  <div key={i} className="flex-1 bg-sky-500 hover:bg-sky-400 dark:bg-sky-400 rounded-t-[3px] transition-all duration-300 cursor-pointer" style={{ height: `${h}%` }} />
                );
             })}
           </div>
        </div>
        <div className="flex items-center justify-between ml-2 px-1 h-5 mt-1.5 text-[9px] font-bold text-slate-400 relative">
          {(period === 'today' ? densePeakHours : denseWeekdays).map((pt: any, i: number) => {
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
      
      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3">
          {/* Peak Hour Card */}
          <DashboardCard className="py-4 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">Peak Hour</h3>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </div>
            <strong className="text-[18px] font-black text-slate-900 dark:text-white mb-0.5 leading-none transition-all">{peakHourStr}</strong>
            <span className="text-[11px] font-semibold text-slate-400 transition-all block">{peak?.orders || 0} orders</span>
            <div className="relative flex items-end justify-between h-[30px] mt-2 gap-0.5 opacity-80 z-20">
               {densePeakHours.slice(-12).map((h: any, i: number) => (
                 <div 
                   key={i} 
                   onClick={(e) => { e.stopPropagation(); setActivePeakHour(h.hour); }}
                   className={`relative z-10 flex-1 rounded-t-[2px] cursor-pointer transition-all ${((activePeakHour !== null ? h.hour === activePeakHour : h.orders === globalPeak?.orders) && (h.orders ?? 0) > 0) ? 'bg-sky-600' : 'bg-sky-200 dark:bg-slate-700'}`} 
                   style={{ height: `${Math.max(10, (h.orders / maxHourOrders) * 100)}%` }} 
                 />
               ))}
            </div>
          </DashboardCard>

          {/* Top Products Card */}
          <DashboardCard className="py-4 px-3 cursor-pointer active:scale-[0.98] transition-transform shadow-xs" onClick={(e) => { e.stopPropagation(); setTopProductsOpen(true); }}>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">Top Medicines</h3>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </div>
            <div className="flex flex-col gap-2.5 pointer-events-none">
               {topProducts.length === 0 ? (
                 <span className="text-[11px] text-slate-400 text-center py-2 font-medium">No sales yet</span>
               ) : topProducts.slice(0, 5).map((prod: any, i: number) => (
                 <div key={i} className="flex items-center justify-between gap-1">
                   <div className="flex items-center gap-1.5 overflow-hidden">
                     <span className="text-[10px] font-black text-slate-400 min-w-[12px]">{String(i+1).padStart(2, '0')}</span>
                     <div className="w-[18px] h-[18px] flex-none bg-sky-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] shadow-xs">
                       <Pill size={10} className="text-sky-600 dark:text-sky-400" />
                     </div>
                     <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{prod.name}</span>
                   </div>
                   <div className="flex gap-1.5 flex-none items-center text-[10px]">
                     <span className="text-slate-400">{prod.sold} sold</span>
                     <strong className="text-slate-900 dark:text-white tracking-tight tabular-nums">₹{prod.revenue?.toLocaleString() || 0}</strong>
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
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <div className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">Payment Mix</h3>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </div>
            
            <div className="flex items-center justify-center gap-3 mt-3">
              <div 
                className="w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-md relative flex-none"
                style={{ background: donutGradient }}
              >
                <div className="w-[56px] h-[56px] bg-white dark:bg-slate-900 rounded-full absolute flex flex-col items-center justify-center leading-none">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                     {formatMoney(validPaymentsTotal).replace('₹ ', '₹')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 mt-0.5">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-400" /> UPI</span>
                  <span className="text-slate-700 dark:text-slate-300">{upiPct}%</span>
                </div>
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-700" /> Cash</span>
                  <span className="text-slate-700 dark:text-slate-300">{cashPct}%</span>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Recent Orders Card */}
          <DashboardCard className="py-4 px-3 flex-1 flex flex-col cursor-pointer active:scale-[0.98] transition-transform shadow-xs" onClick={(e) => { e.stopPropagation(); onGo('orders'); }}>
            <div className="flex items-center justify-between mb-3 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Receipt size={13} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">Recent Bills</h3>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </div>
            <div className="flex flex-col gap-2.5 flex-1 justify-between pointer-events-none">
              {recentOrders.length === 0 ? (
                 <span className="text-[11px] text-slate-400 text-center py-2 font-medium">No bills yet</span>
               ) : recentOrders.slice(0, 4).map((order: any) => (
                <div className="flex items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0 last:pb-0" key={order.id || order._id}>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <strong className="text-[11px] font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">
                      {order.invoiceNumber || 'INV'}
                    </strong>
                    <span className="text-[9px] font-medium text-slate-400">{formatTime(order.createdAt)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-none">
                    <strong className="text-[11px] font-black tabular-nums text-slate-900 dark:text-white">{formatMoney(order.grandTotal)}</strong>
                    <span className="text-[8px] font-bold uppercase text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-1 py-0.2 rounded">
                      {order.paymentMethod || 'Paid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Top Medicine Insight */}
      {topProducts.length > 0 && (
        <DashboardCard className="!bg-gradient-to-r from-sky-600 to-cyan-600 !border-transparent text-white relative overflow-hidden shadow-md mb-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between relative z-10 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-xl bg-white/20 flex flex-none items-center justify-center">
                <TrendingUp size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[12px] font-bold text-white/90">Top Product Insight</h3>
                <p className="text-[11px] font-medium text-white/80">
                  <strong className="text-white font-bold">{topProducts[0]?.name}</strong> is leading in demand.
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/80" />
          </div>
        </DashboardCard>
      )}
      
      {/* Modal for Top Products */}
      {topProductsOpen && (
        <TopProductsModal onClose={() => setTopProductsOpen(false)} currentPeriod={period} />
      )}

    </div>
  );
}

// Reusable component for clean standard cards
function DashboardCard({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: (e: any) => void }) {
  return (
    <div 
      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function TopProductsModal({ onClose, currentPeriod }: { onClose: () => void, currentPeriod: string }) {
  const modalPeriods = ['today', 'week', 'month', 'all'] as const;
  const [modalPeriod, setModalPeriod] = useState<(typeof modalPeriods)[number]>(currentPeriod as any);
  
  const { data, isLoading } = useDashboard(modalPeriod);
  const products = data?.topProducts || [];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in" onClick={onClose}>
      <div 
        className="relative flex flex-col w-full max-w-md h-[85vh] bg-slate-50 dark:bg-slate-950 rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl border-t border-slate-200 dark:border-slate-800" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Pill className="text-sky-600 dark:text-sky-400" size={20} />
            <h2 className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Top Medicines</h2>
          </div>
          <button className="p-2 bg-slate-200/70 dark:bg-slate-800 rounded-full active:scale-95 transition-transform" onClick={onClose}>
             <X size={18} className="text-slate-700 dark:text-slate-300" strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Modal Period Toggles */}
        <div className="flex items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800">
           <div className="flex items-center w-full gap-1 p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto no-scrollbar">
             {modalPeriods.map(item => (
               <button 
                 key={item} 
                 className={`flex-1 flex items-center justify-center min-w-[70px] h-[34px] px-3 rounded-full text-[12px] font-bold transition-all ${modalPeriod === item ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'}`} 
                 onClick={() => setModalPeriod(item)}
               >
                 {item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'All Time'}
               </button>
             ))}
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-12 flex flex-col gap-2.5">
          {isLoading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="w-full h-[60px] rounded-xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
             ))
          ) : products.length === 0 ? (
             <div className="flex items-center justify-center h-40 text-slate-400 font-bold">No product activity in this timeframe.</div>
          ) : products.map((prod: any, i: number) => (
             <div key={prod.name} className="flex items-center justify-between p-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3">
                   <div className="w-[34px] h-[34px] rounded-full bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[12px] font-black border border-sky-100 dark:border-slate-700">{String(i+1).padStart(2, '0')}</div>
                   <div className="flex flex-col">
                      <strong className="text-[13px] font-black text-slate-800 dark:text-slate-200">{prod.name}</strong>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <ShoppingBag size={12} className="opacity-70"/> {prod.sold} units sold
                      </span>
                   </div>
                </div>
                <strong className="text-[14px] font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
                   {formatMoney(prod.revenue ?? 0).replace(/\.00$/, '')}
                </strong>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}
