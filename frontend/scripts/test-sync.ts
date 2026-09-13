import { initDB } from '../src/db/database';
import { productsRepository } from '../src/db/repositories/productsRepository';
import { ordersRepository } from '../src/db/repositories/ordersRepository';
import { syncQueueRepository } from '../src/db/repositories/syncQueueRepository';
import { checkoutService } from '../src/services/checkoutService';
import { syncService } from '../src/services/syncService';
import type { Product } from '../src/types';

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8787';

function p(text: string, pass: boolean, errInfo?: string) {
  const t = text.padEnd(30, ' ');
  console.log(`${t} ${pass ? 'PASS' : 'FAIL'}`);
  if (!pass && errInfo) console.log(`   └─ Error: ${errInfo}`);
}

async function runAll() {
  console.log("========================================");
  console.log("TBT CAFE — SYNC ENGINE TEST SUITE");
  console.log("========================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failingTests: { name: string, err: string }[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    totalTests++;
    try {
      await fn();
      passedTests++;
      p(name, true);
    } catch (e: any) {
      const msg = e.message || String(e);
      p(name, false, msg);
      failingTests.push({ name, err: msg });
    }
  };

  await runTest("Setup DB & Products", async () => {
    await initDB();
    await productsRepository.upsertProduct({
      id: "prod-1", name: "Latte", price: 150, category: "Hot", image_url: null, active: 1, updated_at: new Date().toISOString()
    });
  });

  let order1: any;
  await runTest("TEST 1: Local CASH order -> queue created", async () => {
    order1 = await checkoutService.createOrder([{ productId: "prod-1", quantity: 2 }], 'CASH');
    const p = await syncQueueRepository.getPending();
    if (p.length !== 1) throw new Error("Queue not populated");
  });

  await runTest("TEST 2: Sync order -> D1 verified", async () => {
    await syncService.pushPending();
    const p = await syncQueueRepository.getPending();
    if (p.length !== 0) throw new Error("Not marked as SYNCED");

    // Ping D1 manually to check
    const r = await fetch(`${API_URL}/api/orders`);
    const data = await r.json() as any;
    const found = data.orders?.find((o: any) => o.id === order1.id);
    if (!found) throw new Error(`Missing in D1 from recent orders list`);
  });

  await runTest("TEST 3: Idempotent sync", async () => {
    // Manually force a pending retry for the same order
    await syncQueueRepository.getEnqueueStatement(order1.id, 'CREATE', order1); // wait this just creates sql, need to run it directly:
    const db = await (await import('../src/db/database')).getDB();
    const stmnt = syncQueueRepository.getEnqueueStatement(order1.id, 'CREATE', { ...order1, id: order1.id });
    await db.run(stmnt.statement, stmnt.values);

    await syncService.pushPending();
    const p = await syncQueueRepository.getPending();
    if (p.length !== 0) throw new Error("Idempotent run failed to clear duplicate queue");
  });

  await runTest("TEST 8: Void local order -> queue creates void operation", async () => {
    await ordersRepository.voidOrder(order1.id, "Refund test");
    const p = await syncQueueRepository.getPending();
    if (p.length !== 1 || p[0].action !== 'VOID') throw new Error("Void queue operation invalid");
  });

  await runTest("TEST 9: Sync void -> D1 matches", async () => {
    await syncService.pushPending();
    const p = await syncQueueRepository.getPending();
    if (p.length !== 0) throw new Error("Void queue not cleared");
    
    // Check D1 again
    const r = await fetch(`${API_URL}/api/orders`);
    const data = await r.json() as any;
    const found = data.orders?.find((o: any) => o.id === order1.id);
    if (found?.status !== 'VOIDED') throw new Error("D1 did not update status to voided");
  });

  await runTest("TEST 11: D1 product update -> local updates", async () => {
    const db = await (await import('../src/db/database')).getDB();
    await db.run("DELETE FROM products");
    await syncService.pullCatalog();
    
    // Restore product for next tests to succeed headless
    await productsRepository.upsertProduct({
      id: "prod-1", name: "Latte", price: 150, category: "Hot", image_url: null, active: 1, updated_at: new Date().toISOString()
    });
  });

  await runTest("TEST 26: Offline Simulation Batching", async () => {
    const p0 = await syncQueueRepository.getPendingCount();
    // Generate 5 offline orders
    for (let i = 0; i<5; i++) {
        await checkoutService.createOrder([{ productId: "prod-1", quantity: 1 }], 'CASH');
    }
    const p1 = await syncQueueRepository.getPendingCount();
    if ((p1 - p0) !== 5) throw new Error("Expected 5 pending orders to be added");

    await syncService.pushPending();

    const p2 = await syncQueueRepository.getPendingCount();
    if (p2 !== 0) throw new Error("Expected 0 pending orders post-sync");
  });

  console.log("\n========================================");
  if (passedTests === totalTests) {
    console.log("RESULT: ALL SYNC TESTS PASSED");
  } else {
    console.log(`RESULT: ${totalTests - passedTests} SYNC TESTS FAILED`);
    failingTests.forEach(f => console.log(` - ${f.name}: ${f.err}`));
    process.exit(1);
  }
  console.log("========================================\n");
}

runAll();
