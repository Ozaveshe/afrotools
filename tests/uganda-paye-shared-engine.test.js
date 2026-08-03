'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../assets/js/engines/ug-paye');
const server = require('../netlify/functions/_engines/ug-paye');
const manifest = require('../assets/js/ai/tool-manifest');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exact = (actual, expected, label) => assert.strictEqual(actual, expected, `${label}: expected ${expected}, got ${actual}`);

const resident = [
  [0, 0], [235000, 0], [235001, 0.1], [335000, 10000], [335001, 10000.2],
  [410000, 25000], [410001, 25000.3], [1900000, 472000],
  [10000000, 2902000], [10000001, 2902000.4],
];
const nonResident = [
  [0, 0], [1, 0.1], [335000, 33500], [335001, 33500.2],
  [410000, 48500], [410001, 48500.3], [1900000, 495500],
  [10000000, 2925500], [10000001, 2925500.4],
];
resident.forEach(([income, tax]) => exact(engine.taxMonthly(income, 'RESIDENT').tax, tax, `resident ${income}`));
nonResident.forEach(([income, tax]) => exact(engine.taxMonthly(income, 'NON_RESIDENT').tax, tax, `non-resident ${income}`));
assert.strictEqual(engine.taxMonthly(-1, 'RESIDENT').ok, false, 'negative taxable income fails closed');
assert.strictEqual(engine.calculate({ grossMonthly: NaN }).ok, false, 'invalid gross fails closed');

const kccaExample = engine.calculate({ grossMonthly: 420000, regime: 'RESIDENT', lstEnabled: true, nssfEnabled: true });
assert.strictEqual(kccaExample.ok, true, 'KCCA UGX 420,000 worked example calculates');
exact(kccaExample.lstAnnual, 30000, 'KCCA example annual LST');
exact(kccaExample.lstAssessmentGross, 420000, 'KCCA example gross assessment base');
exact(kccaExample.taxableIncome, 390000, 'KCCA example PAYE base after LST');
exact(kccaExample.monthlyPaye, 21000, 'KCCA example resident PAYE');
exact(kccaExample.employeeNssfMonthly, 21000, 'KCCA example employee NSSF');
exact(kccaExample.netMonthly, 348000, 'KCCA example net pay');
assert.deepStrictEqual(kccaExample.lstCollectionSchedule, [30000], 'default payroll collects the annual LST once');

const customCollection = engine.calculate({ grossMonthly: 2000000, regime: 'RESIDENT', lstEnabled: true, nssfEnabled: true, lstPayrollDeduction: 25000 });
assert.strictEqual(customCollection.ok, true, 'custom LST collection calculates');
exact(customCollection.lstAnnual, 100000, 'custom collection does not change annual LST assessment');
exact(customCollection.lstPayrollDeduction, 25000, 'custom collection applies to the current payroll once');
assert.deepStrictEqual(customCollection.lstCollectionSchedule, [25000, 75000], 'remaining annual LST is allocated to a later collection payroll');
exact(customCollection.monthlyPaye, 494500, 'current PAYE uses current LST collection');
exact(customCollection.annualPaye, 5994000, 'annual PAYE uses the actual collection schedule, not twelve custom deductions');
exact(customCollection.netAnnual, 16706000, 'annual net deducts annual LST exactly once');

for (const regime of engine.regimes) {
  const browserValue = engine.calculate({ grossMonthly: 2000000, regime, lstEnabled: true, nssfEnabled: true });
  assert.strictEqual(browserValue.ok, true, `${regime} shared engine result`);
  exact(browserValue.lstAnnual, 100000, `${regime} annual LST`);
  exact(browserValue.lstPayrollDeduction, 100000, `${regime} LST precedes PAYE`);
  exact(browserValue.taxableIncome, 1900000, `${regime} taxable income after LST`);
  exact(browserValue.employeeNssfMonthly, 100000, `${regime} employee NSSF remains separate`);
  exact(browserValue.employerNssfMonthly, 200000, `${regime} employer NSSF remains separate`);
  exact(browserValue.monthlyPaye, regime === 'RESIDENT' ? 472000 : 495500, `${regime} monthly PAYE oracle`);
  const serverValue = server.calculate({ grossMonthly: 2000000, regime, lst: true, nssf: true });
  exact(serverValue.tax.taxableIncomeMonthly, browserValue.taxableIncome, `${regime} server taxable parity`);
  exact(serverValue.deductions.paye, browserValue.annualPaye, `${regime} server annual PAYE parity`);
  exact(serverValue.deductions.nssfEmployee, browserValue.employeeNssfAnnual, `${regime} server NSSF parity`);
  assert.deepStrictEqual(serverValue.deductions.localServiceTaxCollectionSchedule, browserValue.lstCollectionSchedule, `${regime} server LST collection parity`);
  exact(serverValue.tax.lstAssessmentGross, browserValue.lstAssessmentGross, `${regime} server LST assessment parity`);
  exact(serverValue.result.netMonthly, browserValue.netMonthly, `${regime} server net parity`);
}

const serverBoundary = server.calculate({ grossMonthly: 420000, regime: 'RESIDENT', lst: true, nssf: true });
exact(serverBoundary.deductions.localServiceTax, 30000, 'server KCCA example LST');
exact(serverBoundary.deductions.paye, kccaExample.annualPaye, 'server KCCA example annual PAYE parity');
exact(serverBoundary.result.netMonthly, 348000, 'server KCCA example net parity');
const serverCustom = server.calculate({ grossMonthly: 2000000, regime: 'RESIDENT', lst: true, nssf: true, lstPayrollDeduction: 25000 });
assert.deepStrictEqual(serverCustom.deductions.localServiceTaxCollectionSchedule, [25000, 75000], 'server preserves custom LST collection semantics');
exact(serverCustom.deductions.paye, 5994000, 'server custom annual PAYE parity');

const consumers = [
  'uganda/ug-paye.html',
  'sw/uganda/kikokotoo-kodi-mshahara/index.html',
];
for (const file of consumers) {
  const source = read(file);
  assert.match(source, /\/assets\/js\/engines\/ug-paye\.js/, `${file} loads the shared engine`);
  assert.match(source, /ugandaPaye/, `${file} calls the shared engine`);
  assert.doesNotMatch(source, /income\s*>\s*410000|income\s*<=\s*335000/, `${file} does not duplicate the statutory formula`);
  assert.doesNotMatch(source, /flat 30|30 % forfaitaire/i, `${file} does not claim flat non-resident tax`);
  assert.doesNotMatch(source, /effective 1 July 2026|en vigueur au 1er juillet 2026/i, `${file} does not claim the returned bill is effective`);
}
assert.match(read('netlify/functions/_engines/ug-paye.js'), /require\('\.\.\/\.\.\/\.\.\/assets\/js\/engines\/ug-paye'\)/, 'Netlify consumes the shared engine');

const context = JSON.parse(read('data/ai/tool-context/ug-paye.json'));
assert.deepStrictEqual(context.sourceBindings, [{ kind: 'paye-engine', countryCode: 'UG', formulaId: 'paye-server-ug' }], 'AI context remains source-coupled to the repaired formula');
const tools = manifest.loadDefaultToolManifest();
const ranked = manifest.rankToolCandidates('Uganda PAYE salary tax', tools).candidates;
const ugandaCandidate = ranked.find((candidate) => candidate.tool.id === 'ug-paye');
assert.ok(ugandaCandidate, 'AI retrieval exposes ug-paye as a candidate');
assert.ok(ugandaCandidate.score >= 100, `AI candidate score should be strong, got ${ugandaCandidate.score}`);
assert.ok(ranked.indexOf(ugandaCandidate) <= 1, 'ug-paye must be in the first two candidates behind the country PAYE directory at most');

assert.match(engine.formulaParameters.lstAssessmentBase, /gross salary/i, 'LST is assessed from gross salary');
assert.match(server.source, /assessed from monthly gross salary/i, 'server exposes the same official LST basis');

console.log('uganda-paye-shared-engine.test.js passed');
