#!/usr/bin/env node
"use strict";
const assert = require("assert");
const { handler } = require("../netlify/functions/crypto-scam.js");

(async () => {
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    const response = await handler({
      httpMethod: method,
      headers: { origin:"https://afrotools.com" },
      queryStringParameters: { q:"sensitive-wallet-reference" },
      body: JSON.stringify({ story:"must not be processed" })
    });
    assert.strictEqual(response.statusCode, 410);
    assert.strictEqual(response.headers["Cache-Control"], "no-store");
    const body = JSON.parse(response.body);
    assert.strictEqual(body.status, "retired");
    assert.strictEqual(body.replacement, "/crypto/scam-checker/");
    assert.ok(!response.body.includes("sensitive-wallet-reference"));
    assert.ok(!response.body.includes("must not be processed"));
  }
  const options = await handler({ httpMethod:"OPTIONS", headers:{ origin:"https://afrotools.com" } });
  assert.strictEqual(options.statusCode, 204);
  assert.strictEqual(options.body, "");
  console.log("crypto scam retired function: ok");
})().catch(error => { console.error(error); process.exitCode = 1; });
