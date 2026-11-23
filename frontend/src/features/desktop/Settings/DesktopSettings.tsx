import React from 'react';
import { useThemeStore } from '../../../stores/themeStore';
import { Moon, Sun, Settings, Database, Cloud, Printer, RefreshCw, Store } from 'lucide-react';
import { printerService } from '../../../services/printer/printerService';
import { printQueue } from '../../../services/printer/printQueue';
import { Order } from '../../../types';

export function DesktopSettings({ setView }: { setView?: (v: string) => void }) {
  const { theme, setTheme } = useThemeStore();
  const [failedCount, setFailedCount] = React.useState(printQueue.getFailedJobs().length);
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handleTestPrint = async () => {
    setIsPrinting(true);
    const dummyOrder: Order = {
       id: 'TEST-1234',
       _id: 'TEST-1234', 
       cafeId: 'MEDBILL-PHARMACY',
       items: [{ productId: 'item-1', name: 'Test Receipt Trigger', quantity: 1, unitPrice: 0, total: 0 }],
       paymentMethod: 'CASH',
       subtotal: 0,
       grandTotal: 0,
       invoiceNumber: 'INV-TEST-000',
       status: 'COMPLETED',
       createdAt: new Date().toISOString()
    };
    await printerService.printOrder(dummyOrder, dummyOrder.items);
    setIsPrinting(false);
  };

  const handleRetryJobs = async () => {
    setIsPrinting(true);
    const jobs = printQueue.getFailedJobs();
    for (const job of jobs) {
       const ok = await printerService.printOrder(job.order, job.items);
       if (ok) printQueue.removeJob(job.order.id || job.order._id);
    }
    setFailedCount(printQueue.getFailedJobs().length);
    setIsPrinting(false);
  };

  return (
    <div className="flex flex-col gap-8 pt-4 max-w-4xl mx-auto h-[calc(100vh-220px)]">
      <div className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground font-semibold mt-1">System Preferences & Sync</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Appearance */}
        <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/50 p-8 shadow-sm text-foreground">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6"><Sun size={20} className="text-primary"/> Appearance</h3>
          
          <div className="flex flex-col gap-4">
             <button
               onClick={() => setTheme('light')}
               className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-foreground ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-foreground/20'}`}
             >
               <div className="flex items-center gap-3 font-bold">
                 <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center"><Sun size={20}/></div>
                 Light Mode
               </div>
               <div className={`w-5 h-5 rounded-full border-2 ${theme === 'light' ? 'border-primary bg-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                 {theme === 'light' && <div className="w-2.5 h-2.5 bg-background rounded-full" />}
               </div>
             </button>

             <button
               onClick={() => setTheme('dark')}
               className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-foreground ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-foreground/20'}`}
             >
               <div className="flex items-center gap-3 font-bold">
                 <div className="w-10 h-10 rounded-full bg-blue-900 text-blue-300 flex items-center justify-center"><Moon size={20}/></div>
                 Dark Mode
               </div>
               <div className={`w-5 h-5 rounded-full border-2 ${theme === 'dark' ? 'border-primary bg-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                 {theme === 'dark' && <div className="w-2.5 h-2.5 bg-background rounded-full" />}
               </div>
             </button>
          </div>
        </div>

        {/* System info */}
        <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/50 p-8 shadow-sm text-foreground">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6"><Settings size={20} className="text-primary"/> System Information</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Database size={24} className="text-muted-foreground mt-1"/>
              <div>
                <h4 className="font-bold">Database Engine</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Web Desktop UI uses direct cloud Web API fallback logic. Local SQLite sync queues are strictly bound to Native mobile clients to prevent origin conflicts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Cloud size={24} className="text-muted-foreground mt-1"/>
              <div>
                <h4 className="font-bold">Cloud Endpoint</h4>
                <p className="text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 p-2 rounded-lg mt-1 break-all">
                  ********** [Hidden by Security Policy] **********
                </p>
                <div className="inline-flex mt-2 items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-black">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> PRODUCTION D1 CONNECTED
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pb-12">
        {/* Printer Configuration */}
        <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/50 p-8 shadow-sm text-foreground">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6"><Printer size={20} className="text-primary"/> Printer Configuration</h3>
          
          <div className="space-y-4">
            <button
               onClick={handleTestPrint}
               disabled={isPrinting}
               className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border/50 hover:border-foreground/20 transition-all font-bold text-foreground disabled:opacity-50"
             >
               Test Thermal Connection
               <Printer size={18} className="text-muted-foreground" />
            </button>
            <button
               onClick={handleRetryJobs}
               disabled={isPrinting || failedCount === 0}
               className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border/50 hover:border-foreground/20 transition-all font-bold text-foreground disabled:opacity-50"
             >
               Retry Failed Prints ({failedCount})
               <RefreshCw size={18} className={`text-muted-foreground ${isPrinting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Admin Configuration */}
        <div className="desktop-card bg-card/60 backdrop-blur-md border border-border/50 p-8 shadow-sm text-foreground">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6"><Store size={20} className="text-primary"/> Store Administration</h3>
          
          <div className="space-y-4">
            <button
               onClick={() => setView?.('products')}
               className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary/60 transition-all font-bold text-foreground"
             >
               Manage Medicine Catalog
               <Store size={18} className="text-primary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
