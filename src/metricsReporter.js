'use strict';

/**
 * Formats and prints a Metrics summary to the console.
 * Integrates with Logger for consistent output style.
 */

const { Logger } = require('./logger');

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';

function fmtMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function printSummary(metrics, logger) {
  const log = logger || new Logger({ prefix: 'envwatch' });
  const s = metrics.summary();

  log.info('--- metrics summary ---');
  log.info(`${CYAN}uptime${RESET}       : ${fmtMs(s.uptimeMs)}`);
  log.info(`${CYAN}restarts${RESET}     : ${YELLOW}${s.restarts}${RESET}`);
  log.info(`${CYAN}env changes${RESET}  : ${GREEN}${s.envChanges}${RESET}`);
  if (s.lastRestartAt) {
    log.info(`${CYAN}last restart${RESET} : ${s.lastRestartAt}`);
  }
  if (s.lastChangeAt) {
    log.info(`${CYAN}last change${RESET}  : ${s.lastChangeAt}`);
  }

  const recent = metrics.recentChanges(5);
  if (recent.length > 0) {
    log.info('recent env changes:');
    recent.forEach((entry) => {
      const ts = new Date(entry.at).toISOString();
      log.info(`  ${ts}  keys: ${entry.keys.join(', ')}`);
    });
  }
}

function formatSummaryJson(metrics) {
  return JSON.stringify(metrics.summary(), null, 2);
}

module.exports = { printSummary, formatSummaryJson, fmtMs };
