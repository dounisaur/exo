export const version = 5;
export const name = 'add_price_range';

export async function up(client) {
  await client.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_range TEXT`);
}

export async function down(client) {
  await client.query(`ALTER TABLE venues DROP COLUMN IF EXISTS price_range`);
}
