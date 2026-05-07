'use strict';

const assert = require('assert');
const EventEmitter = require('events');
const { attachValidation } = require('./validationMiddleware');

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

console.log('\nvalidationMiddleware tests');

test('does not emit validationFailed when env is valid', () => {
  const watcher = makeMockWatcher();
  const rules = [{ key: 'PORT', required: true }];
  attachValidation(watcher, rules, { blockRestart: true });

  let failed = false;
  watcher.on('validationFailed', () => { failed = true; });
  watcher.emit('changed', ['PORT'], { PORT: '3000' });
  assert.strictEqual(failed, false);
});

test('emits validationFailed when required key missing and blockRestart true', () => {
  const watcher = makeMockWatcher();
  const rules = [{ key: 'SECRET', required: true }];
  attachValidation(watcher, rules, { blockRestart: true });

  let errors = null;
  watcher.on('validationFailed', (errs) => { errors = errs; });
  watcher.emit('changed', ['PORT'], { PORT: '3000' });
  assert.ok(Array.isArray(errors));
  assert.ok(errors.length > 0);
});

test('does not emit validationFailed when blockRestart is false', () => {
  const watcher = makeMockWatcher();
  const rules = [{ key: 'SECRET', required: true }];
  attachValidation(watcher, rules, { blockRestart: false });

  let fired = false;
  watcher.on('validationFailed', () => { fired = true; });
  watcher.emit('changed', [], {});
  assert.strictEqual(fired, false);
});

test('detach removes listener', () => {
  const watcher = makeMockWatcher();
  const rules = [{ key: 'SECRET', required: true }];
  const { detach } = attachValidation(watcher, rules, { blockRestart: true });
  detach();

  let fired = false;
  watcher.on('validationFailed', () => { fired = true; });
  watcher.emit('changed', [], {});
  assert.strictEqual(fired, false);
});

test('multiple errors are all reported', () => {
  const watcher = makeMockWatcher();
  const rules = [
    { key: 'A', required: true },
    { key: 'B', required: true },
  ];
  attachValidation(watcher, rules, { blockRestart: true });

  let errors = [];
  watcher.on('validationFailed', (errs) => { errors = errs; });
  watcher.emit('changed', [], {});
  assert.strictEqual(errors.length, 2);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
