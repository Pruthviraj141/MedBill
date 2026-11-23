import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Home, Receipt, ShoppingBag, Settings, LogIn, Database } from 'lucide-react';
import logoSrc from '../assets/logo.png';
import '../stores/themeStore'; // initialize theme on load
import { initDB } from '../db/database';
import { syncService } from '../services/syncService';
import { productsRepository } from '../db/repositories/productsRepository';
import { defaultCatalog } from '../db/defaultCatalog';
import { Product } from '../db/types';

const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const Billing = lazy(() => import('../features/billing/Billing').then((module) => ({ default: module.Billing })));
const Orders = lazy(() => import('../features/orders/Orders').then((module) => ({ default: module.Orders })));
const Products = lazy(() => import('../features/products/Products').then((module) => ({ default: module.Products })));
const SettingsView = lazy(() => import('../features/settings/SettingsView').then((module) => ({ default: module.SettingsView })));
const DesktopApp = lazy(() => import('../features/desktop/DesktopApp').then((module) => ({ default: module.DesktopApp })));

import { Capacitor } from '@capacitor/core';

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      className={`flex flex-col items-center justify-center gap-1 w-[72px] h-14 rounded-2xl transition-all active:scale-95 ${active ? 'text-primary' : 'text-muted-foreground hover:opacity-80'}`} 
      onClick={onClick}
    >
      <div className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white shadow-md scale-110' : 'bg-transparent text-muted-foreground'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-wide transition-colors ${active ? 'text-foreground' : ''}`}>{label}</span>
    </button>
  );
}

export function App() {
  const [view, setView] = useState('billing');
  const [isOffline, setIsOffline] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState('');
  const [mode, setMode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'auto';
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || (params.has('mobile') ? 'mobile' : 'auto');
  });
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // 1. Initialize DB safely
    initDB()
      .then(async () => {
        // Fast-path Offline Bootstrap Check (Before UI Mount)
        try {
          const local = await productsRepository.getAllProducts();
          if (local.length === 0) {
            console.log('[BOOTSTRAP] Fast-path hydrating top 10 medicines.');
            for (const p of defaultCatalog) await productsRepository.upsertProduct(p as unknown as Product);
          }
        } catch (e) {
          // ignore fallback err in web environment
        }

        setDbReady(true);
        // Initial cloud bootstrap sync
        syncService.pullCatalog().catch(console.error);
        syncService.pullOrders().catch(console.error);
        // Start background synchronization daemon after DB is ready
        syncService.startBackgroundSync(15000);
      })
      .catch((e) => {
        if (e.message === 'WEB_MODE') {
          setDbReady(true);
        } else {
          console.error('App DB Init failed:', e);
          setDbError('Native SQLite unavailable. Please run on Android/Capacitor device.');
        }
      });

    const on = () => {
      setIsOffline(false);
      // Pre-emptively push any pending items when network returns
      if (dbReady) {
        syncService.pushPending().catch(console.error);
      }
    };
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      syncService.stopBackgroundSync();
    };
  }, [dbReady]);

  if (dbError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground p-8 text-center gap-4">
        <Database size={48} className="text-destructive opacity-80" />
        <h2 className="text-xl font-bold text-destructive">Database Error</h2>
        <p className="text-sm font-medium text-muted-foreground">{dbError}</p>
        <p className="text-[12px] opacity-70 mt-4">MedBill offline engine strictly requires Capacitor Native Environment.</p>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Initializing Database</p>
      </div>
    );
  }

  const isDesktopWeb = !Capacitor.isNativePlatform() && (mode === 'desktop' || (mode !== 'mobile' && windowWidth >= 1024));

  if (isDesktopWeb) {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-[100dvh]"><div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>}>
        <DesktopApp view={view} setView={setView} isOffline={isOffline} onSwitchToMobile={() => setMode('mobile')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-[calc(72px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur-md border-b shadow-sm border-border">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="MedBill" className="w-10 h-10 rounded-xl object-cover shadow-sm bg-primary" />
          <div className="flex flex-col">
            <strong className="text-sm font-bold leading-tight tracking-tight text-foreground">MEDBILL</strong>
            <span className="text-[10px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mt-0.5">PHARMACY POS</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!Capacitor.isNativePlatform() && (
            <button
              onClick={() => setMode('desktop')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-card text-[11px] font-bold text-muted-foreground hover:bg-muted active:scale-95 transition-all shadow-xs"
              title="Switch to Desktop POS layout"
            >
              💻 Desktop
            </button>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-sm text-[11px] font-bold ${isOffline ? 'border-destructive/30 text-destructive bg-destructive/10' : 'border-border text-muted-foreground bg-card'}`}>
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-destructive' : 'bg-green-500'}`} />
            {isOffline ? 'Offline' : 'Online'}
          </div>
          <button 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0284c7] to-[#0ea5e9] text-white font-bold text-lg flex items-center justify-center shadow-md active:scale-95 transition-transform" 
            onClick={() => setView('settings')}
            aria-label="Settings"
          >
            G
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto pt-2 pb-6 px-4">
        <Suspense fallback={<div className="p-4 space-y-4"><div className="w-full h-28 rounded-xl bg-muted animate-pulse" /></div>}>
          {view === 'home' && <Dashboard onGo={setView} />}
          {view === 'billing' && <Billing />}
          {view === 'orders' && <Orders />}
          {view === 'products' && <Products />}
          {view === 'settings' && <SettingsView />}
        </Suspense>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)] bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
        <NavItem active={view === 'billing'} icon={<Receipt size={22}/>} label="Billing" onClick={() => setView('billing')} />
        <NavItem active={view === 'home'} icon={<Home size={22}/>} label="Dashboard" onClick={() => setView('home')} />
        <NavItem active={view === 'orders'} icon={<ShoppingBag size={22}/>} label="Orders" onClick={() => setView('orders')} />
        <NavItem active={view === 'settings'} icon={<Settings size={22}/>} label="Settings" onClick={() => setView('settings')} />
      </nav>

      {isOffline && (
        <div className="fixed bottom-[88px] left-4 right-4 z-50 p-3 rounded-xl bg-destructive text-destructive-foreground text-center text-sm font-bold shadow-lg animate-in slide-in-from-bottom-2">
          You are currently offline
        </div>
      )}
    </div>
  );
}
