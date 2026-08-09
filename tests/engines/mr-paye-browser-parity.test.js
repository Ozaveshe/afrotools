'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const browser = require('../../assets/js/engines/mr-paye');
const server = require('../../netlify/functions/_engines/mr-paye');

test('Mauritania browser PAYE engine matches the reviewed server owner', () => {
  for (const grossMonthly of [0, 6000, 10000, 16000, 30000, 200000]) {
    for (const cnss of [true, false]) {
      const grossAnnual = grossMonthly * 12;
      const expected = server.calculate({ grossAnnual, cnss });
      const actual = browser.calculate({ grossAnnual, cnss });
      assert.equal(actual.taxableAnnual, expected.tax.taxableIncome, `taxable at MRU ${grossMonthly}, CNSS ${cnss}`);
      assert.equal(actual.taxAnnual, expected.tax.netTax, `ITS at MRU ${grossMonthly}, CNSS ${cnss}`);
      assert.equal(actual.cnssAnnual, expected.deductions.cnss, `CNSS at MRU ${grossMonthly}, CNSS ${cnss}`);
      assert.equal(actual.netAnnual, expected.result.netAnnual, `annual net at MRU ${grossMonthly}, CNSS ${cnss}`);
      assert.equal(actual.netMonthly, expected.result.netMonthly, `monthly net at MRU ${grossMonthly}, CNSS ${cnss}`);
      assert.equal(actual.employerCostAnnual, expected.employer.totalCostAnnual, `employer annual at MRU ${grossMonthly}`);
      assert.equal(actual.employerCostMonthly, expected.employer.totalCostMonthly, `employer monthly at MRU ${grossMonthly}`);
    }
  }
  assert.equal(browser.sourceCheckedOn, server.sourceCheckedOn);
  assert.equal(browser.nextReviewDate, server.nextReviewDate);
  assert.equal(browser.calculate({ grossAnnual: -1 }).ok, false);
  assert.equal(browser.calculate({ grossAnnual: Number.NaN }).ok, false);
});
