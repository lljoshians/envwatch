'use strict';

const { createEnvTransform, builtins } = require('./envTransform');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertThrows(fn, msgIncludes) {
  try { fn(); throw new Error('Expected error not thrown'); }
  catch (e) {
    if (msgIncludes && !e.message.includes(msgIncludes))
      throw new Error(`Expected error to include "${msgIncludes}", got: ${e.message}`);
  }
}

console.log('\nenvTransform tests');

test('builtins: trim', () => {
  assert(builtins.trim('  hello  ') === 'hello');
});

test('builtins: uppercase / lowercase', () => {
  assert(builtins.uppercase('hello') === 'HELLO');
  assert(builtins.lowercase('WORLD') === 'world');
});

test('builtins: int happy path', () => {
  assert(builtins.int('42') === 42);
});

test('builtins: int throws on non-numeric', () => {
  assertThrows(() => builtins.int('abc'), 'Cannot convert');
});

test('builtins: float', () => {
  assert(builtins.float('3.14') === 3.14);
});

test('builtins: bool truthy values', () => {
  assert(builtins.bool('true') === true);
  assert(builtins.bool('1') === true);
  assert(builtins.bool('yes') === true);
});

test('builtins: bool falsy values', () => {
  assert(builtins.bool('false') === false);
  assert(builtins.bool('0') === false);
  assert(builtins.bool('no') === false);
});

test('builtins: bool throws on unknown', () => {
  assertThrows(() => builtins.bool('maybe'), 'Cannot convert');
});

test('builtins: json parses object', () => {
  const result = builtins.json('{"a":1}');
  assert(result.a === 1);
});

test('builtins: json throws on invalid', () => {
  assertThrows(() => builtins.json('{bad}'), 'Cannot parse');
});

test('addRule + applyTo with named transform', () => {
  const t = createEnvTransform();
  t.addRule('PORT', 'int');
  assert(t.applyTo('PORT', '8080') === 8080);
});

test('addRule + applyTo with pipeline', () => {
  const t = createEnvTransform();
  t.addRule('NAME', 'trim', 'uppercase');
  assert(t.applyTo('NAME', '  alice  ') === 'ALICE');
});

test('addRule with custom function', () => {
  const t = createEnvTransform();
  t.addRule('SECRET', (v) => v.slice(0, 3) + '***');
  assert(t.applyTo('SECRET', 'mysecret') === 'mys***');
});

test('transformAll applies rules to matching keys', () => {
  const t = createEnvTransform();
  t.addRule('PORT', 'int');
  t.addRule('DEBUG', 'bool');
  const result = t.transformAll({ PORT: '3000', DEBUG: 'true', HOST: 'localhost' });
  assert(result.PORT === 3000);
  assert(result.DEBUG === true);
  assert(result.HOST === 'localhost');
});

test('transformAll skips missing keys gracefully', () => {
  const t = createEnvTransform();
  t.addRule('MISSING', 'int');
  const result = t.transformAll({ OTHER: '1' });
  assert(result.OTHER === '1');
});

test('register adds custom named transform', () => {
  const t = createEnvTransform();
  t.register('base64', (v) => Buffer.from(v).toString('base64'));
  t.addRule('TOKEN', 'base64');
  const result = t.applyTo('TOKEN', 'hello');
  assert(result === Buffer.from('hello').toString('base64'));
});

test('applyTo throws on unknown named transform', () => {
  const t = createEnvTransform();
  t.addRule('X', 'nonexistent');
  assertThrows(() => t.applyTo('X', 'val'), 'Unknown transform');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
