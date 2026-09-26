import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportStatsPdf } from "../services/statsPdfService";
import { dashboardRepository } from "../db/repositories/dashboardRepository";

export function ExportPdfButton({
  period,
  report,
  variant = "desktop",
}: {
  period: string;
  report: any;
  variant?: "desktop" | "mobile";
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const monthly = await dashboardRepository.getMonthlyRevenue();
      exportStatsPdf(period, report ?? {}, monthly ?? []);
    } catch (err) {
      alert("PDF export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "mobile") {
    return (
      <button
        className="ml-3 p-[9px] bg-[#171615] dark:bg-[#131313] text-white/90 dark:text-[#EAD6C0] rounded-full border border-[#2B2B2B] active:scale-95 transition-all shadow-sm flex-none disabled:opacity-50"
        onClick={onClick}
        disabled={busy}
        aria-label="Export PDF report"
        title="Export PDF report"
      >
        {busy ? (
          <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
        ) : (
          <Download size={18} strokeWidth={2.5} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-primary/20 disabled:opacity-50"
    >
      {busy ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Download size={18} />
      )}
      Export PDF
    </button>
  );
}
