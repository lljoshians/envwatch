/**
 * Tests for envCache.js
 */

const { createEnvCache } = require('./envCache');

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function test(name, fn) {
  Promise.resolve(fn()).then(() => {
    console.log(`  PASS  ${name}`);
  }).catch(err => {
    console.error(`  FAIL  ${name}`);
    console.error('        ', err.message);
    process.exitCode = 1;
  });
}

test('set and get returns value within TTL', async () => {
  const cache = createEnvCache(200);
  cache.set('k', { FOO: 'bar' });
  const val = cache.get('k');
  assert(val && val.FOO === 'bar', 'should return cached value');
});

test('get returns undefined after TTL expires', async () => {
  const cache = createEnvCache(50);
  cache.set('k', { FOO: 'bar' });
  await sleep(80);
  assert(cache.get('k') === undefined, 'should expire after TTL');
});

test('has returns true for live entry', async () => {
  const cache = createEnvCache(200);
  cache.set('x', {});
  assert(cache.has('x'), 'has should be true');
});

test('has returns false for missing key', async () => {
  const cache = createEnvCache(200);
  assert(!cache.has('nope'), 'has should be false for missing key');
});

test('invalidate removes a specific key', async () => {
  const cache = createEnvCache(500);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.invalidate('a');
  assert(cache.get('a') === undefined, 'a should be gone');
  assert(cache.get('b') === 2, 'b should remain');
});

test('invalidate with no args clears all', async () => {
  const cache = createEnvCache(500);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.invalidate();
  assert(cache.stats().size === 0, 'store should be empty');
});

test('stats tracks hits and misses', async () => {
  const cache = createEnvCache(500);
  cache.set('k', 42);
  cache.get('k');
  cache.get('k');
  cache.get('missing');
  const s = cache.stats();
  assert(s.hits === 2, `expected 2 hits, got ${s.hits}`);
  assert(s.misses === 1, `expected 1 miss, got ${s.misses}`);
});

test('keys returns only live keys', async () => {
  const cache = createEnvCache(80);
  cache.set('live', 1);
  cache.set('dying', 2);
  await sleep(100);
  cache.set('fresh', 3);
  const k = cache.keys();
  assert(k.includes('fresh'), 'fresh should be listed');
  assert(!k.includes('dying'), 'expired key should not appear');
});
