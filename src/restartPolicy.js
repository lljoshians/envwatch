// Decides whether and when to restart based on retry state and exit codes

const { createRetryState } = require('./retry');

// Exit codes that suggest a permanent failure (don't retry)
const FATAL_EXIT_CODES = new Set([2, 126, 127]);

function createRestartPolicy(options = {}) {
  const retry = createRetryState(options);

  return {
    shouldRestart(exitCode) {
      if (FATAL_EXIT_CODES.has(exitCode)) return false;
      return retry.canRetry();
    },

    async waitAndRecord() {
      const delay = retry.nextDelay();
      retry.record();
      await sleep(delay);
      return delay;
    },

    onSuccess() {
      retry.reset();
    },

    get attempts() {
      return retry.attempts;
    },

    summary() {
      return retry.summary();
    },

    isFatalCode(code) {
      return FATAL_EXIT_CODES.has(code);
    },
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { createRestartPolicy, FATAL_EXIT_CODES };
