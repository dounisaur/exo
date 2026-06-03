export const version = 4;
export const name = 'add_opening_hours_json';

export function up(db) {
  // Add the new JSON column
  db.exec(`ALTER TABLE venues ADD COLUMN opening_hours TEXT`);

  // Migrate existing opening_time/closing_time data to JSON format
  // For venues with times, create a JSON with all 7 days closed except today (placeholder)
  // Since we don't have day-of-week info from the old columns, mark all days as CLOSED
  // and let admins re-populate from Google when they edit
  const venues = db.prepare('SELECT id, opening_time, closing_time FROM venues WHERE opening_time IS NOT NULL OR closing_time IS NOT NULL').all();

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
    db.prepare('UPDATE venues SET opening_hours = ? WHERE id = ?').run(hoursJson, venue.id);
  }

  // Now drop the old columns
  db.exec(`ALTER TABLE venues DROP COLUMN opening_time`);
  db.exec(`ALTER TABLE venues DROP COLUMN closing_time`);
}

export function down(db) {
  // Rollback: recreate old columns and migrate back
  db.exec(`ALTER TABLE venues ADD COLUMN opening_time TEXT`);
  db.exec(`ALTER TABLE venues ADD COLUMN closing_time TEXT`);

  // This is a lossy downgrade - we don't have the original day-of-week breakdown
  // Just mark them as having times for display
  const venues = db.prepare('SELECT id, opening_hours FROM venues WHERE opening_hours IS NOT NULL').all();
  for (const venue of venues) {
    try {
      const hours = JSON.parse(venue.opening_hours);
      // Use first non-closed day as reference
      for (const day in hours) {
        if (hours[day] !== 'CLOSED') {
          const [open, close] = hours[day].split('-');
          db.prepare('UPDATE venues SET opening_time = ?, closing_time = ? WHERE id = ?').run(open, close, venue.id);
          break;
        }
      }
    } catch (e) {
      // Skip if JSON parse fails
    }
  }

  db.exec(`ALTER TABLE venues DROP COLUMN opening_hours`);
}
