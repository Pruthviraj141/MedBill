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

// IST offset in minutes (UTC+5:30 = 330 minutes)
const IST_OFFSET_MINUTES = 330;

let isSyncing = false;
let interval: any = null;

export const syncService = {
  startBackgroundSync: (ms = 15000) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      // Push and pull are fully independent — a failure in pushPending must not
      // cancel pullOrders and vice versa.
      syncService.pushPending().catch((e) =>
        console.error('[SYNC] pushPending failed:', e)
      );
      syncService.pullCatalog().catch((e) =>
        console.error('[SYNC] pullCatalog failed:', e)
      );
      syncService.pullOrders().catch((e) =>
        console.error('[SYNC] pullOrders failed:', e)
      );
    }, ms);
  },
  
  stopBackgroundSync: () => {
    if (interval) clearInterval(interval);
    interval = null;
  },

  pushPending: async () => {
    if (isSyncing) return;
    
    const pending = await syncQueueRepository.getPending();
    if (!pending.length) return;

    const creates: SyncQueue[] = [];
    const voids: SyncQueue[] = [];

    for (const item of pending) {
      if (item.action === 'CREATE') creates.push(item);
      if (item.action === 'VOID') voids.push(item);
    }

    const syncStartLog = {
      event: 'SYNC START',
      pending: pending.length,
      creates: creates.length,
      voids: voids.length,
      timestamp: new Date().toISOString()
    };
    console.log('[SYNC]', JSON.stringify(syncStartLog));

    try {
      isSyncing = true;
      await syncBatch(creates, `${API_URL}/sync/orders`, 'orders');
      await syncBatch(voids, `${API_URL}/sync/voids`, 'voids');

      const remaining = await syncQueueRepository.getPendingCount();
      console.log('[SYNC] SYNC END — remaining pending:', remaining);
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Pull products and settings from the server.
   * Independent from pullOrders — a failure here must NOT prevent orders from being pulled.
   */
  pullCatalog: async () => {
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
    } catch (e) {
      // Offline or network failure: attempt to hydrate from bundled catalog if empty
      console.warn('[SYNC] pullCatalog: network failure, checking local products...', e);
      try {
        const localProducts = await productsRepository.getAllProducts();
        if (localProducts.length === 0) {
          console.log('[SYNC] First launch — hydrating bundled product catalog.');
          for (const p of defaultCatalog) {
            await productsRepository.upsertProduct(p as unknown as Product);
          }
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      } catch (fallbackError) {
        console.error('[SYNC] Fallback hydration failed:', fallbackError);
      }
    }

    try {
      const setRes = await fetch(`${API_URL}/sync/settings`);
      if (setRes.ok) {
        const data = await setRes.json();
        const settings: Setting[] = data.settings || [];
        for (const s of settings) {
          await settingsRepository.setSetting(s.key, s.value);
        }
      }
    } catch (e) {
      console.warn('[SYNC] pullCatalog: settings fetch failed:', e);
    }
  },

  /**
   * Pull orders from the server using incremental timestamp sync.
   * CRITICAL RULE: an empty or failed server response MUST NOT clear local data.
   * Only upsert rows that are returned — local-only pending rows are never touched.
   */
  pullOrders: async () => {
    try {
      let lastOrderSync = await settingsRepository.getSetting('last_order_sync') || '1970-01-01T00:00:00.000Z';
      const orderRes = await fetch(
        `${API_URL}/sync/orders?last_sync=${encodeURIComponent(lastOrderSync)}`
      );

      if (!orderRes.ok) {
        // 4xx/5xx — server-side issue. Retain local data entirely, do not update timestamp.
        console.warn(`[SYNC] pullOrders: server returned ${orderRes.status}. Local data retained.`);
        return;
      }

      const data = await orderRes.json();
      const orders: Array<{ order: any; items: any[] }> = data.orders || [];

      if (orders.length === 0) {
        // Success but zero results — incremental sync found nothing new. That is fine.
        // Do NOT wipe local records.
        return;
      }

      let maxTimestamp = lastOrderSync;
      for (const o of orders) {
        // Conflict-resolution rule:
        //   - INSERT OR IGNORE for the base order (local pending records are never overwritten)
        //   - Only apply a status UPDATE (COMPLETED→VOIDED) if the server says voided and the
        //     local record is NOT pending sync.
        await ordersRepository.insertCloudOrderBase(o.order, o.items || []);

        const t = o.order.voided_at || o.order.created_at;
        if (t > maxTimestamp) maxTimestamp = t;
      }

      if (maxTimestamp > lastOrderSync) {
        await settingsRepository.setSetting('last_order_sync', maxTimestamp);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        console.log(`[SYNC] pullOrders: synced ${orders.length} orders, new cursor=${maxTimestamp}`);
      }
    } catch (e) {
      // Network failure: local data is retained as-is. Log and move on.
      console.warn('[SYNC] pullOrders: network error — local data intact:', e);
    }
  }
};

async function syncBatch(queueItems: SyncQueue[], url: string, payloadKey: 'orders' | 'voids') {
  if (!queueItems.length) return;

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
        const processedIds = new Set<string>(data.processed || []);

        for (const q of chunk) {
          const p = JSON.parse(q.payload);
          const targetId = p.id || (p.order ? p.order.id : null) || p.order_id;
          if (processedIds.has(targetId)) {
            await syncQueueRepository.markSynced(q.id);
            console.log(`[SYNC] Marked SYNCED: ${payloadKey} id=${targetId}`);
          } else {
            console.warn(`[SYNC] Server did not acknowledge ${payloadKey} id=${targetId}. Marking failed.`);
            await syncQueueRepository.markFailed(q.id);
          }
        }
      } else {
        // 4xx = likely a permanent error (bad payload). 5xx = transient server error.
        const isPermanentClientError = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
        for (const q of chunk) {
          await syncQueueRepository.markFailed(q.id);
          if (isPermanentClientError) {
            console.error(`[SYNC] Permanent client error (${res.status}) for ${payloadKey}, id=${q.order_id}`);
          }
        }
        console.warn(`[SYNC] syncBatch ${payloadKey}: HTTP ${res.status} — records NOT deleted, will retry.`);
      }
    } catch (e) {
      // Network error — leave records PENDING so they are retried on next tick.
      for (const q of chunk) {
        await syncQueueRepository.markFailed(q.id);
      }
      console.warn(`[SYNC] syncBatch ${payloadKey}: network error — ${chunk.length} records remain pending:`, e);
    }
  }
}

export { IST_OFFSET_MINUTES };
