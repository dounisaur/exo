console.log('[DB MIN] Starting');
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'test-venues.db');

console.log('[DB MIN] Creating database at:', DB_PATH);
const db = new Database(DB_PATH);
console.log('[DB MIN] Database created');

db.pragma('journal_mode = WAL');
console.log('[DB MIN] WAL mode set');

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

console.log('[DB MIN] Tables created');

const adminPassword = bcrypt.hashSync('admin123', 10);
console.log('[DB MIN] Password hashed');

const insertUser = db.prepare(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`);
console.log('[DB MIN] Insert statement prepared');

insertUser.run('admin', adminPassword, 'admin');
console.log('[DB MIN] Insert statement executed');

process.exit(0);
