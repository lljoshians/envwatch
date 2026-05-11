/**
 * envCache.js — Simple in-memory cache for parsed env snapshots
 * with TTL support and hit/miss tracking.
 */

function now() {
  return Date.now();
}

function createEnvCache(ttlMs = 5000) {
  const store = new Map();
  let hits = 0;
  let misses = 0;

  function set(key, value) {
    store.set(key, { value, expiresAt: now() + ttlMs });
  }

  function get(key) {
    const entry = store.get(key);
    if (!entry) {
      misses++;
      return undefined;
    }
    if (now() > entry.expiresAt) {
      store.delete(key);
      misses++;
      return undefined;
    }
    hits++;
    return entry.value;
  }

  function has(key) {
    return get(key) !== undefined;
  }

  function invalidate(key) {
    if (key === undefined) {
      store.clear();
    } else {
      store.delete(key);
    }
  }

  function stats() {
    return { hits, misses, size: store.size };
  }

  function keys() {
    const valid = [];
    for (const [k, entry] of store) {
      if (now() <= entry.expiresAt) valid.push(k);
    }
    return valid;
  }

  return { set, get, has, invalidate, stats, keys };
}

module.exports = { createEnvCache };
