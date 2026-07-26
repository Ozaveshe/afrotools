const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/ke-helb/helb-engine.js');

test('rejects empty, non-finite and invalid repayment inputs', () => {
  assert.equal(engine.validate({ balance: '', annualRate: 4, monthlyPayment: 4000 }).valid, false);
  assert.equal(engine.validate({ balance: '1e999', annualRate: 4, monthlyPayment: 4000 }).valid, false);
  assert.equal(engine.validate({ balance: 240000, annualRate: -1, monthlyPayment: 4000 }).valid, false);
  assert.equal(engine.validate({ balance: 240000, annualRate: 4, monthlyPayment: 0 }).valid, false);
  assert.equal(engine.validate({ balance: 240000, annualRate: 4, monthlyPayment: 4000, extraPayment: -1 }).valid, false);
});

test('calculates a zero-interest payoff with a capped final payment', () => {
  const result = engine.calculate({
    balance: 10000,
    annualRate: 0,
    monthlyPayment: 3000,
    extraPayment: 0
  });
  assert.equal(result.valid, true);
  assert.equal(result.clears, true);
  assert.equal(result.months, 4);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.totalPaid, 10000);
  assert.equal(result.schedule.at(-1).payment, 1000);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('applies monthly interest then principal deterministically', () => {
  const result = engine.calculate({
    balance: 120000,
    annualRate: 12,
    monthlyPayment: 11000,
    extraPayment: 0
  });
  assert.equal(result.schedule[0].interest, 1200);
  assert.equal(result.schedule[0].principal, 9800);
  assert.equal(result.schedule[0].balance, 110200);
  assert.equal(result.clears, true);
  assert.ok(result.totalPaid > 120000);
});

test('does not invent a payoff when payment fails to cover interest', () => {
  const result = engine.calculate({
    balance: 240000,
    annualRate: 12,
    monthlyPayment: 2000,
    extraPayment: 0
  });
  assert.equal(result.valid, true);
  assert.equal(result.clears, false);
  assert.equal(result.reason, 'payment_below_interest');
  assert.deepEqual(result.schedule, []);
});

test('keeps only the first 24 rows while calculating the full payoff', () => {
  const result = engine.calculate({
    balance: 240000,
    annualRate: 4,
    monthlyPayment: 4000,
    extraPayment: 0
  });
  assert.equal(result.clears, true);
  assert.ok(result.months > 24);
  assert.equal(result.schedule.length, 24);
});
