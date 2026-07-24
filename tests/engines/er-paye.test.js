'use strict';
const assert = require('assert');
const engine = require('../../assets/js/engines/er-paye');
const server = require('../../netlify/functions/_engines/er-paye');
function near(actual, expected, label) { assert.ok(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`); }

[[0,0],[200,4],[500,25],[1200,109],[2000,245],[3500,605],[5500,1185],[8000,2035],[10000,2795]].forEach(([income,tax]) => near(engine.taxMonthly(income).tax,tax,`tax at ${income}`));
const ordinary = engine.calculate({ grossMonthly: 10000, employmentType: 'ordinary' });
near(ordinary.incomeTaxMonthly,2795,'ordinary tax'); near(ordinary.netMonthly,7205,'ordinary net'); near(ordinary.employeePensionMonthly,0,'ordinary pension omitted');
const publicCase = engine.calculate({ grossMonthly: 10000, employmentType: 'public-sector', pensionableBasic: 8000 });
near(publicCase.employeePensionMonthly,400,'public employee pension'); near(publicCase.employerPensionMonthly,560,'public employer pension'); near(publicCase.incomeTaxMonthly,2795,'pension not deducted from tax base'); near(publicCase.netMonthly,6805,'public net'); near(publicCase.employerCostMonthly,10560,'public employer cost');
assert.strictEqual(engine.calculate({ grossMonthly: 10000, employmentType: 'public-sector', pensionableBasic: 11000 }).ok,false,'pension base above gross rejected');
const api = server.calculate({ grossMonthly: 10000, employmentType: 'public-sector', pensionableBasic: 8000 });
assert.strictEqual(api.tax.netTax,33540); assert.strictEqual(api.deductions.employeePension,4800); assert.strictEqual(api.result.netMonthly,6805); assert.strictEqual(api.employer.totalCostMonthly,10560);
assert.strictEqual(server.calculate({ grossAnnual: 0 }).result.netAnnual,0);
console.log('Eritrea statutory employment-tax and public-pension fixtures passed.');
