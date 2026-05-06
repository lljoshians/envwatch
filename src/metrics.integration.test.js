'use strict';

/**
 * Integration: Metrics wires up with EnvWatcher and ProcessRestarter events.
 */

const assert = require('assert');
const { Metrics } = require('./metrics');
const { EventEmitter } = require('events');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function test(name, fn) {
  return fn().then(
    () => console.log(`  ✓ ${name}`),
    (err) => {
      console.error(`  ✗ ${name}: ${err.message}`);
      process.exitCode = 1;
    }
  );
}

console.log('metrics integration tests');

// Simulate watcher + restarter emitting events into Metrics

async function run() {
  await test('watcher change event updates envChanges', async () => {
    const watcher = new EventEmitter();
    const metrics = new Metrics();

    watcher.on('change', ({ changedKeys }) => {
      metrics.recordEnvChange(changedKeys);
    });

    watcher.emit('change', { changedKeys: ['DB_HOST', 'PORT'] });
    watcher.emit('change', { changedKeys: ['SECRET'] });

    assert.strictEqual(metrics.summary().envChanges, 2);
    assert.deepStrictEqual(metrics.recentChanges(1)[0].keys, ['SECRET']);
  });

  await test('restarter restart event updates restarts', async () => {
    const restarter = new EventEmitter();
    const metrics = new Metrics();

    restarter.on('restart', () => metrics.recordRestart());

    restarter.emit('restart');
    restarter.emit('restart');
    restarter.emit('restart');

    assert.strictEqual(metrics.summary().restarts, 3);
    assert.ok(metrics.summary().lastRestartAt !== null);
  });

  await test('combined flow records both metrics', async () => {
    const watcher = new EventEmitter();
    const restarter = new EventEmitter();
    const metrics = new Metrics();

    watcher.on('change', ({ changedKeys }) => metrics.recordEnvChange(changedKeys));
    restarter.on('restart', () => metrics.recordRestart());

    watcher.emit('change', { changedKeys: ['API_KEY'] });
    restarter.emit('restart');
    watcher.emit('change', { changedKeys: ['TIMEOUT'] });
    restarter.emit('restart');

    const s = metrics.summary();
    assert.strictEqual(s.envChanges, 2);
    assert.strictEqual(s.restarts, 2);
  });
}

run();
