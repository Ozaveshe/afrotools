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
const { SeedRateEngine, seedData } = sandbox.window.AfroTools;
for (const [cropId, crop] of Object.entries(seedData)) {
  if (crop.propagation !== 'vegetative') continue;
  for (const country of ['GH', ...Object.keys(crop.countryOverrides || {})]) {
    const spacing = crop.countryOverrides?.[country]?.spacing || crop.defaultSpacing;
    const expectedArea = spacing.row_cm * spacing.plant_cm / 10000;
    for (const farmSizeHa of [1, 2]) {
      const layout = SeedRateEngine.calculate({cropId, farmSizeHa}, seedData, country, {});
      assert.strictEqual(layout.spacingArea_m2, expectedArea);
      assert.strictEqual(layout.plantsPerHa, Math.round(10000 / expectedArea));
      assert.strictEqual(layout.totalPlants, Math.round(10000 * farmSizeHa / expectedArea));
      if (layout.materialWeight?.unit === 'setts') {
        assert.strictEqual(layout.materialWeight.total, layout.totalPlants);
      }
    }
  }
}
const ghana = SeedRateEngine.calculate({cropId: 'cassava', farmSizeHa: 2}, seedData, 'GH', {});
assert.strictEqual(ghana.totalPlants, 20000);
assert.strictEqual(ghana.spacingSource, 'https://link.springer.com/article/10.1007/s11104-017-3387-6');
const custom = SeedRateEngine.calculate({cropId: 'cassava', farmSizeHa: 2, rowSpacing_cm: 100, plantSpacing_cm: 80}, seedData, 'GH', {});
assert.strictEqual(custom.spacingArea_m2, 0.8);
assert.strictEqual(custom.totalPlants, 25000);
console.log('Vegetative layouts reconcile for all crops and country overrides.');
