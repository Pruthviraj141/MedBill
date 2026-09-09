STEP 3 — REAL PERFORMANCE OPTIMIZATION AND MEASUREMENT

The backend business logic is now correct and the current application is working perfectly.

DO NOT redesign the frontend.
DO NOT change the visual UI.
DO NOT change invoice numbering.
DO NOT add security architecture.
DO NOT add Redis, WebSockets, Node server, or unnecessary infrastructure.

This step is ONLY about finding and removing actual backend performance bottlenecks.

IMPORTANT:
Do not call something "optimized" without checking the real code path.
Do not invent latency improvements.
Measure what can actually be measured.

==================================================
1. TRACE THE REAL REQUEST PATH
==================================================

Inspect these endpoints in the actual code:

GET /api/products
POST /api/orders
POST /api/orders/delete-transaction
GET /api/reports/:timeframe
GET /api/orders
POST /api/auth/login

For each endpoint identify:

- number of MongoDB operations
- sequential DB operations
- parallel DB operations
- unnecessary reads
- unnecessary writes
- unnecessary data transformation
- response payload size
- repeated queries
- expensive aggregation stages

Create a small internal performance table:

Endpoint | DB Calls | Expensive Operation | Main Bottleneck

==================================================
2. MONGODB CONNECTION PERFORMANCE
==================================================

Inspect the current MongoDB client/connection implementation.

Make sure:
- connection/client reuse is actually happening
- a new MongoDB connection is NOT created for every request
- initialization is not repeated unnecessarily
- connection options are appropriate for Cloudflare Workers
- there is no duplicate MongoDB initialization

Do not completely rewrite the DB layer unless necessary.

If there is an unavoidable MongoDB/Cloudflare network latency, identify it honestly rather than pretending Cloudflare removes it.

==================================================
3. PRODUCTS API
==================================================

The Billing screen uses products frequently.

Make GET /api/products as lightweight as possible.

Return only fields actually used by the current frontend.

Do not repeatedly query the same product data unnecessarily.

Do not add complicated caching.

Use a short, sensible cache only if the current frontend benefits from it and it does not create stale product behavior.

==================================================
4. ORDER CREATION — HIGHEST PRIORITY
==================================================

Inspect POST /api/orders in detail.

The checkout critical path must be as small as realistically possible.

Ideal flow:

validate request
→ fetch only required product data
→ calculate subtotal/total
→ assign invoice number
→ insert order
→ return success

Requirements:

- no tax
- no fees
- only CASH / UPI
- no inventory work
- no payments collection
- no audit collection
- no archived order logic

Do not make the API wait for analytics or unrelated work.

Do NOT use waitUntil() for anything required for the order to be considered successfully created.

Avoid duplicate product lookups.

Avoid fetching entire product documents.

Use projections.

Use Promise.all only where operations are genuinely independent.

Do not parallelize operations that introduce race conditions or incorrect invoice/order behavior.

==================================================
5. INVOICE COUNTER
==================================================

Inspect the existing counter implementation.

Keep the current invoice numbering behavior.

Check whether:
- counter query is unnecessary
- counter access is duplicated
- counter update can be performed in a single atomic operation

Do not redesign invoice semantics.

==================================================
6. ORDER HISTORY
==================================================

Inspect GET orders/history endpoint.

Make it lightweight.

Return only fields actually required by the existing Orders UI.

Use:
- appropriate projection
- sensible sorting
- pagination/limit if already compatible with the frontend

Do NOT load the entire order history into memory if the current implementation does.

Important:
Existing history must continue to show VOIDED orders.

==================================================
7. REPORTS / DASHBOARD API — HIGH PRIORITY
==================================================

Inspect the current reports aggregation.

The dashboard needs real data for:

- sales
- orders
- average bill
- sales activity
- peak hour
- top products
- payment mix
- recent orders

Check the current `$facet` pipeline carefully.

Do NOT assume `$facet` is automatically faster.

Identify expensive stages such as:
- `$unwind`
- `$group`
- `$toDate`
- unnecessary sorts
- unnecessary document scans
- repeated calculations

Make the smallest reasonable aggregation that returns exactly what the Dashboard needs.

VOIDED orders must be excluded from all normal business analytics.

Do not create fake metrics.

==================================================
8. INDEX VERIFICATION
==================================================

Inspect actual queries first.

Verify whether these indexes are genuinely useful:

orders:
{ cafeId: 1, status: 1, createdAt: -1 }

products:
appropriate index only if current queries benefit from it

Do not add indexes simply because they sound fast.

Avoid index duplication.

Explain briefly why each retained index exists.

==================================================
9. REMOVE UNNECESSARY REPORT CACHE
==================================================

Review the current Cloudflare report caching.

Do NOT automatically keep a fixed 45-second cache just because it was previously implemented.

Determine whether it actually helps the current single-café application.

The Dashboard should not show stale sales after a successful bill unnecessarily.

Do not cache authenticated business data publicly.

If caching is retained, make the cache behavior safe and intentional.

==================================================
10. FRONTEND QUERY / REFETCH AUDIT
==================================================

Inspect the frontend React Query/API hooks only as needed to understand backend request frequency.

Do NOT redesign the UI.

Look for:

checkout
→ order POST
→ multiple unnecessary invalidations
→ repeated reports request
→ repeated orders request
→ repeated products request

The objective is to prevent a single user action from triggering unnecessary backend calls.

Do not disable useful caching globally.

Do not set all stale times to 0.

Use targeted invalidation only where actual data changed.

==================================================
11. PAYLOAD SIZE
==================================================

Inspect API response payloads.

Remove fields that are not used by the current frontend.

Do not remove fields blindly.

Especially verify:
- products response
- order response
- history response
- report response

The mobile Android app should receive compact JSON.

==================================================
12. PERFORMANCE TESTING
==================================================

Run the backend and actually measure what is possible.

For each major endpoint record whatever can be reliably measured:

- request duration
- DB operation count
- response size

Test at least:

GET products
POST order
GET reports/today
GET orders

Run each several times so cold-start and warm-request behavior can be distinguished where possible.

Do not manufacture numbers.

Report:

WARM REQUEST
COLD/INITIAL REQUEST (if measurable)

If MongoDB network latency cannot be accurately isolated in the current local environment, explicitly state that.

==================================================
13. DO NOT BREAK THE WORKING APP
==================================================

After optimization verify:

- login works
- Billing loads
- products load
- product search works
- cart works
- CASH checkout works
- UPI checkout works
- invoice is generated correctly
- Orders page works
- VOIDED order remains in history
- Dashboard loads
- Dashboard excludes VOIDED orders
- no tax exists
- no CARD exists
- no inventory logic exists
- dark/light frontend behavior remains unchanged

Run frontend and backend type-check/build.

==================================================
FINAL REPORT
==================================================

Give me a concise but factual report:

1. Endpoint performance table
2. Number of DB calls before/after
3. MongoDB connection findings
4. Order checkout improvements
5. Report aggregation improvements
6. Indexes retained/changed
7. Cache changes
8. Frontend refetch changes
9. Payload reductions
10. Actual measured timings
11. Remaining bottleneck, if any

Do not claim "10x faster", "85% faster", etc. unless it was actually measured.

The goal is a genuinely fast café POS backend, not an impressive-looking architecture document.