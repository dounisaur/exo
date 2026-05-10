import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');

let db;

export function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }

      console.log('Database connected');

      // Create all tables
      db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Categories table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE
        )`);

        // Subcategories table
        db.run(`CREATE TABLE IF NOT EXISTS subcategories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          UNIQUE(category_id, slug)
        )`);

        // Venues table
        db.run(`CREATE TABLE IF NOT EXISTS venues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          subcategory_id INTEGER REFERENCES subcategories(id),
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          address TEXT NOT NULL,
          image_url TEXT,
          website_url TEXT,
          phone_number TEXT,
          reservation_link TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create index
        db.run(`CREATE INDEX IF NOT EXISTS idx_category ON venues(category)`);

        // Migrations and seeding
        setTimeout(() => {
          seedDatabase().then(() => {
            console.log('Database initialized and seeded');
            resolve();
          }).catch((err) => {
            console.error('Seeding error:', err);
            resolve(); // Still resolve to allow app to start
          });
        }, 500);
      });
    });
  });
}

function seedDatabase() {
  return new Promise((resolve, reject) => {
    // Seed admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ['admin', adminPassword, 'admin'],
      (err) => {
        if (err) {
          console.error('Error seeding admin user:', err);
        }

        // Seed categories
        const categories = [
          { name: 'Food', slug: 'food' },
          { name: 'Bar', slug: 'bar' },
          { name: 'Concert', slug: 'concert' },
          { name: 'Cafe', slug: 'cafe' }
        ];

        let catCount = 0;
        categories.forEach((cat) => {
          db.run(
            `INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`,
            [cat.name, cat.slug],
            () => {
              catCount++;
              if (catCount === categories.length) {
                seedSubcategories().then(resolve).catch(reject);
              }
            }
          );
        });
      }
    );
  });
}

function seedSubcategories() {
  return new Promise((resolve) => {
    // Get food category ID
    db.get(`SELECT id FROM categories WHERE slug = 'food'`, (err, row) => {
      if (!row) {
        resolve();
        return;
      }

      const foodId = row.id;
      const subcats = [
        { name: 'Street Food', slug: 'street-food' },
        { name: 'Michelin', slug: 'michelin' },
        { name: 'Taverna', slug: 'taverna' },
        { name: 'Gastro Taverna', slug: 'gastro-taverna' },
        { name: 'Asian', slug: 'asian' },
        { name: 'Indian', slug: 'indian' }
      ];

      let subCount = 0;
      subcats.forEach((sub) => {
        db.run(
          `INSERT OR IGNORE INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)`,
          [foodId, sub.name, sub.slug],
          () => {
            subCount++;
            if (subCount === subcats.length) {
              resolve();
            }
          }
        );
      });
    });
  });
}

export function getDb() {
  return db;
}
