/**
 * Manages snapshots of .env file state for change detection
 */

const fs = require('fs');
const { parseEnv, diffEnv } = require('./parser');

class EnvSnapshot {
  constructor() {
    this._snapshots = new Map();
  }

  /**
   * Take a snapshot of a .env file and return diff if one existed before
   * @param {string} filePath
   * @returns {{ changes: Array, isNew: boolean } | null}
   */
  update(filePath) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }

    const parsed = parseEnv(content);
    const prev = this._snapshots.get(filePath);

    this._snapshots.set(filePath, parsed);

    if (!prev) {
      return { changes: [], isNew: true, parsed };
    }

    const changes = diffEnv(prev, parsed);
    return { changes, isNew: false, parsed };
  }

  /**
   * Get current snapshot for a file
   * @param {string} filePath
   */
  get(filePath) {
    return this._snapshots.get(filePath) || null;
  }

  /**
   * Remove a snapshot (e.g. file deleted)
   * @param {string} filePath
   */
  remove(filePath) {
    this._snapshots.delete(filePath);
  }

  /**
   * Check whether any tracked file has a given key
   * @param {string} key
   */
  hasKey(key) {
    for (const snapshot of this._snapshots.values()) {
      if (key in snapshot) return true;
    }
    return false;
  }

  clear() {
    this._snapshots.clear();
  }
}

module.exports = { EnvSnapshot };
