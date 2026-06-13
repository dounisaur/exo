export const version = 11;
export const name = 'add_photo_urls';

export async function up(client) {
  await client.query(`
    ALTER TABLE venues
    ADD COLUMN photo_urls TEXT[] DEFAULT '{}'
  `);
}

export async function down(client) {
  await client.query(`
    ALTER TABLE venues
    DROP COLUMN photo_urls
  `);
}
