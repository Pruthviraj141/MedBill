import * as React from "react";
import { cn } from "../../lib/utils";
import QRCode from "react-qr-code";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import type { Order, OrderItem } from "../../types";
import { printerService } from "../../services/printer/printerService";
import { formatMoney } from "../../utils/format";
import qrAssetUrl from "../../assets/qr.png";

// --- SVG Icons ---

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);


// --- Helper Components ---

const DashedLine = () => (
  <div
    className="w-full border-t-2 border-dashed border-border/60"
    aria-hidden="true"
  />
);

const ConfettiExplosion = () => {
  const confettiCount = 100;
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];

  return (
    <>
      <style>
        {`
          @keyframes fall {
            0% {
                transform: translateY(-10vh) rotate(0deg);
                opacity: 1;
            }
            100% {
              transform: translateY(110vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 pointer-events-none" aria-hidden="true">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-20 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `fall ${2.5 + Math.random() * 2.5}s ${Math.random() * 2}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
};


// --- Main Ticket Component ---

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  order: Order;
  onNewBill: () => void;
}

const AnimatedTicketContent = React.forwardRef<HTMLDivElement, { order: Order }>(
  ({ order }, ref) => {
    
    // Fallback ID
    const displayId = (order.id || order._id || "MB-001");
    const shortId = displayId.slice(-6).toUpperCase();
    
    // Format Date
    let dateObj = new Date();
    try {
        if (order.createdAt) dateObj = new Date(order.createdAt);
    } catch(e) {}

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(dateObj).replace(',', ' •');

    const paymentLabel = order.paymentMethod || "CASH";
    const amountStr = formatMoney(order.grandTotal || 0);

    return (
        <div 
          ref={ref}
          className="relative w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-xl border border-border/30 font-sans z-10 overflow-hidden"
        >
          {/* Ticket cut-out effect */}
          <div className="absolute -left-4 top-[50%] -translate-y-1/2 w-8 h-8 rounded-full bg-background border-r border-border/30 shadow-inner z-20" />
          <div className="absolute -right-4 top-[50%] -translate-y-1/2 w-8 h-8 rounded-full bg-background border-l border-border/30 shadow-inner z-20" />

          {/* Top Brand Banner */}
          <div className="bg-[#1e3a2f] pt-8 pb-10 flex flex-col items-center">
            <h1 className="text-3xl font-black text-[#d1fae5] tracking-tighter">MEDBILL PHARMACY</h1>
          </div>

          <div className="bg-card w-full -mt-6 rounded-t-3xl pt-2 flex flex-col relative before:absolute before:inset-0 before:bg-white/5">
              
              {/* Check Icon centered exactly on the cut */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-full p-1.5 shadow-sm border border-background">
                  <div className="p-3 bg-green-500 rounded-full animate-in zoom-in-50 delay-300 duration-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                      <CheckCircleIcon className="w-8 h-8 text-white animate-in zoom-in-75 delay-500 duration-500" />
                  </div>
              </div>

              <div className="px-8 mt-10 flex flex-col items-center text-center">
                  <h1 className="text-[26px] font-black text-foreground mb-1 mt-1 tracking-tight">Success!</h1>
                  <p className="text-[13px] font-medium text-muted-foreground/80">
                    Order confirmation received
                  </p>
              </div>

              <div className="px-8 pt-6 pb-8 space-y-6">
                  <DashedLine />

                  <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Order ID</p>
                          <p className="font-mono font-bold text-[15px]">#{shortId}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Amount</p>
                          <p className="font-black text-[18px] text-[#E1884B]">{amountStr}</p>
                      </div>
                  </div>

                  <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Date & Time</p>
                      <p className="font-semibold text-[14px]">{formattedDate}</p>
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl flex items-center justify-between border border-border/30">
                      <div className="flex flex-col">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Method</p>
                          <p className={`font-black text-[15px] ${paymentLabel === 'UPI' ? 'text-[#7656B8]' : 'text-[#B47C44]'}`}>{paymentLabel}</p>
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border/50 shadow-sm text-lg">
                          {paymentLabel === 'UPI' ? '📱' : '💵'}
                      </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2 pt-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Medicines & Dosage</p>
                        <span className="text-[9px] text-sky-600 dark:text-sky-400 font-semibold">(M - A - N)</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs">
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-bold text-foreground truncate">{it.name} <span className="text-muted-foreground font-normal">x{it.quantity}</span></span>
                              <span className="text-[10px] text-muted-foreground">M: Morn | A: Aft | N: Night</span>
                            </div>
                            <span className="px-2 py-0.5 rounded font-mono font-black text-[12px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                              {it.dosageSchedule || '0-0-0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <DashedLine />

                  <div className="flex flex-col items-center pt-2 pb-2">
                       {/* Display the authentic UPI QR instead of the Order ID string */}
                       <img 
                          src={qrAssetUrl} 
                          alt="UPI Payment QR" 
                          // Apply a 140x140 square crop tracking from the top to hide the UPI ID text
                          className="w-[140px] h-[140px] object-cover object-top rounded-md bg-white p-1 shadow-sm"
                       />
                      <p className="text-[10px] text-muted-foreground/70 tracking-[0.4em] uppercase font-bold mt-4 font-mono">
                          {shortId}
                      </p>
                  </div>
              </div>
          </div>
        </div>
    )
  }
);
AnimatedTicketContent.displayName = "AnimatedTicketContent";

const AnimatedTicket = ({
  className,
  order,
  onNewBill,
  ...props
}: TicketProps) => {
    const [showConfetti, setShowConfetti] = React.useState(false);
    const ticketRef = React.useRef<HTMLDivElement>(null);
    const [printing, setPrinting] = React.useState(false);

    const handlePrintReceipt = async () => {
        if (printing) return;
        setPrinting(true);
        try {
            const success = await printerService.printOrder(order as Order, (order.items || []) as OrderItem[]);
            if (!success) {
                alert("Failed to print to receipt printer. Please check printer connection.");
            }
        } catch (error) {
            console.error("Print error:", error);
            alert("Error sending print job.");
        } finally {
            setPrinting(false);
        }
    };

    return (
      <div className={cn("flex flex-col items-center w-full max-w-sm mx-auto", className)} {...props}>
        {showConfetti && <ConfettiExplosion />}
        
        {/* Ticket wrapper w/ slide-in */}
        <div className="animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-500 ease-out flex justify-center w-full px-4">
            <AnimatedTicketContent ref={ticketRef} order={order} />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
           <button 
                onClick={handlePrintReceipt}
                disabled={printing}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 bg-white dark:bg-[#1C1C1E] text-foreground font-bold shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-none border border-border/60 hover:bg-muted active:scale-[0.98] transition-all"
            >
                {printing ? (
                    <span className="flex items-center gap-2 animate-pulse">Printing Receipt...</span>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Print Receipt
                    </>
                )}
            </button>
            <a
              href="http://127.0.0.1:28080/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-slate-700 hover:bg-sky-100 active:scale-[0.98] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              View 58mm Thermal Preview (127.0.0.1:28080/preview)
            </a>
            <button 
                onClick={onNewBill}
                className="w-full h-14 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white text-[15px] font-black shadow-lg hover:shadow-xl active:scale-[0.98] transition-all tracking-wide"
            >
                START NEW BILL
            </button>
        </div>
      </div>
    );
};

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket, AnimatedTicketContent };
