export type Product = {
  id: string;
  _id?: string;
  name: string;
  categoryId?: string;
  category?: string;
  price: number;
  icon?: string;
  image_url?: string;
  active: boolean;
};

export type DosageSchedule = {
  morning: number;
  afternoon: number;
  night: number;
};

export type CartItem = Product & {
  quantity: number;
  dosageSchedule?: DosageSchedule;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  dosageSchedule?: string;
};

export type PaymentMethod = 'CASH' | 'UPI';
export type OrderStatus = 'COMPLETED' | 'VOIDED';

export type Order = {
  id?: string;
  _id: string;
  cafeId: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount?: number;
  grandTotal: number;
  invoiceNumber?: string;
  upiRef?: string;
  deviceId?: string;
  status: OrderStatus;
  createdAt: string; 
};

export type DailyReport = {
  revenue: number;
  orders: number;
  averageBill: number;
  peakHour: string | null;
  topProducts: { name: string; sold: number }[];
  paymentBreakdown: { method: string; amount: number }[];
  peakHours: { hour: number; orders: number; revenue: number }[];
  weekdayPattern: { day: string; orders: number; revenue: number }[];
  hourlyActivity?: number[];
};
