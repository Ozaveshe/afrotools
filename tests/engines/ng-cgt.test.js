const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/ng-cgt.js');

const base = { scopeConfirmed: true, sellerType: 'individual', assetType: 'general', proceeds: 20000000, acquisitionCost: 10000000, disposalCosts: 1000000, otherChargeableIncome: 0 };

test('computes gain after acquisition and disposal costs', () => {
  const out = engine.calculate(base);
  assert.equal(out.rawGain, 9000000);
  assert.equal(out.tax, 1410000);
});

test('individual gain is taxed incrementally above other chargeable income', () => {
  const out = engine.calculate({ ...base, otherChargeableIncome: 3000000 });
  assert.equal(out.tax, 1620000);
});

test('Nigerian shares need both strict proceeds and gain tests', () => {
  const exempt = engine.calculate({ ...base, assetType: 'shares', aggregateShareProceeds: 149999999, aggregateShareGain: 10000000, reinvestedProceeds: 0 });
  assert.equal(exempt.taxableGain, 0);
  const taxable = engine.calculate({ ...base, assetType: 'shares', aggregateShareProceeds: 150000000, aggregateShareGain: 10000000, reinvestedProceeds: 0 });
  assert.equal(taxable.taxableGain, 9000000);
});

test('share reinvestment apportions the current gain', () => {
  const out = engine.calculate({ ...base, assetType: 'shares', aggregateShareProceeds: 200000000, aggregateShareGain: 20000000, reinvestedProceeds: 5000000 });
  assert.equal(out.taxableGain, 6750000);
});

test('principal residence relief is limited to confirmed individual scope', () => {
  const exempt = engine.calculate({ ...base, assetType: 'residence', residenceEligible: true });
  assert.equal(exempt.taxableGain, 0);
  const review = engine.calculate({ ...base, assetType: 'residence', residenceEligible: false });
  assert.equal(review.relief, 'residence-review');
});

test('company classification uses all small-company tests', () => {
  const company = { ...base, sellerType: 'company', turnover: 50000000, fixedAssets: 250000000, professionalServices: false };
  assert.equal(engine.calculate(company).tax, 0);
  assert.equal(engine.calculate({ ...company, professionalServices: true }).tax, 2700000);
});

test('invalid scope and negative inputs are rejected', () => {
  assert.throws(() => engine.calculate({ ...base, scopeConfirmed: false }));
  assert.throws(() => engine.calculate({ ...base, proceeds: -1 }), RangeError);
});
