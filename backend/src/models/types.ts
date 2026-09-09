export type Role = 'OWNER' | 'MANAGER' | 'CASHIER';

export interface BaseRecord {
  _id?: any;
  cafeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseRecord {
  username: string;
  passwordHash: string;
  role: Role;
}

export interface Product extends BaseRecord {
  name: string;
  categoryId: string;
  price: number;
  active: boolean;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Order extends BaseRecord {
  invoiceNumber: string;
  deviceId: string;
  cashierId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'UPI';
  status: 'COMPLETED' | 'VOIDED';
  voidedAt?: string;
  voidReason?: string;
}
