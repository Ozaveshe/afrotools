const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../assets/js/engines/student-loan-plan.js');

function input(overrides = {}) {
  return {
    currency: 'KES', statementBalance: 10000, financedFees: 500,
    annualRate: 0, repaymentMonths: 10, graceMonths: 2,
    graceAccrual: true, monthlyFee: 10, extraPayment: 0,
    monthlyNetIncome: 5000, otherMonthlyDebt: 500,
    termsSource: 'Synthetic statement', sourceDate: '2026-07-22', ...overrides
  };
}

test('zero-rate statement reconciles fees, timeline and affordability context', () => {
  const result = calculate(input(), '2026-07-22');
  assert.equal(result.ok, true);
  assert.equal(result.openingBalance, 10500);
  assert.equal(result.balanceAtRepaymentStart, 10500);
  assert.equal(result.scheduledPayment, 1050);
  assert.equal(result.firstCashPayment, 1060);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.totalFees, 600);
  assert.equal(result.totalPaid, 10600);
  assert.equal(result.totalTimelineMonths, 12);
  assert.equal(result.debtLoadPercent, 31.2);
  assert.equal(result.cashAfterPayment, 3440);
  assert.equal(result.schedule.length, 12);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('grace interest is capitalized only when confirmed', () => {
  const withAccrual = calculate(input({ financedFees: 0, annualRate: 12, repaymentMonths: 12, monthlyFee: 0 }), '2026-07-22');
  const withoutAccrual = calculate(input({ financedFees: 0, annualRate: 12, repaymentMonths: 12, monthlyFee: 0, graceAccrual: false }), '2026-07-22');
  assert.ok(Math.abs(withAccrual.balanceAtRepaymentStart - 10201) < 1e-9);
  assert.equal(withoutAccrual.balanceAtRepaymentStart, 10000);
  const r = 0.01;
  const expected = 10201 * r / (1 - Math.pow(1 + r, -12));
  assert.ok(Math.abs(withAccrual.scheduledPayment - expected) < 1e-9);
  assert.ok(withAccrual.totalInterest > withoutAccrual.totalInterest);
});

test('extra payment shortens repayment without changing the scheduled amount', () => {
  const normal = calculate(input({ annualRate: 12, graceMonths: 0 }), '2026-07-22');
  const extra = calculate(input({ annualRate: 12, graceMonths: 0, extraPayment: 500 }), '2026-07-22');
  assert.equal(extra.scheduledPayment, normal.scheduledPayment);
  assert.ok(extra.repaymentCount < normal.repaymentCount);
  assert.ok(extra.totalInterest < normal.totalInterest);
});

test('first cash payment and affordability cap an oversized extra at the remaining balance', () => {
  const result = calculate(input({ financedFees: 0, extraPayment: 50000 }), '2026-07-22');
  assert.equal(result.repaymentCount, 1);
  assert.equal(result.firstCashPayment, 10010);
  assert.equal(result.debtLoadPercent, 210.2);
  assert.equal(result.cashAfterPayment, -5510);
  assert.equal(result.schedule.find(row => row.phase === 'repayment').payment, 10000);
});

test('stale terms and invalid periods fail closed', () => {
  assert.deepEqual(calculate(input({ sourceDate: '2025-01-01' }), '2026-07-22'), { ok: false, error: 'invalid_evidence' });
  assert.deepEqual(calculate(input({ repaymentMonths: 0 }), '2026-07-22'), { ok: false, error: 'invalid_period' });
});
