// validationMiddleware.js — wires EnvWatcher to envValidator, emits warnings on invalid changes

'use strict';

const { createValidator } = require('./envValidator');
const { Logger } = require('./logger');

/**
 * Attach validation logic to an EnvWatcher instance.
 * Listens for 'change' events and validates the new env snapshot.
 *
 * @param {import('./watcher').EnvWatcher} watcher
 * @param {import('./envValidator').ValidationRule[]} rules
 * @param {object} [opts]
 * @param {boolean} [opts.blockRestart=false] - emit 'validationFailed' to signal restart should be skipped
 * @returns {{ detach: () => void }}
 */
function attachValidation(watcher, rules, opts = {}) {
  const { blockRestart = false } = opts;
  const validate = createValidator(rules);
  const logger = new Logger({ prefix: 'validator' });

  function onChanged(changedKeys, newEnv) {
    const result = validate(newEnv);

    if (result.valid) {
      logger.info('Env validation passed.');
      return;
    }

    for (const err of result.errors) {
      logger.warn(err);
    }

    if (blockRestart) {
      watcher.emit('validationFailed', result.errors);
    }
  }

  watcher.on('changed', onChanged);

  return {
    detach() {
      watcher.off('changed', onChanged);
    },
  };
}

module.exports = { attachValidation };
