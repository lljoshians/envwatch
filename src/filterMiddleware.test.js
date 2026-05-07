'use strict';

const assert = require('assert');
const EventEmitter = require('events');
const { attachFilter } = require('./filterMiddleware');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function makeMockWatcher() {
  return new EventEmitter();
}

console.log('filterMiddleware tests');

test('emits restart when all keys are relevant', () => {
  const watcher = makeMockWatcher();
  attachFilter(watcher, { include: ['DB_'] });

  let restartDiff = null;
  watcher.on('restart', diff => { restartDiff = diff; });

  watcher.emit('changed', { DB_HOST: { old: 'a', new: 'b' } });
  assert.ok(restartDiff !== null);
  assert.ok('DB_HOST' in restartDiff);
});

test('suppresses restart when no keys pass filter', () => {
  const watcher = makeMockWatcher();
  attachFilter(watcher, { include: ['DB_'] });

  let restarted = false;
  watcher.on('restart', () => { restarted = true; });

  watcher.emit('changed', { APP_PORT: { old: '3000', new: '4000' } });
  assert.ok(!restarted);
});

test('filters out excluded keys from restart diff', () => {
  const watcher = makeMockWatcher();
  attachFilter(watcher, { exclude: ['LOG_'] });

  let restartDiff = null;
  watcher.on('restart', diff => { restartDiff = diff; });

  watcher.emit('changed', {
    DB_HOST: { old: 'x', new: 'y' },
    LOG_LEVEL: { old: 'info', new: 'debug' },
  });

  assert.ok(restartDiff !== null);
  assert.ok('DB_HOST' in restartDiff);
  assert.ok(!('LOG_LEVEL' in restartDiff));
});

test('detach stops listening for changes', () => {
  const watcher = makeMockWatcher();
  const { detach } = attachFilter(watcher, {});

  let count = 0;
  watcher.on('restart', () => { count++; });

  watcher.emit('changed', { KEY: { old: '1', new: '2' } });
  assert.strictEqual(count, 1);

  detach();
  watcher.emit('changed', { KEY: { old: '2', new: '3' } });
  assert.strictEqual(count, 1);
});

test('no include/exclude passes all keys through', () => {
  const watcher = makeMockWatcher();
  attachFilter(watcher);

  let restartDiff = null;
  watcher.on('restart', diff => { restartDiff = diff; });

  watcher.emit('changed', { ANYTHING: { old: 'a', new: 'b' } });
  assert.ok(restartDiff !== null);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
