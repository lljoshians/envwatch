'use strict';

const assert = require('assert');
const { createEnvFilter, compilePatterns, matchesAny } = require('./envFilter');

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

console.log('envFilter tests');

test('compilePatterns converts strings to RegExp', () => {
  const [re] = compilePatterns(['DB_']);
  assert.ok(re instanceof RegExp);
  assert.ok(re.test('DB_HOST'));
  assert.ok(!re.test('APP_KEY'));
});

test('compilePatterns keeps RegExp as-is', () => {
  const pattern = /^SECRET/;
  const [re] = compilePatterns([pattern]);
  assert.strictEqual(re, pattern);
});

test('compilePatterns supports wildcard glob', () => {
  const [re] = compilePatterns(['AWS_*_KEY']);
  assert.ok(re.test('AWS_ACCESS_KEY'));
  assert.ok(!re.test('AWS_HOST'));
});

test('matchesAny returns true when a pattern matches', () => {
  const compiled = compilePatterns(['DB_', 'REDIS_']);
  assert.ok(matchesAny('DB_HOST', compiled));
  assert.ok(matchesAny('REDIS_URL', compiled));
  assert.ok(!matchesAny('APP_PORT', compiled));
});

test('filterKeys with include only passes matching keys', () => {
  const filter = createEnvFilter({ include: ['DB_'] });
  const result = filter.filterKeys(['DB_HOST', 'DB_PASS', 'APP_KEY']);
  assert.deepStrictEqual(result, ['DB_HOST', 'DB_PASS']);
});

test('filterKeys with exclude blocks matching keys', () => {
  const filter = createEnvFilter({ exclude: ['SECRET_', 'PRIVATE_'] });
  const result = filter.filterKeys(['DB_HOST', 'SECRET_KEY', 'PRIVATE_TOKEN']);
  assert.deepStrictEqual(result, ['DB_HOST']);
});

test('filterKeys with both include and exclude applies both', () => {
  const filter = createEnvFilter({ include: ['DB_'], exclude: ['DB_PASS'] });
  const result = filter.filterKeys(['DB_HOST', 'DB_PASS', 'APP_KEY']);
  assert.deepStrictEqual(result, ['DB_HOST']);
});

test('shouldRestart returns true when relevant keys changed', () => {
  const filter = createEnvFilter({ include: ['DB_'] });
  assert.ok(filter.shouldRestart(['DB_HOST']));
});

test('shouldRestart returns false when no relevant keys changed', () => {
  const filter = createEnvFilter({ include: ['DB_'] });
  assert.ok(!filter.shouldRestart(['APP_PORT', 'LOG_LEVEL']));
});

test('no include/exclude passes all keys', () => {
  const filter = createEnvFilter();
  const keys = ['A', 'B', 'C'];
  assert.deepStrictEqual(filter.filterKeys(keys), keys);
  assert.ok(filter.shouldRestart(keys));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
