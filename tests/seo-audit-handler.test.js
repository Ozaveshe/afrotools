'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const transport = require('../netlify/functions/_shared/seo-safe-fetch.js');
const { handler } = require('../netlify/functions/seo-audit.js');
const original = transport.safeFetch;
after(() => { transport.safeFetch = original; });
let ip = 0;
const event = (body, httpMethod = 'POST') => ({ httpMethod, headers: { 'x-nf-client-connection-ip': 'fixture-' + (++ip) }, body });
function response(body, status = 200, type = 'text/html') { return { status, ok: status === 200, headers: { get: name => name === 'content-type' ? type : '' }, text: async () => body }; }
test('API contract rejects malformed requests, unsupported methods and private targets', async () => {
  assert.equal((await handler(event('{}', 'DELETE'))).statusCode, 405);
  assert.equal(JSON.parse((await handler(event('{'))).body).code, 'bad_request');
  for (const url of ['file:///secret', 'http://127.0.0.1/', 'https://user:pass@example.com/', 'http://[::ffff:7f00:1]/', 'http://192.0.2.1/']) {
    const r = await handler(event(JSON.stringify({ url })));
    assert.equal(r.statusCode, 400); assert.equal(JSON.parse(r.body).code, 'invalid_url');
  }
});
test('API contract successful HTML audit includes method and limitations; missing companions remain findings', async () => {
  transport.safeFetch = async url => url.endsWith('.txt') || url.endsWith('.xml') ? response('', 404) : response('<html><head><title>Test page</title></head><body><h1>Test</h1></body></html>');
  const r = await handler(event(JSON.stringify({ url: 'https://8.8.8.8/' })));
  assert.equal(r.statusCode, 200);
  const body = JSON.parse(r.body);
  assert.equal(body.methodologyVersion, '2'); assert.equal(body.categories.length, 7);
  assert.ok(body.fetchedAt); assert.ok(body.limitations.length);
});
test('EC-4 / EC-7 failed, non-HTML, oversized and unsafe-redirect fetches return no score', async () => {
  for (const fake of [
    async () => { throw Error('Response exceeded timeout'); },
    async () => response('plain text', 200, 'text/plain'),
    async () => response('x'.repeat(2097153)),
    async () => ({ status: 302, ok: false, headers: { get: () => 'http://127.0.0.1/' } })
  ]) {
    transport.safeFetch = fake;
    const r = await handler(event(JSON.stringify({ url: 'https://8.8.8.8/' })));
    const body = JSON.parse(r.body);
    assert.equal(r.statusCode, 422); assert.equal(body.code, 'fetch_failed'); assert.equal(body.score, undefined);
  }
});
test('API contract returns 429 for the existing connection abuse guard', async () => {
  const request = event('{');
  for (let i = 0; i < 10; i++) assert.equal((await handler(request)).statusCode, 400);
  assert.equal((await handler(request)).statusCode, 429);
});
