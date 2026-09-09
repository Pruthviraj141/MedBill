import { create } from 'zustand';
import type { CartItem, Product } from '../types';

type CartState = {
  items: CartItem[];
  add: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
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
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  updateQuantity: (productId, delta) => set((state) => ({
    items: state.items.flatMap((item) => {
      if (item.id !== productId) return [item];
      const quantity = item.quantity + delta;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }),
  })),
  clear: () => set({ items: [] }),
}));
