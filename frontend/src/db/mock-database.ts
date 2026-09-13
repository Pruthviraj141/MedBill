// Mock Database using sql.js
import initSqlJs from 'sql.js';
import { sqliteMigrations } from './migrations';

let dbInstance: any = null;
let isInitialized = false;

export const initDB = async (): Promise<any> => {
  if (isInitialized && dbInstance) return dbInstance;
  
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });
  
  const sqlDb = new SQL.Database();
  
  dbInstance = {
    open: async () => Promise.resolve(),
    close: async () => Promise.resolve(),
    execute: async (sql: string) => {
      try {
        sqlDb.exec(sql);
        return { changes: { changes: 1 } };
      } catch (err) {
        throw err;
      }
    },
    run: async (sql: string, values?: any[]) => {
      try {
        sqlDb.run(sql, values || []);
        return { changes: { changes: 1 } };
      } catch (err) {
        throw err;
      }
    },
    query: async (sql: string, values?: any[]) => {
      try {
        const res = sqlDb.exec(sql, values || []);
        if (res.length === 0) return { values: [] };
        
        const cols = res[0].columns;
        const rows = res[0].values;
        const mapped = rows.map((row: any) => {
          const obj: any = {};
          cols.forEach((col: string, idx: number) => {
            obj[col] = row[idx];
          });
          return obj;
        });
        return { values: mapped };
      } catch (err) {
        throw err;
      }
    },
    executeSet: async (set: any[]) => {
      try {
        sqlDb.exec("BEGIN TRANSACTION;");
        for (const item of set) {
          const stmt = sqlDb.prepare(item.statement);
          stmt.run(item.values || []);
          stmt.free();
        }
        sqlDb.exec("COMMIT;");
        return { changes: { changes: 1 } };
      } catch (err) {
        sqlDb.exec("ROLLBACK;");
        return { changes: { changes: -1 } };
      }
    }
  };

  // Run migrations
  await dbInstance.execute(`CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY);`);
  for (const migration of sqliteMigrations) {
    await dbInstance.execute(migration.query);
    await dbInstance.run('INSERT INTO _migrations (version) VALUES (?)', [migration.version]);
  }

  isInitialized = true;
  return dbInstance;
};

export const getDB = async (): Promise<any> => {
  if (!isInitialized) return await initDB();
  return dbInstance;
};
