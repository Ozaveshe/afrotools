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
    calculateScenario: function(e, t, a) {
      var r = "weekly" === t ? 4 * e : "daily" === t ? 20 * e : e, n = 12 * r, o = B2BPaymentsData.getById(a);
      if (!o) {
        return null;
      }
      var i = B2BPaymentsData.calculateFee(a, e), s = i.estimatedFee * ("weekly" === t ? 4 : "daily" === t ? 20 : 1), c = 12 * s;
      return {
        providerId: a,
        providerName: o.name,
        perTxnFee: i.estimatedFee,
        perTxnPct: i.feePct,
        monthlyVolume: r,
        monthlyFee: s,
        annualVolume: n,
        annualFee: c
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
