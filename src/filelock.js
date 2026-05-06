/**
 * filelock.js — prevents duplicate envwatch processes from watching the same .env file
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCK_DIR = os.tmpdir();

function getLockPath(envFile) {
  const normalized = path.resolve(envFile).replace(/[\/\\:]/g, '_');
  return path.join(LOCK_DIR, `envwatch_${normalized}.lock`);
}

function readLock(lockPath) {
  try {
    const raw = fs.readFileSync(lockPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(envFile) {
  const lockPath = getLockPath(envFile);
  const existing = readLock(lockPath);

  if (existing && isProcessAlive(existing.pid)) {
    return { acquired: false, pid: existing.pid, lockPath };
  }

  const data = { pid: process.pid, envFile: path.resolve(envFile), startedAt: Date.now() };
  fs.writeFileSync(lockPath, JSON.stringify(data), 'utf8');
  return { acquired: true, pid: process.pid, lockPath };
}

function releaseLock(envFile) {
  const lockPath = getLockPath(envFile);
  try {
    const existing = readLock(lockPath);
    if (existing && existing.pid === process.pid) {
      fs.unlinkSync(lockPath);
      return true;
    }
  } catch {
    // already gone
  }
  return false;
}

function getLockInfo(envFile) {
  const lockPath = getLockPath(envFile);
  return readLock(lockPath);
}

module.exports = { acquireLock, releaseLock, getLockInfo, getLockPath };
