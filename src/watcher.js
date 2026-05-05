const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class EnvWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.envPath = options.envPath || path.resolve(process.cwd(), '.env');
    this.pollInterval = options.pollInterval || 500;
    this._watcher = null;
    this._lastMtime = null;
    this._lastSize = null;
  }

  start() {
    if (this._watcher) {
      return this;
    }

    if (!fs.existsSync(this.envPath)) {
      this.emit('error', new Error(`env file not found: ${this.envPath}`));
      return this;
    }

    const stat = fs.statSync(this.envPath);
    this._lastMtime = stat.mtimeMs;
    this._lastSize = stat.size;

    this._watcher = fs.watch(this.envPath, { persistent: false }, (eventType) => {
      if (eventType === 'change') {
        this._handleChange();
      }
    });

    this._watcher.on('error', (err) => this.emit('error', err));
    this.emit('ready', { path: this.envPath });
    return this;
  }

  _handleChange() {
    try {
      const stat = fs.statSync(this.envPath);
      const mtimeChanged = stat.mtimeMs !== this._lastMtime;
      const sizeChanged = stat.size !== this._lastSize;

      if (mtimeChanged || sizeChanged) {
        this._lastMtime = stat.mtimeMs;
        this._lastSize = stat.size;
        this.emit('change', { path: this.envPath, mtime: stat.mtimeMs });
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  stop() {
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
      this.emit('stop');
    }
    return this;
  }
}

module.exports = EnvWatcher;
