import { create } from 'zustand';
import type { CartItem, DosageSchedule, Product } from '../types';

type CartState = {
  items: CartItem[];
  add: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  toggleDosage: (productId: string, period: keyof DosageSchedule) => void;
  setDosage: (productId: string, dosage: DosageSchedule) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (product) => set((state) => {
    const existing = state.items.find((item) => item.id === product.id);
    if (existing) {
      return {
        items: state.items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item),
      };
    }
    return {
      items: [
        ...state.items,
        {
          ...product,
          quantity: 1,
          dosageSchedule: { morning: 0, afternoon: 0, night: 0 },
        },
      ],
    };
  }),
  updateQuantity: (productId, delta) => set((state) => ({
    items: state.items.flatMap((item) => {
      if (item.id !== productId) return [item];
      const quantity = item.quantity + delta;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }),
  })),
  toggleDosage: (productId, period) => set((state) => ({
    items: state.items.map((item) => {
      if (item.id !== productId) return item;
      const current = item.dosageSchedule || { morning: 0, afternoon: 0, night: 0 };
      const nextVal = current[period] === 1 ? 0 : 1;
      return {
        ...item,
        dosageSchedule: {
          ...current,
          [period]: nextVal,
        },
      };
    }),
  })),
  setDosage: (productId, dosage) => set((state) => ({
    items: state.items.map((item) => (item.id === productId ? { ...item, dosageSchedule: dosage } : item)),
  })),
  clear: () => set({ items: [] }),
}));
