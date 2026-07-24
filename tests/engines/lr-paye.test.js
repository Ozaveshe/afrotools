'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const quality = require('../../scripts/lib/calculation-quality');
const engine = require('../../netlify/functions/_engines/lr-paye');
const gambia = require('../../netlify/functions/_engines/gm-paye');

const fixtures = [
  { grossAnnual: 70000, tax: 0, social: 2800, net: 67200 },
  { grossAnnual: 200000, tax: 6500, social: 8000, net: 185500 },
  { grossAnnual: 800000, tax: 96500, social: 32000, net: 671500 },
  { grossAnnual: 1000000, tax: 146500, social: 40000, net: 813500 },
];

for (const fixture of fixtures) {
  const result = engine.calculate({ grossAnnual: fixture.grossAnnual });
  assert.strictEqual(result.tax.taxableIncome, fixture.grossAnnual, 'LRA PIT must use annual gross income');
  assert.strictEqual(result.tax.netTax, fixture.tax, `unexpected tax at LRD ${fixture.grossAnnual}`);
  assert.strictEqual(result.deductions.nasscorp, fixture.social, `unexpected NASSCORP at LRD ${fixture.grossAnnual}`);
  assert.strictEqual(result.result.netAnnual, fixture.net, `unexpected net at LRD ${fixture.grossAnnual}`);
}

const reverse = engine.reverseCalculate({ netAnnual: 813500 });
assert.ok(Math.abs(reverse.input.grossAnnual - 1000000) < 2, 'reverse calculation must round-trip the LRD 1m fixture');
assert.strictEqual(engine.formulaParameters.ssDeductibleFromTaxable, false, 'Liberia must explicitly preserve gross as the PIT base');
assert.ok(!Object.prototype.hasOwnProperty.call(gambia.formulaParameters, 'ssDeductibleFromTaxable'), 'factory default must not change other engine signatures');
assert.strictEqual(engine.sourceCheckedOn, '2026-07-21');

const root = path.resolve(__dirname, '../..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/calculation-quality/formula-registry.json'), 'utf8'));
for (const id of ['paye-server-lr', 'route-lr-paye', 'route-lr-paye-fr']) {
  const formula = registry.formulas.find((entry) => entry.id === id);
  assert.ok(formula, `missing protected formula record ${id}`);
  assert.strictEqual(formula.artifactDigest, quality.digestFile(root, formula.artifactPath), `${id} digest must match its reviewed artifact`);
  assert.strictEqual(formula.lastVerified, '2026-07-21', `${id} must carry the current source-review date`);
  assert.deepStrictEqual(formula.sources.map((source) => source.title), [
    'Liberia Revenue Authority tax education',
    'NASSCORP revised employer guide'
  ]);
}

const golden = JSON.parse(fs.readFileSync(path.join(root, 'data/calculation-quality/golden-fixtures.json'), 'utf8'));
for (const fixture of golden.fixtures.filter((entry) => entry.formulaId === 'paye-server-lr')) {
  const result = engine.calculate(fixture.input);
  for (const [selector, expected] of Object.entries(fixture.expected)) {
    const actual = selector.split('.').reduce((value, key) => value[key], result);
    assert.ok(Math.abs(actual - expected) <= fixture.tolerance, `${fixture.id} ${selector}: expected ${expected}, got ${actual}`);
  }
}

console.log('Liberia PAYE engine fixtures passed.');
