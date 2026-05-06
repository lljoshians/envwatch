/**
 * throttle.js — Ensures a function is called at most once per interval.
 * Useful for rate-limiting restart events when many .env changes happen fast.
 */

/**
 * Creates a throttled version of fn that fires at most once per `wait` ms.
 * The first call goes through immediately; subsequent calls within the window
 * are dropped (not queued — use debounce for trailing-edge behaviour).
 *
 * @param {Function} fn
 * @param {number} wait  milliseconds
 * @returns {{ throttled: Function, cancel: Function }}
 */
function throttle(fn, wait) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  if (typeof wait !== 'number' || wait < 0) throw new RangeError('wait must be a non-negative number');

  let lastCall = 0;
  let timer = null;
  let cancelled = false;

  function throttled(...args) {
    if (cancelled) return;
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    }
    // Dropped — caller can listen for 'throttled' events via wrapper if needed
  }

  function cancel() {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { throttled, cancel };
}

module.exports = { throttle };
