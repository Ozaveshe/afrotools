'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../netlify/functions/_engines/za-paye');

// SARS2027 annual base-charge boundaries. The label describes the next cent's
// marginal band, independently of the server's established whole-rand tax output.
const boundaries = [
  [245100, 44118, '18%', '26%'],
  [383100, 79998, '26%', '31%'],
  [530200, 125599, '31%', '36%'],
  [695800, 185215, '36%', '39%'],
  [887000, 259783, '39%', '41%'],
  [1878600, 666339, '41%', '45%'],
];
for (const [ceiling, baseTax, atCeiling, aboveCeiling] of boundaries) {
  test(`public server response labels the cent above R${ceiling} correctly`, () => {
    for (const delta of [-0.01, 0, 0.01]) {
      const grossAnnual = ceiling + delta;
      const value = engine.calculate({ grossAnnual, uif: false, age: 35, retirement: 0 });
      assert.equal(value.result.marginalRate, delta > 0 ? aboveCeiling : atCeiling);
      assert.equal(value.tax.grossTax, baseTax, 'whole-rand gross tax unchanged at these cent offsets');
      assert.equal(value.tax.netTax, baseTax - 17820, 'whole-rand PAYE unchanged');
      assert.equal(value.tax.taxableIncome, Math.round(grossAnnual));
      assert.equal(value.deductions.totalDeductions, baseTax - 17820);
      assert.equal(value.result.netAnnual, Math.round(grossAnnual - (baseTax - 17820)));
      assert.equal(value.result.netMonthly, Math.round((grossAnnual - (baseTax - 17820)) / 12));
      assert.deepEqual(Object.keys(value.result), ['netAnnual', 'netMonthly', 'effectiveRate', 'marginalRate']);
      assert.equal(value.meta.taxPeriod.label, '2026/27');
    }
  });
}

test('zero taxable income retains0percent while positive first-band cents report18percent', () => {
  assert.equal(engine.calculate({grossAnnual:0,uif:false}).result.marginalRate, '0%');
  const value = engine.calculate({grossAnnual:0.01,uif:false});
  assert.equal(value.result.marginalRate, '18%');
  assert.equal(value.tax.netTax, 0);
  assert.equal(value.result.netAnnual, 0);
});

test('the marginal label uses taxable income after the existing retirement deduction', () => {
  const value = engine.calculate({grossAnnual:345100.01,retirement:90000,uif:false});
  assert.equal(value.tax.taxableIncome, 255100);
  assert.equal(value.result.marginalRate, '26%');
  const below = engine.calculate({grossAnnual:300000,retirement:60000,uif:false});
  assert.equal(below.tax.taxableIncome, 240000);
  assert.equal(below.result.marginalRate, '18%');
});
