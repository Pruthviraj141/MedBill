import fs from 'fs';
import path from 'path';

// Usage: npx tsx testing/perf-diagnose.ts
const API_URL = process.env.API_URL || 'https://cafe-pos-api.pruthvigavhane.workers.dev';
const USERNAME = process.env.USERNAME || 'admin';
const PASSWORD = process.env.PASSWORD || 'admin';

let token = '';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint: string, method: string = 'GET', body?: any) {
  const start = performance.now();
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  const end = performance.now();
  const serverTiming = res.headers.get('Server-Timing') || '';
  
  const parsedTimings: Record<string, number> = {};
  if (serverTiming) {
    serverTiming.split(',').forEach(t => {
      const parts = t.split(';');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const durPart = parts.find(p => p.trim().startsWith('dur='));
        if (durPart) {
          parsedTimings[name] = parseFloat(durPart.split('=')[1]);
        }
      }
    });
  }

  // Consume body completely
  try {
    await res.text();
    return {
      status: res.status,
      totalTime: end - start,
      serverTiming: parsedTimings,
      totalServerTime: parsedTimings['total'] || 0,
      networkTime: (end - start) - (parsedTimings['total'] || 0)
    };
  } catch(e) {
    return { status: res.status, totalTime: end - start, serverTiming: parsedTimings, totalServerTime: 0, networkTime: 0 };
  }
}

async function runDiagnostic() {
  console.log('========================================');
  console.log('CAFE POS PERFORMANCE DIAGNOSTIC');
  console.log('========================================\n');

  console.log('Authenticating...');
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });
  
  if (!loginRes.ok) {
    console.error(`Login failed! Status: ${loginRes.status}`);
    const err = await loginRes.text();
    if (loginRes.status === 401) {
       console.log('Warning: Default credentials did not work. Cannot test private endpoints.');
    } else {
       console.error(err);
    }
  } else {
    const loginData = await loginRes.json() as any;
    token = loginData.token;
    console.log('Authentication successful.\n');
  }
  
  // Basic health test
  const endpoints = [
    { name: 'Health', path: '/api/health' }
  ];

  if (token) {
    endpoints.push(
      { name: 'Products', path: '/api/products' },
      { name: 'Orders', path: '/api/orders' },
      { name: 'Reports Today', path: '/api/reports/today' },
      { name: 'Reports Week', path: '/api/reports/week' },
      { name: 'Reports Month', path: '/api/reports/month' }
    );
  }

  console.log('API:');
  const results: any = {};
  
  for (const ep of endpoints) {
    await makeRequest(ep.path); // cold request
    
    // warm requests
    const runs = 5;
    let sumTotal = 0;
    
    for (let i = 0; i < runs; i++) {
        const rep = await makeRequest(ep.path);
        sumTotal += rep.totalTime;
    }
    
    const avg = sumTotal / runs;
    results[ep.name] = avg;
    console.log(`${ep.name.padEnd(20, '.')} ${avg.toFixed(2)} ms`);
    if (runs > 0) {
       const lastReq = await makeRequest(ep.path);
       console.log(`  -> Server Timings: ${JSON.stringify(lastReq.serverTiming)}`);
    }
  }
  
  if (!token) return;
  
  console.log('\POST /orders:');
  
  const orderPayload = {
    deviceId: "perf-diagnostic",
    idempotencyKey: `perf-diagnostic-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    items: [] as any[],
    paymentMethod: "CASH"
  };
  
  // Fill 1 sample product
  const prodRes = await fetch(`${API_URL}/api/products`, { headers: { 'Authorization': `Bearer ${token}` }});
  if (prodRes.ok) {
    const prodData = await prodRes.json() as any;
    if (prodData.data?.products?.length > 0) {
      orderPayload.items.push({
         productId: prodData.data.products[0].id || prodData.data.products[0]._id,
         quantity: 1
      });
    }
  }
  
  if (orderPayload.items.length > 0) {
    const postOrderRes = await makeRequest('/api/orders', 'POST', orderPayload);
    console.log(`Total .............. ${postOrderRes.status === 201 ? postOrderRes.totalTime.toFixed(2) : 'ERROR'} ms`);
    console.log(`Idempotency ........ ${postOrderRes.serverTiming['idempotency']?.toFixed(2) || 'N/A'} ms`);
    console.log(`Product/Counter .... ${postOrderRes.serverTiming['product_lookup_and_counter']?.toFixed(2) || 'N/A'} ms`);
    console.log(`Insert ............. ${postOrderRes.serverTiming['order_insert']?.toFixed(2) || 'N/A'} ms`);
  } else {
    console.log('No products available to create a test order');
  }

  console.log('\n========================================');
  console.log('BOTTLENECK ANALYSIS');
  console.log('========================================');
  console.log('Review the API Server-Timing results. If (TotalTime) >> (Insert Time + Lookup Time), the delay is largely Cloudflare/network.');
}

runDiagnostic().catch(console.error);
