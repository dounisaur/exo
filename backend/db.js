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
  const dbExists = fs.existsSync(DB_PATH);
  const dbSize = dbExists ? fs.statSync(DB_PATH).size : 0;

  // If database doesn't exist or is very small (< 10KB), try to restore from backup
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
      console.log('[DB] Creating admin user');
      console.log('[DB] Password hash length:', passwordHash.length);
      console.log('[DB] Password hash (first 30 chars):', passwordHash.substring(0, 30));

      const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
        'admin',
        passwordHash,
        'admin'
      );
      console.log('[DB] Insert result:', { lastInsertRowid: result.lastInsertRowid, changes: result.changes });

      // Force WAL checkpoint to ensure data is written
      db.pragma('wal_checkpoint(RESTART)');

      // Verify it was created and read back
      const verify = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
      if (verify) {
        console.log('[DB] Verification - admin user exists');
        console.log('[DB] Stored hash length:', verify.password_hash.length);
        console.log('[DB] Stored hash (first 30 chars):', verify.password_hash.substring(0, 30));
        console.log('[DB] Hash match:', passwordHash === verify.password_hash);

        // Test the bcrypt comparison
        const testMatch = bcrypt.compareSync('admin', verify.password_hash);
        console.log('[DB] Test bcrypt comparison:', testMatch);
      } else {
        console.error('[DB] ERROR: Admin user was not created!');
      }
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
