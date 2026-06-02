console.log('[TESTDB] Starting');
import('./db.js').then(() => console.log('[TESTDB] DB imported')).catch(e => console.error('[TESTDB] Error:', e));
setTimeout(() => {
  console.log('[TESTDB] Timeout, exiting');
  process.exit(1);
}, 5000);
