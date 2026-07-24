(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.CryptoDcaReplay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 86400000;
  var MAX_GAP_MS = 36 * 60 * 60 * 1000;
  var MAX_RANGE_DAYS = 365;
  var MAX_MONEY_INPUT = 1000000000000;
  var MAX_REFERENCE_PRICE = 1000000000000000;
  var FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'];

  function parseUtcDate(value, label) {
    var text = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(label + ' must use YYYY-MM-DD.');
    var date = new Date(text + 'T00:00:00.000Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
      throw new Error(label + ' is not a valid UTC date.');
    }
    return date;
  }

  function positiveNumber(value, label, allowZero) {
    var number = Number(value);
    if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
      throw new Error(label + (allowZero ? ' cannot be negative.' : ' must be greater than zero.'));
    }
    return number;
  }

  function daysInUtcMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }

  function addCalendarMonth(date, anchorDay) {
    var nextMonth = date.getUTCMonth() + 1;
    var year = date.getUTCFullYear() + Math.floor(nextMonth / 12);
    var month = ((nextMonth % 12) + 12) % 12;
    var day = Math.min(anchorDay, daysInUtcMonth(year, month));
    return new Date(Date.UTC(year, month, day));
  }

  function buildSchedule(startValue, endValue, frequency) {
    if (FREQUENCIES.indexOf(frequency) < 0) throw new Error('Unsupported purchase frequency.');
    var start = parseUtcDate(startValue, 'Start date');
    var end = parseUtcDate(endValue, 'End date');
    if (start > end) throw new Error('Start date must be on or before the end date.');
    var rangeDays = Math.floor((end - start) / DAY_MS) + 1;
    if (rangeDays > MAX_RANGE_DAYS) throw new Error('Date range cannot exceed 365 calendar days.');
    var schedule = [];
    var cursor = new Date(start.getTime());
    var anchorDay = start.getUTCDate();
    while (cursor <= end) {
      schedule.push(cursor.toISOString().slice(0, 10));
      if (frequency === 'monthly') cursor = addCalendarMonth(cursor, anchorDay);
      else cursor = new Date(cursor.getTime() + (frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14) * DAY_MS);
      if (schedule.length > MAX_RANGE_DAYS) throw new Error('Schedule exceeds the 365-day product limit.');
    }
    return schedule;
  }

  function normalizePrices(history) {
    if (!Array.isArray(history) || !history.length) throw new Error('Price history is unavailable.');
    var previous = -Infinity;
    return history.map(function (row) {
      var timestamp = Date.parse(row && (row.at || row.timestamp));
      var price = Number(row && row.price);
      if (!Number.isFinite(timestamp) || !Number.isFinite(price) || price <= 0 || price > MAX_REFERENCE_PRICE) {
        throw new Error('Price history contains an invalid row.');
      }
      if (timestamp <= previous) throw new Error('Price history must be strictly ordered without duplicates.');
      previous = timestamp;
      return { at: new Date(timestamp).toISOString(), timestamp: timestamp, price: price };
    });
  }

  function findReference(prices, scheduleDate, usedIndexes) {
    var endOfDay = Date.parse(scheduleDate + 'T23:59:59.999Z');
    var selected = -1;
    for (var index = prices.length - 1; index >= 0; index -= 1) {
      if (prices[index].timestamp <= endOfDay) {
        selected = index;
        break;
      }
    }
    if (selected < 0) return { status: 'missed', reason: 'no_price_at_or_before_date' };
    var gapMs = endOfDay - prices[selected].timestamp;
    if (gapMs > MAX_GAP_MS) return { status: 'missed', reason: 'price_gap_over_36_hours', gapHours: gapMs / 3600000 };
    if (usedIndexes[selected]) return { status: 'missed', reason: 'price_already_used', gapHours: gapMs / 3600000 };
    usedIndexes[selected] = true;
    return { status: 'used', row: prices[selected], gapHours: gapMs / 3600000 };
  }

  function replay(input, history) {
    input = input || {};
    var contribution = positiveNumber(input.contribution, 'Contribution', false);
    var percentCost = positiveNumber(input.percentCost == null ? 0 : input.percentCost, 'All-in percentage cost', true);
    var fixedCost = positiveNumber(input.fixedCost == null ? 0 : input.fixedCost, 'Fixed cost', true);
    if (contribution > MAX_MONEY_INPUT || fixedCost > MAX_MONEY_INPUT) {
      throw new Error('Money inputs exceed the supported limit.');
    }
    if (percentCost > 100) throw new Error('All-in percentage cost cannot exceed 100%.');
    var percentCostAmount = contribution * percentCost / 100;
    var totalCostPerEvent = percentCostAmount + fixedCost;
    if (totalCostPerEvent >= contribution) throw new Error('Costs must be lower than the contribution.');

    var schedule = buildSchedule(input.startDate, input.endDate, input.frequency);
    var prices = normalizePrices(history);
    var endOfRequestedDay = Date.parse(input.endDate + 'T23:59:59.999Z');
    var lastPriceTimestamp = prices[prices.length - 1].timestamp;
    if (lastPriceTimestamp > endOfRequestedDay) throw new Error('Price history extends beyond the requested end date.');
    if (endOfRequestedDay - lastPriceTimestamp > MAX_GAP_MS) {
      throw new Error('The last source price is more than 36 hours before the requested end date.');
    }
    var usedIndexes = {};
    var totalUnits = 0;
    var totalOutlay = 0;
    var totalCosts = 0;
    var rows = schedule.map(function (scheduledDate, index) {
      var reference = findReference(prices, scheduledDate, usedIndexes);
      if (reference.status !== 'used') {
        return {
          sequence: index + 1,
          scheduledDate: scheduledDate,
          status: 'missed',
          reason: reference.reason,
          gapHours: reference.gapHours == null ? null : reference.gapHours
        };
      }
      var acquisitionCash = contribution - totalCostPerEvent;
      var units = acquisitionCash / reference.row.price;
      totalUnits += units;
      totalOutlay += contribution;
      totalCosts += totalCostPerEvent;
      return {
        sequence: index + 1,
        scheduledDate: scheduledDate,
        status: 'used',
        referenceAt: reference.row.at,
        gapHours: reference.gapHours,
        referencePrice: reference.row.price,
        grossContribution: contribution,
        percentageCost: percentCostAmount,
        fixedCost: fixedCost,
        acquisitionCash: acquisitionCash,
        units: units
      };
    });

    var lastSource = prices[prices.length - 1];
    var valueAtLastSourcePrice = totalUnits * lastSource.price;
    [
      totalUnits, totalOutlay, totalCosts, valueAtLastSourcePrice,
      valueAtLastSourcePrice - totalOutlay
    ].forEach(function (value) {
      if (!Number.isFinite(value)) throw new Error('The replay exceeds safe numeric limits.');
    });
    return {
      expectedCount: rows.length,
      usedCount: rows.filter(function (row) { return row.status === 'used'; }).length,
      missedCount: rows.filter(function (row) { return row.status === 'missed'; }).length,
      totalOutlay: totalOutlay,
      totalCosts: totalCosts,
      acquisitionCash: totalOutlay - totalCosts,
      totalUnits: totalUnits,
      averageAcquisitionPrice: totalUnits ? (totalOutlay - totalCosts) / totalUnits : null,
      lastSourceAt: lastSource.at,
      lastSourcePrice: lastSource.price,
      valueAtLastSourcePrice: valueAtLastSourcePrice,
      modeledChange: valueAtLastSourcePrice - totalOutlay,
      modeledChangePercent: totalOutlay ? (valueAtLastSourcePrice - totalOutlay) / totalOutlay * 100 : null,
      rows: rows
    };
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return {
    DAY_MS: DAY_MS,
    MAX_GAP_MS: MAX_GAP_MS,
    MAX_RANGE_DAYS: MAX_RANGE_DAYS,
    MAX_MONEY_INPUT: MAX_MONEY_INPUT,
    FREQUENCIES: FREQUENCIES.slice(),
    buildSchedule: buildSchedule,
    normalizePrices: normalizePrices,
    replay: replay,
    csvCell: csvCell
  };
});
