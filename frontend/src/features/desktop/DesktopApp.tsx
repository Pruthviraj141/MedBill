import React, { lazy, Suspense } from 'react';
import { Home, Receipt, ShoppingBag, Settings } from 'lucide-react';
import logoSrc from '../../assets/logo.png';
import './desktop-theme.css';

const DesktopBilling = lazy(() => import('./Billing/DesktopBilling').then((module) => ({ default: module.DesktopBilling })));
const DesktopDashboard = lazy(() => import('./Dashboard/DesktopDashboard').then((module) => ({ default: module.DesktopDashboard })));
const DesktopOrders = lazy(() => import('./Orders/DesktopOrders').then((module) => ({ default: module.DesktopOrders })));
const DesktopSettings = lazy(() => import('./Settings/DesktopSettings').then((module) => ({ default: module.DesktopSettings })));

interface DesktopAppProps {
  view: string;
  setView: React.Dispatch<React.SetStateAction<string>>;
  isOffline: boolean;
}

function DesktopNavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      className={`flex flex-col items-center justify-center gap-1.5 w-24 h-[72px] rounded-2xl transition-all active:scale-95 ${active ? 'text-primary' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`} 
      onClick={onClick}
    >
      <div className={`flex items-center justify-center w-12 h-10 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-br from-[#3E2009] to-[#603513] text-white shadow-lg scale-110' : 'bg-transparent text-muted-foreground'}`}>
        {icon}
      </div>
      <span className={`text-[12px] font-black tracking-wide transition-colors ${active ? 'text-foreground' : ''}`}>{label}</span>
    </button>
  );
}

export function DesktopApp({ view, setView, isOffline }: DesktopAppProps) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-[110px] desktop-layout overflow-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-20 h-20 flex items-center justify-between px-8 bg-background/90 backdrop-blur-md border-b shadow-sm border-border">
        <div className="flex items-center gap-4">
          <img src={logoSrc} alt="TBT Cafe" className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-primary" />
          <div className="flex flex-col">
            <strong className="text-lg font-black leading-tight tracking-tight text-foreground">TBT CAFE</strong>
            <span className="text-[12px] font-black tracking-[0.2em] text-[#a9653f] uppercase mt-0.5">CAFÉ POS SERVER</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm text-sm font-bold ${isOffline ? 'border-destructive/30 text-destructive bg-destructive/10' : 'border-border text-muted-foreground bg-card'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-destructive' : 'bg-green-500'}`} />
            {isOffline ? 'Offline' : 'System Online'}
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3E2009] to-[#8E4A1C] text-white font-bold text-xl flex items-center justify-center shadow-md">
            G
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 overflow-y-auto w-full">
        <Suspense fallback={<div className="p-8 space-y-4"><div className="w-full h-40 rounded-3xl bg-muted animate-pulse" /></div>}>
          {view === 'billing' && <DesktopBilling />}
          {view === 'home' && <DesktopDashboard onGo={setView} />}
          {view === 'orders' && <DesktopOrders />}
          {view === 'settings' && <DesktopSettings />}
        </Suspense>
      </main>

      {/* Premium Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-4 px-6 h-[88px] bg-background/95 backdrop-blur-xl border border-border/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-[32px]">
        <DesktopNavItem active={view === 'billing'} icon={<Receipt size={24} strokeWidth={2.5} />} label="Billing" onClick={() => setView('billing')} />
        <DesktopNavItem active={view === 'home'} icon={<Home size={24} strokeWidth={2.5} />} label="Dashboard" onClick={() => setView('home')} />
        <DesktopNavItem active={view === 'orders'} icon={<ShoppingBag size={24} strokeWidth={2.5} />} label="Orders" onClick={() => setView('orders')} />
        <DesktopNavItem active={view === 'settings'} icon={<Settings size={24} strokeWidth={2.5} />} label="Settings" onClick={() => setView('settings')} />
      </nav>
      
      {isOffline && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-destructive text-destructive-foreground text-center text-sm font-black shadow-2xl animate-in slide-in-from-top-4">
          WARNING: SYSTEM OFFLINE
        </div>
      )}
    </div>
  );
}
