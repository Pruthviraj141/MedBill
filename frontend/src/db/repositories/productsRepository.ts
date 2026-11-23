import { getDB } from '../database';
import { Product } from '../types';
import { Capacitor } from '@capacitor/core';
import { webApiClient } from '../../lib/webApiClient';
import { generateId } from '../../utils/generateId';
import { defaultCatalog } from '../defaultCatalog';

const WEB_STORAGE_KEY = 'medbill_web_products';

const getWebLocalProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  const initial = (defaultCatalog as any[]).map((p: any) => ({
    id: p.id || p._id,
    name: p.name,
    price: Number(p.price) || 0,
    category: p.category,
    image_url: p.icon || p.image_url || null,
    icon: p.icon || p.image_url || null,
    active: p.active ? 1 : 0,
    updated_at: new Date().toISOString()
  }));
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
};

const saveWebLocalProducts = (products: Product[]) => {
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {}
};

// ----------------------------------------------------------------------
// NATIVE IMPLEMENTATION
// ----------------------------------------------------------------------
const nativeImpl = {
  getAllProducts: async (): Promise<Product[]> => {
    const db = await getDB();
    const res = await db.query(`SELECT * FROM products ORDER BY name ASC`);
    return res.values as Product[] || [];
  },

  getActiveProducts: async (): Promise<Product[]> => {
    const db = await getDB();
    const res = await db.query(`SELECT * FROM products WHERE active = 1 ORDER BY name ASC`);
    return res.values as Product[] || [];
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const db = await getDB();
    const res = await db.query(`SELECT * FROM products WHERE id = ?`, [id]);
    return res.values?.[0] as Product || null;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const db = await getDB();
    const searchPattern = `%${query}%`;
    const res = await db.query(
      `SELECT * FROM products WHERE active = 1 AND (name LIKE ? OR category LIKE ?) ORDER BY name ASC`, 
      [searchPattern, searchPattern]
    );
    return res.values as Product[] || [];
  },
  
  upsertProduct: async (p: Product) => {
    const db = await getDB();
    await db.run(
      `INSERT OR REPLACE INTO products (id, name, price, category, image_url, active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.price, p.category, p.image_url, p.active, p.updated_at]
    );
  },

  addProduct: async (p: { name: string, categoryId: string, price: number, active: boolean, image_url?: string }) => {
    const db = await getDB();
    const id = generateId();
    await db.run(
      `INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, p.name, p.price, p.categoryId, p.image_url || null, p.active ? 1 : 0, new Date().toISOString()]
    );
  },

  deleteProduct: async (id: string) => {
    const db = await getDB();
    await db.run(`DELETE FROM products WHERE id = ?`, [id]);
  }
};

// ----------------------------------------------------------------------
// WEB IMPLEMENTATION
// ----------------------------------------------------------------------
const webImpl = {
  // web route returns { _id, id, name, price, category, icon, active }
  // we map it safely to Product { id, name, price, category, image_url, active: 1|0 }
  
  _fetchAndMap: async (): Promise<Product[]> => {
    try {
      const data = await webApiClient.get('/products');
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        const mapped = (data.products || []).map((p: any) => ({
           id: p.id,
           name: p.name,
           price: Number(p.price) || 0,
           category: p.category,
           image_url: p.icon || p.image_url || null,
           icon: p.icon || p.image_url || null,
           active: p.active ? 1 : 0,
           updated_at: new Date().toISOString()
        }));
        saveWebLocalProducts(mapped);
        return mapped;
      }
    } catch (e) {
      // In offline / local mode, fall back to bundled medical catalog & localStorage
    }
    return getWebLocalProducts();
  },

  getAllProducts: async (): Promise<Product[]> => {
    return webImpl._fetchAndMap();
  },

  getActiveProducts: async (): Promise<Product[]> => {
    const all = await webImpl._fetchAndMap();
    return all.filter(p => p.active === 1);
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const all = await webImpl._fetchAndMap();
    return all.find(p => p.id === id) || null;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const all = await webImpl._fetchAndMap();
    const q = query.toLowerCase();
    return all.filter(p => 
      p.active === 1 && 
      (p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)))
    );
  },
  
  upsertProduct: async (p: Product) => {
    const local = getWebLocalProducts();
    const idx = local.findIndex(item => item.id === p.id);
    if (idx >= 0) {
      local[idx] = p;
    } else {
      local.push(p);
    }
    saveWebLocalProducts(local);
    try {
      await webApiClient.post('/products', p);
    } catch (e) {}
  },

  addProduct: async (p: { name: string, categoryId: string, price: number, active: boolean, image_url?: string }) => {
    const id = generateId();
    const newProduct: Product = {
      id,
      name: p.name,
      price: p.price,
      category: p.categoryId,
      image_url: p.image_url || null,
      active: p.active ? 1 : 0,
      updated_at: new Date().toISOString()
    };
    const local = getWebLocalProducts();
    local.push(newProduct);
    saveWebLocalProducts(local);
    try {
      await webApiClient.post('/products', newProduct);
    } catch (e) {}
  },

  deleteProduct: async (id: string) => {
    const local = getWebLocalProducts().filter(p => p.id !== id);
    saveWebLocalProducts(local);
    try {
      await webApiClient.delete(`/products/${id}`);
    } catch (e) {}
  }
};

export const productsRepository = Capacitor.isNativePlatform() ? nativeImpl : webImpl;
