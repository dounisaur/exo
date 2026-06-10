export const version = 8;
export const name = 'add_canonical_city';

export async function up(client) {
  await client.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS canonical_city TEXT`);
}

export async function down(client) {
  await client.query(`ALTER TABLE venues DROP COLUMN IF EXISTS canonical_city`);
}
