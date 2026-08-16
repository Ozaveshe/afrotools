const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../assets/js/engines/sn-paye.js');
const serverEngine = require('../netlify/functions/_engines/sn-paye.js');
const ROOT = path.join(__dirname, '..');

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

test('keeps the server engine aligned with the reviewed browser formula', () => {
  const gross = 30_000_000;
  const browserResult = engine.calculate(gross);
  const serverResult = serverEngine.calculate({ grossAnnual: gross });

  assert.equal(serverResult.deductions.ipres, Math.round(browserResult.ipres));
  assert.equal(serverResult.tax.netTax, Math.round(browserResult.annualPAYE));
  assert.equal(serverResult.result.marginalRate, '43%');
  assert.equal(serverEngine.formulaParameters.socialSecurity[0].baseCap, 432_000);
});

test('French calculator page has one IRPP owner and no stale inline PAYE engine', () => {
  const html = fs.readFileSync(path.join(ROOT, 'fr/senegal/calculateur-salaire-net.html'), 'utf8');
  assert.match(html, /window\.SenegalPayeEngine\.calculate\(/);
  assert.doesNotMatch(html, /function\s+calcAnnualPAYE\s*\(/);
  assert.doesNotMatch(html, /40%\s+au-del[aà] de\s+13\s*500\s*000/i);
});
