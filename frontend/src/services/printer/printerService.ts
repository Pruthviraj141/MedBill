import { Capacitor } from '@capacitor/core';
import { Order, OrderItem } from '../../types';
import { createReceiptDocument } from './ReceiptDocument';
import { ReceiptFormatter } from './receiptFormatter';
import { loadAndEncodeQR } from './qrHandler';
import { printViaAndroidRawBT } from './AndroidPrinterAdapter';
import { printViaDesktopProxy } from './DesktopPrinterAdapter';

export const printerService = {
  
  /**
   * Generates a thermal receipt asynchronously and dispatches it 
   * securely via the environment-appropriate transport channel.
   * Returns true if dispatch appeared theoretically successful.
   */
  async printOrder(order: Order, items: OrderItem[]): Promise<boolean> {
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
      console.error("Printer Service failed explicitly during buffer construction:", e);
      return false;
    }
  }
};
