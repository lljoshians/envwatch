/**
 * Formats and reports .env change diffs to the logger
 */

const { Logger } = require('./logger');

const TYPE_LABELS = {
  added: 'ADDED',
  removed: 'REMOVED',
  changed: 'CHANGED',
};

const TYPE_COLORS = {
  added: '\x1b[32m',    // green
  removed: '\x1b[31m',  // red
  changed: '\x1b[33m',  // yellow
};

const RESET = '\x1b[0m';

function colorize(type, text, useColor) {
  if (!useColor) return text;
  return `${TYPE_COLORS[type] || ''}${text}${RESET}`;
}

function maskValue(value) {
  if (!value || value.length <= 2) return '***';
  return value[0] + '*'.repeat(Math.min(value.length - 2, 6)) + value[value.length - 1];
}

function formatChange(change, { maskSecrets = true, useColor = true } = {}) {
  const label = colorize(change.type, `[${TYPE_LABELS[change.type]}]`, useColor);
  const key = change.key;

  const shouldMask = maskSecrets && /secret|password|token|key|pwd/i.test(key);
  const fmt = (v) => (shouldMask ? maskValue(v) : v);

  switch (change.type) {
    case 'added':
      return `${label} ${key}=${fmt(change.value)}`;
    case 'removed':
      return `${label} ${key} (was ${fmt(change.oldValue)})`;
    case 'changed':
      return `${label} ${key}: ${fmt(change.oldValue)} → ${fmt(change.value)}`;
    default:
      return `${label} ${key}`;
  }
}

function reportChanges(filePath, changes, options = {}) {
  const logger = options.logger || new Logger();

  if (!changes || changes.length === 0) return;

  logger.info(`Detected ${changes.length} change(s) in ${filePath}:`);
  for (const change of changes) {
    logger.info('  ' + formatChange(change, options));
  }
}

module.exports = { reportChanges, formatChange, maskValue };
