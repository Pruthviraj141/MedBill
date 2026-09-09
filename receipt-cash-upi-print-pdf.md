# PROMPT FOR AGENT (paste as-is)

Task: replace `src/components/ui/ticket-confirmation-card.tsx` with the code block below **verbatim**. Do not regenerate it — just apply it.

Then:
1. `npm install react-qr-code jspdf html2canvas`
2. In the checkout/payment-method screen: **delete the CARD button and its handler branch entirely**. Keep only CASH and UPI.
3. On CASH tap → after order submit succeeds, render `<AnimatedTicket paymentMethod="cash" ticketId={order.id} amount={order.total} date={new Date(order.createdAt)} />`.
4. On UPI tap → same but `paymentMethod="upi"` and `qrValue={order.upiRef ?? order.id}` — use the **real** UPI transaction reference or receipt URL from the order response returned by the backend. Do not invent this value.
5. Do not add any Bluetooth/thermal printer SDK. `Print` uses `window.print()`, `Save PDF` uses the dynamic-imported `jspdf`/`html2canvas` already in the file below. Nothing else needed for now.
6. No other files, no other props, no redesign of unrelated screens.

---

```tsx
// src/components/ui/ticket-confirmation-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Banknote, QrCode as QrIcon, Printer, Download } from "lucide-react";
import QRCode from "react-qr-code";

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const DashedLine = () => <div className="w-full border-t-2 border-dashed border-border" aria-hidden="true" />;

const Barcode = ({ value }: { value: string }) => {
  const hashCode = (s: string) => s.split("").reduce((a, b) => { a = (a << 5) - a + b.charCodeAt(0); return a & a; }, 0);
  const seed = hashCode(value);
  const random = (s: number) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const bars = Array.from({ length: 60 }).map((_, i) => ({ width: random(seed + i) > 0.7 ? 2.5 : 1.5 }));
  const spacing = 1.5;
  const totalWidth = bars.reduce((a, b) => a + b.width + spacing, 0) - spacing;
  const svgWidth = 250, svgHeight = 70;
  let x = (svgWidth - totalWidth) / 2;
  return (
    <div className="flex flex-col items-center py-2">
      <svg xmlns="http://www.w3.org/2000/svg" width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="fill-current text-foreground">
        {bars.map((bar, i) => { const bx = x; x += bar.width + spacing; return <rect key={i} x={bx} y="10" width={bar.width} height="50" />; })}
      </svg>
      <p className="text-sm text-muted-foreground tracking-[0.3em] mt-2">{value}</p>
    </div>
  );
};

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  ticketId: string;
  amount: number;
  date: Date;
  paymentMethod: "cash" | "upi";
  /** Real UPI transaction ref / receipt URL from your order API. Required only for UPI. */
  qrValue?: string;
}

const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(
  ({ className, ticketId, amount, date, paymentMethod, qrValue, ...props }, ref) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const receiptRef = React.useRef<HTMLDivElement>(null);

    const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    const formattedDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date).replace(",", " •");

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
      if (!receiptRef.current) return;
      setIsGeneratingPdf(true);
      try {
        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");
        const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdfWidthMm = 80; // thermal-receipt width, keeps the PDF small
        const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;
        const pdf = new jsPDF({ unit: "mm", format: [pdfWidthMm, pdfHeightMm] });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidthMm, pdfHeightMm);
        pdf.save(`receipt-${ticketId}.pdf`);
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    return (
      <>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .receipt-print-root, .receipt-print-root * { visibility: visible; }
            .receipt-print-root { position: absolute; left: 0; top: 0; width: 80mm; }
            .no-print { display: none !important; }
          }
        `}</style>
        <div
          ref={(node) => { receiptRef.current = node; if (typeof ref === "function") ref(node); else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
          className={cn("receipt-print-root relative w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-lg font-sans z-10 animate-in fade-in-0 zoom-in-95 duration-500", className)}
          {...props}
        >
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />

          <div className="p-8 flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full animate-in zoom-in-50 delay-300 duration-500">
              <CheckCircleIcon className="w-10 h-10 text-primary animate-in zoom-in-75 delay-500 duration-500" />
            </div>
            <h1 className="text-2xl font-semibold mt-4">Payment successful</h1>
            <p className="text-muted-foreground mt-1">Your order has been placed</p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <DashedLine />

            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Order ID</p>
                <p className="font-mono font-medium">{ticketId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Amount</p>
                <p className="font-semibold text-lg">{formattedAmount}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase">Date & Time</p>
              <p className="font-medium">{formattedDate}</p>
            </div>

            {paymentMethod === "cash" ? (
              <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                <Banknote className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Cash</p>
                  <p className="text-muted-foreground text-sm">Paid in full</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 self-start">
                  <QrIcon className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">UPI</p>
                    <p className="text-muted-foreground text-sm">Paid in full</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-md">
                  <QRCode value={qrValue ?? ticketId} size={120} />
                </div>
              </div>
            )}

            <DashedLine />
            <Barcode value={ticketId} />
          </div>

          <div className="flex gap-3 px-8 pb-8 no-print">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button className="flex-1" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              <Download className="w-4 h-4 mr-2" /> {isGeneratingPdf ? "Generating…" : "Save PDF"}
            </Button>
          </div>
        </div>
      </>
    );
  }
);

AnimatedTicket.displayName = "AnimatedTicket";
export { AnimatedTicket };
```
