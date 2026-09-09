import { performance } from 'perf_hooks';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust if needed

async function measure(name: string, url: string, options: RequestInit, iters: number = 2) {
  for(let i = 0; i < iters; i++) {
    const start = performance.now();
    const res = await fetch(url, options);
    const end = performance.now();
    await res.text();
    console.log(`[${name}] ${i === 0 ? 'COLD' : 'WARM'} - time: ${(end - start).toFixed(2)}ms, status: ${res.status}`);
  }
}

async function testPerf() {
  console.log("=== Performance Baseline ===");
  const baseUrl = "http://127.0.0.1:8787";
  
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner', password: 'password' })
  });
  
  if (!loginRes.ok) {
     console.error("Login failed, make sure backend is running on 8787", await loginRes.text());
     return;
  }
  const token = (await loginRes.json() as any).token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  await measure('GET products', `${baseUrl}/api/products`, { headers });
  
  const prodRes = await fetch(`${baseUrl}/api/products`, { headers });
  const prods = (await prodRes.json() as any).data?.products || [];
  const pId = prods.length > 0 ? prods.find((p: any) => p.name !== 'Test Junk').id : "64a0f44e1234567890abcdef";
  
  const orderBody = {
    deviceId: 'perf-test-junk',
    paymentMethod: 'CASH',
    items: [{ productId: pId, quantity: 1 }]
  };
  
  console.log('--- Testing Order Insertion (will clean up after) ---');
  await measure('POST orders', `${baseUrl}/api/orders`, { method: 'POST', headers, body: JSON.stringify(orderBody) });
  
  await measure('GET reports/today', `${baseUrl}/api/reports/today`, { headers });
  await measure('GET orders', `${baseUrl}/api/orders`, { headers });
  
  // Safe cleanup
  console.log('--- Cleaning up junk performance test orders ---');
  const uri = process.env.MONGODB_URI;
  if (uri) {
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_DB_NAME || 'cafe');
      const del = await db.collection('orders').deleteMany({ deviceId: 'perf-test-junk' });
      console.log(`Cleaned up ${del.deletedCount} junk test orders.`);
    } catch(e) {
      console.error("DB Cleanup failed:", e);
    } finally {
      await client.close();
    }
  } else {
    console.error("No MONGODB_URI found, couldn't clean up junk orders.");
  }
}

testPerf().catch(console.error);
