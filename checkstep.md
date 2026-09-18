You are working on my existing **TBT Cafe POS** project.

THIS IS A DEBUGGING + PRODUCTION FIX TASK.

Do NOT redesign the architecture from your own assumptions.
Do NOT create a new backend/database if one already exists.
Do NOT replace working functionality unnecessarily.
Do NOT assume how the project works.
FIRST inspect the actual codebase, identify the current architecture and data flow, then make the required changes.

==================================================
PROJECT CONTEXT
===============

The application has:

* React + Vite frontend
* Capacitor Android application
* Hono backend
* Cloudflare Workers
* Cloudflare D1 database
* Android offline-first functionality using local SQLite/storage
* Web application that is already successfully communicating with the real production server/database

There are two clients:

1. Android application
2. Web/laptop application

THE MOST IMPORTANT REQUIREMENT:

### BOTH CLIENTS MUST REPRESENT THE SAME REAL CAFE DATA.

Android and Web must ultimately use the SAME production backend and SAME production D1 database.

There must NOT be:

* separate databases accidentally used by Android
* a development database accidentally used by Android
* a local-only database being treated as the source of truth
* different Worker URLs
* different API base URLs
* different authentication contexts
* different database bindings
* fake/mock/demo data
* hardcoded dashboard data
* an isolated Android backend
* duplicated datasets

Android may use SQLite/local storage ONLY as the offline cache / offline queue.

The production cloud database is the source of truth whenever synchronization is possible.

==================================================
CURRENT PROBLEM
===============

The Web application is currently syncing/working correctly with the real server.

The Android application is NOT behaving correctly.

I have created bills/orders/requests through Android while offline/online, and after some time the Android application is again showing ZERO / empty data.

This is unacceptable.

Previously created Android data appears to disappear from the Android UI.

I need you to determine exactly WHY this is happening.

Possible causes must NOT be guessed.

You must inspect and prove the real cause from the code.

Examples of things you MUST investigate:

* Android API base URL
* Capacitor configuration
* environment variables
* production vs development API URL
* Hono Worker URL
* Cloudflare Worker bindings
* D1 database binding
* database name/environment
* local SQLite initialization
* SQLite schema
* local migrations
* local database reset/recreation
* app startup logic
* seed logic
* sync logic
* pull sync
* push sync
* sync queue
* sync status
* conflict resolution
* API response handling
* authentication/session handling
* tenant/cafe ID
* user ID
* device ID
* filtering
* date filtering
* status filtering
* dashboard queries
* order queries
* product queries
* transaction queries
* deletion logic
* logout/login behavior
* app reinstall/reset behavior
* Capacitor lifecycle hooks
* background synchronization
* failed network requests
* retry handling
* race conditions
* stale local cache
* incorrect clearing of local storage
* wrong database/table names
* incorrect API routes
* production endpoint mismatches
* CORS
* HTTPS
* Cloudflare Worker environment bindings
* D1 migrations
* schema mismatch between Android and server
* timestamp/date conversion
* timezone issues
* integer/string ID mismatches
* duplicate ID handling
* UUID generation
* server-generated IDs
* client-generated IDs
* sync acknowledgment logic

==================================================
PHASE 1 — UNDERSTAND THE PROJECT FIRST
======================================

Before modifying code, inspect the ENTIRE relevant architecture.

Start by locating and reading:

* frontend package.json
* Android package/configuration
* Capacitor configuration
* all .env / .env.* files
* Hono entry point
* Hono route files
* database access layer
* D1 bindings
* Cloudflare configuration
* wrangler configuration
* database schema
* migrations
* authentication implementation
* API client implementation
* Android native code related to networking/database
* SQLite implementation
* offline queue implementation
* sync implementation
* order/billing repositories
* dashboard queries
* product queries
* all API endpoints used by Android
* all API endpoints used by Web

Search the codebase rather than assuming file names.

Trace the actual data lifecycle.

For an Android bill, document the exact current flow:

ANDROID UI
→ local transaction
→ SQLite/local store
→ sync queue
→ API client
→ Hono endpoint
→ Cloudflare Worker
→ D1
→ response
→ local sync state
→ UI refresh

For a Web bill, document:

WEB UI
→ API client
→ Hono endpoint
→ Cloudflare Worker
→ D1
→ response
→ Web UI

DO NOT CONTINUE UNTIL YOU UNDERSTAND THESE TWO FLOWS.

==================================================
PHASE 2 — PROVE THE DATABASE IS THE SAME
========================================

This is critical.

Verify that Android's online requests and Web's online requests point to the SAME:

* production Hono/Worker URL
* Cloudflare Worker
* environment
* D1 database
* D1 binding
* database schema
* tenant/cafe context

Check the actual runtime values.

Do not just inspect source files and assume.

Add temporary diagnostic logging where required.

Create a clear verification such as:

Android:
API BASE URL = ______
Worker = ______
Environment = ______
Authenticated user = ______
Cafe/Tenant = ______

Web:
API BASE URL = ______
Worker = ______
Environment = ______
Authenticated user = ______
Cafe/Tenant = ______

Confirm that both are writing and reading from the SAME production D1.

If they are not, FIX THAT FIRST.

==================================================
PHASE 3 — FIX OFFLINE-FIRST CORRECTLY
=====================================

The Android application MUST remain offline-first.

Required behavior:

### Scenario A — Android completely offline

User creates:

Bill #1001
Bill #1002
Bill #1003

The app must:

1. Save them locally immediately.
2. Display them immediately.
3. Keep them after app restart.
4. Mark them as pending sync.
5. NOT delete them merely because there is no internet.
6. NOT replace them with an empty server response.
7. NOT clear local data on startup.
8. NOT treat failed sync as successful sync.

Example local state:

bill 1001 = pending
bill 1002 = pending
bill 1003 = pending

### Scenario B — Internet comes back

Android must:

1. Detect connectivity.
2. Read pending records.
3. Send them to Hono.
4. Hono validates and writes them to D1.
5. Server returns success + canonical server ID.
6. Android marks the local record as synced.
7. The local record remains visible.
8. Android can pull the authoritative server state.
9. UI updates correctly.

### Scenario C — Sync fails

If one request fails:

* DO NOT delete the local record.
* DO NOT mark it as synced.
* Keep it pending/failed.
* Store useful error information.
* Retry later.

==================================================
PHASE 4 — SYNC MUST BE BIDIRECTIONAL
====================================

Do not implement only:

Android → Server.

We also need:

Server → Android.

Android needs to be able to recover its state from the production server.

For example:

Android local database accidentally becomes empty.

After authentication + sync:

Android should be able to pull the current authoritative cloud data and reconstruct the local cache.

Implement a reliable synchronization strategy.

At minimum, establish:

PUSH:
Local pending changes → Hono → D1

PULL:
D1 authoritative changes → Hono → Android local database

Use stable IDs.

Do NOT depend on array indexes.

Do NOT use temporary random IDs that can collide.

Design proper idempotency so that retrying the same bill does not create duplicates.

==================================================
PHASE 5 — PREVENT THE “SHOWING ZERO AGAIN” BUG
==============================================

This is the most important bug currently.

Find the exact code responsible for the Android screen returning to ZERO.

Investigate:

* app startup
* database initialization
* database clearing
* migrations
* state initialization
* API fetch
* failed API fetch
* empty API response
* cache replacement
* sync completion
* logout
* authentication refresh
* date range
* cafe ID
* filtering
* Zustand/Redux/context state if applicable
* React Query/TanStack Query cache if applicable
* SQLite query result handling

IMPORTANT:

An empty server response must NOT automatically mean:

“Delete all local records.”

For example:

If local SQLite contains:

100 bills

and the server request fails,

the app MUST NOT replace those 100 bills with:

[]

Instead:

* retain local data
* show cached/local data
* indicate sync status
* retry synchronization

Distinguish clearly between:

SUCCESS + ZERO RESULTS

and

REQUEST FAILED / OFFLINE / AUTH FAILED / SYNC FAILED.

These are NOT the same state.

==================================================
PHASE 6 — WEB MUST REMAIN WORKING
=================================

The Web application is already working with the real server.

Do NOT break it.

Any backend/database changes must be tested against both:

Android
AND
Web

When Android creates a bill online:

→ it must appear on Web.

When Web creates a bill:

→ it must become available to Android after synchronization.

When Android creates a bill offline:

→ after synchronization it must appear in D1 and therefore on Web.

This is the definition of success.

==================================================
PHASE 7 — DASHBOARD MUST BE FIXED
=================================

The dashboard currently does NOT show correct operational data.

Do not use mock values.

Do not calculate dashboard numbers separately from the actual source data unless there is a clear reason.

Dashboard must be driven from the SAME production data.

Audit every dashboard metric.

Examples:

* Today's sales
* Total orders
* Revenue
* Average order value
* Pending orders
* Completed orders
* Cancelled orders
* Top products
* Sales activity
* Peak hours
* Daily/weekly/monthly trends
* Payment method totals
* Product quantities
* Any KPI shown on the dashboard

For every metric verify:

1. What database table is the source?
2. What query is used?
3. What date/time range is used?
4. What timezone is used?
5. What filters are applied?
6. Does Android data appear?
7. Does Web data appear?
8. Are cancelled/refunded orders handled correctly?
9. Are duplicates possible?
10. Does the value match the raw database records?

Create a diagnostic/test dataset if necessary and manually verify calculations.

Example:

If D1 contains:

Order 1 = ₹100
Order 2 = ₹200
Order 3 = ₹300

dashboard TODAY'S SALES must show:

₹600

not:

₹0
₹300
₹6000
or some cached/mock number.

==================================================
PHASE 8 — TIMESTAMPS / TIMEZONE
===============================

Café reports depend on date/time.

Do not rely on inconsistent local date formatting.

Use a consistent timestamp strategy.

Store enough information to distinguish:

client_created_at
server_created_at
updated_at
synced_at

Be careful with:

India timezone
IST / UTC
day boundaries
"today"
"this week"
"this month"

A bill created at:

23:59 IST

must not incorrectly appear as the next day's sale because of a timezone conversion bug.

==================================================
PHASE 9 — LOGGING / DEBUGGING
=============================

Add useful development diagnostics for synchronization.

For every sync cycle, log enough information to identify:

SYNC START
device ID
user ID
cafe/tenant ID
pending record count
API endpoint
request ID
records sent
records accepted
records rejected
records skipped
server response
records marked synced
records remaining pending
SYNC END

Do not log sensitive credentials or tokens.

Add clear error handling.

For example:

SYNC FAILED
reason: network unavailable
pending records retained: 7
retry scheduled: yes

==================================================
PHASE 10 — DATABASE CONSISTENCY
===============================

Review the D1 schema and Android SQLite schema side by side.

They must have compatible representations for:

* order IDs
* bill IDs
* product IDs
* customer IDs if used
* timestamps
* numeric values
* status
* payment method
* sync state
* created_at
* updated_at
* deleted_at if soft-delete is used

Identify and fix mismatches.

==================================================
PHASE 11 — DO NOT DESTROY USER DATA
===================================

This is extremely important.

I have already created real billing data through Android.

DO NOT:

* wipe SQLite
* drop tables
* recreate the database unnecessarily
* reset D1
* delete production records
* run destructive migrations
* replace real data with seed/demo data

unless absolutely required and only when there is a safe migration path.

If existing local data currently exists, preserve it and migrate it.

If records cannot be safely migrated automatically, stop and report exactly why rather than destroying them.

==================================================
PHASE 12 — TEST MATRIX
======================

After implementing the fix, test all of these:

TEST 1:
Android online → create bill → verify D1 → verify Web

TEST 2:
Android offline → create bill → close app → reopen → verify bill remains

TEST 3:
Android offline → create 3 bills → reconnect → verify all 3 sync

TEST 4:
Android offline → create bill → internet returns → sync fails → verify bill remains pending

TEST 5:
Retry failed sync → verify only one server record exists

TEST 6:
Web creates bill → Android sync/pull → verify bill appears

TEST 7:
Android creates bill → Web refresh → verify bill appears

TEST 8:
Restart Android application → verify data remains

TEST 9:
Dashboard values match raw D1 data

TEST 10:
Today's date/reporting respects IST correctly

TEST 11:
Logout/login → verify authorized data remains available

TEST 12:
No network → dashboard should show cached/local information rather than falsely showing ZERO if local data exists

==================================================
PHASE 13 — IMPLEMENTATION RULE
==============================

Do not just give me suggestions.

Actually inspect and modify the existing project.

Use the existing architecture where possible.

Do not introduce unnecessary technologies.

Do not replace Hono.

Do not replace Cloudflare D1.

Do not remove offline-first Android functionality.

Do not convert Android into a purely online application.

Do not create a second production backend.

Do not create a second database.

==================================================
SUCCESS CRITERIA
================

The task is COMPLETE only when all of these are true:

1. Android and Web use the SAME production Hono/Cloudflare backend.

2. Both use the SAME production D1 database.

3. Android can create bills offline.

4. Offline bills survive app restarts.

5. Offline bills synchronize to D1 when internet returns.

6. Synced Android bills appear on Web.

7. Web-created bills appear on Android after synchronization.

8. Sync failures do not delete local data.

9. Duplicate sync attempts do not create duplicate bills.

10. Android no longer randomly returns to ZERO because of a failed/empty synchronization request.

11. Dashboard values are based on real production data.

12. Dashboard values match actual database records.

13. Date/time calculations are correct for India/IST.

14. Existing user data is preserved.

15. The implementation is stable enough for real café usage.

==================================================
FINAL REPORT REQUIRED
=====================

After fixing everything, give me a concise engineering report containing:

A. ROOT CAUSE
Exactly why Android was showing zero / losing its data.

B. WHAT WAS WRONG
List the actual code/configuration problems discovered.

C. WHAT YOU CHANGED
List the files and important changes.

D. DATA FLOW AFTER FIX
Show:

Android Offline
→ SQLite
→ Sync Queue
→ Hono
→ D1

Android Online
→ Hono
→ D1

Web
→ Hono
→ D1

E. DATABASE CONSISTENCY
Confirm whether Android and Web are using exactly the same production D1.

F. SYNC BEHAVIOR
Explain push + pull sync and retry behavior.

G. DASHBOARD
Explain the source and calculation for each important dashboard metric.

H. TEST RESULTS
Report the results of every test in the TEST MATRIX.

I. REMAINING ISSUES
Only mention issues that are actually proven to remain.

MOST IMPORTANT INSTRUCTION:

DO NOT TELL ME WHAT YOU "THINK" THE PROJECT IS DOING.

INSPECT THE ACTUAL CODE FIRST.

TRACE THE REAL DATA FLOW.

IDENTIFY THE REAL ROOT CAUSE.

THEN FIX IT.

Do not make assumptions simply because the project is offline-first.

The goal is not to create a theoretical architecture.

The goal is to make THIS EXISTING TBT CAFE POS work correctly with REAL DATA on BOTH ANDROID AND WEB.
