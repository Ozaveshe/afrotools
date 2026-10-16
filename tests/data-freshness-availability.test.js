'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const reference = require('../netlify/functions/_shared/shipping-reference');
const catalog = require('../netlify/functions/scheduled-fetch-shipping')._referenceCatalog;
const ROOT = path.resolve(__dirname, '..');
const SAVED = '2026-10-14T04:52:00.000Z';
const plain = value => JSON.parse(JSON.stringify(value));
const never = () => new Promise(() => {});

function load({ fetch = async () => ({ ok: true, json: async () => [] }), data = {}, env = {}, clock = Date, timers = {} } = {}) {
  const imports = [], keys = [], signals = [], module = { exports: {} };
  const mocks = {
    './_shared/data-store': { getData: async key => {
      keys.push(key); return typeof data[key] === 'function' ? data[key]() : (data[key] ?? null);
    } },
    './_shared/market-data-refresh': { getCollector: () => true },
    './utils/cors': { getAllowedOrigin: () => 'https://afrotools.com' },
    './_shared/env': { getEnv: name => env[name] },
    './_shared/shipping-reference': reference,
    './scheduled-fetch-shipping': { _referenceCatalog: catalog },
    './_shared/with-api': { withApi: handler => handler },
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'netlify/functions/api-data-freshness.js'), 'utf8'), {
    module, exports: module.exports, Date: clock, AbortController, Promise,
    setTimeout: timers.setTimeout || setTimeout, clearTimeout: timers.clearTimeout || clearTimeout,
    fetch: (url, options) => { assert.match(url, /^https:\/\/zpclagtgczsygrgztlts\.supabase\.co\/rest\/v1\//); signals.push(options.signal); return fetch(url, options); },
    require: id => {
      imports.push(id);
      assert(!/scholarship-platform|supabase-js|scheduled.*scholarship/.test(id), 'Status GET must never import the scholarship sync pipeline');
      assert(Object.hasOwn(mocks, id), 'Unmocked dependency: ' + id); return mocks[id];
    },
  }, { filename: 'api-data-freshness.js' });
  return { ...module.exports, imports, keys, signals };
}
const request = (owner, headers = {}) => owner.handler({ httpMethod: 'GET', headers, queryStringParameters: { cat: 'shipping' } });
function snapshot() {
  return {
    timestamp: SAVED,
    routes: catalog.routes.map(row => ({ origin: row.from, destination: catalog.ports[row.to].name,
      destination_port: row.to, destination_country: catalog.ports[row.to].country,
      rate_20ft_usd: row.rate_20ft, rate_40ft_usd: row.rate_40ft, transit_days: row.transit_days,
      last_updated: '2026-10-14', source: 'reference' })),
    ports: Object.entries(catalog.ports).map(([id, port]) => ({ id, ...plain(port), demurrage: plain(catalog.demurrage[id] || null), logistics_score: null, logistics_year: null })),
    route_count: catalog.routes.length, port_count: Object.keys(catalog.ports).length,
  };
}

for (const blocked of ['headers', 'body']) {
  test('hung Supabase ' + blocked + ' aborts and returns honest unavailable before the request budget', { timeout: 12000 }, async () => {
    const owner = load({ env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-live' }, data: { meta: {}, 'shipping-rates-latest': snapshot() },
      fetch: blocked === 'headers' ? never : async () => ({ ok: true, json: never }) });
    const start = Date.now(), response = await request(owner), elapsed = Date.now() - start, body = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert(elapsed >= owner._test.READ_TIMEOUT_MS - 100);
    assert(elapsed < owner._test.REQUEST_TIMEOUT_MS, 'Status endpoint must finish before its own budget, not the caller 30s timeout');
    assert.equal(body.market_data.available, false); assert.equal(body.market_data.status, 'error');
    assert.match(body.market_data.error, /deadline exceeded/);
    assert.equal(owner.signals.length, 2); assert(owner.signals.every(signal => signal.aborted));
    assert.notEqual(body.overall_health, 'healthy');
    assert.equal(body.categories.shipping.source_type, 'reference');
    assert.equal(body.categories.shipping.reference_status, 'unverified_reference');
    assert.equal(body.categories.shipping.current_prices, false);
    assert.equal(body.categories.shipping.updatedAt, SAVED);
    assert.equal(body.scholarship.available, false);
  });
}

test('non-OK upstream headers abort unread bodies and preserve unavailable classification', async () => {
  let cancelled = 0, bodyReads = 0;
  const owner = load({ env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-live' }, data: { meta: {} },
    fetch: async (_url, { signal }) => {
      signal.addEventListener('abort', () => { cancelled++; }, { once: true });
      return { ok: false, status: 503, json: async () => { bodyReads++; return never(); } };
    } });
  const body = JSON.parse((await request(owner)).body);
  assert.equal(cancelled, 2); assert.equal(bodyReads, 0);
  assert(owner.signals.every(signal => signal.aborted));
  assert.equal(body.market_data.available, false); assert.equal(body.market_data.status, 'error');
  assert.match(body.market_data.error, /Supabase 503/); assert.notEqual(body.overall_health, 'healthy');
});

test('all blocked storage reads settle independently and do not manufacture data or fresh timestamps', async () => {
  const delays = [], owner = load({ data: { meta: never, 'shipping-rates-latest': never, 'scholarships-latest': never, 'automation-health-latest': never },
    timers: { setTimeout: (fn, delay) => { delays.push(delay); return setTimeout(fn, 10); } } });
  const response = await request(owner), body = JSON.parse(response.body);
  assert(delays.length >= 4); assert(delays.every(delay => delay > 0 && delay <= 3000));
  assert.equal(body.metadata.available, false); assert.equal(body.metadata.status, 'error');
  assert.equal(body.categories.shipping.availability, 'unavailable'); assert.equal(body.categories.shipping.updatedAt, null);
  assert.equal(body.categories.shipping.current_prices, false); assert.equal(body.categories.shipping.reference_reviewed_at, null);
  assert.equal(body.scholarship.available, false); assert.equal(body.automation_watchdog.available, false);
  assert.equal(body.overall_health, 'stale'); assert(Number.isFinite(Date.parse(body.checked_at)));
});

test('a remaining request budget shortens the read deadline and an expired budget starts no adapter', async () => {
  const delays = [], owner = load({ timers: { setTimeout: (fn, delay) => { delays.push(delay); return setTimeout(fn, 5); } } });
  let signal;
  await assert.rejects(owner._test.readWithDeadline(value => { signal = value; return never(); }, Date.now() + 75), /deadline exceeded/);
  assert(delays[0] > 0 && delays[0] <= 75); assert.equal(signal.aborted, true);
  let calls = 0;
  await assert.rejects(owner._test.readWithDeadline(() => { calls++; }, Date.now() - 1), /deadline exceeded/);
  assert.equal(calls, 0);
});

test('scholarship summary is cache-only, preserves the saved timestamp and marks limited/degraded state', async () => {
  const owner = load({ data: { meta: {}, 'shipping-rates-latest': snapshot(), 'scholarships-latest': {
    data: [{ id: 'synthetic' }], timestamp: SAVED,
    meta: { mode: 'live', lastCheckedAt: SAVED, isLimited: true, publicMinCount: 50 },
  } } });
  const response = await request(owner), body = JSON.parse(response.body);
  assert.equal(body.scholarship.available, true); assert.equal(body.scholarship.count, 1);
  assert.equal(body.scholarship.mode, 'cached'); assert.equal(body.scholarship.lastCheckedAt, SAVED);
  assert.equal(body.scholarship.isLimited, true); assert.equal(body.scholarship.isDegraded, true);
  assert.equal(body.scholarship.stale, true); assert.equal(body.scholarship.status, 'limited');
  assert(owner.keys.includes('scholarships-latest')); assert(!owner.imports.some(id => /scholarship/.test(id)));
  assert.notEqual(body.overall_health, 'healthy');
});

test('empty cache and absent service key never become healthy availability', async () => {
  const owner = load({ data: { meta: {}, 'scholarships-latest': { data: [], timestamp: SAVED } } });
  const body = JSON.parse((await request(owner)).body);
  assert.equal(body.scholarship.available, false); assert.equal(body.scholarship.count, 0);
  assert.equal(body.scholarship.status, 'degraded'); assert.equal(body.scholarship.lastCheckedAt, SAVED);
  assert.equal(body.market_data.available, false); assert.notEqual(body.overall_health, 'healthy');
});

test('cached scholarship coverage is recomputed against the current configured threshold', async () => {
  for (const [minimum, savedMinimum, savedLimited, expectedLimited] of [[100, 50, false, true], [50, 100, true, false]]) {
    const owner = load({ env: { SCHOLARSHIP_PUBLIC_MIN_COUNT: String(minimum) }, data: { meta: {},
      'scholarships-latest': { data: Array.from({ length: 60 }, (_, id) => ({ id })),
        meta: { publicMinCount: savedMinimum, isLimited: savedLimited, lastCheckedAt: SAVED } },
    } });
    const body = JSON.parse((await request(owner)).body);
    assert.equal(body.scholarship.publicMinCount, minimum);
    assert.equal(body.scholarship.isLimited, expectedLimited);
    assert.equal(body.scholarship.count, 60); assert.equal(body.scholarship.lastCheckedAt, SAVED);
    assert.equal(body.scholarship.isDegraded, true); assert.notEqual(body.overall_health, 'healthy');
  }
});

test('public/admin split and cache/CORS semantics survive the bounded read path', async () => {
  const source = { id: 1, dataset: 'synthetic', source_key: 'private-source-row', active: true, last_success_at: SAVED };
  const run = { id: 2, source_id: 1, dataset: 'synthetic', status: 'failed', started_at: new Date().toISOString(), error_summary: 'private-run-detail' };
  const owner = load({ env: { ADMIN_KEY: 'synthetic-admin', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-live' },
    data: { meta: {}, 'automation-health-latest': { ok: true, checked_at: SAVED, private_token: 'private-watchdog-detail' } },
    fetch: async url => ({ ok: true, json: async () => url.includes('market_data_source_runs?') ? [run] : [source] }) });
  const publicResponse = await request(owner), publicBody = JSON.parse(publicResponse.body);
  assert.equal(publicResponse.headers['Access-Control-Allow-Origin'], 'https://afrotools.com');
  assert.equal(publicResponse.headers['Cache-Control'], 'public, max-age=60, s-maxage=120');
  assert.equal(publicResponse.headers.Vary, 'Origin');
  assert.equal(publicBody.market_data.sources, undefined); assert.equal(publicBody.market_data.failed_runs, undefined);
  assert.equal(publicBody.automation_watchdog.details, undefined);
  assert(!/private-source-row|private-run-detail|private-watchdog-detail/.test(publicResponse.body));
  const adminResponse = await request(owner, { 'X-Admin-Key': 'synthetic-admin' }), adminBody = JSON.parse(adminResponse.body);
  assert.equal(adminResponse.headers['Cache-Control'], 'no-store');
  assert.equal(adminBody.market_data.sources[0].source_key, source.source_key);
  assert.equal(adminBody.market_data.failed_runs[0].error_summary, run.error_summary);
  assert.equal(adminBody.automation_watchdog.details.private_token, 'private-watchdog-detail');
});

test('independent summaries start together rather than blocking scholarship/watchdog behind market data', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const owner = load({ env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-live' }, data: { meta: {} },
    fetch: async () => { await pending; return { ok: true, json: async () => [] }; } });
  const result = request(owner);
  for (let n = 0; n < 15; n++) await Promise.resolve();
  assert(owner.keys.includes('scholarships-latest')); assert(owner.keys.includes('automation-health-latest'));
  release(); assert.equal((await result).statusCode, 200);
});
