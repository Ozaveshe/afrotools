'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/percentage-calc/percentage-engine.js');

assert.deepEqual(engine.percentOf(20, 500), { ok: true, result: 100 });
assert.equal(engine.percentageOf(50, 200).percentage, 25);
assert.match(engine.percentageOf(1, 0).error, /cannot be zero/i);

const increase = engine.percentageChange(100, 150);
assert.equal(increase.percentage, 50);
assert.equal(increase.difference, 50);
assert.equal(engine.percentageChange(-100, -50).percentage, 50);
assert.match(engine.percentageChange(0, 10).error, /undefined/i);

assert.deepEqual(engine.discount(1000, 25), {
  ok: true,
  saving: 250,
  finalPrice: 750,
  percentage: 25
});
assert.match(engine.discount(100, 101).error, /between 0% and 100%/i);
assert.match(engine.discount(-1, 10).error, /cannot be negative/i);

assert.deepEqual(engine.tipSplit(5000, 10, 4), {
  ok: true,
  tip: 500,
  total: 5500,
  perPerson: 1375
});
assert.match(engine.tipSplit(100, 10, 2.5).error, /whole number/i);
assert.match(engine.tipSplit(100, -5, 2).error, /cannot be negative/i);

const margin = engine.margin(600, 1000);
assert.equal(margin.profit, 400);
assert.equal(margin.margin, 40);
assert.ok(Math.abs(margin.markup - 66.66666666666666) < 1e-12);
assert.equal(engine.margin(0, 100).markup, null);
assert.match(engine.margin(100, 0).error, /greater than zero/i);

assert.match(engine.percentOf('', 500).error, /required/i);
assert.match(engine.percentOf('1e999', 500).error, /finite/i);

console.log('percentage-calc VIP engine: 18 checks passed');
