const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FUNCTION_PATH = path.join(ROOT, 'netlify', 'functions', 'afrostream-creators.js');
const FALLBACK_PATH = path.join(ROOT, 'data', 'afrostream', 'creators-fallback.json');
const PAGE_PATH = path.join(ROOT, 'tools', 'afrostream', 'index.html');
const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGINAL_DATA_KEY = process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;

function loadFunction(serviceKey) {
  if (serviceKey) process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
  delete require.cache[require.resolve(FUNCTION_PATH)];
  return require(FUNCTION_PATH);
}

function response(status, body, headers) {
  const normalized = {};
  Object.keys(headers || {}).forEach(function(key) {
    normalized[key.toLowerCase()] = headers[key];
  });
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return normalized[String(name || '').toLowerCase()] || null;
      }
    },
    text: async function() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    }
  };
}

function event(queryStringParameters) {
  return {
    httpMethod: 'GET',
    headers: { origin: 'https://afrotools.com' },
    queryStringParameters: queryStringParameters || {}
  };
}

test.after(function() {
  global.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_SERVICE_KEY == null) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_SERVICE_KEY;
  if (ORIGINAL_DATA_KEY == null) delete process.env.SUPABASE_DATA_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = ORIGINAL_DATA_KEY;
  delete require.cache[require.resolve(FUNCTION_PATH)];
});

test('fallback manifest is dated, diverse and explicitly non-live', function() {
  const fallback = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8'));
  assert.equal(fallback.source.state, 'fallback');
  assert.equal(fallback.source.snapshot_label, 'April 2026 seed snapshot');
  assert.equal(fallback.source.reviewed_at, '2026-07-27');
  assert.equal(fallback.source.metrics_freshness, 'unverified');
  assert.ok(fallback.creators.length >= 10);
  assert.ok(new Set(fallback.creators.map(function(row) { return row.country; })).size >= 6);
  fallback.creators.forEach(function(row) {
    assert.ok(row.name);
    assert.ok(row.slug);
    assert.ok(row.country);
    assert.ok(row.categories);
    assert.match(row.avatar_url, /^\/assets\/img\/afrostream\/creators\/.+\.webp$/);
  });
});

test('522 HTML upstream response becomes a useful, marked fallback without leaking HTML', async function() {
  const api = loadFunction('test-service-key');
  global.fetch = async function() {
    return response(522, '<!DOCTYPE html><title>Connection timed out</title>', {
      'content-type': 'text/html'
    });
  };

  const result = await api.handler(event({ sort: 'followers', limit: '5' }));
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 200);
  assert.equal(body.success, true);
  assert.equal(body.degraded, true);
  assert.equal(body.source.state, 'fallback');
  assert.equal(body.source.reason, 'upstream_non_json');
  assert.equal(body.source.snapshot_label, 'April 2026 seed snapshot');
  assert.equal(body.source.reviewed_at, '2026-07-27');
  assert.equal(body.source.metrics_freshness, 'unverified');
  assert.equal(body.returned_count, 5);
  assert.deepEqual(body.data.map(function(row) { return row.name; }), [
    'Noor Stars',
    '7amoda Gaming',
    'Diamond Platnumz',
    'Ryan HD',
    'Agbaps'
  ]);
  assert.ok(body.data.every(function(row) {
    return row.source_state === 'fallback'
      && row.source_snapshot_label === 'April 2026 seed snapshot'
      && row.source_metrics_freshness === 'unverified';
  }));
  assert.doesNotMatch(result.body, /<!DOCTYPE/i);
  assert.match(result.headers['Cache-Control'], /max-age=60/);
});

test('network failure fallback keeps country, category and platform filtering useful', async function() {
  const api = loadFunction('test-service-key');
  global.fetch = async function() {
    throw new Error('network unavailable');
  };

  const result = await api.handler(event({
    country: 'KE',
    category: 'Tech',
    platform: 'youtube',
    sort: 'name'
  }));
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 200);
  assert.equal(body.degraded, true);
  assert.equal(body.source.reason, 'upstream_unavailable');
  assert.equal(body.count, 1);
  assert.deepEqual(body.data.map(function(row) { return row.name; }), ['HackerSploit']);
});

test('missing service configuration degrades to the archived sample', async function() {
  const api = loadFunction('');
  global.fetch = async function() {
    assert.fail('upstream fetch should not run without a configured service key');
  };

  const result = await api.handler(event({ country: 'GH' }));
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 200);
  assert.equal(body.degraded, true);
  assert.equal(body.source.reason, 'service_configuration_unavailable');
  assert.deepEqual(body.data.map(function(row) { return row.name; }), ['Wode Maya']);
});

test('healthy JSON upstream data keeps the live response contract', async function() {
  const api = loadFunction('test-service-key');
  let calls = 0;
  global.fetch = async function() {
    calls += 1;
    if (calls === 1) {
      return response(200, [{
        id: 'creator-1',
        name: 'Live Creator',
        slug: 'live-creator',
        country: 'NG',
        is_published: true,
        subscribers: 100
      }], { 'content-range': '0-0/1' });
    }
    return response(200, []);
  };

  const result = await api.handler(event({ limit: '50' }));
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 200);
  assert.equal(body.success, true);
  assert.equal(body.degraded, undefined);
  assert.equal(body.count, 1);
  assert.equal(body.data[0].name, 'Live Creator');
  assert.equal(body.data[0].source_state, undefined);
});

test('unsupported filters still fail closed before any fallback is served', async function() {
  const api = loadFunction('test-service-key');
  global.fetch = async function() {
    assert.fail('upstream fetch should not run for invalid query input');
  };

  const result = await api.handler(event({ platform: 'made-up' }));
  assert.equal(result.statusCode, 400);
  assert.match(result.body, /Unsupported platform filter/);
});

test('hub labels fallback creator rows as an archived stale snapshot', function() {
  const page = fs.readFileSync(PAGE_PATH, 'utf8');
  assert.match(page, /creator\._raw\.source_state === 'fallback'/);
  assert.match(page, /archived sample creators shown \('/);
  assert.match(page, /Audience metrics are not freshness-verified/);
  assert.match(page, /laneHealth\('stale'/);
});
