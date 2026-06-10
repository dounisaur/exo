export const version = 4;
export const name = 'add_opening_hours_json';

export async function up(client) {
  // Add the new JSON column
  await client.query(`ALTER TABLE venues ADD COLUMN opening_hours TEXT`);

  // Migrate existing opening_time/closing_time data to JSON format
  const { rows: venues } = await client.query(
    'SELECT id, opening_time, closing_time FROM venues WHERE opening_time IS NOT NULL OR closing_time IS NOT NULL'
  );

  for (const venue of venues) {
    // Create a placeholder JSON with all days closed - users can re-populate from Google
    const hoursJson = JSON.stringify({
      '0': 'CLOSED',
      '1': 'CLOSED',
      '2': 'CLOSED',
      '3': 'CLOSED',
      '4': 'CLOSED',
      '5': 'CLOSED',
      '6': 'CLOSED'
    });
    await client.query('UPDATE venues SET opening_hours = $1 WHERE id = $2', [hoursJson, venue.id]);
  }

  // Now drop the old columns
  await client.query(`ALTER TABLE venues DROP COLUMN opening_time`);
  await client.query(`ALTER TABLE venues DROP COLUMN closing_time`);
}

export async function down(client) {
  // Rollback: recreate old columns and migrate back
  await client.query(`ALTER TABLE venues ADD COLUMN opening_time TEXT`);
  await client.query(`ALTER TABLE venues ADD COLUMN closing_time TEXT`);

  // This is a lossy downgrade - we don't have the original day-of-week breakdown
  const { rows: venues } = await client.query(
    'SELECT id, opening_hours FROM venues WHERE opening_hours IS NOT NULL'
  );

  for (const venue of venues) {
    try {
      const hours = JSON.parse(venue.opening_hours);
      // Use first non-closed day as reference
      for (const day in hours) {
        if (hours[day] !== 'CLOSED') {
          const [open, close] = hours[day].split('-');
          await client.query(
            'UPDATE venues SET opening_time = $1, closing_time = $2 WHERE id = $3',
            [open, close, venue.id]
          );
          break;
        }
      }
    } catch (e) {
      // Skip if JSON parse fails
    }
  }

  await client.query(`ALTER TABLE venues DROP COLUMN opening_hours`);
}
