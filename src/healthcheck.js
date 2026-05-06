/**
 * healthcheck.js
 * Polls a local HTTP endpoint to determine if the restarted process is ready.
 */

const http = require('http');

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_INTERVAL = 250;
const DEFAULT_RETRIES = 20;

/**
 * Attempt a single HTTP GET to the given URL.
 * Resolves true if status < 500, rejects on network error.
 */
function probe(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

/**
 * Poll url until it responds or retries are exhausted.
 * @param {string} url
 * @param {object} opts
 * @param {number} opts.timeout   per-request timeout ms  (default 5000)
 * @param {number} opts.interval  ms between attempts     (default 250)
 * @param {number} opts.retries   max attempts            (default 20)
 * @returns {Promise<boolean>} true if healthy, false if all retries failed
 */
async function waitUntilReady(url, opts = {}) {
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  const interval = opts.interval ?? DEFAULT_INTERVAL;
  const retries = opts.retries ?? DEFAULT_RETRIES;

  for (let i = 0; i < retries; i++) {
    try {
      const ok = await probe(url, timeout);
      if (ok) return true;
    } catch (_) {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

module.exports = { waitUntilReady, probe };
