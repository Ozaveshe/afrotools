'use strict';

const assert = require('assert');
const test = require('node:test');

const HEALTH_PATH = require.resolve('../netlify/functions/afrostream-health.js');

function jsonResponse(body, total) {
  return {
    ok: true,
    status: 200,
    headers: {
      get: function(name) {
        if (String(name).toLowerCase() !== 'content-range') return null;
        return '0-' + Math.max(0, body.length - 1) + '/' + (total === undefined ? body.length : total);
      }
    },
    text: async function() { return JSON.stringify(body); }
  };
}

test('AfroStream health exposes aggregate 48h scheduled delivery and duplicate-slot counts', async function() {
  const previousFetch = global.fetch;
  const previousKeys = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DATA_SERVICE_ROLE_KEY: process.env.SUPABASE_DATA_SERVICE_ROLE_KEY,
  };
  let windowQuerySeen = false;

  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test-service-role-key';
  delete require.cache[HEALTH_PATH];

  global.fetch = async function(url, options = {}) {
    const requestUrl = String(url);
    if (requestUrl.includes('scraper_id=eq.afrostream-news-monitor') && requestUrl.includes('fetched_at=gte.')) {
      windowQuerySeen = requestUrl.includes('source=eq.Netlify%20Scheduled%20Function') &&
        requestUrl.includes('fetched_at=lt.') && options.headers.Prefer === 'count=exact';
      return jsonResponse([
        { fetched_at: '2026-08-16T12:48:00.000Z' },
        { fetched_at: '2026-08-16T12:47:00.000Z' },
        { fetched_at: '2026-08-16T06:46:20.000Z' },
        { fetched_at: '2026-08-16T00:46:20.000Z' },
        { fetched_at: '2026-08-16T00:46:10.000Z' },
      ]);
    }
    if (requestUrl.includes('scraper_id=eq.afrostream-news-monitor')) {
      return jsonResponse([{
        scraper_id: 'afrostream-news-monitor',
        status: 'ok',
        source: 'Netlify Scheduled Function',
        records_count: 4,
        error_message: null,
        duration_ms: 1200,
        fetched_at: '2026-08-16T12:48:00.000Z',
      }]);
    }
    if (requestUrl.includes('/as_creators?')) return jsonResponse([{ id: 1 }], 1);
    if (requestUrl.includes('/as_creator_snapshots?snapshot_date=eq.')) return jsonResponse([{ id: 1 }], 1);
    if (requestUrl.includes('/as_creator_snapshots?')) {
      return jsonResponse([{ snapshot_date: '2026-08-16', created_at: '2026-08-16T01:00:00.000Z' }], 1);
    }
    if (requestUrl.includes('/as_streams?')) return jsonResponse([], 0);
    if (requestUrl.includes('/as_news?')) return jsonResponse([], 0);
    if (requestUrl.includes('/as_news_sources?')) return jsonResponse([], 0);
    if (requestUrl.includes('/as_creator_supporters?')) return jsonResponse([], 0);
    if (requestUrl.includes('/scraper_runs?')) return jsonResponse([], 0);
    throw new Error('Unexpected mocked request: ' + requestUrl);
  };

  try {
    const health = require(HEALTH_PATH);
    const response = await health.handler({ httpMethod: 'GET', headers: {} });
    assert.strictEqual(response.statusCode, 200, response.body);
    const parsed = JSON.parse(response.body);
    assert.strictEqual(windowQuerySeen, true, 'the aggregate must include only scheduled monitor rows');
    assert.deepStrictEqual(parsed.data.automation.news_monitor_scheduled_48h, {
      window_hours: 48,
      window_started_at: parsed.data.automation.news_monitor_scheduled_48h.window_started_at,
      scheduled_delivery_count: 5,
      unique_scheduled_slot_count: 3,
      duplicate_scheduled_slot_count: 2,
      duplicate_scheduled_delivery_count: 2,
      metrics_complete: true,
      duplicate_scheduled_slots: [
        { slot_at: '2026-08-16T00:46:00.000Z', delivery_count: 2 },
        { slot_at: '2026-08-16T12:46:00.000Z', delivery_count: 2 },
      ],
    });
    assert.match(parsed.data.automation.news_monitor_scheduled_48h.window_started_at, /Z$/);
    assert.deepStrictEqual(
      Object.keys(parsed.data.automation.news_monitor_scheduled_48h).sort(),
      [
        'duplicate_scheduled_delivery_count',
        'duplicate_scheduled_slot_count',
        'duplicate_scheduled_slots',
        'metrics_complete',
        'scheduled_delivery_count',
        'unique_scheduled_slot_count',
        'window_hours',
        'window_started_at',
      ],
      'the public aggregate must not expose run ids, URLs, or error details'
    );
  } finally {
    global.fetch = previousFetch;
    delete require.cache[HEALTH_PATH];
    Object.keys(previousKeys).forEach(function(key) {
      if (previousKeys[key] === undefined) delete process.env[key];
      else process.env[key] = previousKeys[key];
    });
  }
});
