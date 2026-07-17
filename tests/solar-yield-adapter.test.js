const assert = require('assert');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataset = require(path.join(repoRoot, 'data/energy/solar-roi-country-dataset.js'));
const solarYield = require(path.join(repoRoot, 'assets/js/lib/solar-yield-adapter.js'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertResultShape(result, message) {
  assert(result, `${message}: result exists`);
  assert.strictEqual(typeof result.value, 'number', `${message}: value is numeric`);
  assert(result.value > 0, `${message}: value is positive`);
  assert.strictEqual(typeof result.unit, 'string', `${message}: unit exists`);
  assert.strictEqual(typeof result.sourceName, 'string', `${message}: sourceName exists`);
  assert(Object.prototype.hasOwnProperty.call(result, 'sourceUrl'), `${message}: sourceUrl field exists`);
  assert.strictEqual(typeof result.freshness, 'string', `${message}: freshness exists`);
  assert(['High', 'Medium', 'Low'].includes(result.confidence), `${message}: confidence is valid`);
}

const countryAdapter = solarYield.createSolarYieldAdapter(dataset);
const nigeria = countryAdapter.getSolarYield('NG');
assertResultShape(nigeria, 'Nigeria static country default');
assert.strictEqual(nigeria.value, dataset.countries.NG.assumptions.solarYield.value, 'country default comes from Solar ROI country dataset');
assert.strictEqual(nigeria.sourceName, dataset.countries.NG.assumptions.solarYield.sourceName, 'country default keeps source name');

const regionalDataset = clone(dataset);
regionalDataset.solarResource.regionOverrides = {
  NG: {
    lagos: {
      value: 4.7,
      unit: 'peak sun hours/day',
      sourceName: 'Static Lagos PVOUT planning seed',
      sourceUrl: 'https://globalsolaratlas.info/',
      freshness: '2026-03-01',
      confidence: 'Medium'
    }
  }
};
regionalDataset.solarResource.cityOverrides = {
  NG: {
    lagos: {
      ikeja: {
        value: 4.9,
        unit: 'peak sun hours/day',
        sourceName: 'Static Ikeja PVOUT planning seed',
        sourceUrl: 'https://globalsolaratlas.info/',
        freshness: '2026-03-01',
        confidence: 'Medium'
      }
    }
  }
};
const regionalAdapter = solarYield.createSolarYieldAdapter(regionalDataset);
assert.strictEqual(regionalAdapter.getSolarYield('NG', 'Lagos').value, 4.7, 'region override wins over country default');
assert.strictEqual(regionalAdapter.getSolarYield('NG', 'Lagos', 'Ikeja').value, 4.9, 'city override wins over region default');

const manual = regionalAdapter.getSolarYield('NG', 'Lagos', {
  manualOverride: {
    value: 6.2,
    unit: 'peak sun hours/day',
    sourceName: 'User manual solar-yield override',
    sourceUrl: null,
    freshness: 'user-entered',
    confidence: 'Low'
  }
});
assert.strictEqual(manual.value, 6.2, 'manual override wins over city and region values');
assert.strictEqual(manual.sourceName, 'User manual solar-yield override', 'manual override source is preserved');

const emptyAdapter = solarYield.createSolarYieldAdapter({ countries: {}, solarResource: { regionOverrides: {}, cityOverrides: {} } });
const legacy = emptyAdapter.getSolarYield({ code: 'XX', solar: { avgSunHours: 5.8 } });
assertResultShape(legacy, 'legacy country fallback');
assert.strictEqual(legacy.value, 5.8, 'legacy energy data fallback uses avgSunHours');

const fallback = emptyAdapter.getSolarYield('ZZ');
assertResultShape(fallback, 'missing country fallback');
assert.strictEqual(fallback.value, 5, 'missing country uses low-confidence planning fallback');
assert.strictEqual(fallback.confidence, 'Low', 'missing country fallback is low confidence');

console.log('solar-yield-adapter.test.js passed');
