import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;

export function initDb() {
  return new Promise((resolve, reject) => {
    console.log('[DB] Opening connection');

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[DB] Connection error:', err);
        reject(err);
        return;
      }

      console.log('[DB] Connected');

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Create tables if they don't exist
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

      // Add rating column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE venues ADD COLUMN rating REAL`, () => {
        // Column might already exist - ignore error
      });

      // Seed only if needed
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

      // Resolve after 500ms to give operations time to queue
      setTimeout(() => {
        console.log('[DB] Ready');
        resolve();
      }, 500);
    });
  });
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
