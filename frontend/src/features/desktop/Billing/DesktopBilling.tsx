import React, { useState, useMemo } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCartStore } from '../../../stores/cartStore';
import { checkoutService } from '../../../services/checkoutService';
import { Search, ShoppingCart, Loader2, Minus, Plus, Trash2, CheckCircle, CreditCard, Banknote, Clock } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { printerService } from '../../../services/printer/printerService';
import { printQueue } from '../../../services/printer/printQueue';
import type { Product, Order, PaymentMethod } from '../../../types';
import { AnimatedTicket } from '../../../components/ui/ticket-confirmation-card';
import { ScrollArea, ScrollBar } from '../../../components/ui/scroll-area';

const RECENT_KEY = 'medbill_recent_products';
const MAX_RECENT = 12;

function getRecentIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}
function pushRecentId(id: string) {
  const list = [id, ...getRecentIds().filter((x) => x !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function DesktopBilling() {
  const { data: products = [], isLoading } = useProducts();
  const cartStore = useCartStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Derive categories automatically
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter((c): c is string => Boolean(c)));
    return ['Recent', 'All', ...Array.from(cats)].sort((a, b) => {
        if (a === 'Recent') return -1;
        if (b === 'Recent') return 1;
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
    });
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.active) return false;
      
      if (selectedCategory === 'Recent') {
        if (!getRecentIds().includes(p.id)) return false;
      } else if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, search, selectedCategory]);

  const handleAdd = (product: Product) => {
    cartStore.add(product);
    pushRecentId(product.id);
  };

  const checkout = useMutation({
    mutationFn: async (pm: PaymentMethod) => {
      const dbOrder = await checkoutService.createOrder(
        cartStore.items.map(i => {
          const m = i.dosageSchedule?.morning ?? 0;
          const a = i.dosageSchedule?.afternoon ?? 0;
          const n = i.dosageSchedule?.night ?? 0;
          return {
            productId: i.id,
            quantity: i.quantity,
            dosageSchedule: `${m}-${a}-${n}`,
          };
        }),
        pm
      );
      const uiOrder: Order = {
        id: dbOrder.id,
        _id: dbOrder.id,
        invoiceNumber: dbOrder.invoice_number,
        cafeId: "",
        status: dbOrder.status as any,
        subtotal: dbOrder.subtotal,
        grandTotal: dbOrder.total,
        paymentMethod: dbOrder.payment_method as any,
        createdAt: dbOrder.created_at,
        items: cartStore.items.map(i => {
          const m = i.dosageSchedule?.morning ?? 0;
          const a = i.dosageSchedule?.afternoon ?? 0;
          const n = i.dosageSchedule?.night ?? 0;
          return {
            productId: i.id,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            total: i.price * i.quantity,
            dosageSchedule: `${m}-${a}-${n}`,
          };
        })
      };
      return uiOrder;
    },
    onSuccess: (uiOrder) => { 
      setLastOrder(uiOrder); 
      cartStore.clear(); 
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Fire-and-forget print hook strictly separated from local SQLite sync state bounds
      printerService.printOrder(uiOrder, uiOrder.items).then(success => {
         if (!success) {
             printQueue.addFailedJob(uiOrder, uiOrder.items);
         }
      });
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-220px)] gap-8">
      
      {/* LEFT PANE: Products (70%) */}
      <div className="flex-1 flex flex-col gap-6 desktop-card bg-card/50 backdrop-blur-md p-8 border border-border/50 min-h-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Menu</h1>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search medicines, tablets, syrups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap pb-4 pt-1">
          <div 
            className="flex w-max gap-3 snap-x"
            onWheel={(e) => {
              const container = e.currentTarget.closest('[data-radix-scroll-area-viewport]');
              if (container) container.scrollLeft += e.deltaY;
            }}
          >
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`flex items-center gap-2 snap-start px-6 py-2.5 rounded-full font-bold text-sm transition-all border border-transparent ${
                  selectedCategory === c 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105 border-primary/20' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border/40 hover:border-border hover:shadow-sm'
                }`}
              >
                {c === 'Recent' && <Clock size={16} className={selectedCategory === c ? "text-primary-foreground opacity-90" : "text-muted-foreground"} />}
                {c}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Product Grid */}
        <div className="flex-1 overflow-hidden min-h-0 relative">
          <ScrollArea className="absolute inset-0 h-full w-full pr-4 pb-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
              {filteredProducts.map(product => {
                const cartQty = cartStore.items.find(i => i.id === product.id)?.quantity || 0;
                return (
                  <button 
                    key={product.id}
                    onClick={() => handleAdd(product)}
                    className={`group relative flex flex-col items-center text-center p-5 rounded-3xl border shadow-sm transition-all active:scale-95 ${
                      cartQty > 0 
                        ? 'bg-primary/5 border-primary/50 shadow-md ring-1 ring-primary/20 hover:shadow-lg' 
                        : 'bg-background border-border hover:border-primary/50 hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {cartQty > 0 && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-lg border-2 border-background z-10 animate-in zoom-in slide-in-from-bottom-2 duration-300">
                        {cartQty}
                      </div>
                    )}
                    <div className="w-28 h-28 rounded-full bg-secondary/50 mb-4 p-4 flex items-center justify-center transition-transform group-hover:scale-110">
                      {(() => {
                          const img = product.category?.includes('Maggi') ? '/images/maggie.png' :
                                      product.category === 'Shake' ? '/images/shake.png' :
                                      product.category === 'Nuggets' ? '/images/nuggets.png' :
                                      product.category === 'Mocktail' ? '/images/mocktail.png' : product.image_url;
                          return img ? (
                            <img src={img} alt={product.name} className="w-full h-full object-contain drop-shadow-md" />
                          ) : (
                            <ShoppingCart className="w-10 h-10 text-muted-foreground opacity-50" />
                          );
                      })()}
                    </div>
                    <h3 className={`font-bold text-[15px] line-clamp-2 leading-tight ${cartQty > 0 ? 'text-primary' : 'text-foreground'}`}>{product.name}</h3>
                    <span className="mt-2 px-4 py-1.5 bg-black/5 dark:bg-white/10 rounded-full text-sm font-black text-primary">
                      ₹{product.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                   <Search size={48} className="mb-4 text-muted-foreground" />
                   <p className="text-lg text-foreground font-black">No products found</p>
                   <p className="text-sm font-semibold text-muted-foreground mt-1">Try selecting a different category or search term.</p>
                </div>
              )}
             </div>
          </ScrollArea>
        </div>
      </div>

      {/* RIGHT PANE: Cart */}
      <div className="w-[360px] flex flex-col bg-background desktop-card border border-border/50 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] relative overflow-hidden min-h-0">
        {/* Dynamic header background blending */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent pointer-events-none" />
        
        <div className="px-6 pt-8 pb-5 relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <ShoppingCart className="text-primary" />
            Current Order
          </h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            {cartStore.items.reduce((sum, item) => sum + item.quantity, 0)} items in cart
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-hidden min-h-0 relative">
          <ScrollArea className="absolute inset-0 h-full w-full px-6 py-1">
            {cartStore.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 py-12">
                <ShoppingCart size={48} strokeWidth={1.5} />
                <p className="font-semibold text-base">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cartStore.items.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 bg-secondary/30 p-2.5 rounded-2xl border border-border/50 group hover:border-border transition-colors">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                         <img src={item.image_url} className="w-12 h-12 object-contain rounded-xl bg-background p-1.5 shadow-sm border border-border/30" />
                      ) : (
                         <div className="w-12 h-12 rounded-xl bg-background shadow-sm border border-border/30 flex items-center justify-center opacity-70">
                           <ShoppingCart size={18}/>
                         </div>
                      )}
                      <div className="flex-1 overflow-hidden pr-2">
                        <h4 className="text-sm font-bold truncate leading-tight mb-0.5">{item.name}</h4>
                        <span className="text-xs font-black text-primary/80">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-background rounded-full p-1 border border-border">
                        <button 
                          onClick={() => cartStore.updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                        >
                          {item.quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <span className="w-4 text-center text-sm font-black">{item.quantity}</span>
                        <button 
                          onClick={() => cartStore.updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Dosage Schedule: Morning (M), Afternoon (A), Night (N) */}
                    <div className="flex items-center justify-between bg-background/80 px-2 py-1.5 rounded-xl border border-border/40">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">Dose:</span>
                        {(['morning', 'afternoon', 'night'] as const).map(period => {
                          const label = period === 'morning' ? 'Morning (M)' : period === 'afternoon' ? 'Afternoon (A)' : 'Night (N)';
                          const short = period === 'morning' ? 'M' : period === 'afternoon' ? 'A' : 'N';
                          const val = item.dosageSchedule?.[period] ?? 0;
                          const isActive = val === 1;
                          return (
                            <button
                              key={period}
                              type="button"
                              title={label}
                              onClick={() => cartStore.toggleDosage(item.id, period)}
                              className={`px-2 py-0.5 text-xs font-black rounded-lg transition-all flex items-center gap-1 border active:scale-95 ${
                                isActive
                                  ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                                  : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/50'
                              }`}
                            >
                              <span>{short}</span>
                              <span className={`text-[10px] px-1 rounded font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-secondary text-foreground'}`}>
                                {val}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="font-mono font-black text-[11px] text-primary">
                        {`${item.dosageSchedule?.morning ?? 0}-${item.dosageSchedule?.afternoon ?? 0}-${item.dosageSchedule?.night ?? 0}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-background border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
          <div className="flex justify-between items-end mb-5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtotal</span>
            <span className="text-2xl font-black text-foreground">₹{cartStore.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
          </div>

          {checkout.isError && <div className="text-destructive font-bold text-center text-sm mb-4">Payment failed. Please try again.</div>}
          
          <div className="flex gap-3">
            <button
              disabled={cartStore.items.length === 0 || checkout.isPending}
              onClick={() => checkout.mutate('CASH')}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Banknote size={20} /> CASH
            </button>
            <button
              disabled={cartStore.items.length === 0 || checkout.isPending}
              onClick={() => checkout.mutate('UPI')}
              className="flex-[1.5] bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white shadow-xl hover:opacity-90 disabled:opacity-50 h-14 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {checkout.isPending ? <Loader2 size={24} className="animate-spin" /> : <CreditCard size={24} />}
              UPI
            </button>
          </div>
        </div>
      </div>

      {lastOrder && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
           <AnimatedTicket order={lastOrder} onNewBill={() => setLastOrder(null)} />
        </div>
      )}
    </div>
  );
}
