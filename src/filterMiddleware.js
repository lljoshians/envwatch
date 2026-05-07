/**
 * filterMiddleware.js
 * Attaches an EnvFilter to a watcher so only relevant key changes
 * trigger the 'restart' event.
 */

'use strict';

const { createEnvFilter } = require('./envFilter');

/**
 * Attach filter logic to a watcher instance.
 * Listens for 'changed' events and emits 'restart' only when
 * the changed keys pass the filter.
 *
 * @param {EventEmitter} watcher  - EnvWatcher instance
 * @param {object}       opts
 * @param {Array}        [opts.include]
 * @param {Array}        [opts.exclude]
 * @param {object}       [opts.logger]   - optional logger
 * @returns {{ detach: () => void }}
 */
function attachFilter(watcher, opts = {}) {
  const filter = createEnvFilter({
    include: opts.include,
    exclude: opts.exclude,
  });
  const log = opts.logger || null;

  function onChanged(diff) {
    const changedKeys = Object.keys(diff);
    const relevant = filter.filterKeys(changedKeys);

    if (log) {
      log.debug(`[filter] changed keys: [${changedKeys.join(', ')}]`);
      log.debug(`[filter] relevant keys: [${relevant.join(', ')}]`);
    }

    if (relevant.length === 0) {
      if (log) log.info('[filter] no relevant changes — restart suppressed');
      return;
    }

    const filteredDiff = {};
    for (const key of relevant) filteredDiff[key] = diff[key];

    watcher.emit('restart', filteredDiff);
  }

  watcher.on('changed', onChanged);

  function detach() {
    watcher.off('changed', onChanged);
  }

  return { detach };
}

module.exports = { attachFilter };
