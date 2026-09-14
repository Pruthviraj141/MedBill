CRITICAL ANDROID PRODUCT BOOTSTRAP FAILURE + REMOVE ADMIN LOGIN

The newly rebuilt Android APK STILL opens with an empty Billing menu.

This means the previous pullCatalog() change did not actually solve the real Android runtime problem.

DO NOT ASSUME IT WORKS.
DO NOT JUST REBUILD AGAIN.
FIRST TRACE AND PROVE THE NATIVE ANDROID FLOW.

CURRENT PRODUCTION STATE:
- Remote Cloudflare D1 products = 51
- All 51 products are active
- Web production frontend successfully loads all 51 products
- Production Worker:
  https://cafe-pos-api.pruthvigavhane.workers.dev/api
- Android uses @capacitor-community/sqlite
- Android SQLite is intended to be the PRIMARY operational database

ARCHITECTURE MUST REMAIN:

Android
→ Native SQLite
→ Sync Queue
→ Cloudflare Worker
→ Cloudflare D1

==================================================
PART 1 — FIND THE REAL ANDROID FAILURE
==================================================

Inspect the CURRENT code and trace the COMPLETE native startup sequence.

Trace these exact points:

1. App.tsx startup
2. Capacitor native-platform detection
3. Native SQLite initialization
4. Database migrations
5. Product repository initialization
6. SyncService initialization
7. pullCatalog()
8. Actual HTTP request to:
   https://cafe-pos-api.pruthvigavhane.workers.dev/api/products
9. Response parsing
10. Product upsert into Native SQLite
11. useProducts() / product repository read
12. Billing rendering

Use Android adb/logcat if available.

ADD TEMPORARY DIAGNOSTIC LOGGING ONLY WHERE REQUIRED to prove each step.

We need explicit evidence for:

- SQLite initialized = YES/NO
- products table exists = YES/NO
- initial local product count = number
- pullCatalog() called = YES/NO
- Worker request reached = YES/NO
- Worker response status = number
- Worker response product count = number
- SQLite upsert executed = YES/NO
- final SQLite product count = number
- Billing query product count = number

DO NOT REMOVE THE DIAGNOSTICS UNTIL THE ROOT CAUSE IS IDENTIFIED.

==================================================
PART 2 — VERIFY THE NATIVE API REQUEST
==================================================

Do not assume browser fetch behavior is identical to Android.

Verify the ACTUAL Android runtime can request:

GET
https://cafe-pos-api.pruthvigavhane.workers.dev/api/products

Check for:
- network failures
- wrong base URL
- malformed endpoint
- JSON parsing issue
- CORS/runtime issue
- Capacitor/native HTTP issue
- authentication issue
- initialization timing issue

The expected response must contain 51 products.

If the Android request is failing, fix only that specific problem.

==================================================
PART 3 — MAKE FIRST-LAUNCH BOOTSTRAP RELIABLE
==================================================

The first Android launch MUST guarantee that the local catalog is initialized.

Desired behavior:

App starts
↓
SQLite initialized
↓
migrations complete
↓
check local products count
↓
if products are missing/empty:
    perform pullCatalog()
↓
wait for pullCatalog() to COMPLETE
↓
verify local product count > 0
↓
load Billing

Do NOT allow Billing to silently assume that products exist.

The bootstrap must be idempotent.

If products already exist:
- do not duplicate them
- update/upsert as appropriate

If the cloud request temporarily fails:
- do not crash the app
- keep any existing local catalog
- retry using the existing sync mechanism

==================================================
PART 4 — ADD A SAFE FIRST-LAUNCH FALLBACK
==================================================

IMPORTANT:

If the investigation proves that a fresh install can have ZERO products while the first cloud pull is unavailable, implement a SAFE offline bootstrap fallback using the CURRENT 51 real TBT Cafe products already present in the project.

The fallback must NOT replace D1 as the authoritative source.

Use this model:

FIRST LAUNCH:
1. Initialize SQLite.
2. Populate a bundled initial catalog snapshot ONLY if local products are empty.
3. Immediately attempt cloud catalog synchronization.
4. D1 remains authoritative for later updates.
5. Upsert cloud products into SQLite.
6. Never create duplicates.

This ensures:
- fresh install has a usable menu
- app works even without immediate internet
- D1 can update the local menu afterward

DO NOT invent products.
DO NOT change names/prices/categories.
Use ONLY the existing 51 real TBT Cafe products.

The fallback must be clearly marked in code as a bootstrap snapshot, not a second source of truth.

==================================================
PART 5 — REMOVE THE ADMIN LOGIN WINDOW
==================================================

The current Android app shows an unnecessary admin login such as:

admin
admin

This is NOT required for the café owner pilot.

Remove the admin login gate entirely.

Desired startup:

Open app
↓
Initialize SQLite/sync
↓
Billing screen

No:
- admin username
- admin password
- admin login form
- "admin/admin"
- developer login screen

Do NOT remove useful Settings functionality.
Do NOT remove the existing business screens.
Do NOT add another authentication system.
Do NOT redesign the UI.

The app should simply open directly to the normal POS experience.

==================================================
PART 6 — VERIFY BILLING AFTER BOOTSTRAP
==================================================

After the fix, a fresh Android installation must show:

- 51 products
- real product names
- real prices
- real categories
- category filtering
- search
- add to cart

The FIRST TIME the app opens after a clean install, the product count must be demonstrably > 0.

==================================================
PART 7 — TEST A REAL DEVICE
==================================================

After the code fix:

1. Build APK.
2. Install on a clean Android installation.
3. Clear app data / uninstall previous build first.
4. Open app.
5. Capture logcat if necessary.
6. Verify the local SQLite product count.
7. Verify Billing shows the 51 products.

Do NOT declare success based only on:
- TypeScript build
- Gradle build
- APK file size
- source-code inspection

SUCCESS REQUIRES REAL DEVICE PROOF.

==================================================
PART 8 — DO NOT TOUCH PRODUCTION DATA
==================================================

Do NOT:
- modify remote D1 schema
- delete products
- change product prices
- create orders
- seed test orders
- deploy unrelated backend changes

Remote D1 should remain:

products = 51
orders = 0
order_items = 0

==================================================
PART 9 — REMOVE TEMPORARY DEBUGGING AFTER PROOF
==================================================

Once the real root cause is found and fixed:
- remove temporary diagnostic logs if they are not useful in production
- keep only safe operational error logging

==================================================
FINAL ACCEPTANCE CRITERIA

Do NOT report "fixed" unless all are true:

[ ] No admin/admin login screen
[ ] Fresh Android install opens directly to POS
[ ] Native SQLite initializes
[ ] Products table exists
[ ] Android can reach production Worker
[ ] Worker returns 51 products
[ ] Products are stored in local SQLite
[ ] Local SQLite contains 51 products
[ ] Billing reads from local SQLite
[ ] Billing visibly shows the 51 products
[ ] App still works if internet is unavailable after bootstrap
[ ] Cloud sync remains functional
[ ] No MongoDB
[ ] No IndexedDB
[ ] No jeep-sqlite

FINAL REPORT MUST INCLUDE:

1. Exact root cause of the previous empty Android menu
2. Evidence from actual Android runtime/logcat
3. Files changed
4. Whether fallback catalog was needed
5. Final local SQLite product count on device
6. Confirmation that Billing displayed the products
7. Confirmation that admin/admin login was removed
8. APK exact path
9. Any remaining warnings

DO NOT declare success until the real Android device test proves the menu works.