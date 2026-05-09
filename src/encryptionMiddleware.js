// encryptionMiddleware.js — attaches transparent decrypt/re-encrypt to EnvWatcher events

const { decryptEnv } = require('./envEncryption');

function attachEncryption(watcher, secret) {
  if (!secret) throw new Error('encryptionMiddleware: secret is required');

  function onReady(env) {
    try {
      const decrypted = decryptEnv(env, secret);
      watcher.emit('ready:decrypted', decrypted);
    } catch (err) {
      watcher.emit('error', new Error('Decryption failed on ready: ' + err.message));
    }
  }

  function onChanged(diff) {
    try {
      const decryptedCurrent = decryptEnv(diff.current, secret);
      const decryptedPrevious = decryptEnv(diff.previous, secret);
      watcher.emit('changed:decrypted', {
        previous: decryptedPrevious,
        current: decryptedCurrent,
        keys: diff.keys
      });
    } catch (err) {
      watcher.emit('error', new Error('Decryption failed on change: ' + err.message));
    }
  }

  watcher.on('ready', onReady);
  watcher.on('changed', onChanged);

  function detach() {
    watcher.off('ready', onReady);
    watcher.off('changed', onChanged);
  }

  return { detach };
}

module.exports = { attachEncryption };
