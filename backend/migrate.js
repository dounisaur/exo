import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const BACKUPS_DIR = path.join(__dirname, 'backups');

export async function runMigrations(db) {
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  // Create applied_migrations table if it doesn't exist
  db.exec(`CREATE TABLE IF NOT EXISTS applied_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Load all migration files
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('[MIGRATE] No migrations directory found. Skipping migrations.');
    return;
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('[MIGRATE] No migrations found.');
    return;
  }

  const appliedMigrations = db
    .prepare('SELECT version FROM applied_migrations ORDER BY version')
    .all()
    .map(row => row.version);

  const pendingMigrations = [];

  for (const file of migrationFiles) {
    const migration = await import(path.join(MIGRATIONS_DIR, file));
    const { version, name, up } = migration;

    if (!version || !name || !up) {
      throw new Error(`Migration ${file} must export { version, name, up }`);
    }

    if (!appliedMigrations.includes(version)) {
      pendingMigrations.push({ version, name, up, file });
    }
  }

  if (pendingMigrations.length === 0) {
    console.log('[MIGRATE] Database is up to date.');
    return;
  }

  console.log(`[MIGRATE] Found ${pendingMigrations.length} pending migration(s). Starting...`);

  // Take backup before running any migrations
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(BACKUPS_DIR, `venues_backup_${timestamp}.db`);

  try {
    console.log(`[MIGRATE] Creating backup: ${backupPath}`);
    await db.backup(backupPath);
    console.log(`[MIGRATE] Backup created successfully`);

    // Get row counts before migrations
    const tablesBefore = getTableRowCounts(db);
    console.log(`[MIGRATE] Row counts before: ${JSON.stringify(tablesBefore)}`);

    // Run pending migrations
    for (const { version, name, up } of pendingMigrations) {
      console.log(`[MIGRATE] Running migration ${version}: ${name}`);

      try {
        // Run migration in a transaction
        db.transaction(() => {
          up(db);
        })();

        // Record the migration as applied
        db.prepare('INSERT INTO applied_migrations (version, name) VALUES (?, ?)').run(version, name);
        console.log(`[MIGRATE] Migration ${version} applied successfully`);
      } catch (err) {
        throw new Error(`Migration ${version} (${name}) failed: ${err.message}`);
      }
    }

    // Verify row counts after migrations
    const tablesAfter = getTableRowCounts(db);
    console.log(`[MIGRATE] Row counts after: ${JSON.stringify(tablesAfter)}`);

    // Check for data loss (row count decreased)
    for (const table of Object.keys(tablesBefore)) {
      if (tablesAfter[table] < tablesBefore[table]) {
        throw new Error(
          `Data loss detected in table ${table}: before=${tablesBefore[table]}, after=${tablesAfter[table]}`
        );
      }
    }

    console.log('[MIGRATE] All migrations completed successfully. Database verified.');
  } catch (err) {
    console.error(`[MIGRATE] Migration failed: ${err.message}`);
    console.error(`[MIGRATE] Rolling back to backup: ${backupPath}`);

    try {
      // Restore from backup
      db.close();

      // Copy backup over current database
      const dbPath = path.join(__dirname, 'venues.db');
      fs.copyFileSync(backupPath, dbPath);

      console.error('[MIGRATE] Rollback complete. Please restart the server.');
      process.exit(1);
    } catch (rollbackErr) {
      console.error(`[MIGRATE] Rollback failed: ${rollbackErr.message}`);
      process.exit(1);
    }
  }
}

function getTableRowCounts(db) {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map(row => row.name);

  const counts = {};
  for (const table of tables) {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    counts[table] = result.count;
  }
  return counts;
}
