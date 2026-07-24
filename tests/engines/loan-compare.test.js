'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const engine = require('../../assets/js/engines/loan-compare.js');

const base = { name:'A', amount:120000, annualRate:12, termMonths:12, rateMethod:'reducing', paidUpfront:0, deductedFees:0, monthlyFees:0, finalPayment:0, confirmedAssumptions:true };

test('reducing-balance payment uses principal only and supports zero rate', () => {
  const result = engine.calculateOffer(base);
  assert.equal(result.monthlyDue, 10661.85);
  assert.equal(engine.calculateOffer({...base, annualRate:0}).monthlyDue, 10000);
});

test('flat rate and every entered cost stay visible', () => {
  const result = engine.calculateOffer({...base, rateMethod:'flat', paidUpfront:1000, deductedFees:2000, monthlyFees:100, finalPayment:500});
  assert.equal(result.totalInterest, 14400);
  assert.equal(result.cashReceived, 118000);
  assert.equal(result.totalFees, 4700);
  assert.equal(result.totalCashOut, 137100);
  assert.equal(result.borrowingCost, 19100);
});

test('winner appears only for the same principal and term', () => {
  const result = engine.compareOffers([base, {...base, name:'B', annualRate:15}]);
  assert.equal(result.directlyComparable, true);
  assert.equal(result.winnerIndex, 0);
  assert.ok(result.savings > 0);
  const mismatch = engine.compareOffers([base, {...base, amount:100000}]);
  assert.equal(mismatch.directlyComparable, false);
  assert.equal(mismatch.winnerIndex, null);
});

test('confirmation and impossible deducted fees are rejected', () => {
  assert.throws(() => engine.calculateOffer({...base, confirmedAssumptions:false}), /Confirm/);
  assert.throws(() => engine.calculateOffer({...base, deductedFees:120000}), /less than/);
});
