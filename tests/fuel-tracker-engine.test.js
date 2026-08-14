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

const markets = require('../data/fuel/markets.json');
assert.equal(engine.validateDataset(markets).valid, true);
assert.equal(engine.granularityLabel('national', 'Nigeria'), 'National benchmark for Nigeria');
assert.equal(engine.granularityLabel('city', 'Kenya'), 'City reference');
const nearest = engine.nearestMarket(markets.markets, 6.5244, 3.3792);
assert.equal(nearest.market.market_id, 'ng-national');
assert(nearest.distanceKm > 0);
const currentRecord = engine.marketRecord(markets.markets.find((market) => market.market_id === 'ng-national'), 'petrol');
assert.equal(engine.recordStatus(currentRecord, '2026-08-13', 45).available, true);
const staleRecord = engine.marketRecord(markets.markets.find((market) => market.market_id === 'ke-nairobi-2026-04'), 'petrol');
assert.equal(engine.recordStatus(staleRecord, '2026-08-13', 45).stale, true);
const litreFill = engine.calculateFillCost({ pricePerLitre: 1000, mode: 'quantity', unit: 'litre', quantity: 20 });
assert.equal(litreFill.ok, true);
assert.equal(litreFill.totalCost, 20000);
const gallonFill = engine.calculateFillCost({ pricePerLitre: 1000, mode: 'quantity', unit: 'gallon', quantity: 2 });
assert.equal(gallonFill.litres.toFixed(6), '7.570824');
const tankFill = engine.calculateFillCost({ pricePerLitre: 1000, mode: 'tank', unit: 'litre', tankSize: 50, currentLevelPct: 20 });
assert.equal(tankFill.litres, 40);
assert.equal(tankFill.totalCost, 40000);
assert.equal(engine.calculateFillCost({ pricePerLitre: 1000, mode: 'tank', unit: 'litre', tankSize: 50, currentLevelPct: 101 }).ok, false);
assert.equal(engine.recordStatus(null, '2026-08-13', 45).available, false);
assert.equal(engine.nearestMarket([], 0, 0), null);

console.log('Fuel tracker engine and market finder checks passed.');
