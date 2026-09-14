CRITICAL PRODUCTION SYNC VERIFICATION — V2 IS INSTALLED BUT WEB → ANDROID STILL DOES NOT WORK

The current V2 Android APK is already installed on the phone.

Observed behavior:
- Android → D1 → Web appears to work.
- Web → D1 → Android is still NOT working.
- Android and Web therefore show different order counts.

IMPORTANT:
DO NOT BUILD ANOTHER APK YET.

We need to determine whether the problem is:
1. Production Worker endpoint missing/not deployed
2. Android calling the wrong endpoint
3. SyncService not running
4. cursor initialization problem
5. timestamp filtering problem
6. response parsing problem
7. SQLite insertion problem
8. React Query/local cache refresh problem

This must be investigated against the CURRENT deployed code, not assumed from source code.

==================================================
PART 1 — VERIFY PRODUCTION WORKER
==================================================

Inspect the CURRENT backend source and identify the exact endpoint intended for:

D1 → Android order synchronization

Confirm:
- HTTP method
- exact path
- query parameters
- response format

Then verify whether that exact route exists in the CURRENT deployed Cloudflare Worker.

Use a read-only request if possible.

The production Worker is:

https://cafe-pos-api.pruthvigavhane.workers.dev/api

DO NOT create a production order yet.

If the endpoint is missing from the deployed Worker:
- state that clearly
- deploy ONLY the current backend code required for this endpoint
- do not change schema
- do not change products
- do not create test orders
- do not modify production order data

After deployment, verify the exact endpoint responds correctly.

==================================================
PART 2 — VERIFY PRODUCTION D1
==================================================

Verify production D1 remains:

products = 51

Do not modify orders during this phase.

==================================================
PART 3 — VERIFY ANDROID SYNC CODE
==================================================

Inspect CURRENT frontend source used by Android.

Trace exactly:

SyncService
→ pullSystem/pullCatalog
→ API request
→ response
→ insertCloudOrderBase
→ local SQLite
→ query invalidation
→ Orders/Dashboard

Confirm the V2 APK's intended code uses the same endpoint that is actually deployed.

Pay special attention to:
- API base URL
- `/api` prefix
- endpoint path
- HTTP method
- `last_sync` parameter
- cursor key
- timestamp format

==================================================
PART 4 — CURSOR BUG CHECK
==================================================

For a brand-new Android installation with zero local orders:

What value does `last_order_sync` contain?

It MUST allow Android to fetch existing D1 orders.

It must NOT initialize itself to the current time before the first pull.

Also verify:
- UTC handling
- milliseconds vs seconds
- `created_at`
- `voided_at`
- `>` vs `>=`

==================================================
PART 5 — LOCAL SQLITE INSERT
==================================================

Confirm:

insertCloudOrderBase()

actually inserts:
- order
- order_items

into Native SQLite.

Confirm it:
- preserves order ID
- preserves invoice
- does not enqueue pulled orders for outbound sync
- runs transactionally

==================================================
PART 6 — DO NOT ASSUME QUERY INVALIDATION FIXES EVERYTHING
==================================================

Verify whether Orders/Dashboard actually read from local SQLite after sync.

If the data is successfully inserted into SQLite but the UI still shows old data, identify exactly which query/cache must be refreshed.

Do not blindly add invalidation calls.

==================================================
PART 7 — LOCAL AUTOMATED REPRODUCTION
==================================================

Before touching production order data, reproduce the exact Web → D1 → Android flow locally.

Create:
- one Web-originated order in local D1

Then execute the Android pull flow.

Prove:

D1 order count = 1
↓
Android pull response contains 1 order
↓
SQLite order count = 1
↓
SQLite item count = correct
↓
sync queue did NOT receive the pulled order
↓
second pull does NOT duplicate it

Actually execute this test.

Do not say "logically verified".

==================================================
PART 8 — PRODUCTION DEPLOYMENT RULE
==================================================

If the production Worker is missing the sync endpoint:

DEPLOY the current backend Worker after local validation.

Do not rebuild Android solely because of a backend deployment.

If Android source code also needs changes:
THEN build a NEW APK.

If Android code does NOT need changes:
the existing APK may be sufficient after the Worker fix.

Determine this from the actual code.

==================================================
PART 9 — FINAL MANUAL TEST PREPARATION
==================================================

Only after the above passes, report the exact manual production test:

WEB:
create ONE test order

Then:
D1
→ Android sync
→ Android Orders

We will perform that manually afterward.

Do NOT create that production order during this diagnostic phase.

==================================================
FINAL REPORT
==================================================

Return exactly:

1. Production Worker sync endpoint:
   EXISTS / MISSING

2. Is the endpoint deployed?
   YES / NO

3. Exact production endpoint:
   <method + path>

4. Android V2 calls:
   <method + path>

5. Do they match?
   YES / NO

6. First-sync cursor behavior:
   CORRECT / BUG

7. Timestamp handling:
   CORRECT / BUG

8. SQLite cloud-order insertion:
   PASS / FAIL

9. UI refresh after SQLite sync:
   PASS / FAIL

10. Local Web → D1 → Android test:
    PASS / FAIL
    with actual counts

11. Production deployment required?
    YES / NO

12. Android APK rebuild required?
    YES / NO
    Explain why.

DO NOT create production test orders.
DO NOT modify production D1 data unless deploying backend code requires no data changes.
DO NOT build another APK yet unless the report proves Android code must change.
STOP.