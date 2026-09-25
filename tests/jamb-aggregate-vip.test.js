'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/jamb-aggregate/jamb-aggregate-engine.js');
const fs = require('node:fs');
const path = require('node:path');

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

const page = fs.readFileSync(path.join(__dirname, '../tools/jamb-aggregate/index.html'), 'utf8');
assert.doesNotMatch(page, /var (?:FORMULAS|CUTOFFS)\s*=/);
assert.doesNotMatch(page, /Competitive courses like Medicine|Cutoff data sourced|16,000\+/);
assert.equal((page.match(/class="jamb-faq-item"/g) || []).length, 3);

console.log('JAMB screening worksheet verified: normalized UTME, published weights, benchmark comparison, and invalid-state guards.');
