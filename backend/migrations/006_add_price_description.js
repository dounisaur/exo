export const version = 6;
export const name = 'add_price_description';

export async function up(client) {
  await client.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_description TEXT`);
}

export async function down(client) {
  await client.query(`ALTER TABLE venues DROP COLUMN IF EXISTS price_description`);
}
