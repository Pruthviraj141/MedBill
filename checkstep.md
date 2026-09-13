STEP 3B — COMPLETE LOCAL SQLITE TERMINAL VERIFICATION

DO NOT IMPLEMENT STEP 4.
DO NOT IMPLEMENT SYNC.
DO NOT MODIFY THE FRONTEND UI.
DO NOT CONNECT THE UI TO SQLITE.
DO NOT MODIFY D1.
DO NOT DELETE MONGODB.
DO NOT ADD INDEXEDDB.

We have already implemented the LOCAL SQLITE data layer in STEP 3.

Before building synchronization, I want to PROVE that the local data layer is correct.

==================================================
GOAL
==================================================

Create a terminal-based automated verification suite that tests the LOCAL DATA LAYER end-to-end.

The test must verify:

Repository logic
+
Checkout logic
+
SQLite transactions
+
Queries
+
Analytics
+
Sync queue
+
Persistence

The test must produce clear PASS/FAIL results.

==================================================
IMPORTANT ENVIRONMENT RULE
==================================================

The production Android app MUST continue using:

@capacitor-community/sqlite

Do not replace it.

Because native Capacitor SQLite cannot be executed directly from a normal Node.js terminal process, create a TEST-ONLY SQLite execution environment if necessary.

The test implementation must exercise the SAME repository/service interfaces and SQL/business logic used by the production SQLite layer as closely as practical.

Clearly distinguish:

TEST SQLITE
from
PRODUCTION CAPACITOR SQLITE

Do not introduce IndexedDB.

==================================================
1. CREATE ONE COMMAND
==================================================

Create:

npm run test:sqlite

It must run all local SQLite tests without requiring:
- Android Studio
- Android emulator
- D1
- internet
- MongoDB

==================================================
2. DATABASE INITIALIZATION
==================================================

Test:

- database opens
- schema initializes
- migration version is correct
- running initialization twice does not duplicate tables or data
- all expected tables exist

Expected tables:

products
orders
order_items
settings
sync_queue
sync_state

==================================================
3. PRODUCTS TESTS
==================================================

Test:

1. insert product
2. read product
3. read all active products
4. category filtering
5. product lookup by ID
6. inactive product behavior
7. product update
8. verify price is stored using the approved integer money representation

Verify returned repository objects have the exact expected fields/types.

==================================================
4. ORDER CREATION TEST
==================================================

Create a real local order through the existing checkout service.

Example:

Product:
Test Coffee
Price:
150

Quantity:
2

Payment:
CASH

Expected:

subtotal = 300
total = 300

Verify:

- order exists
- order ID exists
- invoice number exists
- status = COMPLETED
- payment_method = CASH
- subtotal = 300
- total = 300
- exactly one order exists
- exactly one/two/etc correct order_items exist

Do not bypass checkoutService by directly inserting the order for this test.

==================================================
5. UPI TEST
==================================================

Create a second order using:

payment_method = UPI

Verify:

- UPI accepted
- order persisted
- total correct
- status COMPLETED

==================================================
6. INVALID PAYMENT TEST
==================================================

Attempt:

CARD
OTHER

Both must fail.

No invalid order may be persisted.

==================================================
7. TAX / FEE TEST
==================================================

Search and validate the actual calculation path.

For multiple quantities verify:

total === subtotal

Verify there is no:

tax
GST
service charge
convenience fee
surcharge

The test should fail if any extra amount is introduced.

==================================================
8. PRICE / SNAPSHOT TEST
==================================================

Create product:

Coffee = ₹150

Create order.

Then update product:

Coffee = ₹200

Read the old order.

Expected:

old order item price remains ₹150.

Historical snapshot must NOT change.

==================================================
9. TRANSACTION ROLLBACK TEST
==================================================

Force an order creation failure after transaction start.

Verify:

- order not persisted
- order_items not persisted
- sync_queue entry not persisted
- no partial records remain

This is critical.

==================================================
10. SYNC QUEUE TEST
==================================================

After successful local checkout verify:

exactly one sync_queue record exists for the order.

Verify:

- entity ID is correct
- operation is correct
- payload is valid
- queue survives database close/reopen

Do NOT sync it to D1.

==================================================
11. VOID TEST
==================================================

Create completed order.

Void it using:

ordersRepository.voidOrder()

Verify:

status = VOIDED
voided_at exists
void_reason exists if supplied

Verify original:
- invoice number
- total
- payment method
- items

remain unchanged.

Verify no physical delete occurs.

Verify the void operation creates/updates the required sync_queue entry.

==================================================
12. HISTORY TEST
==================================================

Create:

3 COMPLETED orders
1 VOIDED order

Query order history.

Verify:

- completed orders exist
- voided order exists
- voided order is not physically deleted
- returned data matches expected structure

==================================================
13. DASHBOARD ANALYTICS TEST
==================================================

Create controlled local data.

For example:

Order A:
₹100 CASH
COMPLETED

Order B:
₹200 UPI
COMPLETED

Order C:
₹150 CASH
VOIDED

Expected dashboard totals:

Revenue = ₹300
Completed orders = 2
Average bill = ₹150

Payment mix:

CASH = ₹100
UPI = ₹200

VOIDED ₹150 must contribute to NONE of the above.

==================================================
14. TOP PRODUCTS TEST
==================================================

Create controlled orders with known quantities.

Verify top products are ranked by actual completed quantities/revenue according to the implemented Dashboard rule.

VOIDED order_items must not contribute.

==================================================
15. PEAK HOUR TEST
==================================================

Insert controlled completed orders at known timestamps.

Verify the repository/report query identifies the correct peak hour.

VOIDED orders must not affect peak-hour calculations.

==================================================
16. SALES ACTIVITY TEST
==================================================

Insert controlled orders at known times.

Verify local hourly/daily sales buckets are correct.

No duplicate buckets.

VOIDED orders excluded.

==================================================
17. PAYMENT MIX TEST
==================================================

Verify the local analytics result contains ONLY:

CASH
UPI

No:
CARD
OTHER

==================================================
18. RECENT ORDERS TEST
==================================================

Create several orders with known timestamps.

Verify:

- correct ordering
- newest first if that is the existing contract
- expected number returned
- VOIDED orders handled according to current Orders UI requirements

==================================================
19. SETTINGS TEST
==================================================

Test:

setSetting
getSetting
updateSetting
removeSetting

Verify persistence.

==================================================
20. DATABASE RESTART TEST
==================================================

Perform:

initialize
→ write data
→ close database
→ reopen database
→ read data

Verify:

products remain
orders remain
order_items remain
settings remain
sync_queue remains

Nothing should depend on React memory.

==================================================
21. MULTIPLE ORDER TEST
==================================================

Create at least 20 controlled local orders.

Verify:

- no duplicate IDs
- unique invoice numbers
- correct totals
- order items match their parent orders
- analytics remain correct

Do not leave uncontrolled junk data behind.

Use an isolated test database.

==================================================
22. FOREIGN KEY / DATA INTEGRITY TEST
==================================================

Verify order_items cannot become orphaned.

Verify each item belongs to a valid order.

If foreign-key enforcement is enabled by the implementation, explicitly verify it.

==================================================
23. RETURN VALUE / TYPE TEST
==================================================

For every repository operation verify the returned TypeScript object matches the expected interface.

Specifically check:

productsRepository
ordersRepository
dashboardRepository
settingsRepository
syncQueueRepository
checkoutService

Do not only verify "no exception happened".

Verify actual values.

==================================================
24. PERFORMANCE TEST
==================================================

Measure local operations:

- product read
- order creation
- order history
- dashboard analytics

Do NOT invent latency claims.

The purpose is only to confirm there is no unexpectedly expensive local operation.

==================================================
25. CLEAN TEST ENVIRONMENT
==================================================

All tests must run against an isolated TEST database.

Do NOT touch:
- production SQLite
- production D1
- MongoDB
- real café data

Clean the test DB after completion where appropriate.

==================================================
26. COMMAND OUTPUT
==================================================

Make the command output easy to understand:

========================================
TBT CAFE — SQLITE TEST SUITE
========================================

Database initialization        PASS
Migrations                     PASS
Products CRUD                 PASS
CASH checkout                  PASS
UPI checkout                   PASS
Invalid payment rejection      PASS
Subtotal / Total               PASS
No tax / fee                  PASS
Historical snapshot            PASS
Transaction rollback           PASS
Sync queue                     PASS
VOIDED order                   PASS
Order history                  PASS
Dashboard analytics            PASS
Top products                   PASS
Peak hour                     PASS
Sales activity                PASS
Payment mix                   PASS
Recent orders                 PASS
Settings                       PASS
Restart persistence            PASS
Multiple orders               PASS
Data integrity                PASS
Return types                  PASS

========================================
RESULT: ALL TESTS PASSED
========================================

==================================================
27. FAILURE DEBUGGING
==================================================

If a test fails:

- show test name
- expected result
- actual result
- exact error
- relevant file/line
- stop with non-zero exit code

Do not swallow failures.

==================================================
28. FINAL VERIFICATION
==================================================

Run:

npm run test:sqlite
npm run typecheck
npm run build

Do not modify UI.

Do not implement D1 sync.

Do not implement browser storage.

Do not modify the backend.

==================================================
FINAL REPORT
==================================================

Return:

1. Test command
2. Test database implementation
3. Number of tests
4. Pass/fail count
5. Full failing tests if any
6. Transaction verification result
7. Persistence verification result
8. Analytics verification result
9. Sync queue verification result
10. Typecheck result
11. Build result
12. What this proves
13. What this does NOT prove without Android
14. Whether STEP 4 is safe to begin

STOP AFTER TESTING.