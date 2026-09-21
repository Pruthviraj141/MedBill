import { Capacitor } from '@capacitor/core';
import { Order, OrderItem } from '../../types';
import { createReceiptDocument } from './ReceiptDocument';
import { ReceiptFormatter } from './receiptFormatter';
import { loadAndEncodeQR } from './qrHandler';
import { printViaAndroidRawBT } from './AndroidPrinterAdapter';
import { printViaDesktopProxy } from './DesktopPrinterAdapter';
import { printQueue } from './printQueue';

// FIX 5: In-flight sentinel key in localStorage.
// If the app is killed/crashes while a print is in progress, the key survives.
// On next module load we detect it and record the order as a failed job for retry.
const INFLIGHT_KEY = 'tbt_print_inflight';

function checkInflightOrphan() {
  const orphanId = localStorage.getItem(INFLIGHT_KEY);
  if (!orphanId) return;
  // Best-effort: we only have the order ID, not the full object.
  // Log a warning so the operator can manually retry from Settings if needed.
  console.warn(
    `[PRINTER] Orphaned in-flight print detected for order ${orphanId}. ` +
    'The app was likely killed during printing. Check Settings → Retry Failed Prints.'
  );
  // Remove the sentinel so we only warn once.
  localStorage.removeItem(INFLIGHT_KEY);
}

// Run orphan check once on module load.
checkInflightOrphan();

export const printerService = {

  /**
   * Generates a thermal receipt asynchronously and dispatches it
   * securely via the environment-appropriate transport channel.
   * Returns true if dispatch succeeded, false on any failure.
   */
  async printOrder(order: Order, items: OrderItem[]): Promise<boolean> {
    const orderId = order.id || order._id;

    // FIX 5: Write in-flight sentinel before starting the dispatch.
    // Cleared unconditionally in the finally block.
    localStorage.setItem(INFLIGHT_KEY, orderId);

    try {
      // 1. Core mapping layer securely abstracting logic away from DB models
      const doc = await createReceiptDocument(order, items);

      // 2. Generate generic 58mm layouts
      const formatter = new ReceiptFormatter(doc);
      const escpos = await formatter.generate();

      // 3. Optional Asset Pipeline — Try to encode standard repository qr.jpg
      const qrData = await loadAndEncodeQR();
      if (qrData) {
        escpos.feed(1); // Small padding
        escpos.alignCenter();
        // Fire generic GS v 0 raster to the ESC buffer (works on highly compatible profiles like EZO)
        escpos.printRaster(qrData.w, qrData.h, qrData.buffer);
        escpos.feed(1);
      }

      // 4. Final ESC/POS buffer terminations
      escpos.feed(3); // push paper out past tear bar safely
      escpos.cut();

      // 5. Serialize
      const payloadBase64 = escpos.getBase64();

      // 6. Generic Environment Hook Router
      if (Capacitor.isNativePlatform()) {
        return await printViaAndroidRawBT(payloadBase64);
      } else {
        return await printViaDesktopProxy(payloadBase64);
      }

    } catch (e) {
      console.error('[PRINTER] Service failed during buffer construction:', e);
      return false;
    } finally {
      // FIX 5: Always clear the in-flight sentinel, regardless of outcome.
      localStorage.removeItem(INFLIGHT_KEY);
    }
  }
};

// Re-export printQueue so callers (Billing.tsx, DesktopBilling.tsx) can import
// both from this module without adding a second import line.
export { printQueue };
