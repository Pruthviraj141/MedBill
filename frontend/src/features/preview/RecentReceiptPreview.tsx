import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Printer, ExternalLink, Receipt, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ordersRepository } from '../../db/repositories/ordersRepository';
import { Order, OrderItem } from '../../db/types';
import { printerService } from '../../services/printer/printerService';
import { formatMoney } from '../../utils/format';

interface RecentReceiptPreviewProps {
  onBack?: () => void;
}

export function RecentReceiptPreview({ onBack }: RecentReceiptPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [virtualHtml, setVirtualHtml] = useState<string | null>(null);
  const [daemonActive, setDaemonActive] = useState<boolean>(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'thermal' | 'virtual'>('thermal');
  const [printing, setPrinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRecentReceipt = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    // 1. Check local print agent on port 28080
    let daemonHtml: string | null = null;
    try {
      const res = await fetch('http://127.0.0.1:28080/api/latest-receipt', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.html) {
          daemonHtml = data.html;
          setVirtualHtml(data.html);
          setDaemonActive(true);
        }
      } else {
        setDaemonActive(false);
      }
    } catch {
      // Print agent not running or unreachable on this device
      setDaemonActive(false);
    }

    // 2. Query most recent order from SQLite / API
    try {
      const orders = await ordersRepository.getOrders(1);
      if (orders && orders.length > 0) {
        const recent: any = orders[0];
        setLatestOrder(recent);
        setOrderItems(recent.items || []);
      } else {
        setLatestOrder(null);
        setOrderItems([]);
      }
    } catch (err: any) {
      console.warn('[PREVIEW] Failed to query recent order:', err);
    }

    if (!daemonHtml && (!latestOrder && (!ordersRepository || (await ordersRepository.getOrders(1)).length === 0))) {
      setErrorMsg('No recent receipts or orders recorded yet. Complete a checkout to view the receipt.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecentReceipt();
  }, [fetchRecentReceipt]);

  const handlePrint = async () => {
    if (!latestOrder) return;
    setPrinting(true);
    try {
      await printerService.printOrder(latestOrder as any, orderItems as any);
      // Give daemon time to process buffer then reload preview
      setTimeout(() => fetchRecentReceipt(), 800);
    } catch (err: any) {
      console.error('Print failed:', err);
    } finally {
      setPrinting(false);
    }
  };

  const handleOpenDaemon = () => {
    if (typeof window !== 'undefined') {
      window.open('http://127.0.0.1:28080/preview', '_blank');
    }
  };

  const dosageItems = (orderItems || []).filter(item => {
    const s = item.dosage_schedule || (item as any).dosageSchedule;
    return Boolean(s && s.includes('1'));
  });

  return (
    <div className="flex flex-col min-h-[90vh] w-full max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95"
              title="Back to Billing"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-base font-black text-foreground flex items-center gap-2">
              <Receipt className="text-primary" size={20} />
              Recent Bill Preview
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  daemonActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] font-semibold text-muted-foreground">
                {daemonActive
                  ? 'Local Agent Active (127.0.0.1:28080)'
                  : 'Displaying Latest Order from Database'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchRecentReceipt}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all shadow-xs"
            title="Refresh preview"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {latestOrder && (
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm hover:opacity-90 active:scale-95 transition-all"
              title="Print receipt"
            >
              <Printer size={14} />
              {printing ? 'Printing...' : 'Print'}
            </button>
          )}

          <button
            onClick={handleOpenDaemon}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 active:scale-95 transition-all"
            title="Open 127.0.0.1:28080/preview in new tab"
          >
            <ExternalLink size={14} />
            Agent View
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-center p-1 bg-muted/60 rounded-xl border border-border max-w-sm mx-auto w-full">
        <button
          onClick={() => setActiveTab('thermal')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'thermal'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt size={14} />
          58mm Paper Receipt
        </button>
        <button
          onClick={() => setActiveTab('virtual')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'virtual'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={14} />
          Virtual ESC/POS
        </button>
      </div>

      {/* Main Preview Container */}
      <div className="flex justify-center items-start w-full py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Recent Bill...</p>
          </div>
        ) : errorMsg && !latestOrder && !virtualHtml ? (
          <div className="flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border text-center max-w-md w-full gap-3">
            <AlertCircle size={40} className="text-amber-500 opacity-80" />
            <h3 className="text-sm font-bold text-foreground">No Virtual Receipt Available</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No recent bill has been printed or processed yet. Please create and checkout a bill to generate a virtual receipt preview.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Go to Billing
              </button>
            )}
          </div>
        ) : activeTab === 'virtual' && virtualHtml ? (
          /* Render parsed ESC/POS from Print Agent */
          <div className="w-full max-w-[380px] bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden text-black font-mono">
            <div className="bg-slate-900 text-slate-100 text-[11px] font-bold px-4 py-2 flex items-center justify-between border-b border-slate-800">
              <span>ESC/POS Daemon Virtual Render</span>
              <span className="text-[10px] text-emerald-400">127.0.0.1:28080</span>
            </div>
            <div
              className="p-4 overflow-x-auto text-[13px] leading-tight"
              dangerouslySetInnerHTML={{ __html: virtualHtml }}
            />
          </div>
        ) : (
          /* High-Fidelity 58mm Thermal Paper Layout */
          <div className="w-full max-w-[340px] bg-[#fff] text-[#111] rounded-lg shadow-2xl border border-slate-300/80 p-5 font-mono text-[12px] leading-snug select-text">
            {/* Store Header */}
            <div className="text-center pb-2">
              <div className="text-[16px] font-black tracking-tight text-black">MEDBILL PHARMACY</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mt-0.5">TAX INVOICE / CASH BILL</div>
              <div className="text-[10px] text-slate-500 mt-1">Pharmacy & Medical Supplies</div>
            </div>

            {/* Receipt Meta */}
            <div className="border-t border-dashed border-slate-400/80 pt-2 pb-2 text-[11px] space-y-0.5 text-slate-800">
              <div className="flex justify-between">
                <span>Inv: #{latestOrder?.invoice_number || (latestOrder as any)?.invoiceNumber || latestOrder?.id?.slice(-6).toUpperCase() || 'MB-001'}</span>
                <span>{latestOrder?.payment_method || (latestOrder as any)?.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date: {new Date(latestOrder?.created_at || (latestOrder as any)?.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
                <span>Time: {new Date(latestOrder?.created_at || (latestOrder as any)?.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              </div>
            </div>

            {/* Items Header */}
            <div className="border-t border-b border-dashed border-slate-400/80 py-1 font-bold flex justify-between text-[11px]">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/6 text-center">QTY</span>
              <span className="w-1/3 text-right">AMT</span>
            </div>

            {/* Items List */}
            <div className="py-2 space-y-1.5 text-[11px]">
              {orderItems && orderItems.length > 0 ? (
                orderItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-baseline">
                    <span className="w-1/2 font-bold truncate pr-1">
                      {item.name_snapshot || (item as any).name || 'Medicine'}
                    </span>
                    <span className="w-1/6 text-center">{item.quantity}</span>
                    <span className="w-1/3 text-right font-semibold">
                      ₹{Number(item.line_total || (item as any).total || item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-slate-400 italic">No line items in order</div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-slate-400/80 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span>₹{Number(latestOrder?.subtotal || latestOrder?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Discount / Tax</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t border-dashed border-slate-400/80 pt-1 flex justify-between font-black text-[13px] text-black">
                <span>TOTAL</span>
                <span>₹{Number(latestOrder?.total || (latestOrder as any)?.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                <span>Payment Mode</span>
                <span className="font-bold">{latestOrder?.payment_method || (latestOrder as any)?.paymentMethod || 'CASH'}</span>
              </div>
            </div>

            {/* Dosage Schedule Section (only if at least one item has an active dosage containing '1') */}
            {dosageItems.length > 0 && (
              <div className="border-t border-dashed border-slate-400/80 mt-3 pt-2">
                <div className="font-bold text-[10px] text-center tracking-wider uppercase text-slate-900 pb-1">
                  DOSAGE SCHEDULE (M - A - N)
                </div>
                <div className="text-[9px] text-center text-slate-600 pb-1.5">
                  [M: Morning | A: Afternoon | N: Night]
                </div>
                <div className="space-y-1 text-[10px]">
                  {dosageItems.map((item, idx) => {
                    const sched = item.dosage_schedule || (item as any).dosageSchedule || '0-0-0';
                    return (
                      <div key={item.id || idx} className="flex justify-between items-center py-0.5 border-b border-dotted border-slate-200">
                        <span className="font-bold truncate pr-1">
                          {item.name_snapshot || (item as any).name}
                        </span>
                        <span className="font-black bg-slate-100 px-1.5 py-0.5 rounded text-black tracking-widest text-[11px]">
                          {sched}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-slate-400/80 mt-4 pt-3 text-center space-y-1">
              <div className="font-bold text-[11px]">*** Thank you :) :) ***</div>
              <div className="text-[10px] text-slate-600">Please visit again!</div>
              <div className="text-[9px] text-slate-400 pt-1">MedBill POS 58mm Thermal Engine</div>
            </div>

            {/* Cut line decoration */}
            <div className="border-t-2 border-dashed border-slate-400/40 my-3"></div>
          </div>
        )}
      </div>
    </div>
  );
}
export default RecentReceiptPreview;