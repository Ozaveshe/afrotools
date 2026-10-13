'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const filename = path.resolve(__dirname, '../netlify/functions/afrostream-health.js');
const originalFetch = global.fetch;
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalDataKey = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function load(configured = true) {
  if (configured) process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-health-test-only';
  else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
  delete require.cache[require.resolve(filename)];
  return require(filename);
}
const event = method => ({ httpMethod: method || 'GET', headers: { origin: 'https://afrotools.com' }, queryStringParameters: {} });
const response = (data = [], count = 0, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: name => name === 'content-range' ? '0-0/' + count : null },
  text: async () => JSON.stringify(data)
});
function pending(signal) {
  return new Promise((resolve, reject) => {
    if (!signal) return;
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}
async function bounded(t, run) {
  const budgets = [], timers = [];
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    budgets.push(milliseconds);
    const controller = new AbortController();
    timers.push(setTimeout(() => controller.abort(new DOMException('Synthetic timeout', 'TimeoutError')), 5));
    return controller.signal;
  });
  let guard;
  try {
    const result = await Promise.race([
      run(), new Promise((resolve, reject) => { guard = setTimeout(() => reject(new Error('Health handler stayed pending')), 300); })
    ]);
    return { result, budgets };
  } finally {
    clearTimeout(guard);
    timers.forEach(clearTimeout);
  }
}
test.after(() => {
  global.fetch = originalFetch;
  for (const [key, value] of [['SUPABASE_SERVICE_ROLE_KEY', originalServiceKey], ['SUPABASE_DATA_SERVICE_ROLE_KEY', originalDataKey]]) {
    if (value == null) delete process.env[key]; else process.env[key] = value;
  }
  delete require.cache[require.resolve(filename)];
});

test('stalled parallel health reads reach the original unavailable response', async t => {
  const api = load(), signals = [];
  const proof = await bounded(t, () => {
    global.fetch = (url, options) => { signals.push(options.signal); return pending(options.signal); };
    return api.handler(event());
  });
  assert.deepEqual(proof.budgets, [8000]);
  assert.ok(signals.length > 1);
  assert.equal(new Set(signals).size, 1);
  assert.equal(signals[0].aborted, true);
  assert.equal(proof.result.statusCode, 502);
  const body = JSON.parse(proof.result.body);
  assert.equal(body.success, false);
  assert.equal(body.data, undefined);
});

test('stalled response consumption is covered by the shared health deadline', async t => {
  const api = load();
  const proof = await bounded(t, () => {
    global.fetch = async (url, options) => ({ ...response(), text: () => pending(options.signal) });
    return api.handler(event());
  });
  assert.deepEqual(proof.budgets, [8000]);
  assert.equal(proof.result.statusCode, 502);
  assert.equal(JSON.parse(proof.result.body).success, false);
});

test('the serial snapshot count uses the original deadline rather than a second budget', async t => {
  const api = load(), signals = [];
  let serial = false;
  const proof = await bounded(t, () => {
    global.fetch = async (url, options) => {
      signals.push(options.signal);
      if (url.includes('as_creator_snapshots?snapshot_date=eq.')) { serial = true; return pending(options.signal); }
      if (url.includes('as_creator_snapshots?select=snapshot_date')) return response([{ snapshot_date: '2026-10-13', created_at: '2026-10-13T00:00:00Z' }], 1);
      return response();
    };
    return api.handler(event());
  });
  assert.equal(serial, true);
  assert.deepEqual(proof.budgets, [8000]);
  assert.equal(new Set(signals).size, 1);
  assert.equal(proof.result.statusCode, 502);
  assert.equal(JSON.parse(proof.result.body).success, false);
});

test('a successfully checked empty dataset stays distinct from unavailable health', async () => {
  const api = load();
  global.fetch = async () => response();
  const result = await api.handler(event()), body = JSON.parse(result.body);
  assert.equal(result.statusCode, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.creators.published, 0);
  assert.equal(body.data.streams.total_published, 0);
  assert.equal(body.data.news.total_published, 0);
  assert.equal(body.data.snapshots.latest_snapshot_date, null);
  assert.equal(body.data.snapshots.latest_row_count, 0);
  assert.equal(body.data.automation.sync, null);
  assert.equal(body.error, undefined);
});

test('healthy public counts and dates retain the original aggregate contract', async () => {
  const api = load(), signals = [], now = new Date().toISOString(), day = now.slice(0, 10);
  global.fetch = async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    signals.push(options.signal);
    if (url.includes('as_creators?')) { assert.match(url, /is_published=eq.true/); assert.equal(options.headers.Prefer, 'count=exact'); return response([{ id: 'synthetic-public-row' }], 3); }
    if (url.includes('as_creator_snapshots?snapshot_date=eq.')) return response([{ id: 'synthetic-snapshot-row' }], 3);
    if (url.includes('as_creator_snapshots?')) return response([{ snapshot_date: day, created_at: now }], 3);
    if (url.includes('as_streams?') && url.includes('select=stream_date')) return response([{ stream_date: now, updated_at: now }]);
    if (url.includes('as_streams?')) return response([{ id: 'synthetic-stream-row' }], 2);
    if (url.includes('as_news?') && url.includes('select=published_at')) return response([{ published_at: now, updated_at: now }]);
    if (url.includes('as_news?')) return response([{ id: 'synthetic-news-row' }], 5);
    return response();
  };
  const result = await api.handler(event()), body = JSON.parse(result.body);
  assert.equal(result.statusCode, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.creators.published, 3);
  assert.equal(body.data.snapshots.latest_snapshot_date, day);
  assert.equal(body.data.snapshots.latest_created_at, now);
  assert.equal(body.data.snapshots.latest_row_count, 3);
  assert.equal(body.data.snapshots.expected_creator_count, 3);
  assert.equal(body.data.streams.total_published, 2);
  assert.equal(body.data.streams.live_now, 2);
  assert.equal(body.data.streams.last_24h, 2);
  assert.equal(body.data.streams.latest_stream_date, now);
  assert.equal(body.data.news.total_published, 5);
  assert.equal(body.data.news.last_7d, 5);
  assert.equal(body.data.news.latest_published_at, now);
  assert.equal(new Set(signals).size, 1);
});

test('permission failure never produces successful health', async () => {
  const api = load();
  global.fetch = async () => response({ message: 'Synthetic permission rejection' }, 0, 401);
  const result = await api.handler(event()), body = JSON.parse(result.body);
  assert.equal(result.statusCode, 502);
  assert.equal(body.success, false);
  assert.equal(body.data, undefined);
  assert.match(body.error, /Supabase request failed: Synthetic permission rejection/);
});

test('missing configuration and unsupported methods preserve their original boundaries', async () => {
  const api = load(false);
  global.fetch = async () => assert.fail('Rejected requests must not call the provider');
  assert.equal((await api.handler(event())).statusCode, 500);
  assert.equal((await api.handler(event('POST'))).statusCode, 405);
  const options = await api.handler(event('OPTIONS'));
  assert.equal(options.statusCode, 204);
  assert.equal(options.headers['Access-Control-Allow-Origin'], 'https://afrotools.com');
});

test('concurrent requests have separate deadlines and cannot abort healthy neighbors', async t => {
  const api = load();
  let firstSignal;
  const signals = new Set();
  const proof = await bounded(t, () => {
    global.fetch = async (url, options) => {
      if (!firstSignal) firstSignal = options.signal;
      signals.add(options.signal);
      return options.signal === firstSignal ? pending(options.signal) : response();
    };
    return Promise.all([api.handler(event()), api.handler(event())]);
  });
  assert.deepEqual(proof.budgets, [8000, 8000]);
  assert.equal(signals.size, 2);
  assert.equal(proof.result[0].statusCode, 502);
  assert.equal(JSON.parse(proof.result[0].body).success, false);
  assert.equal(proof.result[1].statusCode, 200);
  assert.equal(JSON.parse(proof.result[1].body).success, true);
});
