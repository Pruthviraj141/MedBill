import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.products,
  });
}
