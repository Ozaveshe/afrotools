'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const observations = require('../assets/js/lib/fuel-market-observations');
const { markets } = require('../data/fuel/markets.json');

test('a newly saved workbook cannot refresh a year-only historical fuel observation', () => {
  const market = markets.find(row => row.market_id === 'er-national-historical-diesel');
  const record = { ...market.fuels[0], effective_date: '2026-11-18' };
  const status = observations.status(record, '2026-11-18');
  assert.equal(status.historical, true);
  assert.equal(status.freshnessBasis, 'observation-year');
  const report = observations.priceContext(market, record, status.basis);
  assert.equal(report.observationYear, 2018);
  assert.equal(report.snapshotDate, '2026-11-18');
  assert.equal(report.referenceDate, null);
  assert.equal(report.observationDate, null);
  assert.equal(report.effectiveDate, null);
  for (const year of ['2018', 2018.5, 2027]) {
    assert.equal(observations.status({ ...record, observation_year: year }, '2026-11-18').valid, false);
  }
});

test('Bakara October prices retain the market, survey period and earlier product-specific references', () => {
  const market = markets.find(row => row.market_id === 'so-city-reference');
  for (const [fuel, price, oldCurrency] of [['petrol', 34200, 'USD'], ['diesel', 37300, 'SOS']]) {
    const record = market.fuels.find(row => row.fuel_type === fuel);
    const status = observations.status(record, '2026-11-18');
    assert.equal(status.available, true);
    assert.equal(status.basis, 'monthly-retail-survey');
    assert.equal(record.price, price);
    assert.equal(record.previous_record.currency, oldCurrency);
    const report = observations.priceContext(market, record, status.basis);
    assert.equal(report.granularity, 'city');
    assert.equal(report.currency, 'SOS');
    assert.equal(report.periodStart, '2026-10-01');
    assert.equal(report.periodEnd, '2026-10-31');
    assert.equal(report.sourcePublishedAt, '2026-11-17');
    assert.equal(report.effectiveDate, null);
  }
});
