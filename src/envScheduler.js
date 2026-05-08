/**
 * envScheduler.js
 * Schedule .env reloads at specific times or intervals.
 */

'use strict';

const { EventEmitter } = require('events');

function parseCronLike(expr) {
  // Supports simple interval strings: '30s', '5m', '1h'
  const match = expr.match(/^(\d+)(s|m|h)$/);
  if (!match) throw new Error(`Invalid schedule expression: '${expr}'`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000 };
  return value * multipliers[unit];
}

class EnvScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this._interval = null;
    this._intervalMs = null;
    this._paused = false;
    this._fireCount = 0;
    this._maxFires = options.maxFires || Infinity;
  }

  start(expr) {
    if (this._interval) this.stop();
    this._intervalMs = typeof expr === 'number' ? expr : parseCronLike(expr);
    this._schedule();
    this.emit('started', { intervalMs: this._intervalMs });
    return this;
  }

  _schedule() {
    this._interval = setInterval(() => {
      if (this._paused) return;
      this._fireCount++;
      this.emit('tick', { count: this._fireCount, at: new Date() });
      if (this._fireCount >= this._maxFires) this.stop();
    }, this._intervalMs);
    if (this._interval.unref) this._interval.unref();
  }

  pause() {
    this._paused = true;
    this.emit('paused');
    return this;
  }

  resume() {
    this._paused = false;
    this.emit('resumed');
    return this;
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this.emit('stopped', { totalFires: this._fireCount });
    return this;
  }

  get fireCount() { return this._fireCount; }
  get running() { return this._interval !== null; }
  get paused() { return this._paused; }
}

function createEnvScheduler(options) {
  return new EnvScheduler(options);
}

module.exports = { EnvScheduler, createEnvScheduler, parseCronLike };
