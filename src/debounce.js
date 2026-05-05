/**
 * Debounce utility for envwatch
 * Prevents rapid-fire restarts when multiple .env changes happen at once
 */

/**
 * Creates a debounced version of a function
 * @param {Function} fn - function to debounce
 * @param {number} delay - delay in milliseconds
 * @returns {Function} debounced function with cancel method
 */
function debounce(fn, delay = 300) {
  let timer = null;
  let pendingArgs = null;

  function debounced(...args) {
    pendingArgs = args;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      const callArgs = pendingArgs;
      pendingArgs = null;
      fn(...callArgs);
    }, delay);
  }

  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      pendingArgs = null;
    }
  };

  debounced.flush = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      const callArgs = pendingArgs;
      pendingArgs = null;
      fn(...callArgs);
    }
  };

  debounced.isPending = function () {
    return timer !== null;
  };

  return debounced;
}

module.exports = { debounce };
