console.log('START');
console.error('START_ERR');
process.stdout.write('STDOUT\n');
process.stderr.write('STDERR\n');
setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(0);
}, 1000);
