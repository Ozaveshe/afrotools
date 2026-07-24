"use strict";

const assert = require("assert");
const api = require("../netlify/functions/api-crypto.js");

(async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  global.fetch = async url => {
    requestedUrl = String(url);
    return {
      status: 200,
      json: async () => ({
        status: "fresh",
        source: { name: "CoinGecko", url: "https://www.coingecko.com/" },
        scope: "provider_reference_not_exchange_quote",
        currency: "zar",
        count: 3,
        fetchedAt: "2026-07-23T06:00:00.000Z",
        sourceUpdatedAt: "2026-07-23T05:59:00.000Z",
        freshnessCeilingMinutes: 30,
        cache: "miss",
        data: [{ id: "tether", symbol: "USDT", usdPrice: 1, localPrice: 17 }],
      }),
    };
  };

  try {
    const result = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto/stablecoins",
      headers: { origin: "https://afrotools.com", "x-forwarded-for": "192.0.2.121" },
      queryStringParameters: { currency: "zar" },
    });
    assert.equal(result.statusCode, 200);
    const body = JSON.parse(result.body);
    assert.equal(body.endpoint, "crypto/stablecoins");
    assert.equal(body.scope, "provider_reference_not_exchange_quote");
    assert.equal(body.currency, "zar");
    assert.equal(body.count, 3);
    assert.match(requestedUrl, /crypto-stablecoins\?currency=zar$/);

    global.fetch = async () => ({
      status: 503,
      json: async () => ({ status: "unavailable", error: "no_fresh_rows" }),
    });
    const unavailable = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto/stablecoins",
      headers: { origin: "https://afrotools.com", "x-forwarded-for": "192.0.2.122" },
      queryStringParameters: { currency: "ngn" },
    });
    assert.equal(unavailable.statusCode, 503);
    assert.equal(JSON.parse(unavailable.body).endpoint, "crypto/stablecoins");
    assert.equal(JSON.parse(unavailable.body).error, "no_fresh_rows");

    const discovery = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto",
      headers: { origin: "https://afrotools.com", "x-forwarded-for": "192.0.2.123" },
      queryStringParameters: {},
    });
    const discoveryBody = JSON.parse(discovery.body);
    assert.match(discoveryBody.endpoints.stablecoins.description, /not an exchange or P2P quote/);
    assert.match(discoveryBody.endpoints.stablecoins.params.currency, /ngn, zar/);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("crypto-stablecoins-api-parity: ok");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
