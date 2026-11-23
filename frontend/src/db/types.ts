export type OrderStatus = 'COMPLETED' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'UPI';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  active: number;
  updated_at: string;
}

export interface Order {
  id: string;
  invoice_number: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  payment_method: PaymentMethod;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  dosage_schedule?: string;
}

export interface SyncQueue {
  id: string;
  order_id: string;
  action: 'CREATE' | 'VOID';
  payload: string; // JSON string
  created_at: string;
  attempt_count: number;
  last_attempt_at: string | null;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface Setting {
  key: string;
  value: string;
}
