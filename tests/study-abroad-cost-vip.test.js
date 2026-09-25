const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/study-abroad-cost/study-cost-engine.js');

function complete(overrides) {
  return Object.assign({
    months: 12, tuitionAnnual: 0, tuitionYears: 1,
    accommodationMonthly: 0, livingMonthly: 0, insuranceAnnual: 0,
    governmentFees: 0, setupCosts: 0, confirmedAid: 0,
    availableFunds: 0, upfrontTuition: 0, otherUpfront: 0,
    refundableDeposit: 0
  }, overrides);
}

test('rejects invalid and non-finite values', () => {
  assert.equal(engine.calculate(complete({ months: 0 })).valid, false);
  assert.equal(engine.calculate(complete({ tuitionAnnual: '1e999' })).valid, false);
  assert.equal(engine.calculate(complete({ tuitionYears: -1 })).valid, false);
});

test('blank amounts remain incomplete while explicit zero is valid', () => {
  const blankTuition = engine.calculate(complete({ tuitionAnnual: '' }));
  assert.equal(blankTuition.valid, false);
  assert.equal(blankTuition.missingField, 'tuitionAnnual');
  assert.match(blankTuition.error, /Incomplete budget/);
  assert.equal(engine.calculate(complete({ tuitionAnnual: 0 })).valid, true);
  assert.equal(engine.calculate(complete({ availableFunds: '' })).valid, false);
});

test('calculates explicit periods correctly', () => {
  const result = engine.calculate(complete({
    months: 18, tuitionAnnual: 10000, tuitionYears: 2,
    accommodationMonthly: 500, livingMonthly: 300, insuranceAnnual: 1200,
    governmentFees: 400, setupCosts: 1000, confirmedAid: 5000,
    availableFunds: 12000, upfrontTuition: 5000, otherUpfront: 600,
    refundableDeposit: 1000
  }));
  assert.equal(result.valid, true);
  assert.equal(result.tuition, 20000);
  assert.equal(result.accommodation, 9000);
  assert.equal(result.living, 5400);
  assert.equal(result.insurance, 1800);
  assert.equal(result.gross, 37600);
  assert.equal(result.net, 32600);
  assert.equal(result.fundingGap, 20600);
  assert.equal(result.upfrontCash, 8000);
});

test('caps first-year monthly costs to route duration', () => {
  const result = engine.calculate(complete({
    months: 6, tuitionAnnual: 10000, accommodationMonthly: 500,
    livingMonthly: 300, insuranceAnnual: 1200
  }));
  assert.equal(result.firstYearGross, 15400);
});

test('confirmed aid cannot produce negative net cost', () => {
  const result = engine.calculate(complete({ tuitionAnnual: 1000, confirmedAid: 5000 }));
  assert.equal(result.net, 0);
  assert.equal(result.fundingGap, 0);
});
