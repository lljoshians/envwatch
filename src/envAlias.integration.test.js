'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const { createEnvAlias } = require('./envAlias');
const { attachAlias } = require('./aliasMiddleware');
const { parseEnv } = require('./parser');

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

function makeTempEnv(content) {
  const p = path.join(os.tmpdir(), `envalias-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

console.log('envAlias integration tests');

test('parse .env then expand aliases end-to-end', () => {
  const envPath = makeTempEnv('DATABASE_URL=postgres://localhost/mydb\nPORT=3000\n');
  const raw = fs.readFileSync(envPath, 'utf8');
  const parsed = parseEnv(raw);
  const alias = createEnvAlias({ DATABASE_URL: ['DB_URL', 'DB_CONNECTION'], PORT: ['APP_PORT'] });
  const expanded = alias.expand(parsed);

  assert(expanded.DATABASE_URL === 'postgres://localhost/mydb');
  assert(expanded.DB_URL === 'postgres://localhost/mydb');
  assert(expanded.DB_CONNECTION === 'postgres://localhost/mydb');
  assert(expanded.APP_PORT === '3000');
  fs.unlinkSync(envPath);
});

test('watcher emits expanded event with alias keys after file parse', () => {
  const watcher = new EventEmitter();
  attachAlias(watcher, { SECRET_KEY: ['APP_SECRET'] });

  let expandedEnv = null;
  watcher.on('changed:expanded', (cur) => { expandedEnv = cur; });

  const envPath = makeTempEnv('SECRET_KEY=supersecret\n');
  const raw = fs.readFileSync(envPath, 'utf8');
  const parsed = parseEnv(raw);

  watcher.emit('changed', parsed, {});

  assert(expandedEnv !== null);
  assert(expandedEnv.APP_SECRET === 'supersecret', 'alias should appear in expanded event');
  fs.unlinkSync(envPath);
});

test('resolve works correctly after round-trip through expand', () => {
  const alias = createEnvAlias({ REDIS_URL: ['CACHE_URL'] });
  const env = { REDIS_URL: 'redis://localhost' };
  const expanded = alias.expand(env);
  const resolved = alias.resolve('CACHE_URL');
  assert(expanded[resolved] === 'redis://localhost');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
