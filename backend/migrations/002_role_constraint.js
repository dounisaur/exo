export const version = 2;
export const name = 'role_constraint';

export async function up(client) {
  // PostgreSQL can add constraint directly without table rebuild
  await client.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'creator'))
  `);
}
