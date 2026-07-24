'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const snapshot = require('../data/rates/latest.json');

function mockModule(relative, exports) {
  const resolved = require.resolve(path.resolve(__dirname, '..', 'netlify', 'functions', relative));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

mockModule('_shared/data-store.js', { getData() { return snapshot; } });
mockModule('_lib/cache.js', {
  async getOrFetch() { return { data: structuredClone(snapshot), fromCache: true }; },
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

test('rates API defaults to the strict six-row policy subset', async () => {
  const response = await request();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data_policy, 'fail_closed_official_policy_rows');
  assert.deepEqual(response.body.coverage, {
    candidate_count: 15,
    verified_policy_count: 6,
    withheld_policy_count: 9,
    partial: true,
  });
  assert.deepEqual(response.body.countries.map((row) => row.code).sort(), ['CI', 'KE', 'MA', 'NG', 'SN', 'ZA']);
  assert.ok(response.body.countries.every((row) => row.policy_rate_source_url && row.policy_rate_source_date && row.policy_rate_verified_at));
});

test('rates API withholds an unverified candidate instead of presenting it as current', async () => {
  const response = await request({ country: 'GH' });
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
