import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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

  seedData();
}

function seedData() {
  const adminPassword = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`);
  insertUser.run('admin', adminPassword, 'admin');

  const insertCategory = db.prepare(`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`);
  insertCategory.run('Food', 'food');
  insertCategory.run('Bar', 'bar');
  insertCategory.run('Concert', 'concert');
  insertCategory.run('Cafe', 'cafe');

  const insertSubcategory = db.prepare(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`);
  insertSubcategory.run('food', 'Street Food', 'street-food');
  insertSubcategory.run('food', 'Michelin', 'michelin');
  insertSubcategory.run('food', 'Taverna', 'taverna');
  insertSubcategory.run('food', 'Gastro Taverna', 'gastro-taverna');
  insertSubcategory.run('food', 'Asian', 'asian');
  insertSubcategory.run('food', 'Indian', 'indian');
}

export function initDb() {
  // Return immediately - database is already initializing
  return Promise.resolve();
}

export function getDb() {
  return db;
}
