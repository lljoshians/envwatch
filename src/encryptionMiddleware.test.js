// encryptionMiddleware.test.js

const EventEmitter = require('events');
const { attachEncryption } = require('./encryptionMiddleware');
const { encryptEnv } = require('./envEncryption');

const SECRET = 'test-secret-1234';
let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log('  PASS', label);
    passed++;
  } catch (err) {
    console.error('  FAIL', label, '-', err.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function makeMockWatcher() {
  return new EventEmitter();
}

test('attachEncryption throws without secret', () => {
  let threw = false;
  try { attachEncryption(makeMockWatcher(), ''); } catch { threw = true; }
  assert(threw);
});

test('emits ready:decrypted with decrypted env on ready', () => {
  const watcher = makeMockWatcher();
  const rawEnv = encryptEnv({ DB_PASS: 'hunter2', HOST: 'localhost' }, SECRET, ['DB_PASS']);
  let received = null;
  attachEncryption(watcher, SECRET);
  watcher.on('ready:decrypted', env => { received = env; });
  watcher.emit('ready', rawEnv);
  assert(received !== null, 'should have received decrypted env');
  assert(received.DB_PASS === 'hunter2', 'DB_PASS should be decrypted');
  assert(received.HOST === 'localhost', 'HOST unchanged');
});

test('emits changed:decrypted on changed event', () => {
  const watcher = makeMockWatcher();
  const prev = encryptEnv({ DB_PASS: 'old' }, SECRET, ['DB_PASS']);
  const curr = encryptEnv({ DB_PASS: 'new' }, SECRET, ['DB_PASS']);
  let received = null;
  attachEncryption(watcher, SECRET);
  watcher.on('changed:decrypted', diff => { received = diff; });
  watcher.emit('changed', { previous: prev, current: curr, keys: ['DB_PASS'] });
  assert(received !== null);
  assert(received.current.DB_PASS === 'new');
  assert(received.previous.DB_PASS === 'old');
});

test('emits error when decryption fails on ready', () => {
  const watcher = makeMockWatcher();
  let errorEmitted = false;
  attachEncryption(watcher, SECRET);
  watcher.on('error', () => { errorEmitted = true; });
  watcher.emit('ready', { DB_PASS: 'enc:garbage:data:here' });
  assert(errorEmitted, 'should emit error on bad ciphertext');
});

test('detach removes listeners', () => {
  const watcher = makeMockWatcher();
  const { detach } = attachEncryption(watcher, SECRET);
  detach();
  assert(watcher.listenerCount('ready') === 0);
  assert(watcher.listenerCount('changed') === 0);
});

console.log(`\nencryptionMiddleware: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
