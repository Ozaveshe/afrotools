'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/exchange-due-diligence.js');
const AS_OF = '2026-07-23';

function provider(name, statuses = {}) {
  const items = {};
  for (const code of engine.ITEMS) items[code] = statuses[code] || { status: 'not-checked', sourceUrl: '', notes: '' };
  return { name, country: 'Nigeria', checkedDate: '2026-07-23', items };
}

test('counts only source-backed confirmed evidence without scoring providers', () => {
  const alpha = provider('Alpha', {
    'official-domain': { status: 'confirmed', sourceUrl: 'https://example.com/terms', notes: 'Official terms' },
    'small-withdrawal-test': { status: 'not-applicable', sourceUrl: '', notes: '' }
  });
  const report = engine.build({ providers: [alpha, provider('Beta')] }, { asOf: AS_OF });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.providers[0].counts, { documented: 1, applicable: 9, unresolved: 8, notApplicable: 1 });
  assert.equal(Object.hasOwn(report.providers[0], 'score'), false);
  assert.match(report.boundary, /No trust score/);
});

test('confirmed evidence without an HTTPS source fails closed', () => {
  const alpha = provider('Alpha', {
    'country-availability': { status: 'confirmed', sourceUrl: '', notes: 'No source' }
  });
  const report = engine.build({ providers: [alpha, provider('Beta')] }, { asOf: AS_OF });
  assert.ok(report.errors.includes('provider-1-country-availability-source'));
  assert.equal(report.providers[0].items[1].sourceMissing, true);
  assert.equal(report.providers[0].items[1].documented, false);
});

test('fails closed on future dates and unsafe or malformed source URLs', () => {
  const alpha = provider('Alpha', { 'official-domain': { status: 'confirmed', sourceUrl: 'javascript:alert(1)', notes: '' } });
  alpha.checkedDate = '2999-01-01';
  const report = engine.build({ providers: [alpha, provider('Beta')] }, { asOf: AS_OF });
  assert.ok(report.errors.includes('provider-1-future-date'));
  assert.ok(report.errors.includes('provider-1-official-domain-source'));
  assert.equal(report.providers[0].items[0].documented, false);
});

test('rejects impossible dates, insecure URLs and credential-bearing URLs', () => {
  const invalid = provider('Alpha', {
    'official-domain': { status:'confirmed', sourceUrl:'http://example.com', notes:'' },
    'fee-schedule': { status:'confirmed', sourceUrl:'https://user:secret@example.com/fees', notes:'' }
  });
  invalid.checkedDate = '2026-02-30';
  const report = engine.build({ providers:[invalid, provider('Beta')] }, { asOf: AS_OF });
  assert.ok(report.errors.includes('provider-1-date'));
  assert.ok(report.errors.includes('provider-1-official-domain-source'));
  assert.ok(report.errors.includes('provider-1-fee-schedule-source'));
  assert.equal(report.providers[0].counts.documented, 0);
});

test('treats checks older than 90 days as unresolved and surfaces age', () => {
  const stale = provider('Alpha', { 'official-domain': { status:'confirmed', sourceUrl:'https://example.com', notes:'' } });
  stale.checkedDate = '2026-01-01';
  const report = engine.build({ providers:[stale, provider('Beta')] }, { asOf: AS_OF });
  assert.equal(report.errors.length, 0);
  assert.equal(report.providers[0].evidenceStale, true);
  assert.ok(report.providers[0].ageDays > 90);
  assert.equal(report.providers[0].counts.documented, 0);
  assert.equal(report.providers[0].counts.unresolved, 10);
});

test('bounds user text and produces native plain-text records', () => {
  const report = engine.build({ providers: [provider('A'.repeat(100)), provider('Beta')] }, { asOf: AS_OF });
  assert.equal(report.providers[0].name.length, 80);
  const labels = { items:Object.fromEntries(engine.ITEMS.map(code => [code, code])), statuses:Object.fromEntries(engine.STATUSES.map(code => [code, code])) };
  assert.match(engine.text(report, 'en', labels), /Evidence coverage only/);
  assert.match(engine.text(report, 'fr', labels), /Dossier local/);
});
