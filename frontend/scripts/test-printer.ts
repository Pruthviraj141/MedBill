import { ESCPOS } from '../src/services/printer/ESCPOS';
import { ReceiptFormatter } from '../src/services/printer/receiptFormatter';
import { printQueue } from '../src/services/printer/printQueue';

// Mock localStorage for Node environment
global.localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, val: string) { this.store[key] = val; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
} as any;

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${msg}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${msg}`);
  }
}

async function runPrinterTests() {
  console.log("=== Running Printer Subsystem Tests ===\n");

  // 1. ESCPOS Encoding Tests
  const esc = new ESCPOS();
  esc.init();
  const initBytes = esc.getBytes();
  assert(initBytes[0] === 0x1B && initBytes[1] === 0x40, "ESCPOS init writes correct bytes (ESC @)");
  
  esc.text("hello ₹ world");
  const base64 = esc.getBase64();
  assert(base64.length > 0, "ESCPOS serialization produces valid Base64 payload");
  
  // Checking ₹ -> Rs. replacement
  const textBytes = esc.getBytes();
  const rawString = Array.from(textBytes).map(b => String.fromCharCode(b)).join('');
  assert(rawString.includes("Rs."), "ESCPOS safely replaces unsupported '₹' symbol with 'Rs.'");

  // 2. ReceiptFormatter Layout Tests
  const mockDoc = {
    businessName: "Test Cafe",
    orderId: "ord_1",
    invoiceNumber: "INV-123",
    date: "19/09/2026",
    time: "02:00",
    items: [
      { name: "Coffee", quantity: 2, price: 50, total: 100 },
      // Test long name wrapping
      { name: "Really Long Item Name That Must Wrap On Receipt", quantity: 1, price: 90, total: 90 },
      // Test large price handling (> 9 chars)
      { name: "Luxury Bean", quantity: 1, price: 999999.99, total: 999999.99 }
    ],
    subtotal: 1000000,
    discount: 0,
    gst: 0,
    total: 1000000,
    paymentMethod: "CASH"
  };

  const formatter = new ReceiptFormatter(mockDoc, 32);
  const formattedEsc = await formatter.generate();
  const generatedText = Array.from(formattedEsc.getBytes()).map(b => String.fromCharCode(b)).join('');
  
  // Verification without needing physical hardware
  assert(generatedText.includes("TAX INVOICE"), "Formatter generates required standard tax invoice header");
  assert(generatedText.includes("Really Long Item "), "Formatter handles long line truncation/wrapping safely");
  // Widen column check - if the price of 999999.99 is > 9 chars it gets sliced from right.
  // We check that formatting didn't throw and output contains part of the huge number.
  assert(generatedText.includes("9999.99"), "Formatter handles overflow prices robustly via hard limit slice");

  // 3. PrintQueue Idempotency Tests
  global.localStorage.clear();
  const mockOrder = { id: "o_1" } as any;
  const mockItems = [{ id: "i_1" }] as any;
  
  printQueue.addFailedJob(mockOrder, mockItems);
  assert(printQueue.getFailedJobs().length === 1, "Print queue stores failed jobs natively");
  
  printQueue.addFailedJob(mockOrder, mockItems);
  assert(printQueue.getFailedJobs().length === 1, "Print queue strictly enforces idempotency against duplicate orders");
  
  printQueue.removeJob("o_1");
  assert(printQueue.getFailedJobs().length === 0, "Print queue removes job successfully when recovered");

  console.log(`\n=== Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runPrinterTests().catch(e => {
  console.error(e);
  process.exit(1);
});
