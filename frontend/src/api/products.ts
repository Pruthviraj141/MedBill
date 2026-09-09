import { apiClient } from './client';
import type { Product } from '../types';

export const getProducts = () => apiClient.get<{ products: Product[] }>('/api/products');
export const addProduct = (data: Partial<Product>) => apiClient.post('/api/products', data);
