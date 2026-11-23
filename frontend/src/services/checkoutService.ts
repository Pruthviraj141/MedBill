import { productsRepository } from '../db/repositories/productsRepository';
import { ordersRepository } from '../db/repositories/ordersRepository';
import { Order, OrderItem, PaymentMethod } from '../db/types';
import { generateId } from '../utils/generateId';

export interface CartItemInput {
  productId: string;
  quantity: number;
  dosageSchedule?: string;
}

export const checkoutService = {
  createOrder: async (cart: CartItemInput[], paymentMethod: PaymentMethod): Promise<Order> => {
    if (!cart || cart.length === 0) {
      throw new Error("Cart cannot be empty");
    }
    
    if (paymentMethod !== 'CASH' && paymentMethod !== 'UPI') {
      throw new Error("Invalid payment method");
    }

    const orderId = generateId();
    // Genuinely collision-safe offline invoice: INV-YYYYMMDD-[FULL UUID]
    const dateStr = new Date().toISOString().replace(/\D/g, '').slice(0, 8);
    const invoiceNumber = `INV-${dateStr}-${orderId}`;
    
    let subtotal = 0;
    const items: OrderItem[] = [];

    for (const item of cart) {
      const product = await productsRepository.getProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const q = Math.max(1, Math.floor(item.quantity)); // enforce int
      const lineTotal = product.price * q;
      subtotal += lineTotal;
      
      items.push({
        id: generateId(),
        order_id: orderId,
        product_id: product.id,
        name_snapshot: product.name,
        unit_price: product.price,
        quantity: q,
        line_total: lineTotal,
        dosage_schedule: item.dosageSchedule || '0-0-0'
      });
    }

    const order: Order = {
      id: orderId,
      invoice_number: invoiceNumber,
      status: 'COMPLETED',
      subtotal,
      total: subtotal,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
      voided_at: null,
      void_reason: null
    };

    return await ordersRepository.createOrderBase(order, items);
  }
};
