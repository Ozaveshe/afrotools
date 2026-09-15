'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const snapshot = require('./fixtures/afrorates-evidence-2026-09-08.json');
const committed = require('../data/rates/latest.json');
let activeSnapshot = snapshot;

test.beforeEach((t) => {
  activeSnapshot = snapshot;
  t.mock.timers.enable({ apis: ['Date'], now: new Date(snapshot.timestamp).getTime() });
});

function mockModule(relative, exports) {
  const resolved = require.resolve(path.resolve(__dirname, '..', 'netlify', 'functions', relative));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

mockModule('_shared/data-store.js', { getData() { return activeSnapshot; } });
mockModule('_lib/cache.js', {
  async getOrFetch() { return { data: structuredClone(activeSnapshot), fromCache: true }; },
  cacheHeaders(_options, _cached, headers) { return headers; },
});
mockModule('utils/cors.js', { getAllowedOrigin() { return 'https://afrotools.com'; } });
mockModule('utils/api-auth.js', {
  async validateApiKey() { return { valid: false, status: 401 }; },
  rateLimitHeaders() { return {}; },
  authErrorBody() { return { error: 'unauthorized' }; },
});
mockModule('_shared/with-api.js', { withApi(handler) { return handler; } });

const { handler } = require('../netlify/functions/api-rates');

async function request(params) {
  const response = await handler({
    httpMethod: 'GET',
    headers: { 'x-forwarded-for': '127.0.0.' + Math.floor(Math.random() * 200 + 1) },
    queryStringParameters: params || {},
  });
  return { statusCode: response.statusCode, body: JSON.parse(response.body) };
}

test('rates API preserves the strict thirteen-row subset in the fixed evidence fixture', async () => {
  const response = await request();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data_policy, 'fail_closed_official_policy_rows');
  assert.deepEqual(response.body.coverage, {
    candidate_count: 15,
    verified_policy_count: 13,
    withheld_policy_count: 2,
    partial: true,
  });
  assert.deepEqual(response.body.countries.map((row) => row.code).sort(), ['BW', 'CI', 'EG', 'ET', 'GH', 'KE', 'MA', 'MU', 'NG', 'SN', 'TZ', 'UG', 'ZA']);
  assert.ok(response.body.countries.every((row) => row.policy_rate_source_url && row.policy_rate_source_date && row.policy_rate_verified_at));
});

test('rates API follows the committed verified subset when source coverage changes', async (t) => {
  activeSnapshot = committed;
  t.mock.timers.setTime(new Date(committed.timestamp).getTime());
  const response = await request();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data_policy, 'fail_closed_official_policy_rows');
  assert.deepEqual(response.body.countries.map((row) => row.code).sort(), committed._verification.verified_codes.slice().sort());
  assert.deepEqual(response.body.coverage, {
    candidate_count: committed.countries.length,
    verified_policy_count: committed._verification.verified_count,
    withheld_policy_count: committed.countries.length - committed._verification.verified_count,
    partial: committed._verification.partial,
  });
});

test('rates API withholds labeled rows when official evidence is removed', async () => {
  activeSnapshot = structuredClone(snapshot);
  delete activeSnapshot.countries.find((row) => row.code === 'NG').policy_rate_source_url;
  const response = await request({ country: 'NG' });
  assert.equal(response.statusCode, 404);
  assert.match(response.body.error, /withheld/i);
});

test('rates API withholds an unverified candidate instead of presenting it as current', async () => {
  const response = await request({ country: 'RW' });
  assert.equal(response.statusCode, 404);
  assert.match(response.body.error, /withheld/i);
});

test('rates API labels annual inflation context and returns no invented yield data', async () => {
  const inflation = await request({ metric: 'inflation' });
  assert.equal(inflation.statusCode, 200);
  assert.match(inflation.body.series, /World Bank annual/i);
  assert.match(inflation.body.comparability_note, /not period-matched/i);
  assert.ok(inflation.body.countries.every((row) => row.annual_inflation && /^\d{4}$/.test(row.annual_inflation.year)));

  const yields = await request({ metric: 'tbills' });
  assert.equal(yields.statusCode, 200);
  assert.equal(yields.body.available, false);
  assert.deepEqual(yields.body.countries, []);
});
