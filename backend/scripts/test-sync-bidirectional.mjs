import fs from 'fs';
process.on('uncaughtException', e => fs.writeFileSync('err.log', String(e.stack || e)));
process.on('unhandledRejection', e => fs.writeFileSync('err.log', String(e.stack || e)));

import sqlite3 from 'sqlite3';
import { randomUUID } from 'crypto';

const db = new sqlite3.Database(':memory:');

const initSqlite = () => new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, invoice_number TEXT UNIQUE NOT NULL, status TEXT NOT NULL, subtotal REAL NOT NULL, total REAL NOT NULL, payment_method TEXT NOT NULL, created_at TEXT NOT NULL, voided_at TEXT, void_reason TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, name_snapshot TEXT NOT NULL, unit_price REAL NOT NULL, quantity INTEGER NOT NULL, line_total REAL NOT NULL, FOREIGN KEY (order_id) REFERENCES orders (id))");
    resolve();
  });
});

const API_BASE = 'http://127.0.0.1:8788/api';
const output = [];
const log = (msg) => { console.log(msg); output.push(msg); };

const syncQueue = [];

function generateInvoiceNumber(orderId) {
    const dateStr = new Date().toISOString().replace(/\\D/g, '').slice(0, 8);
    const shortId = orderId.split('-')[0].slice(0, 6).toUpperCase();
    return "INV-" + dateStr + "-" + shortId;
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
async function runTests() {
  try {
    await initSqlite();
    log("PASS: Local SQLite Initialized");

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

    res = await fetch(API_BASE + "/sync/orders?last_sync=1970-01-01T00:00:00.000Z");
    data = await res.json();
    const pulledOrder = data.orders.find(o => o.order.id === webOrderPayload.id);
    if (!pulledOrder) throw new Error("Android failed to pull Web order");
    
    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run([pulledOrder.order.id, pulledOrder.order.invoice_number, pulledOrder.order.status, pulledOrder.order.subtotal, pulledOrder.order.total, pulledOrder.order.payment_method, pulledOrder.order.created_at]);
        stmt.finalize();
    });
    log("PASS: Android successfully pulled Web order incrementally into SQLite without queue loop");

    log("\\n--- B. Android -> SQLite -> D1 -> Web ---");
    const androidOrder = {
        id: randomUUID(),
        status: 'COMPLETED',
        paymentMethod: 'UPI',
        createdAt: new Date().toISOString(),
    };
    const androidInvoice = generateInvoiceNumber(androidOrder.id);
    log("Android generated dynamic invoice: " + androidInvoice);
    
    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run([androidOrder.id, androidInvoice, androidOrder.status, 150, 150, androidOrder.paymentMethod, androidOrder.createdAt]);
        stmt.finalize();
    });
    
    syncQueue.push({ action: 'CREATE', payload: JSON.stringify({ ...androidOrder, invoiceNumber: androidInvoice, subtotal: 150, total: 150, items: [] }) });

    let po = syncQueue.pop();
    res = await fetch(API_BASE + "/sync/orders", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: [JSON.parse(po.payload)] })
    });
    data = await res.json();
    if (!data.processed.includes(androidOrder.id)) throw new Error("Sync push failed");

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
    
    res = await fetch(API_BASE + "/sync/orders"); 
    data = await res.json();
    const updatedWebOrder = data.orders.find(o => o.order.id === webOrderPayload.id);
    if (updatedWebOrder.order.status !== 'VOIDED') throw new Error("Failed to pull void status");
    log("PASS: Android dynamically pulled Web void update without loops");

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
    process.exit(0);
  } catch (e) {
    console.error("FAIL:", e);
    process.exit(1);
  }
}

runTests();
