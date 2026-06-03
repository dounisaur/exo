export const version = 4;
export const name = 'add_opening_hours_json';

export function up(db) {
  // Drop the old columns and add the new JSON column
  db.exec(`ALTER TABLE venues DROP COLUMN opening_time`);
  db.exec(`ALTER TABLE venues DROP COLUMN closing_time`);
  db.exec(`ALTER TABLE venues ADD COLUMN opening_hours TEXT`);
}

export function down(db) {
  // Rollback: remove JSON column and recreate the old ones
  db.exec(`ALTER TABLE venues DROP COLUMN opening_hours`);
  db.exec(`ALTER TABLE venues ADD COLUMN opening_time TEXT`);
  db.exec(`ALTER TABLE venues ADD COLUMN closing_time TEXT`);
}
