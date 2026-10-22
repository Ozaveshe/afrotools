'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const NOW = '2026-10-16T12:00:00.000Z';
const qualified = require('../netlify/functions/_shared/stock-observations');
const clone = x => JSON.parse(JSON.stringify(x));
function row(exchange = 'NGX', country = 'NG', day = '2026-10-15') {
  return { exchange, country, name: 'Synthetic exchange', index_name: 'Synthetic index',
    price: 120, change: 0, change_pct: 0, volume: 0, last_trading_day: day, source: 'alphavantage' };
}
function snapshot(indices = [row(), row('JSE', 'ZA')]) { return { timestamp: NOW, indices }; }
function classify(payload, now = NOW) { return qualified.normalizeSnapshot(payload, now); }
function load(name, mocks, { env = {}, fetch, logs = [] } = {}) {
  const file = path.join(ROOT, 'netlify/functions', name), module = { exports: {} };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return Date.parse(NOW); } }
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    module, exports: module.exports, Date: Clock, URL, Set, Map, Buffer, AbortController,
    process: { env }, console: Object.fromEntries(['log', 'warn', 'error'].map(key => [key, (...x) => logs.push(x.join(' '))])),
    fetch: fetch || (() => { throw new Error('Unexpected network'); }),
    require(id) { if (Object.hasOwn(mocks, id)) return mocks[id]; throw new Error('Unexpected dependency ' + id); }
  }, { filename: file });
  return module.exports;
}
function api(payload, auth = { tier: 'free' }) {
  return load('api-v1.js', {
    './_lib/cache': { getOrFetch: async key => { assert.equal(key, 'stock-indices-latest'); return { data: payload }; } },
    './_shared/data-store': {}, './_shared/api-auth': { validateApiKey: async () => auth },
    './_shared/stock-observations': qualified
  });
}
const request = (owner, params = {}) => owner.handler({ httpMethod: 'GET', path: '/api/v1/stocks', queryStringParameters: params });
function freshness(payload) {
  return load('api-data-freshness.js', {
    './_shared/data-store': { getData: async key => { assert.equal(key, 'stock-indices-latest'); return payload; } },
    './_shared/scholarship-platform': {}, './_shared/market-data-refresh': {}, './utils/cors': {}, './_shared/env': {},
    './_shared/with-api': { withApi: fn => fn }, './_shared/stock-observations': qualified
  })._test;
}
function collector({ failed = false, undated = false, storageFails = false, marketstack = false, partial = false, day = '2026-10-15' } = {}) {
  const writes = [], metadata = [], runs = [], requests = [], logs = [];
  const original = snapshot(); const before = JSON.stringify(original);
  const provider = async (url, opts) => {
    requests.push({ url, opts });
    if (failed || marketstack && url.includes('alphavantage') || partial && !url.includes('marketstack') && !url.includes('%5ENGSE') && !url.includes('%5EJN0U.JO')) throw new Error('SYNTHETIC-SECRET ' + url);
    if (url.includes('marketstack')) return { json: async () => ({ data: [
      { symbol: 'NGXASI.NGA', close: 120, open: 100, volume: 0, date: undated ? null : day },
      { symbol: 'J200.JSE', close: 140, open: 100, volume: 0, date: undated ? null : day }
    ] }) };
    return { json: async () => ({ 'Global Quote': { '05. price': '120', '07. latest trading day': undated ? null : day } }) };
  };
  const base = load('_shared/scraper-base.js', {
    './data-store': { getData: async () => original,
      setData: async (key, value) => { if (!storageFails) writes.push({ key, value }); return !storageFails; },
      updateMeta: async (key, value) => metadata.push({ key, value }) },
    './storage-diagnostics': { storageDiagnostic: () => 'Synthetic storage unavailable' },
    './scraper-request': { fetchWithRetry: provider }
  }, { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-only' }, logs,
    fetch: async (url, opts) => { if (url.endsWith('/scraper_runs')) runs.push(JSON.parse(opts.body)); return { ok: true }; } });
  const owner = load('scheduled-fetch-stocks.js', {
    './_shared/scraper-base': base, './_shared/stock-observations': qualified
  }, { env: { ALPHA_VANTAGE_KEY: 'SYNTHETIC-SECRET', MARKETSTACK_KEY: 'SYNTHETIC-SECRET /+' }, logs });
  return { owner, writes, metadata, runs, requests, logs, original, before };
}

test('reference-only and legacy all-null prices never become dated/current from a fetch clock', () => {
  const data = snapshot([ { ...row(), price: null, source: 'reference-only' }, { ...row('JSE', 'ZA'), price: null, source: 'reference-only' } ]);
  const result = classify(data);
  assert.equal(result.status, 'offline'); assert.equal(result.availability, 'reference-only');
  assert.equal(result.count, 0); assert.equal(result.reference_count, 2);
  assert.equal(result.timestamp, null); assert.equal(result.current_prices, false); assert.equal(result.confidence, null);
  assert.equal(result.collected_at, NOW); assert.equal(JSON.stringify(data), JSON.stringify(snapshot(data.indices)));
});

test('finite price without provider date is unverified, including plausible legacy prices', () => {
  for (const day of [null, undefined, '', 'invalid', '2026-02-30', '2026-10-17', '2026-10-15T00:00:00Z']) {
    const result = classify(snapshot([{ ...row(), last_trading_day: day }]));
    assert.equal(result.count, 0); assert.equal(result.availability, 'unverified');
    assert.equal(result.timestamp, null); assert.equal(result.status, 'offline');
  }
});

test('null, nonfinite, negative, zero and textual prices do not enter quote arrays', () => {
  for (const price of [null, undefined, NaN, Infinity, -1, 0, '120']) {
    const result = classify(snapshot([{ ...row(), price }]));
    assert.equal(result.count, 0); assert.equal(result.invalid_count, 1);
  }
  assert.equal(classify(snapshot([{ ...row(), source: 'unknown-provider' }])).count, 0);
  assert.equal(classify(snapshot([null, {}])).invalid_count, 2);
});

test('mixed payload excludes unsupported rows and labels partial coverage', () => {
  const data = snapshot([row(), row('JSE', 'ZA'), { ...row('NSE', 'KE'), source: 'reference-only', price: null },
    { ...row('GSE', 'GH'), last_trading_day: null }, null]);
  const before = JSON.stringify(data), result = classify(data);
  assert.equal(result.count, 2); assert.equal(result.input_count, 5); assert.equal(result.excluded_count, 3);
  assert.equal(result.reference_count, 1); assert.equal(result.undated_count, 1); assert.equal(result.invalid_count, 1);
  assert.equal(result.availability, 'partial'); assert.equal(result.status, 'stale');
  assert.equal(JSON.stringify(data), before);
});

test('date-only precision exposes conservative bounds, not a fictional midnight quote', () => {
  const result = classify(snapshot());
  assert.equal(result.timestamp, '2026-10-15'); assert.equal(result.observation_precision, 'date');
  assert.equal(result.oldest_observation_date, '2026-10-15');
  assert.equal(result.age_lower_bound_minutes, 720); assert.equal(result.age_upper_bound_minutes, 2160);
  assert.equal(result.status, 'ok'); assert.equal(result.current_prices, false);
  assert.equal(result.indices[0].last_trading_day, '2026-10-15');
  assert.equal(Object.hasOwn(result.indices[0], 'observed_at'), false);
  assert.equal(result.indices[0].change, 0); assert.equal(result.indices[0].volume, 0);
});

test('oldest actual provider day controls batch age; a new fetch cannot refresh it', () => {
  const result = classify(snapshot([row(), row('JSE', 'ZA', '2026-10-01')]));
  assert.equal(result.timestamp, '2026-10-01'); assert.equal(result.status, 'offline');
  assert.equal(result.collected_at, NOW); assert.equal(result.newest_observation_date, '2026-10-15');
  const stale = classify(snapshot([row('NGX', 'NG', '2026-10-13')]));
  assert.equal(stale.status, 'stale'); assert.equal(stale.current_prices, false);
});

test('collector minimum requires two distinct dated exchanges', () => {
  assert.throws(() => qualified.buildSnapshot([row(), row()], NOW), /Insufficient dated/);
  assert.throws(() => qualified.buildSnapshot([{ ...row(), last_trading_day: null }], NOW), /Insufficient dated/);
  const value = qualified.buildSnapshot([row(), row('JSE', 'ZA')], NOW);
  assert.equal(value.record_count, 2); assert.equal(value.timestamp, '2026-10-15'); assert.equal(value.collected_at, NOW);
});

test('all provider failures preserve previous payload and cannot use reference as successful data', async () => {
  const c = collector({ failed: true }), result = await c.owner.handler({});
  assert.equal(result.statusCode, 500); assert.equal(c.writes.length, 0);
  assert.equal(JSON.stringify(c.original), c.before);
  assert.ok(c.runs.some(run => run.status === 'error'));
  assert.ok(c.metadata.some(update => update.value.status === 'stale'));
  assert.ok(c.logs.every(line => !line.includes('SYNTHETIC-SECRET') && !line.includes('access_key=')));
  assert.ok(c.requests.every(request => new URL(request.url).protocol === 'https:'));
  assert.ok(c.requests.some(request => request.url.includes('marketstack') && request.opts.redirect === 'error'));
});

test('successful provider observations retain provider day and collection clock separately', async () => {
  const c = collector(), result = await c.owner.handler({});
  assert.equal(result.statusCode, 200); assert.equal(c.writes.length, 1);
  const value = c.writes[0].value;
  assert.equal(value.timestamp, '2026-10-15'); assert.equal(value.collected_at, NOW);
  assert.equal(value.current_prices, false); assert.equal(value.status, 'ok');
  assert.equal(value.indices.length, 5); assert.ok(value.indices.every(r => Number.isFinite(r.price) && r.last_trading_day));
});

test('missing provider dates cannot be a successful quote collection', async () => {
  const c = collector({ undated: true }), result = await c.owner.handler({});
  assert.equal(result.statusCode, 500); assert.equal(c.writes.length, 0);
  assert.equal(JSON.stringify(c.original), c.before);
});

test('MarketStack fallback uses HTTPS, encoded key, no redirects/downgrade or keybearing logs', async () => {
  const c = collector({ marketstack: true }), result = await c.owner.handler({});
  assert.equal(result.statusCode, 200);
  const req = c.requests.find(req => req.url.includes('marketstack'));
  const url = new URL(req.url);
  assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'api.marketstack.com');
  assert.equal(url.pathname, '/v1/eod/latest'); assert.equal(req.opts.redirect, 'error');
  assert.equal(url.searchParams.get('access_key'), 'SYNTHETIC-SECRET /+');
  assert.ok(c.logs.every(line => !line.includes('SYNTHETIC-SECRET') && !line.includes('access_key=')));
  assert.ok(c.writes[0].value.indices.every(r => r.source === 'marketstack'));
});

test('storage failure uses unchanged shared last-known-good behavior', async () => {
  const c = collector({ storageFails: true }), result = await c.owner.handler({});
  assert.equal(result.statusCode, 503); assert.equal(c.writes.length, 0);
  assert.equal(JSON.stringify(c.original), c.before);
  assert.ok(c.runs.some(run => run.status === 'error' && run.error_message === 'Persistence failed'));
});

test('API returns503 for reference, undated, invalid and missing data with explicit unavailable metadata', async () => {
  for (const payload of [null, snapshot([{ ...row(), source: 'reference-only', price: null }]),
    snapshot([{ ...row(), last_trading_day: null }]), snapshot([null])]) {
    const response = await request(api(payload)), body = JSON.parse(response.body);
    assert.equal(response.statusCode, 503); assert.equal(body.count, 0);
    assert.deepEqual(body.indices, []); assert.equal(body.current_prices, false);
    assert.equal(body.status, 'offline'); assert.equal(body.timestamp, null);
  }
});

test('API preserves existing quote columns/filters and explicitly reports date precision', async () => {
  const response = await request(api(snapshot()), { country: 'NG' }), body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200); assert.equal(body.count, 1);
  assert.deepEqual(body.indices[0], row()); assert.equal(body.timestamp, '2026-10-15');
  assert.equal(body.observation_precision, 'date'); assert.equal(body.current_prices, false);
  assert.equal((await request(api(snapshot()), { exchange: 'JSE' })).statusCode, 200);
  assert.equal((await request(api(snapshot()), { exchange: 'UNKNOWN' })).statusCode, 404);
  assert.equal((await request(api(snapshot([null, row()])), { exchange: 'NGX' })).statusCode, 200);
  assert.equal((await request(api(snapshot([{ ...row(), source: 'reference-only', price: null }])), { exchange: 'NGX' })).statusCode, 503);
});

test('API authentication, method and CORS contracts remain intact', async () => {
  const owner = api(snapshot(), { error: 'Synthetic unauthorized', status: 401 });
  assert.equal((await request(owner)).statusCode, 401);
  const preflight = await owner.handler({ httpMethod: 'OPTIONS' });
  assert.equal(preflight.statusCode, 204); assert.equal(preflight.headers['Access-Control-Allow-Origin'], '*');
  assert.equal((await owner.handler({ httpMethod: 'POST' })).statusCode, 405);
});

test('freshness always checks stock payload despite fresh metadata, with no null-price live promotion', async () => {
  const payload = snapshot([{ ...row(), price: null, source: 'reference-only' }]), f = freshness(payload);
  const result = await f.buildCategoryStatus('stocks', f.CATEGORY_CONFIGS.stocks,
    { stocks: { last_fetch: NOW, source: 'Reference', status: 'ok', confidence: 0.7 } }, Date.parse(NOW));
  assert.equal(result.status, 'offline'); assert.equal(result.updatedAt, null);
  assert.equal(result.current_prices, false); assert.equal(result.confidence, null); assert.equal(result.records_count, 0);
});

test('freshness uses source day and preserves last-attempt failure separately', async () => {
  const f = freshness(snapshot());
  const value = await f.buildCategoryStatus('stocks', f.CATEGORY_CONFIGS.stocks,
    { stocks: { last_fetch: NOW, source: 'AlphaVantage', status: 'stale' } }, Date.parse(NOW));
  assert.equal(value.updatedAt, '2026-10-15'); assert.equal(value.status, 'stale');
  assert.equal(value.collection_status, 'stale'); assert.equal(value.observation_precision, 'date');
  let calls = 0;
  const injected = await f.buildCategoryStatus('stocks', f.CATEGORY_CONFIGS.stocks, {}, Date.parse(NOW), async key => {
    calls++; assert.equal(key, 'stock-indices-latest'); return snapshot();
  });
  assert.equal(calls, 1); assert.equal(injected.status, 'ok'); assert.notEqual(injected.status, 'live');
});

test('regressed provider days retain the previous good payload, rather than overwrite with a newly fetched old quote', async () => {
  const c = collector({ day: '2026-10-01' }), result = await c.owner.handler({});
  assert.equal(result.statusCode, 200); assert.match(result.body, /anomaly/);
  assert.equal(c.writes.length, 0); assert.equal(JSON.stringify(c.original), c.before);
  assert.ok(c.runs.some(run => run.status === 'anomaly'));
});

test('mixed API payload keeps valid row shape and exposes partial coverage instead of null quotes', async () => {
  const payload = snapshot([row(), null, { ...row('JSE', 'ZA'), source: 'reference-only', price: null }]);
  const response = await request(api(payload)), body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200); assert.equal(body.count, 1); assert.deepEqual(body.indices[0], row());
  assert.equal(body.availability, 'partial'); assert.equal(body.status, 'stale'); assert.equal(body.excluded_count, 2);
});


test('valid data country misses and mismatched filters preserve empty200; invalid selected rows remain503', async () => {
  for (const params of [{ country: 'UG' }, { country: 'UNKNOWN' }, { exchange: 'NGX', country: 'ZA' }]) {
    const response = await request(api(snapshot()), params), body = JSON.parse(response.body);
    assert.equal(response.statusCode, 200); assert.deepEqual(body.indices, []); assert.equal(body.count, 0);
  }
  const response = await request(api(snapshot([row(), { ...row('JSE', 'ZA'), last_trading_day: null }])), {country:'ZA'});
  assert.equal(response.statusCode, 503);
});

test('actual collector preserves requested-versus-qualified coverage across save and later reads', async () => {
  for (const options of [{ partial: true }, { marketstack: true }]) {
    const c = collector(options), response = await c.owner.handler({});
    assert.equal(response.statusCode, 200); const saved = c.writes[0].value;
    assert.equal(saved.count, 2); assert.equal(saved.availability, 'partial'); assert.equal(saved.status, 'stale');
    assert.equal(saved.collection_coverage.requested_count, options.marketstack ? 6 : 5);
    assert.equal(saved.collection_coverage.qualified_count, 2);
    assert.equal(saved.collection_coverage.unavailable_count, options.marketstack ? 4 : 3);
    const later = classify(saved); assert.deepEqual(clone(later.collection_coverage), clone(saved.collection_coverage));
    assert.equal(later.availability, 'partial');
    const apiResponse = await request(api(saved),{country:'NG'}), body = JSON.parse(apiResponse.body);
    assert.equal(apiResponse.statusCode, 200); assert.equal(body.count, 1);
    assert.equal(body.collection_coverage.qualified_count, 2); assert.equal(body.availability, 'partial');
  }
});

test('public health stock status qualifies payload provider days instead of metadata fetch time', async () => {
  for (const payload of [snapshot([row('NGX','NG','2026-10-01')]), snapshot([{...row(),price:null,source:'reference-only'}]), null]) {
    const owner = load('api-v1.js', {
      './_lib/cache': {}, './_shared/api-auth': { validateApiKey: async () => ({tier:'free'}) },
      './_shared/data-store': {getData:async key => key==='meta'?{stocks:{status:'ok',last_fetch:NOW}}:key==='stock-indices-latest'?payload:null},
      './_shared/stock-observations': qualified,
      './_shared/shipping-reference': {referenceStatus:()=>({status:'offline'})}, './scheduled-fetch-shipping':{_referenceCatalog:{}},
      './_shared/agri-reference': {referenceStatus:()=>({status:'offline'})}, './_shared/reference-feeds':{KEYS:{}}
    });
    const response = await owner.handler({httpMethod:'GET',path:'/api/v1/health',queryStringParameters:{}});
    assert.equal(response.statusCode, 200); const value = JSON.parse(response.body).categories.stocks;
    assert.equal(value.status,'offline'); assert.equal(value.current_prices,false);
    assert.equal(value.last_updated,payload&&payload.indices[0].price?'2026-10-01':null);
    assert.notEqual(value.age_minutes,0);
  }
});

// Complete request/collector/orchestrator owners with synthetic transport and
// persistence boundaries. No credential or real provider/DB request is used.
const PRIVATE_DIAGNOSTIC_MARKER = 'SYNTHETIC_PRIVATE_ACCOUNT_MARKER';
function diagnosticRuntime(name, mocks, { env = {}, fetch, logs }) {
  const file = path.join(ROOT, 'netlify/functions', name), module = { exports: {} };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [NOW])); } static now() { return Date.parse(NOW); } }
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    module, exports: module.exports, Date: Clock, URL, Set, Map, Buffer, Response, AbortController,
    setTimeout, clearTimeout, process: { env }, fetch,
    console: Object.fromEntries(['log', 'warn', 'error'].map(key => [key, (...x) => logs.push(x.join(' '))])),
    require(id) { if (Object.hasOwn(mocks, id)) return mocks[id]; throw new Error('Unexpected dependency ' + id); }
  }, { filename: file });
  return module.exports;
}
function diagnosticCollector({ missingKeys = false, respond } = {}) {
  const writes = [], metadata = [], runs = [], requests = [], logs = [];
  const original = snapshot(), before = JSON.stringify(original);
  const upstream = diagnosticRuntime('_shared/scraper-request.js', {}, { logs, fetch: async (url, opts) => {
    requests.push({ url, opts });
    if (respond) return respond(url, opts);
    return new Response(JSON.stringify(url.includes('alphavantage') ? { 'Global Quote': { '05. price': '120', '07. latest trading day': '2026-10-15' } } : { data: [
      { symbol: 'NGXASI.NGA', close: 120, open: 100, date: '2026-10-15' },
      { symbol: 'J200.JSE', close: 140, open: 100, date: '2026-10-15' }
    ] }));
  } });
  const base = diagnosticRuntime('_shared/scraper-base.js', {
    './data-store': { getData: async () => original, setData: async (key, value) => { writes.push({ key, value }); return true; },
      updateMeta: async (key, value) => metadata.push({ key, value }) },
    './storage-diagnostics': { storageDiagnostic: () => 'Synthetic storage unavailable' },
    './scraper-request': upstream
  }, { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-only' }, logs,
    fetch: async (url, opts) => { if (url.endsWith('/scraper_runs')) runs.push(JSON.parse(opts.body)); return { ok: true }; } });
  const owner = diagnosticRuntime('scheduled-fetch-stocks.js', {
    './_shared/scraper-base': base, './_shared/stock-observations': qualified
  }, { env: missingKeys ? {} : { ALPHA_VANTAGE_KEY: PRIVATE_DIAGNOSTIC_MARKER, MARKETSTACK_KEY: PRIVATE_DIAGNOSTIC_MARKER }, logs });
  return { owner, base, writes, metadata, runs, requests, logs, original, before };
}
function diagnosticsStayPrivate(c) {
  const exposed = JSON.stringify({ logs: c.logs, metadata: c.metadata, runs: c.runs });
  for (const forbidden of [PRIVATE_DIAGNOSTIC_MARKER, 'apikey=', 'access_key=', 'Authorization', 'https://']) assert.ok(!exposed.includes(forbidden), forbidden);
}
async function failedDiagnostic(c) {
  const result = await c.owner.handler({});
  assert.equal(result.statusCode, 500); assert.equal(c.writes.length, 0);
  assert.equal(JSON.stringify(c.original), c.before);
  assert.equal(c.metadata.at(-1).value.status, 'stale');
  assert.equal(c.metadata.at(-1).value.error, 'All sources failed');
  const run = c.runs.at(-1); assert.equal(run.status, 'error'); assert.equal(run.records_count, 0);
  diagnosticsStayPrivate(c); return run.error_message;
}
test('actual collector persists distinct missing-configuration labels without attempting upstream requests', async () => {
  const c = diagnosticCollector({ missingKeys: true }), message = await failedDiagnostic(c);
  assert.equal(c.requests.length, 0);
  assert.equal(message, 'All sources failed; AlphaVantage:MISSING_CONFIG; MarketStack:MISSING_CONFIG');
});
for (const status of [401, 429, 503]) test('actual request and collector retain sanitized HTTP ' + status + ' without reading rejected bodies', async () => {
  let reads = 0;
  const c = diagnosticCollector({ respond: async () => {
    const response = new Response(PRIVATE_DIAGNOSTIC_MARKER, { status, headers: { 'X-Synthetic-Account': PRIVATE_DIAGNOSTIC_MARKER } });
    response.arrayBuffer = async () => { reads++; throw Error('Rejected body must never be read'); }; return response;
  } });
  const message = await failedDiagnostic(c);
  assert.equal(reads, 0); assert.match(message, new RegExp('UPSTREAM_HTTP_ERROR\\(' + status + '\\)'));
  assert.match(message, /AlphaVantage:INSUFFICIENT_DATED_OBSERVATIONS requested=5 qualified=0/);
  assert.match(message, /causes=UPSTREAM_HTTP_ERROR/); assert.match(message, /MarketStack:UPSTREAM_HTTP_ERROR/);
  assert.equal(c.requests.length, status === 401 ? 6 : 8, 'original retry policy is preserved');
});
test('actual response decoding reports its fixed type without raw malformed JSON', async () => {
  const c = diagnosticCollector({ respond: async () => new Response(PRIVATE_DIAGNOSTIC_MARKER) });
  const message = await failedDiagnostic(c); assert.match(message, /UPSTREAM_BODY_ERROR/); assert.ok(!message.includes(PRIVATE_DIAGNOSTIC_MARKER));
});
test('actual request network failures remain typed without transport message or URL disclosure', async () => {
  const c = diagnosticCollector({ respond: async () => { throw Error(PRIVATE_DIAGNOSTIC_MARKER + ' https://private.example/?access_key=secret'); } });
  assert.match(await failedDiagnostic(c), /UPSTREAM_NETWORK_ERROR/);
});
test('provider error envelopes are distinguished without claiming an unobserved account/quota cause', async () => {
  const c = diagnosticCollector({ respond: async url => new Response(JSON.stringify(url.includes('alphavantage')
    ? { Information: PRIVATE_DIAGNOSTIC_MARKER } : { error: { code: PRIVATE_DIAGNOSTIC_MARKER, message: PRIVATE_DIAGNOSTIC_MARKER } })) });
  assert.match(await failedDiagnostic(c), /PROVIDER_ERROR_RESPONSE/);
});
test('empty successful responses retain no-data diagnostics and last-known-good state', async () => {
  const c = diagnosticCollector({ respond: async url => new Response(JSON.stringify(url.includes('alphavantage') ? {} : { data: [] })) });
  assert.match(await failedDiagnostic(c), /PROVIDER_NO_DATA/);
});
test('undated quotes report insufficient qualified counts without becoming fresh observations', async () => {
  const c = diagnosticCollector({ respond: async url => new Response(JSON.stringify(url.includes('alphavantage')
    ? { 'Global Quote': { '05. price': '120' } } : { data: [
      { symbol: 'NGXASI.NGA', close: 120, open: 100 }, { symbol: 'J200.JSE', close: 140, open: 100 }
    ] })) });
  const message = await failedDiagnostic(c);
  assert.match(message, /AlphaVantage:INSUFFICIENT_DATED_OBSERVATIONS requested=5 qualified=0/);
  assert.match(message, /MarketStack:INSUFFICIENT_DATED_OBSERVATIONS requested=6 qualified=0/);
});
test('successful dated fallback remains successful while the primary HTTP diagnostic stays secret-free', async () => {
  const c = diagnosticCollector({ respond: async url => url.includes('alphavantage') ? new Response(PRIVATE_DIAGNOSTIC_MARKER, { status: 401 }) : new Response(JSON.stringify({ data: [
    { symbol: 'NGXASI.NGA', close: 120, open: 100, date: '2026-10-15' },
    { symbol: 'J200.JSE', close: 140, open: 100, date: '2026-10-15' }
  ] })) });
  assert.equal((await c.owner.handler({})).statusCode, 200); assert.equal(c.writes.length, 1);
  assert.equal(c.writes[0].value.count, 2); assert.equal(c.writes[0].value.current_prices, false);
  assert.equal(c.runs.at(-1).source, 'MarketStack'); assert.equal(c.runs.at(-1).error_message, null);
  assert.ok(c.logs.some(line => line.includes('UPSTREAM_HTTP_ERROR(401)'))); diagnosticsStayPrivate(c);
});
test('stock diagnostic labels are finite and never serialize arbitrary error/provider/detail values', () => {
  const c = diagnosticCollector(), unsafe = { code: PRIVATE_DIAGNOSTIC_MARKER, message: PRIVATE_DIAGNOSTIC_MARKER,
    url: PRIVATE_DIAGNOSTIC_MARKER, status: 999999, stockCollection: { requested_count: Infinity, qualified_count: PRIVATE_DIAGNOSTIC_MARKER, causes: Array.from({ length: 100 }, () => ({ code: PRIVATE_DIAGNOSTIC_MARKER })) } };
  assert.equal(c.base.stockProviderDiagnostic(PRIVATE_DIAGNOSTIC_MARKER, unsafe), 'unlisted:UNKNOWN causes=UNKNOWNx10');
});
test('non-opted-in shared collectors preserve their exact generic failure and metadata contract', async () => {
  const c = diagnosticCollector();
  const response = await c.base.runScraper({ id: 'synthetic-other', blobKey: 'synthetic-other-latest', metaKey: 'synthetic-other',
    sources: [{ name: 'Synthetic', fn: async () => { const error = Error(PRIVATE_DIAGNOSTIC_MARKER); error.code = 'UPSTREAM_HTTP_ERROR'; error.status = 401; throw error; } }] });
  assert.equal(response.statusCode, 500); assert.equal(c.runs.at(-1).error_message, 'All sources failed');
  assert.equal(c.metadata.at(-1).value.error, 'All sources failed'); assert.equal(c.writes.length, 0); diagnosticsStayPrivate(c);
});
