'use strict';

const assert = require('node:assert/strict');
const data = require('../data/agriculture/fertilizer-calc-data.json');
const engine = require('../engines/src/fertilizer-calc-engine');

let scenarios = 0;
for (const cropId of Object.keys(data.crops)) {
  for (const soil of Object.keys(data.soilMultipliers)) {
    for (const target of ['low', 'medium', 'high']) {
      for (const currency of Object.keys(data.costs)) {
        for (const area of [0.5, 1, 3.75]) {
          const result = engine.calculate({ cropId, soil, target, currency, area }, data);
          assert.equal(result.ok, true);
          const crop = data.crops[cropId];
          const multiplier = data.soilMultipliers[soil];
          const expected = crop.npk[target].map(value => Math.round(value * multiplier));
          assert.deepEqual(Object.values(result.perHectare), expected);
          assert.deepEqual(Object.values(result.totals), expected.map(value => Math.round(value * area)));
          assert.equal(result.yieldEstimate, crop.yield[target] * area);
          assert.deepEqual(result.schedule, crop.schedule);
          assert.equal(result.microTip, data.microTips[cropId]);
          assert.equal(result.cost.urea, result.bags.urea * data.costs[currency].urea);
          assert.equal(result.cost.npk15, result.bags.npk15 * data.costs[currency].npk15);
          assert.equal(result.cost.total, result.cost.urea + result.cost.npk15);
          scenarios += 1;
        }
      }
    }
  }
}
assert.equal(engine.calculate({ cropId: 'unknown', soil: 'loam', target: 'low', currency: 'USD' }, data).status, 'unsupported-crop');
assert.equal(engine.calculate({}, null).status, 'missing-data');
console.log(JSON.stringify({ tool: 'fertilizer-calc', scenarios, status: 'passed' }, null, 2));
