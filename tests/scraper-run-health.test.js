'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const health = require('../netlify/functions/_shared/scraper-run-health');
const policy = require('../netlify/functions/_shared/scraper-health-policy.json');
const { buildPolicy } = require('../scripts/build-scraper-health-policy');
const cron = require('../netlify/functions/_shared/cron-schedule');
const now = new Date('2026-10-02T20:00:00Z');

function row(id, success, extra = {}) {
  return { scraper_id: id, last_run_at: success, last_success_at: success,
    errors_24h: 0, anomalies_24h: 0, is_healthy: false, ...extra };
}

test('server-only generated policy matches source owners, cron and SLA', () => {
  assert.deepEqual(policy, buildPolicy());
  assert.equal(Object.keys(policy.collectors).length, 14);
  assert.equal(policy.collectors['bank-rates'], undefined, 'legacy bank log cannot stand for central-bank meta owner');
});

test('weekly, daily and 12-hour run history survives the old six-hour view flag', () => {
  for (const [id, at] of [
    ['agri-inputs', '2026-10-01T03:19:07Z'],
    ['insurance-premiums', '2026-09-28T03:41:10Z'],
    ['property-prices', '2026-09-30T03:44:07Z'],
    ['salary-benchmarks', '2026-10-02T03:47:07Z'],
    ['commodity-prices', '2026-10-02T02:21:08Z'],
    ['electricity-tariffs', '2026-10-02T03:33:07Z'],
    ['shipping-rates', '2026-10-02T04:52:22Z'],
    ['telecom-plans', '2026-10-02T12:47:07Z'],
  ]) {
    const input = row(id, at);
    const result = health.classifyScraper(input, now);
    assert.equal(result.is_healthy, true, id);
    assert.equal(result.view_is_healthy, false);
    assert.equal(result.last_success_at, at, 'no restamping');
    assert.equal(input.is_healthy, false, 'input not mutated');
    assert.equal(result.health_scope, 'collector_run_history');
    assert.equal(result.scheduled_proof_status, 'not_checked');
  }
});

test('weekend stocks cover Friday job; incomplete Friday evidence stays stale', () => {
  const sunday = new Date('2026-10-04T20:00:00Z');
  const covered = health.classifyScraper(row('stock-indices', '2026-10-02T23:11:07Z'), sunday);
  assert.equal(covered.is_healthy, true);
  assert.equal(covered.health_status, 'covers_last_scheduled_run');
  assert.equal(covered.last_scheduled_at, '2026-10-02T23:11:00.000Z');
  assert.equal(health.classifyScraper(row('stock-indices', '2026-10-02T22:11:07Z'), sunday).health_status, 'stale');
  assert.equal(health.classifyScraper(row('stock-indices', '2026-10-02T23:11:07Z'), new Date('2026-10-05T03:00:00Z')).health_status, 'stale');
});

test('actual lateness and error/anomaly evidence cannot become green', () => {
  assert.equal(health.classifyScraper(row('insurance-premiums', '2026-09-21T03:41:10Z'), now).health_status, 'stale');
  for (const extra of [{ errors_24h: 1 }, { anomalies_24h: 1 }, { status: 'failed' }, { status: 'stale' },
    { last_run_at: '2026-10-02T19:00:00Z' }]) {
    assert.equal(health.classifyScraper(row('commodity-prices', '2026-10-02T02:21:08Z', extra), now).health_status, 'degraded');
  }
  assert.equal(health.classifyScraper(row('fuel-prices', '2026-10-02T07:59:59Z'), now).health_status, 'stale');
  assert.equal(health.classifyScraper(row('fuel-prices', '2026-10-02T08:00:00Z'), now).is_healthy, true, 'exact SLA boundary');
});

test('missing, future, invalid counts and unknown ownership fail conservatively', () => {
  assert.equal(health.classifyScraper({ scraper_id: 'fuel-prices' }, now).health_status, 'missing_evidence');
  for (const extra of [{ last_run_at: 'bad' }, { last_success_at: 'bad' },
    { last_run_at: '2026-10-03T00:00:00Z' }, { errors_24h: null }, { anomalies_24h: -1 }]) {
    assert.equal(health.classifyScraper(row('fuel-prices', '2026-10-02T18:13:07Z', extra), now).is_healthy, false);
  }
  assert.equal(health.classifyScraper(row('bank-rates', '2026-10-02T19:59:00Z', { is_healthy: true }), now).health_status, 'unknown_owner');
  const empty = health.summarizeScrapers([], { now });
  assert.equal(empty.overall_health, 'critical');
  assert.equal(empty.total_count, 14);
  assert.ok(empty.scrapers.every(s => s.health_status === 'missing_evidence'));
  const filtered = health.summarizeScrapers([], { now, id: 'bank-rates' });
  assert.equal(filtered.total_count, 1);
  assert.equal(filtered.overall_health, 'critical');
  assert.throws(() => health.summarizeScrapers(null), /Invalid scraper health payload/);
});

test('UTC cron handles boundary, Sunday alias, DOM/DOW OR and rejects malformed fields', () => {
  assert.equal(cron.previousScheduledAt('0 0 * * 7', new Date('2026-10-04T00:00:01Z')), '2026-10-04T00:00:00.000Z');
  assert.equal(cron.nextScheduledAt('0 0 1 * 1', new Date('2026-10-02T00:00:00Z')), '2026-10-05T00:00:00.000Z');
  assert.equal(cron.previousScheduledAt('27 * * * *', new Date('2026-10-02T20:27:00Z')), '2026-10-02T20:27:00.000Z');
  for (const expression of ['99 * * * *', '0 */0 * * *', '0 * 0 * *', '0 * * 13 *', '0 * * * 8', '0,bad * * * *', '0 * *']) {
    assert.equal(cron.previousScheduledAt(expression, now), null, expression);
  }
});

function loadFunction(name, { fetch, dependencies = {}, env = {} } = {}) {
  const file = path.resolve(__dirname, '../netlify/functions', name + '.js');
  const context = {
    exports: {}, process: { env: { ADMIN_KEY: 'fixture-admin', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service', ...env } },
    console: { log() {}, warn() {}, error() {} }, URL,
    fetch: fetch || (() => assert.fail('Unexpected network')),
    require(id) {
      if (id === './_shared/scraper-run-health') return health;
      if (id === './_shared/agri-reference') return require('../netlify/functions/_shared/agri-reference');
      if (id === './utils/cors') return { getAllowedOrigin: () => 'https://example.invalid' };
      assert.ok(Object.hasOwn(dependencies, id), 'Unexpected dependency: ' + id);
      return dependencies[id];
    },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return context;
}

test('protected API executes cadence classifier and retains auth/method guards', async () => {
  let reads = 0;
  const sample = row('insurance-premiums', new Date(Date.now() - 112 * 3600000).toISOString());
  const api = loadFunction('api-scraper-health', { fetch: async url => {
    reads++;
    assert.match(url, /^https:\/\/zpclagtgczsygrgztlts\.supabase\.co\/rest\/v1\/scraper_health\?/);
    return { ok: true, json: async () => [sample] };
  } });
  assert.equal((await api.exports.handler({ httpMethod: 'GET', headers: {} })).statusCode, 401);
  assert.equal((await api.exports.handler({ httpMethod: 'POST', headers: {} })).statusCode, 405);
  assert.equal((await api.exports.handler({ httpMethod: 'OPTIONS', headers: {} })).statusCode, 204);
  assert.equal(reads, 0);
  const response = await api.exports.handler({ httpMethod: 'GET', headers: { 'X-Admin-Key': 'fixture-admin' }, queryStringParameters: { id: 'insurance-premiums' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  const result = JSON.parse(response.body);
  assert.equal(result.total_count, 1);
  assert.equal(result.healthy_count, 1);
  assert.equal(result.health_scope, 'collector_run_history');
  assert.equal(result.scheduled_proof_status, 'not_checked');
  assert.equal(result.scrapers[0].view_is_healthy, false);
});

test('watchdog uses same cadence result; real source-age thresholds remain independent', async () => {
  const worker = loadFunction('scheduled-source-health-watchdog', {
    fetch: async () => ({ ok: true, json: async () => [row('insurance-premiums', '2026-09-28T03:41:10Z')] }),
    dependencies: {
      './_shared/data-store': { getData: async () => ({ stocks: { updated_at: '2026-10-02T23:11:07Z', status: 'ok' } }) },
      './_shared/scholarship-platform': {}, './_shared/market-data-refresh': {},
      './_shared/email-adapter': {}, './_shared/scheduled-event': {},
    },
  });
  const summary = { ok: true, sources: {}, degraded: [], failures: [], stale: [], warnings: [] };
  await worker.checkScraperHealth(summary, now.getTime());
  assert.equal(summary.sources.scraper_health.unhealthy_count, 13, 'missing required lanes are not green');
  assert.ok(!summary.degraded.some(s => s.id === 'insurance-premiums'), 'weekly success is not a six-hour failure');
  await worker.checkLiveDataMeta(summary, new Date('2026-10-04T20:00:00Z').getTime());
  assert.ok(summary.stale.some(s => s.id === 'stocks' && s.surface === 'live_data_meta'), 'collector weekend coverage does not waive source TTL');
  const publicSummary = worker.safeSummary(summary, false);
  assert.equal(publicSummary.sources.scraper_health.health_scope, 'collector_run_history');
  assert.equal(publicSummary.sources.scraper_health.scheduled_proof_status, 'not_checked');
});

test('admin summary preserves collector scope and unknown-owner debt', () => {
  const api = loadFunction('api-admin-status');
  const summary = api.buildScraperSummary(health.summarizeScrapers([row('bank-rates', '2026-07-07T03:17:17Z')], { now }));
  assert.equal(summary.health_scope, 'collector_run_history');
  assert.equal(summary.scheduled_proof_status, 'not_checked');
  assert.equal(summary.unknown_owner_count, 1);
  assert.ok(summary.unhealthy_scrapers.includes('bank-rates'));
});

test('unavailable watchdog evidence cannot produce a healthy summary', async () => {
  for (const response of [{ ok: false, status: 503 }, { ok: true, json: async () => ({ unexpected: true }) }]) {
    const worker = loadFunction('scheduled-source-health-watchdog', {
      fetch: async () => response,
      dependencies: { './_shared/data-store': {}, './_shared/scholarship-platform': {},
        './_shared/market-data-refresh': {}, './_shared/email-adapter': {}, './_shared/scheduled-event': {} },
    });
    const summary = { ok: true, sources: {}, degraded: [], failures: [], stale: [], warnings: [] };
    await worker.checkScraperHealth(summary, now.getTime());
    assert.equal(summary.ok, false);
    assert.ok(summary.degraded.some(item => item.id === 'scraper_health'));
  }
});
