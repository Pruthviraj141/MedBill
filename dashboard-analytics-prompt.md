# PROMPT FOR AGENT - Dashboard / Analytics Home Screen Final Polish

Reuse everything already built in this repo: existing design tokens (spacing/radius/color/motion vars), existing TanStack Query setup, existing shadcn components. Do not recreate any of that. Do not touch the backend unless Section 6 applies.

## Prerequisites (run only what's missing)
```
npx shadcn@latest add chart tabs badge skeleton separator scroll-area
```
Skip anything already installed. No other new packages.

## 1. Screen structure (top to bottom, exact order)
1. Header: cafe name, "Today" label, online/offline Badge - reuse existing.
2. Primary Revenue Card - largest element on screen, tabular-nums, Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'}).
3. Secondary row: Orders count, Average Bill - two compact cards.
4. Period control: Tabs - Today / Week / Month. This single control drives every section below it (one shared period state, not per-section).
5. Sales Activity - shadcn Chart (Recharts area/line), isAnimationActive={false}.
6. Peak Hours - hand-rolled bars (plain divs), hour buckets, no charting library.
7. Day-of-Week breakdown - only rendered when period is Week or Month. Same hand-rolled bar style as Peak Hours.
8. Top Products - Product / Units / Revenue rows, top 5.
9. Payment Mix - proportional bar, fixed color per method (reuse the color tokens from the color-system work already done - do not introduce new colors here).
10. Recent Orders - last 5, link to full paginated Orders screen.

## 2. Data contract (map these to your real API/hooks - do NOT rename backend fields, adapt the mapping instead)
```ts
interface DashboardSummary { revenueToday: number; ordersToday: number; avgBillToday: number; isOnline: boolean; }
interface SalesPoint { label: string; revenue: number; }
interface PeakHourPoint { hourLabel: string; orders: number; }
interface DayOfWeekPoint { dayLabel: string; revenue: number; }
interface TopProduct { name: string; units: number; revenue: number; }
interface PaymentMixEntry { method: "cash" | "upi" | "card" | "other"; amount: number; }
interface RecentOrder { id: string; total: number; itemCount: number; createdAt: string; }
```
One useQuery per section, all keyed by period, all firing in parallel (no waterfall). staleTime: summary 60s, everything else 60s, refetch on period change only.

## 3. Loading / empty / error (mandatory per section, independent of each other)
- Loading: Skeleton shaped like the real content, per section - a slow chart query must never block the revenue card or any other section from rendering.
- Empty: real "not enough data" message per section (e.g. "No sales yet today", "Not enough data for this range") - never fabricate numbers, never hide the section.
- Error: short message + Retry button that refetches just that section's query.

## 4. Motion & visual
- Section fade/slide-in on mount only, 150-200ms, once - no continuous or repeated animation.
- Separators/spacing (not heavy borders) between sections, using existing tokens.
- No new colors - Payment Mix and any status badges reuse the existing fixed accent tokens.

## 5. Performance
- Chart data passed to the Chart component must be useMemo'd from the query result.
- Changing the period Tabs must only refetch the affected queries - do not remount or re-render the whole page.
- No full-page spinner blocking the entire screen while any single section loads.

## 6. If real time-pattern data is missing
If Peak Hours / Day-of-Week require an aggregation your backend doesn't currently expose, add the minimum necessary endpoint/aggregation reusing existing order data - state clearly that this touched the backend and why. Otherwise, do not touch the backend.

## Definition of done
- [ ] Every number on screen traces to a real API response - zero hardcoded/fake values.
- [ ] Switching Today/Week/Month updates all sections correctly and independently.
- [ ] No section blocks another from rendering.
- [ ] Empty states verified against an account/day with zero orders.
- [ ] npm run build - no TypeScript errors, no console errors.
