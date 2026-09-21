import { getDB } from '../database';
import { Order, OrderItem } from '../types';
import { syncQueueRepository } from './syncQueueRepository';
import { Capacitor } from '@capacitor/core';
import { webApiClient } from '../../lib/webApiClient';
import { generateId } from '../../utils/generateId';

// ----------------------------------------------------------------------
// NATIVE IMPLEMENTATION
// ----------------------------------------------------------------------
const nativeImpl = {
  createOrderBase: async (order: Order, items: OrderItem[]) => {
    const db = await getDB();

    const orderStmt = {
      statement: `
        INSERT INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [order.id, order.invoice_number, order.status, order.subtotal, order.total, order.payment_method, order.created_at]
    };

    const itemStmts = items.map(item => ({
      statement: `
        INSERT INTO order_items (id, order_id, product_id, name_snapshot, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [item.id, item.order_id, item.product_id, item.name_snapshot, item.unit_price, item.quantity, item.line_total]
    }));

    const syncPayload = { order, items };
    const syncStmt = syncQueueRepository.getEnqueueStatement(order.id, 'CREATE', syncPayload);

    const set = [
      orderStmt,
      ...itemStmts,
      syncStmt
    ];

    const res = await db.executeSet(set);
    if (res.changes && res.changes.changes && res.changes.changes < 0) {
      throw new Error('SQLite Transaction failed and rolled back automatically.');
    }
    return order;
  },

  voidOrder: async (id: string, reason: string) => {
    const db = await getDB();
    const voided_at = new Date().toISOString();

    const updateStmt = {
      statement: `UPDATE orders SET status = 'VOIDED', void_reason = ?, voided_at = ? WHERE id = ? AND status != 'VOIDED'`,
      values: [reason, voided_at, id]
    };

    const syncPayload = { order_id: id, reason, voided_at };
    const syncStmt = syncQueueRepository.getEnqueueStatement(id, 'VOID', syncPayload);

    const res = await db.executeSet([updateStmt, syncStmt]);
    if (res.changes && res.changes.changes && res.changes.changes < 0) {
      throw new Error('Void Transaction failed and rolled back automatically.');
    }
  },

  getOrders: async (limit: number = 100): Promise<Order[]> => {
    const db = await getDB();
    const res = await db.query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`, [limit]);
    const orders = res.values as Order[] || [];
    if (orders.length === 0) return [];
    
    // Explicitly hydrate items for local UI
    const orderIds = orders.map(o => `'${o.id}'`).join(',');
    const itemsRes = await db.query(`SELECT * FROM order_items WHERE order_id IN (${orderIds})`);
    const items = itemsRes.values as OrderItem[] || [];
    
    return orders.map(o => ({
      ...o,
      items: items.filter(i => i.order_id === o.id)
    }));
  },

  getOrderById: async (id: string): Promise<{ order: Order, items: OrderItem[] } | null> => {
    const db = await getDB();
    const orderRes = await db.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (!orderRes.values || orderRes.values.length === 0) return null;

    const order = orderRes.values[0] as Order;
    const itemsRes = await db.query(`SELECT * FROM order_items WHERE order_id = ?`, [id]);
    const items = itemsRes.values as OrderItem[] || [];

    return { order, items };
  },

  insertCloudOrderBase: async (order: Order, items: OrderItem[]) => {
    const db = await getDB();
    
    // ------------------------------------------------------------------
    // Conflict-resolution rules (execution rule 4):
    //
    // CASE 1 — Server order is new, not in local DB yet:
    //   INSERT OR IGNORE creates it. The order is visible immediately.
    //   No sync queue entry is created (it came from the server, not local).
    //
    // CASE 2 — Server order already exists locally AND is PENDING sync:
    //   INSERT OR IGNORE is a no-op. The local pending copy is PRESERVED.
    //   We do NOT overwrite it with the server copy because the local copy
    //   may have already pushed to the server (and the server echoes it back
    //   on the next pull). The push's markSynced call handles reconciliation.
    //
    // CASE 3 — Server order already exists locally AND is SYNCED:
    //   INSERT OR IGNORE is a no-op for the order row.
    //   If the server says it is now VOIDED, we run a conditional UPDATE
    //   to propagate that status change — but ONLY if local status = 'COMPLETED'
    //   and there is NO pending sync queue entry for this order.
    //   This prevents us from overwriting a locally-initiated void that hasn't
    //   been pushed yet.
    // ------------------------------------------------------------------

    // Step 1: INSERT OR IGNORE — safe for all cases.
    const orderStmt = {
      statement: `
        INSERT OR IGNORE INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at, voided_at, void_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        order.id, order.invoice_number, order.status, order.subtotal, order.total,
        order.payment_method, order.created_at, order.voided_at || null, order.void_reason || null
      ]
    };

    // Step 2: Upsert items with INSERT OR IGNORE (items are immutable once created).
    const itemStmts = items.map(item => ({
      statement: `
        INSERT OR IGNORE INTO order_items (id, order_id, product_id, name_snapshot, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [item.id, item.order_id, item.product_id, item.name_snapshot, item.unit_price, item.quantity, item.line_total]
    }));

    const set = [orderStmt, ...itemStmts];
    const res = await db.executeSet(set);
    if (res.changes && res.changes.changes && res.changes.changes < 0) {
      throw new Error('SQLite Sync Pull Transaction failed.');
    }

    // Step 3 — Conditional void propagation (Case 3 only).
    // Only runs if: server says VOIDED AND local record is COMPLETED AND no pending queue entry.
    if (order.status === 'VOIDED' && order.voided_at) {
      await db.run(
        `UPDATE orders
         SET status = 'VOIDED', voided_at = ?, void_reason = ?
         WHERE id = ?
           AND status = 'COMPLETED'
           AND id NOT IN (SELECT order_id FROM sync_queue WHERE status = 'PENDING')`,
        [order.voided_at, order.void_reason || null, order.id]
      );
    }
  }
};

// ----------------------------------------------------------------------
// WEB IMPLEMENTATION
// ----------------------------------------------------------------------
const webImpl = {
  createOrderBase: async (order: Order, items: OrderItem[]) => {
    // Construct exact payload for D1 endpoint
    const payload = {
      id: order.id,
      invoiceNumber: order.invoice_number,
      status: order.status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      items: items.map(i => ({
         productId: i.product_id,
         name: i.name_snapshot,
         quantity: i.quantity,
         price: i.unit_price
      }))
    };
    
    await webApiClient.post('/orders', payload);
    return order;
  },

  voidOrder: async (id: string, reason: string) => {
    await webApiClient.post(`/orders/${id}/void`, { reason });
  },

  getOrders: async (limit: number = 100): Promise<Order[]> => {
    const data = await webApiClient.get('/orders');
    return (data.orders || []).map((o: any) => ({
      ...o,
      total: o.grandTotal !== undefined ? o.grandTotal : o.total,
      invoice_number: o.invoiceNumber || o.invoice_number,
      payment_method: o.paymentMethod || o.payment_method,
      created_at: o.createdAt || o.created_at
    }));
  },

  getOrderById: async (id: string): Promise<{ order: Order, items: OrderItem[] } | null> => {
    const data = await webApiClient.get('/orders');
    const orderData = (data.orders || []).find((o: any) => o.id === id);
    if (!orderData) return null;

    const order: Order = {
      ...orderData,
      total: orderData.grandTotal !== undefined ? orderData.grandTotal : orderData.total,
      invoice_number: orderData.invoiceNumber || orderData.invoice_number,
      payment_method: orderData.paymentMethod || orderData.payment_method,
      created_at: orderData.createdAt || orderData.created_at
    };

    const items: OrderItem[] = (orderData.items || []).map((i: any) => ({
       id: generateId(), // we can mock an ID for UI
       order_id: id,
       product_id: i.productId,
       name_snapshot: i.name,
       unit_price: i.unitPrice,
       quantity: i.quantity,
       line_total: i.total
    }));

    return { order, items };
  },

  insertCloudOrderBase: async (order: Order, items: OrderItem[]) => {
    // Web interacts strictly online. Incremental local storing is native only.
    return;
  }
};

export const ordersRepository = Capacitor.isNativePlatform() ? nativeImpl : webImpl;
