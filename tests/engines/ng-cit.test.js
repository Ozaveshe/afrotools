const assert = require('node:assert/strict');
const { test } = require('node:test');
const engine = require('../../assets/js/engines/ng-cit.js');

const base = { turnover: 50000000, fixedAssets: 250000000, totalProfits: 10000000, assessableProfits: 12000000, professionalServices: false, mneGroup: false, scopeConfirmed: true };

test('qualifying small company is exempt at both inclusive thresholds', () => {
  const result = engine.calculate(base);
  assert.equal(result.smallCompany, true);
  assert.equal(result.cit, 0);
  assert.equal(result.developmentLevy, 0);
  assert.equal(result.total, 0);
});

test('one naira above either threshold makes the company non-small', () => {
  for (const input of [{ ...base, turnover: 50000001 }, { ...base, fixedAssets: 250000001 }]) {
    const result = engine.calculate(input);
    assert.equal(result.smallCompany, false);
    assert.equal(result.cit, 3000000);
    assert.equal(result.developmentLevy, 480000);
    assert.equal(result.total, 3480000);
  }
});

test('professional services cannot use small-company classification', () => {
  const result = engine.calculate({ ...base, professionalServices: true });
  assert.equal(result.classification, 'other');
  assert.equal(result.citRate, 0.30);
  assert.equal(result.developmentLevyRate, 0.04);
});

test('CIT and development levy preserve their distinct statutory profit bases', () => {
  const result = engine.calculate({ ...base, turnover: 80000000, totalProfits: 7000000, assessableProfits: 10000000 });
  assert.equal(result.cit, 2100000);
  assert.equal(result.developmentLevy, 400000);
  assert.equal(result.total, 2500000);
});

test('ETR scope is surfaced but no unsupported top-up is invented', () => {
  assert.equal(engine.calculate({ ...base, turnover: 20000000000 }).etrReview, true);
  assert.equal(engine.calculate({ ...base, mneGroup: true }).etrReview, true);
});

test('scope confirmation and non-negative finite inputs are required', () => {
  assert.throws(() => engine.calculate({ ...base, scopeConfirmed: false }), /Confirm/);
  assert.throws(() => engine.calculate({ ...base, totalProfits: -1 }), /zero or greater/);
  assert.throws(() => engine.calculate({ ...base, turnover: Infinity }), /zero or greater/);
});
