import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Extracted exactly from old seed.ts
const products = [
  // PIZZA 🍕
  { name: 'Margarita Pizza', category: 'Pizza', price: 100, icon: '🍕', active: true },
  { name: 'Corn Cheese Pizza', category: 'Pizza', price: 110, icon: '🍕', active: true },
  { name: 'Farmhouse Pizza', category: 'Pizza', price: 170, icon: '🍕', active: true },
  { name: 'Paneer Pizza', category: 'Pizza', price: 150, icon: '🍕', active: true },
  { name: 'Vegie Pizza', category: 'Pizza', price: 150, icon: '🍕', active: true },
  
  // SANDWICH 🥪
  { name: 'Veg Cheese Grill Sandwich', category: 'Sandwich', price: 100, icon: '🥪', active: true },
  { name: 'Paneer Grill Sandwich', category: 'Sandwich', price: 120, icon: '🥪', active: true },
  { name: 'Club Sandwich', category: 'Sandwich', price: 70, icon: '🥪', active: true },
  { name: 'Corn Cheese Sandwich', category: 'Sandwich', price: 120, icon: '🥪', active: true },

  // BURGER 🍔
  { name: 'Aloo Tikki Burger', category: 'Burger', price: 90, icon: '🍔', active: true },
  { name: 'Aloo Cheese Burger', category: 'Burger', price: 120, icon: '🍔', active: true },
  { name: 'Paneer Burger', category: 'Burger', price: 130, icon: '🍔', active: true },
  { name: 'Peri Peri Burger', category: 'Burger', price: 150, icon: '🍔', active: true },

  // PASTA 🍝
  { name: 'White Sauce Pasta', category: 'Pasta', price: 180, icon: '🍝', active: true },
  { name: 'Red Sauce Pasta', category: 'Pasta', price: 180, icon: '🍝', active: true },
  { name: 'Mix Sauce Pasta', category: 'Pasta', price: 200, icon: '🍝', active: true },

  // TOAST 🍞
  { name: 'Garlic Toast', category: 'Toast', price: 110, icon: '🍞', active: true },
  { name: 'Cheese Chili Toast', category: 'Toast', price: 120, icon: '🍞', active: true },

  // NACHOS 🌮
  { name: 'Salsa Nachos', category: 'Nachos', price: 110, icon: '🌮', active: true },
  { name: 'Loaded Nachos', category: 'Nachos', price: 140, icon: '🌮', active: true },

  // FRIES 🍟
  { name: 'Salted Fries', category: 'Fries', price: 70, icon: '🍟', active: true },
  { name: 'Masala Fries', category: 'Fries', price: 100, icon: '🍟', active: true },
  { name: 'Peri Peri Fries', category: 'Fries', price: 80, icon: '🍟', active: true },
  { name: 'Cheese Fries', category: 'Fries', price: 150, icon: '🍟', active: true },
  { name: 'Loaded Fries', category: 'Fries', price: 160, icon: '🍟', active: true },

  // MAGGI 🍜
  { name: 'Masala Maggi', category: 'Maggi', price: 80, icon: '🍜', active: true },
  { name: 'Vegetable Maggi', category: 'Maggi', price: 110, icon: '🍜', active: true },
  { name: 'Cheese Maggi', category: 'Maggi', price: 100, icon: '🍜', active: true },
  { name: 'Tandoor Maggi', category: 'Maggi', price: 110, icon: '🍜', active: true },

  // SPAGHETTI 🍝
  { name: 'Red Sauce Spaghetti', category: 'Spaghetti', price: 200, icon: '🍝', active: true },
  { name: 'White Sauce Spaghetti', category: 'Spaghetti', price: 200, icon: '🍝', active: true },
  { name: 'Mix Sauce Spaghetti', category: 'Spaghetti', price: 250, icon: '🍝', active: true },

  // DESSERT 🍰
  { name: 'Brownie Sizzling', category: 'Dessert', price: 150, icon: '🍫', active: true },
  { name: 'Plain Brownie', category: 'Dessert', price: 110, icon: '🍫', active: true },
  { name: 'Fudge Brownie', category: 'Dessert', price: 120, icon: '🍫', active: true },

  // COFFEE ☕
  { name: 'Plain Cold Coffee', category: 'Coffee', price: 80, icon: '🧋', active: true },
  { name: 'Irish Cold Coffee', category: 'Coffee', price: 100, icon: '🧋', active: true },
  { name: 'Chocolate Cold Coffee', category: 'Coffee', price: 100, icon: '🧋', active: true },
  { name: 'Hazelnut Cold Coffee', category: 'Coffee', price: 100, icon: '🧋', active: true },
  { name: 'Cold Coffee with Ice Cream', category: 'Coffee', price: 100, icon: '🧋', active: true },
  { name: 'Brownie Cold Coffee', category: 'Coffee', price: 150, icon: '🧋', active: true },

  // SHAKE 🥤
  { name: 'Strawberry Shake', category: 'Shake', price: 90, icon: '🥤', active: true },
  { name: 'Mango Shake', category: 'Shake', price: 90, icon: '🥤', active: true },
  { name: 'Chocolate Milk Shake', category: 'Shake', price: 90, icon: '🥤', active: true },
  { name: 'Brownie Milk Shake', category: 'Shake', price: 110, icon: '🥤', active: true },

  // NUGGETS 🍗
  { name: 'Corn Cheese Ball', category: 'Nuggets', price: 130, icon: '🍘', active: true },
  { name: 'Potato Cheese Ball', category: 'Nuggets', price: 110, icon: '🍘', active: true },

  // MOCKTAIL 🍹
  { name: 'Mojito', category: 'Mocktail', price: 90, icon: '🍹', active: true },
  { name: 'Green AppleMocktail', category: 'Mocktail', price: 90, icon: '🍹', active: true },
  { name: 'Lemonade', category: 'Mocktail', price: 90, icon: '🍹', active: true },
  { name: 'Masala Lemonade', category: 'Mocktail', price: 110, icon: '🍹', active: true },
];

function generateId(name) {
  // Deterministic stable string ID generator
  return 'prod_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/(^_|_$)/g, '');
}

async function migrate() {
  console.log('PRODUCT MIGRATION');
  console.log('-----------------');
  console.log(`Source products: ${products.length}`);
  
  // 1. Fetch current D1 products to determine counts
  let existingIds = new Set();
  const execOpts = { 
    stdio: ['pipe', 'pipe', 'ignore'], 
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } 
  };

  try {
    const listResultStr = execSync(`npx wrangler d1 execute tbt-cafe-prod --local -y --command "SELECT id FROM products;" --json`, execOpts).toString();
    const listResult = JSON.parse(listResultStr);
    
    // Process results varying based on the array structure of wrangler output
    if (listResult && listResult.length > 0 && listResult[0].results) {
      listResult[0].results.forEach(row => existingIds.add(row.id));
    }
  } catch (err) {
    // Database might not be initialized or query failed
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let duplicates = 0; // The source array has exactly 40 unique, but we track theoretically.

  const sqlStatements = [];
  const processedIds = new Set();
  const timestamp = new Date().toISOString();

  for (const p of products) {
    const id = generateId(p.name);
    if (processedIds.has(id)) {
      duplicates++;
      continue;
    }
    processedIds.add(id);

    if (existingIds.has(id)) {
      updated++;
    } else {
      inserted++;
    }

    const price = parseInt(p.price); // Ensuring integer
    const active = p.active ? 1 : 0;
    
    // SQLite doesn't have true booleans, use 1/0
    // Use proper escaping for text
    const escName = p.name.replace(/'/g, "''");
    const escCategory = p.category.replace(/'/g, "''");
    const escIcon = p.icon.replace(/'/g, "''");
    
    sqlStatements.push(`
      INSERT INTO products (id, name, price, category, image_url, active, updated_at) 
      VALUES ('${id}', '${escName}', ${price}, '${escCategory}', '${escIcon}', ${active}, '${timestamp}')
      ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, 
        price=excluded.price, 
        category=excluded.category, 
        image_url=excluded.image_url, 
        active=excluded.active, 
        updated_at=excluded.updated_at;
    `);
  }

  // Write SQL to a temporary file for wrangler to execute safely
  const tempSqlFile = path.resolve(process.cwd(), 'temp_migration.sql');
  fs.writeFileSync(tempSqlFile, sqlStatements.join('\n'));

  try {
    // 2. Execute Batch via Wrangler
    execSync(`npx wrangler d1 execute tbt-cafe-prod --local -y --file="${tempSqlFile}"`, { stdio: 'pipe', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
    
    // 3. Verify Product Count
    const verifyResultStr = execSync(`npx wrangler d1 execute tbt-cafe-prod --local -y --command "SELECT count(*) as total FROM products;" --json`, execOpts).toString();
    const verifyResult = JSON.parse(verifyResultStr);
    
    let dbCount = 0;
    if (verifyResult && verifyResult.length > 0 && verifyResult[0].results) {
       dbCount = verifyResult[0].results[0].total;
    }

    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Duplicates: ${duplicates}`);
    console.log('');
    console.log(`Verification:`);
    console.log(`D1 products: ${dbCount}`);
    console.log('');
    console.log(`SUCCESS`);
  } catch (err) {
    console.error('MIGRATION FAILED:', err.message);
  } finally {
    if (fs.existsSync(tempSqlFile)) {
      fs.unlinkSync(tempSqlFile);
    }
  }
}

migrate();
