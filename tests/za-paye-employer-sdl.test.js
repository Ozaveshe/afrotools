'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const plain = v => JSON.parse(JSON.stringify(v));
function browser(file) {
  const window = { AfroTools: {} };
  vm.runInNewContext(read(file), { window, console, Math, Number, Intl, Date }, { timeout: 1000 });
  return window.AfroTools.engines.zaPAYE;
}
const readable = browser('assets/js/engines/src/za-paye.js');
const served = browser('assets/js/engines/za-paye.js');
const html = read('south-africa/za-paye.html');
const context = vm.createContext({ Math, Number, Infinity, isFinite });
vm.runInContext(html.slice(html.indexOf('const SARS_BANDS ='), html.indexOf('function reverseCalc(')) + ';this.calculate=computePAYE;', context, { timeout: 1000 });
const models = [readable, served, { calculate: context.calculate }];
const server = require('../netlify/functions/_engines/za-paye');
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const basis = 'salary_less_modelled_allowable_retirement';
// Independent salary-only examples: 1% of remuneration after the existing allowed
// retirement deduction (SARS2027 employer guide, SDL). Not a liability assessment.
for (const [name, gross, raw, deduction, sdl] of [
  ['zero contribution', 600000, 0, 0, 6000],
  ['allowed contribution', 600000, 100000, 100000, 5000],
  ['percentage cap', 100000, 90000, 27500, 725],
  ['annual cap', 2000000, 500000, 430000, 15700],
  ['raw amount above percentage cap', 600000, 500000, 165000, 4350],
  ['zero salary', 0, 1000, 0, 0],
]) {
  test(`all actual models calculate SDL after allowable retirement: ${name}`, () => {
    for (const model of models) {
      const r = model.calculate(gross, { retirement: raw, retirementFunding: 'tax_effect_only' });
      near(r.retirementTaxDeductionAnnual, deduction);
      near(r.employerSDLBaseAnnual, gross - deduction);
      near(r.employerSDL, sdl);
      near(r.totalEmployerCost, gross + r.employerUIF + sdl);
      assert.equal(r.employerSDLBasis, basis);
      assert.equal(r.employerSDLAssumesLiability, true);
    }
    const r = server.calculate({ grossAnnual: gross, retirement: raw, age: 35 });
    near(r.meta.employerSDLBaseAnnual, gross - deduction);
    assert.equal(r.employer.sdl, Math.round(sdl));
    const employerUif = Math.min(gross / 12, 17712) * .01 * 12;
    assert.equal(r.employer.totalCostAnnual, Math.round(gross + employerUif + sdl));
    assert.equal(r.employer.totalCostMonthly, Math.round((gross + employerUif + sdl) / 12));
    assert.equal(r.meta.employerSDLBasis, basis);
    assert.equal(r.meta.employerSDLAssumesLiability, true);
  });
}
test('funding choice, employee PAYE and medical credits do not reduce the SDL base further', () => {
  for (const model of models) {
    for (const retirementFunding of ['employee_cash', 'tax_effect_only', undefined]) {
      const r = model.calculate(600000, { retirement: 100000, retirementFunding, medMembers: 3 });
      near(r.employerSDLBaseAnnual, 500000);
      near(r.employerSDL, 5000);
      near(r.paye, 86345);
      near(r.employerUIF, 2125.44);
    }
    const r = model.calculate(600000, { retirement: 100000, uif: false });
    near(r.uif, 0);
    near(r.employerUIF, 2125.44); // Existing browser behavior is deliberately retained.
    near(r.employerSDL, 5000);
  }
  const r = server.calculate({ grossAnnual: 600000, retirement: 100000, uif: false });
  assert.equal(r.employer.uif, 0); // Existing server switch semantics, not changed here.
  assert.equal(r.employer.totalCostAnnual, 605000);
});
test('actual public API wrapper carries corrected employer numbers and basis, with unchanged employee result', async () => {
  // Only external authentication/storage/rate-limit/wrapper transports are mocked.
  // Actual request normalizer, response formatter and ZA engine execute locally.
  const module = { exports: {} };
  const localRequire = name => {
    if (name === './_engines/index') return { get: code => code === 'ZA' ? server : null };
    if (name === '@netlify/blobs') return { getStore() { throw Error('Unexpected storage access'); } };
    if (name === './utils/cors') return { getAllowedOrigin: () => 'https://example.test' };
    if (name === './_shared/tax-request') return require('../netlify/functions/_shared/tax-request');
    if (name === './_shared/rate-limit') return { checkRateLimit: () => true, getRemaining: () => 1 };
    if (name === './_shared/api-plans') return { getApiPlanLimit: () => ({ day: 10, month: 100 }), normalizeApiTier: x => x };
    if (name === './_shared/salarypadi-service-auth') return { authenticateSalaryPadiServiceKey: async () => ({ valid: true, tier: 'service', remaining: 1, limit: 10 }) };
    if (name === './_shared/with-api') return { withApi: handler => handler };
    throw Error(`Unapproved dependency ${name}`);
  };
  vm.runInNewContext(read('netlify/functions/api-tax.js'), { module, exports: module.exports, require: localRequire, Date, console }, { timeout: 1000 });
  const response = await module.exports.handler({ httpMethod: 'POST', path: '/.netlify/functions/api-tax', headers: { 'x-api-key': 'local-synthetic' }, body: JSON.stringify({ country: 'ZA', grossAnnual: 600000, retirement: 100000, age: 35 }) });
  assert.equal(response.statusCode, 200);
  const r = JSON.parse(response.body);
  assert.equal(r.employer.sdl, 5000);
  assert.equal(r.employer.totalCostAnnual, 607125);
  assert.equal(r.meta.employerSDLBaseAnnual, 500000);
  assert.equal(r.meta.employerSDLBasis, basis);
  assert.deepEqual(r.result, plain(server.calculate({ grossAnnual: 600000, retirement: 100000, age: 35 }).result));
  assert.equal(r.meta.netBasis, 'after_paye_and_uif_before_retirement');
  assert.equal(r.meta.retirementCashModelled, false);
});
