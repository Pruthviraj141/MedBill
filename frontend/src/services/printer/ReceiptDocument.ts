import { Order, OrderItem } from '../../types';
import { settingsRepository } from '../../db/repositories/settingsRepository';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  dosageSchedule?: string;
}

export interface ReceiptDocument {
  businessName: string;
  orderId: string;
  invoiceNumber: string;
  date: string; // DD/MM/YYYY
  time: string; // HH:MM
  items: ReceiptItem[];
  subtotal: number;
  discount: number; // For now 0, or if order supports it
  gst: number; // If applicable (0 currently handled in subtotal?)
  total: number;
  paymentMethod: string;
}

export const createReceiptDocument = async (order: Order, items: OrderItem[]): Promise<ReceiptDocument> => {
  // Try to get dynamic business name if exists, fallback to 'TBT CAFE'
  let businessName = await settingsRepository.getSetting('businessName') || await settingsRepository.getSetting('cafeName') || 'MEDBILL PHARMACY';
  
  const d = new Date(order.createdAt || new Date().toISOString());
  const date = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const receiptItems: ReceiptItem[] = items.map(i => ({
    name: i.name || i.productId,
    quantity: i.quantity,
    price: i.unitPrice,
    total: i.total || (i.unitPrice * i.quantity),
    dosageSchedule: i.dosageSchedule || '0-0-0'
  }));

  // Assuming simple no-GST/Discount in base DB model right now, mapping straight totals.
  return {
    businessName,
    orderId: order.id || order._id,
    invoiceNumber: order.invoiceNumber || 'INV-000',
    date,
    time,
    items: receiptItems,
    subtotal: order.subtotal,
    discount: order.discount || 0,
    gst: 0,
    total: order.grandTotal,
    paymentMethod: order.paymentMethod || 'CASH'
  };
};
