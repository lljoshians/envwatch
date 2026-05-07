// envGrouping.js — group env vars by prefix for structured access

'use strict';

/**
 * Split a key into [prefix, rest] by the first separator.
 * e.g. "DB_HOST" -> ["DB", "HOST"]  (sep = "_")
 */
function splitKey(key, sep = '_') {
  const idx = key.indexOf(sep);
  if (idx === -1) return [null, key];
  return [key.slice(0, idx), key.slice(idx + sep.length)];
}

/**
 * Group a flat env object into nested groups by prefix.
 *
 * Example:
 *   { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'myapp', PORT: '3000' }
 *   ->
 *   { DB: { HOST: 'localhost', PORT: '5432' }, APP: { NAME: 'myapp' }, _ungrouped: { PORT: '3000' } }
 */
function groupEnv(env, sep = '_') {
  const groups = {};

  for (const [key, value] of Object.entries(env)) {
    const [prefix, rest] = splitKey(key, sep);
    if (!prefix) {
      groups._ungrouped = groups._ungrouped || {};
      groups._ungrouped[rest] = value;
    } else {
      groups[prefix] = groups[prefix] || {};
      groups[prefix][rest] = value;
    }
  }

  return groups;
}

/**
 * Return all keys belonging to a specific prefix group.
 */
function keysForGroup(env, prefix, sep = '_') {
  return Object.keys(env).filter(k => k.startsWith(prefix + sep));
}

/**
 * Flatten a grouped env back to a flat object.
 */
function flattenGroups(groups, sep = '_') {
  const flat = {};
  for (const [prefix, members] of Object.entries(groups)) {
    if (prefix === '_ungrouped') {
      Object.assign(flat, members);
    } else {
      for (const [rest, value] of Object.entries(members)) {
        flat[`${prefix}${sep}${rest}`] = value;
      }
    }
  }
  return flat;
}

module.exports = { splitKey, groupEnv, keysForGroup, flattenGroups };
