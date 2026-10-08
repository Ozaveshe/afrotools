'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const filename = path.resolve(__dirname, '../netlify/functions/_shared/data-store.js');
const snapshot = { timestamp: '2026-06-12T00:00:00Z', countries: [{ code: 'NG' }] };
const pending = () => new Promise(() => {});
const flush = () => new Promise(resolve => setImmediate(resolve));

function load(fetchImpl, getBlob = async () => null) {
  const timers = new Map();
  const signals = [];
  const logs = [];
  const module = { exports: {} };
  const realRequire = createRequire(filename);
  let timerId = 0;
  let elapsed = 0;
  const context = vm.createContext({
    module, exports: module.exports, AbortController,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-private-key' } },
    require: id => id === '@netlify/blobs' ? { getStore: () => ({ get: getBlob }) } : realRequire(id),
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push(args.join(' '))])),
    fetch: (url, options) => { signals.push(options?.signal); return fetchImpl(url, options); },
    setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return { api: module.exports, timers, signals, logs,
    elapsed: () => elapsed,
    expire: async () => {
      await flush();
      assert.equal(timers.size, 1, 'only the active read tier has a timer');
      const [id, timer] = timers.entries().next().value;
      elapsed += timer.ms;
      timers.delete(id);
      timer.fn();
      await flush();
    },
  };
}

for (const stall of ['headers', 'body']) {
  test('stalled Supabase ' + stall + ' reaches dated blob without restamping', async () => {
    const store = load(async () => stall === 'headers' ? pending() : { ok: true, json: pending }, async () => snapshot);
    const result = store.api.getData('fuel-latest');
    await store.expire();
    const data = await result;
    assert.equal(store.elapsed(), 3000);
    assert.equal(store.signals[0].aborted, true, 'cancel the HTTP request on deadline');
    assert.equal(data.served_from, 'blob');
    assert.equal(data.as_of, '2026-06-12T00:00:00.000Z');
    assert.equal(data.timestamp, snapshot.timestamp);
    assert.equal(store.timers.size, 0);
    assert.match(store.logs.join('\n'), /operation=supabase-read dataset=fuel-latest code=TIMEOUT/);
    assert.ok(!store.logs.join('\n').includes('synthetic-private-key'));
    assert.ok(!JSON.stringify(data).includes('served_from'), 'provenance remains non-persistent');
  });
}

test('stalled primary and blob reach the existing static fallback within six seconds', async () => {
  const store = load(async url => url.includes('/rest/v1/') ? pending() : { ok: true, json: async () => snapshot }, pending);
  const result = store.api.getData('fuel-latest', 'https://example.test');
  await store.expire();
  await store.expire();
  const data = await result;
  assert.equal(store.elapsed(), 6000);
  assert.equal(data.served_from, 'fallback');
  assert.equal(data.as_of, '2026-06-12T00:00:00.000Z');
  assert.equal(store.timers.size, 0);
  assert.match(store.logs.join('\n'), /operation=blob-read dataset=fuel-latest code=TIMEOUT/);
});

test('stalled fallback body returns unavailable after the final deadline', async () => {
  const store = load(async url => url.includes('/rest/v1/') ? pending() : { ok: true, json: pending }, pending);
  const result = store.api.getData('fuel-latest');
  await store.expire();
  await store.expire();
  await store.expire();
  assert.equal(await result, null);
  assert.equal(store.elapsed(), 9000);
  assert.ok(store.signals.every(signal => signal.aborted));
  assert.equal(store.timers.size, 0);
  assert.match(store.logs.join('\n'), /operation=static-read dataset=fuel-latest code=TIMEOUT/);
});

test('a dataset without a static fallback stays unavailable instead of fabricating data', async () => {
  const store = load(pending, pending);
  const result = store.api.getData('salary-benchmarks-latest');
  await store.expire();
  await store.expire();
  assert.equal(await result, null);
  assert.equal(store.signals.length, 1);
  assert.equal(store.timers.size, 0);
});

test('healthy primary keeps precedence and clears its timer', async () => {
  let blobReads = 0;
  const store = load(async () => ({ ok: true, json: async () => [{ data: snapshot, updated_at: '2026-10-08T00:00:00Z' }] }),
    async () => { blobReads++; return snapshot; });
  const data = await store.api.getData('fuel-latest');
  assert.equal(data.served_from, 'live');
  assert.equal(data.as_of, '2026-06-12T00:00:00.000Z', 'prefer payload date over storage timestamp');
  assert.equal(blobReads, 0);
  assert.equal(store.signals[0].aborted, false);
  assert.equal(store.timers.size, 0);
});

test('a late primary result cannot replace the selected cache result', async () => {
  let complete;
  const store = load(() => new Promise(resolve => { complete = resolve; }), async () => snapshot);
  const result = store.api.getData('fuel-latest');
  await store.expire();
  const data = await result;
  complete({ ok: true, json: async () => [{ data: { timestamp: '2026-10-08T00:00:00Z' } }] });
  await flush();
  assert.equal(data.served_from, 'blob');
  assert.equal(data.timestamp, snapshot.timestamp);
  assert.equal(store.timers.size, 0);
});
