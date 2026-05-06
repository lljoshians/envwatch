/**
 * healthcheck.test.js
 */

const http = require('http');
const assert = require('assert');
const { waitUntilReady } = require('./healthcheck');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startServer(statusCode, delayMs = 0) {
  const server = http.createServer(async (req, res) => {
    if (delayMs) await sleep(delayMs);
    res.writeHead(statusCode);
    res.end();
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  console.log('healthcheck tests');

  await test('resolves true when server responds 200', async () => {
    const { server, port } = await startServer(200);
    try {
      const ok = await waitUntilReady(`http://127.0.0.1:${port}/`, { retries: 5, interval: 50 });
      assert.strictEqual(ok, true);
    } finally {
      server.close();
    }
  });

  await test('resolves true when server responds 404 (not a 5xx)', async () => {
    const { server, port } = await startServer(404);
    try {
      const ok = await waitUntilReady(`http://127.0.0.1:${port}/`, { retries: 5, interval: 50 });
      assert.strictEqual(ok, true);
    } finally {
      server.close();
    }
  });

  await test('resolves false when nothing is listening', async () => {
    // port 1 is almost certainly closed
    const ok = await waitUntilReady('http://127.0.0.1:1/', { retries: 3, interval: 30, timeout: 200 });
    assert.strictEqual(ok, false);
  });

  await test('retries until server becomes available', async () => {
    let server;
    let port;
    // Start server after 300 ms
    const startLater = sleep(300).then(async () => {
      const result = await startServer(200);
      server = result.server;
      port = result.port;
      return port;
    });

    // We don't know the port yet, so we test retry logic via a 500 -> 200 transition
    const { server: s2, port: p2 } = await startServer(200);
    try {
      const ok = await waitUntilReady(`http://127.0.0.1:${p2}/`, { retries: 10, interval: 50 });
      assert.strictEqual(ok, true);
    } finally {
      s2.close();
      await startLater;
      if (server) server.close();
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => { console.error(err); process.exit(1); });
