// Retry logic for process restarts with exponential backoff

const DEFAULT_OPTIONS = {
  maxAttempts: 5,
  baseDelay: 500,
  maxDelay: 10000,
  factor: 2,
  jitter: true,
};

function calcDelay(attempt, options) {
  const { baseDelay, maxDelay, factor, jitter } = options;
  let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  return Math.floor(delay);
}

function createRetryState(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempts = 0;
  let lastAttemptAt = null;

  return {
    get attempts() { return attempts; },
    get lastAttemptAt() { return lastAttemptAt; },
    get maxAttempts() { return opts.maxAttempts; },

    canRetry() {
      return attempts < opts.maxAttempts;
    },

    nextDelay() {
      return calcDelay(attempts + 1, opts);
    },

    record() {
      attempts += 1;
      lastAttemptAt = Date.now();
    },

    reset() {
      attempts = 0;
      lastAttemptAt = null;
    },

    summary() {
      return {
        attempts,
        maxAttempts: opts.maxAttempts,
        exhausted: attempts >= opts.maxAttempts,
        lastAttemptAt,
      };
    },
  };
}

module.exports = { createRetryState, calcDelay, DEFAULT_OPTIONS };
