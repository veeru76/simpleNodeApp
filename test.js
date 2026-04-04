const assert = require('assert');

console.log('Running tests in test file');

// A very simple test scenario
try {
  assert.strictEqual(1 + 1, 2, 'Math is broken!');
  console.log('All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('Test failed!', error);
  process.exit(1);
}
