'use strict';
const assert = require('node:assert/strict');
const engine = require('../engines/src/harvest-date-engine');
const dates = ['2024-02-29','2025-01-01','2025-10-25','2026-04-01','2027-12-31'];
let scenarios = 0;
for (const plantingDate of dates) for (const maturityDays of [0,1,80.5,110,365,730]) for (const crop of ['maize','rice','cassava','tomato']) for (const weatherRisk of ['low','medium','high']) {
  const result = engine.calculate({ plantingDate, maturityDays, crop, weatherRisk });
  assert.equal(result.ok, true);
  assert.match(result.harvestDate, /^\d{4}-\d{2}-\d{2}$/);
  scenarios += 1;
}
for (const input of [{plantingDate:'',maturityDays:1,crop:'maize',weatherRisk:'low'},{plantingDate:'2025-02-30',maturityDays:1,crop:'maize',weatherRisk:'low'},{plantingDate:'2025-01-01',maturityDays:-1,crop:'maize',weatherRisk:'low'}]) assert.equal(engine.calculate(input).ok,false);
console.log(`PASS ${scenarios} Harvest Date engine scenarios`);
