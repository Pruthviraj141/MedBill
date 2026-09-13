import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../src/db/database.ts');
const bkpPath = path.join(__dirname, '../src/db/database.ts.bak');
const mockPath = path.join(__dirname, '../src/db/mock-database.ts');

try {
  // 1. Backup production SQLite database file
  fs.copyFileSync(dbPath, bkpPath);
  
  // 2. Inject Mock Sql.js driver
  fs.copyFileSync(mockPath, dbPath);
  
  // 3. Execute
  console.log('Running Tests...');
  execSync('npx tsx scripts/test-logic.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
} catch (e) {
  console.error("Test execution failed or halted.");
} finally {
  // 4. Safely restore no matter what
  if (fs.existsSync(bkpPath)) {
    fs.copyFileSync(bkpPath, dbPath);
    fs.unlinkSync(bkpPath);
  }
}
