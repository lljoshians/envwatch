'use strict';

const assert = require('assert');
const { validateEnv, createValidator } = require('./envValidator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\nenvValidator tests');

test('valid env passes all rules', () => {
  const env = { PORT: '3000', NODE_ENV: 'development' };
  const rules = [{ key: 'PORT', required: true }, { key: 'NODE_ENV', required: true }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
});

test('missing required key produces error', () => {
  const env = { PORT: '3000' };
  const rules = [{ key: 'SECRET', required: true }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors[0].includes('SECRET'));
});

test('empty string counts as missing when required', () => {
  const env = { SECRET: '' };
  const rules = [{ key: 'SECRET', required: true }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, false);
});

test('pattern mismatch produces error', () => {
  const env = { PORT: 'abc' };
  const rules = [{ key: 'PORT', pattern: /^\d+$/ }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors[0].includes('PORT'));
});

test('pattern match passes', () => {
  const env = { PORT: '8080' };
  const rules = [{ key: 'PORT', pattern: /^\d+$/ }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, true);
});

test('custom validate function failure', () => {
  const env = { LEVEL: '99' };
  const rules = [{ key: 'LEVEL', validate: (v) => Number(v) <= 10 }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, false);
});

test('optional missing key is skipped', () => {
  const env = {};
  const rules = [{ key: 'OPTIONAL_FLAG', pattern: /^(true|false)$/ }];
  const result = validateEnv(env, rules);
  assert.strictEqual(result.valid, true);
});

test('createValidator returns reusable function', () => {
  const validate = createValidator([{ key: 'DB_URL', required: true }]);
  assert.strictEqual(validate({ DB_URL: 'postgres://localhost/db' }).valid, true);
  assert.strictEqual(validate({}).valid, false);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
