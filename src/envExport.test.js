'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { toEnvFormat, toJsonFormat, toShellExports, exportEnv } = require('./envExport');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('envExport tests');

test('toEnvFormat simple values', () => {
  const out = toEnvFormat({ FOO: 'bar', BAZ: '123' });
  assert(out.includes('FOO=bar'), 'should have FOO=bar');
  assert(out.includes('BAZ=123'), 'should have BAZ=123');
});

test('toEnvFormat quotes values with spaces', () => {
  const out = toEnvFormat({ MSG: 'hello world' });
  assert(out.includes('MSG="hello world"'), `got: ${out}`);
});

test('toEnvFormat quotes values with hash', () => {
  const out = toEnvFormat({ COLOR: '#fff' });
  assert(out.includes('COLOR="#fff"'), `got: ${out}`);
});

test('toJsonFormat returns valid JSON', () => {
  const env = { A: '1', B: '2' };
  const out = toJsonFormat(env);
  const parsed = JSON.parse(out);
  assert(parsed.A === '1' && parsed.B === '2', 'parsed mismatch');
});

test('toJsonFormat compact mode', () => {
  const out = toJsonFormat({ X: 'y' }, false);
  assert(!out.includes('\n'), 'should be single line');
});

test('toShellExports produces export statements', () => {
  const out = toShellExports({ PORT: '3000', HOST: 'localhost' });
  assert(out.includes('export PORT="3000"'), `got: ${out}`);
  assert(out.includes('export HOST="localhost"'), `got: ${out}`);
});

test('exportEnv writes env format to file', () => {
  const dest = path.join(os.tmpdir(), `envexport_test_${Date.now()}.env`);
  exportEnv({ KEY: 'val' }, dest, 'env');
  const content = fs.readFileSync(dest, 'utf8');
  assert(content.includes('KEY=val'), `got: ${content}`);
  fs.unlinkSync(dest);
});

test('exportEnv writes json format to file', () => {
  const dest = path.join(os.tmpdir(), `envexport_test_${Date.now()}.json`);
  exportEnv({ KEY: 'val' }, dest, 'json');
  const parsed = JSON.parse(fs.readFileSync(dest, 'utf8'));
  assert(parsed.KEY === 'val', 'json mismatch');
  fs.unlinkSync(dest);
});

test('exportEnv writes shell format to file', () => {
  const dest = path.join(os.tmpdir(), `envexport_test_${Date.now()}.sh`);
  exportEnv({ KEY: 'val' }, dest, 'shell');
  const content = fs.readFileSync(dest, 'utf8');
  assert(content.includes('export KEY="val"'), `got: ${content}`);
  fs.unlinkSync(dest);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
