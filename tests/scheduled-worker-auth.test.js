'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const scheduledEvent = require('../netlify/functions/_shared/scheduled-event');

const naturalEvent = { httpMethod: 'POST', headers: {}, body: '{"next_run":"2026-09-13T06:39:00Z"}' };
const manualEvents = [
  { httpMethod: 'GET', headers: {} },
  { httpMethod: 'POST', headers: {}, body: '{}' },
  { ...naturalEvent, headers: { Origin: 'https://example.invalid' } },
  { ...naturalEvent, headers: { 'x-admin-key': 'wrong-key' } },
  { ...naturalEvent, headers: { 'x-nf-event': 'manual' } },
  { ...naturalEvent, queryStringParameters: { dataset: 'fx' } },
  { ...naturalEvent, body: '{"next_run":"2026-09-13T06:39:00Z","dataset":"fx"}' },
];

// Execute the real handlers with isolated synthetic env and explicit in-memory
// dependencies. No production secrets, providers, database, email or network.
function loadWorker(name, dependencies = {}) {
  const file = path.resolve(__dirname, '../netlify/functions', name + '.js');
  const context = {
    exports: {},
    process: { env: { ADMIN_KEY: 'fixture-admin', ADMIN_SECRET: 'fixture-admin', SUPABASE_SERVICE_ROLE_KEY: 'fixture-key' } },
    console: { log() {}, warn() {}, error() {} },
    URL,
    require(id) {
      if (id === './_shared/scheduled-event') return scheduledEvent;
      assert.ok(Object.prototype.hasOwnProperty.call(dependencies, id), 'Unexpected dependency: ' + id);
      return dependencies[id];
    },
    fetch() { assert.fail('Network is forbidden in scheduled auth fixtures'); },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return context;
}

test('market natural payload enters refresh; ordinary HTTP retains admin authorization', async () => {
  const refreshes = [];
  const worker = loadWorker('scheduled-refresh-market-data', {
    './utils/cors': { getAllowedOrigin: () => 'https://example.invalid' },
    './_shared/market-data': { SUPABASE_URL: 'https://example.invalid', SUPABASE_KEY: 'fixture-key', normalizeSubtype: value => value },
    './_shared/market-data-refresh': { refreshActiveMarketData: async options => { refreshes.push(options); return { ok: true }; } },
  });
  for (const event of manualEvents) assert.strictEqual((await worker.exports.handler(event)).statusCode, 401);
  assert.strictEqual(refreshes.length, 0);
  const natural = await worker.exports.handler(naturalEvent);
  assert.strictEqual(natural.statusCode, 200);
  assert.strictEqual(JSON.parse(natural.body).scheduled, true);
  assert.strictEqual(refreshes[0].trigger, 'netlify-schedule');
  const admin = await worker.exports.handler({ httpMethod: 'POST', headers: { 'x-admin-key': 'fixture-admin' }, body: '{"dataset":"fx"}' });
  assert.strictEqual(admin.statusCode, 200);
  assert.strictEqual(refreshes[1].trigger, 'manual-refresh');
  assert.strictEqual(refreshes[1].dataset, 'fx');
});

test('watchdog natural payload enters health checks, not the cached public branch', async () => {
  const reads = [];
  const writes = [];
  const worker = loadWorker('scheduled-source-health-watchdog', {
    './_shared/data-store': {
      getData: async key => {
        reads.push(key);
        if (key === 'meta') throw new Error('synthetic stop after reaching active watchdog branch');
        return { ok: true, checked_at: '2026-08-23T04:57:05Z', stale: [], degraded: [], failures: [], warnings: [], sources: {} };
      },
      setData: async (key, data) => { writes.push({ key, data }); return true; },
    },
    './_shared/scholarship-platform': {},
    './_shared/market-data-refresh': {},
    './_shared/email-adapter': {},
  });
  for (const event of manualEvents) assert.strictEqual((await worker.exports.handler(event)).statusCode, 200);
  assert.deepStrictEqual(reads, manualEvents.map(() => 'automation-health-latest'));
  assert.strictEqual(writes.length, 0, 'unauthorized manual HTTP remains cached read-only');
  const natural = await worker.exports.handler(naturalEvent);
  assert.strictEqual(natural.statusCode, 500, 'synthetic sentinel stops before providers, not a production failure');
  assert.strictEqual(reads.at(-1), 'meta', 'natural schedule reaches active health checks');
  assert.strictEqual(writes.length, 1);
  assert.strictEqual(writes[0].key, 'automation-health-latest');
  assert.match(writes[0].data.failures[0].message, /synthetic stop/);
});

test('AfroStream manual HTTP cannot use a next_run spoof to bypass existing admin guards', async () => {
  for (const name of ['afrostream-sync', 'afrostream-news-monitor']) {
    const worker = loadWorker(name);
    for (const event of manualEvents) assert.strictEqual((await worker.exports.handler(event)).statusCode, 401, name);
  }
  const livecheck = loadWorker('afrostream-livecheck');
  assert.strictEqual(livecheck.livecheckSource(naturalEvent), 'Netlify Scheduled Function');
  assert.strictEqual(livecheck.livecheckSource(manualEvents[2]), 'Manual livecheck endpoint');
});
