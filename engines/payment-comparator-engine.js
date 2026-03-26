var PaymentComparatorEngine = (function () {
  'use strict';

  function fmt2(n) { return Number(n).toFixed(2); }

  /* ── compare all providers for an amount ─────────────── */
  function compareAll(amount) {
    var results = B2BPaymentsData.providers.map(function (p) {
      var calc = B2BPaymentsData.calculateFee(p.id, amount);
      return {
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        type: p.type,
        typeLabel: p.typeLabel,
        logo: p.logo,
        color: p.color,
        speed: p.speed,
        africaCoverage: p.africaCoverage,
        estimatedFee: calc.estimatedFee,
        totalCost: calc.totalCost,
        feePct: calc.feePct,
        bestFor: p.bestFor
      };
    });
    return results.sort(function (a, b) { return a.estimatedFee - b.estimatedFee; });
  }

  /* ── get cheapest for amount ──────────────────────────── */
  function getCheapest(amount, n) {
    return compareAll(amount).slice(0, n || 3);
  }

  /* ── get provider detail ──────────────────────────────── */
  function getDetail(providerId) {
    var p = B2BPaymentsData.getById(providerId);
    if (!p) return null;
    return p;
  }

  /* ── filter by coverage ───────────────────────────────── */
  function filterByCoverage(countryCode) {
    return B2BPaymentsData.providers.filter(function (p) {
      return p.africaCoverage && p.africaCoverage.toLowerCase().includes(countryCode.toLowerCase());
    });
  }

  /* ── calculate scenario ───────────────────────────────── */
  function calculateScenario(amount, frequency, providerId) {
    var monthly = frequency === 'weekly' ? amount * 4 : frequency === 'daily' ? amount * 20 : amount;
    var annual  = monthly * 12;
    var p       = B2BPaymentsData.getById(providerId);
    if (!p) return null;
    var calc = B2BPaymentsData.calculateFee(providerId, amount);
    var monthlyFee = calc.estimatedFee * (frequency === 'weekly' ? 4 : frequency === 'daily' ? 20 : 1);
    var annualFee  = monthlyFee * 12;
    return {
      providerId: providerId,
      providerName: p.name,
      perTxnFee: calc.estimatedFee,
      perTxnPct: calc.feePct,
      monthlyVolume: monthly,
      monthlyFee: monthlyFee,
      annualVolume: annual,
      annualFee: annualFee
    };
  }

  /* ── observations ────────────────────────────────────── */
  function getObservations(amount, results) {
    var obs = [];
    var cheapest = results[0];
    var mostExpensive = results[results.length - 1];
    var saving = mostExpensive.estimatedFee - cheapest.estimatedFee;
    obs.push('💰 Cheapest option for $' + amount.toLocaleString() + ' is ' + cheapest.shortName + ' at $' + fmt2(cheapest.estimatedFee) + ' (' + cheapest.feePct + '% fee).');
    if (saving > 50) obs.push('📊 You could save up to $' + fmt2(saving) + ' per transaction by switching from ' + mostExpensive.shortName + ' to ' + cheapest.shortName + '.');
    if (amount > 10000) obs.push('🏦 For amounts above $10,000, SWIFT wire transfer is universally accepted. For intra-Africa payments, PAPSS is significantly cheaper.');
    if (amount < 5000) obs.push('⚡ For smaller B2B payments, Chipper Cash Business offers near-zero fees within its 7-country network.');
    obs.push('🌍 PAPSS (Pan-African Payment & Settlement System) avoids USD conversion entirely for Africa-to-Africa trade — major saving for AfCFTA corridor payments.');
    return obs;
  }

  return {
    compareAll: compareAll,
    getCheapest: getCheapest,
    getDetail: getDetail,
    filterByCoverage: filterByCoverage,
    calculateScenario: calculateScenario,
    getObservations: getObservations,
    getAllProviders: function () { return B2BPaymentsData.providers; }
  };
})();
