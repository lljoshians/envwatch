const assert = require('assert');
const { debounce } = require('./debounce');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const results = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('debounce tests');

  await test('calls fn after delay', async () => {
    let calls = 0;
    const fn = debounce(() => calls++, 50);
    fn();
    fn();
    fn();
    assert.strictEqual(calls, 0);
    await sleep(80);
    assert.strictEqual(calls, 1);
  });

  await test('passes latest args to fn', async () => {
    let received = null;
    const fn = debounce((val) => { received = val; }, 50);
    fn('first');
    fn('second');
    fn('third');
    await sleep(80);
    assert.strictEqual(received, 'third');
  });

  await test('cancel prevents execution', async () => {
    let calls = 0;
    const fn = debounce(() => calls++, 50);
    fn();
    fn.cancel();
    await sleep(80);
    assert.strictEqual(calls, 0);
  });

  await test('flush executes immediately', async () => {
    let calls = 0;
    const fn = debounce(() => calls++, 200);
    fn();
    assert.strictEqual(calls, 0);
    fn.flush();
    assert.strictEqual(calls, 1);
    await sleep(250);
    assert.strictEqual(calls, 1);
  });

  await test('isPending returns correct state', async () => {
    const fn = debounce(() => {}, 100);
    assert.strictEqual(fn.isPending(), false);
    fn();
    assert.strictEqual(fn.isPending(), true);
    await sleep(130);
    assert.strictEqual(fn.isPending(), false);
  });

  await test('cancel clears pending state', async () => {
    const fn = debounce(() => {}, 100);
    fn();
    assert.strictEqual(fn.isPending(), true);
    fn.cancel();
    assert.strictEqual(fn.isPending(), false);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
