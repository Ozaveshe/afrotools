const assert = require('assert');
const engine = require('../../assets/js/engines/gh-wht');

function calc(input) {
  return engine.calculate(Object.assign({
    payerContext: 'business',
    recipientType: 'entity',
    residence: 'resident',
    grossAmount: 50000,
    yearToDateBefore: 0,
    paymentDate: '2026-07-22'
  }, input));
}

let result = calc({ category: 'dividends' });
assert.strictEqual(result.appliedRate, 8);
assert.strictEqual(result.withheld, 4000);
assert.strictEqual(result.netPayment, 46000);
assert.strictEqual(result.treatment, 'final');
assert.strictEqual(result.remittanceDate, '2026-08-15');

result = calc({ category: 'goods', grossAmount: 500, yearToDateBefore: 1000 });
assert.strictEqual(result.status, 'below-threshold');
assert.strictEqual(result.withheld, 0);

result = calc({ category: 'works', grossAmount: 200, yearToDateBefore: 1900 });
assert.strictEqual(result.status, 'calculated');
assert.strictEqual(result.appliedRate, 5);
assert.strictEqual(result.withheld, 10);

result = calc({ category: 'services', recipientType: 'individual', grossAmount: 100 });
assert.strictEqual(result.thresholdApplies, false);
assert.strictEqual(result.withheld, 7.5);

result = calc({ category: 'non-residential-rent' });
assert.strictEqual(result.appliedRate, 15);
assert.strictEqual(result.treatment, 'verify-final');

result = calc({ residence: 'non-resident', category: 'goods' });
assert.strictEqual(result.appliedRate, 20);
assert.strictEqual(result.withheld, 10000);
assert.strictEqual(result.treatment, 'final');

result = calc({ residence: 'non-resident', category: 'management' });
assert.strictEqual(result.appliedRate, 20);

result = calc({ residence: 'resident', category: 'management' });
assert.strictEqual(result.status, 'needs-classification');

result = calc({ residence: 'resident', category: 'interest', recipientType: 'individual' });
assert.strictEqual(result.status, 'not-applicable');

result = calc({ residence: 'non-resident', category: 'royalties', hasGhanaPe: true });
assert.strictEqual(result.status, 'needs-classification');

result = calc({
  residence: 'non-resident',
  category: 'royalties',
  useApprovedTreatyRate: true,
  approvedTreatyRate: 10,
  beneficialOwner: true,
  graApproval: true
});
assert.strictEqual(result.domesticRate, 15);
assert.strictEqual(result.appliedRate, 10);
assert.strictEqual(result.withheld, 5000);
assert.strictEqual(result.treatyReliefApplied, true);

assert.throws(() => calc({ category: 'goods', grossAmount: -1 }), /zero or greater/);
assert.throws(() => calc({
  residence: 'non-resident',
  category: 'royalties',
  useApprovedTreatyRate: true,
  approvedTreatyRate: 10,
  beneficialOwner: false,
  graApproval: true
}), /Treaty relief requires/);

console.log('Ghana GRA withholding-tax classification and threshold fixtures passed.');
