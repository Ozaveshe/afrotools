const assert = require('assert');
const engine = require('../assets/js/engines/fuel-tracker-engine.js');

assert.equal(engine.ageDays('2026-07-06', '2026-07-22'), 16);
assert.equal(engine.ageDays('', '2026-07-22'), Infinity);

const row = {
  code: 'NG',
  last_updated: '2026-07-06',
  source_url: 'https://example.test/source',
  petrol: { price: 300, usd: 0.33 }
};
assert.equal(engine.rowUsability(row, 'petrol', '2026-07-22', 45).usable, true);
assert.equal(engine.rowUsability({ ...row, official_verified: false, official_source_url: 'https://official.example.test' }, 'petrol', '2026-07-22', 45).sourceUrl, 'https://example.test/source');
assert.equal(engine.rowUsability(row, 'petrol', '2026-09-01', 45).usable, false);
assert.equal(engine.rowUsability({ ...row, source_url: '' }, 'petrol', '2026-07-22', 45).usable, false);
assert.equal(engine.rowUsability(row, 'diesel', '2026-07-22', 45).usable, false);

const result = engine.calculateGenerator({ pricePerLitre: 1000, litresPerHour: 1.5, hoursPerDay: 8, daysPerMonth: 26 });
assert.equal(result.ok, true);
assert.equal(result.dailyLitres, 12);
assert.equal(result.monthlyLitres, 312);
assert.equal(result.monthlyCost, 312000);
assert.equal(result.annualCost, 3744000);
assert.equal(engine.calculateGenerator({ pricePerLitre: 0, litresPerHour: 1, hoursPerDay: 1, daysPerMonth: 1 }).ok, false);
assert.equal(engine.calculateGenerator({ pricePerLitre: 1, litresPerHour: 1, hoursPerDay: 25, daysPerMonth: 1 }).ok, false);

console.log('Fuel tracker engine: 11 checks passed.');
