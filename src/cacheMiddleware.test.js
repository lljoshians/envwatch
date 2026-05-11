/**
 * Tests for cacheMiddleware.js
 */

const { EventEmitter } = require('events');
const { attachCache } = require('./cacheMiddleware');

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
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

function makeMockWatcher() {
  return new EventEmitter();
}

test('getCached returns undefined before ready', async () => {
  const watcher = makeMockWatcher();
  const { getCached } = attachCache(watcher);
  assert(getCached() === undefined, 'should be undefined before ready');
});

test('getCached returns env after ready event', async () => {
  const watcher = makeMockWatcher();
  const { getCached } = attachCache(watcher);
  const env = { API_KEY: 'abc' };
  watcher.emit('ready', env);
  assert(getCached() && getCached().API_KEY === 'abc', 'should return env from ready');
});

test('getCached updates on changed event', async () => {
  const watcher = makeMockWatcher();
  const { getCached } = attachCache(watcher);
  watcher.emit('ready', { FOO: 'old' });
  watcher.emit('changed', { current: { FOO: 'new' }, previous: { FOO: 'old' } });
  assert(getCached().FOO === 'new', 'should reflect updated env');
});

test('detach stops listening to events', async () => {
  const watcher = makeMockWatcher();
  const { getCached, detach } = attachCache(watcher);
  watcher.emit('ready', { X: '1' });
  detach();
  watcher.emit('changed', { current: { X: '2' }, previous: { X: '1' } });
  assert(getCached() === undefined, 'cache should be cleared after detach');
});

test('cache stats accessible via cache object', async () => {
  const watcher = makeMockWatcher();
  const { cache, getCached } = attachCache(watcher);
  watcher.emit('ready', { Z: 'z' });
  getCached();
  getCached();
  const s = cache.stats();
  assert(s.hits >= 2, `expected at least 2 hits, got ${s.hits}`);
});

test('custom ttlMs and cacheKey options respected', async () => {
  const watcher = makeMockWatcher();
  const { cache } = attachCache(watcher, { ttlMs: 1000, cacheKey: 'myenv' });
  watcher.emit('ready', { HELLO: 'world' });
  assert(cache.has('myenv'), 'custom key should exist in cache');
});
