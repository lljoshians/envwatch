const path = require('path');
const { EnvWatcher } = require('./watcher');
const { ProcessRestarter } = require('./restarter');

function envwatch(command, args = [], options = {}) {
  const envFile = options.envFile || path.resolve(process.cwd(), '.env');
  const restartDelay = options.restartDelay || 500;
  const debounce = options.debounce || 300;

  const watcher = new EnvWatcher(envFile, { debounce });
  const restarter = new ProcessRestarter(command, args, { restartDelay });

  watcher.on('change', (filepath) => {
    console.log(`[envwatch] ${path.basename(filepath)} changed — restarting...`);
    restarter.restart();
  });

  watcher.on('error', (err) => {
    console.error('[envwatch] Watcher error:', err.message);
  });

  restarter.on('start', (pid) => {
    console.log(`[envwatch] Process started (pid: ${pid})`);
  });

  restarter.on('restarted', (pid) => {
    console.log(`[envwatch] Process restarted (pid: ${pid})`);
  });

  restarter.on('exit', (code, signal) => {
    console.log(`[envwatch] Process exited (code: ${code}, signal: ${signal})`);
  });

  restarter.on('error', (err) => {
    console.error('[envwatch] Process error:', err.message);
  });

  watcher.start();
  restarter.start();

  const shutdown = async () => {
    console.log('\n[envwatch] Shutting down...');
    watcher.stop();
    await restarter.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { watcher, restarter };
}

module.exports = { envwatch };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: envwatch <command> [args...]');
    process.exit(1);
  }
  envwatch(args[0], args.slice(1));
}
