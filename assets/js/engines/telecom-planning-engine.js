(function initTelecomPlanningEngine(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.telecomPlanning = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createTelecomPlanningEngine() {
  'use strict';

  var CADENCE_DAYS = 30;
  var SMS_TIERS = Object.freeze([
    { min: 0, discount: 0 },
    { min: 10000, discount: 0.05 },
    { min: 50000, discount: 0.10 },
    { min: 100000, discount: 0.15 },
    { min: 500000, discount: 0.25 }
  ]);
  var USAGE_MULTIPLIER = Object.freeze({ basic: 0.5, moderate: 1, heavy: 2 });
  var BW_PER_EMPLOYEE = Object.freeze({ basic: 1, moderate: 3, heavy: 8 });
  var QUALITY_MULTIPLIERS = Object.freeze({ low: 0.4, medium: 1, high: 2.5, hd: 5 });
  var DATA_ACTIVITIES = Object.freeze([
    { id: 'browsing', mbPerUnit: 60, monthly: false },
    { id: 'social', mbPerUnit: 150, monthly: false },
    { id: 'youtube', mbPerUnit: 500, monthly: false, quality: true },
    { id: 'music', mbPerUnit: 72, monthly: false },
    { id: 'videocall', mbPerUnit: 800, monthly: false },
    { id: 'email', mbPerUnit: 0.5, monthly: false },
    { id: 'downloads', mbPerUnit: 1024, monthly: true }
  ]);
  var TECH_SPECS = Object.freeze({
    Fiber: { avgSpeed: 100, maxSpeed: 1000, latency: '5–15 ms', reliability: 95, coverage: 'urban_snapshot' },
    LTE: { avgSpeed: 25, maxSpeed: 150, latency: '30–50 ms', reliability: 80, coverage: 'urban_suburban_snapshot' },
    '5G': { avgSpeed: 200, maxSpeed: 2000, latency: '5–10 ms', reliability: 85, coverage: 'major_cities_snapshot' }
  });

  function finite(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function positive(value) {
    var number = finite(value);
    return number !== null && number > 0 ? number : null;
  }

  function nonNegative(value) {
    var number = finite(value);
    return number !== null && number >= 0 ? number : null;
  }

  function parseDate(value) {
    var match = String(value || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return null;
    var date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3] || 1)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function snapshotState(data, now) {
    var reviewed = parseDate(data && data.lastUpdated);
    var current = now instanceof Date ? now : new Date(now || Date.now());
    var ageDays = reviewed ? Math.floor((current.getTime() - reviewed.getTime()) / 86400000) : null;
    if (ageDays !== null && ageDays < 0) ageDays = null;
    return {
      reviewedAt: reviewed ? String(data.lastUpdated) : null,
      ageDays: ageDays,
      cadenceDays: CADENCE_DAYS,
      freshness: ageDays !== null && ageDays <= CADENCE_DAYS ? 'reviewed' : 'stale',
      confidence: ageDays !== null && ageDays <= CADENCE_DAYS ? 'estimated' : 'low_confidence'
    };
  }

  function context(data, code) {
    var country = data && data.countries && data.countries[code];
    if (!country) return { ok: false, error: 'country_unavailable' };
    return {
      ok: true,
      country: country,
      countryCode: code,
      currency: country.currency || '',
      symbol: country.symbol || country.currency || '',
      source: snapshotState(data)
    };
  }

  function validityDays(value) {
    var text = String(value || '').toLowerCase();
    if (text.indexOf('1 day') >= 0 || text.indexOf('24') >= 0 || text === 'daily') return 1;
    if (text.indexOf('2 day') >= 0) return 2;
    if (text.indexOf('7') >= 0 || text.indexOf('week') >= 0) return 7;
    if (text.indexOf('30') >= 0 || text.indexOf('month') >= 0) return 30;
    return 0;
  }

  function dataPlans(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var operator = input.operator || 'all';
    var validity = input.validity || 'all';
    var plans = [];
    (state.country.operators || []).forEach(function (item) {
      if (operator !== 'all' && operator !== item.name) return;
      (item.dataBundles || []).forEach(function (bundle) {
        if (['all', '1', '7', '30'].indexOf(validity) < 0) return;
        var volumeMB = nonNegative(bundle.volumeMB) || 0;
        var price = nonNegative(bundle.price) || 0;
        var days = validityDays(bundle.validity);
        if (validity === '1' && days > 2) return;
        if (validity === '7' && (days < 3 || days > 14)) return;
        if (validity === '30' && days < 15) return;
        var volumeGB = volumeMB / 1024;
        plans.push({
          operator: item.name,
          name: bundle.name || '',
          volume: bundle.volume || '',
          volumeMB: volumeMB,
          volumeGB: volumeGB,
          validity: bundle.validity || '',
          price: price,
          pricePerGB: volumeGB > 0 ? price / volumeGB : 0,
          ussdCode: bundle.code || ''
        });
      });
    });
    var sort = input.sort || 'pricePerGB';
    plans.sort(function (a, b) {
      var left = a[sort];
      var right = b[sort];
      if (typeof left === 'string') return left.localeCompare(right);
      return left - right;
    });
    state.plans = plans;
    state.best = plans.filter(function (row) { return row.pricePerGB > 0; })
      .sort(function (a, b) { return a.pricePerGB - b.pricePerGB; })[0] || null;
    return state;
  }

  function ussdDirectory(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var category = input.category || 'all';
    var query = String(input.query || '').toLowerCase().trim();
    var codes = [];
    Object.keys(state.country.ussdCodes || {}).forEach(function (key) {
      if (category !== 'all' && category !== key) return;
      var values = state.country.ussdCodes[key] || {};
      Object.keys(values).forEach(function (operator) {
        var code = String(values[operator] || '');
        if (query && (operator + ' ' + code + ' ' + key).toLowerCase().indexOf(query) < 0) return;
        codes.push({ category: key, operator: operator, code: code });
      });
    });
    state.codes = codes;
    state.availableCategories = Object.keys(state.country.ussdCodes || {});
    return state;
  }

  function roaming(data, input) {
    var homeCode = input && (input.home || input.country);
    var homeState = context(data, homeCode);
    var destinationState = context(data, input && input.destination);
    if (!homeState.ok || !destinationState.ok) return { ok: false, error: 'country_unavailable' };
    if (homeCode === input.destination) {
      return Object.assign({}, homeState, { sameCountry: true, roamingTotal: 0 });
    }
    if (!homeState.country.roaming) return { ok: false, error: 'roaming_data_unavailable', source: homeState.source };
    var days = positive(input.days);
    var minutes = nonNegative(input.minutesPerDay === undefined ? input.minutes : input.minutesPerDay);
    var sms = nonNegative(input.smsPerDay === undefined ? input.sms : input.smsPerDay);
    var dataMB = nonNegative(input.dataMBPerDay === undefined ? input.dataMB : input.dataMBPerDay);
    if (days === null || minutes === null || sms === null || dataMB === null) {
      return { ok: false, error: 'invalid_usage' };
    }
    var rates = homeState.country.roaming;
    var totalMinutes = minutes * days;
    var totalSms = sms * days;
    var totalDataMB = dataMB * days;
    var voiceCost = totalMinutes * (nonNegative(rates.avgVoicePerMin) || 0);
    var smsCost = totalSms * (nonNegative(rates.avgSMSRate) || 0);
    var dataCost = totalDataMB * (nonNegative(rates.avgDataPerMB) || 0);
    var roamingTotal = voiceCost + smsCost + dataCost;
    var destination = destinationState.country;
    var localSimCost = destination.avgDataCostPerGB ? destination.avgDataCostPerGB * 0.5 : 0;
    var bestBundle = null;
    (destination.operators || []).forEach(function (operator) {
      (operator.dataBundles || []).forEach(function (bundle) {
        if ((bundle.volumeMB || 0) >= totalDataMB && (!bestBundle || bundle.price < bestBundle.price)) {
          bestBundle = {
            operator: operator.name,
            name: bundle.name,
            volume: bundle.volume,
            volumeMB: bundle.volumeMB,
            price: bundle.price
          };
        }
      });
    });
    var localDataCost = bestBundle
      ? bestBundle.price
      : (destination.avgDataCostPerGB || 1) * (totalDataMB / 1024);
    var exchangeRate = positive(input.exchangeRate);
    var localTotalHome = exchangeRate === null ? null : (localDataCost + localSimCost) * exchangeRate;
    return Object.assign({}, homeState, {
      destination: destination,
      destinationCode: input.destination,
      destinationCurrency: destination.currency || '',
      destinationSymbol: destination.symbol || destination.currency || '',
      days: days,
      totalMinutes: totalMinutes,
      totalSms: totalSms,
      totalDataMB: totalDataMB,
      voiceCost: voiceCost,
      smsCost: smsCost,
      dataCost: dataCost,
      roamingTotal: roamingTotal,
      localSimCost: localSimCost,
      localDataCost: localDataCost,
      localTotalDestination: localDataCost + localSimCost,
      localTotalHome: localTotalHome,
      exchangeRateState: exchangeRate === null ? 'user_rate_missing' : 'user_entered',
      bestBundle: bestBundle,
      difference: localTotalHome === null ? null : roamingTotal - localTotalHome
    });
  }

  function airtime(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var amount = positive(input.amount);
    var lowRate = nonNegative(input.lowRate);
    var highRate = nonNegative(input.highRate);
    if (amount === null || lowRate === null || highRate === null || lowRate > highRate || highRate > 1) {
      return { ok: false, error: 'invalid_assumption' };
    }
    if (!(state.country.operators || []).some(function (item) { return item.name === input.operator; })) {
      return { ok: false, error: 'operator_unavailable' };
    }
    state.operator = input.operator;
    state.amount = amount;
    state.lowRate = lowRate;
    state.highRate = highRate;
    state.lowValue = Math.round(amount * lowRate);
    state.highValue = Math.round(amount * highRate);
    state.midValue = Math.round(amount * ((lowRate + highRate) / 2));
    return state;
  }

  function portability(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var record = state.country.numberPortability;
    if (!record) return { ok: false, error: 'portability_data_unavailable', source: state.source };
    state.record = {
      snapshotAvailability: record.available === true,
      regulatorLabel: record.regulator || state.country.regulator || '',
      fee: record.fee === undefined ? null : record.fee,
      processSnapshot: record.process || '',
      notesSnapshot: record.notes || ''
    };
    state.regulatorVerificationRequired = true;
    return state;
  }

  function simRegistration(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var record = state.country.simRegistration;
    if (!record) return { ok: false, error: 'sim_data_unavailable', source: state.source };
    state.record = {
      snapshotMandatory: record.mandatory !== false,
      methodSnapshot: record.method || '',
      deadlineSnapshot: record.deadline || '',
      checkCodeSnapshot: record.checkCode || '',
      penaltySnapshot: record.penalty || '',
      regulatorLabel: state.country.regulator || ''
    };
    state.regulatorVerificationRequired = true;
    return state;
  }

  function parseSpeed(value) {
    var match = String(value || '').match(/([\d.]+)/);
    return match ? Number(match[1]) : 0;
  }

  function internet(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var tiers = [];
    (state.country.isp || []).forEach(function (isp) {
      (isp.speeds || []).forEach(function (speed, index) {
        var speedMbps = parseSpeed(speed);
        var price = nonNegative((isp.prices || [])[index]) || 0;
        tiers.push({
          provider: isp.name || '',
          type: isp.type || '',
          speed: speed,
          speedMbps: speedMbps,
          price: price,
          costPerMbps: speedMbps > 0 ? price / speedMbps : 0,
          sourceKind: 'archived_isp_snapshot'
        });
      });
    });
    var starlink = state.country.starlinkPrice;
    if (starlink && starlink.monthly) {
      var maxSpeed = parseSpeed(String(starlink.speed || '').split('-')[1] || starlink.speed);
      tiers.push({
        provider: 'Starlink',
        type: 'Satellite',
        speed: starlink.speed || '',
        speedMbps: maxSpeed,
        price: starlink.monthly,
        costPerMbps: maxSpeed > 0 ? starlink.monthly / maxSpeed : 0,
        sourceKind: 'archived_vendor_snapshot'
      });
    }
    var sort = input.sort || 'cost';
    tiers.sort(function (a, b) {
      if (sort === 'speed') return b.speedMbps - a.speedMbps;
      if (sort === 'price') return a.price - b.price;
      return a.costPerMbps - b.costPerMbps;
    });
    state.tiers = tiers;
    return state;
  }

  function technology(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var providers = { Fiber: [], LTE: [], '5G': [] };
    (state.country.isp || []).forEach(function (isp) {
      var type = String(isp.type || '').toLowerCase();
      if (type.indexOf('fiber') >= 0) providers.Fiber.push(isp);
      if (type.indexOf('lte') >= 0) providers.LTE.push(isp);
      if (type.indexOf('5g') >= 0) providers['5G'].push(isp);
    });
    var scores = { Fiber: 0, LTE: 0, '5G': 0 };
    if (input.priority === 'speed') { scores['5G'] += 3; scores.Fiber += 2; }
    if (input.priority === 'cost') { scores.LTE += 3; scores.Fiber += 1; }
    if (input.priority === 'reliability') { scores.Fiber += 3; scores['5G'] += 1; scores.LTE += 1; }
    if (input.usage === 'streaming') { scores.Fiber += 2; scores['5G'] += 2; }
    if (input.usage === 'work') { scores.Fiber += 3; scores['5G'] += 1; }
    if (input.usage === 'basic') scores.LTE += 3;
    if (input.location === 'urban') { scores.Fiber += 2; scores['5G'] += 2; }
    if (input.location === 'suburban') { scores.LTE += 2; scores.Fiber += 1; }
    if (input.location === 'rural') scores.LTE += 3;
    var recommendation = ['Fiber', 'LTE', '5G'].reduce(function (best, key) {
      return scores[key] > scores[best] ? key : best;
    }, 'LTE');
    state.providers = providers;
    state.specs = TECH_SPECS;
    state.scores = scores;
    state.recommendation = recommendation;
    state.coverageVerificationRequired = true;
    return state;
  }

  function businessInternet(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var employees = positive(input.employees);
    var minimumSpeed = positive(input.minimumSpeed);
    var usage = USAGE_MULTIPLIER[input.usage] ? input.usage : 'moderate';
    if (employees === null || minimumSpeed === null) return { ok: false, error: 'invalid_business_usage' };
    var recommendedBandwidth = Math.max(minimumSpeed, employees * BW_PER_EMPLOYEE[usage]);
    var monthlyDataGB = employees * 30 * USAGE_MULTIPLIER[usage] * 2;
    var options = [];
    (state.country.isp || []).forEach(function (isp, index) {
      var speeds = isp.speeds || [];
      var prices = isp.prices || [];
      var chosen = Math.max(0, speeds.length - 1);
      for (var position = 0; position < speeds.length; position += 1) {
        if (parseSpeed(speeds[position]) >= recommendedBandwidth) { chosen = position; break; }
      }
      options.push({
        name: isp.name || 'ISP ' + (index + 1),
        type: isp.type || 'Fiber',
        speed: parseSpeed(isp.speed || speeds[chosen]) || minimumSpeed,
        monthly: isp.monthly || prices[chosen] || prices[0] || 0,
        setup: isp.setup || 0,
        dataCap: isp.dataCap || 'Unlimited'
      });
    });
    (state.country.operators || []).slice(0, 2).forEach(function (operator) {
      var bundles = operator.dataBundles || [];
      if (!bundles.length) return;
      var bundle = bundles.reduce(function (largest, candidate) {
        return Number(candidate.volumeMB || 0) > Number(largest.volumeMB || 0) ? candidate : largest;
      }, bundles[0]);
      var units = bundle.volumeMB > 0 ? Math.ceil((monthlyDataGB * 1024) / bundle.volumeMB) : 1;
      options.push({
        name: operator.name + ' Mobile Data',
        type: 'Mobile Data',
        speed: 20,
        monthly: (bundle.price || 0) * units,
        setup: 0,
        dataCap: ((bundle.volumeMB || 0) * units / 1024).toFixed(0) + ' GB'
      });
    });
    options.sort(function (a, b) { return a.monthly - b.monthly; });
    state.employees = employees;
    state.usage = usage;
    state.recommendedBandwidth = recommendedBandwidth;
    state.monthlyDataGB = monthlyDataGB;
    state.options = options;
    return state;
  }

  function tierForVolume(volume) {
    var selected = SMS_TIERS[0];
    SMS_TIERS.forEach(function (tier) { if (volume >= tier.min) selected = tier; });
    return selected;
  }

  function bulkSms(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var volume = positive(input.volume);
    if (volume === null) return { ok: false, error: 'invalid_volume' };
    var smsData = state.country.bulkSMS || {};
    var baseRate = nonNegative(smsData.costPerSMS || smsData.domesticRate || smsData.avgCostPerSMS) || 0;
    if (!baseRate) return { ok: false, error: 'sms_pricing_unavailable', source: state.source };
    if (input.kind === 'international') baseRate *= 1.5;
    var tier = tierForVolume(volume);
    state.volume = volume;
    state.kind = input.kind || 'domestic';
    state.baseRate = baseRate;
    state.discount = tier.discount;
    state.effectiveRate = baseRate * (1 - tier.discount);
    state.totalCost = state.effectiveRate * volume;
    state.savings = baseRate * volume * tier.discount;
    state.tiers = SMS_TIERS;
    return state;
  }

  function whatsappVsSms(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var volume = positive(input.volume);
    var marketing = nonNegative(input.marketing);
    var utility = nonNegative(input.utility);
    var service = nonNegative(input.service);
    if (volume === null || marketing === null || utility === null || service === null) {
      return { ok: false, error: 'invalid_message_mix' };
    }
    if (Math.abs(marketing + utility + service - 100) > 0.001) {
      return { ok: false, error: 'message_mix_not_100' };
    }
    var whatsapp = state.country.whatsappBusiness || {};
    var card = whatsapp.perMessage || whatsapp.perConversation || {};
    function firstDefinedRate(values) {
      for (var index = 0; index < values.length; index += 1) {
        if (values[index] !== undefined && values[index] !== null && finite(values[index]) !== null) {
          return nonNegative(values[index]);
        }
      }
      return null;
    }
    var rates = {
      marketing: firstDefinedRate([whatsapp.marketingRate, whatsapp.rate, card.marketing]),
      utility: firstDefinedRate([whatsapp.utilityRate, card.utility]),
      service: firstDefinedRate([whatsapp.serviceRate, card.service])
    };
    var smsData = state.country.bulkSMS || {};
    var smsRate = smsData.costPerSMS || smsData.domesticRate || smsData.avgCostPerSMS || 0;
    var counts = {
      marketing: Math.round(volume * marketing / 100),
      utility: Math.round(volume * utility / 100)
    };
    counts.service = volume - counts.marketing - counts.utility;
    if (!smsRate || (counts.marketing > 0 && rates.marketing === null)
      || (counts.utility > 0 && rates.utility === null) || (counts.service > 0 && rates.service === null)) {
      return { ok: false, error: 'comparison_data_unavailable', source: state.source };
    }
    var costs = {
      marketing: counts.marketing * rates.marketing,
      utility: counts.utility * rates.utility,
      service: counts.service * rates.service
    };
    var whatsappTotal = costs.marketing + costs.utility + costs.service;
    var smsTier = tierForVolume(volume);
    var effectiveSmsRate = smsRate * (1 - smsTier.discount);
    state.volume = volume;
    state.counts = counts;
    state.whatsappRates = rates;
    state.whatsappCosts = costs;
    state.whatsappTotal = whatsappTotal;
    state.whatsappAverage = whatsappTotal / volume;
    state.smsBaseRate = smsRate;
    state.smsDiscount = smsTier.discount;
    state.smsEffectiveRate = effectiveSmsRate;
    state.smsTotal = effectiveSmsRate * volume;
    state.cheaper = whatsappTotal <= state.smsTotal ? 'whatsapp' : 'sms';
    return state;
  }

  function tv(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var packages = [];
    (state.country.tvProviders || []).forEach(function (provider) {
      (provider.packages || []).forEach(function (item) {
        var channels = nonNegative(item.channels) || 0;
        var price = nonNegative(item.price) || 0;
        packages.push({
          provider: provider.name || '',
          name: item.name || '',
          price: price,
          channels: channels,
          pricePerChannel: channels > 0 ? price / channels : 0,
          notes: item.notes || '',
          streaming: channels === 0
        });
      });
    });
    var maxPrice = nonNegative(input.maxPrice);
    if (maxPrice !== null) {
      packages = packages.filter(function (item) { return item.price <= maxPrice; });
    }
    var sort = input.sort || 'price-desc';
    packages.sort(function (a, b) {
      if (sort === 'channels-desc') return b.channels - a.channels;
      if (sort === 'value') {
        return (a.pricePerChannel || Number.MAX_VALUE) - (b.pricePerChannel || Number.MAX_VALUE);
      }
      if (sort === 'price-desc') return b.price - a.price;
      return a.price - b.price;
    });
    state.packages = packages;
    state.bestValue = packages.filter(function (item) { return item.pricePerChannel > 0; })
      .sort(function (a, b) { return a.pricePerChannel - b.pricePerChannel; })[0] || null;
    return state;
  }

  function starlink(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var snapshot = state.country.starlinkPrice || {};
    var local = (state.country.isp || []).map(function (isp) {
      var monthly = isp.monthly || (isp.prices && isp.prices[0]) || 0;
      var setup = isp.setup || 0;
      return {
        name: isp.name || 'ISP',
        type: isp.type || '',
        speed: isp.speed || (isp.speeds && isp.speeds[0]) || '',
        monthly: monthly,
        setup: setup,
        yearOne: setup + monthly * 12,
        yearThree: setup + monthly * 36
      };
    });
    state.snapshotAvailabilityFlag = state.country.starlinkAvailable === true;
    state.availabilityStatus = state.source.freshness === 'stale' ? 'stale_snapshot' : 'review_required';
    state.starlink = snapshot.monthly ? {
      monthly: snapshot.monthly,
      hardware: snapshot.hardware || 0,
      speed: snapshot.speed || '',
      yearOne: (snapshot.hardware || 0) + snapshot.monthly * 12,
      yearThree: (snapshot.hardware || 0) + snapshot.monthly * 36
    } : null;
    state.local = local;
    return state;
  }

  function dataUsage(data, input) {
    var state = context(data, input && input.country);
    if (!state.ok) return state;
    var breakdown = [];
    var totalMB = 0;
    var invalid = DATA_ACTIVITIES.some(function (activity) {
      return nonNegative(input[activity.id]) === null;
    });
    if (invalid || !QUALITY_MULTIPLIERS[input.youtubeQuality]) {
      return { ok: false, error: 'invalid_usage', source: state.source };
    }
    DATA_ACTIVITIES.forEach(function (activity) {
      var amount = nonNegative(input[activity.id]);
      var mb = amount * activity.mbPerUnit * (activity.monthly ? 1 : 30);
      if (activity.quality) mb *= QUALITY_MULTIPLIERS[input.youtubeQuality] || 1;
      breakdown.push({ id: activity.id, mb: mb });
      totalMB += mb;
    });
    var neededMB = totalMB * 1.1;
    var plans = [];
    (state.country.operators || []).forEach(function (operator) {
      (operator.dataBundles || []).forEach(function (bundle) {
        var validity = String(bundle.validity || '').toLowerCase();
        if (validity.indexOf('30') < 0 && validity.indexOf('month') < 0) return;
        if ((bundle.volumeMB || 0) < neededMB * 0.8) return;
        plans.push({
          operator: operator.name,
          name: bundle.name,
          volume: bundle.volume,
          volumeMB: bundle.volumeMB,
          price: bundle.price,
          pricePerGB: bundle.volumeMB > 0 ? bundle.price / (bundle.volumeMB / 1024) : 0,
          fits: bundle.volumeMB >= neededMB
        });
      });
    });
    plans.sort(function (a, b) { return a.price - b.price; });
    state.breakdown = breakdown;
    state.totalMB = totalMB;
    state.totalGB = totalMB / 1024;
    state.bufferedNeedMB = neededMB;
    state.recommendedPlans = plans.slice(0, 3);
    return state;
  }

  return Object.freeze({
    version: '2026-07-29',
    cadenceDays: CADENCE_DAYS,
    smsTiers: SMS_TIERS,
    dataActivities: DATA_ACTIVITIES,
    techSpecs: TECH_SPECS,
    snapshotState: snapshotState,
    validityDays: validityDays,
    dataPlans: dataPlans,
    ussdDirectory: ussdDirectory,
    roaming: roaming,
    airtime: airtime,
    portability: portability,
    simRegistration: simRegistration,
    internet: internet,
    technology: technology,
    businessInternet: businessInternet,
    bulkSms: bulkSms,
    whatsappVsSms: whatsappVsSms,
    tv: tv,
    starlink: starlink,
    dataUsage: dataUsage
  });
});
