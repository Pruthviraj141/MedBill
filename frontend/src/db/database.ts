import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { sqliteMigrations } from './migrations';

const DB_NAME = 'medbill_pos_db';
let sqliteConnection: SQLiteConnection;
let db: SQLiteDBConnection;
let isInitialized = false;

export const initDB = async (): Promise<SQLiteDBConnection> => {
  if (!Capacitor.isNativePlatform()) {
    console.log("WEB DEV DATA MODE: LOCAL D1 API");
    throw new Error("WEB_MODE");
  }
  
  if (isInitialized && db) return db;

  sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  
  try {
    // Check if connection exists
    const ret = await sqliteConnection.checkConnectionsConsistency();
    const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

    if (ret.result && isConn) {
      db = await sqliteConnection.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await db.open();

    // Migrate Schema idempotently
    await runMigrations(db);

    isInitialized = true;
    console.log("ANDROID DATA MODE: NATIVE SQLITE");
    return db;
  } catch (error) {
    console.error('SQLite initialization failed', error);
    throw error;
  }
};

const runMigrations = async (database: SQLiteDBConnection) => {
  // Create migrations tracking table if not exists
  await database.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  let currentVersion = 0;
  try {
    const res = await database.query('SELECT MAX(version) as v FROM _migrations');
    if (res.values && res.values.length > 0) {
      currentVersion = res.values[0].v || 0;
    }
  } catch (err) {
    // Table might be completely empty or failing, assume 0
  }

  for (const migration of sqliteMigrations) {
    if (migration.version > currentVersion) {
      console.log(`Running SQLite Migration Version: ${migration.version}`);
      await database.execute(migration.query);
      await database.run('INSERT INTO _migrations (version) VALUES (?)', [migration.version]);
    }
  }
};

export const getDB = async (): Promise<SQLiteDBConnection> => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('WEB DEVELOPMENT MODE — Native SQLite unavailable');
  }
  if (!isInitialized) {
    return await initDB();
  }
  return db;
};
