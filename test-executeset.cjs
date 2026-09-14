const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
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
  `);
  
  db.run(`
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
  `);

  db.run(
    `INSERT OR REPLACE INTO orders (id, invoice_number, status, subtotal, total, payment_method, created_at, voided_at, void_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['6d8ff141-c897-4763-8d10-2f6f4ad80a51', 'INV-20260914-6d8ff141-c897-4763-8d10-2f6f4ad80a51', 'COMPLETED', 380, 380, 'UPI', '2026-09-14T08:10:48.846Z', null, null],
    function(err) {
      if (err) console.error("Order Insert Error:", err);
      else console.log("Order Insert Success");
    }
  );

  db.run(
    `INSERT OR REPLACE INTO order_items (id, order_id, product_id, name_snapshot, unit_price, quantity, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['7ceb0e03-dd9b-4484-88d6-31ab3b00055a', '6d8ff141-c897-4763-8d10-2f6f4ad80a51', 'prod_margarita_pizza', 'Margarita Pizza', 100, 1, 100],
    function(err) {
       if (err) console.error("Item Insert Error:", err);
       else console.log("Item Insert Success");
    }
  );
});

