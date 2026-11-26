'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const engine of ['engines/src/farm-loan-engine.js', 'engines/farm-loan-engine.js']) {
  test(engine + ' distinguishes zero-rated loans, missing rates and grants', () => {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', engine), 'utf8'), sandbox);
    const fixture = {
      interestRate_pct: 0, programMode: 'loan-estimate',
      officialUrl: 'https://example.org/', checkedDate: '2026-11-26', effectiveDate: '2026-11-26'
    };
    const profile = { requestedAmount: 12000, tenorMonths: 12 };
    const evaluate = changes => sandbox.window.AfroTools.FarmLoanEngine.evaluatePrograms(
      profile, { programs: [{ ...fixture, ...changes }] }
    )[0].repayment;
    assert.equal(evaluate({}).monthly, 1000);
    assert.equal(evaluate({}).totalInterest, 0);
    assert.equal(evaluate({ interestRate_pct: null }), null);
    assert.equal(evaluate({ programMode: 'support-only' }), null);
  });
}
