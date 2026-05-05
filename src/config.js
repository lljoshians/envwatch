/**
 * Configuration loader and validator for envwatch
 */

const path = require('path');

const DEFAULTS = {
  envPath: '.env',
  restartDelay: 500,
  watchInterval: 200,
  maxRestarts: 10,
  restartWindow: 60000,
  signal: 'SIGTERM',
  verbose: false,
};

const VALID_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGKILL'];

/**
 * Validates and normalizes user-provided config options
 * @param {object} userConfig
 * @returns {object} merged and validated config
 */
function loadConfig(userConfig = {}) {
  const config = { ...DEFAULTS, ...userConfig };

  if (typeof config.envPath !== 'string' || config.envPath.trim() === '') {
    throw new Error('envPath must be a non-empty string');
  }
  config.envPath = path.resolve(config.envPath);

  if (typeof config.restartDelay !== 'number' || config.restartDelay < 0) {
    throw new Error('restartDelay must be a non-negative number');
  }

  if (typeof config.watchInterval !== 'number' || config.watchInterval < 50) {
    throw new Error('watchInterval must be a number >= 50ms');
  }

  if (typeof config.maxRestarts !== 'number' || config.maxRestarts < 1) {
    throw new Error('maxRestarts must be a positive number');
  }

  if (!VALID_SIGNALS.includes(config.signal)) {
    throw new Error(`signal must be one of: ${VALID_SIGNALS.join(', ')}`);
  }

  config.verbose = Boolean(config.verbose);

  return config;
}

module.exports = { loadConfig, DEFAULTS, VALID_SIGNALS };
