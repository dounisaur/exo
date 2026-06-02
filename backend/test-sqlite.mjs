console.log('[SQLITE TEST] Starting');
import Database from 'better-sqlite3';
console.log('[SQLITE TEST] Imported better-sqlite3');
const db = new Database(':memory:');
console.log('[SQLITE TEST] Created in-memory database');
process.exit(0);
