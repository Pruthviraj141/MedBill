import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust depending on run context

async function resetTemporaryData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'cafe');
    
    console.log('Connected to DB. Starting reset of transactional data...');
    
    // Clear out unused/temporary collections
    await db.collection('orders').deleteMany({});
    await db.collection('payments').drop().catch(() => {});
    await db.collection('archived_orders').drop().catch(() => {});
    await db.collection('audit_logs').drop().catch(() => {});
    await db.collection('counters').deleteMany({ _id: { $regex: '^invoice_' } as any });

    // Optional: Product cleanup if needed, but usually we just want to remove stock property
    await db.collection('products').updateMany(
      {},
      { $unset: { stock: "", stockTracking: "" } }
    );
    
    console.log('✅ Temporary data reset completely. Removed payments, archived_orders, audit_logs collections and cleared orders/invoice counters. Stripped stock from products.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    await client.close();
  }
}

resetTemporaryData();
