'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');

test('service worker never serves a reviewed bank from its cache or an offline fallback', async () => {
  let handler; let cachesRead = 0; let requestOptions;
  const context = { URL, self: { location: { origin: 'https://afrotools.com' }, addEventListener(name, fn) { if (name === 'fetch') handler = fn; } },
    caches: { match() { cachesRead++; return Promise.resolve({ stale: true }); } },
    fetch: async (_request, options) => { requestOptions = options; throw new Error('Offline synthetic fixture'); } };
  vm.runInNewContext(fs.readFileSync('service-worker.js', 'utf8'), context);
  for (const path of ['/data/jamb/pools/index.json', '/data/jamb/pools/practice-pool.json', '/data/jamb/flashcard-decks.json']) {
    let response;
    handler({ request: { method: 'GET', url: 'https://afrotools.com' + path }, respondWith(value) { response = value; } });
    await assert.rejects(response, /Offline synthetic fixture/);
    assert.equal(requestOptions.cache, 'no-store');
  }
  assert.equal(cachesRead, 0);
});

test('a review revision change rotates the service worker cache without changing shell assets', () => {
  const root = path.resolve(__dirname, '..');
  const indexPath = path.join(root, 'data/jamb/pools/index.json');
  function stamp(revision) {
    let written;
    const mockFs = { ...fs, readFileSync(file, encoding) {
      const value = fs.readFileSync(file, encoding);
      if (path.resolve(file) !== indexPath) return value;
      const data = JSON.parse(value); data.review_revision = revision; return JSON.stringify(data);
    } };
    const context = { __dirname: path.join(root, 'scripts'), console: { log() {} }, require(id) {
      if (id === 'fs') return mockFs;
      if (id === 'path') return path;
      if (id === 'crypto') return crypto;
      if (id === './lib/safe-write') return { writeFileSyncWithRetry(_file, text) { written = text; } };
      throw new Error('Unexpected stamping dependency');
    } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts/stamp-sw.js'), 'utf8'), context);
    return written.match(/CACHE_VERSION = '([^']+)'/)[1];
  }
  assert.equal(stamp('a'.repeat(64)), stamp('a'.repeat(64)));
  assert.notEqual(stamp('a'.repeat(64)), stamp('b'.repeat(64)));
});
