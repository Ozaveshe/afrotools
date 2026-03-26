/* AfroTools — FX Import Impact Engine /engines/fx-impact-engine.js */
var FxImpactEngine = (function() {
  'use strict';

  function getCurrentRate(countryCode) {
    var data = FX_HISTORY[countryCode];
    if (!data) return null;
    var months = Object.keys(data.monthlyAverages).sort();
    return data.monthlyAverages[months[months.length - 1]];
  }

  function getHistoricalSeries(countryCode) {
    var data = FX_HISTORY[countryCode];
    if (!data) return [];
    return Object.keys(data.monthlyAverages).sort().map(function(m) {
      return { month: m, rate: data.monthlyAverages[m] };
    });
  }

  function calculateImpact(usdAmount, countryCode, fxRate) {
    var data = FX_HISTORY[countryCode];
    if (!data) return null;
    var rate = fxRate || getCurrentRate(countryCode);
    var localCost = usdAmount * rate;
    return { usdAmount: usdAmount, rate: rate, localCost: localCost, currency: data.currency, symbol: data.symbol || '', flag: data.flag };
  }

  function modelScenarios(usdAmount, countryCode, currentRate) {
    var changes = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
    return changes.map(function(pct) {
      var rate = currentRate * (1 + pct / 100);
      var localCost = usdAmount * rate;
      var delta = localCost - (usdAmount * currentRate);
      return { changePercent: pct, rate: parseFloat(rate.toFixed(2)), localCost: localCost, delta: delta, deltaPercent: pct };
    });
  }

  function calcBreakeven(localSellingPrice, usdCost, otherLocalCosts) {
    var other = parseFloat(otherLocalCosts) || 0;
    var usd = parseFloat(usdCost) || 0;
    if (usd <= 0) return null;
    var maxLocalForImport = parseFloat(localSellingPrice) - other;
    var breakevenRate = maxLocalForImport / usd;
    return { breakevenRate: parseFloat(breakevenRate.toFixed(2)), maxLocalCost: maxLocalForImport, usdCost: usd };
  }

  function getHistoricalCostSeries(usdAmount, countryCode) {
    return getHistoricalSeries(countryCode).map(function(s) {
      return { month: s.month, rate: s.rate, localCost: usdAmount * s.rate };
    });
  }

  function getObservations(countryCode, usdAmount, currentRate) {
    var data = FX_HISTORY[countryCode];
    if (!data) return [];
    var obs = [];
    var series = getHistoricalSeries(countryCode);
    if (series.length >= 2) {
      var oldest = series[0].rate;
      var newest = series[series.length - 1].rate;
      var change = ((newest - oldest) / oldest * 100).toFixed(1);
      var direction = change > 0 ? 'depreciated' : 'appreciated';
      var absChange = Math.abs(change);
      obs.push({ type: change > 0 ? 'warn' : 'info', text: data.flag + ' ' + data.currency + ' has ' + direction + ' ' + absChange + '% against USD over the past year. Import costs have ' + (change > 0 ? 'risen' : 'fallen') + ' accordingly.' });
    }
    if (data.parallelPremium) {
      var parallelRate = currentRate * (1 + data.parallelPremium / 100);
      var parallelCost = usdAmount * parallelRate;
      obs.push({ type:'warn', text:'Parallel market rate is ~' + data.parallelPremium + '% higher than official rate. If paying at parallel rate, your cost would be ' + data.symbol + ' ' + Math.round(parallelCost).toLocaleString() + ' vs official ' + data.symbol + ' ' + Math.round(usdAmount * currentRate).toLocaleString() + '.' });
    }
    if (data.notes) obs.push({ type:'info', text: data.notes });
    return obs;
  }

  function getAllCountries() {
    return Object.keys(FX_HISTORY).map(function(k) {
      return { code: k, name: FX_HISTORY[k].name, flag: FX_HISTORY[k].flag, currency: FX_HISTORY[k].currency };
    });
  }

  return { getCurrentRate: getCurrentRate, getHistoricalSeries: getHistoricalSeries, calculateImpact: calculateImpact, modelScenarios: modelScenarios, calcBreakeven: calcBreakeven, getHistoricalCostSeries: getHistoricalCostSeries, getObservations: getObservations, getAllCountries: getAllCountries };
})();
