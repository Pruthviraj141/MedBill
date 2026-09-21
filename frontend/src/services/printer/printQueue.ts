import { Order, OrderItem } from '../../types';

export interface QueuedPrintJob {
  order: Order;
  items: OrderItem[];
  timestamp: number;
}

const QUEUE_KEY = 'tbt_failed_prints';

/**
 * Isolated persistence wrapper for print jobs.
 * This guarantees we don't accidentally mutate or pollute the core SQLite Order 
 * databases while still preserving offline printer-queue reliability indefinitely.
 */
export const printQueue = {
  getFailedJobs: (): QueuedPrintJob[] => {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  
  addFailedJob: (order: Order, items: OrderItem[]) => {
    const jobs = printQueue.getFailedJobs();
    // Idempotent key structure
    if (!jobs.find(j => j.order.id === order.id)) {
      jobs.push({ order, items, timestamp: Date.now() });
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
      } catch (e) {
        console.warn("Storage limits exceeded. Dropping generic log.");
      }
    }
  },

  removeJob: (orderId: string) => {
    try {
      const jobs = printQueue.getFailedJobs().filter(j => j.order.id !== orderId);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
    } catch (e) {
      // Intentionally bypassed if storage fails locally.
    }
  }
};
