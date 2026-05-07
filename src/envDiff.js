/**
 * envDiff.js — Computes structured diff between two parsed env objects.
 * Returns added, removed, and changed keys with old/new values.
 */

'use strict';

/**
 * @param {Record<string,string>} prev
 * @param {Record<string,string>} next
 * @returns {{ added: string[], removed: string[], changed: Array<{key:string,from:string,to:string}> }}
 */
function computeDiff(prev, next) {
  const added = [];
  const removed = [];
  const changed = [];

  const prevKeys = new Set(Object.keys(prev));
  const nextKeys = new Set(Object.keys(next));

  for (const key of nextKeys) {
    if (!prevKeys.has(key)) {
      added.push(key);
    } else if (prev[key] !== next[key]) {
      changed.push({ key, from: prev[key], to: next[key] });
    }
  }

  for (const key of prevKeys) {
    if (!nextKeys.has(key)) {
      removed.push(key);
    }
  }

  return { added, removed, changed };
}

/**
 * Returns true if there are any differences between prev and next.
 * @param {Record<string,string>} prev
 * @param {Record<string,string>} next
 * @returns {boolean}
 */
function hasDiff(prev, next) {
  const { added, removed, changed } = computeDiff(prev, next);
  return added.length > 0 || removed.length > 0 || changed.length > 0;
}

/**
 * Returns a flat list of all affected keys across added, removed, changed.
 * @param {{ added: string[], removed: string[], changed: Array<{key:string}> }} diff
 * @returns {string[]}
 */
function affectedKeys(diff) {
  return [
    ...diff.added,
    ...diff.removed,
    ...diff.changed.map((c) => c.key),
  ];
}

module.exports = { computeDiff, hasDiff, affectedKeys };
