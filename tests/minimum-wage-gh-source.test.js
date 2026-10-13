const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load(file) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}
// NTC signed communique of 9 November 2025: daily rate from 1 January 2026.
const reference = load('data/hr/minimum-wages.js').MINIMUM_WAGES.GH;
assert.equal(reference.nationalMinimum.daily, 21.77);
assert.equal(reference.nationalMinimum.effectiveDate, '2026-01-01');
assert.equal(reference.nationalMinimum.monthly, 478.94);
assert.match(reference.nationalMinimum.notes, /22 paid days.*not a statutory monthly/);
const observation = load('data/hr/minimum-wages.js').MW_OBSERVATIONS.GH;
assert.match(observation, /22-paid-day planning month is GHS 478\.94/);
assert.doesNotMatch(observation, /27-paid-day/);
assert.equal(reference.sources[0].url, 'https://fairwages.gov.gh/wp-content/uploads/2025/11/2026-National-Daily-Minimum-Wage.pdf');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/hr-payroll/official-sources.json'), 'utf8'));
const source = ledger.sources.find(row => row.id === 'mw-gh-ntc-2026');
assert.equal(source.url, reference.sources[0].url);
assert.equal(source.lastVerified, reference.lastVerified);
assert.equal(source.effectiveDate, reference.nationalMinimum.effectiveDate);
for (const file of ['engines/src/minimum-wage-engine.js', 'engines/minimum-wage-engine.js']) {
  const engine = load(file).window.AfroTools.MinWageEngine;
  const gh = engine.getCountry('GH');
  assert.equal(gh.daily, 21.77);
  assert.equal(gh.monthly, 478.94);
  assert.equal(gh.effectiveDate, '2026-01-01');
  // Historical chart uses its explicit 30-paid-day planning basis.
  for (const [year, daily, monthly] of [['2026', '21.77', 653.1], ['2025 (November)', '19.97', 599.1], ['2024', '18.15', 544.5]]) {
    const row = gh.history.find(item => item.year === year);
    assert.equal(row.amount, 'GHS ' + daily + '/day');
    assert.equal(row.nominal, monthly);
  }
  assert.match(gh.notes, /Historical chart monthly equivalents use 30 paid days/);
  assert.equal(engine.getAllCountries().find(row => row.code === 'GH').daily, 21.77);
  assert.match(gh.notes, /22 paid days.*not a statutory monthly/);
}
const domestic = load('data/hr/domestic-worker-data.js').DOMESTIC_WORKER.GH;
assert.equal(domestic.minimumWage, 21.77);
assert.equal(domestic.monthly, 478.94);
assert.match(domestic.notes, /22 paid days/);
console.log('Ghana dated daily source, explicit planning conversion and shipped engine parity: PASS');

// Literal before/after review fixtures cover both old and corrected monthly boundaries.
const ghReview = JSON.parse(fs.readFileSync(path.join(root, 'docs/formula-change-review-2026-10-12-ghana-minimum-wage.json'), 'utf8'));
for (const file of ['engines/src/minimum-wage-engine.js', 'engines/minimum-wage-engine.js']) {
  const engine = load(file).window.AfroTools.MinWageEngine;
  for (const fixture of ghReview.fixtureDeltas) {
    const actual = fixture.input ? engine.checkCompliance('GH', fixture.input.salary) : engine.getCountry('GH');
    for (const [key, expected] of Object.entries(fixture.nextExpected)) assert.equal(actual[key], expected, fixture.fixtureId + ': ' + key);
  }
  for (const [salary, expected] of [[478.93, false], [478.94, true], [478.95, true], [544.49, true], [544.50, true], [544.51, true]]) {
    assert.equal(engine.checkCompliance('GH', salary).compliant, expected);
    assert.equal(engine.checkCompliance('GH', salary).minimum, 478.94);
  }
}
assert.equal(ghReview.fixtureDeltas.length, 7);
assert.equal(ghReview.fixtureDeltas[0].previousExpected.daily, 18.15);
assert.equal(ghReview.fixtureDeltas[0].previousExpected.monthly, 544.5);
console.log('Ghana actual-engine result review and one-cent boundaries: PASS');
