'use strict';

const { splitKey, groupEnv, keysForGroup, flattenGroups } = require('./envGrouping');

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
  assert(
    JSON.stringify(a) === JSON.stringify(b),
    `expected ${JSON.stringify(b)} but got ${JSON.stringify(a)}`
  );
}

console.log('envGrouping tests');

test('splitKey with underscore separator', () => {
  deepEqual(splitKey('DB_HOST'), ['DB', 'HOST']);
});

test('splitKey with no separator returns null prefix', () => {
  deepEqual(splitKey('PORT'), [null, 'PORT']);
});

test('splitKey only splits on first occurrence', () => {
  deepEqual(splitKey('DB_PRIMARY_HOST'), ['DB', 'PRIMARY_HOST']);
});

test('groupEnv groups by prefix', () => {
  const env = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'myapp' };
  const groups = groupEnv(env);
  deepEqual(groups.DB, { HOST: 'localhost', PORT: '5432' });
  deepEqual(groups.APP, { NAME: 'myapp' });
  assert(!groups._ungrouped, 'no ungrouped expected');
});

test('groupEnv places unprefixed keys in _ungrouped', () => {
  const env = { PORT: '3000', DB_HOST: 'localhost' };
  const groups = groupEnv(env);
  deepEqual(groups._ungrouped, { PORT: '3000' });
  deepEqual(groups.DB, { HOST: 'localhost' });
});

test('groupEnv with empty env returns empty object', () => {
  deepEqual(groupEnv({}), {});
});

test('keysForGroup returns matching keys', () => {
  const env = { DB_HOST: 'x', DB_PORT: 'y', APP_NAME: 'z', PORT: '3000' };
  const keys = keysForGroup(env, 'DB').sort();
  deepEqual(keys, ['DB_HOST', 'DB_PORT']);
});

test('keysForGroup returns empty array when no match', () => {
  const env = { APP_NAME: 'test' };
  deepEqual(keysForGroup(env, 'DB'), []);
});

test('flattenGroups round-trips through groupEnv', () => {
  const env = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'myapp', PORT: '3000' };
  const groups = groupEnv(env);
  const flat = flattenGroups(groups);
  deepEqual(flat, env);
});

test('flattenGroups handles _ungrouped correctly', () => {
  const groups = { _ungrouped: { PORT: '3000' }, DB: { HOST: 'localhost' } };
  const flat = flattenGroups(groups);
  deepEqual(flat, { PORT: '3000', DB_HOST: 'localhost' });
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
