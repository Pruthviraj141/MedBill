import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, UploadCloud, CheckCircle2, X, Edit2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { productsRepository } from '../../db/repositories/productsRepository';
import { settingsRepository } from '../../db/repositories/settingsRepository';
import { useProducts } from '../../hooks/useProducts';
import { useSettings } from '../../hooks/useSettings';
import { StateView } from '../../components/ui/StateView';
import { formatMoney } from '../../utils/format';
import type { Product } from '../../types';

type ProductForm = { name: string; categoryId: string; price: string };
const productSchema = z.object({ 
  name: z.string().trim().min(1, 'Name is required'), 
  categoryId: z.string().trim().min(1, 'Category is required'), 
  price: z.coerce.number().positive('Price must be greater than zero') 
});

// Offline image handler via FileReader (no external cloud needed)


export function Products() {
  const productsQuery = useProducts();
  const settingsQuery = useSettings();
  const topRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
  
  // Category state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');

  const form = useForm<ProductForm>({ defaultValues: { name: '', categoryId: '', price: '' } });
  
  const products = productsQuery.data ?? [];
  const settings = settingsQuery.data ?? {};

  // Resolve distinct categories + whatever is explicitly in settings
  const extractCategories = () => {
    const set = new Set((products || []).map(p => p.category || p.categoryId).filter(Boolean) as string[]);
    Object.keys(settings).forEach(k => {
      if (k.startsWith('category_image:')) set.add(k.replace('category_image:', ''));
    });
    return Array.from(set).sort();
  };
  const categories = extractCategories();

  const getResolvedImage = (p: Product) => {
     let raw = p.image_url || p.icon || settings['category_image:' + (p.category || p.categoryId)] || null;
     if (!raw) return null;
     return raw;
  };

  const isHttpImage = (url: string | null) => {
    if (!url) return false;
    return url.startsWith('/') || url.startsWith('http') || url.startsWith('data:');
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onSuccess(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCatName.trim()) throw new Error("Category Name is required");
      if (newCatImageUrl) {
        await settingsRepository.setSetting('category_image:' + newCatName.trim(), newCatImageUrl);
      }
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['settings'] });
       form.setValue('categoryId', newCatName.trim());
       setNewCatName('');
       setNewCatImageUrl('');
       setShowCategoryDialog(false);
    }
  });

  const upsertProductMutation = useMutation({
    mutationFn: async (payload: ProductForm & { _resolvedImg?: string }) => {
       if (editProduct) {
          await productsRepository.upsertProduct({
             ...editProduct,
             name: payload.name.trim(),
             category: payload.categoryId.trim(),
             price: Number(payload.price),
             image_url: payload._resolvedImg ?? null,
             active: editProduct.active ? 1 : 0,
             updated_at: new Date().toISOString()
          });
       } else {
          await productsRepository.addProduct({ 
             name: payload.name.trim(), 
             categoryId: payload.categoryId.trim(), 
             price: Number(payload.price), 
             active: true, 
             image_url: payload._resolvedImg || undefined
          });
       }
    },
    onSuccess: () => { 
       queryClient.invalidateQueries({ queryKey: ['products'] }); 
       form.reset(); 
       setImageUrl(''); 
       setIsAdding(false); 
       setEditProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
       await productsRepository.deleteProduct(id);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['products'] });
       form.reset();
       setImageUrl('');
       setIsAdding(false);
       setEditProduct(null);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
       await settingsRepository.removeSetting('category_image:' + categoryName.trim());
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['settings'] });
       form.setValue('categoryId', '');
    }
  });

  const submit = form.handleSubmit((values) => {
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) { form.setError('name', { message: parsed.error.issues[0]?.message }); return; }
    
    // Client-side duplicate check (API also enforces this)
    const existing = products.find(p => p.name.toLowerCase() === values.name.trim().toLowerCase() && p.id !== editProduct?.id);
    if (existing) {
       form.setError('name', { message: "Product name already exists." });
       return;
    }
    
    // Hardcode category inheritance directly into the model
    const resolvedImg = imageUrl 
       || (editProduct ? editProduct.image_url : null) 
       || settings['category_image:' + values.categoryId.trim()] 
       || undefined;
       
    if (editProduct) {
       upsertProductMutation.mutate({ ...values, _resolvedImg: resolvedImg } as any);
    } else {
       upsertProductMutation.mutate({ ...values, _resolvedImg: resolvedImg } as any);
    }
  });
  
  const startEditing = (p: Product) => {
     setIsAdding(true);
     setEditProduct(p);
     form.reset({ 
       name: p.name || '', 
       categoryId: p.category || p.categoryId || '', 
       price: (p.price ?? 0).toString() 
     });
     setImageUrl(''); // Clear staging URL
     // Snap the container to the top so they can see the form
     if (topRef.current) {
         topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
     }
  };

  const cancelEdit = () => {
     setEditProduct(null);
     setIsAdding(false);
     setImageUrl('');
     form.reset();
  };
  
  const handleDeleteImage = () => {
     if (editProduct) {
        setEditProduct({ ...editProduct, image_url: undefined }); // local optimistic wipe, will save cleanly
     }
     setImageUrl(''); // if overriding
  };

  if (productsQuery.isLoading || settingsQuery.isLoading) return <StateView kind="loading">Initialization Sequence</StateView>;

  return (
    <div className="w-full h-full flex flex-col p-4 bg-background overflow-y-auto overflow-x-hidden relative pb-24">
      <div ref={topRef} className="pb-1" />
      <section className="section-title">
        <div>
           <p className="eyebrow">MENU ADMINISTRATION</p>
           <h1>Products & Categories</h1>
        </div>
        {!editProduct && (
           <button className="primary-button" onClick={() => setIsAdding((value) => !value)}>
              <Plus size={17} /> {isAdding ? 'Cancel' : 'Add Menu Item'}
           </button>
        )}
      </section>

      {/* Form Panel for Adding / Editing */}
      {(isAdding || editProduct) && (
         <form onSubmit={submit} className="panel product-form mb-4 border border-brown/20 bg-card/80 p-4 rounded-xl flex flex-col gap-3">
           <h3 className="font-bold text-sm mb-1">{editProduct ? 'Edit Menu Item' : 'New Menu Item'}</h3>
           
           <input className="w-full h-12 px-4 rounded-xl border border-border/50 bg-card/50 !text-black dark:!text-white !placeholder-black/50 dark:!placeholder-white/50 focus:outline-none focus:border-primary/50" placeholder="Product name" {...form.register('name')} />
           
           <div className="flex gap-2">
             <select className="flex-[3] h-12 px-4 rounded-xl border border-border/50 bg-card/50 focus:outline-none focus:border-primary/50 text-sm font-bold !text-black dark:!text-white appearance-none" {...form.register('categoryId')}>
               <option value="" disabled>Select Category</option>
               {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             {form.watch('categoryId') && (
                <button 
                   type="button"
                   disabled={deleteCategoryMutation.isPending}
                   onClick={() => {
                      if (confirm(`Are you sure you want to delete the category "${form.watch('categoryId')}"?`)) {
                         deleteCategoryMutation.mutate(form.watch('categoryId'));
                      }
                   }} 
                   className="aspect-square h-12 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 transition-colors"
                 >
                   {deleteCategoryMutation.isPending ? <span className="opacity-50 font-bold text-xs">...</span> : <Trash2 size={20}/>}
                </button>
             )}
             <button type="button" onClick={() => setShowCategoryDialog(true)} className="aspect-square h-12 bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center justify-center text-primary transition-colors">
                <Plus size={24}/>
             </button>
           </div>

           <input className="w-full h-12 px-4 rounded-xl border border-border/50 bg-card/50 !text-black dark:!text-white !placeholder-black/50 dark:!placeholder-white/50 focus:outline-none focus:border-primary/50" type="number" min="1" step="1" placeholder="Price (Whole number)" {...form.register('price')} />
           
           <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/30 rounded-xl border border-border">
             <span className="text-xs font-bold text-muted-foreground uppercase">Product Image (Offline Storage)</span>
             <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={e => handleFileSelect(e, setImageUrl)} />
             <div className="flex gap-2">
               {editProduct && (editProduct.image_url || getResolvedImage(editProduct)) ? (
                  <div className="flex-1 flex gap-2">
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold bg-background border transition-all text-foreground hover:bg-muted">
                       <Edit2 size={14}/> Replace
                     </button>
                     {(editProduct.image_url || imageUrl) && (
                       <button type="button" onClick={handleDeleteImage} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold bg-destructive/10 text-destructive border-destructive/20 border transition-all hover:bg-destructive/20">
                         <Trash2 size={14}/> Remove
                       </button>
                     )}
                  </div>
               ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-colors ${imageUrl ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                     {imageUrl ? <><CheckCircle2 size={16}/> Offline Image Selected</> : <><UploadCloud size={16}/> Select Offline Image</>}
                  </button>
               )}
             </div>
             {/* Hint about inheritance */}
             {form.watch('categoryId') && settings['category_image:' + form.watch('categoryId')] && !imageUrl && (!editProduct || !editProduct.image_url) && (
                 <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                   <CheckCircle2 size={12}/> Inheriting {form.watch('categoryId')} Category Image natively.
                 </p>
             )}
             {imageUrl && (
                 <p className="text-[11px] font-medium text-amber-600 mt-1 flex items-center gap-1">
                   <ImageIcon size={12}/> Pending new upload.
                 </p>
             )}
           </div>
  
           <div className="flex gap-2 mt-2">
             {editProduct && (
                <button 
                   type="button" 
                   disabled={deleteProductMutation.isPending}
                   className="flex-1 font-bold text-[11px] uppercase tracking-wider bg-red-500/10 text-red-600 hover:bg-red-500/20 h-11 rounded-[12px] flex items-center justify-center gap-1 transition-colors"
                   onClick={() => {
                      if (confirm(`Delete product ${editProduct.name}?`)) {
                         deleteProductMutation.mutate(editProduct.id);
                      }
                   }}
                >
                   {deleteProductMutation.isPending ? '...' : <><Trash2 size={12}/> Del</>}
                </button>
             )}
             {editProduct && <button type="button" className="flex-1 font-bold text-[11px] uppercase tracking-wider bg-muted/60 text-muted-foreground hover:bg-muted/80 hover:text-foreground h-11 rounded-[12px] transition-colors" onClick={cancelEdit}>Cancel</button>}
             <button className="primary-button flex-[2]" type="submit" disabled={upsertProductMutation.isPending}>
               {upsertProductMutation.isPending ? 'Saving...' : 'Save Product'}
             </button>
           </div>
           {form.formState.errors.name ? <p className="form-error">{form.formState.errors.name.message}</p> : null}
           {upsertProductMutation.isError ? <p className="form-error">Could not save product.</p> : null}
         </form>
      )}
  
      {/* Create Category Modal */}
      {showCategoryDialog && (
         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-[24px] p-5 shadow-2xl flex flex-col gap-4">
               <div className="flex justify-between items-center bg-transparent">
                  <h2 className="text-lg font-black tracking-tight">Create Category</h2>
                  <button onClick={() => setShowCategoryDialog(false)} className="opacity-50 hover:opacity-100 p-1 bg-transparent"><X size={20}/></button>
               </div>
               <p className="text-sm text-muted-foreground leading-snug">Categories organize your medical catalog. You can optionally attach an icon or image.</p>
               
               <input className="w-full h-12 px-4 rounded-xl border border-border/50 bg-card/50 !text-black dark:!text-white !placeholder-black/50 dark:!placeholder-white/50 focus:outline-none focus:border-primary/50" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category Name (e.g. Antibiotics, Syrups)" />
               
               <input type="file" ref={catFileInputRef} accept="image/*" className="hidden" onChange={e => handleFileSelect(e, setNewCatImageUrl)} />
               <button type="button" onClick={() => catFileInputRef.current?.click()} className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold border transition-colors ${newCatImageUrl ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                     {newCatImageUrl ? <><CheckCircle2 size={18}/> Image Selected</> : <><UploadCloud size={18}/> Category Image (Optional)</>}
               </button>
  
               <button 
                  onClick={() => createCategoryMutation.mutate()} 
                  disabled={!newCatName.trim() || createCategoryMutation.isPending}
                  className="primary-button h-12 mt-2 disabled:opacity-50"
               >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create & Save'}
               </button>
               {createCategoryMutation.isError && <p className="text-red-500 text-xs font-bold text-center mt-1">Error: Could not save category onto backend.</p>}
            </div>
         </div>
      )}

    {/* Existing Render Grids */}
    {productsQuery.isLoading ? <StateView kind="loading">Loading products</StateView> : null}
    {productsQuery.isError ? <StateView kind="error" onRetry={() => productsQuery.refetch()}>Products could not be loaded</StateView> : null}
    {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? <StateView kind="empty">No products yet. Add your first product.</StateView> : null}
    
    <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
       {products.map((product) => {
          const rImage = getResolvedImage(product);
          return (
          <div className="manage-card flex flex-col bg-card border border-line rounded-2xl p-3 gap-2 relative overflow-hidden transition-all hover:border-brown/40 cursor-pointer" key={product.id} onClick={() => startEditing(product)}>
             <div className="flex justify-between items-start">
               <span className="w-10 h-10 flex items-center justify-center bg-muted/40 rounded-xl overflow-hidden shrink-0">
                  {isHttpImage(rImage) ? <img src={rImage!} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-lg opacity-60 font-bold">{rImage || '•'}</span>}
               </span>
               <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${product.active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                  {product.active ? 'Active' : 'Offline'}
               </span>
             </div>
             <div className="mt-1">
               <strong className="block text-sm font-bold leading-tight truncate">{product.name}</strong>
               <span className="block text-[11px] text-muted-foreground font-medium mt-0.5">{product.category || product.categoryId || 'General'}</span>
             </div>
             <div className="mt-auto pt-2 border-t border-line flex justify-between items-center">
               <b className="text-sm tracking-tight text-brown">{formatMoney(product.price)}</b>
               <button className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"><Edit2 size={10}/> EDIT</button>
             </div>
          </div>
       )})}
    </section>
  </div>
  );
}
