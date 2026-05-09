// envEncryption.test.js

const { encrypt, decrypt, encryptEnv, decryptEnv } = require('./envEncryption');

const SECRET = 'super-secret-key-for-tests';
let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log('  PASS', label);
    passed++;
  } catch (err) {
    console.error('  FAIL', label, '-', err.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

test('encrypt returns non-empty string', () => {
  const result = encrypt('hello', SECRET);
  assert(typeof result === 'string' && result.length > 0);
});

test('decrypt reverses encrypt', () => {
  const plain = 'my-db-password';
  const cipher = encrypt(plain, SECRET);
  assert(decrypt(cipher, SECRET) === plain);
});

test('different plaintexts produce different ciphertexts', () => {
  const a = encrypt('valueA', SECRET);
  const b = encrypt('valueB', SECRET);
  assert(a !== b);
});

test('decrypt throws on tampered ciphertext', () => {
  const cipher = encrypt('data', SECRET);
  let threw = false;
  try { decrypt(cipher + 'x', SECRET); } catch { threw = true; }
  assert(threw, 'should have thrown');
});

test('decrypt throws on invalid format', () => {
  let threw = false;
  try { decrypt('notvalid', SECRET); } catch { threw = true; }
  assert(threw);
});

test('encryptEnv encrypts only specified keys', () => {
  const env = { DB_PASS: 'secret', APP_NAME: 'myapp' };
  const result = encryptEnv(env, SECRET, ['DB_PASS']);
  assert(result.DB_PASS.startsWith('enc:'), 'DB_PASS should be encrypted');
  assert(result.APP_NAME === 'myapp', 'APP_NAME should be unchanged');
});

test('decryptEnv decrypts enc: prefixed values', () => {
  const env = { DB_PASS: 'secret', APP_NAME: 'myapp' };
  const encrypted = encryptEnv(env, SECRET, ['DB_PASS']);
  const decrypted = decryptEnv(encrypted, SECRET);
  assert(decrypted.DB_PASS === 'secret');
  assert(decrypted.APP_NAME === 'myapp');
});

test('decryptEnv ignores non-enc: values', () => {
  const env = { FOO: 'bar', BAZ: '123' };
  const result = decryptEnv(env, SECRET);
  assert(result.FOO === 'bar' && result.BAZ === '123');
});

console.log(`\nenvEncryption: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
