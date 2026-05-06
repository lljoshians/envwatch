'use strict';

const assert = require('assert');
const { Metrics } = require('./metrics');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('metrics tests');

test('starts with zero counts', () => {
  const m = new Metrics();
  const s = m.summary();
  assert.strictEqual(s.restarts, 0);
  assert.strictEqual(s.envChanges, 0);
  assert.strictEqual(s.lastRestartAt, null);
  assert.strictEqual(s.lastChangeAt, null);
});

test('recordRestart increments restarts', () => {
  const m = new Metrics();
  m.recordRestart();
  m.recordRestart();
  assert.strictEqual(m.summary().restarts, 2);
});

test('recordEnvChange increments envChanges and logs keys', () => {
  const m = new Metrics();
  m.recordEnvChange(['DB_URL', 'PORT']);
  m.recordEnvChange(['SECRET']);
  assert.strictEqual(m.summary().envChanges, 2);
  const recent = m.recentChanges();
  assert.strictEqual(recent.length, 2);
  assert.deepStrictEqual(recent[0].keys, ['DB_URL', 'PORT']);
});

test('recentChanges respects limit', () => {
  const m = new Metrics();
  for (let i = 0; i < 15; i++) m.recordEnvChange([`KEY_${i}`]);
  assert.strictEqual(m.recentChanges(5).length, 5);
  assert.strictEqual(m.recentChanges(20).length, 15);
});

test('change log is capped at 100 entries', () => {
  const m = new Metrics();
  for (let i = 0; i < 110; i++) m.recordEnvChange([`K${i}`]);
  assert.strictEqual(m.recentChanges(200).length, 100);
});

test('uptimeMs is non-negative and grows', () => {
  const m = new Metrics();
  const t1 = m.uptimeMs();
  const t2 = m.uptimeMs();
  assert.ok(t1 >= 0);
  assert.ok(t2 >= t1);
});

test('reset clears all state', () => {
  const m = new Metrics();
  m.recordRestart();
  m.recordEnvChange(['A']);
  m.reset();
  const s = m.summary();
  assert.strictEqual(s.restarts, 0);
  assert.strictEqual(s.envChanges, 0);
  assert.strictEqual(m.recentChanges().length, 0);
});

test('summary contains startedAt as ISO string', () => {
  const m = new Metrics();
  const s = m.summary();
  assert.ok(typeof s.startedAt === 'string');
  assert.ok(!isNaN(Date.parse(s.startedAt)));
});
