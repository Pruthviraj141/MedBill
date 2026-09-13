import { useQuery } from '@tanstack/react-query';
import { ordersRepository } from '../db/repositories/ordersRepository';
import type { Order } from '../types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Unify the response structure directly so the UI doesn't break
      const recent = await ordersRepository.getOrders(100);
      return { 
        orders: recent.map((o: any): Order => ({
          id: o.id,
          _id: o.id,
          invoiceNumber: o.invoice_number,
          cafeId: "",
          status: o.status,
          subtotal: o.subtotal,
          grandTotal: o.total,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
          items: (o.items || []).map((i: any) => ({
            productId: i.product_id,
            name: i.name_snapshot || i.name,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.line_total,
          }))
        }))
      };
    },
    staleTime: 30 * 1000,
  });
}
