const assert = require('assert');
const { parseEnv, diffEnv, parseLine } = require('./parser');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('parser tests');

test('parses simple key=value', () => {
  const result = parseEnv('PORT=3000\nHOST=localhost');
  assert.strictEqual(result.PORT, '3000');
  assert.strictEqual(result.HOST, 'localhost');
});

test('ignores comment lines', () => {
  const result = parseEnv('# this is a comment\nPORT=8080');
  assert.strictEqual(Object.keys(result).length, 1);
  assert.strictEqual(result.PORT, '8080');
});

test('ignores empty lines', () => {
  const result = parseEnv('\n\nPORT=3000\n\n');
  assert.strictEqual(Object.keys(result).length, 1);
});

test('strips double-quoted values', () => {
  const result = parseEnv('NAME="hello world"');
  assert.strictEqual(result.NAME, 'hello world');
});

test('strips single-quoted values', () => {
  const result = parseEnv("NAME='hello world'");
  assert.strictEqual(result.NAME, 'hello world');
});

test('strips inline comments', () => {
  const result = parseEnv('PORT=3000 # web port');
  assert.strictEqual(result.PORT, '3000');
});

test('handles missing value', () => {
  const result = parseEnv('EMPTY=');
  assert.strictEqual(result.EMPTY, '');
});

test('parseLine returns null for comment', () => {
  assert.strictEqual(parseLine('# comment'), null);
});

test('parseLine returns null for empty string', () => {
  assert.strictEqual(parseLine(''), null);
});

test('diffEnv detects added key', () => {
  const changes = diffEnv({}, { NEW_KEY: 'value' });
  assert.strictEqual(changes.length, 1);
  assert.strictEqual(changes[0].type, 'added');
  assert.strictEqual(changes[0].key, 'NEW_KEY');
});

test('diffEnv detects removed key', () => {
  const changes = diffEnv({ OLD_KEY: 'val' }, {});
  assert.strictEqual(changes[0].type, 'removed');
});

test('diffEnv detects changed key', () => {
  const changes = diffEnv({ PORT: '3000' }, { PORT: '4000' });
  assert.strictEqual(changes[0].type, 'changed');
  assert.strictEqual(changes[0].oldValue, '3000');
  assert.strictEqual(changes[0].value, '4000');
});

test('diffEnv returns empty array when no changes', () => {
  const changes = diffEnv({ PORT: '3000' }, { PORT: '3000' });
  assert.strictEqual(changes.length, 0);
});
