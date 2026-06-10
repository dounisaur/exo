export const version = 10;
export const name = 'add_venue_comments';

export async function up(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS venue_comments (
      id SERIAL PRIMARY KEY,
      venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✓ Created venue_comments table');
}

export async function down(client) {
  await client.query(`DROP TABLE IF EXISTS venue_comments;`);
  console.log('✓ Dropped venue_comments table');
}
