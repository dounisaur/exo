import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;

// Open database immediately without waiting
db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB] Error:', err.message);
  } else {
    console.log('[DB] Connected');
    initializeTables();
  }
});

function initializeTables() {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    UNIQUE(category_id, slug)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS venues (
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

  db.run(`CREATE INDEX IF NOT EXISTS idx_category ON venues(category)`);

  seedData();
}

function seedData() {
  const adminPassword = bcrypt.hashSync('admin123', 10);

  db.run(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`, ['admin', adminPassword, 'admin']);
  db.run(`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Food', 'food']);
  db.run(`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Bar', 'bar']);
  db.run(`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Concert', 'concert']);
  db.run(`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Cafe', 'cafe']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Street Food', 'street-food']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Michelin', 'michelin']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Taverna', 'taverna']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Gastro Taverna', 'gastro-taverna']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Asian', 'asian']);
  db.run(`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Indian', 'indian']);
}

export function initDb() {
  // Return immediately - database is already initializing
  return Promise.resolve();
}

export function getDb() {
  return db;
}
