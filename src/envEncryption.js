// envEncryption.js — simple symmetric encryption helpers for sensitive .env values
// Uses Node's built-in crypto (AES-256-GCM)

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;
const ENCODING = 'hex';

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plaintext, secret) {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString(ENCODING),
    tag.toString(ENCODING),
    encrypted.toString(ENCODING)
  ].join(':');
}

function decrypt(ciphertext, secret) {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, dataHex] = parts;
  const key = deriveKey(secret);
  const iv = Buffer.from(ivHex, ENCODING);
  const tag = Buffer.from(tagHex, ENCODING);
  const data = Buffer.from(dataHex, ENCODING);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
}

function encryptEnv(envMap, secret, keysToEncrypt) {
  const result = Object.assign({}, envMap);
  for (const key of keysToEncrypt) {
    if (result[key] !== undefined) {
      result[key] = 'enc:' + encrypt(result[key], secret);
    }
  }
  return result;
}

function decryptEnv(envMap, secret) {
  const result = Object.assign({}, envMap);
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string' && result[key].startsWith('enc:')) {
      result[key] = decrypt(result[key].slice(4), secret);
    }
  }
  return result;
}

module.exports = { encrypt, decrypt, encryptEnv, decryptEnv };
