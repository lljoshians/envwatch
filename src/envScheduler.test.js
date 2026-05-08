'use strict';

const { EnvScheduler, createEnvScheduler, parseCronLike } = require('./envScheduler');
const { attachScheduler } = require('./schedulerMiddleware');
const { EventEmitter } = require('events');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

(async () => {
  console.log('\nenvScheduler tests');

  await test('parseCronLike handles seconds', () => {
    assert(parseCronLike('5s') === 5000, '5s should be 5000ms');
  });

  await test('parseCronLike handles minutes', () => {
    assert(parseCronLike('2m') === 120_000, '2m should be 120000ms');
  });

  await test('parseCronLike handles hours', () => {
    assert(parseCronLike('1h') === 3_600_000);
  });

  await test('parseCronLike throws on bad input', () => {
    let threw = false;
    try { parseCronLike('bad'); } catch { threw = true; }
    assert(threw, 'should throw on invalid expression');
  });

  await test('scheduler emits tick events', async () => {
    const s = createEnvScheduler();
    let ticks = 0;
    s.on('tick', () => ticks++);
    s.start(50);
    await sleep(175);
    s.stop();
    assert(ticks >= 3, `expected >=3 ticks, got ${ticks}`);
  });

  await test('scheduler respects pause/resume', async () => {
    const s = createEnvScheduler();
    let ticks = 0;
    s.on('tick', () => ticks++);
    s.start(40);
    await sleep(60);
    s.pause();
    const before = ticks;
    await sleep(100);
    s.resume();
    await sleep(60);
    s.stop();
    assert(ticks > before, 'should tick after resume');
  });

  await test('scheduler stops after maxFires', async () => {
    const s = createEnvScheduler({ maxFires: 2 });
    let ticks = 0;
    s.on('tick', () => ticks++);
    s.start(30);
    await sleep(200);
    assert(ticks === 2, `expected 2 ticks, got ${ticks}`);
    assert(!s.running, 'should not be running after maxFires');
  });

  await test('attachScheduler calls watcher.reload on tick', async () => {
    const watcher = new EventEmitter();
    let reloads = 0;
    watcher.reload = () => reloads++;
    const { detach } = attachScheduler(watcher, 40);
    await sleep(110);
    detach();
    assert(reloads >= 2, `expected >=2 reloads, got ${reloads}`);
  });

  await test('attachScheduler detaches on watcher close', async () => {
    const watcher = new EventEmitter();
    let reloads = 0;
    watcher.reload = () => reloads++;
    const { scheduler } = attachScheduler(watcher, 30);
    watcher.emit('close');
    await sleep(80);
    assert(!scheduler.running, 'scheduler should stop on watcher close');
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
})();
