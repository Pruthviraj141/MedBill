const API_URL = 'http://localhost:8787';

async function run() {
  console.log("Fetching token...");
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: "admin", password: "admin" })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.ok || !loginData.token) {
     console.error("Login failed!", loginData);
     return;
  }
  const token = loginData.token;
  
  for (const timeframe of ['today', 'week', 'month']) {
    console.log(`\nTesting /api/reports/${timeframe} on Worker...`);
    let s = Date.now();
    const res = await fetch(`${API_URL}/api/reports/${timeframe}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`Worker Response received in ${(Date.now() - s).toFixed(2)}ms`);
    console.log("Status:", res.status);
    console.log(`Data for ${timeframe} processed. Revenue: ${data.data?.revenue}`);
  }
}

run().catch(console.error);
