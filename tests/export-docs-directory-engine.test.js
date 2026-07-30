'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const engine = require('../engines/src/export-docs-directory-engine');
const fixture = require('./fixtures/export-docs-english-invariants.json');

const context = { window: { AfroTools: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/agriculture/country-index.js', 'utf8'), context);
const countries = JSON.parse(JSON.stringify(context.window.AfroTools.countryIndex));
const labels = JSON.parse(JSON.stringify(context.window.AfroTools.regionLabels));
const order = fixture.owner.countries.reduce((keys, country) => {
  if (!keys.includes(country.region)) keys.push(country.region);
  return keys;
}, []);
const directory = engine.buildDirectory(countries, labels, order);

assert.equal(directory.ok, true);
assert.equal(directory.count, 54);
assert.deepEqual(directory.rows, fixture.owner.countries);
assert.deepEqual(directory.groups.map(group => ({
  label: `${group.name} (${group.count})`,
  countries: group.rows.map(row => row.name),
})), fixture.sections.slice(6));
for (const country of countries) {
  assert.deepEqual(engine.select(directory, country.code).country, country);
  assert.equal(engine.search(directory, country.name).rows.some(row => row.code === country.code), true);
  assert.equal(engine.search(directory, country.code).rows.some(row => row.code === country.code), true);
  for (const crop of country.topCrops) assert.equal(engine.search(directory, crop).rows.some(row => row.code === country.code), true);
}
assert.equal(engine.search(directory, 'not-a-real-country-or-crop').status, 'empty');
assert.equal(engine.select(directory, 'XX').status, 'unknown-country');
assert.equal(engine.buildDirectory(countries.concat(countries[0]), labels, order).status, 'duplicate-country');
assert.equal(engine.buildDirectory([{ ...countries[0], region: 'unknown' }], labels, order).status, 'invalid-country');

console.log(`PASS ${countries.length} Export Documents country owners with search, selection, grouping and fail-closed validation`);
