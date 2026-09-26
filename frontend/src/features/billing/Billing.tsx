import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Banknote, Clock, Minus, Plus,
  Receipt, Scan, Search, ShoppingCart, Sparkles, Trash2, X,
} from 'lucide-react';
import { checkoutService } from '../../services/checkoutService';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../stores/cartStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import type { Order, PaymentMethod, Product } from '../../types';
import { formatMoney } from '../../utils/format';
import { Skeleton } from '../../components/ui/skeleton';
import { Separator } from '../../components/ui/separator';
import { motion } from 'framer-motion';
import { AnimatedTicket } from '../../components/ui/ticket-confirmation-card';
// FIX 1: Import printer service to wire thermal receipt printing into the Android checkout flow.
import { printerService, printQueue } from '../../services/printer/printerService';

const RECENT_KEY = 'tbt_recent_products';
const MAX_RECENT = 12;

function getRecentIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}
function pushRecentId(id: string) {
  const list = [id, ...getRecentIds().filter((x) => x !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function Billing() {
  const productsQuery = useProducts();
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const clear = useCartStore((s) => s.clear);

  const [searchRaw, setSearchRaw] = useState('');
  const search = useDeferredValue(searchRaw);
  const [cat, setCat] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const products = productsQuery.data ?? [];

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category || p.categoryId || 'General')));
    return ['All', 'Recent', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const pCat = p.category || p.categoryId || 'General';
      const matchCat =
        cat === 'All' ? true :
          cat === 'Recent' ? getRecentIds().includes(p.id) :
            pCat === cat;
      return matchCat && (!q || p.name.toLowerCase().includes(q));
    });
  }, [cat, products, search]);

  const quantities = useMemo(() => new Map(items.map((i) => [i.id, i.quantity])), [items]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const checkout = useMutation({
    mutationFn: async (pm: PaymentMethod) => {
      const dbOrder = await checkoutService.createOrder(
        items.map((i) => ({ productId: i.id, quantity: i.quantity })),
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
        items: items.map(i => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          total: i.price * i.quantity
        }))
      };
      return uiOrder;
    },
    onSuccess: (uiOrder) => {
      setLastOrder(uiOrder);
      clear();
      setCartOpen(false);
      // FIX 1: Trigger thermal receipt printing after the checkout has committed.
      // Fire-and-forget: a print failure NEVER affects the order result.
      // If printing fails, the job is queued in localStorage for retry via Settings.
      printerService.printOrder(uiOrder, uiOrder.items).then(ok => {
        if (!ok) printQueue.addFailedJob(uiOrder, uiOrder.items);
      });
    },
  });

  const handleAdd = useCallback((id: string) => {
    const p = productById.get(id);
    if (p) { add(p); pushRecentId(id); }
  }, [add, productById]);

  const handleStep = useCallback((id: string, d: number) => updateQty(id, d), [updateQty]);
  const clearSearch = useCallback(() => setSearchRaw(''), []);

  if (lastOrder) return <AnimatedTicket order={lastOrder} onNewBill={() => setLastOrder(null)} />;

  return (
    <div className="flex flex-col w-full h-full pb-20">

      {/* Search Bar */}
      <div className="relative flex items-center w-full mb-4 px-1">
        <div className="absolute left-4 text-muted-foreground"><Search size={18} /></div>
        <input
          type="text"
          placeholder="Search for coffee, snacks, pizza..."
          className="w-full h-12 pl-11 pr-11 rounded-3xl border border-transparent bg-white dark:bg-[#1C1C1E] text-foreground text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm dark:shadow-none dark:border-white/5"
          value={searchRaw}
          onChange={e => setSearchRaw(e.target.value)}
        />
        <button
          className="absolute right-3 p-1.5 text-muted-foreground rounded-full hover:bg-muted/50 active:bg-muted transition-colors opacity-80"
          onClick={() => searchRaw ? clearSearch() : null}
        >
          {searchRaw ? <X size={18} /> : <Scan size={18} />}
        </button>
      </div>

      {/* Category Chips ScrollArea */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-2 no-scrollbar px-1 snap-x">
        {categories.map(c => (
          <button
            key={c}
            className={`snap-start flex-none flex items-center justify-center h-[38px] px-4 rounded-full text-[13px] font-medium transition-all active:scale-95 ${cat === c ? 'bg-[#513217] text-white dark:bg-[#EAD6C0] dark:text-[#1A1917] shadow-md border-transparent' : 'bg-white dark:bg-transparent text-foreground border border-border/80 dark:border-white/10 hover:border-border'}`}
            onClick={() => setCat(c)}
          >
            {c === 'Recent' && <Clock size={13} className="mr-1.5 opacity-80" />}
            {c}
          </button>
        ))}
      </div>

      {/* Grid States */}
      {productsQuery.isLoading && (
        <div className="grid grid-cols-3 gap-3 px-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col w-full rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-border/40 dark:border-transparent overflow-hidden shadow-sm">
              <Skeleton className="w-full pt-[90%] rounded-none" />
              <div className="p-3 pb-4">
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {productsQuery.isError && (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <span className="text-4xl mb-3">☕</span>
          <strong className="text-foreground text-[15px]">Menu unavailable</strong>
          <span className="text-muted-foreground text-[13px] mt-1 mb-4">Could not load products</span>
          <button className="px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground font-bold border text-[13px] active:scale-95" onClick={() => productsQuery.refetch()}>Retry</button>
        </div>
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <span className="text-4xl mb-3">📋</span>
          <strong className="text-foreground text-[15px]">No products yet</strong>
          <span className="text-muted-foreground text-[13px] mt-1">Add your first product in settings.</span>
        </div>
      )}

      {!productsQuery.isLoading && products.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <span className="text-4xl mb-3">🔍</span>
          <strong className="text-foreground text-[15px]">No results found</strong>
          <span className="text-muted-foreground text-[13px] mt-1">Try a different search or category filter.</span>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 px-1">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              quantity={quantities.get(p.id) ?? 0}
              onAdd={handleAdd}
              onStep={handleStep}
            />
          ))}
        </div>
      )}

      {/* Sticky Cart Bar */}
      {items.length > 0 && (
        <div
          className="fixed bottom-[84px] left-4 right-4 z-20 flex items-center justify-between h-[64px] px-2 pl-5 bg-white dark:bg-[#1A1A1C] border border-border/50 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer active:scale-[0.98] transition-all animate-in slide-in-from-bottom-5"
          onClick={() => setCartOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="relative pt-1">
              <ShoppingCart size={22} className="text-foreground opacity-80" strokeWidth={2} />
              <span className="absolute -top-1 -right-2 min-w-[20px] h-[20px] px-1 flex items-center justify-center bg-[#E1884B] text-white text-[11px] font-bold rounded-full shadow-sm">
                {itemCount}
              </span>
            </div>
            <div className="flex flex-col ml-1">
              <strong className="text-[17px] font-bold tabular-nums leading-tight">{formatMoney(total)}</strong>
              <span className="text-[12px] font-medium text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button className="flex items-center justify-center gap-1.5 h-[46px] px-5 rounded-full bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] text-[14px] font-bold active:opacity-80 transition-colors shadow-sm">
            <span className="hidden dark:inline">View Cart</span><span className="dark:hidden">Bill Now</span> <span className="text-[16px] font-normal leading-none">→</span>
          </button>
        </div>
      )}

      {/* Cart Checkout Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="p-0 border-t-0 rounded-t-3xl max-h-[85vh] flex flex-col bg-card dark:bg-[#1C1A19]">
          <div className="w-12 h-1.5 mx-auto mt-3 rounded-full bg-border" />

          <SheetHeader className="px-5 py-4 pb-2 flex flex-row items-center justify-between shadow-sm z-10 border-b border-border/40">
            <SheetTitle className="text-xl font-black text-foreground m-0">Current Bill</SheetTitle>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground active:scale-95 transition-transform" onClick={() => setCartOpen(false)}>
              <X size={18} strokeWidth={3} />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-3 no-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <ShoppingCart size={40} className="mb-4 text-muted-foreground" />
                <strong className="text-foreground text-[16px]">Bill is empty</strong>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  {items.map((item) => (
                    <div className="flex items-center gap-3 py-3.5 border-b border-border/40" key={item.id}>
                      <span className="w-10 h-10 flex flex-none items-center justify-center text-[22px] bg-secondary/60 rounded-xl">
                        {((item.icon || item.image_url)?.startsWith('/') || (item.icon || item.image_url)?.startsWith('http')) ? <img src={item.icon || item.image_url} alt={item.name} className="w-7 h-7 object-contain" /> : (item.icon || item.image_url || '•')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <strong className="block text-[14px] font-bold text-foreground truncate">{item.name}</strong>
                        <span className="block text-[12px] text-muted-foreground mt-0.5">{formatMoney(item.price)}</span>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <button className="w-8 h-8 rounded-full bg-card border shadow-sm text-foreground flex items-center justify-center active:scale-[0.85] transition-transform" onClick={() => updateQty(item.id, -1)}>
                          {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} strokeWidth={3} />}
                        </button>
                        <b className="w-6 text-center text-[14px] font-black tabular-nums">{item.quantity}</b>
                        <button className="w-8 h-8 rounded-full bg-[#3E2009] dark:bg-[#C9956A] text-white dark:text-[#1A1917] shadow-sm flex items-center justify-center active:scale-[0.85] transition-transform" onClick={() => updateQty(item.id, 1)}>
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <strong className="w-16 text-right text-[15px] font-black text-foreground tabular-nums">
                        {formatMoney(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-secondary/40 border border-border/40 flex flex-col gap-2.5">
                  <div className="flex justify-between text-[14px] text-muted-foreground"><span>Subtotal</span><span className="font-semibold text-foreground">{formatMoney(subtotal)}</span></div>

                  <Separator className="my-1.5 opacity-60" />
                  <div className="flex justify-between items-center"><span className="text-[17px] font-bold text-foreground">Total</span><strong className="text-[22px] font-black text-primary tabular-nums">{formatMoney(total)}</strong></div>
                </div>

                <div className="mt-6">
                  <p className="text-[12px] font-black uppercase tracking-wider text-muted-foreground mb-3 px-1">Select Payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { method: 'CASH' as PaymentMethod, label: 'CASH', Icon: Banknote, bg: 'bg-[#B47C44]', fg: 'text-white' },
                      { method: 'UPI' as PaymentMethod, label: 'UPI', Icon: Sparkles, bg: 'bg-[#7656B8]', fg: 'text-white' },
                    ]).map(({ method, label, Icon, bg, fg }) => (
                      <button
                        key={method}
                        className={`relative w-full h-[64px] flex items-center gap-2 ${bg} ${fg} rounded-2xl shadow-sm px-4 active:scale-95 transition-all overflow-hidden ${checkout.isPending ? 'opacity-50' : 'opacity-100'}`}
                        disabled={checkout.isPending}
                        onClick={() => checkout.mutate(method)}
                      >
                        <div className="flex flex-col items-start gap-1 z-10 w-full">
                          <div className="flex items-center gap-1.5">
                            <Icon size={16} strokeWidth={2.5} />
                            <span className="text-[13px] font-black tracking-widest">{label}</span>
                          </div>
                          <span className="text-[15px] font-bold opacity-90 leading-none">{formatMoney(total)}</span>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 translate-x-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {checkout.isError && <p className="text-center text-sm font-bold text-destructive mt-4">Payment failed. Please try again.</p>}

                <button className="w-full flex items-center justify-center gap-2 mt-6 h-12 text-[14px] font-bold text-destructive active:bg-destructive/10 rounded-xl transition-colors" onClick={clear} disabled={checkout.isPending}>
                  <Trash2 size={16} strokeWidth={2.5} /> Clear All Items
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({
  product, quantity, onAdd, onStep,
}: { product: Product; quantity: number; onAdd: (id: string) => void; onStep: (id: string, d: number) => void }) {
  const blockRef = useRef(false);

  const handleCard = () => {
    if (blockRef.current) return;
    onAdd(product.id);
  };

  return (
    <div
      className={`relative flex flex-col w-full rounded-[24px] bg-white dark:bg-[#1C1C1E] overflow-hidden transition-all active:scale-[0.97] ${quantity > 0 ? 'ring-2 ring-[#E1884B]' : 'shadow-sm border border-border/50 dark:border-transparent'}`}
      role="button"
      tabIndex={0}
      onClick={handleCard}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd(product.id); } }}
      aria-label={`${product.name} ${formatMoney(product.price)}`}
    >
      <div className="relative w-full pt-[90%] bg-[#F5F2EF] dark:bg-[#2C2C2E] overflow-hidden flex-none">
        {(product.icon || product.image_url)
          ? <span className="absolute inset-0 flex items-center justify-center text-[44px] drop-shadow-sm">
              {((product.icon || product.image_url)?.startsWith('/') || (product.icon || product.image_url)?.startsWith('http')) ? <img src={product.icon || product.image_url} alt={product.name} className="w-20 h-20 object-contain drop-shadow-md" /> : (product.icon || product.image_url)}
            </span>
          : <span className="absolute inset-0 flex items-center justify-center text-[38px] drop-shadow-sm opacity-60" aria-hidden>☕</span>
        }
      </div>

      <div className="flex-1 flex flex-col p-2.5 pb-3">
        <span className="text-[12px] font-medium leading-[1.1] text-foreground line-clamp-2">{product.name}</span>
        <span className="text-[13px] font-bold text-foreground mt-1 tabular-nums">₹ {product.price}</span>
      </div>

      {quantity === 0 ? (
        <button
          className="absolute right-2 bottom-2 w-[28px] h-[28px] rounded-full bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] flex items-center justify-center active:scale-90 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            blockRef.current = true;
            onAdd(product.id);
            setTimeout(() => { blockRef.current = false; }, 60);
          }}
          aria-label={`Add ${product.name}`}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      ) : (
        <div
          className="absolute right-2 bottom-2 flex items-center gap-1 px-1 py-0.5 rounded-full bg-[#513217] dark:bg-[#EAD6C0] text-white dark:text-[#1A1917] shadow-sm transform transition-all animate-in zoom-in"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={() => { blockRef.current = true; }}
          onPointerUp={() => setTimeout(() => { blockRef.current = false; }, 60)}
        >
          <button className="w-[22px] h-[22px] rounded-full bg-transparent flex items-center justify-center hover:opacity-80 active:scale-90 transition-transform" onClick={() => onStep(product.id, -1)} aria-label="Remove one">
            <Minus size={14} strokeWidth={3} />
          </button>
          <b className="min-w-[14px] text-center text-[12px] font-bold tabular-nums leading-none">{quantity}</b>
          <button className="w-[22px] h-[22px] rounded-full bg-transparent flex items-center justify-center hover:opacity-80 active:scale-90 transition-transform" onClick={() => onStep(product.id, 1)} aria-label="Add one">
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
});

// ─── End of Billing Component ───────────────────────────────────────────────────────────
