const assert = require('node:assert/strict');
const test = require('node:test');
const engine = require('../assets/js/engines/senegal-paye.js');

test('uses all seven current IRPP bands, including 43% above 25m XOF', () => {
  const result = engine.calculateIrpp(30_000_000);
  assert.equal(result.bandBreakdown.at(-1).rate, 0.43);
  assert.equal(result.bandBreakdown.at(-1).income, 5_000_000);
});

test('caps general-scheme IPRES at 5,184,000 XOF annually', () => {
  const result = engine.calculate(30_000_000);
  assert.equal(result.ipresBase, 5_184_000);
  assert.equal(result.ipres, 290_304);
  assert.equal(result.empIPRES, 435_456);
});

test('does not invent an employee CSS deduction', () => {
  const result = engine.calculate(7_500_000);
  assert.equal(result.css, 0);
  assert.equal(result.totalSocialContrib, result.ipres);
  assert.equal(result.limitations.cssEmployerIncluded, false);
});

test('marks family reduction and cadres supplement as excluded', () => {
  const result = engine.calculate(7_500_000);
  assert.equal(result.limitations.familyReductionIncluded, false);
  assert.equal(result.limitations.cadresSupplementIncluded, false);
});

test('rejects invalid gross salary', () => {
  assert.match(engine.calculate(0).error, /invalide/);
  assert.match(engine.calculate('bad').error, /invalide/);
});
