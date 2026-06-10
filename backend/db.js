import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { runMigrations } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'venues.db');
const BACKUPS_DIR = path.join(__dirname, 'backups');

let db;

// Check if we should restore from backup
function restoreFromBackupIfNeeded() {
  const isProduction = process.env.ENVIRONMENT === 'production' ||
                       process.env.NODE_ENV === 'production' ||
                       process.env.RENDER === 'true';

  // SAFETY: Do NOT auto-restore backups on production
  // This can overwrite live data with corrupted backups
  if (isProduction) {
    console.log('[DB] Production mode - auto-restore disabled (use manual recovery if needed)');
    return;
  }

  const dbExists = fs.existsSync(DB_PATH);
  const dbSize = dbExists ? fs.statSync(DB_PATH).size : 0;

  // Local development only: If database doesn't exist or is very small, restore from backup
  if ((!dbExists || dbSize < 10240) && fs.existsSync(BACKUPS_DIR)) {
    const backups = fs
      .readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length > 0) {
      const latestBackup = backups[0];
      const backupPath = path.join(BACKUPS_DIR, latestBackup);
      try {
        console.log(`[DB] Restoring database from backup: ${latestBackup}`);
        fs.copyFileSync(backupPath, DB_PATH);
        console.log('[DB] Database restored from backup');
      } catch (err) {
        console.error(`[DB] Failed to restore backup: ${err.message}`);
      }
    }
  }
}

// Try to restore from backup before opening
restoreFromBackupIfNeeded();

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

  // CRITICAL: Never automatically create or modify user accounts
  // This function is COMPLETELY DISABLED - users must be managed manually
  console.log('[DB] User seeding disabled - manage accounts manually');
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

    // If no users at all, create default admin (local development only)
    if (userCount === 0) {
      const passwordHash = bcrypt.hashSync('admin', 10);
      db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
        'admin',
        passwordHash,
        'admin'
      );
      console.log('[DB] Created default admin user (local development)');
      return;
    }

    // If users exist, check if admin exists
    const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (adminExists) {
      console.log('[DB] Admin user already exists');
      return;
    }

    // If users exist but no admin, create admin (local only)
    const passwordHash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
      'admin',
      passwordHash,
      'admin'
    );
    console.log('[DB] Created admin user (local development, other users existed)');
  } catch (err) {
    console.error('[DB] Error in seed function:', err.message);
  }
}

export function getDb() {
  return db;
}
