const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sandbox = { window: { AfroTools: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data/agriculture/seed-data.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'engines/src/seed-rate-engine.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data/agriculture/seed-data-extension.js'), 'utf8'), sandbox);

const result = sandbox.window.AfroTools.SeedRateEngine.calculate({
  cropId: 'tomato',
  plantingMethod: 'transplanting',
  seedQuality: 'improved',
  fieldConditions: 'average',
  farmSizeHa: 0.5,
  intercrop: 'sole',
  rowSpacing_cm: 60,
  plantSpacing_cm: 40,
  seedsPerHole: 1
}, sandbox.window.AfroTools.seedData, 'DJ', {
  countryCode: 'DJ',
  currency: 'DJF',
  currencySymbol: 'Fdj'
});

assert.strictEqual(result.error, undefined, 'tomato method returns a result');
assert.strictEqual(result.seedRateKgHa, 0.2, 'tomato planning rate is deterministic');
assert.strictEqual(result.totalSeedKg, 0.1, 'farm-size result is deterministic');
assert.strictEqual(result.bagSize_kg, undefined, 'unsupported packet size is not invented');
assert.strictEqual(result.numBags, null, 'unsupported packet count is not invented');
assert(result.notes.includes('confirm packet germination'), 'result exposes the planning boundary');

console.log('Seed-rate engine tomato planning fixture passed without invented packet sizing.');
