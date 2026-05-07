'use strict';

// groupingMiddleware.js — attach env grouping to a watcher instance
// Adds watcher.getGroup(prefix) and watcher.getGroups() after env is ready.

const { groupEnv, keysForGroup } = require('./envGrouping');

/**
 * Attach grouping helpers to an EnvWatcher instance.
 *
 * @param {EventEmitter} watcher  - EnvWatcher instance
 * @param {object}       options
 * @param {string}       [options.sep='_']  key separator
 * @returns {{ getGroup, getGroups, affectedGroups, detach }}
 */
function attachGrouping(watcher, options = {}) {
  const sep = options.sep || '_';
  let currentEnv = {};

  function onReady(env) {
    currentEnv = env || {};
  }

  function onChanged({ current }) {
    currentEnv = current || {};
  }

  watcher.on('ready', onReady);
  watcher.on('changed', onChanged);

  /**
   * Return all keys and values for a given prefix group.
   * e.g. getGroup('DB') -> { HOST: 'localhost', PORT: '5432' }
   */
  function getGroup(prefix) {
    const groups = groupEnv(currentEnv, sep);
    return groups[prefix] || {};
  }

  /**
   * Return the full grouped structure.
   */
  function getGroups() {
    return groupEnv(currentEnv, sep);
  }

  /**
   * Given a set of changed keys, return which prefix groups were affected.
   */
  function affectedGroups(changedKeys) {
    const prefixes = new Set();
    for (const key of changedKeys) {
      const idx = key.indexOf(sep);
      prefixes.add(idx === -1 ? '_ungrouped' : key.slice(0, idx));
    }
    return [...prefixes];
  }

  function detach() {
    watcher.off('ready', onReady);
    watcher.off('changed', onChanged);
  }

  return { getGroup, getGroups, affectedGroups, detach };
}

module.exports = { attachGrouping };
