/**
 * cacheMiddleware.js — Attaches an EnvCache to a watcher so parsed
 * env values are served from cache between file-change events.
 */

const { createEnvCache } = require('./envCache');

function attachCache(watcher, options = {}) {
  const { ttlMs = 5000, cacheKey = 'default' } = options;
  const cache = createEnvCache(ttlMs);

  function onReady(env) {
    cache.set(cacheKey, env);
  }

  function onChanged({ current }) {
    cache.invalidate(cacheKey);
    cache.set(cacheKey, current);
  }

  watcher.on('ready', onReady);
  watcher.on('changed', onChanged);

  function getCached() {
    return cache.get(cacheKey);
  }

  function detach() {
    watcher.off('ready', onReady);
    watcher.off('changed', onChanged);
    cache.invalidate();
  }

  return { cache, getCached, detach };
}

module.exports = { attachCache };
