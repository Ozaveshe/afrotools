'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const fixture = require('./fixtures/farm-payroll-english-invariants.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/farm-payroll');
const { alternateEntries } = require('../scripts/lib/fr-agriculture-hreflang');

const ROOT = path.resolve(__dirname, '..');
const rows = manifest.rows.filter(row => row.family === 'farm-payroll');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);

function runtime() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['data/agriculture/farm-payroll-data.js', 'engines/src/farm-payroll-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return context.window.AfroTools;
}
function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
}
function html(row, locale) {
  const owner = locale === 'sw' ? row.swahili : row.english;
  return fs.readFileSync(path.join(ROOT, owner.file), 'utf8');
}
function hrefBlock(page) {
  return [...page.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="https:\/\/afrotools\.com([^"]+)">/g)]
    .map(match => ({ hreflang: match[1], route: match[2] }));
}
function serial(value) { return JSON.parse(JSON.stringify(value)); }

assert.equal(rows.length, 55);
assert.equal(countries.length, 54);
assert.ok(hub);
assert.equal(hash(fixture.owners.engine), fixture.owners.engineSha256);
assert.equal(hash(fixture.owners.data), fixture.owners.dataSha256);

const owners = runtime();
const oracleRows = [];

for (const row of rows) {
  const sw = html(row, 'sw');
  const expectedAlternates = alternateEntries(row);
  assert.deepEqual(hrefBlock(sw), expectedAlternates, `${row.english.id} Swahili hreflang`);
  assert.deepEqual(
    hrefBlock(html(row, 'en')).sort((left, right) => left.hreflang.localeCompare(right.hreflang)),
    alternateEntries(row).sort((left, right) => left.hreflang.localeCompare(right.hreflang)),
    `${row.english.id} English hreflang`
  );
  assert.doesNotMatch(sw, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(sw, /&amp;amp;|\brejea ya [A-Z]{2}\b|\bexports\b/i);
  assert.match(sw, /<html lang="sw"/);
  assert.match(sw, /"inLanguage":"sw"/);
  assert.match(sw, new RegExp(`<code>${row.english.id}</code>`));
  assert.match(sw, /Kiwango cha uhakika/);
  assert.match(sw, /picha tuli ya utafiti wa 2024/);
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)), `${row.english.id} artwork`);
  assert.match(sw, new RegExp(`property="og:image" content="https://afrotools.com/${row.artwork.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(sw, new RegExp(`property="og:url" content="https://afrotools.com${row.swahili.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));

  if (!row.country) {
    assert.equal((sw.match(/<li><a href="\/sw\/kilimo\/mishahara-ya-shamba\//g) || []).length, 54);
    assert.match(sw, /Rasilimali za kazi ya kilimo za ILO<\/a>/);
    assert.match(sw, /hifadhidata ya ILO NATLEX<\/a>/);
    oracleRows.push({
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      swahiliRoute: row.swahili.routeKey,
      countryCode: null,
      countryName: null,
      artwork: row.artwork.file,
      oracle: '54-country hub, named source, freshness, confidence and reciprocal locale mesh'
    });
    continue;
  }

  const code = row.country.code;
  const localizedName = contract.countryName(row);
  assert.ok(owners.FarmPayrollData[code], `${code} data`);
  assert.match(sw, /\/engines\/farm-payroll-engine\.js/);
  assert.match(sw, /\/data\/agriculture\/farm-payroll-data\.js/);
  assert.match(sw, /\/assets\/js\/pages\/sw-agriculture-farm-payroll\.js/);
  assert.match(sw, /Hifadhidata ya ILO NATLEX<\/a>/);
  assert.match(sw, new RegExp(`matangazo ya wizara ya kazi ya ${localizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(sw, new RegExp(`content="${code}"`));
  assert.match(sw, /Kokotoa mishahara/);
  for (const label of ['Pakua PDF', 'Pakua CSV', 'Pakua JSON', 'Pakua TXT', 'Shiriki', 'Hifadhi kwenye kivinjari']) assert.match(sw, new RegExp(label));
  for (const english of ['Calculate payroll', 'Number of Workers', 'Gross Monthly Salary', 'Export PDF', 'Data sources:']) assert.doesNotMatch(sw, new RegExp(english, 'i'));

  const expectedCases = fixture.countries[code].cases;
  assert.equal(expectedCases.length, 5);
  for (const expected of expectedCases) {
    const actual = owners.FarmPayrollEngine.calculate(expected.input, owners.FarmPayrollData[code]);
    assert.deepEqual(serial(actual), expected.output, `${code} ${expected.id} shared-engine oracle`);
  }
  const permanent = expectedCases.find(item => item.id === 'permanent-standard');
  const casual = expectedCases.find(item => item.id === 'casual-standard');
  const piece = expectedCases.find(item => item.id === 'piece-rate');
  oracleRows.push({
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: code,
    countryName: localizedName,
    currency: owners.FarmPayrollData[code].currency,
    artwork: row.artwork.file,
    sourceLabel: contract.SOURCE_LABEL,
    validOracles: {
      permanent: { input: permanent.input, expected: permanent.output },
      casual: { input: casual.input, expected: casual.output },
      pieceRate: { input: piece.input, expected: piece.output }
    },
    invalidBoundaries: [
      'workers below 1', 'workers above 100000', 'gross pay at 0',
      'days below 1', 'days above 31', 'piece units below 1',
      'overtime below 0', 'overtime above 744', 'negative housing', 'negative food'
    ]
  });
}

const report = {
  schemaVersion: 1,
  family: 'farm-payroll',
  locale: 'sw',
  routes: 55,
  countryOracles: 54,
  engineCases: 270,
  owners: {
    engine: fixture.owners.engine,
    engineSha256: fixture.owners.engineSha256,
    data: fixture.owners.data,
    dataSha256: fixture.owners.dataSha256,
    generator: 'scripts/build-sw-agriculture-family.js',
    contract: 'scripts/lib/sw-agriculture-family-contracts/farm-payroll.js',
    controller: 'assets/js/pages/sw-agriculture-farm-payroll.js'
  },
  rows: oracleRows
};
if (process.env.SW_AGRI_ORACLE_OUTPUT) {
  fs.mkdirSync(path.dirname(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT)), { recursive: true });
  fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles, engineCases: report.engineCases }, null, 2));
