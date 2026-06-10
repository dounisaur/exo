import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
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
  await runMigrations(db);
  seedDefaultUser();
}

function seedDefaultUser() {
  try {
    // Check if users table exists
    const usersTableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();

    if (!usersTableExists) {
      console.log('[DB] Users table does not exist, skipping seed');
      return;
    }

    // Check if admin user exists
    const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (adminExists) {
      console.log('[DB] Admin user already exists');
      return;
    }

    // Create default admin user if it doesn't exist
    const passwordHash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      'admin',
      passwordHash,
      'admin'
    );
    console.log('[DB] Default admin user created');
  } catch (err) {
    console.error('[DB] Error seeding default user:', err.message);
  }
}

export function getDb() {
  return db;
}
