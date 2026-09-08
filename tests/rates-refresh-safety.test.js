'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

function load(file, store = {}, fetch = async () => { throw new Error('Unexpected fetch'); }) {
  const filename = path.resolve(__dirname, '../netlify/functions', file);
  const module = { exports: {} };
  const nativeRequire = createRequire(filename);
  const context = vm.createContext({ module, exports: module.exports, __dirname: path.dirname(filename),
    require: id => id === './_shared/data-store' ? store : nativeRequire(id),
    fetch, AbortSignal, Date, URL, process: { env: {} }, console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context);
  return { api: module.exports, context };
}
const now = '2026-09-08T08:00:00Z';
const update = { code: 'GH', policy_rate: 14, source_statement_date: '2026-07-22', reviewed_at: now };

test('expired, future and undated manual reviews cannot renew verification', () => {
  const { api } = load('scheduled-fetch-central-bank-rates.js');
  for (const reviewed_at of [undefined, '2026-08-31T00:00:00Z', '2026-09-09T00:00:00Z']) {
    assert.equal(api._private.mergePolicyUpdates([], [{ ...update, reviewed_at }], now).length, 0);
  }
  const result = api._private.mergePolicyUpdates([], [update], now);
  assert.equal(result[0].verified_at, now);
});

test('newer automatic decisions beat a reviewed manual override', () => {
  const { api } = load('scheduled-fetch-central-bank-rates.js');
  const automatic = { ...update, policy_rate: 13, source_statement_date: '2026-09-01' };
  assert.equal(api._private.mergePolicyUpdates([automatic], [update], now)[0].policy_rate, 13);
});

test('older source decisions cannot downgrade saved rates or verification dates', () => {
  const { api } = load('scheduled-fetch-central-bank-rates.js');
  const data = { countries: [{ code: 'GH', policy_rate: 13, policy_rate_source_date: '2026-09-01' }] };
  assert.equal(api._private.applyPolicyRateUpdates(data, [update], now).length, 0);
  assert.equal(data.countries[0].policy_rate, 13);
  assert.equal(data.countries[0].policy_rate_verified_at, undefined);
});

test('a corrected rate without a known change date does not invent one', () => {
  const { api } = load('scheduled-fetch-central-bank-rates.js');
  const data = { countries: [{ code: 'UG', policy_rate: 10, last_updated: '2026-07-07' }] };
  api._private.applyPolicyRateUpdates(data, [{ ...update, code: 'UG', policy_rate: 9.75, source_statement_date: '2026-08-13' }], now);
  assert.equal(data.countries[0].last_rate_change.date, null);
});

test('all-source failure preserves the dataset observation timestamp', async () => {
  let saved;
  const owner = load('scheduled-fetch-central-bank-rates.js', {
    getData: async () => ({ timestamp: '2026-08-24T00:00:00Z', countries: [{ code: 'KE', policy_rate: 8.75 }] }),
    setData: async (_key, data) => { saved = data; return true; }, updateMeta: async () => {}
  });
  owner.context.fetchOfficialPolicyRateUpdates = async () => ({ updates: [], errors: ['timeout'] });
  owner.context.loadManualPolicyOverrides = () => ({ updates: [], generated_at: null });
  owner.context.fetchWorldBankInflation = async () => ({});
  await owner.api.handler();
  assert.equal(saved.timestamp, '2026-08-24T00:00:00Z');
  assert.equal(saved._verification.verified_count, 0);
});

test('official source requests start concurrently and each receives a deadline', async () => {
  const owner = load('scheduled-fetch-central-bank-rates.js');
  let started = 0;
  const releases = [];
  for (const name of ['fetchCbnUpdate', 'fetchCbkUpdate', 'fetchSarbUpdates', 'fetchBceaoUpdates', 'fetchBeacUpdates', 'fetchBogUpdate', 'fetchBkamUpdate']) {
    owner.context[name] = async ({ signal }) => { assert.ok(signal instanceof AbortSignal); started++; await new Promise(resolve => releases.push(resolve)); return []; };
  }
  const pending = owner.api._private.fetchOfficialPolicyRateUpdates();
  assert.equal(started, 7);
  releases.forEach(release => release());
  await pending;
});

test('forex write failure returns 503 and preserves success metadata', async () => {
  const meta = { last_fetch: '2026-08-24T00:00:00Z', source: 'previous' };
  const owner = load('scheduled-fetch-forex-rates.js', {
    getData: async () => null, setData: async () => false,
    updateMeta: async (_key, patch) => Object.assign(meta, patch)
  });
  const snapshot = require('../data/forex/latest.json');
  owner.context.fetchFromFawazAhmed = async () => ({ rates: snapshot.rates });
  // Use an observation in the past regardless of the test runner's date.
  owner.context.fetchFromExchangeRateAPI = async () => ({ rates: snapshot.rates, source: 'fixture', last_updated: '2026-01-01T00:00:00Z' });
  assert.equal((await owner.api.handler()).statusCode, 503);
  assert.equal(meta.last_fetch, '2026-08-24T00:00:00Z');
  assert.equal(meta.source, 'previous');
  assert.equal(meta.status, 'write-failed');
});

test('MCP fallback imports reject another project and duplicate rows', () => {
  const { readMcpSnapshot, PROJECT_REF, validateSnapshot, DATASETS } = require('../scripts/refresh-static-fallbacks');
  const tmp = path.join(require('node:os').tmpdir(), 'afrotools-snapshot-' + process.pid + '.json');
  try {
    fs.writeFileSync(tmp, JSON.stringify({ project_ref: 'another-project', rows: [] }));
    assert.throws(() => readMcpSnapshot(tmp), /AfroTools MCP/);
    fs.writeFileSync(tmp, JSON.stringify({ project_ref: PROJECT_REF, rows: [{ key: 'rates-latest', data: {} }, { key: 'rates-latest', data: {} }] }));
    assert.throws(() => readMcpSnapshot(tmp)('rates-latest'), /exactly one/);
    const old = { ...require('../data/rates/latest.json'), timestamp: '2020-01-01T00:00:00Z' };
    assert.throws(() => validateSnapshot(DATASETS.find(d => d.category === 'rates'), old, Date.parse(now)), /outside its stale threshold/);
  } finally { fs.unlinkSync(tmp); }
});
