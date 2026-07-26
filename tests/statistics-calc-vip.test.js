const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/statistics-calc/statistics-engine.js');

test('parses finite numeric tokens and reports invalid tokens', () => {
  assert.deepEqual(engine.parseInput('1, -2; 3.5\n4e2'), {
    values: [1, -2, 3.5, 400],
    invalidTokens: []
  });
  assert.deepEqual(engine.parseInput('1, missing, 1e999'), {
    values: [1],
    invalidTokens: ['missing', '1e999']
  });
});

test('calculates a known descriptive statistics fixture', () => {
  const result = engine.analyse([1, 2, 2, 4]);
  assert.equal(result.count, 4);
  assert.equal(result.sum, 9);
  assert.equal(result.mean, 2.25);
  assert.equal(result.median, 2);
  assert.deepEqual(result.modes, [2]);
  assert.equal(result.minimum, 1);
  assert.equal(result.maximum, 4);
  assert.equal(result.range, 3);
  assert.equal(result.q1, 1.75);
  assert.equal(result.q3, 2.5);
  assert.ok(Math.abs(result.populationVariance - 1.1875) < 1e-12);
  assert.ok(Math.abs(result.sampleVariance - (19 / 12)) < 1e-12);
});

test('does not invent CV or skewness where they are undefined', () => {
  const zeroMean = engine.analyse([-1, 1]);
  assert.equal(zeroMean.coefficientOfVariation, null);
  assert.equal(zeroMean.skewness, null);
  const constant = engine.analyse([5, 5, 5, 5]);
  assert.equal(constant.skewness, null);
  assert.equal(constant.sampleSd, 0);
});

test('reports multimodal and no-mode datasets honestly', () => {
  assert.deepEqual(engine.analyse([1, 1, 2, 2, 3]).modes, [1, 2]);
  assert.deepEqual(engine.analyse([1, 2, 3]).modes, []);
});

test('builds a stable histogram including constant data', () => {
  assert.deepEqual(engine.histogram([5, 5, 5]), [{ lower: 5, upper: 5, count: 3 }]);
  const bins = engine.histogram([0, 1, 2, 3], 2);
  assert.deepEqual(bins.map(bin => bin.count), [2, 2]);
});
