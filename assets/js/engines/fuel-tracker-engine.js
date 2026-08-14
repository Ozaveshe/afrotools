(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FuelTrackerEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 86400000;
  var US_GALLON_LITRES = 3.785411784;
  var GRANULARITY_LABELS = {
    station: 'Station price',
    city: 'City reference',
    region: 'Regional reference',
    national: 'National benchmark'
  };

  function finite(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function ageDays(dateValue, nowValue) {
    var date = Date.parse(dateValue || '');
    var now = Date.parse(nowValue || new Date().toISOString());
    if (!Number.isFinite(date) || !Number.isFinite(now)) return Infinity;
    return Math.max(0, Math.floor((now - date) / DAY_MS));
  }

  function granularityLabel(granularity, countryName) {
    var key = Object.prototype.hasOwnProperty.call(GRANULARITY_LABELS, granularity) ? granularity : 'national';
    var label = GRANULARITY_LABELS[key];
    return key === 'national' && countryName ? label + ' for ' + countryName : label;
  }

  function recordStatus(record, nowValue, maxAgeDays) {
    var now = Date.parse(nowValue || new Date().toISOString());
    var limit = Number.isFinite(Number(maxAgeDays)) ? Number(maxAgeDays) : 45;
    var effectiveAge = ageDays(record && record.effective_date, nowValue);
    var validTo = Date.parse(record && record.valid_to || '');
    var price = finite(record && record.price);
    var missing = !record || !record.fuel_type || !(price > 0) || !record.currency || !record.unit || !record.source_url;
    var expired = Number.isFinite(now) && Number.isFinite(validTo) && now > validTo + DAY_MS;
    var stale = !missing && (expired || effectiveAge > limit);
    return {
      available: !missing && !stale,
      stale: stale,
      ageDays: effectiveAge,
      reason: missing
        ? 'No complete source-backed record is available.'
        : stale
          ? (expired ? 'The published price period has ended.' : 'The reference is older than ' + limit + ' days.')
          : '',
      price: price
    };
  }

  function validateDataset(payload) {
    var errors = [];
    var ids = Object.create(null);
    if (!payload || Number(payload.schema_version) !== 1) errors.push('schema_version must be 1.');
    if (!payload || !Array.isArray(payload.markets) || !payload.markets.length) errors.push('markets must be a non-empty array.');
    (payload && payload.markets || []).forEach(function (market, marketIndex) {
      var prefix = 'markets[' + marketIndex + ']';
      if (!market.market_id) errors.push(prefix + '.market_id is required.');
      if (market.market_id && ids[market.market_id]) errors.push('Duplicate market_id: ' + market.market_id + '.');
      if (market.market_id) ids[market.market_id] = true;
      ['country_code', 'country_name', 'locality_name', 'granularity'].forEach(function (field) {
        if (!market[field]) errors.push(prefix + '.' + field + ' is required.');
      });
      if (!Number.isFinite(finite(market.latitude)) || !Number.isFinite(finite(market.longitude))) errors.push(prefix + ' requires numeric coordinates.');
      if (!Array.isArray(market.fuels) || !market.fuels.length) errors.push(prefix + '.fuels must be non-empty.');
      var fuelIds = Object.create(null);
      (market.fuels || []).forEach(function (record, fuelIndex) {
        var recordPrefix = prefix + '.fuels[' + fuelIndex + ']';
        if (fuelIds[record.fuel_type]) errors.push(prefix + ' has duplicate fuel_type: ' + record.fuel_type + '.');
        fuelIds[record.fuel_type] = true;
        ['fuel_type', 'currency', 'unit', 'effective_date', 'last_verified_at', 'source_name', 'source_url', 'confidence'].forEach(function (field) {
          if (!record[field]) errors.push(recordPrefix + '.' + field + ' is required.');
        });
        if (!(finite(record.price) > 0)) errors.push(recordPrefix + '.price must be positive.');
      });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function radians(value) { return value * Math.PI / 180; }

  function distanceKm(lat1, lon1, lat2, lon2) {
    var firstLat = finite(lat1); var firstLon = finite(lon1);
    var secondLat = finite(lat2); var secondLon = finite(lon2);
    if (![firstLat, firstLon, secondLat, secondLon].every(Number.isFinite)) return Infinity;
    var dLat = radians(secondLat - firstLat);
    var dLon = radians(secondLon - firstLon);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(radians(firstLat)) * Math.cos(radians(secondLat))
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function nearestMarket(markets, latitude, longitude) {
    if (!Array.isArray(markets) || !markets.length) return null;
    return markets.reduce(function (nearest, market) {
      var distance = distanceKm(latitude, longitude, market.latitude, market.longitude);
      if (!nearest || distance < nearest.distanceKm) return { market: market, distanceKm: distance };
      return nearest;
    }, null);
  }

  function marketRecord(market, fuelType) {
    return (market && market.fuels || []).find(function (record) { return record.fuel_type === fuelType; }) || null;
  }

  function calculateFillCost(input) {
    var price = finite(input && input.pricePerLitre);
    var mode = input && input.mode === 'tank' ? 'tank' : 'quantity';
    var unit = input && input.unit === 'gallon' ? 'gallon' : 'litre';
    var quantity = finite(input && input.quantity);
    var tankSize = finite(input && input.tankSize);
    var currentLevel = finite(input && input.currentLevelPct);
    var errors = [];
    if (!(price > 0 && price <= 10000000)) errors.push('Enter a valid positive fuel price.');
    if (mode === 'quantity' && !(quantity > 0 && quantity <= 100000)) errors.push('Enter an amount between 0 and 100,000.');
    if (mode === 'tank' && !(tankSize > 0 && tankSize <= 100000)) errors.push('Enter a tank size between 0 and 100,000.');
    if (mode === 'tank' && !(currentLevel >= 0 && currentLevel <= 100)) errors.push('Current tank level must be between 0% and 100%.');
    if (errors.length) return { ok: false, errors: errors };
    var requestedUnits = mode === 'tank' ? tankSize * (1 - currentLevel / 100) : quantity;
    var litres = unit === 'gallon' ? requestedUnits * US_GALLON_LITRES : requestedUnits;
    return {
      ok: true,
      mode: mode,
      inputUnit: unit,
      inputAmount: requestedUnits,
      litres: litres,
      totalCost: litres * price,
      pricePerLitre: price
    };
  }

  function calculateGenerator(input) {
    var price = finite(input && input.pricePerLitre);
    var rate = finite(input && input.litresPerHour);
    var hours = finite(input && input.hoursPerDay);
    var days = finite(input && input.daysPerMonth);
    var errors = [];
    if (!(price > 0 && price <= 10000000)) errors.push('Enter a fuel price greater than 0.');
    if (!(rate > 0 && rate <= 1000)) errors.push('Enter consumption between 0 and 1,000 litres per hour.');
    if (!(hours > 0 && hours <= 24)) errors.push('Hours per day must be between 0 and 24.');
    if (!(days > 0 && days <= 31)) errors.push('Days per month must be between 0 and 31.');
    if (errors.length) return { ok: false, errors: errors };
    var dailyLitres = rate * hours;
    var monthlyLitres = dailyLitres * days;
    var dailyCost = dailyLitres * price;
    var monthlyCost = monthlyLitres * price;
    return {
      ok: true,
      dailyLitres: dailyLitres,
      monthlyLitres: monthlyLitres,
      dailyCost: dailyCost,
      monthlyCost: monthlyCost,
      annualCost: monthlyCost * 12,
      formula: 'litres/hour x hours/day x days/month x price/litre'
    };
  }

  function rowUsability(row, fuel, nowValue, maxAgeDays) {
    var type = fuel === 'diesel' || fuel === 'lpg' ? fuel : 'petrol';
    var item = row && row[type];
    var local = finite(item && item.price);
    var usd = finite(item && item.usd);
    var age = ageDays(row && row.last_updated, nowValue);
    var limit = Number.isFinite(Number(maxAgeDays)) ? Number(maxAgeDays) : 45;
    var sourceUrl = row && (row.official_verified === true ? row.official_source_url : row.source_url) || '';
    var usable = Boolean(row && row.code && local > 0 && usd > 0 && sourceUrl && age <= limit);
    return {
      usable: usable,
      ageDays: age,
      reason: usable ? '' : !row ? 'Country row unavailable.' : !sourceUrl ? 'No row-level source link.' : age > limit ? 'Snapshot is older than ' + limit + ' days.' : 'Selected fuel price is unavailable.',
      localPrice: local,
      usdPrice: usd,
      unit: type === 'lpg' ? 'kg' : 'litre',
      sourceUrl: sourceUrl
    };
  }

  return {
    US_GALLON_LITRES: US_GALLON_LITRES,
    ageDays: ageDays,
    granularityLabel: granularityLabel,
    recordStatus: recordStatus,
    validateDataset: validateDataset,
    distanceKm: distanceKm,
    nearestMarket: nearestMarket,
    marketRecord: marketRecord,
    calculateFillCost: calculateFillCost,
    calculateGenerator: calculateGenerator,
    rowUsability: rowUsability
  };
}));
