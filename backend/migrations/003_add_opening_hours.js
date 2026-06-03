export const version = 3;
export const name = 'add_opening_hours';

export function up(db) {
  db.exec(`ALTER TABLE venues ADD COLUMN opening_time TEXT`);
  db.exec(`ALTER TABLE venues ADD COLUMN closing_time TEXT`);
}
