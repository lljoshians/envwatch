const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { acquireLock, releaseLock, getLockInfo, getLockPath } = require('./filelock');

const tmpEnv = path.join(os.tmpdir(), `test_envwatch_${process.pid}.env`);

function cleanup() {
  releaseLock(tmpEnv);
  try { fs.unlinkSync(tmpEnv); } catch {}
}

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

console.log('filelock tests');

test('acquireLock returns acquired=true for new lock', () => {
  cleanup();
  const result = acquireLock(tmpEnv);
  assert.strictEqual(result.acquired, true);
  assert.strictEqual(result.pid, process.pid);
  cleanup();
});

test('acquireLock writes lock file with correct data', () => {
  cleanup();
  acquireLock(tmpEnv);
  const info = getLockInfo(tmpEnv);
  assert.ok(info);
  assert.strictEqual(info.pid, process.pid);
  assert.ok(typeof info.startedAt === 'number');
  cleanup();
});

test('acquireLock returns acquired=false if same process holds lock', () => {
  cleanup();
  acquireLock(tmpEnv);
  const second = acquireLock(tmpEnv);
  // same process is alive, so it should fail
  assert.strictEqual(second.acquired, false);
  assert.strictEqual(second.pid, process.pid);
  cleanup();
});

test('releaseLock removes lock file', () => {
  cleanup();
  acquireLock(tmpEnv);
  const released = releaseLock(tmpEnv);
  assert.strictEqual(released, true);
  const lockPath = getLockPath(tmpEnv);
  assert.strictEqual(fs.existsSync(lockPath), false);
});

test('releaseLock returns false when no lock exists', () => {
  cleanup();
  const result = releaseLock(tmpEnv);
  assert.strictEqual(result, false);
});

test('getLockInfo returns null for missing lock', () => {
  cleanup();
  const info = getLockInfo(tmpEnv);
  assert.strictEqual(info, null);
});

test('acquireLock reclaims stale lock from dead pid', () => {
  cleanup();
  const lockPath = getLockPath(tmpEnv);
  // write a fake lock with a dead pid
  const fakePid = 999999999;
  fs.writeFileSync(lockPath, JSON.stringify({ pid: fakePid, envFile: tmpEnv, startedAt: 0 }));
  const result = acquireLock(tmpEnv);
  assert.strictEqual(result.acquired, true);
  cleanup();
});
