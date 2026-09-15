const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/engines/feddan-area');

test('reference feddan converts to acres, hectares and back', () => {
  const result = engine.convert(10, 'feddan-to-acre', 4200);
  assert.equal(result.squareMetres, 42000);
  assert.equal(result.hectares, 4.2);
  assert.ok(Math.abs(result.acres - 10.378426021620946) < 0.000001);
  assert.ok(Math.abs(engine.convert(result.acres, 'acre-to-feddan', 4200).feddans - 10) < 1e-12);
});

test('custom survey basis and zero area are supported', () => {
  assert.equal(engine.convert(2, 'feddan-to-acre', 4200.83).squareMetres, 8401.66);
  assert.equal(engine.convert(0, 'feddan-to-acre', 4200).acres, 0);
});

test('invalid areas, bases, directions and overflow are rejected', () => {
  for (const amount of [-1, Infinity, NaN]) assert.throws(() => engine.convert(amount, 'feddan-to-acre', 4200));
  for (const basis of [0, -1, Infinity, NaN]) assert.throws(() => engine.convert(1, 'feddan-to-acre', basis));
  assert.throws(() => engine.convert(1, 'unknown', 4200));
  assert.throws(() => engine.convert(Number.MAX_VALUE, 'feddan-to-acre', 4200));
  assert.throws(() => engine.convert(1, 'acre-to-feddan', Number.MIN_VALUE));
});
