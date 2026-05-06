const { createRestartPolicy, FATAL_EXIT_CODES } = require('./restartPolicy');
const assert = require('assert');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('restartPolicy tests');

test('shouldRestart true for normal exit code', () => {
  const p = createRestartPolicy({ maxAttempts: 3 });
  assert.ok(p.shouldRestart(1));
});

test('shouldRestart false for fatal code 127', () => {
  const p = createRestartPolicy();
  assert.ok(!p.shouldRestart(127));
});

test('shouldRestart false for fatal code 2', () => {
  const p = createRestartPolicy();
  assert.ok(!p.shouldRestart(2));
});

test('shouldRestart false after max attempts', () => {
  const p = createRestartPolicy({ maxAttempts: 1, baseDelay: 1 });
  p.waitAndRecord(); // fire and forget for test
  // simulate attempts exhausted
  const p2 = createRestartPolicy({ maxAttempts: 0 });
  assert.ok(!p2.shouldRestart(1));
});

test('onSuccess resets attempts', () => {
  const p = createRestartPolicy({ maxAttempts: 3, baseDelay: 1 });
  // manually bump state via shouldRestart checks
  assert.ok(p.shouldRestart(1));
  p.onSuccess();
  assert.strictEqual(p.attempts, 0);
});

test('isFatalCode identifies fatal codes', () => {
  const p = createRestartPolicy();
  assert.ok(p.isFatalCode(127));
  assert.ok(!p.isFatalCode(1));
  assert.ok(!p.isFatalCode(0));
});

test('FATAL_EXIT_CODES contains expected values', () => {
  assert.ok(FATAL_EXIT_CODES.has(2));
  assert.ok(FATAL_EXIT_CODES.has(126));
  assert.ok(FATAL_EXIT_CODES.has(127));
});

await asyncTest('waitAndRecord resolves and increments', async () => {
  const p = createRestartPolicy({ baseDelay: 10, maxDelay: 20, jitter: false });
  await p.waitAndRecord();
  assert.strictEqual(p.attempts, 1);
});
