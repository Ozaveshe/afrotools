'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const cp = require('node:child_process');
const { parseTelecomData, readTelecomData } = require('../scripts/lib/read-telecom-data');
const root = path.resolve(__dirname, '..');
const datasetPath = path.join(root, 'data/telecom/country-telecom-index.js');

test('actual source-registry Telecom entry reads archived data without calling frontend fetch', () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw new Error('Unexpected frontend fetch during Node data read'); };
  try {
    const { buildTelecomSnapshotEntry } = require('../scripts/build-source-registry');
    const entry = buildTelecomSnapshotEntry('2026-10-17');
    assert.equal(calls, 0);
    assert.equal(entry.lastReviewedAt, '2026-03-01');
    assert.equal(entry.confidence, 'low_confidence');
    assert.equal(entry.countryCodes.length, 12);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(datasetPath)).digest('hex');
    assert.ok(entry.notes.includes('artifactDigest=sha256:' + digest));
  } finally {
    globalThis.fetch = previous;
  }
});

test('every archived value matches the browser local-only interpretation without network or file mutation', () => {
  const source = fs.readFileSync(datasetPath, 'utf8');
  let calls = 0;
  const reference = vm.runInNewContext(source + ';JSON.stringify(TELECOM_DATA)', {
    window: { AFROTOOLS_TELECOM_DISABLE_LIVE_DATA: true },
    fetch() { calls += 1; throw new Error('Browser reference must stay local-only'); }
  }, { timeout: 1000 });
  const actual = readTelecomData();
  assert.deepEqual(actual, JSON.parse(reference));
  assert.equal(actual.lastUpdated, '2026-03-01');
  assert.equal(Object.keys(actual.countries).length, 12);
  assert.equal(calls, 0);
  assert.equal(fs.readFileSync(datasetPath, 'utf8'), source);
  actual.countries.NG.name = 'Synthetic changed copy';
  assert.equal(readTelecomData().countries.NG.name, 'Nigeria', 'reads do not share mutable state');
});

test('declarative parser ignores trailing browser effects without executing any supplied expression', () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw new Error('Unexpected fetch'); };
  try {
    const data = parseTelecomData('var TELECOM_DATA={lastUpdated:"recorded-date",countries:{AA:{free:!0,missing:!1,cost:1e3,offset:-2,zero:+0,label:"A",items:[null,3]}}};fetch("https://synthetic.invalid/");throw new Error("BOOT executed");');
    assert.deepEqual(data, { lastUpdated: 'recorded-date', countries: { AA: { free: true, missing: false, cost: 1000, offset: -2, zero: 0, label: 'A', items: [null, 3] } } });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previous;
  }
});

test('calls, getters, computed keys, spreads and non-finite values in data are rejected without effects', () => {
  let calls = 0;
  const previous = globalThis.telecomReaderProbe;
  globalThis.telecomReaderProbe = () => { calls += 1; return 1; };
  try {
    for (const expression of ['telecomReaderProbe()', '{get x(){return telecomReaderProbe()}}', '{[telecomReaderProbe()]:1}', '{...telecomReaderProbe()}', '[...telecomReaderProbe()]', '1e999', 'undefined', '/x/']) {
      assert.throws(() => parseTelecomData('var TELECOM_DATA={lastUpdated:"recorded",countries:{AA:' + expression + '}};'), /Unsupported|Executable|computed/);
    }
    assert.equal(calls, 0);
  } finally {
    if (previous === undefined) delete globalThis.telecomReaderProbe;
    else globalThis.telecomReaderProbe = previous;
  }
});

test('missing, duplicate, malformed or ambiguous data bindings fail closed', () => {
  for (const source of [
    'var OTHER={};',
    'var TELECOM_DATA;',
    'var TELECOM_DATA={lastUpdated:"x",countries:{}}; var TELECOM_DATA={};',
    'var TELECOM_DATA={lastUpdated:"x",countries:{__proto__:{x:1}}};',
    'var TELECOM_DATA={lastUpdated:"x",countries:{AA:1,AA:2}};',
    'var TELECOM_DATA={lastUpdated:"x",countries:{}}; function(',
    'var TELECOM_DATA={lastUpdated:"x",countries:[]};'
  ]) assert.throws(() => parseTelecomData(source));
});

test('actual ledger check succeeds with a throwing fetch sentinel and preserves source bytes', () => {
  const before = fs.readFileSync(datasetPath);
  const code = 'globalThis.fetch=()=>{throw new Error("Unexpected ledger frontend fetch")};process.argv=[process.execPath,"scripts/update-telecom-source-ledger.js","--check"];require("./scripts/update-telecom-source-ledger.js");';
  const result = cp.spawnSync(process.execPath, ['--eval', code], { cwd: root, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Telecom source ledger valid/);
  assert.ok(before.equals(fs.readFileSync(datasetPath)));
});
