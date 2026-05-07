// envValidator.js — validates required env keys after a change event

'use strict';

/**
 * @typedef {Object} ValidationRule
 * @property {string} key
 * @property {boolean} [required]
 * @property {RegExp} [pattern]
 * @property {(v: string) => boolean} [validate]
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * Validate a parsed env object against a set of rules.
 * @param {Record<string, string>} env
 * @param {ValidationRule[]} rules
 * @returns {ValidationResult}
 */
function validateEnv(env, rules) {
  const errors = [];

  for (const rule of rules) {
    const { key, required, pattern, validate } = rule;
    const value = env[key];

    if (required && (value === undefined || value === '')) {
      errors.push(`Missing required env var: ${key}`);
      continue;
    }

    if (value === undefined) continue;

    if (pattern && !pattern.test(value)) {
      errors.push(`Env var ${key} does not match pattern ${pattern}`);
    }

    if (validate && !validate(value)) {
      errors.push(`Env var ${key} failed custom validation`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a validator function bound to a fixed rule set.
 * @param {ValidationRule[]} rules
 * @returns {(env: Record<string, string>) => ValidationResult}
 */
function createValidator(rules) {
  return (env) => validateEnv(env, rules);
}

module.exports = { validateEnv, createValidator };
