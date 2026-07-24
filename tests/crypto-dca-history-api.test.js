'use strict';

const assert = require('node:assert/strict');
const api = require('../netlify/functions/crypto-dca-history.js');

function event(query = {}, method = 'GET') {
  return {
    httpMethod: method,
    headers: { origin: 'https://afrotools.com' },
    queryStringParameters: {
      asset: 'bitcoin',
      currency: 'ngn',
      from: '2026-07-20',
      to: '2026-07-22',
      ...query,
    },
  };
}

function response(status, body, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: key => headers[String(key).toLowerCase()] || null },
    json: async () => body,
  };
}

(async () => {
  const originalFetch = global.fetch;
  const realNow = Date.now;
  Date.now = () => Date.parse('2026-07-23T12:00:00.000Z');
  try {
    api.__test.responseCache.clear();
    let calls = 0;
    global.fetch = async (url, init) => {
      calls += 1;
      assert.match(url, /coins\/bitcoin\/market_chart\/range/);
      assert.match(url, /vs_currency=ngn/);
      assert.match(url, /interval=daily/);
      assert.equal(Boolean(init.signal), true);
      return response(200, {
        prices: [
          [Date.parse('2026-07-20T00:00:00.000Z'), 10],
          [Date.parse('2026-07-20T00:00:00.000Z'), 11],
          [Date.parse('2026-07-22T00:00:00.000Z'), 20],
          [Date.parse('2026-07-21T00:00:00.000Z'), 15],
        ],
      });
    };
    const fresh = await api.handler(event());
    const freshBody = JSON.parse(fresh.body);
    assert.equal(fresh.statusCode, 200);
    assert.equal(freshBody.status, 'fresh');
    assert.equal(freshBody.cache, 'miss');
    assert.equal(freshBody.prices.length, 3);
    assert.deepEqual(freshBody.prices.map(row => row.price), [11, 15, 20]);
    assert.equal(freshBody.request.rangeDays, 3);
    assert.equal(freshBody.source.endpoint, 'market_chart/range');
    assert.equal(fresh.headers['X-Cache'], 'MISS');

    const cached = await api.handler(event());
    assert.equal(JSON.parse(cached.body).cache, 'hit');
    assert.equal(cached.headers['X-Cache'], 'HIT');
    assert.equal(calls, 1);

    for (const [query, error] of [
      [{ asset: 'solana' }, 'unsupported_asset'],
      [{ currency: 'kes' }, 'unsupported_currency'],
      [{ to: '2026-07-21' }, 'invalid_end_date'],
      [{ from: '2025-07-22' }, 'invalid_range'],
      [{ from: 'bad' }, 'invalid_date'],
    ]) {
      const invalid = await api.handler(event(query));
      assert.equal(invalid.statusCode, 400);
      assert.equal(JSON.parse(invalid.body).error, error);
    }
    assert.equal(calls, 1);

    api.__test.responseCache.clear();
    global.fetch = async () => response(429, {}, { 'retry-after': '60' });
    const limited = await api.handler(event());
    assert.equal(limited.statusCode, 429);
    assert.equal(JSON.parse(limited.body).fallback, 'none');
    assert.equal(limited.headers['Retry-After'], '60');

    api.__test.responseCache.clear();
    global.fetch = async () => response(200, { prices: [['bad', 1]] });
    const malformed = await api.handler(event());
    assert.equal(malformed.statusCode, 502);
    assert.equal(JSON.parse(malformed.body).error, 'invalid_provider_payload');

    api.__test.responseCache.clear();
    global.fetch = async () => { throw new Error('offline'); };
    const unavailable = await api.handler(event());
    assert.equal(unavailable.statusCode, 503);
    assert.equal(JSON.parse(unavailable.body).fallback, 'none');

    assert.equal((await api.handler(event({}, 'POST'))).statusCode, 405);
    assert.equal((await api.handler(event({}, 'OPTIONS'))).statusCode, 204);
  } finally {
    global.fetch = originalFetch;
    Date.now = realNow;
    api.__test.responseCache.clear();
  }
  console.log('crypto-dca-history-api: ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
