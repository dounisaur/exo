// TEMPORARY MIGRATION SCRIPT: SQLite → PostgreSQL
// Run once: node backend/migrate-data.js
// Copies all data from local SQLite database to PostgreSQL
// Delete this file after successful migration

import Database from 'better-sqlite3';
import pg from 'pg';
const { Pool } = pg;

const sqlite = new Database('./venues.db');
const pool = new Pool({ connectionString: 'postgresql://localhost:5432/exo' });

async function main() {
  const client = await pool.connect();

  try {
    console.log('Starting data migration from SQLite to PostgreSQL...');
    await client.query('BEGIN');

    // 1. Migrate users
    console.log('Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await client.query(
        'INSERT INTO users (id, username, password_hash, role, created_at) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5)',
        [u.id, u.username, u.password_hash, u.role, u.created_at]
      );
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('users','id'), MAX(id)) FROM users`);
    console.log(`✓ Migrated ${users.length} user(s)`);

    // 2. Migrate categories
    console.log('Migrating categories...');
    const categories = sqlite.prepare('SELECT * FROM categories').all();
    for (const c of categories) {
      await client.query(
        'INSERT INTO categories (id, name, slug) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3)',
        [c.id, c.name, c.slug]
      );
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('categories','id'), MAX(id)) FROM categories`);
    console.log(`✓ Migrated ${categories.length} category(ies)`);

    // 3. Migrate subcategories
    console.log('Migrating subcategories...');
    const subcategories = sqlite.prepare('SELECT * FROM subcategories').all();
    for (const s of subcategories) {
      await client.query(
        'INSERT INTO subcategories (id, category_id, name, slug) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)',
        [s.id, s.category_id, s.name, s.slug]
      );
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('subcategories','id'), MAX(id)) FROM subcategories`);
    console.log(`✓ Migrated ${subcategories.length} subcategory(ies)`);

    // 4. Migrate venues
    console.log('Migrating venues...');
    const venues = sqlite.prepare('SELECT * FROM venues').all();
    for (const v of venues) {
      await client.query(
        `INSERT INTO venues (id, name, category, subcategory_id, latitude, longitude, address, image_url, website_url, phone_number, reservation_link, rating, status, created_at, updated_at, opening_hours)
         OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [v.id, v.name, v.category, v.subcategory_id, v.latitude, v.longitude, v.address, v.image_url, v.website_url, v.phone_number, v.reservation_link, v.rating, v.status, v.created_at, v.updated_at, v.opening_hours]
      );
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('venues','id'), MAX(id)) FROM venues`);
    console.log(`✓ Migrated ${venues.length} venue(s)`);

    await client.query('COMMIT');
    console.log('\n✓ Migration complete! All data transferred to PostgreSQL.');

    // Verify
    const { rows: userCount } = await client.query('SELECT COUNT(*) as count FROM users');
    const { rows: venueCount } = await client.query('SELECT COUNT(*) as count FROM venues');
    console.log(`\nVerification:`);
    console.log(`  Users: ${userCount[0].count}`);
    console.log(`  Venues: ${venueCount[0].count}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
