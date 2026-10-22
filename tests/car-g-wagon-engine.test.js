'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Price = require('../assets/js/lib/car-price-intelligence.js');
const Import = require('../assets/js/lib/car-import-cost-engine.js');
const { parseCsv } = require('../scripts/car-catalog-manager.js');
const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
test('2022 G-Wagon catalogue and import handoff use verified 3982 cc engine without rounding up to 4000 cc', () => {
  const rows = parseCsv(fs.readFileSync(path.join(root, 'data/cars/master-vehicle-catalog.csv'), 'utf8'));
  const headers = rows.shift();
  const row = rows.find(row => row[0] === 'mercedes-g-wagon-2022');
  assert.equal(row[headers.indexOf('engine_cc_min')], '3982');
  assert.equal(row[headers.indexOf('engine_cc_max')], '3982');
  const data = read('data/cars/price-intelligence.json');
  const vehicle = data.vehicles.find(row => row.id === 'mercedes-g-wagon-2022');
  assert.deepEqual(vehicle.cc, [3982, 3982]);
  const importData = Import.mergeData(read('data/trade/car-import-cost-core.json'), ['ng','ke','gh','ug','zm','tz'].map(code => read('data/trade/car-import-cost-' + code + '.json')), {NGN:1535.5,KES:129.45,GHS:14.89,UGX:3720,ZMW:27.5,TZS:2650});
  for (const countryCode of ['NG','KE','GH','UG','ZM','TZ']) {
    const context = Price.buildVehicleContext(data, importData, {vehicle, countryCode, sourceMarket:'uae'});
    const url = new URL(context.calculatorUrl, 'https://afrotools.com');
    assert.equal(url.searchParams.get('engineCc'), '3982', countryCode + ' handoff');
    assert.equal(context.landed.normalResult.input.engineCc, 3982, countryCode + ' calculation input');
    assert.equal(url.searchParams.get('year'), '2022');
    assert.equal(url.searchParams.get('make'), 'Mercedes-Benz');
    assert.equal(url.searchParams.get('source'), 'uae');
    assert.ok(Number.isFinite(context.landed.normal));
  }
});
