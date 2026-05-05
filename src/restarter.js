const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class ProcessRestarter extends EventEmitter {
  constructor(command, args = [], options = {}) {
    super();
    this.command = command;
    this.args = args;
    this.options = options;
    this.process = null;
    this.restartDelay = options.restartDelay || 500;
    this.restarting = false;
  }

  start() {
    if (this.process) {
      return;
    }
    this._spawn();
  }

  _spawn() {
    this.process = spawn(this.command, this.args, {
      stdio: 'inherit',
      env: process.env,
      ...this.options.spawnOptions,
    });

    this.emit('start', this.process.pid);

    this.process.on('exit', (code, signal) => {
      this.process = null;
      if (!this.restarting) {
        this.emit('exit', code, signal);
      }
    });

    this.process.on('error', (err) => {
      this.emit('error', err);
    });
  }

  async restart() {
    if (this.restarting) {
      return;
    }
    this.restarting = true;
    this.emit('restarting');

    await this.stop();

    await new Promise((resolve) => setTimeout(resolve, this.restartDelay));

    this._spawn();
    this.restarting = false;
    this.emit('restarted', this.process.pid);
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }
      this.process.once('exit', resolve);
      this.process.kill('SIGTERM');
    });
  }

  isRunning() {
    return this.process !== null;
  }
}

module.exports = { ProcessRestarter };
