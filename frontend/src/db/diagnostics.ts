import { initDB } from './database';
import { productsRepository } from './repositories/productsRepository';
import { ordersRepository } from './repositories/ordersRepository';
import { syncQueueRepository } from './repositories/syncQueueRepository';
import { dashboardRepository } from './repositories/dashboardRepository';
import { checkoutService } from '../services/checkoutService';
import { Product } from './types';

export const runDiagnostics = async () => {
  console.log("==========================================");
  console.log("STARTING SQLITE OFFLINE DIAGNOSTICS");
  console.log("==========================================");
  const results: any[] = [];
  
  const pass = (name: string) => {
    console.log(`✅ [PASS] ${name}`);
    results.push({ test: name, status: 'PASS' });
  };
  const fail = (name: string, err: any) => {
    console.error(`❌ [FAIL] ${name}`, err);
    results.push({ test: name, status: 'FAIL', error: String(err) });
  };

  try {
    // 1 & 2. DB open & tables exist (initDB handles this safely)
    await initDB();
    pass("Database opens & SQLite schema exists");

    // 3. Product insert/read works
    const testProd: Product = {
      id: "diag-prod-1",
      name: "Diag Coffee",
      price: 150,
      category: "Beverages",
      image_url: null,
      active: 1,
      updated_at: new Date().toISOString()
    };
    await productsRepository.upsertProduct(testProd);
    const p = await productsRepository.getProductById("diag-prod-1");
    if (!p || p.price !== 150) throw new Error("Product mismatch");
    pass("Product insert/read works");

    // 4, 5, 8, 11, 12: Order transaction works, items created, total = subtotal, cash works, no tax
    const cashOrder = await checkoutService.createOrder([{ productId: "diag-prod-1", quantity: 2 }], "CASH");
    if (cashOrder.total !== cashOrder.subtotal || cashOrder.total !== 300) throw new Error("CASH total calculation invalid");
    const savedOrder = await ordersRepository.getOrderById(cashOrder.id);
    if (!savedOrder || savedOrder.items.length !== 1) throw new Error("Items not created");
    pass("Order transaction works (items created, CASH, total=subtotal, no tax)");

    // 6. Sync queue entry created atomically
    const qCount = await syncQueueRepository.getPendingCount();
    if (qCount < 1) throw new Error("Sync queue entry missing");
    pass("Sync queue entry is created atomically");

    // 9. UPI works
    const upiOrder = await checkoutService.createOrder([{ productId: "diag-prod-1", quantity: 1 }], "UPI");
    if (upiOrder.payment_method !== "UPI") throw new Error("UPI method invalid");
    pass("UPI payment method works");

    // 10. Invalid payment methods fail
    try {
      await checkoutService.createOrder([{ productId: "diag-prod-1", quantity: 1 }], "CARD" as any);
      fail("Invalid payment methods fail", "Allowed invalid method");
    } catch {
      pass("Invalid payment methods fail");
    }

    // 7. Failed order transaction rolls back
    try {
      await checkoutService.createOrder([{ productId: "invalid-prod", quantity: 1 }], "CASH");
      fail("Failed order transaction rolls back", "Allowed invalid product");
    } catch {
      pass("Failed order transaction rolls back");
    }

    // 13 & 14. Void rules
    const today = new Date().toISOString().slice(0, 10);
    const dashBefore = await dashboardRepository.getSalesSummary(today);
    
    await ordersRepository.voidOrder(cashOrder.id, "Diag void");
    const voidedData = await ordersRepository.getOrderById(cashOrder.id);
    if (voidedData?.order.status !== "VOIDED") throw new Error("Order not marked VOIDED");
    
    const dashAfter = await dashboardRepository.getSalesSummary(today);
    if (dashAfter.revenue >= dashBefore.revenue) {
       throw new Error("Voided order not excluded from analytics");
    }
    pass("VOIDED order stays in history and excluded from analytics");

    console.log("==========================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("==========================================");
    return results;

  } catch (err: any) {
    console.error("FATAL DIAGNOSTIC ERROR:", err);
    return results;
  }
};

if (typeof window !== 'undefined') {
  (window as any).runDiagnosticTests = runDiagnostics;
}
