/**
 * Tracks runtime metrics for envwatch: restart counts, uptime, change events.
 */

const { timestamp } = require('./logger');

class Metrics {
  constructor() {
    this._startedAt = Date.now();
    this._restarts = 0;
    this._envChanges = 0;
    this._lastRestartAt = null;
    this._lastChangeAt = null;
    this._changeLog = [];
  }

  recordRestart() {
    this._restarts += 1;
    this._lastRestartAt = Date.now();
  }

  recordEnvChange(changedKeys = []) {
    this._envChanges += 1;
    this._lastChangeAt = Date.now();
    this._changeLog.push({
      at: this._lastChangeAt,
      keys: changedKeys,
    });
    // keep log bounded
    if (this._changeLog.length > 100) {
      this._changeLog.shift();
    }
  }

  uptimeMs() {
    return Date.now() - this._startedAt;
  }

  summary() {
    return {
      startedAt: new Date(this._startedAt).toISOString(),
      uptimeMs: this.uptimeMs(),
      restarts: this._restarts,
      envChanges: this._envChanges,
      lastRestartAt: this._lastRestartAt
        ? new Date(this._lastRestartAt).toISOString()
        : null,
      lastChangeAt: this._lastChangeAt
        ? new Date(this._lastChangeAt).toISOString()
        : null,
    };
  }

  recentChanges(limit = 10) {
    return this._changeLog.slice(-limit);
  }

  reset() {
    this._startedAt = Date.now();
    this._restarts = 0;
    this._envChanges = 0;
    this._lastRestartAt = null;
    this._lastChangeAt = null;
    this._changeLog = [];
  }
}

module.exports = { Metrics };
