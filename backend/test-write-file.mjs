import { writeFileSync } from 'fs';
writeFileSync('/tmp/write-test.log', 'Hello world\n');
console.log('Done');
process.exit(0);
