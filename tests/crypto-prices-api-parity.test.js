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
        currency: "zar",
        count: 1,
        fetchedAt: "2026-07-23T06:00:00.000Z",
        sourceUpdatedAt: "2026-07-23T05:59:00.000Z",
        freshnessCeilingMinutes: 30,
        cache: "miss",
        data: [{ id: "bitcoin", current_price: 100 }],
      }),
    };
  };

  try {
    const result = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto/prices",
      headers: {
        origin: "https://afrotools.com",
        "x-forwarded-for": "192.0.2.111",
      },
      queryStringParameters: { currency: "zar", limit: "1" },
    });
    assert.equal(result.statusCode, 200);
    const body = JSON.parse(result.body);
    assert.equal(body.endpoint, "crypto/prices");
    assert.equal(body.status, "fresh");
    assert.equal(body.currency, "zar");
    assert.equal(body.count, 1);
    assert.match(requestedUrl, /currency=zar&limit=1$/);
    assert.doesNotMatch(requestedUrl, /order=|sparkline=|price_change=/);

    global.fetch = async () => ({
      status: 503,
      json: async () => ({
        status: "unavailable",
        error: "no_fresh_rows",
        message: "No fresh rows.",
      }),
    });
    const unavailable = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto/prices",
      headers: {
        origin: "https://afrotools.com",
        "x-forwarded-for": "192.0.2.112",
      },
      queryStringParameters: { currency: "ngn", limit: "100" },
    });
    assert.equal(unavailable.statusCode, 503);
    const unavailableBody = JSON.parse(unavailable.body);
    assert.equal(unavailableBody.endpoint, "crypto/prices");
    assert.equal(unavailableBody.status, "unavailable");
    assert.equal(unavailableBody.error, "no_fresh_rows");

    const discovery = await api.handler({
      httpMethod: "GET",
      path: "/api/crypto",
      headers: {
        origin: "https://afrotools.com",
        "x-forwarded-for": "192.0.2.113",
      },
      queryStringParameters: {},
    });
    const discoveryBody = JSON.parse(discovery.body);
    assert.match(discoveryBody.endpoints.prices.description, /30 minutes/);
    assert.match(discoveryBody.endpoints.prices.params.currency, /ngn, zar/);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("crypto-prices-api-parity: ok");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
