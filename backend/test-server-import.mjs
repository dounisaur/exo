console.log('[TEST] About to import server.js');
try {
  await import('./server.js');
  console.log('[TEST] Import succeeded');
} catch (e) {
  console.error('[TEST] Import failed:', e.message);
  console.error(e);
}
setTimeout(() => process.exit(0), 2000);
