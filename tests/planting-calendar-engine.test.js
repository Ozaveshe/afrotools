'use strict';

const assert = require('node:assert/strict');
const data = require('../data/agriculture/planting-calendar-data.json');
const engine = require('../engines/src/planting-calendar-engine');

const STATUSES = ['none', 'plant', 'grow', 'harvest'];
const zoneIds = Object.keys(data.zones);

assert.equal(zoneIds.length, 7);
assert.deepEqual(engine.calculate({ zone: 'not-a-zone' }, data), {
  ok: false,
  status: 'unknown-zone',
  zone: 'not-a-zone',
});
assert.deepEqual(engine.calculate({ zone: 'forest' }, null), {
  ok: false,
  status: 'missing-data',
});

for (const zone of zoneIds) {
  for (const rainfall of ['unimodal', 'bimodal']) {
    const result = engine.calculate({ zone, rainfall }, data);
    assert.equal(result.ok, true, `${zone}/${rainfall} should calculate`);
    assert.equal(result.zone, zone);
    assert.equal(result.rainfall, rainfall);
    assert.deepEqual(result.months, data.months);
    assert.deepEqual(
      result.crops.map((crop) => crop.id),
      Object.keys(data.zones[zone]),
      `${zone}/${rainfall} must preserve displayed crop order`,
    );
    for (const crop of result.crops) {
      assert.deepEqual(
        crop.months.map((month) => month.value),
        data.zones[zone][crop.id],
        `${zone}/${rainfall}/${crop.id} must preserve the exact calendar`,
      );
      assert.deepEqual(
        crop.months.map((month) => month.status),
        data.zones[zone][crop.id].map((value) => STATUSES[value]),
      );
    }
  }
}

for (const zone of zoneIds) {
  assert.deepEqual(engine.selectCountryZone(zone, data), {
    zone,
    rainfall: data.bimodalZones.includes(zone) ? 'bimodal' : 'unimodal',
  });
}

assert.equal(engine.calculate({ zone: 'forest', rainfall: 'bimodal' }, data).note, 'bimodal-two-seasons');
assert.equal(engine.calculate({ zone: 'forest', rainfall: 'unimodal' }, data).note, 'forest-unimodal-warning');
assert.equal(engine.calculate({ zone: 'guinea', rainfall: 'unimodal' }, data).note, 'none');

console.log(JSON.stringify({
  tool: 'planting-calendar',
  zones: zoneIds.length,
  scenarios: zoneIds.length * 2,
  status: 'passed',
}, null, 2));
