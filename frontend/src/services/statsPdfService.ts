import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney } from "../utils/format";

const INK = "#2C1809";
const CREAM = "#F5EBDD";
const CREAM_DARK = "#EAD6C0";
const MUTED = "#8A7B6C";
const ACCENT = "#8A5A33";

type ReportLike = {
  revenue?: number;
  orders?: number;
  averageBill?: number;
  paymentBreakdown?: Array<{ method: string; amount: number }>;
  topProducts?: Array<{ name: string; sold: number; revenue: number }>;
  peakHour?: string | null;
};

function money(v: number): string {
  return formatMoney(Math.round(Number(v) || 0))
    .replace(/\.00$/, "")
    .replace("₹", "Rs. ");
}

function periodLabel(period: string): string {
  const p = period.toLowerCase();
  if (p === "week") return "Last 7 days";
  if (p === "month") return "Last 30 days";
  return "Today";
}

export type MonthlyRow = { label: string; revenue: number; orders: number };

export function exportStatsPdf(
  period: string,
  report: ReportLike,
  monthly: MonthlyRow[]
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const revenue = Number(report.revenue ?? 0);
  const numOrders = Number(report.orders ?? 0);
  const avgBill = Number(report.averageBill ?? 0);

  const payments = (report.paymentBreakdown ?? []).filter(
    (p) => p.method === "CASH" || p.method === "UPI"
  );
  const payTotal = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const upi = payments.find((p) => p.method === "UPI")?.amount ?? 0;
  const cash = payments.find((p) => p.method === "CASH")?.amount ?? 0;

  const topProducts = [...(report.topProducts ?? [])]
    .sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0))
    .slice(0, 8);

  const now = new Date();
  const stamp = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Header band
  doc.setFillColor(INK);
  doc.rect(0, 0, pageW, 44, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TBT CAFÉ", margin, 17);
  doc.setFontSize(11);
  doc.setTextColor(CREAM_DARK);
  doc.setFont("helvetica", "normal");
  doc.text("Business Performance Report", margin, 25);
  doc.setFontSize(10);
  doc.setTextColor("#FFFFFF");
  doc.text(periodLabel(period), pageW - margin, 17, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(CREAM_DARK);
  doc.text(`Generated ${stamp}`, pageW - margin, 25, { align: "right" });
  doc.setDrawColor(CREAM_DARK);
  doc.setLineWidth(0.6);
  doc.line(margin, 32, pageW - margin, 32);
  doc.setFontSize(9);
  doc.text(
    `${numOrders} orders  •  Peak ${report.peakHour ?? "--"}`,
    margin,
    38
  );

  let y = 54;

  // KPI cards
  const kpis = [
    { label: "REVENUE", value: money(revenue) },
    { label: "ORDERS", value: String(numOrders) },
    { label: "AVG BILL", value: money(avgBill) },
  ];
  const gap = 4;
  const cardW = (contentW - gap * 2) / 3;
  kpis.forEach((k, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(CREAM);
    (doc as any).roundedRect(x, y, cardW, 24, 2.5, 2.5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(MUTED);
    doc.text(k.label, x + 4, y + 8);
    doc.setFontSize(15);
    doc.setTextColor(INK);
    doc.text(k.value, x + 4, y + 17);
  });
  y += 32;

  const section = (title: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(ACCENT);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;
  };

  // Payment mix with stacked bar
  section("Payment mix");
  const barY = y;
  const barH = 6;
  if (payTotal > 0) {
    const upiW = (Number(upi) / payTotal) * contentW;
    doc.setFillColor(CREAM_DARK);
    doc.rect(margin, barY, contentW, barH, "F");
    doc.setFillColor(ACCENT);
    doc.rect(margin, barY, upiW, barH, "F");
  } else {
    doc.setFillColor(CREAM);
    doc.rect(margin, barY, contentW, barH, "F");
  }
  y += 11;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(INK);
  const upiPct = payTotal > 0 ? Math.round((Number(upi) / payTotal) * 100) : 0;
  const cashPct = payTotal > 0 ? Math.round((Number(cash) / payTotal) * 100) : 0;
  doc.text(`UPI  ${upiPct}%  •  ${money(Number(upi))}`, margin, y);
  doc.text(
    `Cash  ${cashPct}%  •  ${money(Number(cash))}`,
    pageW - margin,
    y,
    { align: "right" }
  );
  y += 9;

  // Top products
  section("Top products");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Item", "Qty sold", "Revenue"]],
    body: topProducts.length
      ? topProducts.map((p, i) => [
          String(i + 1).padStart(2, "0"),
          p.name,
          String(p.sold ?? 0),
          money(Number(p.revenue ?? 0)),
        ])
      : [["—", "No sales in this period", "", ""]],
    theme: "grid",
    styles: { fontSize: 9, textColor: INK, cellPadding: 2.5 },
    headStyles: { fillColor: INK, textColor: "#FFFFFF", fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 24 },
      3: { halign: "right", cellWidth: 30 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 9;

  // Monthly revenue (all months) + lifetime total
  section("Monthly revenue");
  const lifetimeRevenue = monthly.reduce((s, m) => s + Number(m.revenue ?? 0), 0);
  const lifetimeOrders = monthly.reduce((s, m) => s + Number(m.orders ?? 0), 0);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Month", "Orders", "Revenue"]],
    body: monthly.length
      ? monthly.map((m) => [m.label, String(m.orders ?? 0), money(Number(m.revenue ?? 0))])
      : [["—", "", "No sales recorded yet"]],
    foot: monthly.length
      ? [["Overall till now", String(lifetimeOrders), money(lifetimeRevenue)]]
      : [],
    theme: "grid",
    styles: { fontSize: 9, textColor: INK, cellPadding: 2.5 },
    headStyles: { fillColor: INK, textColor: "#FFFFFF", fontStyle: "bold" },
    footStyles: { fillColor: CREAM, textColor: INK, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right", cellWidth: 26 },
      2: { halign: "right", cellWidth: 34 },
    },
  });

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(
      `TBT Café POS  •  Page ${i} of ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const day = now.toISOString().slice(0, 10);
  doc.save(`TBT-Report-${period}-${day}.pdf`);
}
