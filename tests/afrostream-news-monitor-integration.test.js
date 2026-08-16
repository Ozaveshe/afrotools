'use strict';

const assert = require('assert');
const test = require('node:test');

const MONITOR_PATH = require.resolve('../netlify/functions/afrostream-news-monitor.js');

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async function() { return JSON.stringify(body); },
  };
}

function feedResponse(sourceNumber) {
  const publishedAt = new Date().toUTCString();
  const xml = [
    '<rss><channel><item>',
    '<title>Test Creator wins African music award ' + sourceNumber + '</title>',
    '<link>https://stories.example/' + sourceNumber + '</link>',
    '<guid>story-' + sourceNumber + '</guid>',
    '<description>Test Creator reaches a verified music milestone in Africa.</description>',
    '<pubDate>' + publishedAt + '</pubDate>',
    '</item></channel></rss>',
  ].join('');
  return {
    ok: true,
    status: 200,
    text: async function() { return xml; },
  };
}

function createFetchHarness(harnessOptions = {}) {
  const state = {
    feedGets: 0,
    newsPosts: 0,
    mentionPosts: 0,
    reservationAttempts: 0,
    reservationPatches: 0,
    reservationPatchBodies: [],
    reservations: new Set(),
    writes: [],
  };

  const sources = Array.from({ length: 6 }, function(_unused, index) {
    const sourceNumber = index + 1;
    return {
      id: sourceNumber,
      name: 'Eligible feed ' + sourceNumber,
      feed_url: 'https://feeds.example/' + sourceNumber + '.xml',
      category: 'creator-news',
    };
  });

  async function fetchMock(url, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const requestUrl = String(url);
    if (method === 'POST' || method === 'PATCH') {
      state.writes.push({ method, url: requestUrl });
    }

    const feedMatch = requestUrl.match(/^https:\/\/feeds\.example\/(\d+)\.xml$/);
    if (feedMatch) {
      state.feedGets++;
      return feedResponse(feedMatch[1]);
    }

    if (requestUrl.includes('/rest/v1/as_news_sources?')) {
      if (harnessOptions.failSourceList) return jsonResponse({ message: 'source list unavailable' }, 503);
      return jsonResponse(sources);
    }
    if (requestUrl.includes('/rest/v1/as_creators?')) {
      return jsonResponse([{ id: 101, name: 'Test Creator', slug: 'test-creator' }]);
    }
    if (method === 'GET' && requestUrl.includes('/rest/v1/as_news?external_id=')) {
      return jsonResponse([]);
    }
    if (method === 'POST' && requestUrl.includes('/rest/v1/as_news?on_conflict=external_id')) {
      const newsId = ++state.newsPosts;
      // Keep all eligible workers in flight so the test exercises the shared
      // reservation boundary rather than accidentally serializing the writes.
      await new Promise(function(resolve) { setTimeout(resolve, 15); });
      return jsonResponse([{ id: newsId }]);
    }
    if (method === 'POST' && requestUrl.includes('/rest/v1/as_news_creator_mentions?')) {
      state.mentionPosts++;
      return jsonResponse([{ id: state.mentionPosts }]);
    }
    if (method === 'PATCH' && requestUrl.includes('/rest/v1/as_news_sources?')) {
      return jsonResponse([{}]);
    }
    if (method === 'POST' && requestUrl.includes('/rest/v1/scraper_runs?on_conflict=id')) {
      state.reservationAttempts++;
      const row = JSON.parse(options.body);
      assert.strictEqual(row.status, 'anomaly');
      assert.strictEqual(row.error_message, 'Scheduled delivery reserved; final status pending');
      assert.match(options.headers.Prefer, /resolution=ignore-duplicates/);
      if (state.reservations.has(row.id)) return jsonResponse([]);
      state.reservations.add(row.id);
      return jsonResponse([row]);
    }
    if (method === 'PATCH' && requestUrl.includes('/rest/v1/scraper_runs?id=eq.')) {
      state.reservationPatches++;
      state.reservationPatchBodies.push(JSON.parse(options.body));
      return jsonResponse([JSON.parse(options.body)]);
    }
    if (method === 'POST' && requestUrl.includes('/rest/v1/scraper_runs')) {
      return jsonResponse([{}]);
    }

    throw new Error('Unexpected mocked request: ' + method + ' ' + requestUrl);
  }

  return { fetchMock, state };
}

function manualEvent(queryStringParameters) {
  return {
    httpMethod: 'GET',
    headers: { authorization: 'Bearer test-admin-secret' },
    queryStringParameters: queryStringParameters || {},
  };
}

function scheduledEvent(nextRun, queryStringParameters) {
  return {
    httpMethod: 'POST',
    headers: { 'x-nf-event': 'schedule' },
    body: JSON.stringify({ next_run: nextRun }),
    queryStringParameters: queryStringParameters || {},
  };
}

async function invokeWithHarness(monitor, queryStringParameters) {
  const harness = createFetchHarness();
  global.fetch = harness.fetchMock;
  const response = await monitor.handler(manualEvent(queryStringParameters));
  assert.strictEqual(response.statusCode, 200, response.body);
  return { summary: JSON.parse(response.body).data, state: harness.state };
}

async function invokeEventWithHarness(monitor, harness, event) {
  global.fetch = harness.fetchMock;
  const response = await monitor.handler(event);
  assert.strictEqual(response.statusCode, 200, response.body);
  return JSON.parse(response.body);
}

test('news monitor enforces its live insert cap under concurrency and dry-run never writes', async function() {
  const previousFetch = global.fetch;
  const previousEnv = {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DATA_SERVICE_ROLE_KEY: process.env.SUPABASE_DATA_SERVICE_ROLE_KEY,
    AFROSTREAM_NEWS_RSS_FEEDS: process.env.AFROSTREAM_NEWS_RSS_FEEDS,
  };

  process.env.ADMIN_SECRET = 'test-admin-secret';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test-service-role-key';
  delete process.env.AFROSTREAM_NEWS_RSS_FEEDS;
  delete require.cache[MONITOR_PATH];

  try {
    const monitor = require(MONITOR_PATH);

    for (const query of [{}, { max_insert_news: '60' }]) {
      const live = await invokeWithHarness(monitor, query);
      assert.strictEqual(live.summary.insert_limit, 5);
      assert.strictEqual(live.summary.inserted_news, 5);
      assert.strictEqual(live.state.newsPosts, 5);
      assert.strictEqual(live.state.mentionPosts, 5);
      assert.strictEqual(live.summary.skipped_matches, 1);
      assert.ok(
        live.summary.insert_limit - live.summary.inserted_news >= 0,
        'insert budget must never fall below zero'
      );
    }

    const dryRun = await invokeWithHarness(monitor, {
      dry_run: '1',
      max_insert_news: '5',
    });
    assert.strictEqual(dryRun.summary.dry_run, true);
    assert.strictEqual(dryRun.summary.insert_limit, 5);
    assert.strictEqual(dryRun.summary.inserted_news, 0);
    assert.strictEqual(dryRun.summary.would_insert_news, 6);
    assert.strictEqual(dryRun.state.newsPosts, 0);
    assert.strictEqual(dryRun.state.mentionPosts, 0);
    assert.deepStrictEqual(dryRun.state.writes, []);
  } finally {
    global.fetch = previousFetch;
    delete require.cache[MONITOR_PATH];
    Object.keys(previousEnv).forEach(function(key) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  }
});

test('scheduled deliveries reserve one processing budget per normalized next_run and dry-run writes nothing', async function() {
  const previousFetch = global.fetch;
  const previousEnv = {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DATA_SERVICE_ROLE_KEY: process.env.SUPABASE_DATA_SERVICE_ROLE_KEY,
    AFROSTREAM_NEWS_RSS_FEEDS: process.env.AFROSTREAM_NEWS_RSS_FEEDS,
  };

  process.env.ADMIN_SECRET = 'test-admin-secret';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test-service-role-key';
  delete process.env.AFROSTREAM_NEWS_RSS_FEEDS;
  delete require.cache[MONITOR_PATH];

  try {
    const monitor = require(MONITOR_PATH);
    const harness = createFetchHarness();
    const results = await Promise.all([
      invokeEventWithHarness(monitor, harness, scheduledEvent('2026-08-16T06:46:00+00:00')),
      invokeEventWithHarness(monitor, harness, scheduledEvent('2026-08-16T08:46:00+02:00')),
    ]);
    const processed = results.filter(function(result) { return !result.duplicate_delivery_skipped; });
    const skipped = results.filter(function(result) { return result.duplicate_delivery_skipped; });

    assert.strictEqual(processed.length, 1);
    assert.strictEqual(skipped.length, 1);
    assert.strictEqual(processed[0].data.inserted_news, 5);
    assert.strictEqual(skipped[0].scheduled_next_run, '2026-08-16T06:46:00.000Z');
    assert.strictEqual(harness.state.feedGets, 6, 'a duplicate delivery must not fetch any source');
    assert.strictEqual(harness.state.newsPosts, 5);
    assert.strictEqual(harness.state.reservationAttempts, 2);
    assert.strictEqual(harness.state.reservations.size, 1);
    assert.strictEqual(harness.state.reservationPatches, 1);
    assert.strictEqual(harness.state.reservationPatchBodies[0].status, 'ok');

    const differentSlot = await invokeEventWithHarness(
      monitor,
      harness,
      scheduledEvent('2026-08-16T12:46:00.000Z')
    );
    assert.strictEqual(differentSlot.duplicate_delivery_skipped, undefined);
    assert.strictEqual(differentSlot.data.inserted_news, 5);
    assert.strictEqual(harness.state.feedGets, 12, 'a different next_run must process normally');
    assert.strictEqual(harness.state.newsPosts, 10);
    assert.strictEqual(harness.state.reservations.size, 2);
    assert.strictEqual(harness.state.reservationPatches, 2);
    assert.deepStrictEqual(
      harness.state.reservationPatchBodies.map(function(row) { return row.status; }),
      ['ok', 'ok']
    );

    const dryRunHarness = createFetchHarness();
    const dryRun = await invokeEventWithHarness(
      monitor,
      dryRunHarness,
      scheduledEvent('2026-08-16T18:46:00.000Z', { dry_run: '1' })
    );
    assert.strictEqual(dryRun.data.dry_run, true);
    assert.strictEqual(dryRun.data.would_insert_news, 6);
    assert.deepStrictEqual(dryRunHarness.state.writes, []);
    assert.strictEqual(dryRunHarness.state.reservations.size, 0);

    const errorHarness = createFetchHarness({ failSourceList: true });
    global.fetch = errorHarness.fetchMock;
    const failedResponse = await monitor.handler(scheduledEvent('2026-08-17T00:46:00.000Z'));
    assert.strictEqual(failedResponse.statusCode, 500);
    assert.strictEqual(errorHarness.state.feedGets, 0);
    assert.strictEqual(errorHarness.state.reservationPatches, 1);
    assert.strictEqual(errorHarness.state.reservationPatchBodies[0].status, 'error');

    const failedSlotRetry = await invokeEventWithHarness(
      monitor,
      errorHarness,
      scheduledEvent('2026-08-17T00:46:00.000Z')
    );
    assert.strictEqual(failedSlotRetry.duplicate_delivery_skipped, true);
    assert.strictEqual(errorHarness.state.feedGets, 0, 'a failed slot remains at-most-once');
    assert.strictEqual(errorHarness.state.reservationPatches, 1, 'a retry must not overwrite the owner error');
  } finally {
    global.fetch = previousFetch;
    delete require.cache[MONITOR_PATH];
    Object.keys(previousEnv).forEach(function(key) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  }
});
