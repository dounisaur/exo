import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;
let connectionTimeout;

export function initDb() {
  return new Promise((resolve, reject) => {
    console.log('[DB] Attempting connection...');

    // Set a timeout - if connection doesn't establish in 5 seconds, force resolve
    connectionTimeout = setTimeout(() => {
      console.log('[DB] Connection timeout - resolving anyway');
      resolve();
    }, 5000);

    try {
      // Check if database file exists and is readable
      if (fs.existsSync(DB_PATH)) {
        const stats = fs.statSync(DB_PATH);
        console.log(`[DB] Database file exists: ${stats.size} bytes`);
      } else {
        console.log('[DB] Database file does not exist - will be created');
      }

      // Open database with error handling
      db = new sqlite3.Database(DB_PATH, (err) => {
        clearTimeout(connectionTimeout);

        if (err) {
          console.error('[DB] Connection error:', err.message);
          // Still resolve even on error
          resolve();
          return;
        }

        console.log('[DB] Connected');

        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) console.error('[DB] PRAGMA error:', err);
        });

        // Create tables (will keep existing data)
        createTablesAndSeed();
        resolve();
      });

      // Add error handler to database
      db.on('error', (err) => {
        console.error('[DB] Database error:', err);
      });
    } catch (err) {
      clearTimeout(connectionTimeout);
      console.error('[DB] Error opening database:', err);
      resolve();
    }
  });
}

function createTablesAndSeed() {
  // Create tables if they don't exist
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    )`,
    `CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      UNIQUE(category_id, slug)
    )`,
    `CREATE TABLE IF NOT EXISTS venues (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_category ON venues(category)`
  ];

  let completed = 0;
  tables.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) console.error('[DB] Table creation error:', err);
      completed++;
      if (completed === tables.length) {
        seedDefaultData();
      }
    });
  });
}

function seedDefaultData() {
  const adminPassword = bcrypt.hashSync('admin123', 10);

  const seeds = [
    [`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`, ['admin', adminPassword, 'admin']],
    [`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Food', 'food']],
    [`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Bar', 'bar']],
    [`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Concert', 'concert']],
    [`INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`, ['Cafe', 'cafe']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Street Food', 'street-food']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Michelin', 'michelin']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Taverna', 'taverna']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Gastro Taverna', 'gastro-taverna']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Asian', 'asian']],
    [`INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?)`, ['food', 'Indian', 'indian']]
  ];

  let seedCompleted = 0;
  seeds.forEach(([sql, params]) => {
    db.run(sql, params, (err) => {
      if (err && !err.message.includes('UNIQUE constraint failed')) {
        console.error('[DB] Seed error:', err);
      }
      seedCompleted++;
      if (seedCompleted === seeds.length) {
        console.log('[DB] Initialization complete');
      }
    });
  });
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
