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
  fs.copyFileSync(dbPath, bkpPath);
  fs.copyFileSync(mockPath, dbPath);
  
  console.log('Running Sync Tests...');
  execSync('npx tsx scripts/test-sync.ts', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
} catch (e) {
  console.error("Test execution failed or halted.");
} finally {
  if (fs.existsSync(bkpPath)) {
    fs.copyFileSync(bkpPath, dbPath);
    fs.unlinkSync(bkpPath);
  }
}

