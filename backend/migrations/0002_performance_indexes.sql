-- Composite and covering indexes for fast POS reporting and lookups
CREATE INDEX IF NOT EXISTS idx_orders_status_created_total ON orders (status, created_at, total, payment_method);
CREATE INDEX IF NOT EXISTS idx_order_items_covering ON order_items (order_id, product_id, quantity, line_total);

