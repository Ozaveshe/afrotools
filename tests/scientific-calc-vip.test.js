const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/scientific-calc/scientific-engine.js');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../tools/scientific-calc/index.html'), 'utf8');

function value(expression, angleMode = 'DEG') {
  const result = engine.evaluate(expression, { angleMode });
  assert.equal(result.ok, true, result.error);
  return result.value;
}

test('respects arithmetic, grouping, unary and right-associative power precedence', () => {
  assert.equal(value('2+3*(4-1)'), 11);
  assert.equal(value('-2^2'), -4);
  assert.equal(value('2^3^2'), 512);
  assert.equal(value('2^-2'), 0.25);
});

test('supports constants, postfix factorials and explicit modulo', () => {
  assert.equal(value('5!'), 120);
  assert.equal(value('3!!'), 720);
  assert.equal(value('17%5'), 2);
  assert.ok(Math.abs(value('pi') - Math.PI) < 1e-15);
});

test('handles degree and radian trigonometry with real-domain boundaries', () => {
  assert.ok(Math.abs(value('sin(30)') - 0.5) < 1e-12);
  assert.ok(Math.abs(value('sin(pi/2)', 'RAD') - 1) < 1e-12);
  assert.equal(value('asin(1)'), 90);
  assert.match(engine.evaluate('tan(90)', { angleMode: 'DEG' }).error, /undefined/);
  assert.match(engine.evaluate('sqrt(-1)').error, /real, finite domain/);
});

test('rejects code-like, ambiguous and invalid input rather than evaluating JavaScript', () => {
  for (const expression of ['globalThis', '2pi', '2(3)', '1/0', '171!', '1..2', 'sin 30', '1,2']) {
    assert.equal(engine.evaluate(expression).ok, false, expression);
  }
});

test('formats finite results without inventing extra precision', () => {
  assert.equal(engine.format(1 / 3, 10), '0.3333333333');
  assert.equal(engine.format(-0), '0');
  assert.equal(engine.format(Infinity), 'Not defined');
});

test('page uses the deterministic engine and canonical self-hosted typography', () => {
  assert.match(html, /scientific-engine\.js/);
  assert.doesNotMatch(html, /Function\(['"`]|eval\(/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.match(html, /Print \/ Save PDF/);
});
