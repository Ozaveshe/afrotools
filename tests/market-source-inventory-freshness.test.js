'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const now = Date.parse('2026-10-05T05:00:00Z');
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}

const supported = {
  id: 'supported', source_key: 'supported', dataset: 'fintech_fee',
  active: true, cadence_hours: 24, ttl_hours: 720,
  last_success_at: '2026-10-05T00:39:00Z'
};
const pharmacy = {
  id: 'pharmacy', source_key: 'za-ndoh-medicine-price-database',
  dataset: 'pharmacy_price', active: true, cadence_hours: 168, ttl_hours: 720,
  last_success_at: '2026-07-06T05:29:58Z'
};

// Exercise only read-only summary builders. Never invoke the watchdog runner,
// which can write its checkpoint or send an email in production.
function load(file, sources, runs = [], fail = false) {
  const context = {
    module: { exports: {} }, exports: {}, Date: Clock,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' } },
    require(id) {
      if (id.endsWith('market-data-refresh')) {
        return { getCollector: source => source.source_key === 'supported' ? () => {} : null };
      }
      if (id.endsWith('/env')) return { getEnv: name => context.process.env[name] };
      if (id.endsWith('with-api')) return { withApi: handler => handler };
      return new Proxy({}, { get: () => () => assert.fail('Unexpected dependency call: ' + id) });
    },
    fetch: async (url, options) => {
      assert.equal(options.method, undefined, 'Summary must only read live state');
      assert.match(url, /^https:\/\/zpclagtgczsygrgztlts\.supabase\.co\/rest\/v1\//);
      if (fail) return { ok: false, status: 503 };
      if (url.includes('/market_data_sources?')) {
        assert.match(url, /active=eq.true/);
        return { ok: true, json: async () => sources };
      }
      assert.match(url, /\/market_data_source_runs\?/);
      return { ok: true, json: async () => runs };
    }
  };
  context.exports = context.module.exports;
  const code = fs.readFileSync(path.join(__dirname, '../netlify/functions', file), 'utf8');
  vm.runInNewContext(code + '\nmodule.exports.inventoryTest = ' +
    (file === 'api-data-freshness.js' ? 'buildMarketDataSummary;' : 'checkMarketDataRuns;'), context);
  return context.module.exports.inventoryTest;
}

async function summaries(sources, runs = [], fail = false) {
  const api = await load('api-data-freshness.js', sources, runs, fail)(false);
  const watchdog = { sources: {}, stale: [], degraded: [], failures: [], warnings: [] };
  await load('scheduled-source-health-watchdog.js', sources, runs, fail)(watchdog, now);
  return { api: JSON.parse(JSON.stringify(api)), watchdog: JSON.parse(JSON.stringify(watchdog)) };
}

test('expired pharmacy inventory remains visible when no collector is installed', async () => {
  const { api, watchdog } = await summaries([supported, pharmacy]);
  assert.equal(api.active_sources, 2);
  assert.equal(api.refresh_managed_sources, 1);
  assert.equal(api.unsupported_active_sources, 1);
  assert.equal(api.stale_sources, 1);
  assert.equal(api.status, 'degraded');
  assert.equal(watchdog.sources.market_data.unsupported_active_sources, 1);
  assert.equal(watchdog.sources.market_data.stale_sources[0].source_key, pharmacy.source_key);
  assert.equal(watchdog.stale[0].id, 'market_data_source:' + pharmacy.source_key);
  assert.equal(watchdog.stale[0].updated_at, '2026-07-06T05:29:58.000Z');
});

test('never-successful and invalid-date unsupported sources remain stale', async () => {
  for (const last_success_at of [null, 'invalid']) {
    const { api, watchdog } = await summaries([{ ...pharmacy, last_success_at }]);
    assert.equal(api.stale_sources, 1);
    assert.equal(watchdog.stale.length, 1);
    assert.equal(watchdog.stale[0].age_minutes, null);
  }
});

test('a fresh unsupported source reports coverage without a stale alarm', async () => {
  const { api, watchdog } = await summaries([{ ...pharmacy, last_success_at: supported.last_success_at }]);
  assert.equal(api.unsupported_active_sources, 1);
  assert.equal(api.stale_sources, 0);
  assert.equal(api.status, 'ok');
  assert.equal(watchdog.stale.length, 0);
});

test('supported source thresholds and latest-run failure handling remain intact', async () => {
  const failed = { id: 'run', source_id: supported.id, dataset: supported.dataset,
    status: 'failed', started_at: '2026-10-05T00:40:00Z' };
  const { api, watchdog } = await summaries([supported], [failed]);
  assert.equal(api.unsupported_active_sources, 0);
  assert.equal(api.failed_recent_runs, 1);
  assert.equal(api.status, 'degraded');
  assert.equal(watchdog.degraded.length, 1);
  const stale = await summaries([{ ...supported, last_success_at: '2026-10-01T00:39:00Z' }]);
  assert.equal(stale.api.stale_sources, 1);
  assert.equal(stale.watchdog.stale.length, 1);
});

test('public summaries omit source rows and unavailable reads remain visible', async () => {
  const { api } = await summaries([pharmacy]);
  assert.equal(api.sources, undefined);
  assert.equal(api.stale_source_rows, undefined);
  const unavailable = await summaries([], [], true);
  assert.equal(unavailable.api.available, false);
  assert.equal(unavailable.api.status, 'error');
  assert.ok(unavailable.watchdog.warnings.length > 0);
});
