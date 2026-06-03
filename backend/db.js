import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;

// Open database immediately
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  console.log('[DB] Connected');
} catch (err) {
  console.error('[DB] Error:', err.message);
}

export async function initDb() {
  return runMigrations(db);
}

export function getDb() {
  return db;
}
