'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../engines/src/tractor-calculator-engine');
const fixture = require('./fixtures/tractor-calculator-english-invariants.json');

function assertNumericRecordClose(actual, expected, label) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${label} keys`);
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (typeof expectedValue === 'number' && Number.isFinite(expectedValue)) {
      const tolerance = Math.max(1, Math.abs(expectedValue)) * Number.EPSILON * 8;
      assert.ok(
        Math.abs(actualValue - expectedValue) <= tolerance,
        `${label}.${key}: expected ${expectedValue}, received ${actualValue}`,
      );
    } else {
      assert.deepEqual(actualValue, expectedValue, `${label}.${key}`);
    }
  }
}

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/agriculture/equipment-data.js', 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.EQUIPMENT_DATA));

for (const profile of fixture.defaults) {
  const actual = engine.defaults(profile.countryCode, profile.equipmentKey, data);
  assert.equal(actual.ok, true);
  assert.equal(actual.price, profile.values.price);
  assert.equal(actual.contractRate, profile.values.contractRate);
  assert.equal(actual.financeRate, profile.values.financeRate);
  assert.equal(actual.financeTerm, profile.values.financeTerm);
  assert.equal(`(${actual.symbol})`, profile.values.currencyLabel);
  assert.equal(actual.equipmentExamples, profile.values.equipmentHint);
}

for (const profile of fixture.arithmetic) {
  const input = profile.input;
  const equipment = data.equipment[input.equipmentKey];
  const hireRates = data.hireRates[input.countryCode];
  assert.deepEqual(engine.calculateBuy(input, equipment, hireRates), profile.output.buy);
  assert.deepEqual(engine.calculateHire(hireRates, input.farmHa, input.passes), profile.output.hire);
  assertNumericRecordClose(engine.calculateLease(input), profile.output.lease, 'lease');
  assert.equal(engine.breakEvenHa(profile.output.buy, profile.output.hire, input.years), profile.output.breakEvenHa);
  const result = engine.calculate({
    ...input,
    financeType: 'lease',
    doContract: input.contractHa > 0,
    contractRate: hireRates.tractor_ploughing_per_ha || 0,
  }, data);
  assert.equal(result.ok, true);
  assert.deepEqual(result.buy, profile.output.buy);
  assert.deepEqual(result.hire, profile.output.hire);
  assertNumericRecordClose(result.lease, profile.output.lease, 'result.lease');
  assertNumericRecordClose(result.costs, profile.output.costs, 'result.costs');
  assert.equal(result.winner, profile.output.winner);
}
assert.equal(engine.defaults('XX', 'tractor_small', data).status, 'unknown-country');
assert.equal(engine.defaults('NG', 'unknown', data).status, 'unknown-equipment');
assert.equal(engine.calculate({ countryCode: 'XX' }, data).status, 'unknown-country');

console.log(`PASS ${fixture.arithmetic.length} Tractor Calculator engine profiles and ${fixture.defaults.length} default profiles`);
