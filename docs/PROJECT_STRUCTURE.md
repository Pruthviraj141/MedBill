# Project Directory Structure

Complete structural map of the decoupled TBT POS repository architecture.

```text
cafe-pos-v1/
├── frontend/                     # Mobile-First Next-Gen React UI
│   ├── android/                  # Heavily isolated Capacitor Gradle OS files
│   ├── build/                    # Output from bundlers
│   ├── public/                   # Static unhashed imagery (PWA icons, menu logos)
│   ├── scripts/                  # Unit tests (Mock Sync integration)
│   ├── src/
│   │   ├── app/                  # Main Router and Native DB loader block (App.tsx)
│   │   ├── components/           # Generic non-specific Shadcn/Tailwind UI buttons
│   │   ├── db/                   # Native SQLite execution layers
│   │   │   ├── migrations.ts     # Android-SQLite strict DDL table scripts
│   │   │   ├── repositories/     # Class abstraction for SQLite querying
│   │   │   └── defaultCatalog.ts # Critical fallback JSON matrix for offline setups
│   │   ├── features/             # Business Logic Panels (Billing, Orders, Settings)
│   │   ├── hooks/                # Specialized DB query accessors (e.g., useOrders)
│   │   ├── lib/                  # Library configurators (QueryClient, Tailwind utils)
│   │   └── services/             # Core Logic Daemons (syncService background loop)
│   └── package.json              # Capacitor / Vite Dependency mapping
│
├── backend/                      # Cloudflare Worker Edge Integration
│   ├── migrations/               # Remote D1 SQL schema histories
│   ├── src/                      # Hono API logic
│   │   ├── index.ts              # Global edge network router
│   │   └── routes/               # Modularized routing tables (Products, Orders, Auth)
│   ├── wrangler.toml             # Absolute deployment bindings mapping code to D1
│   └── package.json              # Wrangler / Hono dependency mapping
│
└── docs/                         # You are here
```

## Editing Recommendations:
- Changes to **Database Schemas** typically demand editing *both* `frontend/src/db/migrations.ts` (For Android) and `backend/migrations/` (For D1).
- Avoid manually pushing files into `frontend/android/`. Capacitor dynamically mirrors Native properties through the `capacitor.config.ts` generator and explicit sync routines.
