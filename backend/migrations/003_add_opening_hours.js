export const version = 3;
export const name = 'add_opening_hours';

export async function up(client) {
  await client.query(`ALTER TABLE venues ADD COLUMN opening_time TEXT`);
  await client.query(`ALTER TABLE venues ADD COLUMN closing_time TEXT`);
}
