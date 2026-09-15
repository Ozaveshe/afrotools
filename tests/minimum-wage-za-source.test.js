const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const seed = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/hr/minimum-wages.js'), 'utf8'), seed);
const za = seed.MINIMUM_WAGES.ZA;
// Gazette 54075, Notice R. 7083, Schedules 1 and 2 (effective 1 March 2026).
assert.equal(za.nationalMinimum.hourly, 30.23);
assert.equal(za.nationalMinimum.effectiveDate, '2026-03-01');
for (const sector of ['General workers', 'Farm workers', 'Domestic workers']) {
  assert.equal(za.sectorRates.find(row => row.sector === sector).hourly, 30.23);
}
assert.equal(za.sectorRates.find(row => row.sector.includes('EPWP')).hourly, 16.62);
const learnership = za.sectorRates.find(row => row.sector.includes('Learnership'));
assert.equal(learnership.hourly, undefined, 'Learnerships have scheduled weekly allowances, not a universal hourly floor');
assert.match(learnership.notes, /Weekly.*NQF.*Schedule 2/);
assert.equal(za.nationalMinimum.daily, 30.23 * 8);
assert.equal(za.nationalMinimum.monthly, Number((30.23 * 8 * 22).toFixed(2)));
assert.match(za.nationalMinimum.notes, /planning equivalents/);
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/hr-payroll/official-sources.json'), 'utf8'));
const evidence = ledger.sources.find(row => row.id === 'mw-za-gazette-2026');
assert.ok(evidence);
assert.equal(za.sources[0].url, evidence.url);
assert.equal(evidence.effectiveDate, za.nationalMinimum.effectiveDate);
assert.equal(evidence.lastVerified, za.lastVerified);
assert.equal(new URL(evidence.url).hostname, 'www.gov.za');
// Both the readable and shipped calculator must agree with the payroll ledger.
for (const file of ['engines/src/minimum-wage-engine.js', 'engines/minimum-wage-engine.js']) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  const engine = context.window.AfroTools.MinWageEngine;
  assert.equal(engine.getCountry('ZA').hourly, za.nationalMinimum.hourly);
  assert.equal(engine.getAllCountries('name').find(row => row.code === 'ZA').hourly, 30.23);
  assert.equal(engine.getStateRates('ZA').find(row => row.code === 'epwp').rate, 16.62);
}
console.log('South Africa minimum-wage statutory source and calculator parity: PASS');
