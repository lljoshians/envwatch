/**
 * lockManager.js — manages lifecycle of file locks, auto-releases on process exit
 */

const { acquireLock, releaseLock } = require('./filelock');
const { Logger } = require('./logger');

class LockManager {
  constructor(options = {}) {
    this._locks = new Set();
    this._logger = options.logger || new Logger({ prefix: 'lock' });
    this._bound = this._onExit.bind(this);
    process.on('exit', this._bound);
    process.on('SIGINT', this._bound);
    process.on('SIGTERM', this._bound);
  }

  acquire(envFile) {
    const result = acquireLock(envFile);
    if (!result.acquired) {
      this._logger.warn(`Lock held by PID ${result.pid} for ${envFile}`);
      return false;
    }
    this._locks.add(envFile);
    this._logger.debug(`Acquired lock for ${envFile}`);
    return true;
  }

  release(envFile) {
    const released = releaseLock(envFile);
    if (released) {
      this._locks.delete(envFile);
      this._logger.debug(`Released lock for ${envFile}`);
    }
    return released;
  }

  releaseAll() {
    for (const f of this._locks) {
      this.release(f);
    }
  }

  hasLock(envFile) {
    return this._locks.has(envFile);
  }

  _onExit() {
    this.releaseAll();
  }

  destroy() {
    this.releaseAll();
    process.off('exit', this._bound);
    process.off('SIGINT', this._bound);
    process.off('SIGTERM', this._bound);
  }
}

module.exports = { LockManager };
