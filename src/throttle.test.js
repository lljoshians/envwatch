/**
 * throttle.test.js — tests for throttle utility
 */

const assert = require('assert');
const { throttle } = require('./throttle');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\nthrottle tests');

  await test('calls fn immediately on first invocation', async () => {
    let count = 0;
    const { throttled } = throttle(() => count++, 100);
    throttled();
    assert.strictEqual(count, 1);
  });

  await test('drops calls within the throttle window', async () => {
    let count = 0;
    const { throttled } = throttle(() => count++, 200);
    throttled();
    throttled();
    throttled();
    assert.strictEqual(count, 1);
  });

  await test('allows call again after window expires', async () => {
    let count = 0;
    const { throttled } = throttle(() => count++, 50);
    throttled();
    await sleep(60);
    throttled();
    assert.strictEqual(count, 2);
  });

  await test('passes arguments through', async () => {
    const results = [];
    const { throttled } = throttle((x) => results.push(x), 50);
    throttled('a');
    throttled('b'); // dropped
    await sleep(60);
    throttled('c');
    assert.deepStrictEqual(results, ['a', 'c']);
  });

  await test('cancel prevents further calls', async () => {
    let count = 0;
    const { throttled, cancel } = throttle(() => count++, 50);
    throttled();
    cancel();
    await sleep(60);
    throttled();
    assert.strictEqual(count, 1);
  });

  await test('throws on non-function fn', () => {
    assert.throws(() => throttle('nope', 100), TypeError);
  });

  await test('throws on negative wait', () => {
    assert.throws(() => throttle(() => {}, -1), RangeError);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
