import { getDB } from '../database';
import { SyncQueue } from '../types';
import { generateId } from '../../utils/generateId';

export const syncQueueRepository = {
  // Returns raw statements so they can be injected into the main order transaction atomically
  getEnqueueStatement: (order_id: string, action: 'CREATE' | 'VOID', payload: any) => {
    const id = generateId();
    const created_at = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);
    return {
      statement: `INSERT INTO sync_queue (id, order_id, action, payload, created_at, status) VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      values: [id, order_id, action, payloadStr, created_at]
    };
  },

  getPending: async (): Promise<SyncQueue[]> => {
    const db = await getDB();
    const res = await db.query(`SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at ASC`);
    return res.values as SyncQueue[] || [];
  },
  
  markSynced: async (id: string) => {
    const db = await getDB();
    await db.run(`UPDATE sync_queue SET status = 'SYNCED' WHERE id = ?`, [id]);
  },
  
  markFailed: async (id: string, _incrementAttempt = true) => {
    const db = await getDB();
    const last_attempt = new Date().toISOString();
    // Always increment attempt_count. When attempts reach 10, promote status to FAILED
    // so the item is excluded from future getPending() calls. The local order row is
    // NOT deleted — it remains visible in the UI and can be manually retried if needed.
    await db.run(
      `UPDATE sync_queue
       SET attempt_count = attempt_count + 1,
           last_attempt_at = ?,
           status = CASE WHEN attempt_count + 1 >= 10 THEN 'FAILED' ELSE status END
       WHERE id = ?`,
      [last_attempt, id]
    );
  },

  getPendingCount: async (): Promise<number> => {
    const db = await getDB();
    const res = await db.query(`SELECT COUNT(*) as count FROM sync_queue WHERE status = 'PENDING'`);
    return res.values?.[0]?.count || 0;
  }
};
