'use strict';

const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/crypto-dca-replay.js');

function price(date, value, hour = '00:00:00.000') {
  return { at: `${date}T${hour}Z`, price: value };
}

(() => {
  assert.deepEqual(engine.buildSchedule('2026-01-31', '2026-04-30', 'monthly'), [
    '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
  ]);
  assert.deepEqual(engine.buildSchedule('2026-07-01', '2026-07-15', 'weekly'), [
    '2026-07-01', '2026-07-08', '2026-07-15',
  ]);
  assert.throws(() => engine.buildSchedule('2000-01-01', '2026-07-22', 'monthly'), /365 calendar days/);

  const result = engine.replay({
    startDate: '2026-07-20',
    endDate: '2026-07-22',
    frequency: 'daily',
    contribution: 100,
    percentCost: 1,
    fixedCost: 1,
  }, [
    price('2026-07-20', 10),
    price('2026-07-21', 20),
    price('2026-07-22', 25),
  ]);
  assert.equal(result.expectedCount, 3);
  assert.equal(result.usedCount, 3);
  assert.equal(result.missedCount, 0);
  assert.equal(result.totalOutlay, 300);
  assert.equal(result.totalCosts, 6);
  assert.equal(result.acquisitionCash, 294);
  assert.equal(result.totalUnits, 9.8 + 4.9 + 3.92);
  assert.equal(result.valueAtLastSourcePrice, result.totalUnits * 25);
  assert.equal(result.modeledChange, result.valueAtLastSourcePrice - 300);

  const gaps = engine.replay({
    startDate: '2026-07-20',
    endDate: '2026-07-22',
    frequency: 'daily',
    contribution: 50,
  }, [
    price('2026-07-20', 10, '12:00:00.000'),
    price('2026-07-22', 20),
  ]);
  assert.equal(gaps.usedCount, 2);
  assert.equal(gaps.missedCount, 1);
  assert.equal(gaps.rows[0].status, 'used');
  assert.equal(gaps.rows[1].reason, 'price_already_used');
  assert.equal(gaps.rows[2].referencePrice, 20);
  assert.equal(gaps.rows.some(row => row.referenceAt && row.referenceAt > `${row.scheduledDate}T23:59:59.999Z`), false);

  assert.throws(() => engine.replay({
    startDate: '2026-07-20', endDate: '2026-07-22', frequency: 'daily',
    contribution: 10, percentCost: 50, fixedCost: 5,
  }, [price('2026-07-20', 1)]), /Costs must be lower/);
  assert.throws(() => engine.normalizePrices([
    price('2026-07-20', 10), price('2026-07-20', 11),
  ]), /strictly ordered/);
  assert.throws(() => engine.normalizePrices([price('2026-07-20', -1)]), /invalid row/);
  assert.throws(() => engine.normalizePrices([price('2026-07-20', Number.MAX_VALUE)]), /invalid row/);
  assert.throws(() => engine.replay({
    startDate: '2026-07-20', endDate: '2026-07-22', frequency: 'weekly',
    contribution: engine.MAX_MONEY_INPUT + 1,
  }, [price('2026-07-22', 1)]), /supported limit/);
  assert.throws(() => engine.replay({
    startDate: '2026-07-20', endDate: '2026-07-22', frequency: 'weekly', contribution: 10,
  }, [price('2026-07-20', 1)]), /more than 36 hours/);
  assert.throws(() => engine.replay({
    startDate: '2026-07-20', endDate: '2026-07-22', frequency: 'weekly', contribution: 10,
  }, [price('2026-07-23', 1)]), /beyond the requested end date/);
  assert.equal(engine.csvCell('=HYPERLINK("bad")').startsWith('"\'='), true);
  assert.equal(engine.csvCell('-2').startsWith('"\'-'), true);

  console.log('crypto-dca-replay: ok');
})();
