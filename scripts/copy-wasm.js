import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sourceWasmPath = join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
const targetDir = join(__dirname, '../public');
const targetWasmPath = join(targetDir, 'sql-wasm.wasm');

try {
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(sourceWasmPath, targetWasmPath);
  console.log('Successfully copied sql-wasm.wasm to public directory');
} catch (error) {
  console.error('Error copying wasm file:', error);
  process.exit(1);
}