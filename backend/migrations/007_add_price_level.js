export const version = 7;
export const name = 'add_price_level';

export async function up(client) {
  await client.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_level TEXT`);
}

export async function down(client) {
  await client.query(`ALTER TABLE venues DROP COLUMN IF EXISTS price_level`);
}
