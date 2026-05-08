// envExport.js — serialize current env snapshot to various formats

'use strict';

const fs = require('fs');

/**
 * Serialize env object to .env file format string
 * @param {Object} env
 * @returns {string}
 */
function toEnvFormat(env) {
  return Object.entries(env)
    .map(([k, v]) => {
      const needsQuotes = /\s|#|=/.test(v);
      const val = needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v;
      return `${k}=${val}`;
    })
    .join('\n') + '\n';
}

/**
 * Serialize env object to JSON format string
 * @param {Object} env
 * @param {boolean} pretty
 * @returns {string}
 */
function toJsonFormat(env, pretty = true) {
  return pretty ? JSON.stringify(env, null, 2) : JSON.stringify(env);
}

/**
 * Serialize env object to shell export statements
 * @param {Object} env
 * @returns {string}
 */
function toShellExports(env) {
  return Object.entries(env)
    .map(([k, v]) => `export ${k}="${v.replace(/"/g, '\\"')}"`)
    .join('\n') + '\n';
}

/**
 * Write env to a file in the given format
 * @param {Object} env
 * @param {string} dest  - destination file path
 * @param {'env'|'json'|'shell'} format
 */
function exportEnv(env, dest, format = 'env') {
  let content;
  if (format === 'json') {
    content = toJsonFormat(env);
  } else if (format === 'shell') {
    content = toShellExports(env);
  } else {
    content = toEnvFormat(env);
  }
  fs.writeFileSync(dest, content, 'utf8');
}

module.exports = { toEnvFormat, toJsonFormat, toShellExports, exportEnv };
