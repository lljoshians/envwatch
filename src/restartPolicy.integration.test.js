// Integration: restartPolicy + retry working together in a restart loop sim
const { createRestartPolicy } = require('./restartPolicy');
const assert = require('assert');

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('restartPolicy integration tests');

await test('simulates a full retry loop until exhaustion', async () => {
  const policy = createRestartPolicy({ maxAttempts: 3, baseDelay: 5, maxDelay: 20, jitter: false });
  let restarts = 0;

  while (policy.shouldRestart(1)) {
    await policy.waitAndRecord();
    restarts++;
  }

  assert.strictEqual(restarts, 3);
  const s = policy.summary();
  assert.ok(s.exhausted);
});

await test('resets and allows retrying again after success', async () => {
  const policy = createRestartPolicy({ maxAttempts: 2, baseDelay: 5, jitter: false });

  await policy.waitAndRecord();
  await policy.waitAndRecord();
  assert.ok(!policy.shouldRestart(1));

  policy.onSuccess();
  assert.ok(policy.shouldRestart(1));
  assert.strictEqual(policy.attempts, 0);
});

await test('fatal exit code stops loop immediately', async () => {
  const policy = createRestartPolicy({ maxAttempts: 5, baseDelay: 5, jitter: false });
  let restarts = 0;
  const exitCode = 127;

  while (policy.shouldRestart(exitCode)) {
    await policy.waitAndRecord();
    restarts++;
  }

  assert.strictEqual(restarts, 0);
});
