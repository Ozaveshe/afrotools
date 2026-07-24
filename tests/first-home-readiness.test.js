const test = require('node:test');
const assert = require('node:assert/strict');
const readiness = require('../assets/js/pages/first-home-readiness.js');

test('adds only the user-entered cash targets and calculates a straight-line gap', () => {
  assert.deepEqual(
    readiness.compute({ deposit: 200, upfront: 30, reserve: 50, saved: 80, monthly: 20 }),
    {
      valid: true,
      goal: 280,
      saved: 80,
      gap: 200,
      monthly: 20,
      months: 10,
      timelineLimited: false,
      progress: (80 / 280) * 100
    }
  );
});

test('reports an already-funded goal without requiring a contribution', () => {
  assert.equal(
    readiness.compute({ deposit: 100, upfront: 0, reserve: 0, saved: 120, monthly: 0 }).months,
    0
  );
});

test('keeps a positive gap open when the monthly contribution is zero', () => {
  assert.equal(
    readiness.compute({ deposit: 100, upfront: 0, reserve: 0, saved: 20, monthly: 0 }).months,
    null
  );
});

test('rejects negative values and an empty cash goal', () => {
  assert.equal(readiness.compute({ deposit: -1, upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
  assert.equal(readiness.compute({ deposit: 0, upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
});

test('rejects individual and aggregate amounts beyond the shared ceiling', () => {
  assert.equal(readiness.MAX_AMOUNT, 1_000_000_000_000);
  assert.equal(readiness.compute({ deposit: readiness.MAX_AMOUNT + 1, upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
  assert.equal(readiness.compute({ deposit: readiness.MAX_AMOUNT, upfront: 1, reserve: 0, saved: 0, monthly: 1 }).valid, false);
});

test('rejects non-finite and non-numeric inputs', () => {
  assert.equal(readiness.compute({ deposit: Infinity, upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
  assert.equal(readiness.compute({ deposit: NaN, upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
  assert.equal(readiness.compute({ deposit: 'not-a-number', upfront: 0, reserve: 0, saved: 0, monthly: 1 }).valid, false);
});

test('bounds an impractically long timeline without producing an unsafe month count', () => {
  const result = readiness.compute({
    deposit: readiness.MAX_AMOUNT,
    upfront: 0,
    reserve: 0,
    saved: 0,
    monthly: 0.01
  });
  assert.equal(result.valid, true);
  assert.equal(result.months, null);
  assert.equal(result.timelineLimited, true);
  assert.equal(result.progress, 0);
});
