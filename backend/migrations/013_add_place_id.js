export const version = 13;
export const name = 'add_place_id';

export async function up(client) {
  await client.query(`
    ALTER TABLE venues
    ADD COLUMN place_id TEXT
  `);
}

export async function down(client) {
  await client.query(`
    ALTER TABLE venues
    DROP COLUMN place_id
  `);
}
