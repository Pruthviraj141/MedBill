import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Extracted exactly from old seed.ts
const products = [
  // PIZZA 🍕
  { name: 'Margarita Pizza', category: 'Pizza', price: 100, icon: '/icons/pizza.png', active: true },
  { name: 'Corn Cheese Pizza', category: 'Pizza', price: 110, icon: '/icons/pizza.png', active: true },
  { name: 'Farmhouse Pizza', category: 'Pizza', price: 170, icon: '/icons/pizza.png', active: true },
  { name: 'Paneer Pizza', category: 'Pizza', price: 150, icon: '/icons/pizza.png', active: true },
  { name: 'Vegie Pizza', category: 'Pizza', price: 150, icon: '/icons/pizza.png', active: true },
  
  // SANDWICH 🥪
  { name: 'Veg Cheese Grill Sandwich', category: 'Sandwich', price: 100, icon: '/icons/sandwich.png', active: true },
  { name: 'Paneer Grill Sandwich', category: 'Sandwich', price: 120, icon: '/icons/sandwich.png', active: true },
  { name: 'Club Sandwich', category: 'Sandwich', price: 70, icon: '/icons/sandwich.png', active: true },
  { name: 'Corn Cheese Sandwich', category: 'Sandwich', price: 120, icon: '/icons/sandwich.png', active: true },

  // BURGER 🍔
  { name: 'Aloo Tikki Burger', category: 'Burger', price: 90, icon: '/icons/burger.png', active: true },
  { name: 'Aloo Cheese Burger', category: 'Burger', price: 120, icon: '/icons/burger.png', active: true },
  { name: 'Paneer Burger', category: 'Burger', price: 130, icon: '/icons/burger.png', active: true },
  { name: 'Peri Peri Burger', category: 'Burger', price: 150, icon: '/icons/burger.png', active: true },

  // PASTA 🍝
  { name: 'White Sauce Pasta', category: 'Pasta', price: 180, icon: '/icons/pasta.png', active: true },
  { name: 'Red Sauce Pasta', category: 'Pasta', price: 180, icon: '/icons/pasta.png', active: true },
  { name: 'Mix Sauce Pasta', category: 'Pasta', price: 200, icon: '/icons/pasta.png', active: true },

  // TOAST 🍞
  { name: 'Garlic Toast', category: 'Toast', price: 110, icon: '/icons/toast.png', active: true },
  { name: 'Cheese Chili Toast', category: 'Toast', price: 120, icon: '/icons/toast.png', active: true },

  // NACHOS 🌮
  { name: 'Salsa Nachos', category: 'Nachos', price: 110, icon: '/icons/nachos.png', active: true },
  { name: 'Loaded Nachos', category: 'Nachos', price: 140, icon: '/icons/nachos.png', active: true },

  // FRIES 🍟
  { name: 'Salted Fries', category: 'Fries', price: 70, icon: '/icons/fries.png', active: true },
  { name: 'Masala Fries', category: 'Fries', price: 100, icon: '/icons/fries.png', active: true },
  { name: 'Peri Peri Fries', category: 'Fries', price: 80, icon: '/icons/fries.png', active: true },
  { name: 'Cheese Fries', category: 'Fries', price: 150, icon: '/icons/fries.png', active: true },
  { name: 'Loaded Fries', category: 'Fries', price: 160, icon: '/icons/fries.png', active: true },

  // MAGGI 🍜
  { name: 'Masala Maggi', category: 'Maggi', price: 80, icon: '🍜', active: true },
  { name: 'Vegetable Maggi', category: 'Maggi', price: 110, icon: '🍜', active: true },
  { name: 'Cheese Maggi', category: 'Maggi', price: 100, icon: '🍜', active: true },
  { name: 'Tandoor Maggi', category: 'Maggi', price: 110, icon: '🍜', active: true },

  // SPAGHETTI 🍝
  { name: 'Red Sauce Spaghetti', category: 'Spaghetti', price: 200, icon: '/icons/spaghetti.png', active: true },
  { name: 'White Sauce Spaghetti', category: 'Spaghetti', price: 200, icon: '/icons/spaghetti.png', active: true },
  { name: 'Mix Sauce Spaghetti', category: 'Spaghetti', price: 250, icon: '/icons/spaghetti.png', active: true },

  // DESSERT 🍰
  { name: 'Brownie Sizzling', category: 'Dessert', price: 150, icon: '/icons/dessert.png', active: true },
  { name: 'Plain Brownie', category: 'Dessert', price: 110, icon: '/icons/dessert.png', active: true },
  { name: 'Fudge Brownie', category: 'Dessert', price: 120, icon: '/icons/dessert.png', active: true },

  // COFFEE ☕
  { name: 'Plain Cold Coffee', category: 'Coffee', price: 80, icon: '/icons/coffee.png', active: true },
  { name: 'Irish Cold Coffee', category: 'Coffee', price: 100, icon: '/icons/coffee.png', active: true },
  { name: 'Chocolate Cold Coffee', category: 'Coffee', price: 100, icon: '/icons/coffee.png', active: true },
  { name: 'Hazelnut Cold Coffee', category: 'Coffee', price: 100, icon: '/icons/coffee.png', active: true },
  { name: 'Cold Coffee with Ice Cream', category: 'Coffee', price: 100, icon: '/icons/coffee.png', active: true },
  { name: 'Brownie Cold Coffee', category: 'Coffee', price: 150, icon: '/icons/coffee.png', active: true },

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

  console.log(`Generated migration SQL at ${tempSqlFile}`);
  console.log(`Now run: npx wrangler d1 execute tbt-cafe-prod --remote -y --file="${tempSqlFile}"`);
}

migrate();
