'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const contracts = require('../netlify/functions/_shared/live-data-contracts');
const dataStore = require('../netlify/functions/_shared/data-store');

async function main() {
  const registry = contracts.loadContracts();
  assert.strictEqual(registry.datasets.length, 3);

  for (const contract of registry.datasets) {
    const payload = JSON.parse(fs.readFileSync(path.join(ROOT, contract.staticFallbackPath), 'utf8'));
    const result = contracts.validateAgainstContract(contract, payload, new Date().toISOString());
    assert.strictEqual(result.valid, true, contract.id + ' static fallback should remain structurally valid');
    if (result.publicState === 'stale') {
      assert.doesNotMatch(result.publicLabel, /\blive\b|\bcurrent\b|official verified/i);
    }
  }

  ['live', 'blob', 'fallback'].forEach(function (servedFrom) {
    const payload = dataStore._test.withProvenance({
      timestamp: '2026-07-13T00:00:00Z',
      value: 1,
    }, servedFrom);
    assert.strictEqual(payload.served_from, servedFrom);
    assert.strictEqual(payload.as_of, '2026-07-13T00:00:00.000Z');
    assert.strictEqual(JSON.stringify(payload).includes('served_from'), false, 'provenance must not be persisted into snapshots');
    assert.strictEqual(JSON.stringify(payload).includes('as_of'), false, 'derived as_of must not be persisted into snapshots');
  });

  let persistenceCalls = 0;
  const originalFetch = global.fetch;
  global.fetch = async function () {
    persistenceCalls += 1;
    throw new Error('persistence must not be attempted');
  };
  try {
    const written = await dataStore.setData('forex-latest', {
      schemaVersion: 999,
      timestamp: 'not-a-date',
      source: 'broken',
      base: 'USD',
      rates: {}
    });
    assert.strictEqual(written, false);
    assert.strictEqual(persistenceCalls, 0, 'incompatible payload must be rejected before Supabase or Blob persistence');
  } finally {
    global.fetch = originalFetch;
  }

  console.log('Live data compatibility and last-known-good tests passed.');
}

main().catch(function (error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
