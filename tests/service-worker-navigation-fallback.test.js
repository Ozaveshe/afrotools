const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.AFROTOOLS_SW_SOURCE || path.join(__dirname, '..', 'service-worker.js'), 'utf8');

function worker(cacheMatch, network = async () => { throw new TypeError('Offline'); }) {
  const listeners = {};
  const context = {
    self: { location: { origin: 'https://afrotools.test' }, addEventListener(type, listener) { listeners[type] = listener; } },
    caches: { match: cacheMatch, open: async () => ({ put: async () => {} }) }, fetch: network, URL, Response
  };
  vm.runInNewContext(source, context, { filename: 'service-worker.js' });
  return async (pathname, mode = 'navigate', redirect = 'manual') => {
    const request = { method: 'GET', url: 'https://afrotools.test' + pathname, mode, redirect,
      headers: new Headers({ accept: mode === 'navigate' ? 'text/html' : '*/*' }) };
    let intercepted = false, result;
    listeners.fetch({ request, respondWith(value) { intercepted = true; result = Promise.resolve(value); } });
    return { intercepted, response: intercepted ? await result : undefined };
  };
}

(async () => {
  // A real followed HTTP redirect gives the Response the same redirect
  // metadata observed in the deployed /offline.html -> /offline precache.
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { location: '/offline' }); res.end(); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8',
      'content-security-policy': "default-src 'self'", 'x-offline-proof': 'retained' });
    res.end('<h1>Offline recovery</h1>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const redirected = await fetch('http://127.0.0.1:' + server.address().port + '/redirect');
    assert.equal(redirected.redirected, true, 'fixture must really follow a redirect');
    for (const cacheHit of ['fallback', 'requested-page']) {
      const calls = [];
      const run = worker(async request => {
        const key = typeof request === 'string' ? request : request.url;
        calls.push(key);
        if (cacheHit === 'requested-page' || key === '/offline.html') return redirected.clone();
        return undefined;
      });
      const { response } = await run('/not-yet-visited/');
      assert.equal(response.redirected, false, cacheHit + ' must be navigation-safe');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'text/html; charset=UTF-8');
      assert.equal(response.headers.get('content-security-policy'), "default-src 'self'");
      assert.equal(response.headers.get('x-offline-proof'), 'retained');
      assert.equal(await response.text(), '<h1>Offline recovery</h1>');
      assert.equal(calls.length, cacheHit === 'fallback' ? 2 : 1);
    }
    const plain = new Response('Previously loaded page', { status: 200 });
    const plainResult = await worker(async () => plain)('/cached/');
    assert.equal(plainResult.response, plain, 'non-redirected cached responses remain unchanged');
    const networkResponse = new Response('Fresh page');
    const networkResult = await worker(async () => { throw Error('Cache should not be read'); }, async () => networkResponse)('/online/');
    // Successful navigation also schedules its original cache write.
    assert.equal(networkResult.response, networkResponse);
    for (const pathname of ['/api/auth/session', '/.netlify/functions/private', '/supabase-proxy/rest/v1/data', '/mc-7a2f9x']) {
      const result = await worker(async () => { throw Error('Excluded request must not access cache'); })(pathname);
      assert.equal(result.intercepted, false, pathname + ' remains network-only');
    }
    let reviewedCacheReads = 0;
    const reviewed = worker(async () => { reviewedCacheReads++; return plain; });
    await assert.rejects(() => reviewed('/data/jamb/revoked.json', 'cors', 'follow'), /Offline/);
    assert.equal(reviewedCacheReads, 0, 'reviewed-question revocation cannot fall back to cache');
    console.log('service-worker-navigation-fallback: redirect body/header preservation, cached page, exclusions and reviewed-data guards passed');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
