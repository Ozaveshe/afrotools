'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { createRequire } = require('node:module');

const OWNER = process.env.AFROSTREAM_NEWS_SOURCE_PATH || path.join(__dirname, '../netlify/functions/afrostream-news-monitor.js');
const nativeFetch = globalThis.fetch;
const XML = '<rss><channel><item><title>Synthetic historical item</title><guid>synthetic-old-item</guid><link>https://stories.example/synthetic</link><pubDate>Sat, 01 Jan 2000 00:00:00 GMT</pubDate></item></channel></rss>';
const event = { httpMethod: 'GET', headers: { authorization: 'Bearer synthetic-admin-secret' }, queryStringParameters: {} };
const realOutcomes = [];

function fixture(feedFetch, { realTimers = false, feedURL = 'https://feeds.example/synthetic.xml' } = {}) {
  const timers = new Map(), scheduled = [], cleared = [], health = [], runs = [], unexpected = [];
  let nextTimer = 0;
  const context = {
    exports: {}, process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', ADMIN_SECRET: 'synthetic-admin-secret' } },
    require: createRequire(OWNER), console: { error() {}, log() {} }, AbortController, URL,
    setTimeout: realTimers ? setTimeout : (fn, ms) => { const id = ++nextTimer; timers.set(id, fn); scheduled.push(ms); return id; },
    clearTimeout: realTimers ? clearTimeout : id => { cleared.push(id); timers.delete(id); },
    fetch: async (url, options = {}) => {
      if (String(url) === feedURL) return feedFetch(url, options);
      const u = new URL(url), method = options.method || 'GET';
      if (u.origin !== 'https://zpclagtgczsygrgztlts.supabase.co') { unexpected.push(String(url)); throw Error('Unexpected closed-test origin'); }
      if (method === 'GET' && u.pathname === '/rest/v1/as_news_sources') return Response.json([{ id: 101, name: 'Synthetic feed', feed_url: feedURL, category: 'creator-news' }]);
      if (method === 'GET' && u.pathname === '/rest/v1/as_creators') return Response.json([]);
      if (method === 'PATCH' && u.pathname === '/rest/v1/as_news_sources') { health.push(JSON.parse(options.body)); return Response.json([{}]); }
      if (method === 'POST' && u.pathname === '/rest/v1/scraper_runs') { runs.push(JSON.parse(options.body)); return Response.json([{}]); }
      unexpected.push(method + ' ' + u.pathname); throw Error('Unexpected synthetic persistence request');
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(OWNER, 'utf8'), context, { filename: OWNER });
  return { timers, scheduled, cleared, health, runs, unexpected, start: () => context.exports.handler(event) };
}
async function spinUntil(predicate) {
  for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(resolve => setImmediate(resolve)); }
  assert.fail('Closed fixture did not reach its expected actual owner stage');
}
function parseResponse(response) { assert.equal(response.statusCode, 200); return JSON.parse(response.body).data; }
function assertTimeout(f, summary, status) {
  assert.match(summary.errors.join('|'), /feed timeout/);
  assert.equal(f.health.at(-1).last_status_code, status);
  assert.equal(f.health.at(-1).last_error, 'feed timeout');
  assert.equal(f.runs.at(-1).status, 'error');
  assert.match(f.runs.at(-1).error_message, /feed timeout/);
  assert.equal(summary.inserted_news, 0); assert.deepEqual(f.unexpected, []);
}

test('closed: header stall aborts at the unchanged configured9000ms deadline', async () => {
  let started = false, release;
  const f = fixture((_url, { signal }) => new Promise((resolve, reject) => {
    started = true; release = () => resolve(new Response(XML));
    signal.addEventListener('abort', () => reject(new DOMException('Synthetic abort', 'AbortError')), { once: true });
  }));
  const pending = f.start();
  try {
    await spinUntil(() => started); assert.deepEqual(f.scheduled, [9000]); assert.equal(f.timers.size, 1);
    [...f.timers.values()][0](); assertTimeout(f, parseResponse(await pending), null); assert.equal(f.timers.size, 0);
  } finally { if (release) release(); await pending; }
});
test('closed: deadline remains armed after headers until body abort, preserving known200', async () => {
  let bodyStarted = false, release;
  const f = fixture(async (_url, { signal }) => ({ ok: true, status: 200, text: () => new Promise((resolve, reject) => {
    bodyStarted = true; release = () => resolve(XML);
    signal.addEventListener('abort', () => reject(new DOMException('Synthetic body abort', 'AbortError')), { once: true });
  }) }));
  const pending = f.start();
  try {
    await spinUntil(() => bodyStarted); assert.deepEqual(f.scheduled, [9000]);
    assert.equal(f.timers.size, 1, 'actual body read must remain inside the configured deadline');
    [...f.timers.values()][0](); assertTimeout(f, parseResponse(await pending), 200); assert.equal(f.timers.size, 0);
  } finally { if (release) release(); await pending; }
});
test('closed: a completed body clears its timer and retains source success without publishing', async () => {
  const f = fixture(async () => new Response(XML)); const summary = parseResponse(await f.start());
  assert.equal(summary.items_seen, 1); assert.equal(summary.inserted_news, 0); assert.deepEqual(summary.errors, []);
  assert.equal(f.health.at(-1).last_status_code, 200); assert.equal(f.health.at(-1).last_error, null); assert.ok(f.health.at(-1).last_success_at);
  assert.equal(f.runs.at(-1).status, 'ok'); assert.equal(f.timers.size, 0); assert.deepEqual(f.scheduled, [9000]); assert.deepEqual(f.unexpected, []);
});
test('closed: HTTP503 is reported without waiting for an error body or inventing timeout', async () => {
  let reads = 0;const f = fixture(async () => ({ ok: false, status: 503, text: () => { reads++; throw Error('Error body should not be read'); } }));
  const summary = parseResponse(await f.start()); assert.equal(reads, 0); assert.match(summary.errors.join('|'), /HTTP 503/);
  assert.equal(f.health.at(-1).last_status_code, 503); assert.equal(f.health.at(-1).last_error, 'HTTP 503'); assert.equal(f.timers.size, 0); assert.equal(f.runs.at(-1).status, 'error');
});
test('closed: non-abort body errors retain known HTTPstatus and original failure truth', async () => {
  const f = fixture(async () => ({ ok: true, status: 200, text: async () => { throw Error('Synthetic body read failure'); } }));
  const summary = parseResponse(await f.start()); assert.match(summary.errors.join('|'), /Synthetic body read failure/);
  assert.equal(f.health.at(-1).last_status_code, 200); assert.equal(f.health.at(-1).last_error, 'Synthetic body read failure'); assert.equal(f.timers.size, 0);
});
test('closed: failure before headers retains unknown status and clears deadline', async () => {
  const f = fixture(async () => { throw Error('Synthetic connection failure'); });
  const summary = parseResponse(await f.start()); assert.match(summary.errors.join('|'), /Synthetic connection failure/);
  assert.equal(f.health.at(-1).last_status_code, null); assert.equal(f.health.at(-1).last_error, 'Synthetic connection failure'); assert.equal(f.timers.size, 0);
});
test('closed: empty feed body is still an honest no-items error, not a success or timeout', async () => {
  const f = fixture(async () => new Response('<rss><channel></channel></rss>'));
  const summary = parseResponse(await f.start()); assert.match(summary.errors.join('|'), /No RSS\/Atom items found/);
  assert.equal(f.health.at(-1).last_status_code, 200); assert.equal(f.health.at(-1).last_item_count, 0); assert.equal(f.timers.size, 0);
});

async function realLoopback(mode) {
  const sockets = new Set(), guards = new Set(); let requests = 0;
  let safetyResponseFired = 0, ownerAbortObserved = false, ownerAbortElapsedMs = null, safetyTimersCancelledOnAbort = 0;
  const server = http.createServer((req, res) => {
    requests++;
    if (mode === 'headers' || mode === 'body') {
      if (mode === 'body') { res.writeHead(200, { 'Content-Type': 'application/rss+xml' }); res.write('<rss><channel>'); res.flushHeaders(); }
      // Independent fixture safety response bounds a broken baseline. It does
      // not alter the owner's configured9000ms deadline or pretend to abort it.
      const timer = setTimeout(() => { guards.delete(timer); safetyResponseFired++; if (mode === 'headers') res.writeHead(200); res.end(mode === 'body' ? '</channel></rss>' : XML); }, 11000);
      guards.add(timer); res.on('close', () => { clearTimeout(timer); guards.delete(timer); });
      return;
    }
    if (mode === 'http503') { res.writeHead(503, { 'Content-Type': 'text/plain' }); return res.end('Synthetic provider unavailable'); }
    res.writeHead(200, { 'Content-Type': 'application/rss+xml' }); res.write(XML.slice(0, 30));
    const timer = setTimeout(() => { guards.delete(timer); res.end(XML.slice(30)); }, 20);guards.add(timer);
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port, origin = 'http://127.0.0.1:' + port, feedURL = origin + '/synthetic.xml';
  const start = performance.now();
  const f = fixture((url, options) => {
    assert.equal(new URL(url).origin, origin);
    // Observe the actual owner's abort; never cause/replace it or alter fetch.
    // Cancel only the fixture's response timers synchronously, so a queued11s
    // safety response cannot race an already-issued9s abort after a CPU pause.
    options.signal.addEventListener('abort', () => {
      ownerAbortObserved = true; ownerAbortElapsedMs = performance.now() - start;
      for (const timer of guards) { clearTimeout(timer); safetyTimersCancelledOnAbort++; }
      guards.clear();
    }, { once: true });
    return nativeFetch(url, options);
  }, { realTimers: true, feedURL });
  let summary, failure, settlementWatchdog;
  const settlementBound = new Promise((_resolve, reject) => {
    // Independent from the safety-response timers: unexpected non-settlement
    // still reaches finally cleanup before the unchanged15s test-case bound.
    settlementWatchdog = setTimeout(() => reject(Error('Owned fixture nativefetch did not settle within14000ms')), 14000);
  });
  try { summary = parseResponse(await Promise.race([f.start(), settlementBound])); }
  catch (error) { failure = error; }
  finally {
    clearTimeout(settlementWatchdog);
    for (const timer of guards) clearTimeout(timer);guards.clear();
    const closing = [...sockets].map(socket => new Promise(resolve => { socket.once('close', resolve); socket.destroy(); }));
    await new Promise(resolve => server.close(resolve));
    await Promise.all(closing);
    assert.equal(server.listening, false); assert.equal(sockets.size, 0); assert.equal(guards.size, 0);
  }
  const result = { mode, port, elapsedMs: performance.now() - start, requests, health: f.health, runs: f.runs, summary, ownerAbortObserved, ownerAbortElapsedMs, safetyResponseFired, safetyTimersCancelledOnAbort, settlementBoundMs: 14000, serverClosed: !server.listening, socketsRemaining: sockets.size, guardsRemaining: guards.size };
  realOutcomes.push(result);if (failure) throw failure;return { f, summary, result };
}
test('real Nodefetch localhost: header stall aborts at9000ms with owned cleanup', { timeout: 15000 }, async () => {
  const { f, summary, result } = await realLoopback('headers'); assertTimeout(f, summary, null);
  assert.equal(result.ownerAbortObserved, true); assert.equal(result.safetyResponseFired, 0);
  assert.ok(result.ownerAbortElapsedMs >= 8500, 'actual configured9s owner abort must not occur early');assert.equal(result.requests, 1);
});
test('real Nodefetch localhost: body stall aborts at9000ms and retains HTTP200', { timeout: 15000 }, async () => {
  const { f, summary, result } = await realLoopback('body'); assertTimeout(f, summary, 200);
  assert.equal(result.ownerAbortObserved, true); assert.equal(result.safetyResponseFired, 0);
  assert.ok(result.ownerAbortElapsedMs >= 8500, 'actual configured9s owner abort must cover body');assert.equal(result.requests, 1);
});
test('real Nodefetch localhost: chunked successful body completes without publishing', { timeout: 3000 }, async () => {
  const { f, summary, result } = await realLoopback('success'); assert.equal(summary.items_seen, 1);assert.deepEqual(summary.errors, []);
  assert.equal(summary.inserted_news, 0);assert.equal(f.health.at(-1).last_error, null);assert.equal(result.requests, 1);assert.deepEqual(f.unexpected, []);
});
test('real Nodefetch localhost: HTTP503 stays HTTP503 without a spurious timeout', { timeout: 3000 }, async () => {
  const { f, summary, result } = await realLoopback('http503');assert.match(summary.errors.join('|'), /HTTP 503/);
  assert.equal(f.health.at(-1).last_status_code, 503);assert.equal(f.health.at(-1).last_error, 'HTTP 503');assert.equal(result.requests, 1);
});
test.after(() => {
  if (process.env.AFROSTREAM_NEWS_LOCAL_EVIDENCE) fs.writeFileSync(process.env.AFROSTREAM_NEWS_LOCAL_EVIDENCE, JSON.stringify({ owner: OWNER, localOnly: true, cases: realOutcomes }, null, 2) + '\n', { flag: 'wx' });
});
