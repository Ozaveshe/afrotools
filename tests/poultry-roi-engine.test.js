'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../engines/src/poultry-roi-engine');
const fixtures = require('./fixtures/poultry-roi-english-invariants.json');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.resolve(__dirname, '../data/agriculture/poultry-data.js'), 'utf8'),
  context
);
const production = context.window.AfroTools.PoultryProduction;

for (const fixture of fixtures.cases) {
  assert.deepEqual(
    engine.calculate(fixture.input, fixture.countryData, production),
    fixture.output,
    fixture.id
  );
}

assert.deepEqual(engine.calculate({}, null, production), { error: 'No country data provided' });
assert.deepEqual(
  engine.calculate({ mode: 'unsupported' }, fixtures.cases[0].countryData, production),
  { error: 'Unknown mode: unsupported' }
);
assert.deepEqual(
  engine.calculate({ mode: 'broilers' }, fixtures.cases[0].countryData, null),
  { error: 'PoultryProduction data not loaded' }
);

console.log(JSON.stringify({
  tool: 'poultry-roi-calculator',
  countries: fixtures.countries.length,
  invariantCases: fixtures.cases.length,
  modes: 4,
  status: 'passed',
}, null, 2));
