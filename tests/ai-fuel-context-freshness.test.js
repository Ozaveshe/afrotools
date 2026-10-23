'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../assets/js/engines/fuel-tracker-engine.js');
const builderSource = fs.readFileSync(path.join(__dirname, '../scripts/build-ai-tool-context.js'), 'utf8');
const NOW = '2026-10-15T12:00:00.000Z';

function row(code, date, extra) {
  return Object.assign({ code, name: code, currency: 'NGN', last_updated: date,
    source_url: 'https://example.test/fuel/' + code, official_verified: false,
    petrol: { price: 300, usd: 0.33 } }, extra);
}

function fixtureBuilder(date, overrides = {}, clockValues = [NOW]) {
  const snapshot = Object.assign({ source: 'Synthetic dated snapshot', source_state: 'third_party_snapshot',
    timestamp: NOW, official_verified_count: 0,
    countries: [row('NG', date), row('KE', '2000-01-01'), row('ZA', '2000-01-01'), row('GH', '2000-01-01')] }, overrides);
  let clockReads = 0;
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [clockValues[Math.min(clockReads++, clockValues.length - 1)]])); }
    static now() { return Date.parse(NOW); }
  }
  const sandbox = {
    __dirname: path.join(__dirname, '../scripts'), module: { exports: {} }, exports: {}, Date: Clock,
    require(id) {
      if (id === 'fs') return {
        existsSync() { return true; },
        readdirSync() { return ['fuel-cost', 'generator-fuel', 'fuel-tracker', 'suivi-carburant-fr'].map(key => key + '.json'); },
        readFileSync(file) {
        if (file.endsWith('formula-registry.json')) return JSON.stringify({ formulas: [] });
        if (file.endsWith('_meta.json')) return JSON.stringify({ fuel: { source: snapshot.source,
          source_state: snapshot.source_state, as_of: NOW } });
        if (file.endsWith(path.join('fuel', 'latest.json'))) return JSON.stringify(snapshot);
        if (file.includes(path.join('ai', 'tool-context'))) return JSON.stringify({ schemaVersion: 1,
          toolKey: path.basename(file, '.json'), legacyTextSha256: 'sha256:' + 'a'.repeat(64),
          status: 'source-coupled', staticText: 'Synthetic planning reference.', sourceBindings: [{ kind: 'fuel-snapshot' }] });
        throw new Error('Unexpected fixture read: ' + file);
      } };
      if (id === '../data/calculation-quality/paye-availability.json') return require(id);
      if (id.endsWith('fuel-tracker-engine.js')) return engine;
      if (id === '../assets/js/engines/afrorates-verified') return {};
      if (['crypto', 'path', 'vm', 'module'].includes(id)) return require(id);
      throw new Error('Unexpected fixture require: ' + id);
    }
  };
  vm.runInNewContext(builderSource, sandbox, { filename: 'actual-build-ai-tool-context.js' });
  return sandbox.module.exports;
}

function sourceRecord(date, overrides = {}) {
  return JSON.parse(JSON.stringify(fixtureBuilder(date, overrides).buildSourceRecord({ kind: 'fuel-snapshot' })));
}

test('a newly fetched package cannot make a 66-day-old row usable', () => {
  const record = sourceRecord('2026-08-10');
  assert.equal(record.facts.countries.length, 0);
  assert.equal(record.facts.excluded.find(x => x.code === 'NG').reason, 'Snapshot is older than 45 days.');
  assert.match(record.text, /no reviewed sample row passed/);
  assert.doesNotMatch(record.text, /NG: petrol/);
});

test('future snapshot days and same-day future timestamps are withheld', () => {
  for (const date of ['2026-10-16', '2026-10-15T12:00:00.001Z']) {
    const gate = engine.rowUsability(row('NG', date), 'petrol', NOW, 45);
    assert.equal(gate.usable, false, date);
    assert.equal(gate.reason, 'Snapshot date is in the future.');
    assert.equal(sourceRecord(date).facts.countries.length, 0, date);
  }
});

test('a fresh row after the historical review is retained with unchanged price, date and source', () => {
  const record = sourceRecord('2026-10-14');
  assert.deepEqual(record.facts.countries, [{ code: 'NG', name: 'NG', currency: 'NGN', petrol: 300,
    asOf: '2026-10-14', sourceUrl: 'https://example.test/fuel/NG' }]);
  assert.match(record.text, /NG: petrol NGN 300\/litre, row dated 2026-10-14/);
});

test('freshness evaluation and historical review have distinct truthful dates', () => {
  const record = sourceRecord('2026-10-14');
  assert.equal(record.facts.reviewedOn, '2026-07-22');
  assert.equal(record.facts.freshnessCheckedOn, '2026-10-15');
  assert.equal(record.facts.maxAgeDays, 45);
  assert.match(record.text, /Source reviewed: 2026-07-22/);
  assert.match(record.text, /Filtering is performed at generation time; this is not runtime or live verification\./);
  assert.doesNotMatch(record.text, /Freshness checked against the build clock/);
});

test('the unchanged 45-day boundary accepts 45 and rejects 46 days', () => {
  assert.equal(sourceRecord('2026-08-31T12:00:00Z').facts.countries.length, 1);
  assert.equal(sourceRecord('2026-08-30T12:00:00Z').facts.countries.length, 0);
});

test('missing or invalid row dates, missing sources and nonpositive prices stay withheld', () => {
  for (const date of ['', 'invalid']) assert.equal(sourceRecord(date).facts.countries.length, 0);
  for (const extra of [{ source_url: '' }, { petrol: { price: 0, usd: 0.33 } }, { petrol: { price: 300, usd: 0 } }]) {
    assert.equal(engine.rowUsability(row('NG', '2026-10-14', extra), 'petrol', NOW, 45).usable, false);
  }
});

test('official qualifiers remain tied to source flags and package metadata', () => {
  const record = sourceRecord('2026-10-14');
  assert.equal(record.facts.officialVerifiedCount, 0);
  assert.equal(record.facts.sourceState, 'third_party_snapshot');
  assert.match(record.text, /0 officially verified rows/);
  assert.match(record.text, /not official verification/);
  const gate = engine.rowUsability(row('NG', '2026-10-14', { official_source_url: 'https://official.example.test' }), 'petrol', NOW, 45);
  assert.equal(gate.sourceUrl, 'https://example.test/fuel/NG');
});

test('age display and planned market-record semantics are unchanged by snapshot-only rejection', () => {
  assert.equal(engine.ageDays('2026-10-16', NOW), 0);
  const planned = { fuel_type: 'petrol', price: 300, currency: 'NGN', unit: 'litre',
    source_url: 'https://example.test/planned', effective_date: '2026-10-16' };
  assert.equal(engine.recordStatus(planned, NOW, 45).available, true);
  // Market UI consumers independently reject future effective/verified dates.
  assert.equal(engine.calculateFillCost({ pricePerLitre: 300, mode: 'quantity', unit: 'litre', quantity: 2 }).totalCost, 600);
});

test('one owner build uses one fuel evaluation clock across midnight and the age boundary', () => {
  const builder = fixtureBuilder('2026-08-31T00:00:00Z', {}, ['2026-10-15T23:59:59.999Z', '2026-10-16T00:00:00.001Z']);
  const built = builder.buildAll();
  assert.equal(built.summary.total, 4);
  for (const { sourceRecord: record } of Object.values(built.records)) {
    assert.equal(record.facts.freshnessCheckedOn, '2026-10-15');
    assert.equal(record.facts.countries.length, 1);
    assert.equal(record.facts.countries[0].asOf, '2026-08-31T00:00:00Z');
  }
});

test('unchanged fuel row eligibility produces identical prose on successive UTC build days', () => {
  for (const [rowDate, expectedCount] of [['2026-10-18T12:00:00.000Z', 1], ['2026-08-10', 0]]) {
    const first = fixtureBuilder(rowDate, {}, ['2026-10-19T12:00:00.000Z']).buildAll();
    const second = fixtureBuilder(rowDate, {}, ['2026-10-20T12:00:00.000Z']).buildAll();
    assert.equal(first.summary.total, 4);
    assert.deepEqual(Object.keys(second.contexts).sort(), Object.keys(first.contexts).sort());
    for (const key of Object.keys(first.contexts)) {
      assert.equal(first.contexts[key], second.contexts[key], key + ' must not drift only because the UTC day changes');
      assert.equal(first.records[key].sourceRecord.facts.freshnessCheckedOn, '2026-10-19');
      assert.equal(second.records[key].sourceRecord.facts.freshnessCheckedOn, '2026-10-20');
      assert.equal(first.records[key].sourceRecord.facts.countries.length, expectedCount);
      assert.equal(second.records[key].sourceRecord.facts.countries.length, expectedCount);
      assert.match(second.contexts[key], /Source reviewed: 2026-07-22/);
      if (expectedCount) assert.match(second.contexts[key], /row dated 2026-10-18T12:00:00\.000Z/);
      else assert.match(second.contexts[key], /no reviewed sample row passed/);
    }
  }
});

test('a real 45-to-46-day transition changes fuel selection and emitted facts', () => {
  const first = fixtureBuilder('2026-09-04T12:00:00.000Z', {}, ['2026-10-19T12:00:00.000Z']).buildAll();
  const second = fixtureBuilder('2026-09-04T12:00:00.000Z', {}, ['2026-10-20T12:00:00.000Z']).buildAll();
  for (const key of Object.keys(first.contexts)) {
    assert.equal(first.records[key].sourceRecord.facts.countries.length, 1);
    assert.equal(second.records[key].sourceRecord.facts.countries.length, 0);
    assert.equal(second.records[key].sourceRecord.facts.excluded.find(row => row.code === 'NG').reason, 'Snapshot is older than 45 days.');
    assert.match(first.contexts[key], /NG: petrol NGN 300\/litre/);
    assert.doesNotMatch(second.contexts[key], /NG: petrol/);
    assert.match(second.contexts[key], /no reviewed sample row passed/);
    assert.notEqual(first.contexts[key], second.contexts[key]);
  }
});

test('a future row becomes eligible only when the actual evaluation clock reaches its timestamp', () => {
  const first = fixtureBuilder('2026-10-20T12:00:00.000Z', {}, ['2026-10-19T12:00:00.000Z']).buildAll();
  const second = fixtureBuilder('2026-10-20T12:00:00.000Z', {}, ['2026-10-20T12:00:00.000Z']).buildAll();
  for (const key of Object.keys(first.contexts)) {
    assert.equal(first.records[key].sourceRecord.facts.countries.length, 0);
    assert.equal(first.records[key].sourceRecord.facts.excluded.find(row => row.code === 'NG').reason, 'Snapshot date is in the future.');
    assert.equal(second.records[key].sourceRecord.facts.countries.length, 1);
    assert.doesNotMatch(first.contexts[key], /NG: petrol/);
    assert.match(second.contexts[key], /NG: petrol NGN 300\/litre, row dated 2026-10-20T12:00:00\.000Z/);
    assert.notEqual(first.contexts[key], second.contexts[key]);
  }
});
