'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/fraction-calc/fraction-engine.js');

function calculate(left, operation, right) {
  return engine.calculate({ left, operation, right });
}

{
  const result = calculate(
    { numerator: '1', denominator: '2' },
    'add',
    { numerator: '1', denominator: '3' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.raw.text, '5/6');
  assert.equal(result.simplified.text, '5/6');
  assert.equal(result.decimal.text, '0.8333333333');
  assert.equal(result.decimal.approximate, true);
}

{
  const result = calculate(
    { whole: '-2', numerator: '1', denominator: '3' },
    'add',
    { numerator: '1', denominator: '3' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.simplified.text, '-2');
  assert.match(result.steps[0], /-7\/3/);
}

{
  const result = calculate(
    { numerator: '-1', denominator: '2' },
    'add',
    { numerator: '1', denominator: '4' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.simplified.text, '-1/4');
}

{
  const result = calculate(
    { numerator: '4', denominator: '6' },
    'mul',
    { numerator: '9', denominator: '10' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.raw.text, '36/60');
  assert.equal(result.simplified.text, '3/5');
  assert.equal(result.percentage.text, '60%');
  assert.equal(result.percentage.approximate, false);
}

{
  const result = calculate(
    { numerator: '2', denominator: '3' },
    'div',
    { numerator: '-4', denominator: '5' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.raw.text, '-10/12');
  assert.equal(result.simplified.text, '-5/6');
}

{
  const result = calculate(
    { numerator: '123456789012345678901234567890', denominator: '7' },
    'mul',
    { numerator: '9', denominator: '11' },
  );
  assert.equal(result.ok, true);
  assert.equal(result.raw.text, '1111111101111111110111111111010/77');
}

{
  const result = calculate(
    { numerator: '1.5', denominator: '2' },
    'add',
    { numerator: '1', denominator: '2' },
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /whole number/);
}

{
  const result = calculate(
    { numerator: '1', denominator: '' },
    'add',
    { numerator: '1', denominator: '2' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.field, 'First denominator');
}

{
  const result = calculate(
    { whole: '2', numerator: '-1', denominator: '3' },
    'add',
    { numerator: '1', denominator: '2' },
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /put the minus sign on the whole number/);
}

{
  const result = calculate(
    { numerator: '1', denominator: '-3' },
    'add',
    { numerator: '1', denominator: '2' },
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /must be positive/);
}

{
  const result = calculate(
    { numerator: '1', denominator: '2' },
    'div',
    { numerator: '0', denominator: '9' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Cannot divide by zero.');
}

console.log('fraction-calc VIP engine: 11 checks passed');
