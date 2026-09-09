# Frontend Audit

Date: 2026-09-09
Scope: frontend UI, data fetching, responsive performance, and current API contracts.

## Verified Findings

- `Billing.tsx` is the largest React screen at 193 lines. `Dashboard.tsx` is 92 lines, `Products.tsx` is 77 lines, `Orders.tsx` is 54 lines.
- Server data is fetched manually with `useEffect` in Dashboard, Billing, Orders, and Products. There is no query/cache layer, so screen mounts can repeat requests and there is no shared stale-time policy.
- `Dashboard` and `Billing` both use a `useRef` loading guard, but data is still owned locally and remounting a screen refetches it.
- The API client is centralized for GET/POST and attaches `auth_token`. No frontend source references `localhost`, `127.0.0.1`, or `8787`; the deployed base URL is supplied through `VITE_API_BASE_URL`.
- Current UI type contracts do not fully match the backend: backend orders use `grandTotal`, while the frontend reads `total`; backend products use `categoryId`, while the UI reads `category`; backend order creation expects `{ productId, quantity }`, while Billing sends display fields too.
- The current stylesheet is compressed into one dense line in `styles.css`; layout is primarily desktop-oriented with fixed header/content assumptions and no explicit `100dvh`, keyboard, or safe-area handling beyond the viewport meta tag.
- No `React.memo` children currently exist, so inline handlers are not currently causing memoized-child churn. Product cards are not memoized.
- The frontend package currently contains React, Capacitor, Lucide, and Vite only. The requested pinned TanStack Query, Zustand, shadcn/Radix, react-hook-form, zod, date-fns, and Recharts packages are not installed.

## Request Baseline

- App startup mounts Dashboard only after a token exists.
- Dashboard mounts one reports request.
- Billing mounts one products request.
- Tapping a product updates local cart state only; it does not call the backend.
- Orders and Products each fetch independently on mount.

## Runtime Checks

- Existing production frontend build passed before this overhaul: `npm run build`.
- A browser profiler pass, Network panel capture, and 360-430px screenshots were not available through the current workspace tools during audit creation. The code audit above is therefore the source-grounded baseline for those items.
- Backend is intentionally outside this UI/UX pass and remains unchanged by this audit.

## Planned Repair Order

1. Install only the libraries explicitly allowed by the master prompt and establish one query client, typed API errors, and a local cart store.
2. Rebuild Billing around cached products, stable product cards, a mobile cart sheet/sticky checkout surface, and a real checkout mutation.
3. Correct API types and empty/loading/error states across Dashboard, Orders, and Products.
4. Add route-level lazy loading, mobile safe-area/keyboard behavior, and responsive tokens without changing the product's business behavior.
5. Build and perform narrow-width overflow checks at 360, 375, 390, 412, and 430px.
