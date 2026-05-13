/**
 * envMerge.js — Merge multiple env sources with priority ordering.
 * Later sources override earlier ones. Tracks origin of each key.
 */

'use strict';

/**
 * Merge an ordered array of env objects into one.
 * Sources later in the array take precedence.
 * @param {Object[]} sources - array of plain key/value env objects
 * @returns {{ merged: Object, origins: Object }}
 */
function mergeEnvs(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return { merged: {}, origins: {} };
  }

  const merged = {};
  const origins = {};

  sources.forEach((source, idx) => {
    if (!source || typeof source !== 'object') return;
    for (const [key, value] of Object.entries(source)) {
      merged[key] = value;
      origins[key] = idx;
    }
  });

  return { merged, origins };
}

/**
 * Merge envs with named sources for better traceability.
 * @param {Array<{ name: string, env: Object }>} namedSources
 * @returns {{ merged: Object, origins: Object }} origins maps key -> source name
 */
function mergeNamedEnvs(namedSources) {
  if (!Array.isArray(namedSources) || namedSources.length === 0) {
    return { merged: {}, origins: {} };
  }

  const merged = {};
  const origins = {};

  for (const { name, env } of namedSources) {
    if (!env || typeof env !== 'object') continue;
    for (const [key, value] of Object.entries(env)) {
      merged[key] = value;
      origins[key] = name;
    }
  }

  return { merged, origins };
}

/**
 * Return keys that differ between two merged results.
 * Useful for detecting which keys changed source after a re-merge.
 */
function changedOrigins(prevOrigins, nextOrigins) {
  const keys = new Set([...Object.keys(prevOrigins), ...Object.keys(nextOrigins)]);
  const changed = [];
  for (const key of keys) {
    if (prevOrigins[key] !== nextOrigins[key]) changed.push(key);
  }
  return changed;
}

module.exports = { mergeEnvs, mergeNamedEnvs, changedOrigins };
