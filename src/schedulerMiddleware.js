/**
 * schedulerMiddleware.js
 * Attaches an EnvScheduler to a watcher, triggering forced re-reads on tick.
 */

'use strict';

const { createEnvScheduler } = require('./envScheduler');

function attachScheduler(watcher, expr, options = {}) {
  const scheduler = createEnvScheduler(options);

  function onTick({ count, at }) {
    if (watcher.listenerCount('scheduleReload') > 0) {
      watcher.emit('scheduleReload', { count, at });
    } else if (typeof watcher.reload === 'function') {
      watcher.reload();
    }
  }

  scheduler.on('tick', onTick);
  scheduler.start(expr);

  function detach() {
    scheduler.stop();
    scheduler.off('tick', onTick);
  }

  // Automatically stop when watcher closes
  watcher.once('close', detach);

  return {
    scheduler,
    detach,
    pause: () => scheduler.pause(),
    resume: () => scheduler.resume(),
  };
}

module.exports = { attachScheduler };
