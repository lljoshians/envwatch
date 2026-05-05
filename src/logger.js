/**
 * Simple logger for envwatch — respects verbose flag
 */

const LEVELS = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };

function timestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message) {
  return `[envwatch] ${timestamp()} ${LEVELS[level] || 'INFO'} ${message}`;
}

class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    console.log(formatMessage('info', message));
  }

  warn(message) {
    console.warn(formatMessage('warn', message));
  }

  error(message, err) {
    const detail = err ? `: ${err.message}` : '';
    console.error(formatMessage('error', message + detail));
  }

  debug(message) {
    if (this.verbose) {
      console.log(formatMessage('debug', message));
    }
  }

  setVerbose(value) {
    this.verbose = Boolean(value);
  }
}

const defaultLogger = new Logger();

module.exports = { Logger, defaultLogger, formatMessage };
