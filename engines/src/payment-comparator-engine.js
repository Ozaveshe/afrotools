var PaymentComparatorEngine = function() {
  "use strict";
  function e(e) {
    return Number(e).toFixed(2);
  }
  function t(e) {
    return B2BPaymentsData.providers.map(function(t) {
      var a = B2BPaymentsData.calculateFee(t.id, e);
      return {
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        type: t.type,
        typeLabel: t.typeLabel,
        logo: t.logo,
        color: t.color,
        speed: t.speed,
        africaCoverage: t.africaCoverage,
        estimatedFee: a.estimatedFee,
        totalCost: a.totalCost,
        feePct: a.feePct,
        bestFor: t.bestFor
      };
    }).sort(function(e, t) {
      return e.estimatedFee - t.estimatedFee;
    });
  }
  function getSchedule(id) {
    const counts = { monthly: 12, four_per_month: 48, weekly_52: 52, operating_days_20: 240 };
    const key = id === "weekly" ? "four_per_month" : id === "daily" ? "operating_days_20" : id;
    return Object.prototype.hasOwnProperty.call(counts, key) ? { id: key, paymentsPerYear: counts[key] } : null;
  }
  return {
    compareAll: t,
    getCheapest: function(e, a) {
      return t(e).slice(0, a || 3);
    },
    getDetail: function(e) {
      return B2BPaymentsData.getById(e) || null;
    },
    filterByCoverage: function(e) {
      return B2BPaymentsData.providers.filter(function(t) {
        return t.africaCoverage && t.africaCoverage.toLowerCase().includes(e.toLowerCase());
      });
    },
    getSchedule: getSchedule,
    calculateScenario: function(amount, frequency, providerId) {
      const schedule = getSchedule(frequency);
      const provider = B2BPaymentsData.getById(providerId);
      if (!Number.isFinite(amount) || amount <= 0 || !schedule || !provider) return null;
      const fee = B2BPaymentsData.calculateFee(providerId, amount);
      const annualVolume = amount * schedule.paymentsPerYear;
      const annualFee = fee.estimatedFee * schedule.paymentsPerYear;
      return {
        providerId: providerId, providerName: provider.name, frequency: schedule.id,
        paymentsPerYear: schedule.paymentsPerYear, perTxnFee: fee.estimatedFee, perTxnPct: fee.feePct,
        monthlyVolume: annualVolume / 12, monthlyFee: annualFee / 12, annualVolume: annualVolume, annualFee: annualFee
      };
    },
    getObservations: function(t, a) {
      var r = [], n = a[0], o = a[a.length - 1], i = o.estimatedFee - n.estimatedFee;
      return r.push("💰 Cheapest option for $" + t.toLocaleString() + " is " + n.shortName + " at $" + e(n.estimatedFee) + " (" + n.feePct + "% fee)."),
      i > 50 && r.push("📊 You could save up to $" + e(i) + " per transaction by switching from " + o.shortName + " to " + n.shortName + "."),
      t > 1e4 && r.push("🏦 For amounts above $10,000, SWIFT wire transfer is universally accepted. For intra-Africa payments, PAPSS is significantly cheaper."),
      t < 5e3 && r.push("⚡ For smaller B2B payments, Chipper Cash Business offers near-zero fees within its 7-country network."),
      r.push("🌍 PAPSS (Pan-African Payment & Settlement System) avoids USD conversion entirely for Africa-to-Africa trade — major saving for AfCFTA corridor payments."),
      r;
    },
    getAllProviders: function() {
      return B2BPaymentsData.providers;
    }
  };
}();
