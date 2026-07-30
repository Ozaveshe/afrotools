'use strict';

const assert = require('node:assert/strict');
const data = require('../data/agriculture/farm-size-data.json');
const engine = require('../engines/src/farm-size-engine');

const keys = Object.keys(data.units);
let scenarios = 0;
for (const fromKey of keys) {
  for (const toKey of keys) {
    for (const amount of [0, 0.000001, 0.25, 1, 17, 1000, 2500000]) {
      const result = engine.calculate({ amount, fromKey, toKey }, data);
      assert.equal(result.ok, true);
      assert.equal(result.squareMetres, amount * data.units[fromKey].sqm);
      assert.equal(result.result, result.squareMetres / data.units[toKey].sqm);
      assert.equal(result.table.length, keys.length);
      assert.equal(result.keyReferences.length, data.keyRefs.length);
      scenarios += 1;
    }
  }
}
assert.deepEqual(engine.calculate({ amount: -1, fromKey: 'hectare', toKey: 'acre' }, data), {
  ok: false,
  status: 'invalid-amount',
});
assert.deepEqual(engine.calculate({ amount: 1, fromKey: 'unknown', toKey: 'acre' }, data), {
  ok: false,
  status: 'unknown-unit',
});
console.log(`PASS ${scenarios} Farm Size engine scenarios`);
