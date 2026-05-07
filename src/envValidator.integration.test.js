'use strict';

// Integration: EnvWatcher + validationMiddleware working together with a real temp file

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EnvWatcher } = require('./watcher');
const { attachValidation } = require('./validationMiddleware');

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeTempEnv(content) {
  const file = path.join(os.tmpdir(), `.env-valtest-${Date.now()}`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

console.log('\nenvValidator integration tests');

(async () => {
  // Test: valid change → no validationFailed
  await (async () => {
    const file = makeTempEnv('PORT=3000\n');
    const watcher = new EnvWatcher(file);
    const rules = [{ key: 'PORT', required: true }];
    attachValidation(watcher, rules, { blockRestart: true });

    let validationFired = false;
    watcher.on('validationFailed', () => { validationFired = true; });

    await watcher.start();
    fs.writeFileSync(file, 'PORT=4000\n', 'utf8');
    await sleep(300);
    await watcher.stop();
    fs.unlinkSync(file);

    test('valid change does not trigger validationFailed', () => {
      assert.strictEqual(validationFired, false);
    });
  })();

  // Test: removing required key → validationFailed fires
  await (async () => {
    const file = makeTempEnv('PORT=3000\nSECRET=abc\n');
    const watcher = new EnvWatcher(file);
    const rules = [{ key: 'SECRET', required: true }];
    attachValidation(watcher, rules, { blockRestart: true });

    let errors = null;
    watcher.on('validationFailed', (errs) => { errors = errs; });

    await watcher.start();
    fs.writeFileSync(file, 'PORT=3000\n', 'utf8'); // SECRET removed
    await sleep(300);
    await watcher.stop();
    fs.unlinkSync(file);

    test('removing required key fires validationFailed', () => {
      assert.ok(errors !== null, 'errors should not be null');
      assert.ok(errors.some((e) => e.includes('SECRET')));
    });
  })();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
