// envAlias.js — maps canonical env var names to one or more aliases
// e.g. DATABASE_URL might also be read as DB_URL

'use strict';

/**
 * @param {Record<string, string[]>} aliasMap  { CANONICAL: ['ALIAS1', 'ALIAS2'] }
 * @returns {{ resolve, expand, listAliases }}
 */
function createEnvAlias(aliasMap = {}) {
  // Build reverse map: alias -> canonical
  const reverseMap = {};
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    for (const alias of aliases) {
      reverseMap[alias] = canonical;
    }
  }

  /**
   * Resolve a key (possibly an alias) to its canonical name.
   * Returns the key itself if no mapping found.
   */
  function resolve(key) {
    return reverseMap[key] || key;
  }

  /**
   * Given an env object, expand it so all aliases also carry
   * the value of their canonical key (if not already set).
   */
  function expand(env) {
    const result = Object.assign({}, env);
    for (const [canonical, aliases] of Object.entries(aliasMap)) {
      if (canonical in result) {
        for (const alias of aliases) {
          if (!(alias in result)) {
            result[alias] = result[canonical];
          }
        }
      }
    }
    return result;
  }

  /**
   * Return all aliases for a given canonical key.
   */
  function listAliases(canonical) {
    return aliasMap[canonical] ? [...aliasMap[canonical]] : [];
  }

  return { resolve, expand, listAliases };
}

module.exports = { createEnvAlias };
