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

// Invalid Date and five-digit years must never be successful calculator results.
for(const [plantingDate,maturityDays] of [['2026-03-01',1e308],['2026-03-01',100000000],['9999-12-31',1],['9999-12-01',31]])assert.deepEqual(engine.calculate({plantingDate,maturityDays,crop:'maize',weatherRisk:'normal'}),{ok:false,status:'invalid-input'});
for(const [plantingDate,maturityDays,expected] of [['0100-01-01',0,'0100-01-01'],['2024-02-28',1,'2024-02-29'],['2024-02-29',1,'2024-03-01'],['2025-02-28',1,'2025-03-01'],['9999-12-31',0,'9999-12-31']])assert.equal(engine.calculate({plantingDate,maturityDays,crop:'maize',weatherRisk:'normal'}).harvestDate,expected);
console.log('PASS Harvest Date overflow, calendar and year-format regressions');
