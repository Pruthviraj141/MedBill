import fetch from 'node-fetch'; // We might have native fetch in node 18+

const API = 'http://localhost:8787/api';

async function runTests() {
  console.log("1. Testing GET /api/health");
  let res = await fetch(`${API}/health`);
  console.log(await res.json());

  console.log("\n2. Testing Login");
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '1234' })
  });
  console.log(await res.json());

  console.log("\n3. Testing GET products");
  res = await fetch(`${API}/products`);
  console.log(await res.json());

  console.log("\n4. Create COMPLETED CASH order");
  const orderId1 = crypto.randomUUID();
  res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: orderId1,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: [
        { productId: 'p1', name: 'Coffee', unitPrice: 150, quantity: 2 }
      ]
    })
  });
  console.log(await res.json());

  console.log("\n5. Create COMPLETED UPI order");
  const orderId2 = crypto.randomUUID();
  res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: orderId2,
      paymentMethod: 'UPI',
      status: 'COMPLETED',
      items: [
        { productId: 'p2', name: 'Tea', unitPrice: 100, quantity: 1 }
      ]
    })
  });
  console.log(await res.json());

  console.log("\n6. Duplicate same order ID");
  res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: orderId1,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: [
        { productId: 'p1', name: 'Coffee', unitPrice: 150, quantity: 2 }
      ]
    })
  });
  console.log(await res.json()); // Should succeed with idempotency

  console.log("\n7. Void order (order 2)");
  res = await fetch(`${API}/orders/${orderId2}/void`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Test void' })
  });
  console.log(await res.json());

  console.log("\n8. GET orders showing VOIDED order");
  res = await fetch(`${API}/orders`);
  const ordersData = await res.json();
  const voided = ordersData.orders?.find((o) => o.id === orderId2);
  console.log("Is voided present?", !!voided, "Status:", voided?.status);

  console.log("\n9. Dashboard today");
  res = await fetch(`${API}/reports/today`);
  console.log(await res.json());
  
  console.log("\nAll quick tests finished.");
}

runTests().catch(console.error);
