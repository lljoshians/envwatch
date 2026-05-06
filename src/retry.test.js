const { createRetryState, calcDelay, DEFAULT_OPTIONS } = require('./retry');
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

console.log('retry tests');

test('starts with zero attempts', () => {
  const r = createRetryState();
  assert.strictEqual(r.attempts, 0);
});

test('canRetry returns true initially', () => {
  const r = createRetryState();
  assert.ok(r.canRetry());
});

test('canRetry returns false after max attempts', () => {
  const r = createRetryState({ maxAttempts: 3 });
  r.record(); r.record(); r.record();
  assert.ok(!r.canRetry());
});

test('record increments attempts', () => {
  const r = createRetryState();
  r.record();
  assert.strictEqual(r.attempts, 1);
  r.record();
  assert.strictEqual(r.attempts, 2);
});

test('reset clears state', () => {
  const r = createRetryState();
  r.record(); r.record();
  r.reset();
  assert.strictEqual(r.attempts, 0);
  assert.strictEqual(r.lastAttemptAt, null);
});

test('summary reflects exhausted state', () => {
  const r = createRetryState({ maxAttempts: 2 });
  r.record(); r.record();
  const s = r.summary();
  assert.ok(s.exhausted);
  assert.strictEqual(s.attempts, 2);
});

test('calcDelay grows with attempt number', () => {
  const d1 = calcDelay(1, { ...DEFAULT_OPTIONS, jitter: false });
  const d2 = calcDelay(2, { ...DEFAULT_OPTIONS, jitter: false });
  assert.ok(d2 > d1);
});

test('calcDelay respects maxDelay', () => {
  const d = calcDelay(99, { ...DEFAULT_OPTIONS, maxDelay: 1000, jitter: false });
  assert.ok(d <= 1000);
});

test('nextDelay is positive', () => {
  const r = createRetryState({ jitter: false });
  assert.ok(r.nextDelay() > 0);
});

test('record sets lastAttemptAt', () => {
  const before = Date.now();
  const r = createRetryState();
  r.record();
  assert.ok(r.lastAttemptAt >= before);
});
