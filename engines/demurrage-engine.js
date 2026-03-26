/* AfroTools — Demurrage Engine /engines/demurrage-engine.js */
var DemurrageEngine = (function() {
  'use strict';

  function calculateDemurrage(portCode, containerType, daysAtPort, fxRate) {
    var port = PORT_DEMURRAGE.ports[portCode];
    if (!port) return null;

    var freeDays = (port.freeDays && port.freeDays[containerType]) || 5;
    var paidDays = Math.max(0, daysAtPort - freeDays);
    var demurrageUSD = 0;
    var breakdown = [];

    if (paidDays > 0 && port.demurrageRates && port.demurrageRates[containerType]) {
      var tiers = port.demurrageRates[containerType];
      var remaining = paidDays;
      var daysCounted = 0;

      for (var i = 0; i < tiers.length; i++) {
        var tier = tiers[i];
        var tierStart = tier.daysFrom - freeDays;
        var tierEnd = tier.daysTo === 999 ? paidDays : (tier.daysTo - freeDays);
        var daysInTier = Math.min(remaining, tierEnd - Math.max(0, tierStart) + 1);
        if (daysInTier <= 0) continue;
        daysInTier = Math.max(0, daysInTier);

        var tierCost = daysInTier * tier.ratePerDay;
        demurrageUSD += tierCost;
        breakdown.push({
          tier: 'Days ' + tier.daysFrom + (tier.daysTo === 999 ? '+' : '–' + tier.daysTo),
          daysInTier: daysInTier,
          ratePerDay: tier.ratePerDay,
          currency: port.currency,
          cost: tierCost
        });
        remaining -= daysInTier;
        daysCounted += daysInTier;
        if (remaining <= 0) break;
      }
    }

    // Storage charges
    var storagePerDay = 0;
    if (port.storageRates && port.storageRates[containerType]) {
      storagePerDay = port.storageRates[containerType].perDay || 0;
    }
    var storageCharges = paidDays > 0 ? paidDays * storagePerDay : 0;

    // Additional charges
    var additionalTotal = 0;
    var additionalBreakdown = [];
    if (port.additionalCharges) {
      port.additionalCharges.forEach(function(charge) {
        var amountUSD = charge.currency === 'USD' ? charge.amount : (charge.amount / (fxRate || 1));
        additionalTotal += amountUSD;
        additionalBreakdown.push({ name: charge.name, amount: charge.amount, currency: charge.currency, amountUSD: amountUSD, description: charge.description });
      });
    }

    // Convert demurrage to USD if port uses local currency
    var demurrageInUSD = demurrageUSD;
    if (port.currency !== 'USD' && fxRate) {
      demurrageInUSD = demurrageUSD / fxRate;
    }
    var storageInUSD = (port.currency !== 'USD' && fxRate) ? storageCharges / fxRate : storageCharges;

    var totalUSD = demurrageInUSD + storageInUSD + additionalTotal;

    return {
      portCode: portCode, portName: port.name, country: port.country,
      containerType: containerType, daysAtPort: daysAtPort, freeDays: freeDays, paidDays: paidDays,
      demurrageRaw: demurrageUSD, currency: port.currency,
      demurrageUSD: Math.round(demurrageInUSD),
      storageChargesUSD: Math.round(storageInUSD),
      additionalChargesUSD: Math.round(additionalTotal),
      totalUSD: Math.round(totalUSD),
      breakdown: breakdown, additionalBreakdown: additionalBreakdown,
      avgClearingDays: port.avgClearingDays,
      notes: port.notes, tip: port.tip,
      warningLevel: totalUSD > 5000 ? 'high' : totalUSD > 2000 ? 'medium' : 'low'
    };
  }

  function getDailyAccrual(portCode, containerType) {
    var port = PORT_DEMURRAGE.ports[portCode];
    if (!port || !port.demurrageRates || !port.demurrageRates[containerType]) return null;
    var tiers = port.demurrageRates[containerType];
    return tiers.map(function(t) {
      return { label: 'Days ' + t.daysFrom + (t.daysTo === 999 ? '+' : '–' + t.daysTo), ratePerDay: t.ratePerDay, currency: port.currency };
    });
  }

  function projectCosts(portCode, containerType, maxDays, fxRate) {
    var results = [];
    for (var d = 1; d <= maxDays; d++) {
      var r = calculateDemurrage(portCode, containerType, d, fxRate);
      if (r) results.push({ day: d, totalUSD: r.totalUSD, demurrageUSD: r.demurrageUSD });
    }
    return results;
  }

  function getObservations(result) {
    var obs = [];
    if (!result) return obs;
    if (result.paidDays <= 0) {
      obs.push({ type: 'info', text: 'Container is still within free days (' + result.freeDays + ' days). No demurrage accruing yet.' });
    } else {
      obs.push({ type: result.warningLevel === 'high' ? 'warn' : 'info', text: 'Total accrued demurrage: $' + result.totalUSD.toLocaleString() + ' for ' + result.paidDays + ' paid days at ' + result.portName + '.' });
    }
    if (result.avgClearingDays) {
      var expectedTotal = calculateDemurrage(result.portCode, result.containerType, result.avgClearingDays, 1600);
      if (expectedTotal) obs.push({ type: 'tip', text: 'Average clearing time at ' + result.portName + ' is ~' + result.avgClearingDays + ' days. If typical, expect ~$' + expectedTotal.demurrageUSD.toLocaleString() + ' in demurrage.' });
    }
    obs.push({ type: 'tip', text: 'Request 30 free days from the shipping line when booking. Most lines offer 7–21 extra free days if requested in advance — this can save thousands in demurrage.' });
    return obs;
  }

  function getAllPorts() {
    return Object.keys(PORT_DEMURRAGE.ports).map(function(code) {
      var p = PORT_DEMURRAGE.ports[code];
      return { code: code, name: p.name, city: p.city, country: p.country, flag: p.flag, avgClearingDays: p.avgClearingDays };
    });
  }

  return { calculateDemurrage: calculateDemurrage, getDailyAccrual: getDailyAccrual, projectCosts: projectCosts, getObservations: getObservations, getAllPorts: getAllPorts };
})();

if (typeof module !== 'undefined') module.exports = { DemurrageEngine: DemurrageEngine };
