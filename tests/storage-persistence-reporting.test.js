'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const { storageDiagnostic } = require('../netlify/functions/_shared/storage-diagnostics');
const SENSITIVE_FIXTURE = 'synthetic-secret-must-never-appear';
const previousMeta = { last_fetch: '2026-08-24T00:00:00Z', as_of: '2026-08-24T00:00:00Z',
  confidence: 0.7, source: 'previous', records_count: 54, verified_count: 7 };

function load(relative, overrides = {}) {
  const filename = path.join(ROOT, relative);
  const realRequire = createRequire(filename);
  const module = { exports: {} };
  const logs = [];
  const context = vm.createContext({
    module, exports: module.exports, __dirname: path.dirname(filename), __filename: filename,
    require: id => Object.hasOwn(overrides.modules || {}, id) ? overrides.modules[id] : realRequire(id),
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: SENSITIVE_FIXTURE } },
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push(args.join(' '))])),
    fetch: overrides.fetch || (async () => { throw new Error('Unexpected network attempt'); }),
    URL, Date, setTimeout, clearTimeout, Buffer,
  });
  vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return { api: module.exports, context, logs };
}

const consumers = fs.readdirSync(path.join(ROOT, 'netlify/functions'))
  .filter(name => name.endsWith('.js') && fs.readFileSync(path.join(ROOT, 'netlify/functions', name), 'utf8').includes('return runScraper('));
assert.equal(consumers.length, 11, 'review newly added shared-runner consumers explicitly');

for (const filename of consumers) {
  for (const written of [false, true]) {
    test(filename + ' propagates persistence ' + (written ? 'success' : 'failure'), async () => {
      const meta = { ...previousMeta };
      const inserts = [];
      let captured;
      const owner = load('netlify/functions/' + filename, { modules: {
        './_shared/scraper-base': { runScraper: async config => { captured = config; return { statusCode: 503 }; } },
        './_shared/data-store': {},
      } });
      assert.equal((await owner.api.handler({})).statusCode, 503, 'owner must propagate the shared result');
      const runner = load('netlify/functions/_shared/scraper-base.js', {
        modules: { './data-store': {
          getData: async () => null, setData: async () => written,
          updateMeta: async (_key, patch) => Object.assign(meta, patch),
        } },
        fetch: async (url, opts) => { inserts.push({ table: url.split('/').pop(), row: JSON.parse(opts.body) }); return { ok: true }; },
      });
      const response = await runner.api.runScraper({ ...captured,
        sources: [{ name: 'SyntheticSource', fn: async () => ({ countries: [{ code: 'KE' }] }) }],
        transform: value => value, validate: () => ({ valid: true }),
      });
      assert.equal(response.statusCode, written ? 200 : 503);
      if (written) {
        assert.match(response.body, /updated from SyntheticSource/);
        assert.equal(meta.status, 'ok');
        assert.notEqual(meta.last_fetch, previousMeta.last_fetch);
        assert.ok(inserts.some(item => item.table === 'data_confidence'));
        assert.equal(inserts.find(item => item.table === 'scraper_runs').row.status, 'ok');
      } else {
        assert.match(response.body, /persistence failed/);
        for (const key of Object.keys(previousMeta)) assert.equal(meta[key], previousMeta[key], key + ' retained');
        assert.equal(meta.status, 'write-failed');
        assert.ok(Number.isFinite(Date.parse(meta.last_attempt)));
        assert.ok(!inserts.some(item => item.table === 'data_confidence'));
        assert.equal(inserts.find(item => item.table === 'scraper_runs').row.error_message, 'Persistence failed');
        assert.doesNotMatch(runner.logs.join('\n'), /Complete\.|updated from|Blob write failed/);
      }
      assert.ok(!runner.logs.join('\n').includes(SENSITIVE_FIXTURE));
    });
  }
}

test('shared failure stays non-success if failure metadata and log persistence throw', async () => {
  const runner = load('netlify/functions/_shared/scraper-base.js', { modules: { './data-store': {
    getData: async () => null, setData: async () => false,
    updateMeta: async () => { throw new Error(SENSITIVE_FIXTURE, { cause: { code: 'ENOTFOUND', headers: SENSITIVE_FIXTURE } }); },
  } }, fetch: async () => { throw new Error(SENSITIVE_FIXTURE, { cause: { code: 'ECONNRESET' } }); } });
  const response = await runner.api.runScraper({ id: 'fuel-prices', blobKey: 'fuel-latest',
    sources: [{ name: 'fixture', fn: async () => ({ countries: [] }) }], validate: () => ({ valid: true }) });
  assert.equal(response.statusCode, 503);
  assert.match(runner.logs.join('\n'), /operation=failure-metadata dataset=meta code=ENOTFOUND/);
  assert.match(runner.logs.join('\n'), /operation=supabase-insert dataset=scraper_runs code=ECONNRESET/);
  assert.ok(!runner.logs.join('\n').includes(SENSITIVE_FIXTURE));
});

for (const mode of ['failed', 'failed-metadata', 'success']) {
  test('rates producer ' + mode + ' preserves the persistence contract', async () => {
    const meta = { ...previousMeta };
    const rates = load('netlify/functions/scheduled-fetch-central-bank-rates.js', { modules: {
      './_shared/data-store': {
        getData: async () => ({ timestamp: previousMeta.last_fetch, countries: [{ code: 'KE', policy_rate: 8.75 }] }),
        setData: async () => mode === 'success',
        updateMeta: async (_key, patch) => {
          if (mode === 'failed-metadata') throw new Error(SENSITIVE_FIXTURE, { cause: { code: 'ETIMEDOUT' } });
          Object.assign(meta, patch);
        },
      }, './_shared/scraper-base': {},
    } });
    rates.context.fetchOfficialPolicyRateUpdates = async () => ({ updates: [{ code: 'KE', policy_rate: 8.75,
      source_name: 'synthetic official source', source_url: 'https://example.test', last_change_date: '2026-08-11' }], errors: [] });
    rates.context.loadManualPolicyOverrides = () => ({ updates: [], codes: [], generated_at: null });
    rates.context.fetchWorldBankInflation = async () => ({});
    const response = await rates.api.handler();
    assert.equal(response.statusCode, mode === 'success' ? 200 : 503);
    if (mode === 'success') {
      assert.equal(meta.status, 'ok');
      assert.notEqual(meta.last_fetch, previousMeta.last_fetch);
      assert.match(response.body, /Rates data refreshed/);
    } else {
      for (const key of Object.keys(previousMeta)) assert.equal(meta[key], previousMeta[key], key + ' retained');
      assert.doesNotMatch(rates.logs.join('\n'), /Complete\.|Rates data refreshed/);
      if (mode === 'failed') assert.equal(meta.status, 'write-failed');
    }
    assert.ok(!rates.logs.join('\n').includes(SENSITIVE_FIXTURE));
  });
}

for (const [error, expected] of [
  [new Error(SENSITIVE_FIXTURE, { cause: { code: 'ENOTFOUND' } }), 'ENOTFOUND'],
  [new Error(SENSITIVE_FIXTURE, { cause: { code: 'CERT_HAS_EXPIRED' } }), 'CERT_HAS_EXPIRED'],
  [Object.assign(new Error(SENSITIVE_FIXTURE), { name: 'AbortError' }), 'ABORTED'],
  [Object.assign(new Error(SENSITIVE_FIXTURE), { name: 'TimeoutError' }), 'TIMEOUT'],
  [new Error(SENSITIVE_FIXTURE, { cause: { code: SENSITIVE_FIXTURE } }), 'UNKNOWN'],
]) {
  test('transport failure is sanitized as ' + expected + ' without changing fallback/write behavior', async () => {
    const store = load('netlify/functions/_shared/data-store.js', {
      modules: { '@netlify/blobs': { getStore: () => ({ get: async () => { throw error; }, setJSON: async () => { throw error; } }) } },
      fetch: async () => { throw error; },
    });
    assert.equal(await store.api.getData('fuel-latest'), null);
    assert.equal(await store.api.setData('unregistered-fixture', { timestamp: previousMeta.last_fetch }), false);
    assert.match(store.logs.join('\n'), new RegExp('operation=supabase-read dataset=fuel-latest code=' + expected));
    assert.match(store.logs.join('\n'), new RegExp('operation=supabase-write dataset=unlisted code=' + expected));
    assert.ok(!store.logs.join('\n').includes(SENSITIVE_FIXTURE));
    assert.equal(storageDiagnostic(SENSITIVE_FIXTURE, SENSITIVE_FIXTURE, error).split(' code=')[0], 'operation=unlisted dataset=unlisted');
    const refresh = load('scripts/refresh-static-fallbacks.js', { fetch: async () => { throw error; } });
    await assert.rejects(refresh.context.fetchLiveRow({ url: 'https://example.test', key: SENSITIVE_FIXTURE }, 'fuel-latest'),
      error => error.message === 'operation=fallback-refresh dataset=fuel-latest code=' + expected);
  });
}

test('HTTP failures do not read or log response bodies', async () => {
  let bodyReads = 0;
  const response = { ok: false, status: 503, text: async () => { bodyReads++; return SENSITIVE_FIXTURE; } };
  const store = load('netlify/functions/_shared/data-store.js', { fetch: async () => response,
    modules: { '@netlify/blobs': { getStore: () => ({ setJSON: async () => { throw new Error(SENSITIVE_FIXTURE); }, get: async () => null }) } },
  });
  assert.equal(await store.api.setData('unregistered-fixture', {}), false);
  assert.equal(await store.api.getData('fuel-latest'), null);
  assert.match(store.logs.join('\n'), /code=HTTP_503/);
  const refresh = load('scripts/refresh-static-fallbacks.js', { fetch: async () => response });
  await assert.rejects(refresh.context.fetchLiveRow({ url: 'https://example.test', key: SENSITIVE_FIXTURE }, 'fuel-latest'), /code=HTTP_503/);
  const runner = load('netlify/functions/_shared/scraper-base.js', { fetch: async () => response, modules: { './data-store': {} } });
  await runner.api.logRun('fuel-prices', 'error', { error_message: 'Persistence failed' });
  assert.match(runner.logs.join('\n'), /dataset=scraper_runs code=HTTP_503/);
  assert.equal(bodyReads, 0);
  assert.ok(![...store.logs, ...runner.logs].join('\n').includes(SENSITIVE_FIXTURE));
});

test('contract rejection retains old data without attempting persistence', async () => {
  let calls = 0;
  const store = load('netlify/functions/_shared/data-store.js', { fetch: async () => { calls++; throw new Error(SENSITIVE_FIXTURE); },
    modules: { '@netlify/blobs': { getStore: () => { calls++; throw new Error(SENSITIVE_FIXTURE); } } },
  });
  assert.equal(await store.api.setData('forex-latest', { schemaVersion: 999, timestamp: SENSITIVE_FIXTURE }), false);
  assert.equal(calls, 0);
  assert.match(store.logs.join('\n'), /Rejected incompatible data/);
  assert.ok(!store.logs.join('\n').includes(SENSITIVE_FIXTURE));
});

test('malformed snapshot JSON cannot expose its body through the refresh error', async () => {
  const refresh = load('scripts/refresh-static-fallbacks.js', {
    fetch: async () => ({ ok: true, json: async () => { throw new SyntaxError(SENSITIVE_FIXTURE); } }),
  });
  await assert.rejects(refresh.context.fetchLiveRow({ url: 'https://example.test', key: SENSITIVE_FIXTURE }, 'fuel-latest'),
    error => error.message === 'operation=fallback-refresh dataset=fuel-latest code=UNKNOWN');
});

for (const backend of ['supabase', 'blob']) {
  test('successful ' + backend + ' persistence keeps the existing store boolean contract', async () => {
    const store = load('netlify/functions/_shared/data-store.js', {
      fetch: async () => { if (backend !== 'supabase') throw new Error(SENSITIVE_FIXTURE); return { ok: true }; },
      modules: { '@netlify/blobs': { getStore: () => ({ setJSON: async () => {
        if (backend !== 'blob') throw new Error(SENSITIVE_FIXTURE);
      } }) } },
    });
    assert.equal(await store.api.setData('unregistered-fixture', {}), true);
    assert.ok(!store.logs.join('\n').includes(SENSITIVE_FIXTURE));
  });
}
