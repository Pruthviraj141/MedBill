import { useQuery } from '@tanstack/react-query';
import { productsRepository } from '../db/repositories/productsRepository';
import type { Product } from '../types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const dp = await productsRepository.getAllProducts();
      return dp.map(p => ({
        id: p.id,
        _id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        icon: (p as any).icon || undefined,
        image_url: p.image_url || undefined,
        active: p.active === 1
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
