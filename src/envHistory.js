// envHistory.js — keeps a rolling history of env snapshots for diffing and rollback

const MAX_HISTORY = 20;

function createEnvHistory(maxEntries = MAX_HISTORY) {
  const entries = [];

  function push(snapshot, label = null) {
    const entry = {
      snapshot: { ...snapshot },
      timestamp: Date.now(),
      label: label || null,
    };
    entries.push(entry);
    if (entries.length > maxEntries) {
      entries.shift();
    }
    return entry;
  }

  function last() {
    return entries.length > 0 ? entries[entries.length - 1] : null;
  }

  function previous() {
    return entries.length > 1 ? entries[entries.length - 2] : null;
  }

  function at(index) {
    const normalized = index < 0 ? entries.length + index : index;
    return entries[normalized] || null;
  }

  function size() {
    return entries.length;
  }

  function clear() {
    entries.length = 0;
  }

  function all() {
    return entries.slice();
  }

  function findByLabel(label) {
    return entries.find((e) => e.label === label) || null;
  }

  return { push, last, previous, at, size, clear, all, findByLabel };
}

module.exports = { createEnvHistory };
