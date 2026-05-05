const fs = require('fs');
const path = require('path');
const os = require('os');
const EnvWatcher = require('./watcher');

function createTempEnv(content = 'PORT=3000\nNODE_ENV=development') {
  const tmpDir = os.tmpdir();
  const envPath = path.join(tmpDir, `.env-test-${Date.now()}`);
  fs.writeFileSync(envPath, content, 'utf8');
  return envPath;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✓ ${label}`);
      passed++;
    } else {
      console.error(`  ✗ ${label}`);
      failed++;
    }
  }

  console.log('\nRunning EnvWatcher tests...\n');

  // Test 1: emits ready on start
  {
    const envPath = createTempEnv();
    const watcher = new EnvWatcher({ envPath });
    let readyFired = false;
    watcher.on('ready', () => { readyFired = true; });
    watcher.start();
    assert(readyFired, 'emits ready event on start');
    watcher.stop();
    fs.unlinkSync(envPath);
  }

  // Test 2: emits error when file not found
  {
    const watcher = new EnvWatcher({ envPath: '/nonexistent/.env' });
    let errorFired = false;
    watcher.on('error', () => { errorFired = true; });
    watcher.start();
    assert(errorFired, 'emits error when env file does not exist');
  }

  // Test 3: emits change when file is modified
  {
    const envPath = createTempEnv();
    const watcher = new EnvWatcher({ envPath });
    let changeFired = false;
    watcher.on('change', () => { changeFired = true; });
    watcher.start();
    await sleep(100);
    fs.writeFileSync(envPath, 'PORT=4000\nNODE_ENV=production', 'utf8');
    await sleep(600);
    assert(changeFired, 'emits change event when file is modified');
    watcher.stop();
    fs.unlinkSync(envPath);
  }

  // Test 4: stop clears watcher
  {
    const envPath = createTempEnv();
    const watcher = new EnvWatcher({ envPath });
    let stopFired = false;
    watcher.on('stop', () => { stopFired = true; });
    watcher.start();
    watcher.stop();
    assert(stopFired, 'emits stop event and clears watcher');
    assert(watcher._watcher === null, 'internal watcher is null after stop');
    fs.unlinkSync(envPath);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
