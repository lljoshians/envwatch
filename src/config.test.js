const assert = require('assert');
const path = require('path');
const { loadConfig, DEFAULTS, VALID_SIGNALS } = require('./config');

function runTests() {
  let passed = 0;
  let failed = 0;

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

  console.log('\nconfig tests\n');

  test('returns defaults when called with no args', () => {
    const config = loadConfig();
    assert.strictEqual(config.restartDelay, DEFAULTS.restartDelay);
    assert.strictEqual(config.watchInterval, DEFAULTS.watchInterval);
    assert.strictEqual(config.maxRestarts, DEFAULTS.maxRestarts);
    assert.strictEqual(config.signal, DEFAULTS.signal);
    assert.strictEqual(config.verbose, false);
  });

  test('resolves envPath to absolute path', () => {
    const config = loadConfig({ envPath: '.env.local' });
    assert.ok(path.isAbsolute(config.envPath));
    assert.ok(config.envPath.endsWith('.env.local'));
  });

  test('merges user config over defaults', () => {
    const config = loadConfig({ restartDelay: 1000, verbose: true });
    assert.strictEqual(config.restartDelay, 1000);
    assert.strictEqual(config.verbose, true);
    assert.strictEqual(config.watchInterval, DEFAULTS.watchInterval);
  });

  test('throws on invalid envPath', () => {
    assert.throws(() => loadConfig({ envPath: '' }), /envPath/);
    assert.throws(() => loadConfig({ envPath: 123 }), /envPath/);
  });

  test('throws on negative restartDelay', () => {
    assert.throws(() => loadConfig({ restartDelay: -1 }), /restartDelay/);
  });

  test('throws on watchInterval below 50', () => {
    assert.throws(() => loadConfig({ watchInterval: 10 }), /watchInterval/);
  });

  test('throws on maxRestarts less than 1', () => {
    assert.throws(() => loadConfig({ maxRestarts: 0 }), /maxRestarts/);
  });

  test('throws on invalid signal', () => {
    assert.throws(() => loadConfig({ signal: 'SIGFOO' }), /signal/);
  });

  test('accepts all valid signals', () => {
    VALID_SIGNALS.forEach(sig => {
      const config = loadConfig({ signal: sig });
      assert.strictEqual(config.signal, sig);
    });
  });

  test('coerces verbose to boolean', () => {
    assert.strictEqual(loadConfig({ verbose: 1 }).verbose, true);
    assert.strictEqual(loadConfig({ verbose: 0 }).verbose, false);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
