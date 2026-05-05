const assert = require('assert');
const path = require('path');
const { ProcessRestarter } = require('./restarter');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testStartAndExit() {
  const restarter = new ProcessRestarter('node', ['-e', 'setTimeout(() => {}, 200)'], {
    restartDelay: 100,
  });

  let started = false;
  let exited = false;

  restarter.on('start', () => { started = true; });
  restarter.on('exit', () => { exited = true; });

  restarter.start();
  assert.ok(restarter.isRunning(), 'process should be running after start');
  assert.ok(started, 'start event should have fired');

  await sleep(400);
  assert.ok(!restarter.isRunning(), 'process should have exited');
  assert.ok(exited, 'exit event should have fired');

  console.log('✓ testStartAndExit passed');
}

async function testRestart() {
  const restarter = new ProcessRestarter('node', ['-e', 'setTimeout(() => {}, 5000)'], {
    restartDelay: 100,
  });

  const pids = [];
  restarter.on('start', (pid) => pids.push(pid));

  let restarted = false;
  restarter.on('restarted', () => { restarted = true; });

  restarter.start();
  await sleep(100);

  await restarter.restart();
  await sleep(100);

  assert.ok(restarted, 'restarted event should have fired');
  assert.strictEqual(pids.length, 2, 'should have spawned twice');
  assert.notStrictEqual(pids[0], pids[1], 'pids should differ');

  await restarter.stop();
  console.log('✓ testRestart passed');
}

async function testStop() {
  const restarter = new ProcessRestarter('node', ['-e', 'setTimeout(() => {}, 5000)'], {
    restartDelay: 100,
  });

  restarter.start();
  assert.ok(restarter.isRunning(), 'should be running');

  await restarter.stop();
  assert.ok(!restarter.isRunning(), 'should not be running after stop');

  console.log('✓ testStop passed');
}

(async () => {
  try {
    await testStartAndExit();
    await testRestart();
    await testStop();
    console.log('\nAll restarter tests passed!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
