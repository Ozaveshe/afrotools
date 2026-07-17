!function(t) {
  "use strict";
  var a = {
    tier1Employee: .055,
    tier1Employer: .08,
    nhia: .025,
    tier2: .05,
    maxTier3: .165
  }, n = {
    minQualifyMonths: 180,
    normalRetire: 60,
    earlyRetire: 55,
    earlyReductionPerYr: 4,
    baseAccrual: 37.5,
    extraPerYear: 1.125,
    maxAccrual: 60,
    minPension: 300,
    latePaymentPenalty: .035
  }, r = [ {
    from: 0,
    to: 490,
    rate: 0
  }, {
    from: 490,
    to: 600,
    rate: .05
  }, {
    from: 600,
    to: 730,
    rate: .1
  }, {
    from: 730,
    to: 3730,
    rate: .175
  }, {
    from: 3730,
    to: 2e4,
    rate: .25
  }, {
    from: 2e4,
    to: 5e4,
    rate: .3
  }, {
    from: 5e4,
    to: 1 / 0,
    rate: .35
  } ];
  function e(t) {
    for (var a = 0, n = 0; n < r.length; n++) {
      var e = r[n];
      if (t <= e.from) {
        break;
      }
      a += (Math.min(t, e.to) - e.from) * e.rate;
    }
    return Math.max(0, a);
  }
  function o(t, a) {
    if (t < 15) {
      return 0;
    }
    var r = n.baseAccrual + (t - 15) * n.extraPerYear;
    if (r = Math.min(r, n.maxAccrual), a && a < n.normalRetire) {
      var e = n.normalRetire - a;
      r = Math.max(0, r - e * n.earlyReductionPerYr);
    }
    return r;
  }
  function i(t, a, r) {
    if (a < 15) {
      return {
        qualifies: !1,
        monthly: 0,
        accrual: 0,
        earlyReduction: 0
      };
    }
    var e = o(a, r = r || n.normalRetire), i = t * (e / 100);
    return {
      qualifies: !0,
      monthly: Math.max(i, n.minPension),
      accrual: Math.round(100 * e) / 100,
      earlyReduction: r < 60 ? (60 - r) * n.earlyReductionPerYr : 0
    };
  }
  t.SSNITEngine = {
    RATES: a,
    SSNIT: n,
    PAYE_BANDS: r,
    TIER2_FUNDS: [ {
      name: "Enterprise Trustees",
      avg3yr: 14.2,
      avg5yr: 13.4
    }, {
      name: "Stanbic Investment Mgt.",
      avg3yr: 13.5,
      avg5yr: 12.8
    }, {
      name: "Databank Pensions",
      avg3yr: 13.1,
      avg5yr: 12.3
    }, {
      name: "NTHC Trustees",
      avg3yr: 12.8,
      avg5yr: 12
    }, {
      name: "STANLIB Ghana",
      avg3yr: 12.5,
      avg5yr: 11.8
    }, {
      name: "Old Mutual Pensions",
      avg3yr: 12.2,
      avg5yr: 11.5
    }, {
      name: "Fidelity Pensions",
      avg3yr: 11.9,
      avg5yr: 11.2
    }, {
      name: "GCB Trustees",
      avg3yr: 11.6,
      avg5yr: 10.9
    } ],
    ECOWAS_COUNTRIES: [ "Benin", "Burkina Faso", "Cabo Verde", "Côte d'Ivoire", "The Gambia", "Guinea", "Guinea-Bissau", "Liberia", "Mali", "Mauritania", "Niger", "Nigeria", "Senegal", "Sierra Leone", "Togo" ],
    fmtGHS: function(t) {
      return "GH₵" + Math.round(t).toLocaleString("en-GH");
    },
    calcPAYE: e,
    topMarginalRate: function(t) {
      for (var a = 0; a < r.length; a++) {
        var n = r[a];
        if (t < n.to) {
          return n.rate;
        }
      }
      return .35;
    },
    calcAccrualPct: o,
    calcContributions: function(t, n) {
      n = Math.min(n || 0, a.maxTier3);
      var r = t * a.tier1Employee, e = t * a.tier1Employer, o = t * a.nhia, i = t * a.tier2, l = t * n;
      return {
        t1Emp: r,
        t1Er: e,
        nhia: o,
        t1Total: r + e,
        tier2: i,
        tier3: l,
        totalEmployee: r + l,
        totalEmployer: e + o + i,
        grandTotal: r + e + o + i + l
      };
    },
    calcPension: i,
    findBest36Months: function(t) {
      if (!t || t.length < 3) {
        return null;
      }
      for (var a = [], n = 0; n < t.length; n++) {
        for (var r = 0; r < 12; r++) {
          a.push(t[n].monthly || 0);
        }
      }
      if (a.length < 36) {
        return null;
      }
      for (var e = 0, o = 0; o < 36; o++) {
        e += a[o];
      }
      for (var i = e, l = 0, u = 1; u <= a.length - 36; u++) {
        (e = e - a[u - 1] + a[u + 35]) > i && (i = e, l = u);
      }
      var m = i / 36, h = Math.floor(l / 12), M = Math.floor((l + 35) / 12);
      return h = Math.min(h, t.length - 1), M = Math.min(M, t.length - 1), {
        avgSalary: m,
        bestIdx: l,
        startYear: t[h] ? t[h].year : null,
        endYear: t[M] ? t[M].year : null,
        totalMonths: a.length
      };
    },
    compareRetirementAges: function(t, a) {
      var n = i(t, a, 60), r = i(t, a, 55);
      if (!n.qualifies || !r.qualifies) {
        return null;
      }
      var e = n.monthly - r.monthly, o = 60 * r.monthly, l = 60 + (e > 0 ? o / e : 99999) / 12;
      return {
        at55: r,
        at60: n,
        monthlyDiff: Math.abs(e),
        breakEvenAge: Math.round(10 * l) / 10,
        totalAt55Male: 12 * r.monthly * Math.max(0, 10),
        totalAt60Male: 12 * n.monthly * Math.max(0, 5),
        totalAt55Female: 12 * r.monthly * Math.max(0, 12),
        totalAt60Female: 12 * n.monthly * Math.max(0, 7)
      };
    },
    calcInvalidityBenefit: function(t, a) {
      if (!a || a < 12) {
        return null;
      }
      var r, e = a / 12;
      r = e < 15 ? e / 15 * n.baseAccrual : o(e, 60), r = Math.min(r, n.maxAccrual);
      var i = Math.max(t * (r / 100), n.minPension);
      return {
        monthly: Math.round(i),
        accrual: Math.round(10 * r) / 10,
        eligible: !0,
        contributionMonths: a
      };
    },
    calcTier3Advantage: function(t, n) {
      var r = t * (n = Math.min(n || 0, a.maxTier3)), o = t - t * a.tier1Employee, i = Math.max(0, o - r), l = e(o), u = e(i), m = l - u, h = r - m, M = .13 / 12, c = r * ((Math.pow(1 + M, 240) - 1) / M);
      return {
        tier3Monthly: Math.round(r),
        taxSaved: Math.round(m),
        netCost: Math.round(h),
        payeWithout: Math.round(l),
        payeWith: Math.round(u),
        fv20: Math.round(c),
        savingsRatePct: r > 0 ? Math.round(m / r * 100) : 0
      };
    },
    tier2FundImpact: function(t, a, n, r) {
      var e = n / 100 / 12, o = r / 100 / 12, i = 12 * a, l = t * ((Math.pow(1 + e, i) - 1) / e), u = t * ((Math.pow(1 + o, i) - 1) / o);
      return {
        fvHigh: Math.round(l),
        fvLow: Math.round(u),
        diff: Math.round(l - u)
      };
    },
    calcEarlyExitLumpSum: function(t, r) {
      var e = r || 0, o = e / 12, l = t * a.tier1Employee * e, u = l * Math.pow(1.08, o), m = e >= n.minQualifyMonths, h = m ? i(t, o, 60) : null, M = h ? 12 * h.monthly * 15 : null;
      return {
        lumpSum: Math.round(u),
        totalEmpContrib: Math.round(l),
        qualifiesForPension: m,
        monthsNeeded: n.minQualifyMonths - e,
        lifetimePension: M ? Math.round(M) : null,
        betterToWait: !!M && M > u,
        contributionMonths: e
      };
    }
  };
}("undefined" != typeof window ? window : this), function() {
  "use strict";
  var t = window.SSNITEngine;
  function a(t) {
    return Math.min(Math.max(+t || 0, 0), 69e3);
  }
  t && (t.MAX_INSURABLE_EARNINGS = 69e3, t.calcContributions = function(n, r) {
    var e = a(n), o = Math.min(Math.max(r || 0, 0), t.RATES.maxTier3), i = e * t.RATES.tier1Employee, l = e * t.RATES.tier1Employer, u = e * t.RATES.nhia, m = e * t.RATES.tier2, h = e * o;
    return {
      t1Emp: i,
      t1Er: l,
      nhia: u,
      t1Total: i + l,
      tier2: m,
      tier3: h,
      totalEmployee: i + h,
      totalEmployer: l + m,
      grandTotal: i + l + m + h
    };
  }, t.calcTier3Advantage = function(n, r) {
    var e = a(n), o = e * Math.min(Math.max(r || 0, 0), t.RATES.maxTier3), i = e * t.RATES.tier1Employee, l = Math.max(0, n - i), u = Math.max(0, l - o), m = t.calcPAYE(l), h = t.calcPAYE(u), M = Math.max(0, m - h), c = Math.max(0, o - M), y = .13 / 12, f = o * ((Math.pow(1 + y, 240) - 1) / y);
    return {
      tier3Monthly: Math.round(o),
      taxSaved: Math.round(M),
      netCost: Math.round(c),
      payeWithout: Math.round(m),
      payeWith: Math.round(h),
      fv20: Math.round(f),
      savingsRatePct: o > 0 ? Math.round(M / o * 100) : 0
    };
  }, t.calcEarlyExitLumpSum = function(n, r) {
    var e = r || 0, o = e / 12, i = a(n) * t.RATES.tier1Employee * e, l = i * Math.pow(1.08, o), u = e >= t.SSNIT.minQualifyMonths, m = u ? t.calcPension(a(n), o, 60) : null, h = m ? 12 * m.monthly * 15 : null;
    return {
      lumpSum: Math.round(l),
      totalEmpContrib: Math.round(i),
      qualifiesForPension: u,
      monthsNeeded: t.SSNIT.minQualifyMonths - e,
      lifetimePension: h ? Math.round(h) : null,
      betterToWait: !!h && h > l,
      contributionMonths: e
    };
  });
}();
