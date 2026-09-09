import { Sun, Moon, Monitor, Printer, Info, RefreshCw, Receipt, Building2, Store, CreditCard } from 'lucide-react';
import { useThemeStore, type Theme } from '../../stores/themeStore';

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  { value: 'system', label: 'System', icon: <Monitor size={16} /> },
];

export function SettingsView() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="page bl-page" style={{ paddingBottom: 100 }}>
      {/* ── Theme section ──────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--bl-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '20px 0 10px 4px' }}>Appearance</h2>
      
      <div className="bl-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {THEMES.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 6px', borderRadius: 12, border: '1.5px solid',
                borderColor: theme === value ? 'var(--bl-brown)' : 'var(--bl-line)',
                background: theme === value ? 'var(--bl-brown-lt)' : 'var(--bl-card)',
                color: theme === value ? 'var(--bl-brown)' : 'var(--bl-ink)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all 120ms ease', touchAction: 'manipulation'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Removed Business Section */}

      {/* ── Printer section ────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--bl-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '24px 0 10px 4px' }}>Hardware</h2>
      
      <div className="bl-card">
        <SettingRow icon={<Printer size={18} />} title="Printer Settings" desc="Bluetooth and network printers" isLast={true} />
      </div>

      {/* ── Transactions ───────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--bl-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '24px 0 10px 4px' }}>Finance</h2>
      
      <div 
        className="bl-card hover:opacity-80 active:scale-95 transition-all" 
        onClick={() => {
           // Simulate a switch to "Orders" tab by triggering document internal click or event.
           // Easiest UI fix without props since it's hardwired at root.
           const orderTab = document.querySelector('button[aria-label="Orders"]');
           if (orderTab) (orderTab as HTMLElement).click();
        }}
      >
        <SettingRow icon={<CreditCard size={18} />} title="Manage Transactions" desc="Refunds and voids" isLast={true} />
      </div>

      {/* ── System ─────────────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--bl-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '24px 0 10px 4px' }}>System</h2>
      
      <div className="bl-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <SettingRow icon={<RefreshCw size={18} />} title="Sync Status" desc="Last synced: 2 mins ago" />
        <SettingRow icon={<Info size={18} />} title="About POS" desc="Version 2.1.0" isLast={true} />
      </div>
      
      <div style={{ height: 20 }} />
    </div>
  );
}

function SettingRow({ icon, title, desc, isLast = false }: { icon: React.ReactNode, title: string, desc: string, isLast?: boolean }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: 14, 
      padding: '16px', 
      borderBottom: isLast ? 'none' : '1.5px solid var(--bl-line)',
      cursor: 'pointer'
    }}>
      <div style={{ 
        width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        borderRadius: 10, background: 'var(--bl-brown-lt)', color: 'var(--bl-brown)' 
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: 'var(--bl-ink)' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--bl-muted)' }}>{desc}</p>
      </div>
    </div>
  );
}
