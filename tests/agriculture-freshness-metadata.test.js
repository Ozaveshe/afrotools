'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const NOW = Date.parse('2026-09-10T05:30:00Z');
const FETCHED = '2026-09-10T03:19:05Z';

// Exercise the real reader functions without network, persistence or email.
function loadReader(filename, names, meta) {
  const module = { exports: {} };
  const mocks = {
    './_shared/data-store': { getData: async (key) => key === 'meta' ? meta : null },
    './_shared/scholarship-platform': {},
    './_shared/market-data-refresh': {},
    './_shared/email-adapter': {},
    './_shared/scheduled-event': {},
    './_shared/env': {},
    './utils/cors': {},
    './_shared/with-api': { withApi: (handler) => handler },
  };
  const source = fs.readFileSync(path.join(__dirname, '../netlify/functions', filename), 'utf8');
  vm.runInNewContext(source + '\nmodule.exports.readers = { ' + names.join(', ') + ' };', {
    module,
    exports: module.exports,
    require: (id) => {
      assert.ok(Object.hasOwn(mocks, id), 'Unexpected dependency: ' + id);
      return mocks[id];
    },
    process: { env: {} },
  }, { filename });
  return module.exports.readers;
}

function agriculture(overrides = {}) {
  return { agriculture: {
    last_fetch: FETCHED, source: 'MultiSource', source_type: 'scraper',
    status: 'ok', records_count: 12, confidence: 0.7, ...overrides,
  } };
}

async function category(meta) {
  const api = loadReader('api-data-freshness.js', ['buildCategoryStatus', 'CATEGORY_CONFIGS'], meta);
  return api.buildCategoryStatus('agri_inputs', api.CATEGORY_CONFIGS.agri_inputs, meta, NOW);
}

test('agri_inputs reads the existing agriculture collector metadata without inventing a source', async () => {
  const result = await category(agriculture());
  assert.equal(result.status, 'ok');
  assert.equal(result.updatedAt, new Date(FETCHED).toISOString());
  assert.equal(result.source, 'MultiSource');
  assert.equal(result.source_type, 'scraper');
  assert.equal(result.records_count, 12);
  assert.equal(result.confidence, 0.7);
});

test('agriculture still fails closed for missing provenance and respects stale metadata', async () => {
  assert.equal((await category(agriculture({ source: null }))).status, 'offline');
  assert.equal((await category(agriculture({ last_fetch: null }))).status, 'offline');
  assert.equal((await category(agriculture({ status: 'stale' }))).status, 'stale');
  assert.equal((await category(agriculture({ last_fetch: '2026-08-01T00:00:00Z' }))).status, 'offline');
  // Preserve the existing public-category fallback for older compatible snapshots.
  assert.equal((await category({ agri_inputs: agriculture().agriculture })).status, 'ok');
});

test('watchdog uses agriculture metadata and retains its degraded-run signal', async () => {
  for (const status of ['ok', 'write-failed']) {
    const reader = loadReader('scheduled-source-health-watchdog.js', ['checkLiveDataMeta'], agriculture({ status }));
    const summary = { ok: true, sources: {}, stale: [], degraded: [], failures: [] };
    await reader.checkLiveDataMeta(summary, NOW);
    const result = summary.sources.live_data_meta.categories.find((item) => item.id === 'agri_inputs');
    assert.equal(result.status, status);
    assert.equal(result.source, 'MultiSource');
    assert.equal(result.records_count, 12);
    assert.equal(result.updated_at, new Date(FETCHED).toISOString());
    assert.equal(summary.degraded.some((item) => item.id === 'agri_inputs'), status === 'write-failed');
  }
});
