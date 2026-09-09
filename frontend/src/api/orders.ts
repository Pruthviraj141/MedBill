import { apiClient } from './client';
import type { Order, OrderItem, PaymentMethod } from '../types';

export const getOrders = () => apiClient.get<{ orders: Order[] }>('/api/orders');

export const createOrder = (orderData: {
  deviceId: string;
  items: Pick<OrderItem, 'productId' | 'quantity'>[];
  paymentMethod: PaymentMethod;
}) => apiClient.post<Order>('/api/orders', orderData);

export const deleteOrder = (id: string, pin: string) => apiClient.post<{id: string}>('/api/orders/delete-transaction', { id, pin });
