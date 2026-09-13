import { syncQueueRepository } from '../db/repositories/syncQueueRepository';
import { productsRepository } from '../db/repositories/productsRepository';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { SyncQueue, Product, Setting } from '../db/types';

const API_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8787';

let isSyncing = false;
let interval: any = null;

export const syncService = {
  startBackgroundSync: (ms = 15000) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      syncService.pushPending().catch(console.error);
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

      await syncBatch(creates, `${API_URL}/api/sync/orders`, 'orders');
      await syncBatch(voids, `${API_URL}/api/sync/voids`, 'voids');

    } finally {
      isSyncing = false;
    }
  },

  pullCatalog: async () => {
    try {
      const prodRes = await fetch(`${API_URL}/api/sync/products`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const products: Product[] = data.products || [];
        for (const p of products) {
          await productsRepository.upsertProduct(p);
        }
      }

      const setRes = await fetch(`${API_URL}/api/sync/settings`);
      if (setRes.ok) {
        const data = await setRes.json();
        const settings: Setting[] = data.settings || [];
        for (const s of settings) {
          await settingsRepository.setSetting(s.key, s.value);
        }
      }
    } catch (e) {
      console.error('Failed to pull catalog', e);
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
