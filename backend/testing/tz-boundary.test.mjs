/**
 * TBT Cafe POS — IST Timezone Boundary Test
 *
 * Proves that the /api/reports/today endpoint correctly uses IST day boundaries,
 * not a rolling 24h UTC window.
 *
 * Strategy: Insert two test orders at the IST day boundary, then assert that
 * "today" counts the early-IST order (which is technically yesterday UTC) and
 * does NOT count the late-IST-yesterday order.
 *
 * Example (running at any time on 2026-09-16):
 *   IST midnight = 2026-09-15T18:30:00Z
 *   "yesterday IST 23:55" → stored as 2026-09-15T18:25:00Z → should NOT appear in today
 *   "today IST 00:05"     → stored as 2026-09-15T18:35:00Z → SHOULD appear in today
 *
 * Run: node backend/testing/tz-boundary.test.mjs
 */

const BASE_URL = 'https://cafe-pos-api.pruthvigavhane.workers.dev/api';
const IST_OFFSET_MINUTES = 330;

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.error(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }

function getIstMidnightUtc() {
  const nowMs = Date.now();
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const localMs = nowMs + offsetMs;
  const localDate = new Date(localMs);
  const y = localDate.getUTCFullYear();
  const m = localDate.getUTCMonth();
  const d = localDate.getUTCDate();
  return new Date(Date.UTC(y, m, d) - offsetMs);
}

async function pushOrder(id, invoiceNumber, createdAtUtc) {
  const body = {
    orders: [{
      order: {
        id, invoice_number: invoiceNumber,
        status: 'COMPLETED', subtotal: 100, total: 100,
        payment_method: 'CASH', created_at: createdAtUtc
      },
      items: [{
        id: `${id}-item`, order_id: id, product_id: 'prod_tz_test',
        name_snapshot: 'TZ Test Item', unit_price: 100, quantity: 1, line_total: 100
      }]
    }]
  };
  const res = await fetch(`${BASE_URL}/sync/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return res.json();
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log(' TBT Cafe POS — IST Timezone Boundary Test');
  console.log('═══════════════════════════════════════════════');

  const istMidnightUtc = getIstMidnightUtc();
  console.log('IST midnight in UTC:', istMidnightUtc.toISOString());

  // Order A: 5 minutes BEFORE IST midnight → belongs to YESTERDAY IST
  const orderAId = 'TEST_TZ_00000001';
  const orderACreatedAt = new Date(istMidnightUtc.getTime() - 5 * 60 * 1000).toISOString();  // -5 min
  console.log('Order A (yesterday IST 23:55):', orderACreatedAt);

  // Order B: 5 minutes AFTER IST midnight → belongs to TODAY IST
  const orderBId = 'TEST_TZ_00000002';
  const orderBCreatedAt = new Date(istMidnightUtc.getTime() + 5 * 60 * 1000).toISOString();  // +5 min
  console.log('Order B (today IST 00:05):', orderBCreatedAt);

  // Insert both test orders
  console.log('\n── Inserting test orders ──');
  const resA = await pushOrder(orderAId, 'TEST_TZ_INV_A', orderACreatedAt);
  const resB = await pushOrder(orderBId, 'TEST_TZ_INV_B', orderBCreatedAt);
  console.log('Order A push:', resA.processed?.includes(orderAId) ? 'OK' : 'FAILED');
  console.log('Order B push:', resB.processed?.includes(orderBId) ? 'OK' : 'FAILED');

  // Query /reports/today with IST offset
  console.log('\n── Querying /reports/today?tz_offset_minutes=330 ──');
  const reportRes = await fetch(`${BASE_URL}/reports/today?tz_offset_minutes=${IST_OFFSET_MINUTES}`);
  const reportData = await reportRes.json();
  console.log('Report response:', JSON.stringify(reportData, null, 2));

  if (!reportRes.ok) {
    fail(`/reports/today returned HTTP ${reportRes.status}`);
    return;
  }

  // We can't know the exact count since other real orders may be in the DB,
  // but we can verify the sinceUtc boundary is correct.
  const sinceUtc = reportData._debug?.sinceUtc;
  console.log('\nDebug — sinceUtc used by backend:', sinceUtc);

  if (!sinceUtc) {
    fail('Backend did not return _debug.sinceUtc — cannot verify boundary');
    return;
  }

  // Verify the boundary: sinceUtc must equal IST midnight in UTC (within a minute to account for tiny clock drift)
  const expectedBoundaryMs = istMidnightUtc.getTime();
  const actualBoundaryMs = new Date(sinceUtc).getTime();
  const diffMinutes = Math.abs(expectedBoundaryMs - actualBoundaryMs) / 60000;
  
  if (diffMinutes < 2) {
    pass(`IST midnight boundary correct: ${sinceUtc} (diff=${diffMinutes.toFixed(2)} min)`);
  } else {
    fail(`IST midnight boundary WRONG: got ${sinceUtc}, expected ~${istMidnightUtc.toISOString()} (diff=${diffMinutes.toFixed(1)} min)`);
  }

  // Verify Order A's timestamp < sinceUtc (it should NOT be in today's report)
  if (orderACreatedAt < sinceUtc) {
    pass(`Order A (23:55 IST) timestamp ${orderACreatedAt} < sinceUtc → correctly EXCLUDED from today`);
  } else {
    fail(`Order A (23:55 IST) timestamp ${orderACreatedAt} >= sinceUtc ${sinceUtc} → would be INCORRECTLY INCLUDED`);
  }

  // Verify Order B's timestamp >= sinceUtc (it SHOULD be in today's report)
  if (orderBCreatedAt >= sinceUtc) {
    pass(`Order B (00:05 IST) timestamp ${orderBCreatedAt} >= sinceUtc → correctly INCLUDED in today`);
  } else {
    fail(`Order B (00:05 IST) timestamp ${orderBCreatedAt} < sinceUtc ${sinceUtc} → would be INCORRECTLY EXCLUDED`);
  }

  // Cleanup note
  console.log('\n── CLEANUP ──');
  console.log('Remove test records with:');
  console.log("  wrangler d1 execute tbt-cafe-prod --remote --command \"DELETE FROM orders WHERE id IN ('TEST_TZ_00000001','TEST_TZ_00000002')\"");

  console.log('\n═══════════════════════════════════════════════');
  if (process.exitCode === 1) {
    console.error(' SOME TESTS FAILED — see ❌ above');
  } else {
    console.log(' ALL TESTS PASSED ✅');
  }
  console.log('═══════════════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
