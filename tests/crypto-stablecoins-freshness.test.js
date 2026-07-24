"use strict";

const assert = require("assert");
const stablecoins = require("../netlify/functions/crypto-stablecoins.js");

function event(overrides = {}) {
  return {
    httpMethod: "GET",
    path: "/.netlify/functions/crypto-stablecoins",
    headers: { origin: "https://afrotools.com" },
    queryStringParameters: { currency: "ngn" },
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

function asset(usd, local, updatedAt, changes = {}) {
  return {
    usd,
    ngn: local,
    zar: local / 80,
    usd_24h_change: changes.usd == null ? 0.01 : changes.usd,
    ngn_24h_change: changes.local == null ? 0.02 : changes.local,
    zar_24h_change: changes.local == null ? 0.02 : changes.local,
    last_updated_at: Date.parse(updatedAt) / 1000,
  };
}

(async () => {
  const originalFetch = global.fetch;
  const realNow = Date.now;
  const now = Date.parse("2026-07-23T06:00:00.000Z");
  Date.now = () => now;

  try {
    stablecoins._test.cache.clear();
    let fetchCalls = 0;
    global.fetch = async url => {
      fetchCalls += 1;
      assert.match(url, /ids=tether%2Cusd-coin%2Cdai/);
      assert.match(url, /vs_currencies=usd%2Cngn/);
      assert.match(url, /include_24hr_change=true/);
      assert.match(url, /include_last_updated_at=true/);
      return response(200, {
        tether: asset(0.9995, 1371, "2026-07-23T05:59:00.000Z"),
        "usd-coin": asset(1.0002, 1372, "2026-07-23T05:58:00.000Z"),
        dai: asset(1, 1373, "2026-07-23T05:29:59.000Z"),
      });
    };

    const fresh = await stablecoins.handler(event());
    assert.equal(fresh.statusCode, 200);
    const body = JSON.parse(fresh.body);
    assert.equal(body.status, "fresh");
    assert.equal(body.scope, "provider_reference_not_exchange_quote");
    assert.equal(body.source.name, "CoinGecko");
    assert.equal(body.currency, "ngn");
    assert.equal(body.count, 2);
    assert.deepEqual(body.data.map(row => row.symbol), ["USDT", "USDC"]);
    assert.equal(body.data[0].pegDistancePercent, (0.9995 - 1) * 100);
    assert.equal(body.sourceUpdatedAt, "2026-07-23T05:58:00.000Z");
    assert.equal(body.freshnessCeilingMinutes, 30);
    assert.equal(body.cache, "miss");
    assert.equal(fresh.headers["X-Cache"], "MISS");

    const cached = await stablecoins.handler(event());
    assert.equal(JSON.parse(cached.body).cache, "hit");
    assert.equal(cached.headers["X-Cache"], "HIT");
    assert.equal(fetchCalls, 1);

    stablecoins._test.cache.clear();
    const unsupported = await stablecoins.handler(event({ queryStringParameters: { currency: "kes" } }));
    assert.equal(unsupported.statusCode, 400);
    assert.deepEqual(JSON.parse(unsupported.body).supportedCurrencies, ["ngn", "zar"]);
    assert.equal(fetchCalls, 1);

    global.fetch = async () => response(200, {
      tether: asset(1, 17, "2026-07-23T05:29:59.000Z"),
      "usd-coin": asset(-1, 17, "2026-07-23T05:59:00.000Z"),
      dai: asset(1, 17, "2026-07-23T06:05:01.000Z"),
    });
    const noFresh = await stablecoins.handler(event({ queryStringParameters: { currency: "zar" } }));
    assert.equal(noFresh.statusCode, 503);
    assert.equal(JSON.parse(noFresh.body).error, "no_fresh_rows");

    stablecoins._test.cache.clear();
    global.fetch = async () => response(429, {}, { "retry-after": "75" });
    const limited = await stablecoins.handler(event());
    assert.equal(limited.statusCode, 429);
    assert.equal(JSON.parse(limited.body).error, "provider_rate_limited");
    assert.equal(limited.headers["Retry-After"], "75");

    stablecoins._test.cache.clear();
    global.fetch = async () => { throw new Error("network down"); };
    const unavailable = await stablecoins.handler(event());
    assert.equal(unavailable.statusCode, 503);
    assert.equal(JSON.parse(unavailable.body).error, "provider_unavailable");
    assert.match(JSON.parse(unavailable.body).message, /No cached, estimated or platform prices/);

    const options = await stablecoins.handler(event({ httpMethod: "OPTIONS" }));
    assert.equal(options.statusCode, 204);
  } finally {
    global.fetch = originalFetch;
    Date.now = realNow;
    stablecoins._test.cache.clear();
  }

  console.log("crypto-stablecoins-freshness: ok");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
