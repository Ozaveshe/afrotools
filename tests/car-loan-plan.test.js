const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../assets/js/engines/car-loan-plan.js');

function input(overrides = {}) {
  return {
    currency: 'KES', vehiclePrice: 12000, deposit: 2000, tradeIn: 0,
    financedFees: 0, annualRate: 0, months: 10, balloon: 0,
    monthlyNetIncome: 5000, otherMonthlyDebt: 500,
    monthlyInsurance: 100, monthlyFuel: 200, monthlyMaintenance: 50,
    otherMonthlyVehicleCost: 50, offerSource: 'Synthetic lender offer',
    sourceDate: '2026-07-22', ...overrides
  };
}

test('zero-rate plan reconciles every output and schedule row', () => {
  const result = calculate(input(), '2026-07-22');
  assert.equal(result.ok, true);
  assert.equal(result.principal, 10000);
  assert.equal(result.monthlyPayment, 1000);
  assert.equal(result.totalFinanceCost, 0);
  assert.equal(result.monthlyOperatingCost, 400);
  assert.equal(result.monthlyVehicleCost, 1400);
  assert.equal(result.modeledOutlay, 16000);
  assert.equal(result.debtLoadPercent, 30);
  assert.equal(result.cashAfterVehicle, 3100);
  assert.equal(result.schedule.length, 10);
  assert.equal(result.schedule.at(-1).balance, 0);
});

test('balloon is discounted before the regular payment is calculated', () => {
  const result = calculate(input({
    vehiclePrice: 20000, deposit: 2000, financedFees: 500,
    annualRate: 12, months: 24, balloon: 5000
  }), '2026-07-22');
  const r = 0.01;
  const expected = (18500 - 5000 / Math.pow(1 + r, 24)) * r /
    (1 - Math.pow(1 + r, -24));
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.monthlyPayment - expected) < 1e-9);
  assert.ok(Math.abs(result.schedule.at(-1).balance - 5000) < 0.01);
});

test('stale evidence and invalid balloon fail closed', () => {
  assert.deepEqual(calculate(input({ sourceDate: '2025-01-01' }), '2026-07-22'), {
    ok: false, error: 'invalid_evidence'
  });
  assert.deepEqual(calculate(input({ balloon: 10000 }), '2026-07-22'), {
    ok: false, error: 'invalid_structure'
  });
});
