'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const registry = require('../data/calculation-quality/formula-registry.json');
const quality = require('../scripts/lib/calculation-quality');

for (const plan of [
  { year: '2026/27', slug: 'za-paye', other: 'za-paye-2025-26', id: 'route-za-paye-current', first: 245100, rebate: 17820, paye: 40572 },
  { year: '2025/26', slug: 'za-paye-2025-26', other: 'za-paye', id: 'route-za-paye', first: 237100, rebate: 17235, paye: 41797 },
]) {
  test('English salary calculation and published dates match ' + plan.year, () => {
    const html = fs.readFileSync(path.join(root, 'south-africa', plan.slug + '.html'), 'utf8');
    assert.ok(html.includes('href="/south-africa/' + plan.other + '"'));
    const formula = registry.formulas.find(record => record.id === plan.id);
    assert.equal(formula.artifactDigest, quality.digestHtmlFormulaSource(html));
    const begin = html.indexOf('const SARS_BANDS =');
    const end = html.indexOf('function reverseCalc(', begin);
    assert.ok(begin > -1 && end > begin);
    const calculate = vm.runInNewContext(html.slice(begin, end) + '\ncomputePAYE');
    assert.equal(calculate(300000).paye, plan.paye);
    assert.equal(calculate(plan.first).grossTax, plan.first * 0.18);
    assert.equal(calculate(300000).rebate, plan.rebate);
  });
}
