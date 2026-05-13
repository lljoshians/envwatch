'use strict';

const { mergeEnvs, mergeNamedEnvs, changedOrigins } = require('./envMerge');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function deepEqual(a, b) {
  assert(JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`);
}

console.log('\nenvMerge');

test('mergeEnvs — empty sources returns empty', () => {
  deepEqual(mergeEnvs([]), { merged: {}, origins: {} });
});

test('mergeEnvs — single source returned as-is', () => {
  const { merged } = mergeEnvs([{ A: '1', B: '2' }]);
  deepEqual(merged, { A: '1', B: '2' });
});

test('mergeEnvs — later source overrides earlier', () => {
  const { merged } = mergeEnvs([{ A: 'base', B: 'base' }, { A: 'override' }]);
  deepEqual(merged, { A: 'override', B: 'base' });
});

test('mergeEnvs — origins track source index', () => {
  const { origins } = mergeEnvs([{ A: '1' }, { A: '2', B: '3' }]);
  assert(origins.A === 1, 'A should come from source index 1');
  assert(origins.B === 1, 'B should come from source index 1');
});

test('mergeEnvs — skips null/non-object sources', () => {
  const { merged } = mergeEnvs([null, { A: '1' }, undefined]);
  deepEqual(merged, { A: '1' });
});

test('mergeNamedEnvs — merges with name tracking', () => {
  const { merged, origins } = mergeNamedEnvs([
    { name: 'base', env: { PORT: '3000', HOST: 'localhost' } },
    { name: 'local', env: { PORT: '4000' } },
  ]);
  assert(merged.PORT === '4000', 'PORT overridden by local');
  assert(merged.HOST === 'localhost', 'HOST kept from base');
  assert(origins.PORT === 'local', 'PORT origin is local');
  assert(origins.HOST === 'base', 'HOST origin is base');
});

test('mergeNamedEnvs — empty array', () => {
  deepEqual(mergeNamedEnvs([]), { merged: {}, origins: {} });
});

test('mergeNamedEnvs — skips missing env objects', () => {
  const { merged } = mergeNamedEnvs([{ name: 'a', env: null }, { name: 'b', env: { X: '1' } }]);
  deepEqual(merged, { X: '1' });
});

test('changedOrigins — detects keys that switched source', () => {
  const prev = { A: 'base', B: 'base' };
  const next = { A: 'local', B: 'base', C: 'local' };
  const changed = changedOrigins(prev, next);
  assert(changed.includes('A'), 'A changed origin');
  assert(!changed.includes('B'), 'B did not change');
  assert(changed.includes('C'), 'C is new');
});

test('changedOrigins — no changes returns empty array', () => {
  const origins = { A: 'base', B: 'local' };
  deepEqual(changedOrigins(origins, { ...origins }), []);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
