/**
 * Tests for SignalHandler
 */

const assert = require('assert');
const EventEmitter = require('events');
const { SignalHandler, FORWARDABLE_SIGNALS } = require('./signal');

function makeMockRestarter(shouldFail = false) {
  const r = new EventEmitter();
  r.stopCalled = false;
  r.stop = () => {
    r.stopCalled = true;
    return shouldFail ? Promise.reject(new Error('stop failed')) : Promise.resolve();
  };
  return r;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\nsignal.js tests');

  await test('FORWARDABLE_SIGNALS includes SIGTERM and SIGINT', () => {
    assert.ok(FORWARDABLE_SIGNALS.includes('SIGTERM'));
    assert.ok(FORWARDABLE_SIGNALS.includes('SIGINT'));
  });

  await test('bind() registers listeners on process', () => {
    const restarter = makeMockRestarter();
    const handler = new SignalHandler(restarter);
    const before = process.listenerCount('SIGTERM');
    handler.bind();
    assert.strictEqual(process.listenerCount('SIGTERM'), before + 1);
    handler.unbind();
  });

  await test('bind() is idempotent', () => {
    const restarter = makeMockRestarter();
    const handler = new SignalHandler(restarter);
    const before = process.listenerCount('SIGTERM');
    handler.bind();
    handler.bind();
    assert.strictEqual(process.listenerCount('SIGTERM'), before + 1);
    handler.unbind();
  });

  await test('unbind() removes listeners from process', () => {
    const restarter = makeMockRestarter();
    const handler = new SignalHandler(restarter);
    const before = process.listenerCount('SIGTERM');
    handler.bind();
    handler.unbind();
    assert.strictEqual(process.listenerCount('SIGTERM'), before);
  });

  await test('unbind() before bind() does not throw', () => {
    const restarter = makeMockRestarter();
    const handler = new SignalHandler(restarter);
    assert.doesNotThrow(() => handler.unbind());
  });

  await test('_onSignal calls restarter.stop()', async () => {
    const restarter = makeMockRestarter();
    const handler = new SignalHandler(restarter);
    // Patch process.exit to avoid killing test runner
    const origExit = process.exit;
    process.exit = () => {};
    handler._onSignal('SIGTERM');
    await sleep(20);
    assert.strictEqual(restarter.stopCalled, true);
    process.exit = origExit;
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
