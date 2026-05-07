// historyMiddleware.js — wires EnvHistory into the watcher lifecycle

const { createEnvHistory } = require('./envHistory');

/**
 * Attaches history tracking to a watcher instance.
 * Records each snapshot on 'changed' events and exposes history on the watcher.
 *
 * @param {EventEmitter} watcher  - an EnvWatcher instance
 * @param {object}       [opts]
 * @param {number}       [opts.maxEntries=20]
 * @param {boolean}      [opts.trackInitial=true]  record snapshot on 'ready'
 * @returns {{ history, detach }}
 */
function attachHistory(watcher, opts = {}) {
  const { maxEntries = 20, trackInitial = true } = opts;
  const history = createEnvHistory(maxEntries);

  function onReady(snapshot) {
    history.push(snapshot, 'initial');
  }

  function onChanged({ current }) {
    history.push(current);
  }

  if (trackInitial) {
    watcher.once('ready', onReady);
  }
  watcher.on('changed', onChanged);

  // expose on the watcher for convenience
  watcher.history = history;

  function detach() {
    watcher.removeListener('ready', onReady);
    watcher.removeListener('changed', onChanged);
    delete watcher.history;
  }

  return { history, detach };
}

module.exports = { attachHistory };
