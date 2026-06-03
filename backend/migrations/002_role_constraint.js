export const version = 2;
export const name = 'role_constraint';

export function up(db) {
  // Rename existing table
  db.exec('ALTER TABLE users RENAME TO users_old');

  // Create new table with CHECK constraint on role
  db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'creator')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Copy data over
  db.exec('INSERT INTO users SELECT * FROM users_old');

  // Drop old table
  db.exec('DROP TABLE users_old');
}
