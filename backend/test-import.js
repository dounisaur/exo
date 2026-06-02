console.log('[TEST] Starting import test...');

try {
  console.log('[TEST] Importing server.js');
  await import('./server.js');
  console.log('[TEST] Server imported successfully');
} catch (err) {
  console.error('[TEST] Import failed:', err);
}

// Keep the process alive for a moment
setTimeout(() => {
  console.log('[TEST] Exiting');
  process.exit(0);
}, 2000);
