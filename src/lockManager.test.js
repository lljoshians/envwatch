const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { LockManager } = require('./lockManager');
const { releaseLock, getLockPath } = require('./filelock');

const tmp = (suffix) => path.join(os.tmpdir(), `envwatch_lm_test_${process.pid}_${suffix}.env`);

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('lockManager tests');

test('acquire returns true for new file', () => {
  const mgr = new LockManager();
  const f = tmp('a');
  const ok = mgr.acquire(f);
  assert.strictEqual(ok, true);
  assert.strictEqual(mgr.hasLock(f), true);
  mgr.destroy();
});

test('acquire returns false if already locked by this process', () => {
  const mgr = new LockManager();
  const f = tmp('b');
  mgr.acquire(f);
  // second manager tries same file — same pid holds it
  const mgr2 = new LockManager();
  const ok = mgr2.acquire(f);
  assert.strictEqual(ok, false);
  mgr.destroy();
  mgr2.destroy();
});

test('release removes lock and updates internal set', () => {
  const mgr = new LockManager();
  const f = tmp('c');
  mgr.acquire(f);
  const released = mgr.release(f);
  assert.strictEqual(released, true);
  assert.strictEqual(mgr.hasLock(f), false);
  mgr.destroy();
});

test('releaseAll clears all held locks', () => {
  const mgr = new LockManager();
  const f1 = tmp('d1');
  const f2 = tmp('d2');
  mgr.acquire(f1);
  mgr.acquire(f2);
  mgr.releaseAll();
  assert.strictEqual(mgr.hasLock(f1), false);
  assert.strictEqual(mgr.hasLock(f2), false);
  mgr.destroy();
});

test('destroy removes process listeners and releases locks', () => {
  const mgr = new LockManager();
  const f = tmp('e');
  mgr.acquire(f);
  mgr.destroy();
  assert.strictEqual(mgr.hasLock(f), false);
  const lockPath = getLockPath(f);
  assert.strictEqual(fs.existsSync(lockPath), false);
});
