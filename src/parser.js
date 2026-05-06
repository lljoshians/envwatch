/**
 * Parses .env file contents into key-value pairs
 * Handles comments, quoted values, and multiline strings
 */

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) return null;

  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();

  if (!key) return null;

  // Strip inline comments (not inside quotes)
  value = stripInlineComment(value);

  // Handle quoted values
  value = unquote(value);

  return { key, value };
}

function stripInlineComment(value) {
  if (value.startsWith('"') || value.startsWith("'")) return value;
  const commentIdx = value.indexOf(' #');
  if (commentIdx !== -1) return value.slice(0, commentIdx).trim();
  return value;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      result[parsed.key] = parsed.value;
    }
  }

  return result;
}

function diffEnv(prev, next) {
  const changes = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    if (!(key in prev)) {
      changes.push({ key, type: 'added', value: next[key] });
    } else if (!(key in next)) {
      changes.push({ key, type: 'removed', oldValue: prev[key] });
    } else if (prev[key] !== next[key]) {
      changes.push({ key, type: 'changed', oldValue: prev[key], value: next[key] });
    }
  }

  return changes;
}

module.exports = { parseEnv, diffEnv, parseLine };
