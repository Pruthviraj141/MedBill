import { syncQueueRepository } from '../db/repositories/syncQueueRepository';
import { productsRepository } from '../db/repositories/productsRepository';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { ordersRepository } from '../db/repositories/ordersRepository';
import { SyncQueue, Product, Setting } from '../db/types';

import { queryClient } from '../lib/queryClient';
import { defaultCatalog } from '../db/defaultCatalog';

const API_URL = import.meta.env?.VITE_API_BASE_URL;
if (!API_URL) {
  throw new Error("VITE_API_BASE_URL is missing. Please set it explicitly in your .env configuration.");
}

let isSyncing = false;
let interval: any = null;

export const syncService = {
  startBackgroundSync: (ms = 15000) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      syncService.pushPending().catch(console.error);
      syncService.pullSystem().catch(console.error);
    }, ms);
  },
  
  stopBackgroundSync: () => {
    if (interval) clearInterval(interval);
    interval = null;
  },

  pushPending: async () => {
    if (isSyncing) return;
    
    try {
      isSyncing = true;
      const pending = await syncQueueRepository.getPending();
      if (!pending.length) return;

      const creates: SyncQueue[] = [];
      const voids: SyncQueue[] = [];

      for (const item of pending) {
        // Simple backoff check: don't sync if attempt_count is very high immediately
        if (item.attempt_count > 10) continue; // Requires manual intervention or longer backoff
        
        if (item.action === 'CREATE') creates.push(item);
        if (item.action === 'VOID') voids.push(item);
      }

      await syncBatch(creates, `${API_URL}/sync/orders`, 'orders');
      await syncBatch(voids, `${API_URL}/sync/voids`, 'voids');

    } finally {
      isSyncing = false;
    }
  },

  pullSystem: async () => {
    try {
      const prodRes = await fetch(`${API_URL}/sync/products`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const products: Product[] = data.products || [];
        for (const p of products) {
          await productsRepository.upsertProduct(p);
        }
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }

      const setRes = await fetch(`${API_URL}/sync/settings`);
      if (setRes.ok) {
        const data = await setRes.json();
        const settings: Setting[] = data.settings || [];
        for (const s of settings) {
          await settingsRepository.setSetting(s.key, s.value);
        }
      }

      // 3. Orders (incremental bidirectional sync)
      let lastOrderSync = await settingsRepository.getSetting('last_order_sync') || '1970-01-01T00:00:00.000Z';
      const orderRes = await fetch(`${API_URL}/sync/orders?last_sync=${encodeURIComponent(lastOrderSync)}`);
      if (orderRes.ok) {
        const data = await orderRes.json();
        const orders = data.orders || [];
        
        let maxTimestamp = lastOrderSync;
        for (const o of orders) {
           await ordersRepository.insertCloudOrderBase(o.order, o.items || []);
           const t = o.order.voided_at || o.order.created_at;
           if (t > maxTimestamp) maxTimestamp = t;
        }

        if (maxTimestamp > lastOrderSync) {
           await settingsRepository.setSetting('last_order_sync', maxTimestamp);
           queryClient.invalidateQueries({ queryKey: ['orders'] });
           queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      }
    } catch (e) {
      console.error('Failed to pull catalog via network, attempting emergency offline fallback...', e);
      try {
        const localProducts = await productsRepository.getAllProducts();
        if (localProducts.length === 0) {
          console.log('[SYNC] First launch network failure detected. Hydrating 51 bundled products.');
          for (const p of defaultCatalog) {
            await productsRepository.upsertProduct(p as unknown as Product);
          }
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      } catch (fallbackError) {
        console.error('Fallback hydration failed', fallbackError);
      }
    }
  }
};

async function syncBatch(queueItems: SyncQueue[], url: string, payloadKey: 'orders' | 'voids') {
  if (!queueItems.length) return;

  // Batch into chunks of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
    const chunk = queueItems.slice(i, i + BATCH_SIZE);
    const payloads = chunk.map(q => JSON.parse(q.payload));

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payloadKey]: payloads })
      });

      if (res.ok) {
        const data = await res.json();
        const processedIds = new Set(data.processed || []);
        console.log(`[SYNC DEBUG] Processed ${payloadKey} IDs from API:`, Array.from(processedIds));
        
        for (const q of chunk) {
          const p = JSON.parse(q.payload);
          console.log(`[SYNC DEBUG] Payload ID Check: ${p.id || p.order?.id}, Action: ${q.action}`);
          // Fallback checking multiple id fields if nested
          const targetId = p.id || (p.order ? p.order.id : null) || p.order_id;
          if (processedIds.has(targetId)) {
            await syncQueueRepository.markSynced(q.id);
          } else {
            console.log(`[SYNC DEBUG] ID ${targetId} was not in PROCESSED set! Marking failed. Payload =`, p);
            await syncQueueRepository.markFailed(q.id, true);
          }
        }
      } else {
        // 4xx or 5xx error
        const isPermanent = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
        for (const q of chunk) {
          // If permanent (like 400 Bad Request), mark failed but don't retry forever. 
          // Here we just increment attempt. In a robust system, we might set status to FAILED.
          await syncQueueRepository.markFailed(q.id, true);
        }
      }
    } catch (e) {
      // Network error (timeout, disconnected)
      for (const q of chunk) {
        await syncQueueRepository.markFailed(q.id, true);
      }
    }
  }
}
