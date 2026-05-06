/**
 * Signal handler — manages graceful shutdown and process signal forwarding
 * to child processes managed by ProcessRestarter.
 */

const { Logger } = require('./logger');

const logger = new Logger('signal');

const FORWARDABLE_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];

class SignalHandler {
  constructor(restarter) {
    this.restarter = restarter;
    this._handlers = {};
    this._bound = false;
  }

  bind() {
    if (this._bound) return;

    FORWARDABLE_SIGNALS.forEach((sig) => {
      const handler = () => this._onSignal(sig);
      this._handlers[sig] = handler;
      process.on(sig, handler);
    });

    process.on('exit', () => this._onExit());

    this._bound = true;
    logger.debug('Signal handlers registered');
  }

  unbind() {
    if (!this._bound) return;

    FORWARDABLE_SIGNALS.forEach((sig) => {
      if (this._handlers[sig]) {
        process.removeListener(sig, this._handlers[sig]);
        delete this._handlers[sig];
      }
    });

    this._bound = false;
    logger.debug('Signal handlers removed');
  }

  _onSignal(sig) {
    logger.info(`Received ${sig}, shutting down...`);

    if (this.restarter && typeof this.restarter.stop === 'function') {
      this.restarter.stop().then(() => {
        process.exit(0);
      }).catch(() => {
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  }

  _onExit() {
    logger.debug('Process exiting, cleaning up');
    this.unbind();
  }
}

module.exports = { SignalHandler, FORWARDABLE_SIGNALS };
