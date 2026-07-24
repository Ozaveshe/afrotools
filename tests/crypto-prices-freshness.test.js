"use strict";

const assert = require("assert");
const cryptoPrices = require("../netlify/functions/crypto-prices.js");

function event(overrides = {}) {
  return {
    httpMethod: "GET",
    path: "/.netlify/functions/crypto-prices",
    headers: { origin: "https://afrotools.com" },
    queryStringParameters: { currency: "ngn", limit: "3" },
    ...overrides,
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

function row(id, updatedAt, price = 100) {
  return {
    id,
    name: id[0].toUpperCase() + id.slice(1),
    symbol: id.slice(0, 3),
    current_price: price,
    market_cap_rank: 1,
    last_updated: updatedAt,
  };
}

(async () => {
  const originalFetch = global.fetch;
  const realNow = Date.now;
  const now = Date.parse("2026-07-23T06:00:00.000Z");
  Date.now = () => now;

  try {
    cryptoPrices._test.cache.clear();
    let fetchCalls = 0;
    global.fetch = async url => {
      fetchCalls += 1;
      assert.match(url, /vs_currency=ngn/);
      assert.match(url, /per_page=3/);
      return response(200, [
        row("bitcoin", "2026-07-23T05:59:00.000Z", 1000),
        row("stale", "2026-07-23T05:29:59.000Z", 2),
        row("invalid", "not-a-time", 3),
      ]);
    };

    const fresh = await cryptoPrices.handler(event());
    assert.equal(fresh.statusCode, 200);
    const freshBody = JSON.parse(fresh.body);
    assert.equal(freshBody.status, "fresh");
    assert.equal(freshBody.source.name, "CoinGecko");
    assert.equal(freshBody.currency, "ngn");
    assert.equal(freshBody.count, 1);
    assert.equal(freshBody.requestedLimit, 3);
    assert.equal(freshBody.data[0].id, "bitcoin");
    assert.equal(freshBody.sourceUpdatedAt, "2026-07-23T05:59:00.000Z");
    assert.equal(freshBody.freshnessCeilingMinutes, 30);
    assert.equal(freshBody.cache, "miss");
    assert.equal(fresh.headers["X-Cache"], "MISS");

    const cached = await cryptoPrices.handler(event());
    const cachedBody = JSON.parse(cached.body);
    assert.equal(cached.statusCode, 200);
    assert.equal(cachedBody.cache, "hit");
    assert.equal(cached.headers["X-Cache"], "HIT");
    assert.equal(fetchCalls, 1);

    cryptoPrices._test.cache.clear();
    const unsupported = await cryptoPrices.handler(event({
      queryStringParameters: { currency: "kes", limit: "3" },
    }));
    assert.equal(unsupported.statusCode, 400);
    assert.deepEqual(JSON.parse(unsupported.body).supportedCurrencies, ["ngn", "zar"]);
    assert.equal(fetchCalls, 1);

    const invalidLimit = await cryptoPrices.handler(event({
      queryStringParameters: { currency: "zar", limit: "101" },
    }));
    assert.equal(invalidLimit.statusCode, 400);
    assert.equal(JSON.parse(invalidLimit.body).error, "invalid_limit");
    assert.equal(fetchCalls, 1);

    global.fetch = async () => response(200, [
      row("stale", "2026-07-23T05:29:59.000Z"),
      row("future", "2026-07-23T06:05:01.000Z"),
    ]);
    const noFreshRows = await cryptoPrices.handler(event({
      queryStringParameters: { currency: "zar", limit: "2" },
    }));
    assert.equal(noFreshRows.statusCode, 503);
    assert.equal(JSON.parse(noFreshRows.body).error, "no_fresh_rows");

    cryptoPrices._test.cache.clear();
    global.fetch = async () => response(429, { error: "rate" }, { "retry-after": "90" });
    const limited = await cryptoPrices.handler(event());
    assert.equal(limited.statusCode, 429);
    assert.equal(JSON.parse(limited.body).error, "provider_rate_limited");
    assert.equal(limited.headers["Retry-After"], "90");

    cryptoPrices._test.cache.clear();
    global.fetch = async () => { throw new Error("network down"); };
    const unavailable = await cryptoPrices.handler(event());
    const unavailableBody = JSON.parse(unavailable.body);
    assert.equal(unavailable.statusCode, 503);
    assert.equal(unavailableBody.error, "provider_unavailable");
    assert.match(unavailableBody.message, /No cached or estimated prices/);

    const options = await cryptoPrices.handler(event({ httpMethod: "OPTIONS" }));
    assert.equal(options.statusCode, 204);
  } finally {
    global.fetch = originalFetch;
    Date.now = realNow;
    cryptoPrices._test.cache.clear();
  }

  console.log("crypto-prices-freshness: ok");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
