'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../engines/src/tractor-calculator-engine');
const fixture = require('./fixtures/tractor-calculator-english-invariants.json');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/tractor-calculator');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function assertNumericRecordClose(actual, expected, label) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${label} keys`);
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (typeof expectedValue === 'number' && Number.isFinite(expectedValue)) {
      const tolerance = Math.max(1, Math.abs(expectedValue)) * Number.EPSILON * 8;
      assert.ok(
        Math.abs(actualValue - expectedValue) <= tolerance,
        `${label}.${key}: expected ${expectedValue}, received ${actualValue}`,
      );
    } else {
      assert.deepEqual(actualValue, expectedValue, `${label}.${key}`);
    }
  }
}

const row = manifest.rows.find(value => value.english.id === 'tractor-calculator');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
assert.match(html, /tractor-calculator-engine\.js/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.match(html, /Hypothèses statiques non datées/i);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);
assert.equal(Object.keys(contract.COUNTRIES).length, 7);
assert.equal(Object.keys(contract.EQUIPMENT).length, 5);

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/equipment-data.js'), 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.EQUIPMENT_DATA));
const profiles = fixture.arithmetic.map(profile => {
  const input = {
    ...profile.input,
    financeType: 'lease',
    doContract: profile.input.contractHa > 0,
    contractRate: data.hireRates[profile.input.countryCode].tractor_ploughing_per_ha || 0,
  };
  const output = engine.calculate(input, data);
  assert.equal(output.ok, true);
  assert.deepEqual(output.buy, profile.output.buy);
  assert.deepEqual(output.hire, profile.output.hire);
  assertNumericRecordClose(output.lease, profile.output.lease, 'output.lease');
  assertNumericRecordClose(output.costs, profile.output.costs, 'output.costs');
  assert.equal(output.winner, profile.output.winner);
  assert.ok(contract.COUNTRIES[input.countryCode]);
  assert.ok(contract.EQUIPMENT[input.equipmentKey]);
  return { input, output };
});
const oracle = {
  schemaVersion: 1,
  family: 'singleton:tractor-calculator',
  profiles,
  owners: {
    data: 'data/agriculture/equipment-data.js',
    engine: 'engines/src/tractor-calculator-engine.js',
  },
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`);
}
console.log(`PASS ${profiles.length} French Tractor Calculator profiles`);
