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

    // Check total user count
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    console.log(`[DB] Found ${userCount} user(s) in database`);

    // If no users at all, create default admin
    if (userCount === 0) {
      const passwordHash = bcrypt.hashSync('admin', 10);
      console.log('[DB] Creating admin user with hash:', passwordHash.substring(0, 20) + '...');
      const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
        'admin',
        passwordHash,
        'admin'
      );
      console.log('[DB] Insert result:', result);

      // Verify it was created
      const verify = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
      console.log('[DB] Verification - admin user exists:', !!verify, verify ? { id: verify.id, username: verify.username, role: verify.role } : null);
      console.log('[DB] Default admin user created (database was empty)');
      return;
    }

    // If users exist, check if admin exists
    const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (adminExists) {
      console.log('[DB] Admin user already exists');
      return;
    }

    // If users exist but no admin, create admin
    const passwordHash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      'admin',
      passwordHash,
      'admin'
    );
    console.log('[DB] Default admin user created (other users existed)');
  } catch (err) {
    console.error('[DB] Error seeding default user:', err.message);
  }
}

export function getDb() {
  return db;
}
