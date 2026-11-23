export const sqliteMigrations = [
  {
    version: 1,
    query: `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('COMPLETED', 'VOIDED')),
        subtotal INTEGER NOT NULL,
        total INTEGER NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'UPI')),
        created_at TEXT NOT NULL,
        voided_at TEXT,
        void_reason TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
      
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        name_snapshot TEXT NOT NULL,
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        line_total INTEGER NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id)
      );
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('CREATE', 'VOID')),
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TEXT,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'SYNCED', 'FAILED'))
      );
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
    `
  },
  {
    version: 2,
    query: `
      ALTER TABLE orders ADD COLUMN synced_at TEXT;
    `
  },
  {
    version: 3,
    query: `
      ALTER TABLE order_items ADD COLUMN dosage_schedule TEXT DEFAULT '0-0-0';
    `
  }
];
