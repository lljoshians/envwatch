'use strict';

const { createEnvAlias } = require('./envAlias');

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('envAlias tests');

test('resolve returns canonical for known alias', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL', 'DB_CONNECTION'] });
  assert(a.resolve('DB_URL') === 'DATABASE_URL');
  assert(a.resolve('DB_CONNECTION') === 'DATABASE_URL');
});

test('resolve returns key unchanged when no mapping', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL'] });
  assert(a.resolve('UNKNOWN_KEY') === 'UNKNOWN_KEY');
  assert(a.resolve('DATABASE_URL') === 'DATABASE_URL');
});

test('expand fills in aliases from canonical value', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL'] });
  const result = a.expand({ DATABASE_URL: 'postgres://localhost/dev' });
  assert(result.DB_URL === 'postgres://localhost/dev');
  assert(result.DATABASE_URL === 'postgres://localhost/dev');
});

test('expand does not overwrite existing alias value', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL'] });
  const result = a.expand({ DATABASE_URL: 'postgres://a', DB_URL: 'postgres://b' });
  assert(result.DB_URL === 'postgres://b', 'should keep existing alias value');
});

test('expand handles missing canonical gracefully', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL'] });
  const result = a.expand({ PORT: '3000' });
  assert(!('DB_URL' in result), 'alias should not appear if canonical absent');
});

test('listAliases returns all aliases for canonical', () => {
  const a = createEnvAlias({ DATABASE_URL: ['DB_URL', 'DB_CONNECTION'] });
  const aliases = a.listAliases('DATABASE_URL');
  assert(aliases.length === 2);
  assert(aliases.includes('DB_URL'));
  assert(aliases.includes('DB_CONNECTION'));
});

test('listAliases returns empty array for unknown canonical', () => {
  const a = createEnvAlias({});
  assert(Array.isArray(a.listAliases('NOPE')));
  assert(a.listAliases('NOPE').length === 0);
});

test('createEnvAlias works with empty alias map', () => {
  const a = createEnvAlias();
  assert(a.resolve('FOO') === 'FOO');
  const result = a.expand({ FOO: 'bar' });
  assert(result.FOO === 'bar');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
