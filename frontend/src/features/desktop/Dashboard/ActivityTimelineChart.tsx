import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts"
import { BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../../components/ui/chart"
import { formatMoney } from "../../../utils/format"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#8A5A33",
  },
  orders: {
    label: "Orders",
    color: "#C9956A",
  },
} satisfies ChartConfig

type Bucket = { label: string; revenue: number; orders: number }

function hourLabel(hour: number): string {
  const h = hour % 24
  const suffix = h >= 12 ? "PM" : "AM"
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve}${suffix}`
}

function buildBuckets(
  period: string,
  densePeakHours: Array<{ hour: number; orders: number }>,
  denseWeekdays: Array<{ day: string; revenue: number }>,
  orders: any[]
): Bucket[] {
  if (period === "today") {
    const todayStr = new Date().toDateString()
    const revenueByHour = new Map<number, number>()
    for (const o of orders ?? []) {
      const ts = o.createdAt ?? o.created_at
      if (!ts) continue
      const d = new Date(ts)
      if (Number.isNaN(d.getTime()) || d.toDateString() !== todayStr) continue
      const h = d.getHours()
      const total = Number(o.grandTotal ?? o.total ?? 0) || 0
      revenueByHour.set(h, (revenueByHour.get(h) ?? 0) + total)
    }
    return densePeakHours.map((pt) => ({
      label: hourLabel(pt.hour),
      revenue: Math.round(revenueByHour.get(pt.hour) ?? 0),
      orders: Number(pt.orders) || 0,
    }))
  }

  const ordersByDay = new Map<string, number>()
  const revenueByDay = new Map<string, number>()
  const now = Date.now()
  const windowMs =
    period === "week" ? 7 * 86400000 : 30 * 86400000
  for (const o of orders ?? []) {
    const ts = o.createdAt ?? o.created_at
    if (!ts) continue
    const d = new Date(ts)
    if (Number.isNaN(d.getTime()) || now - d.getTime() > windowMs) continue
    const day = d.toLocaleDateString("en-US", { weekday: "short" })
    ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1)
    const total = Number(o.grandTotal ?? o.total ?? 0) || 0
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + total)
  }
  return denseWeekdays.map((pt) => ({
    label: pt.day,
    revenue: Math.round(Math.max(Number(pt.revenue) || 0, revenueByDay.get(pt.day) ?? 0)),
    orders: ordersByDay.get(pt.day) ?? 0,
  }))
}

const descriptions: Record<string, string> = {
  today: "Hourly sales · 6 AM – 11 PM",
  week: "Sales by weekday · last 7 days",
  month: "Sales by weekday · last 30 days",
}

export function ActivityTimelineChart({
  period,
  densePeakHours,
  denseWeekdays,
  orders,
}: {
  period: string
  densePeakHours: Array<{ hour: number; orders: number }>
  denseWeekdays: Array<{ day: string; revenue: number }>
  orders: any[]
}) {
  const [activeChart, setActiveChart] =
    React.useState<"revenue" | "orders">("revenue")

  const chartData = React.useMemo(
    () => buildBuckets(period, densePeakHours, denseWeekdays, orders),
    [period, densePeakHours, denseWeekdays, orders]
  )

  const total = React.useMemo(
    () => ({
      revenue: chartData.reduce((acc, curr) => acc + curr.revenue, 0),
      orders: chartData.reduce((acc, curr) => acc + curr.orders, 0),
    }),
    [chartData]
  )

  const peakIndex = React.useMemo(() => {
    let best = -1
    let bestVal = -1
    chartData.forEach((b, i) => {
      const v = activeChart === "revenue" ? b.revenue : b.orders
      if (v > bestVal) {
        bestVal = v
        best = i
      }
    })
    return bestVal > 0 ? best : -1
  }, [chartData, activeChart])

  const isEmpty = total.revenue === 0 && total.orders === 0

  return (
    <Card className="desktop-card gap-0 border-border/80 bg-card/60 py-0 shadow-sm backdrop-blur-md">
      <CardHeader className="flex flex-col items-stretch gap-0 border-b border-border/40 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <BarChart3 size={20} className="text-primary dark:text-[#EAD6C0]" />
            Activity Timeline
          </CardTitle>
          <CardDescription className="text-[13px] font-semibold">
            {descriptions[period] ?? descriptions.today}
          </CardDescription>
        </div>
        <div className="flex">
          {(["revenue", "orders"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative flex flex-1 flex-col justify-center gap-1 border-t border-border/40 px-6 py-4 text-left data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-5"
              onClick={(e) => {
                e.stopPropagation()
                setActiveChart(key)
              }}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-black tracking-tight tabular-nums text-foreground sm:text-2xl">
                {key === "revenue"
                  ? formatMoney(total.revenue).replace(/\.00$/, "")
                  : total.orders.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 py-4 sm:px-4 sm:py-5">
        {isEmpty ? (
          <div className="flex h-[250px] w-full items-center justify-center text-sm font-bold text-muted-foreground">
            No activity yet for this period.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={8}
                tick={{ fontSize: 11, fontWeight: 600, fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) =>
                      period === "today" ? `${value} · Today` : value
                    }
                    formatter={(value: number, key: string) =>
                      key === "revenue"
                        ? formatMoney(value).replace(/\.00$/, "")
                        : `${value} order${value !== 1 ? "s" : ""}`
                    }
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={0} maxBarSize={44}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    opacity={peakIndex === -1 || i === peakIndex ? 1 : 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
