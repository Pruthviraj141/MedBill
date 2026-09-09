import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { addProduct } from '../../api/products';
import { useProducts } from '../../hooks/useProducts';
import { StateView } from '../../components/ui/StateView';
import { formatMoney } from '../../utils/format';

type ProductForm = { name: string; categoryId: string; price: string };
const productSchema = z.object({ name: z.string().trim().min(1, 'Name is required'), categoryId: z.string().trim().min(1, 'Category is required'), price: z.coerce.number().positive('Price must be greater than zero') });

export function Products() {
  const productsQuery = useProducts();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const form = useForm<ProductForm>({ defaultValues: { name: '', categoryId: '', price: '' } });
  const createProduct = useMutation({
    mutationFn: (values: ProductForm) => addProduct({ name: values.name.trim(), categoryId: values.categoryId.trim(), price: Number(values.price), active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); form.reset(); setIsAdding(false); },
  });

  const submit = form.handleSubmit((values) => {
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) { form.setError('name', { message: parsed.error.issues[0]?.message }); return; }
    createProduct.mutate(values);
  });
  const products = productsQuery.data ?? [];

  return <div className="page"><section className="section-title"><div><p className="eyebrow">MENU MANAGEMENT</p><h1>Products</h1></div><button className="primary-button" onClick={() => setIsAdding((value) => !value)}><Plus size={17} /> {isAdding ? 'Cancel' : 'Add product'}</button></section>
    {isAdding ? <form onSubmit={submit} className="panel product-form"><input className="search" placeholder="Product name" {...form.register('name')} /><input className="search" placeholder="Category" {...form.register('categoryId')} /><input className="search" type="number" min="1" step="1" placeholder="Price" {...form.register('price')} /><button className="primary-button" type="submit" disabled={createProduct.isPending}>Save product</button>{form.formState.errors.name ? <p className="form-error">{form.formState.errors.name.message}</p> : null}{createProduct.isError ? <p className="form-error">Product could not be saved.</p> : null}</form> : null}
    {productsQuery.isLoading ? <StateView kind="loading">Loading products</StateView> : null}
    {productsQuery.isError ? <StateView kind="error" onRetry={() => productsQuery.refetch()}>Products could not be loaded</StateView> : null}
    {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? <StateView kind="empty">No products yet. Add your first product.</StateView> : null}
    <section className="product-manage-grid">{products.map((product) => <div className="manage-card" key={product.id}><div className="manage-top"><span className="product-emoji">{product.icon || '•'}</span><span className="stock">{product.active ? 'Active' : 'Inactive'}</span></div><strong>{product.name}</strong><span>{product.category || product.categoryId || 'General'}</span><div className="manage-bottom"><b>{formatMoney(product.price)}</b></div></div>)}</section>
  </div>;
}
