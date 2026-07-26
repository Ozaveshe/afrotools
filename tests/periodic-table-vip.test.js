const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../tools/periodic-table/periodic-table-engine.js');

const html = fs.readFileSync('tools/periodic-table/index.html', 'utf8');
const match = html.match(/var E=(\[[\s\S]*?\]);\s*window\.PERIODIC_ELEMENTS=E;/);
assert.ok(match, 'embedded element dataset must be present');
const elements = vm.runInNewContext(match[1]);

assert.equal(engine.validateElements(elements).valid, true);
assert.equal(elements.length, 118);
assert.equal(elements[0].n, 'Hydrogen');
assert.equal(elements[117].s, 'Og');

assert.deepEqual(engine.atomicWeight(elements[0]), {
  value: '1.0080',
  kind: 'Abridged standard atomic weight',
  sourceYear: 2024
});
assert.equal(engine.atomicWeight(elements[42]).value, 'No standard atomic weight');
assert.equal(engine.atomicWeight(elements[83]).value, 'No standard atomic weight');
assert.equal(engine.atomicWeight(elements[91]).value, '238.03');

assert.equal(engine.stateAt25C(elements[34]), 'Liquid');
assert.equal(engine.stateAt25C(elements[79]), 'Liquid');
assert.equal(engine.stateAt25C(elements[117]), 'Not established');

assert.deepEqual(Array.from(engine.filter(elements, { query: 'fe' }), element => element.s), ['Fe', 'Fm']);
assert.deepEqual(Array.from(engine.filter(elements, { query: '26' }), element => element.s), ['Fe']);
assert.equal(engine.filter(elements, { category: 'noble' }).length, 7);
assert.equal(engine.filter(elements, { period: 1 }).length, 2);
assert.equal(engine.filter(elements, { group: 18 }).length, 7);

assert.match(engine.report(elements[25]), /Iron \(Fe\)/);
assert.match(engine.report(elements[25]), /CIAAW Abridged Standard Atomic Weights 2024/);
assert.doesNotMatch(engine.report(elements[25]), /WAEC|KCSE|mining|conflict/i);

console.log('periodic-table-vip: all assertions passed');
