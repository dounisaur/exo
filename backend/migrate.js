import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(pool) {
  // Create applied_migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applied_migrations (
      id SERIAL PRIMARY KEY,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

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

  const { rows: appliedRows } = await pool.query(
    'SELECT version FROM applied_migrations ORDER BY version'
  );
  const appliedMigrations = appliedRows.map(row => row.version);

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

  // PRODUCTION SAFETY: Block new migrations on production
  const isProduction = process.env.ENVIRONMENT === 'production' ||
                       process.env.NODE_ENV === 'production' ||
                       process.env.RENDER === 'true';

  if (isProduction && pendingMigrations.length > 0) {
    const allowMigrations = process.env.ALLOW_MIGRATIONS === 'true';
    if (!allowMigrations) {
      console.error('[MIGRATE] ❌ BLOCKED: Production environment with pending migrations');
      console.error(`[MIGRATE] Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(m => console.error(`[MIGRATE]   - v${m.version}: ${m.name}`));
      console.error('[MIGRATE] To apply migrations, set ALLOW_MIGRATIONS=true');
      console.error('[MIGRATE] Exiting to prevent accidental data loss.');
      process.exit(1);
    }
    console.warn('[MIGRATE] ⚠️  WARNING: Running new migrations on production!');
  }

  console.log(`[MIGRATE] Found ${pendingMigrations.length} pending migration(s). Starting...`);

  // SAFETY CHECK: If running ALL migrations AND database has existing data, STOP and warn
  if (pendingMigrations.length === migrationFiles.length) {
    // Check if any tables have data
    const { rows: tables } = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name != 'applied_migrations'`
    );

    let hasData = false;
    for (const table of tables) {
      try {
        const { rows: countResult } = await pool.query(
          `SELECT COUNT(*) as count FROM ${table.table_name}`
        );
        const count = parseInt(countResult[0].count, 10);
        if (count > 0) {
          console.error(`[MIGRATE] SAFETY CHECK FAILED: Table '${table.table_name}' contains ${count} rows`);
          hasData = true;
        }
      } catch (err) {
        // Table might not exist yet, ignore
      }
    }

    if (hasData) {
      console.error('[MIGRATE] REFUSING TO RUN MIGRATIONS: Database contains existing data');
      console.error('[MIGRATE] This would wipe out your data. Please check backups.');
      process.exit(1);
    }

    console.warn(`[MIGRATE] Running ALL ${migrationFiles.length} migrations on empty database`);
  }

  // Get row counts before migrations
  const tablesBefore = await getTableRowCounts(pool);
  console.log(`[MIGRATE] Row counts before: ${JSON.stringify(tablesBefore)}`);

  // Run pending migrations
  for (const { version, name, up } of pendingMigrations) {
    console.log(`[MIGRATE] Running migration ${version}: ${name}`);

    const client = await pool.connect();
    try {
      // Run migration in a transaction
      await client.query('BEGIN');

      try {
        await up(client);
        console.log(`[MIGRATE] Migration ${version} executed`);
      } catch (err) {
        throw new Error(`Migration ${version} (${name}) failed: ${err.message}`);
      }

      // Record the migration as applied
      await client.query(
        'INSERT INTO applied_migrations (version, name) VALUES ($1, $2)',
        [version, name]
      );

      await client.query('COMMIT');
      console.log(`[MIGRATE] Migration ${version} applied successfully`);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[MIGRATE] Migration failed: ${err.message}`);
      console.error('[MIGRATE] Transaction rolled back.');
      process.exit(1);
    } finally {
      client.release();
    }
  }

  // Verify row counts after migrations
  const tablesAfter = await getTableRowCounts(pool);
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
}

async function getTableRowCounts(pool) {
  const { rows: tables } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name != 'applied_migrations'`
  );

  const counts = {};
  for (const table of tables) {
    try {
      const { rows: result } = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      counts[table.table_name] = parseInt(result[0].count, 10);
    } catch (err) {
      // Table might not be accessible, skip
    }
  }
  return counts;
}
