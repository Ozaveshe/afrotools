'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const { gzipSync } = require('node:zlib');
const transport = require('../netlify/functions/_shared/seo-safe-fetch.js');
test('AC-7 / EC-7 reserved and mapped destinations fail closed', () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '192.0.0.8', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1', '224.1.1.1', '::1', '::ffff:7f00:1', '::ffff:192.168.1.1', '2001:db8::1', 'fe90::1', 'fc00::1']) assert.equal(transport.isPublicAddress(ip), false, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(transport.isPublicAddress(ip), true, ip);
});
test('AC-7 connection DNS lookup returns only checked addresses and rejects mixed sets', async () => {
  const run = (lookup, all = false) => new Promise((resolve, reject) => lookup('example.com', { all }, (error, address, family) => error ? reject(error) : resolve({ address, family })));
  const lookup = transport.createSafeLookup(async () => [{ address: '8.8.8.8', family: 4 }]);
  assert.deepEqual(await run(lookup), { address: '8.8.8.8', family: 4 });
  assert.deepEqual((await run(lookup, true)).address, [{ address: '8.8.8.8', family: 4 }]);
  await assert.rejects(run(transport.createSafeLookup(async () => [{ address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }])));
  await assert.rejects(run(transport.createSafeLookup(async () => [])));
});
test('AC-7 decoded stream limits reject overflow rather than return partial HTML', async () => {
  assert.equal(await transport.readStream(Readable.from([Buffer.from('abc')]), 3), 'abc');
  await assert.rejects(transport.readStream(Readable.from([Buffer.from('éé')]), 3), /larger/i);
  await assert.rejects(transport.readStream(Readable.from([Buffer.alloc(10), Buffer.alloc(10)]), 15), /larger/i);
});
function fakeRequest(body, headers = {}, status = 200) {
  return (_url, options, callback) => {
    assert.equal(typeof options.lookup, 'function');
    assert.equal(options.agent, false);
    const req = new EventEmitter();
    req.destroy = () => {};
    req.end = () => {
      const stream = body === null ? new Readable({ read() {} }) : Readable.from([body]);
      stream.headers = headers; stream.statusCode = status;
      callback(stream);
    };
    return req;
  };
}
test('AC-7 total-body deadline, decompression and redirect boundaries', async () => {
  await assert.rejects(transport.safeFetch('https://example.com/', { timeoutMs: 20 }, fakeRequest(null)), /exceeded/i);
  await assert.rejects(transport.safeFetch('https://example.com/', { maxBytes: 30 }, fakeRequest(gzipSync(Buffer.alloc(100)), { 'content-encoding': 'gzip' })), /larger/i);
  const response = await transport.safeFetch('https://example.com/', {}, fakeRequest(Buffer.from('ok')));
  assert.equal(await response.text(), 'ok');
  const redirect = await transport.safeFetch('https://example.com/', {}, fakeRequest(null, { location: 'http://127.0.0.1/' }, 302));
  assert.equal(redirect.status, 302);
  await assert.rejects(transport.safeFetch(redirect.headers.get('location')), /reserved/i);
});
