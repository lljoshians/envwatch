// aliasMiddleware.js — attaches alias expansion to an EnvWatcher instance
// Intercepts 'changed' events and emits an enriched version with alias keys

'use strict';

const { createEnvAlias } = require('./envAlias');

/**
 * Attach alias expansion middleware to a watcher.
 *
 * @param {EventEmitter} watcher  - instance of EnvWatcher
 * @param {Record<string, string[]>} aliasMap
 * @returns {{ detach }}
 */
function attachAlias(watcher, aliasMap = {}) {
  const alias = createEnvAlias(aliasMap);

  function onChanged(current, previous) {
    const expandedCurrent = alias.expand(current);
    const expandedPrevious = alias.expand(previous);
    watcher.emit('changed:expanded', expandedCurrent, expandedPrevious);
  }

  watcher.on('changed', onChanged);

  function detach() {
    watcher.off('changed', onChanged);
  }

  return { detach, alias };
}

module.exports = { attachAlias };
