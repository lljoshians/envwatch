'use strict';

const assert = require('assert');
const { Metrics } = require('./metrics');
const { fmtMs, formatSummaryJson } = require('./metricsReporter');

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

console.log('metricsReporter tests');

test('fmtMs formats milliseconds', () => {
  assert.strictEqual(fmtMs(500), '500ms');
});

test('fmtMs formats seconds', () => {
  assert.strictEqual(fmtMs(2500), '2.5s');
});

test('fmtMs formats minutes and seconds', () => {
  assert.strictEqual(fmtMs(90000), '1m 30s');
});

test('formatSummaryJson returns valid JSON', () => {
  const m = new Metrics();
  m.recordRestart();
  m.recordEnvChange(['PORT']);
  const json = formatSummaryJson(m);
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.restarts, 1);
  assert.strictEqual(parsed.envChanges, 1);
  assert.ok(typeof parsed.startedAt === 'string');
});

test('formatSummaryJson includes null fields when no events', () => {
  const m = new Metrics();
  const parsed = JSON.parse(formatSummaryJson(m));
  assert.strictEqual(parsed.lastRestartAt, null);
  assert.strictEqual(parsed.lastChangeAt, null);
});

test('fmtMs handles zero', () => {
  assert.strictEqual(fmtMs(0), '0ms');
});

test('fmtMs handles exactly 60 seconds', () => {
  assert.strictEqual(fmtMs(60000), '1m 0s');
});
