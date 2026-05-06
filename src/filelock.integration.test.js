/**
 * Integration: LockManager + filelock working together across acquire/release cycles
 */

const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { LockManager } = require('./lockManager');
const { getLockInfo, getLockPath } = require('./filelock');

const tmp = (s) => path.join(os.tmpdir(), `envwatch_int_${process.pid}_${s}.env`);

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('filelock integration tests');

test('full acquire → inspect → release cycle', () => {
  const mgr = new LockManager();
  const f = tmp('cycle');

  assert.strictEqual(mgr.acquire(f), true);

  const info = getLockInfo(f);
  assert.ok(info, 'lock info should exist');
  assert.strictEqual(info.pid, process.pid);
  assert.ok(Date.now() - info.startedAt < 2000, 'startedAt should be recent');

  mgr.release(f);
  assert.strictEqual(getLockInfo(f), null);
  mgr.destroy();
});

test('two managers, second cannot steal active lock', () => {
  const mgr1 = new LockManager();
  const mgr2 = new LockManager();
  const f = tmp('steal');

  mgr1.acquire(f);
  const ok = mgr2.acquire(f);
  assert.strictEqual(ok, false);

  mgr1.destroy();
  mgr2.destroy();
});

test('after release, another manager can acquire', () => {
  const mgr1 = new LockManager();
  const f = tmp('reacquire');

  mgr1.acquire(f);
  mgr1.release(f);
  mgr1.destroy();

  const mgr2 = new LockManager();
  const ok = mgr2.acquire(f);
  assert.strictEqual(ok, true);
  mgr2.destroy();
});

test('multiple files managed independently', () => {
  const mgr = new LockManager();
  const files = [tmp('m1'), tmp('m2'), tmp('m3')];

  files.forEach(f => assert.strictEqual(mgr.acquire(f), true));
  files.forEach(f => assert.strictEqual(mgr.hasLock(f), true));

  mgr.releaseAll();
  files.forEach(f => {
    assert.strictEqual(mgr.hasLock(f), false);
    assert.strictEqual(fs.existsSync(getLockPath(f)), false);
  });
  mgr.destroy();
});
