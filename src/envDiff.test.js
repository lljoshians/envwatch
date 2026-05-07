'use strict';

const assert = require('assert');
const { computeDiff, hasDiff, affectedKeys } = require('./envDiff');

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

console.log('\nenvDiff tests');

test('computeDiff detects added keys', () => {
  const prev = { A: '1' };
  const next = { A: '1', B: '2' };
  const diff = computeDiff(prev, next);
  assert.deepStrictEqual(diff.added, ['B']);
  assert.deepStrictEqual(diff.removed, []);
  assert.deepStrictEqual(diff.changed, []);
});

test('computeDiff detects removed keys', () => {
  const prev = { A: '1', B: '2' };
  const next = { A: '1' };
  const diff = computeDiff(prev, next);
  assert.deepStrictEqual(diff.added, []);
  assert.deepStrictEqual(diff.removed, ['B']);
  assert.deepStrictEqual(diff.changed, []);
});

test('computeDiff detects changed values', () => {
  const prev = { A: '1', B: 'old' };
  const next = { A: '1', B: 'new' };
  const diff = computeDiff(prev, next);
  assert.deepStrictEqual(diff.added, []);
  assert.deepStrictEqual(diff.removed, []);
  assert.deepStrictEqual(diff.changed, [{ key: 'B', from: 'old', to: 'new' }]);
});

test('computeDiff handles empty objects', () => {
  const diff = computeDiff({}, {});
  assert.deepStrictEqual(diff, { added: [], removed: [], changed: [] });
});

test('computeDiff handles identical objects', () => {
  const env = { A: '1', B: '2' };
  const diff = computeDiff(env, { ...env });
  assert.deepStrictEqual(diff, { added: [], removed: [], changed: [] });
});

test('hasDiff returns true when keys added', () => {
  assert.strictEqual(hasDiff({}, { X: '1' }), true);
});

test('hasDiff returns false for identical envs', () => {
  assert.strictEqual(hasDiff({ A: '1' }, { A: '1' }), false);
});

test('affectedKeys returns all changed keys flat', () => {
  const diff = { added: ['C'], removed: ['D'], changed: [{ key: 'E', from: 'x', to: 'y' }] };
  const keys = affectedKeys(diff);
  assert.deepStrictEqual(keys.sort(), ['C', 'D', 'E']);
});

test('affectedKeys returns empty array for empty diff', () => {
  const diff = { added: [], removed: [], changed: [] };
  assert.deepStrictEqual(affectedKeys(diff), []);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
