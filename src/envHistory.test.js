// envHistory.test.js

const assert = require('assert');
const { createEnvHistory } = require('./envHistory');

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

console.log('envHistory tests');

test('starts empty', () => {
  const h = createEnvHistory();
  assert.strictEqual(h.size(), 0);
  assert.strictEqual(h.last(), null);
  assert.strictEqual(h.previous(), null);
});

test('push adds entries and last() returns newest', () => {
  const h = createEnvHistory();
  h.push({ FOO: '1' });
  h.push({ FOO: '2' });
  assert.strictEqual(h.size(), 2);
  assert.strictEqual(h.last().snapshot.FOO, '2');
  assert.strictEqual(h.previous().snapshot.FOO, '1');
});

test('push stores a copy of the snapshot', () => {
  const h = createEnvHistory();
  const snap = { FOO: 'original' };
  h.push(snap);
  snap.FOO = 'mutated';
  assert.strictEqual(h.last().snapshot.FOO, 'original');
});

test('entry includes timestamp', () => {
  const before = Date.now();
  const h = createEnvHistory();
  h.push({ A: '1' });
  const after = Date.now();
  const ts = h.last().timestamp;
  assert.ok(ts >= before && ts <= after);
});

test('label is stored and findByLabel works', () => {
  const h = createEnvHistory();
  h.push({ A: '1' }, 'initial');
  h.push({ A: '2' });
  const found = h.findByLabel('initial');
  assert.ok(found);
  assert.strictEqual(found.snapshot.A, '1');
  assert.strictEqual(h.findByLabel('missing'), null);
});

test('respects maxEntries and evicts oldest', () => {
  const h = createEnvHistory(3);
  h.push({ N: '1' });
  h.push({ N: '2' });
  h.push({ N: '3' });
  h.push({ N: '4' });
  assert.strictEqual(h.size(), 3);
  assert.strictEqual(h.at(0).snapshot.N, '2');
  assert.strictEqual(h.last().snapshot.N, '4');
});

test('at() supports negative indices', () => {
  const h = createEnvHistory();
  h.push({ X: 'a' });
  h.push({ X: 'b' });
  assert.strictEqual(h.at(-1).snapshot.X, 'b');
  assert.strictEqual(h.at(-2).snapshot.X, 'a');
  assert.strictEqual(h.at(-99), null);
});

test('clear() empties history', () => {
  const h = createEnvHistory();
  h.push({ A: '1' });
  h.push({ A: '2' });
  h.clear();
  assert.strictEqual(h.size(), 0);
  assert.strictEqual(h.last(), null);
});

test('all() returns a copy of entries array', () => {
  const h = createEnvHistory();
  h.push({ K: 'v' });
  const copy = h.all();
  copy.push({ fake: true });
  assert.strictEqual(h.size(), 1);
});
