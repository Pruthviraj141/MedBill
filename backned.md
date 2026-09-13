STEP 5 — CONNECT THE EXISTING FRONTEND TO SQLITE-FIRST + D1 SYNC

Completed and verified:

✅ STEP 1 — SQLite + D1 schema
✅ STEP 2 — Hono + D1 backend
✅ STEP 3 — Local Capacitor SQLite data layer
✅ STEP 3B — SQLite terminal tests: 20/20 PASS
✅ STEP 4 — SQLite ↔ D1 sync engine
✅ STEP 4 — Sync test suite: 100% PASS

NOW integrate the EXISTING React frontend with the new offline-first data architecture.

==================================================
FINAL ARCHITECTURE
==================================================

React UI
   ↓
Local repository/service layer
   ↓
LOCAL SQLITE
   ↓
SyncService
   ↓
Cloudflare Worker + Hono
   ↓
D1

SQLite is the PRIMARY operational data source.

D1 is the cloud synchronized copy.

NORMAL USER ACTIONS MUST NOT WAIT FOR CLOUD SYNC.

==================================================
ABSOLUTE UI PROTECTION
==================================================

DO NOT redesign or visually modify:

- Billing
- Dashboard
- Orders
- Settings
- bottom navigation
- theme system
- typography
- spacing
- cards
- charts
- animations
- product cards
- checkout success UI

The existing UI is considered APPROVED.

This step is data-layer integration only.

==================================================
1. INSPECT CURRENT FRONTEND DATA FLOW
==================================================

Before changing anything, inspect:

- React Query providers
- useProducts
- useOrders
- useDashboard
- checkout flow
- settings hooks
- API client
- authentication hooks
- route loading behavior

Create a table:

SCREEN / ACTION | CURRENT DATA SOURCE | NEW DATA SOURCE

Do not modify until the current flow is understood.

==================================================
2. PRODUCTS
==================================================

Change product reads to LOCAL SQLITE.

Billing should load products from:

productsRepository

NOT:

fetch('/api/products')

during normal operation.

Product search:
→ local

Category filter:
→ local

Recent filter:
→ local

Product selection:
→ local

No network request for these actions.

Products should already exist in SQLite after bootstrap/synchronization.

==================================================
3. BILLING CART
==================================================

Cart state remains local.

These must NOT contact the network:

- add product
- increase quantity
- decrease quantity
- remove product
- calculate subtotal
- display total

Do not move cart state to D1.

==================================================
4. CHECKOUT
==================================================

Replace the current network-first checkout flow with:

Bill Now
→ checkoutService
→ SQLite transaction
→ success returned locally
→ trigger SyncService in background

SQLite transaction must already contain:

order
+
order_items
+
sync_queue

The user must NOT wait for D1.

The success screen should appear immediately after the local transaction succeeds.

DO NOT fake success.

A locally committed order is a legitimate POS success because it is safely persisted locally and queued for cloud synchronization.

==================================================
5. CASH
==================================================

Verify:

paymentMethod = CASH

flows through:

UI
→ checkoutService
→ SQLite
→ sync_queue
→ D1

No other payment method.

==================================================
6. UPI
==================================================

Verify:

paymentMethod = UPI

same local-first flow.

No Card.
No Other.

==================================================
7. TOTAL CALCULATION
==================================================

The displayed and stored total must equal:

sum(unit_price × quantity)

No:

tax
GST
service charge
convenience fee
surcharge

The frontend should use the same money representation established in STEP 1.

Do not duplicate conflicting money calculations in several components.

Use checkoutService as the source of truth.

==================================================
8. ORDERS SCREEN
==================================================

Change Orders data source to:

ordersRepository

Orders should load from SQLite first.

The Orders UI must work with:

internet OFF.

Show:

COMPLETED
VOIDED

according to the existing UI behavior.

Do not remove VOIDED orders from history.

==================================================
9. VOID TRANSACTION
==================================================

When user voids an order:

UI
→ ordersRepository.voidOrder()
→ SQLite transaction
→ enqueue sync operation
→ update UI immediately

Do not wait for D1.

Do not hard-delete.

Do not refresh entire application state unnecessarily.

==================================================
10. DASHBOARD
==================================================

Change Dashboard data source to:

dashboardRepository

Dashboard should calculate/read from LOCAL SQLITE first.

Required metrics:

- sales
- completed order count
- average bill
- sales activity
- peak hours
- top products
- payment mix
- recent orders

Only COMPLETED orders count.

VOIDED orders must not affect analytics.

Payment mix:
CASH
UPI

Do not call the cloud reports API just to display local dashboard data during normal operation.

==================================================
11. DASHBOARD REFRESH
==================================================

When a new local order is created:

Do NOT trigger several API refetches.

Instead:
- invalidate/update local repository data
- refresh Dashboard from SQLite when Dashboard is opened/active

Do not refetch products after checkout.

Do not fetch reports from D1 immediately after every order.

==================================================
12. SETTINGS
==================================================

Use settingsRepository for appropriate settings.

Keep purely local settings such as theme local if Step 1 defined them as local.

Do not send every theme change to D1.

==================================================
13. REACT QUERY
==================================================

React Query may still be used for UI/server state where useful, but it must no longer be treated as the primary database.

Do NOT blindly remove React Query.

Use it as a caching/orchestration layer around repository calls if helpful.

Do not create network queries for data that can be read locally.

Avoid:
- refetchOnWindowFocus storms
- repeated mount fetches
- unnecessary invalidations
- duplicate queries

==================================================
14. INITIAL APPLICATION BOOTSTRAP
==================================================

Application startup should:

1. initialize SQLite
2. ensure migrations
3. load local state
4. make the application usable
5. allow SyncService to synchronize in background

Do NOT block the UI while waiting for cloud synchronization.

For a fresh installation with no local products, perform the required initial cloud bootstrap/sync.

For an existing local installation, use SQLite immediately.

==================================================
15. AUTHENTICATION
==================================================

Preserve the existing authentication experience.

Do not introduce a new login architecture.

After authentication:

- local SQLite remains available
- sync credentials/session are used only when cloud operations are needed

Do not require an internet request for ordinary local POS interactions once the local app is initialized.

==================================================
16. NETWORK FAILURE
==================================================

Test:

Internet OFF.

Verify all normal POS operations continue:

- Billing
- product browsing
- search
- categories
- cart
- checkout
- Orders
- VOID
- Dashboard

Cloud sync should simply remain pending.

==================================================
17. NETWORK RESTORATION
==================================================

Test:

Internet ON.

SyncService should automatically process pending operations.

Verify:

SQLite order
→ sync_queue
→ Worker
→ D1

and:

successful sync
→ queue state updated

No duplicate orders.

==================================================
18. DO NOT DOUBLE-SYNC
==================================================

A single local checkout must NOT generate:

- multiple sync operations for the same order
- duplicate D1 orders
- duplicate order_items

Inspect React effects and mutation callbacks carefully.

A checkout success state should not accidentally trigger another checkout.

==================================================
19. LOCAL UI UPDATE
==================================================

When local data changes:

Update the visible screen immediately.

Examples:

Create order
→ Orders can immediately show it.

Void order
→ status immediately becomes VOIDED.

Dashboard
→ local metrics update based on SQLite.

Do not wait for cloud confirmation for local UI correctness.

==================================================
20. OFFLINE-FIRST PRODUCT BOOTSTRAP
==================================================

Products are cloud-managed.

For a new device:

D1
→ Worker
→ SQLite

For normal app use:

SQLite
→ UI

Only refresh products when synchronization says they have changed.

Do not download all products repeatedly.

==================================================
21. CLOUD SYNC STATUS
==================================================

Do not redesign the UI for sync status.

But expose a simple application-level state internally:

IDLE
SYNCING
SUCCESS
ERROR

and:

pendingCount

This will be used later if a small status indicator is needed.

==================================================
22. REMOVE DIRECT UI NETWORK CALLS
==================================================

Search the frontend for direct calls to:

fetch('/api/')
axios(...)
apiClient(...)
useQuery(...)
mutationFn(...)

For each one determine:

Can this data come from SQLite?

If yes:
→ replace with repository/service access.

Do not remove API calls that are genuinely cloud-only.

==================================================
23. FRONTEND DATA CONTRACT
==================================================

Make sure repository return values map cleanly to the existing UI types.

Do not alter UI data structures unnecessarily.

If an adapter is necessary:

SQLite model
→ domain model
→ existing UI model

Keep conversions centralized.

Do not duplicate mapping code across components.

==================================================
24. ERROR STATES
==================================================

Do not silently fall back to fake/demo data.

If SQLite fails:
show the existing appropriate application error state.

If sync fails:
local operation remains successful and data remains safe.

Sync errors must not break Billing.

==================================================
25. PERFORMANCE
==================================================

Measure the new local-first behavior.

Measure:

1. Billing initial data availability
2. Product search
3. Add cart item
4. Quantity change
5. Checkout
6. Orders open
7. Dashboard open

Important:

Add/remove/update cart operations must create ZERO network requests.

Checkout should create ZERO blocking network requests.

Dashboard should not require D1 to display local analytics.

==================================================
26. WEB DEVELOPMENT ENVIRONMENT
==================================================

Do NOT create an IndexedDB browser implementation.

Do NOT add `jeep-sqlite`.

Do NOT fake native SQLite as a production mechanism.

Keep the existing native Capacitor SQLite implementation.

If a development/browser test cannot execute native SQLite, clearly report that limitation rather than changing the production architecture.

==================================================
27. TEST SUITE
==================================================

Create/update automated integration tests where practical.

Test:

- Billing reads local products
- cart changes create no network requests
- CASH checkout writes SQLite
- UPI checkout writes SQLite
- checkout creates sync queue
- Orders reads SQLite
- VOID writes SQLite + sync queue
- Dashboard reads SQLite
- VOIDED excluded from analytics
- network unavailable does not break local operation
- restored network triggers sync
- duplicate sync remains idempotent

==================================================
28. FULL LOCALHOST TESTING
==================================================

Once integration is complete, the development environment should support:

Frontend:
http://localhost:5173

Worker:
http://localhost:8787

Local D1:
Wrangler local D1

Normal cloud-backed development requests go through:

localhost:5173
→ localhost:8787
→ local D1

But normal POS data operations should use:

localhost:5173
→ local SQLite/repository

where appropriate.

==================================================
29. TESTING PROCEDURE
==================================================

After implementation, provide exact commands for:

1. Start local Worker
2. Start frontend
3. Apply local D1 migrations
4. Seed/bootstrap test products
5. Open localhost
6. Test online operation
7. Disable network
8. Test offline operation
9. Re-enable network
10. Verify synchronization
11. Verify D1 contains exactly one copy of each order

Do not require Android Studio for the web development workflow.

==================================================
30. REGRESSION PROTECTION
==================================================

Run:

- npm run test:sqlite
- npm run test:sync
- backend typecheck
- frontend typecheck
- frontend build

Also test the existing UI manually.

Verify:

Billing
Dashboard
Orders
Settings
navigation
light mode
dark mode

have no visual regressions.

==================================================
31. MONGODB
==================================================

Do NOT delete MongoDB in this step.

Do not use MongoDB for new operations.

It remains temporarily only until final migration verification.

==================================================
32. FINAL REPORT
==================================================

Report:

1. Existing frontend data flow
2. New SQLite-first data flow
3. Files changed
4. Hooks/services changed
5. Direct network calls removed
6. Local operations now supported
7. Offline behavior
8. Sync trigger behavior
9. React Query changes
10. Performance measurements
11. Tests performed
12. Pass/fail
13. Any frontend compatibility issues
14. Any remaining MongoDB references

IMPORTANT:
STOP AFTER STEP 5.

Do NOT:
- redesign Dashboard
- redesign Billing
- add printer integration
- delete MongoDB
- make additional architectural changes

The goal is to connect the existing frontend to the already-tested local SQLite + sync architecture without changing its appearance.