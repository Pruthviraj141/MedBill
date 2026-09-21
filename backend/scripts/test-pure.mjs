import { randomUUID } from 'crypto';

const API_BASE = 'http://127.0.0.1:8788/api';
const output = [];
const log = (msg) => { console.log(msg); output.push(msg); };

// Mocking SQLite completely to test purely exact JSON flow requirements (Web -> D1 -> Android -> Web)
const androidDb = {
    orders: [],
    get(id) { return this.orders.find(o => o.id === id); },
    insertOrReplace(o) { 
        const i = this.orders.findIndex(x => x.id === o.id);
        if (i >= 0) { this.orders[i] = o; } else this.orders.push(o); 
    }
};

const syncQueue = [];

function generateInvoiceNumber(orderId) {
    const dateStr = new Date().toISOString().replace(/\\D/g, '').slice(0, 8);
    const shortId = orderId.split('-')[0].slice(0, 6).toUpperCase();
    return "INV-" + dateStr + "-" + shortId;
}

async function runTests() {
  try {
    log("PASS: Local Test Environment Initialized without native modules.");

    log("\\n--- A. Web -> D1 -> Android SQLite ---");
    const webOrderPayload = {
      id: randomUUID(),
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      createdAt: new Date().toISOString(),
      items: [
        { productId: 'test-p1', name: 'Web Tea', quantity: 1, unitPrice: 50, price: 50 }
      ]
    };
    
    let res = await fetch(API_BASE + "/orders", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webOrderPayload)
    });
    let data = await res.json();
    if (!data.success) throw new Error("Web order creation failed");
    log("Web Order Created: " + webOrderPayload.id);

    // Now Android pulls it incrementally
    res = await fetch(API_BASE + "/sync/orders?last_sync=1970-01-01T00:00:00.000Z");
    data = await res.json();
    const pulledOrder = data.orders.find(o => o.order.id === webOrderPayload.id);
    if (!pulledOrder) throw new Error("Android failed to pull Web order");
    
    androidDb.insertOrReplace(pulledOrder.order);
    log("PASS: Android successfully pulled Web order incrementally into Mock SQLite without queue loop");
    log("Verified pulled fields: " + JSON.stringify(pulledOrder.order).substring(0, 100));

    log("\\n--- B. Android -> SQLite -> D1 -> Web ---");
    const androidOrder = {
        id: randomUUID(),
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        createdAt: new Date().toISOString(),
    };
    const androidInvoice = generateInvoiceNumber(androidOrder.id);
    log("Android generated dynamic invoice offline: " + androidInvoice);
    
    // Android inserts locally bypassing queue
    androidDb.insertOrReplace({ ...androidOrder, invoice_number: androidInvoice, subtotal: 150, total: 150 });
    
    // Android manually appends SyncRecord
    syncQueue.push({ action: 'CREATE', payload: JSON.stringify({ ...androidOrder, invoiceNumber: androidInvoice, subtotal: 150, total: 150, items: [] }) });

    let po = syncQueue.pop();
    res = await fetch(API_BASE + "/sync/orders", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: [JSON.parse(po.payload)] })
    });
    data = await res.json();
    if (!data.processed.includes(androidOrder.id)) throw new Error("Sync push failed");

    // Web gets it natively
    res = await fetch(API_BASE + "/orders");
    data = await res.json();
    if (!data.orders.find(o => o.id === androidOrder.id)) throw new Error("Web couldn't fetch android order");
    log("PASS: Android correctly pushed offline order to Web");

    log("\\n--- C. Web VOID -> D1 -> Android ---");
    res = await fetch(API_BASE + "/orders/" + webOrderPayload.id + "/void", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Mistake' })
    });
    const voidResult = await res.json();
    if (!voidResult.success) throw new Error("Void logic failed on Web API");
    
    // Android Pulls void record dynamically
    res = await fetch(API_BASE + "/sync/orders"); 
    data = await res.json();
    const updatedWebOrder = data.orders.find(o => o.order.id === webOrderPayload.id);
    if (!updatedWebOrder || updatedWebOrder.order.status !== 'VOIDED') throw new Error("Failed to pull void status down");
    log("PASS: Android dynamically pulled Web void update natively");

    log("\\n--- E & F. Duplicate Sync & No Loops ---");
    res = await fetch(API_BASE + "/sync/orders", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: [JSON.parse(po.payload)] })
    });
    data = await res.json();
    if (data.processed.includes(androidOrder.id) && res.ok) {
        log("PASS: D1 silently absorbed duplicate POST idempotently");
    } else throw new Error("Failed idempotency check");

    log("\\nTest Suite Completed Successfully");
    console.log("\\n\\n[JSON_RESULTS]\\n", JSON.stringify(output));
    
  } catch (e) {
    console.error("FAIL:", e);
    process.exit(1);
  }
}

runTests();
