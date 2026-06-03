import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;

// Open database immediately
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  console.log('[DB] Connected');
  initializeTables();
} catch (err) {
  console.error('[DB] Error:', err.message);
}

function initializeTables() {
  db.exec('PRAGMA foreign_keys = ON');

  // Schema version tracking - prevents accidental resets
  const SCHEMA_VERSION = 1;

  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Check if schema version matches - only initialize if new or different
  const versionRecord = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
  const currentVersion = versionRecord?.version || 0;

  if (currentVersion !== SCHEMA_VERSION) {
    console.log(`[DB] Schema version mismatch (${currentVersion} -> ${SCHEMA_VERSION}). Initializing tables...`);

    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      UNIQUE(category_id, slug)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory_id INTEGER REFERENCES subcategories(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      image_url TEXT,
      website_url TEXT,
      phone_number TEXT,
      reservation_link TEXT,
      rating REAL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_category ON venues(category)`);

    // Update schema version
    db.prepare('DELETE FROM schema_version').run();
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(SCHEMA_VERSION);
    console.log(`[DB] Schema version updated to ${SCHEMA_VERSION}`);
  } else {
    console.log(`[DB] Schema version ${SCHEMA_VERSION} matches. Skipping initialization.`);
  }
}

export function initDb() {
  // Return immediately - database is already initializing
  return Promise.resolve();
}

export function getDb() {
  return db;
}
