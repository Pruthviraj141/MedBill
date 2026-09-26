import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "cn"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className?: string
  children: React.ReactElement
}) {
  const vars = Object.entries(config).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value?.color) acc[`--color-${key}`] = value.color
      return acc
    },
    {}
  )
  return (
    <div
      className={cn("w-full [&_.recharts-wrapper]:outline-none", className)}
      style={vars as React.CSSProperties}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function ChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return <Tooltip cursor={{ fill: "var(--muted, #f0ede8)", opacity: 0.5 }} {...props} />
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ value?: number | string; dataKey?: string | number; color?: string; payload?: any }>
  label?: string
  labelFormatter?: (value: string) => string
  formatter?: (value: number, key: string) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-bold text-foreground">
        {labelFormatter && label ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color ?? "var(--primary)" }}
          />
          {formatter && entry.dataKey
            ? formatter(Number(entry.value ?? 0), String(entry.dataKey))
            : entry.value}
        </p>
      ))}
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
