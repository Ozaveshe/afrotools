'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../engines/src/crop-insurance-hub-engine');
const fixture = require('./fixtures/crop-insurance-hub-english-invariants.json');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/crop-insurance');

for (const profile of fixture.calculations) {
  const result = engine.calculate(profile.input);
  assert.equal(result.premium, profile.input.farmValue * profile.input.premiumRate / 100);
  assert.equal(result.retainedExcess, profile.input.farmValue * profile.input.excess / 100);
  assert.equal(engine.formatEnglish(result), profile.output);
}

const context = { window: { AfroTools: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/agriculture/crop-insurance-data.js', 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.window.AfroTools.cropInsuranceData));
const englishLabels = {
  west_africa: 'West Africa', east_africa: 'East Africa', central_africa: 'Central Africa',
  southern_africa: 'Southern Africa', north_africa: 'North Africa',
};
const directory = engine.buildCountryDirectory(data, contract.COVERED, contract.META, contract.REGION_ORDER, englishLabels);
assert.equal(directory.ok, true);
assert.equal(directory.count, 15);
assert.deepEqual(directory.groups.map(group => ({
  label: `${group.name} (${group.count})`,
  countries: group.rows.map(row => row.name),
})), fixture.regions);
assert.deepEqual(directory.rows.map(row => ({
  name: row.name,
  programs: `${row.programCount} program${row.programCount > 1 ? 's' : ''}`,
  href: `/agriculture/crop-insurance/${row.slug}`,
})), fixture.cards);
for (const row of directory.rows) assert.equal(engine.selectCountry(directory, row.code).country.code, row.code);
assert.equal(engine.selectCountry(directory, 'XX').status, 'unknown-country');
assert.equal(engine.buildCountryDirectory(data, contract.COVERED.concat('NG'), contract.META, contract.REGION_ORDER, englishLabels).status, 'duplicate-country');

console.log(`PASS ${fixture.calculations.length} Crop Insurance calculations and ${directory.count} country-directory owners`);
