const assert = require('assert');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const engine = require(path.join(repoRoot, 'assets/js/engines/import-duty-nigeria-engine.js'));

const base = engine.calculate({
  countryName: 'Nigeria',
  category: 'electronics',
  itemValue: 5000,
  itemCurrency: 'USD',
  freight: 700,
  insurance: 150,
  quantity: 5
});

assert.strictEqual(base.countryName, 'Nigeria');
assert.strictEqual(base.cif, 5850);
assert(base.totalUSD > base.cif, 'total includes estimated duty/tax layers');
assert.strictEqual(base.fields.dutyRate.sourceType, 'unknown');
assert.strictEqual(base.fields.dutyRate.confidence, 'needs_review');
assert.strictEqual(base.fields.vatRate.confidence, 'needs_review');
assert.strictEqual(base.confidence.status, 'needs_review');
assert.strictEqual(base.perUnitUSD, Math.round((base.totalUSD / 5 + Number.EPSILON) * 100) / 100);

const vehicle = engine.calculate({
  countryName: 'Nigeria',
  category: 'vehicle',
  itemValue: 8000,
  freight: 1500,
  insurance: 250,
  vehicleType: 'suv',
  vehicleMake: 'Toyota',
  vehicleModel: 'RAV4',
  vehicleYear: '2018',
  customsValueOverride: 11000,
  fxMode: 'user',
  fxRate: 1550,
  dutyRateOverride: 25,
  portHandling: 900,
  clearingAgent: 1200
});

assert.strictEqual(vehicle.vehicle.make, 'Toyota');
assert.strictEqual(vehicle.vehicle.model, 'RAV4');
assert.strictEqual(vehicle.customsValue, 11000);
assert.strictEqual(vehicle.fields.customsValue.sourceType, 'user_input');
assert.strictEqual(vehicle.fields.dutyRate.sourceType, 'user_input');
assert.strictEqual(vehicle.fields.fxRate.sourceType, 'user_input');
assert.strictEqual(vehicle.fields.portHandling.sourceType, 'user_input');
assert(vehicle.whatThisMeans.verify.some((item) => item.includes('vehicle age')), 'vehicle-specific verification warning is present');

const manual = engine.calculate({
  countryName: 'Other',
  category: 'other',
  itemValue: 1000,
  freight: 100,
  insurance: 25
});

assert.strictEqual(manual.dutyRate, 0);
assert.strictEqual(manual.fields.dutyRate.confidence, 'needs_review');
assert.strictEqual(manual.fields.dutyRate.sourceUrl, '');
assert.strictEqual(manual.fields.dutyRate.lastChecked, '');

for (const field of vehicle.sourceFields.concat(base.sourceFields, manual.sourceFields)) {
  if (!field) continue;
  if (String(field.sourceType).startsWith('official_')) {
    assert(field.sourceUrl, `${field.label} official field has sourceUrl`);
    assert(field.lastChecked, `${field.label} official field has lastChecked`);
  }
}

console.log('import-duty-nigeria-engine: ok');
