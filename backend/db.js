import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
import { runMigrations } from './migrate.js';

const dbUrl = process.env.DATABASE_URL || 'postgresql://andrew@localhost:5432/exo';
console.log('[DB] Using connection string:', dbUrl.substring(0, dbUrl.indexOf('@') + 1) + '***');

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

export { pool };

export async function initDb() {
  await runMigrations(pool);
  console.log('[DB] User seeding disabled - manage accounts manually');

  // Test query
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM categories');
    console.log('[DB] Test query: Found', rows[0].count, 'categories');
  } catch (err) {
    console.error('[DB] Test query failed:', err.message);
  }
}
