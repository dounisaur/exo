import pg from 'pg';
const { Pool } = pg;
import { runMigrations } from './migrate.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/exo'
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
}
