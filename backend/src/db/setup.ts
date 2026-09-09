import type { Db } from 'mongodb';

export async function createIndexes(db: Db) {
  // Products
  await db.collection('products').createIndex({ cafeId: 1 });
  await db.collection('products').createIndex({ categoryId: 1 });
  
  // Orders
  await db.collection('orders').createIndex({ cafeId: 1, status: 1, createdAt: -1 });
  await db.collection('orders').createIndex({ invoiceNumber: 1 });

  // Users
  await db.collection('users').createIndex({ cafeId: 1 });
  await db.collection('users').createIndex({ username: 1 }, { unique: true });

  console.log('✅ Database Indexes ensured.');
}
