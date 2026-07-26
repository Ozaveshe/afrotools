const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../tools/algebra-solver/algebra-engine.js');
const html = fs.readFileSync(path.join(__dirname, '../tools/algebra-solver/index.html'), 'utf8');

function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);
}

test('solves supported linear forms and classifies identities', () => {
  close(engine.solveLinear('2x + 5 = 13').x, 4);
  close(engine.solveLinear('x/2 + 3 = 7').x, 8);
  close(engine.solveLinear('2x + 1 = x + 4').x, 3);
  assert.equal(engine.solveLinear('x - x = 0').type, 'all-real');
  assert.equal(engine.solveLinear('x - x = 1').type, 'none');
});

test('solves two-real, repeated, and complex quadratics', () => {
  const factorable = engine.solveQuadratic('x^2 - 5x + 6 = 0');
  assert.equal(factorable.type, 'two-real');
  assert.deepEqual(factorable.roots.slice().sort((a, b) => a - b), [2, 3]);
  factorable.roots.forEach((root) => close(engine.residualQuadratic(factorable.parsed, root), 0));

  const repeated = engine.solveQuadratic('x² + 4x + 4 = 0');
  assert.equal(repeated.type, 'repeated');
  close(repeated.roots[0], -2);

  const complex = engine.solveQuadratic('-x^2 - 2x - 5 = 0');
  assert.equal(complex.type, 'complex');
  close(complex.real, -1);
  close(complex.imaginary, 2);
});

test('solves and correctly classifies 2 by 2 systems', () => {
  const unique = engine.solveSimultaneous('2x + 3y = 13', 'x + 2y = 7');
  assert.equal(unique.type, 'unique');
  close(unique.x, 5);
  close(unique.y, 1);

  assert.equal(engine.solveSimultaneous('x + y = 2', '2x + 2y = 4').type, 'infinite');
  assert.equal(engine.solveSimultaneous('x + y = 2', '2x + 2y = 5').type, 'none');

  const bothSides = engine.solveSimultaneous('2x + y = x + 4', 'x - y = 2');
  assert.equal(bothSides.type, 'unique');
  close(bothSides.x, 3);
  close(bothSides.y, 1);
});

test('solves positive, negative, symbolic, and degenerate inequalities', () => {
  const positive = engine.solveInequality('2x + 3 > 7');
  assert.deepEqual({ op: positive.operator, boundary: positive.boundary }, { op: '>', boundary: 2 });

  const negative = engine.solveInequality('-2x + 4 > 0');
  assert.equal(negative.operator, '<');
  close(negative.boundary, 2);

  assert.equal(engine.solveInequality('x - x ≤ 1').type, 'all-real');
  assert.equal(engine.solveInequality('x - x > 1').type, 'none');
});

test('rejects unsupported syntax instead of silently coercing it', () => {
  [
    ['linear', 'hello = 5'],
    ['linear', '2(x + 1) = 4'],
    ['linear', 'x/0 = 2'],
    ['linear', 'x^2 = 4'],
    ['quadratic', 'x^3 = 8'],
    ['quadratic', 'sqrt(x) = 2'],
    ['inequality', '1 < x < 3']
  ].forEach(([type, input]) => {
    const result = type === 'linear'
      ? engine.solveLinear(input)
      : type === 'quadratic'
        ? engine.solveQuadratic(input)
        : engine.solveInequality(input);
    assert.equal(result.ok, false, `${type}: ${input} should fail`);
  });
});

test('rejects a zero quadratic coefficient with a useful type error', () => {
  const result = engine.solveQuadratic('2x + 1 = 5');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'not_quadratic');
});

test('page contract matches the strict engine and private export behavior', () => {
  assert.match(html, /Supported input boundary/);
  assert.match(html, /window\.AfroAlgebraEngine\.solveLinear/);
  assert.match(html, /window\.AfroAlgebraEngine\.solveQuadratic/);
  assert.match(html, /Copy steps/);
  assert.match(html, /Download TXT/);
  assert.match(html, /Print \/ PDF/);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net\/npm\/chart\.js/);
  assert.doesNotMatch(html, /Type any equation|exam-efficient|frequently appear in Paper/);
  assert.doesNotMatch(html, /localStorage\.setItem|fetch\(/);
});

test('all JSON-LD blocks parse and expose the actual supported families', () => {
  const blocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  assert.equal(blocks.length, 3);
  const data = blocks.map((match) => JSON.parse(match[1]));
  const application = data.find((item) => item['@type'] === 'WebApplication');
  const faq = data.find((item) => item['@type'] === 'FAQPage');
  assert.ok(application.featureList.includes('Two-equation linear systems in x and y'));
  assert.equal(faq.mainEntity.length, 4);
  assert.match(faq.mainEntity[0].acceptedAnswer.text, /Parentheses, radicals/);
});
