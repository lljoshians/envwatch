/**
 * envFilter.js
 * Filter env variable changes by pattern/prefix before triggering restarts.
 */

'use strict';

/**
 * Compile a list of patterns (strings or RegExps) into matchers.
 * @param {Array<string|RegExp>} patterns
 * @returns {Array<RegExp>}
 */
function compilePatterns(patterns) {
  return patterns.map(p => {
    if (p instanceof RegExp) return p;
    // Treat plain strings as prefix globs: "DB_" matches "DB_HOST", etc.
    const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}`);
  });
}

/**
 * Return true if key matches at least one compiled pattern.
 * @param {string} key
 * @param {Array<RegExp>} compiled
 * @returns {boolean}
 */
function matchesAny(key, compiled) {
  return compiled.some(re => re.test(key));
}

/**
 * Create an env filter.
 * @param {object} opts
 * @param {Array<string|RegExp>} [opts.include]  Only allow these patterns (whitelist).
 * @param {Array<string|RegExp>} [opts.exclude]  Block these patterns (blacklist).
 * @returns {{ shouldRestart: (changedKeys: string[]) => boolean, filterKeys: (keys: string[]) => string[] }}
 */
function createEnvFilter(opts = {}) {
  const include = compilePatterns(opts.include || []);
  const exclude = compilePatterns(opts.exclude || []);

  function filterKeys(keys) {
    return keys.filter(key => {
      if (exclude.length && matchesAny(key, exclude)) return false;
      if (include.length && !matchesAny(key, include)) return false;
      return true;
    });
  }

  function shouldRestart(changedKeys) {
    return filterKeys(changedKeys).length > 0;
  }

  return { shouldRestart, filterKeys };
}

module.exports = { createEnvFilter, compilePatterns, matchesAny };
