import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Home, Receipt, ShoppingBag, Settings, LogIn } from 'lucide-react';
import { apiClient } from '../api/client';
import logoSrc from '../assets/logo.png';
import '../stores/themeStore'; // initialize theme on load

const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const Billing = lazy(() => import('../features/billing/Billing').then((module) => ({ default: module.Billing })));
const Orders = lazy(() => import('../features/orders/Orders').then((module) => ({ default: module.Orders })));
const Products = lazy(() => import('../features/products/Products').then((module) => ({ default: module.Products })));
const SettingsView = lazy(() => import('../features/settings/SettingsView').then((module) => ({ default: module.SettingsView })));

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      className={`flex flex-col items-center justify-center gap-1 w-[72px] h-14 rounded-2xl transition-all active:scale-95 ${active ? 'text-primary' : 'text-muted-foreground hover:opacity-80'}`} 
      onClick={onClick}
    >
      <div className={`flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-br from-[#3E2009] to-[#603513] text-white shadow-md scale-110' : 'bg-transparent text-muted-foreground'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black tracking-wide transition-colors ${active ? 'text-foreground' : ''}`}>{label}</span>
    </button>
  );
}

export function App() {
  const [view, setView] = useState('billing');
  const [isOffline, setIsOffline] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setIsOffline(!navigator.onLine);
    const onAuthExpired = () => setToken(null);
    window.addEventListener('auth-expired', onAuthExpired);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('auth-expired', onAuthExpired);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await apiClient.post<any>('/api/auth/login', {
        username: form.get('username'),
        password: form.get('password')
      });
      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
    } catch(err: any) {
      setLoginError(err.message);
    }
  };

  if (!token) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} className="panel" style={{ width: '90%', maxWidth: 360, padding: 30, display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <img src={logoSrc} alt="TBT Cafe Logo" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px', display: 'block', objectFit: 'cover' }} />
            <h1 style={{ fontSize: 22, margin: 0 }}>TBT CAFE</h1>
            <p style={{ color: '#8e8a83', fontSize: 13, margin: '5px 0 0' }}>Sign in to continue</p>
          </div>
          <input name="username" placeholder="Username" className="search" style={{ paddingLeft: 14 }} autoFocus required />
          <input name="password" type="password" placeholder="Password" className="search" style={{ paddingLeft: 14 }} required />
          {loginError && <div style={{ color: '#c76d45', fontSize: 12, fontWeight: 600 }}>{loginError}</div>}
          <button type="submit" className="primary-button" style={{ justifyContent: 'center', marginTop: 10 }}>
            <LogIn size={18}/> Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pb-[calc(72px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur-md border-b shadow-sm border-border">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="TBT Cafe" className="w-10 h-10 rounded-xl object-cover shadow-sm bg-primary" />
          <div className="flex flex-col">
            <strong className="text-sm font-bold leading-tight tracking-tight text-foreground">TBT CAFE</strong>
            <span className="text-[10px] font-black tracking-widest text-[#a9653f] uppercase mt-0.5">CAFÉ POS</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-sm text-[11px] font-bold ${isOffline ? 'border-destructive/30 text-destructive bg-destructive/10' : 'border-border text-muted-foreground bg-card'}`}>
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-destructive' : 'bg-green-500'}`} />
            {isOffline ? 'Offline' : 'Online'}
          </div>
          <button 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3E2009] to-[#8E4A1C] text-white font-bold text-xs flex items-center justify-center shadow-md active:scale-95 transition-transform" 
            onClick={() => { localStorage.removeItem('auth_token'); setToken(null); }}
            aria-label="Profile"
          >
            PG
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
