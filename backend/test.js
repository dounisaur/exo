console.log('Starting test...');
import('./db.js').then(() => {
  console.log('DB imported');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
setTimeout(() => {
  console.log('Still running...');
}, 2000);
