const assert = require('assert');
const { Logger, formatMessage } = require('./logger');

function runTests() {
  let passed = 0;
  let failed = 0;
  const logs = [];

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  // patch console to capture output
  function capture(fn) {
    const captured = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (msg) => captured.push(msg);
    fn();
    Object.assign(console, orig);
    return captured;
  }

  console.log('\nlogger tests\n');

  test('formatMessage includes level and text', () => {
    const msg = formatMessage('info', 'hello world');
    assert.ok(msg.includes('INFO'));
    assert.ok(msg.includes('hello world'));
    assert.ok(msg.includes('[envwatch]'));
  });

  test('formatMessage includes ISO timestamp', () => {
    const msg = formatMessage('warn', 'test');
    assert.match(msg, /\d{4}-\d{2}-\d{2}T/);
  });

  test('logger.info outputs a message', () => {
    const logger = new Logger();
    const out = capture(() => logger.info('server started'));
    assert.ok(out[0].includes('server started'));
    assert.ok(out[0].includes('INFO'));
  });

  test('logger.warn outputs a warning', () => {
    const logger = new Logger();
    const out = capture(() => logger.warn('something odd'));
    assert.ok(out[0].includes('WARN'));
  });

  test('logger.error appends error message when provided', () => {
    const logger = new Logger();
    const out = capture(() => logger.error('failed', new Error('oops')));
    assert.ok(out[0].includes('oops'));
    assert.ok(out[0].includes('ERROR'));
  });

  test('debug is silent when verbose=false', () => {
    const logger = new Logger(false);
    const out = capture(() => logger.debug('hidden'));
    assert.strictEqual(out.length, 0);
  });

  test('debug outputs when verbose=true', () => {
    const logger = new Logger(true);
    const out = capture(() => logger.debug('visible'));
    assert.ok(out[0].includes('visible'));
    assert.ok(out[0].includes('DEBUG'));
  });

  test('setVerbose toggles debug output', () => {
    const logger = new Logger(false);
    logger.setVerbose(true);
    const out = capture(() => logger.debug('now visible'));
    assert.ok(out[0].includes('now visible'));
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
