export const version = 12;
export const name = 'add_primary_photo_url';

export async function up(client) {
  await client.query(`
    ALTER TABLE venues
    ADD COLUMN primary_photo_url TEXT
  `);
}

export async function down(client) {
  await client.query(`
    ALTER TABLE venues
    DROP COLUMN primary_photo_url
  `);
}
