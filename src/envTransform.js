// envTransform.js — apply transform functions to env values before use

'use strict';

/**
 * Built-in transforms
 */
const builtins = {
  trim: (v) => v.trim(),
  uppercase: (v) => v.toUpperCase(),
  lowercase: (v) => v.toLowerCase(),
  int: (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) throw new Error(`Cannot convert "${v}" to int`);
    return n;
  },
  float: (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) throw new Error(`Cannot convert "${v}" to float`);
    return n;
  },
  bool: (v) => {
    const lower = v.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
    throw new Error(`Cannot convert "${v}" to bool`);
  },
  json: (v) => {
    try { return JSON.parse(v); }
    catch (e) { throw new Error(`Cannot parse "${v}" as JSON: ${e.message}`); }
  },
};

/**
 * Create a transform registry.
 * @param {Record<string, Function>} [custom] - extra named transforms
 */
function createEnvTransform(custom = {}) {
  const registry = { ...builtins, ...custom };

  // key -> array of transform names or functions
  const rules = {};

  function addRule(key, ...transforms) {
    rules[key] = (rules[key] || []).concat(transforms);
  }

  function applyTo(key, value) {
    const pipeline = rules[key] || [];
    return pipeline.reduce((v, t) => {
      if (typeof t === 'function') return t(v);
      if (typeof t === 'string') {
        if (!registry[t]) throw new Error(`Unknown transform: "${t}"`);
        return registry[t](v);
      }
      throw new Error(`Invalid transform entry for key "${key}"`);
    }, value);
  }

  function transformAll(env) {
    const out = { ...env };
    for (const key of Object.keys(rules)) {
      if (Object.prototype.hasOwnProperty.call(out, key)) {
        out[key] = applyTo(key, out[key]);
      }
    }
    return out;
  }

  function register(name, fn) {
    if (typeof fn !== 'function') throw new Error('Transform must be a function');
    registry[name] = fn;
  }

  return { addRule, applyTo, transformAll, register, rules, registry };
}

module.exports = { createEnvTransform, builtins };
