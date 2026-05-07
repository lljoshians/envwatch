'use strict';

const EventEmitter = require('events');
const { attachAlias } = require('./aliasMiddleware');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function makeMockWatcher() {
  return new EventEmitter();
}

console.log('aliasMiddleware tests');

test('emits changed:expanded with alias keys filled in', (done) => {
  const watcher = makeMockWatcher();
  attachAlias(watcher, { DATABASE_URL: ['DB_URL'] });

  let received = null;
  watcher.on('changed:expanded', (cur) => { received = cur; });

  watcher.emit('changed', { DATABASE_URL: 'postgres://x' }, {});
  assert(received !== null, 'should have received event');
  assert(received.DB_URL === 'postgres://x', 'alias should be expanded');
});

test('does not overwrite existing alias in expanded event', () => {
  const watcher = makeMockWatcher();
  attachAlias(watcher, { DATABASE_URL: ['DB_URL'] });

  let received = null;
  watcher.on('changed:expanded', (cur) => { received = cur; });

  watcher.emit('changed', { DATABASE_URL: 'postgres://a', DB_URL: 'postgres://b' }, {});
  assert(received.DB_URL === 'postgres://b', 'existing alias preserved');
});

test('detach stops emitting changed:expanded', () => {
  const watcher = makeMockWatcher();
  const { detach } = attachAlias(watcher, { PORT: ['APP_PORT'] });

  let count = 0;
  watcher.on('changed:expanded', () => { count++; });

  watcher.emit('changed', { PORT: '3000' }, {});
  assert(count === 1);

  detach();
  watcher.emit('changed', { PORT: '4000' }, {});
  assert(count === 1, 'should not emit after detach');
});

test('works with empty alias map', () => {
  const watcher = makeMockWatcher();
  attachAlias(watcher, {});

  let received = null;
  watcher.on('changed:expanded', (cur) => { received = cur; });

  watcher.emit('changed', { FOO: 'bar' }, {});
  assert(received.FOO === 'bar');
});

test('returns alias helper on attach', () => {
  const watcher = makeMockWatcher();
  const { alias } = attachAlias(watcher, { X: ['Y'] });
  assert(typeof alias.resolve === 'function');
  assert(alias.resolve('Y') === 'X');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
