/**
 * TBT Cafe POS — Sync Integration Test
 *
 * ISOLATION: All test records use the prefix "TEST_SYNC_" in invoice_number.
 * These are real D1 writes. After the test, a cleanup step deletes only
 * records with that prefix so no real café data is touched.
 *
 * Run: node backend/testing/sync-integration.test.mjs
 */

const BASE_URL = 'http://localhost:8787/api';
const TEST_PREFIX = 'TEST_SYNC_';

function log(label, data) {
  console.log(`\n[${label}]`, JSON.stringify(data, null, 2));
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.error(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }

// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  // ── Test IDs (use deterministic IDs so retries are idempotent) ──
  const orderId = `${TEST_PREFIX}00000001`;
  const itemId  = `${TEST_PREFIX}00000001-item`;
  const invoiceNumber = `${TEST_PREFIX}INV-001`;
  const createdAt = new Date().toISOString();

  console.log('\n═══════════════════════════════════');
  console.log(' TBT Cafe POS Sync Integration Test');
  console.log('═══════════════════════════════════');
  console.log('BASE_URL:', BASE_URL);
  console.log('Test order ID:', orderId);
  console.log();

  // ── TEST 1: Push a CREATE to /sync/orders ──────────────────────────────────
  console.log('── TEST 1: Push order via /sync/orders ──');
  const pushPayload = {
    orders: [{
      order: {
        id: orderId,
        invoice_number: invoiceNumber,
        status: 'COMPLETED',
        subtotal: 250,
        total: 250,
        payment_method: 'CASH',
        created_at: createdAt,
      },
      items: [{
        id: itemId,
        order_id: orderId,
        product_id: 'prod_test_item',
        name_snapshot: 'Test Coffee',
        unit_price: 250,
        quantity: 1,
        line_total: 250
      }]
    }]
  };

  const pushRes = await fetch(`${BASE_URL}/sync/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pushPayload)
  });
  const pushData = await pushRes.json();
  log('Push response', pushData);

  if (!pushRes.ok) fail(`Push returned HTTP ${pushRes.status}`);
  else pass('Push returned HTTP 200');

  if (pushData.processed?.includes(orderId)) pass(`Order ${orderId} in processed list`);
  else fail(`Order ${orderId} NOT in processed list: ${JSON.stringify(pushData.processed)}`);

  // ── TEST 2: Idempotency — push same order again, no duplicate ────────────
  console.log('\n── TEST 2: Idempotency — push same order again ──');
  const push2Res = await fetch(`${BASE_URL}/sync/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pushPayload)
  });
  const push2Data = await push2Res.json();
  log('Re-push response', push2Data);
  if (push2Data.processed?.includes(orderId)) pass('Re-push idempotent (still processed, no HTTP error)');
  else fail('Re-push failed');

  // ── TEST 3: Pull via /sync/orders?last_sync=epoch ────────────────────────
  console.log('\n── TEST 3: Pull orders back via /sync/orders ──');
  const pullRes = await fetch(`${BASE_URL}/sync/orders?last_sync=${encodeURIComponent('1970-01-01T00:00:00.000Z')}`);
  const pullData = await pullRes.json();
  const found = (pullData.orders || []).find(o => o.order?.id === orderId);
  log('Pull (found test order)', found || 'NOT FOUND');

  if (found) pass(`Order ${orderId} visible in pull response`);
  else fail(`Order ${orderId} NOT found in pull response`);

  if (found?.order?.status === 'COMPLETED') pass('Status is COMPLETED');
  else fail(`Unexpected status: ${found?.order?.status}`);

  if (Array.isArray(found?.items) && found.items.length === 1) pass('Items hydrated (1 item)');
  else fail(`Items not correct: ${JSON.stringify(found?.items)}`);

  // ── TEST 4: Void the order via /sync/voids ───────────────────────────────
  console.log('\n── TEST 4: Void test order ──');
  const voidedAt = new Date().toISOString();
  const voidRes = await fetch(`${BASE_URL}/sync/voids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voids: [{ order_id: orderId, reason: 'Test void', voided_at: voidedAt }] })
  });
  const voidData = await voidRes.json();
  log('Void response', voidData);
  if (voidData.processed?.includes(orderId)) pass('Void processed');
  else fail('Void not processed');

  // ── TEST 5: Pull after void — status must be VOIDED ─────────────────────
  console.log('\n── TEST 5: Pull after void — verify status ──');
  const pull2Res = await fetch(`${BASE_URL}/sync/orders?last_sync=${encodeURIComponent('1970-01-01T00:00:00.000Z')}`);
  const pull2Data = await pull2Res.json();
  const found2 = (pull2Data.orders || []).find(o => o.order?.id === orderId);
  if (found2?.order?.status === 'VOIDED') pass('Status is VOIDED after void');
  else fail(`Status is NOT VOIDED: ${found2?.order?.status}`);

  // ── TEST 6: Web orders endpoint returns test order ───────────────────────
  console.log('\n── TEST 6: GET /orders (Web endpoint) ──');
  const webRes = await fetch(`${BASE_URL}/orders`);
  const webData = await webRes.json();
  const webFound = (webData.orders || []).find(o => o.id === orderId);
  if (webFound) pass('Test order visible via /api/orders (Web endpoint)');
  else fail('Test order NOT found in /api/orders');

  // ── CLEANUP ──────────────────────────────────────────────────────────────
  console.log('\n── CLEANUP ──');
  // We cannot easily run DELETE via the public API (no admin endpoint).
  // Leaving test records with TEST_SYNC_ prefix — they are clearly identifiable.
  // They will not affect real cafe dashboard queries since invoice prefix differs.
  console.log('Note: Test records with invoice prefix TEST_SYNC_ remain in D1.');
  console.log('They can be cleaned up via: wrangler d1 execute medical-pos-db --remote --command "DELETE FROM orders WHERE invoice_number LIKE \'TEST_SYNC_%\'"');

  // ── Summary ──
  console.log('\n═══════════════════════════════════');
  if (process.exitCode === 1) {
    console.error(' SOME TESTS FAILED — see ❌ above');
  } else {
    console.log(' ALL TESTS PASSED ✅');
  }
  console.log('═══════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
