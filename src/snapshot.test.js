const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EnvSnapshot } = require('./snapshot');

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

function makeTempEnv(content) {
  const p = path.join(os.tmpdir(), `.env-snap-test-${Date.now()}`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

console.log('snapshot tests');

test('update returns isNew=true on first read', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('PORT=3000\n');
  const result = snap.update(p);
  assert.strictEqual(result.isNew, true);
  assert.deepStrictEqual(result.changes, []);
  fs.unlinkSync(p);
});

test('update returns changes on second read', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('PORT=3000\n');
  snap.update(p);
  fs.writeFileSync(p, 'PORT=4000\n');
  const result = snap.update(p);
  assert.strictEqual(result.isNew, false);
  assert.strictEqual(result.changes.length, 1);
  assert.strictEqual(result.changes[0].type, 'changed');
  fs.unlinkSync(p);
});

test('get returns current snapshot', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('KEY=val\n');
  snap.update(p);
  const s = snap.get(p);
  assert.strictEqual(s.KEY, 'val');
  fs.unlinkSync(p);
});

test('get returns null for unknown file', () => {
  const snap = new EnvSnapshot();
  assert.strictEqual(snap.get('/no/such/file'), null);
});

test('remove deletes snapshot', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('X=1\n');
  snap.update(p);
  snap.remove(p);
  assert.strictEqual(snap.get(p), null);
  fs.unlinkSync(p);
});

test('hasKey returns true when key exists', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('SECRET=abc\n');
  snap.update(p);
  assert.strictEqual(snap.hasKey('SECRET'), true);
  fs.unlinkSync(p);
});

test('hasKey returns false when key missing', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('PORT=3000\n');
  snap.update(p);
  assert.strictEqual(snap.hasKey('MISSING'), false);
  fs.unlinkSync(p);
});

test('update returns null for missing file', () => {
  const snap = new EnvSnapshot();
  const result = snap.update('/tmp/does-not-exist-envwatch.env');
  assert.strictEqual(result, null);
});

test('clear removes all snapshots', () => {
  const snap = new EnvSnapshot();
  const p = makeTempEnv('A=1\n');
  snap.update(p);
  snap.clear();
  assert.strictEqual(snap.get(p), null);
  fs.unlinkSync(p);
});
