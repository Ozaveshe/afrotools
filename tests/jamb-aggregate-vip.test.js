'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/jamb-aggregate/jamb-aggregate-engine.js');

const example = engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50,
  benchmark: 65
});
assert.equal(example.ok, true);
assert.equal(example.normalizedUtme, 70);
assert.equal(example.aggregate, 69);
assert.equal(example.difference, 4);

const custom = engine.calculate({
  utme: 320,
  postUtme: 60,
  utmeWeight: 70,
  postUtmeWeight: 30,
  benchmark: ''
});
assert.equal(custom.ok, true);
assert.equal(custom.aggregate, 74);
assert.equal(custom.benchmark, null);

assert.match(engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 60,
  postUtmeWeight: 50
}).error, /add up to 100/);

assert.match(engine.calculate({
  utme: 401,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50
}).error, /UTME score/);

assert.match(engine.calculate({
  utme: 280,
  postUtme: 68,
  utmeWeight: 50,
  postUtmeWeight: 50,
  benchmark: 101
}).error, /benchmark/);

console.log('JAMB screening worksheet verified: normalized UTME, published weights, benchmark comparison, and invalid-state guards.');
