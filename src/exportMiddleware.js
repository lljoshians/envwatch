'use strict';

const path = require('path');
const { exportEnv } = require('./envExport');

/**
 * Middleware that auto-exports the current env to a file whenever it changes.
 *
 * @param {EnvWatcher} watcher
 * @param {string} dest       - output file path
 * @param {'env'|'json'|'shell'} format
 * @returns {{ detach: Function }}
 */
function attachExport(watcher, dest, format = 'env') {
  if (!dest) throw new Error('exportMiddleware: dest path is required');

  const resolvedDest = path.resolve(dest);

  function onReady(env) {
    try {
      exportEnv(env, resolvedDest, format);
    } catch (err) {
      watcher.emit('export:error', err);
    }
  }

  function onChanged({ current }) {
    try {
      exportEnv(current, resolvedDest, format);
      watcher.emit('export:written', { dest: resolvedDest, format });
    } catch (err) {
      watcher.emit('export:error', err);
    }
  }

  watcher.on('ready', onReady);
  watcher.on('changed', onChanged);

  function detach() {
    watcher.off('ready', onReady);
    watcher.off('changed', onChanged);
  }

  return { detach };
}

module.exports = { attachExport };
