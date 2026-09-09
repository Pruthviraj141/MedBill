import { MongoClient, type Db } from 'mongodb';

// Ensure the MongoClient connection is cached globally in the worker isolate.
// Cloudflare Workers strictly require caching the client TCP socket topology 
// across cold starts, otherwise Atlas cuts off rapid parallel connections.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

export async function connectDB(env: { MONGODB_URI?: string; MONGODB_DB_NAME?: string }): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  const dbName = env.MONGODB_DB_NAME || 'cafe';

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      if (!cachedClient) {
        cachedClient = new MongoClient(env.MONGODB_URI!, {
          maxPoolSize: 4,
          minPoolSize: 0,
          maxConnecting: 2,
          maxIdleTimeMS: 10000,
          waitQueueTimeoutMS: 2000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 10000,
          serverMonitoringMode: 'poll',
        } as any);
        await cachedClient.connect();
      }

      cachedDb = cachedClient.db(dbName);
      return cachedDb;
    } catch (err: any) {
      cachedClient = null;
      cachedDb = null;
      console.error('Fatal Edge Atlas Connection Error:', err.message, err.stack);
      throw new Error('DATABASE_ERROR');
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}
