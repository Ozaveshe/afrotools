'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/contract-address-evidence.js');
const ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const registryBase = records => ({ schemaVersion:2, registryType:'curated-contract-address-evidence', reviewedAt:'2026-07-23', provenance:'AfroTools reviewed test registry.', records });

test('accepts only basic EVM address syntax without claiming checksum', () => {
  assert.equal(engine.validAddress(ROUTER), true);
  assert.equal(engine.validAddress('0x1234'), false);
  assert.equal(engine.validAddress('7a250d5630B4cF539739dF2C5dAcb4c659F2488D'), false);
  assert.equal(engine.validAddress('0xgggg000000000000000000000000000000000000'), false);
});

test('empty reviewed registry returns a neutral no-record state for Router02', () => {
  const registry = engine.normalizeRegistry(registryBase([]), { asOf:'2026-07-23' });
  const result = engine.check(ROUTER, 'ethereum', registry);
  assert.equal(result.status, 'no-reviewed-record');
  assert.equal(result.record, null);
  assert.match(result.explorerUrl, /^https:\/\/etherscan\.io\/address\//);
  assert.doesNotMatch(engine.text(result, false), /scam|fraud|high risk|malicious/i);
});

test('exact chain and address match is required for a cited reviewed record', () => {
  const registry = engine.normalizeRegistry(registryBase([{
    chain:'bsc', address:ROUTER, title:'Reviewed notice', summary:'Read the cited notice.', sourceLabel:'Official notice', sourcePublisher:'Example authority',
    sourceUrl:'https://example.org/notice', reviewedAt:'2026-07-23', evidenceStatus:'reviewed-record', confidence:'limited'
  }]), { asOf:'2026-07-23' });
  assert.equal(registry.records.length, 1);
  assert.equal(engine.check(ROUTER, 'ethereum', registry).status, 'no-reviewed-record');
  const match = engine.check(ROUTER.toLowerCase(), 'bsc', registry);
  assert.equal(match.status, 'reviewed-record');
  assert.equal(match.record.sourceUrl, 'https://example.org/notice');
  assert.match(match.explorerUrl, /^https:\/\/bscscan\.com\/address\//);
});

test('malformed registry and unsafe record URLs fail closed', () => {
  assert.equal(engine.normalizeRegistry(null).ok, false);
  const registry = engine.normalizeRegistry(registryBase([{ chain:'ethereum', address:ROUTER, title:'Notice', summary:'Summary', sourceLabel:'Source', sourcePublisher:'Publisher', sourceUrl:'javascript:alert(1)', reviewedAt:'2026-07-23', evidenceStatus:'reviewed-record', confidence:'limited' }]), { asOf:'2026-07-23' });
  assert.equal(registry.ok, false);
  assert.equal(registry.records.length, 0);
  assert.equal(engine.check(ROUTER, 'polygon', null).status, 'registry-unavailable');
});

test('schema, provenance, dates, evidence status and confidence are mandatory', () => {
  assert.equal(engine.normalizeRegistry({ records:[] }, { asOf:'2026-07-23' }).ok, false);
  assert.equal(engine.normalizeRegistry({ ...registryBase([]), reviewedAt:'2026-02-30' }, { asOf:'2026-07-23' }).ok, false);
  assert.equal(engine.normalizeRegistry({ ...registryBase([]), reviewedAt:'2999-01-01' }, { asOf:'2026-07-23' }).ok, false);
  assert.equal(engine.normalizeRegistry({ ...registryBase([]), provenance:'' }, { asOf:'2026-07-23' }).ok, false);
  const valid = { chain:'ethereum', address:ROUTER, title:'Notice', summary:'Neutral reviewed summary.', sourceLabel:'Source', sourcePublisher:'Publisher', sourceUrl:'https://example.org/notice', reviewedAt:'2026-07-23', evidenceStatus:'reviewed-record', confidence:'limited' };
  for (const mutation of [
    { reviewedAt:'2026-02-30' },
    { reviewedAt:'2999-01-01' },
    { sourcePublisher:'' },
    { sourceLabel:'' },
    { evidenceStatus:'accused' },
    { confidence:'certain' }
  ]) {
    assert.equal(engine.normalizeRegistry(registryBase([{...valid,...mutation}]), { asOf:'2026-07-23' }).ok, false);
  }
});

test('duplicate normalized chain and address records fail the registry closed', () => {
  const record = { chain:'ethereum', address:ROUTER, title:'Notice', summary:'Neutral reviewed summary.', sourceLabel:'Source', sourcePublisher:'Publisher', sourceUrl:'https://example.org/notice', reviewedAt:'2026-07-23', evidenceStatus:'reviewed-record', confidence:'limited' };
  const duplicate = {...record, address:ROUTER.toLowerCase(), title:'Conflicting notice', sourceUrl:'https://example.org/other'};
  const registry = engine.normalizeRegistry(registryBase([record, duplicate]), { asOf:'2026-07-23' });
  assert.equal(registry.ok, false);
  assert.equal(registry.error, 'duplicate-record');
  assert.deepEqual(registry.records, []);
});
