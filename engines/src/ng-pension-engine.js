!function() {
  "use strict";
  var t = [ {
    name: "Stanbic IBTC Pension",
    yr1: 13.1,
    yr3: 11.8,
    yr5: 11.4,
    aum: 1820,
    rsa: 32e5,
    remit: 97
  }, {
    name: "ARM Pension",
    yr1: 12.8,
    yr3: 11.2,
    yr5: 10.9,
    aum: 1410,
    rsa: 28e5,
    remit: 96
  }, {
    name: "AXA Mansard Pensions",
    yr1: 12.1,
    yr3: 10.9,
    yr5: 10.5,
    aum: 650,
    rsa: 11e5,
    remit: 95
  }, {
    name: "Leadway Pensure",
    yr1: 11.9,
    yr3: 10.8,
    yr5: 10.3,
    aum: 820,
    rsa: 15e5,
    remit: 94
  }, {
    name: "Premium Pension",
    yr1: 11.6,
    yr3: 10.4,
    yr5: 9.9,
    aum: 420,
    rsa: 78e4,
    remit: 93
  }, {
    name: "NPF Pensions",
    yr1: 11.4,
    yr3: 10.2,
    yr5: 9.8,
    aum: 290,
    rsa: 42e4,
    remit: 91
  }, {
    name: "Trustfund Pensions",
    yr1: 11.2,
    yr3: 10.1,
    yr5: 9.6,
    aum: 350,
    rsa: 65e4,
    remit: 92
  }, {
    name: "Crusader Sterling",
    yr1: 10.2,
    yr3: 9.1,
    yr5: 8.7,
    aum: 380,
    rsa: 89e4,
    remit: 88
  }, {
    name: "NLPC PFA",
    yr1: 9.8,
    yr3: 8.9,
    yr5: 8.4,
    aum: 180,
    rsa: 31e4,
    remit: 86
  } ];
  function r(t, r) {
    for (var a = Math.max(2e5 + .2 * t, .01 * t), n = [ {
      limit: 3e5,
      rate: .07
    }, {
      limit: 3e5,
      rate: .11
    }, {
      limit: 5e5,
      rate: .15
    }, {
      limit: 5e5,
      rate: .19
    }, {
      limit: 16e5,
      rate: .21
    }, {
      limit: 1 / 0,
      rate: .24
    } ], e = 0, o = Math.max(0, t - r - a), u = 0; u < n.length && !(o <= 0); u++) {
      var i = Math.min(o, n[u].limit);
      e += i * n[u].rate, o -= i;
    }
    return e;
  }
  function a(t, r, a) {
    return a <= 0 ? 0 : r <= 0 ? t * a : t * ((Math.pow(1 + r, a) - 1) / r);
  }
  window.NgPensionEngine = {
    PFA_DATA: t,
    MEDIAN_5YR: 10.3,
    calculateCPS: function(t, r, n, e, o, u, i, h, d) {
      var m = t + r + n + e, l = m * (o / 100), M = m * (u / 100), c = l + M, s = 12 * c, y = Math.max(0, h - i), f = a(c, d / 100 / 12, 12 * y), p = .25 * f, x = .75 * f, A = x / 240, v = .06 * x / 12;
      return {
        emoluments: Math.round(m),
        empContrib: Math.round(l),
        erContrib: Math.round(M),
        totalMonthly: Math.round(c),
        totalAnnual: Math.round(s),
        yearsToRetire: y,
        projected: Math.round(f),
        lumpSum25: Math.round(p),
        remain75: Math.round(x),
        monthlyPW20: Math.round(A),
        monthlyAnnuity: Math.round(v)
      };
    },
    calculateAVC: function(t, n, e, o, u, i, h, d) {
      var m = Math.max(0, i - u), l = h / 100 / 12, M = 12 * m, c = a(o, l, M), s = 12 * t, y = n * (e / 100) * 12, f = 12 * o, p = s / 3, x = Math.min(f, p), A = r(s, y), v = r(s, y + x), P = Math.max(0, A - v), g = P / 12, S = Math.max(0, o - g), C = S * M, b = 0, F = i;
      if (d && d > 0 && l > 0 && M > 0) {
        var B = a(d, l, M), E = d + o, L = Math.log(B * l / E + 1) / Math.log(1 + l);
        F = +(i - (b = Math.max(0, Math.round(M - L))) / 12).toFixed(1);
      }
      return {
        avcMonthly: Math.round(o),
        additionalBalance: Math.round(c),
        annualTaxSaving: Math.round(P),
        monthlyTaxSaving: Math.round(g),
        netMonthlyAVC: Math.round(S),
        totalNetCost: Math.round(C),
        yearsToRetire: m,
        grossROI: C > 0 ? (100 * (c / C - 1)).toFixed(0) : "N/A",
        earlierMonths: b,
        earlierRetireAge: F
      };
    },
    calculateMicroPension: function(t, r, n) {
      var e = 12 * r, o = a(t, n / 100 / 12, e), u = .4 * o, i = .6 * o;
      return {
        monthlyContrib: Math.round(t),
        years: r,
        totalContributed: Math.round(t * e),
        projected: Math.round(o),
        accessible40: Math.round(u),
        locked60: Math.round(i)
      };
    },
    calculateLumpSumVsAnnuity: function(t, r, a, n) {
      var e = (a || 6) / 100, o = .25 * t, u = .75 * t, i = u * e / 12, h = t * e / 12, d = h - i, m = (d > 0 ? Math.ceil(o / d) : 1 / 0) / 12, l = r + m, M = o + 360 * i, c = 360 * h, s = n || 0, y = s > 0 ? Math.round(i / s * 100) : null, f = s > 0 ? Math.round(h / s * 100) : null, p = s > 0 ? Math.round(Math.max(0, s - i)) : null, x = s > 0 ? Math.round(Math.max(0, s - h)) : null;
      return {
        projectedBalance: Math.round(t),
        lumpSumAmount: Math.round(o),
        remainderAfterLS: Math.round(u),
        monthlyWithLS: Math.round(i),
        monthlyNoLS: Math.round(h),
        monthlyGain: Math.round(d),
        breakEvenYears: +m.toFixed(1),
        breakEvenAge: +l.toFixed(0),
        total30WithLS: Math.round(M),
        total30NoLS: Math.round(c),
        monthlyExpenses: Math.round(s),
        coverageA: y,
        coverageB: f,
        shortfallA: p,
        shortfallB: x
      };
    },
    calculateGratuityVsCPS: function(t, r, n, e, o, u) {
      var i = t / 100 * (12 * n) * r, h = a(n * ((e + o) / 100), u / 100 / 12, 12 * r), d = h > i ? "CPS" : "Gratuity", m = Math.abs(h - i), l = (m / Math.max(i, h) * 100).toFixed(1);
      return {
        gratuityPayout: Math.round(i),
        cpsBalance: Math.round(h),
        winner: d,
        difference: Math.round(m),
        diffPct: l,
        yearsOfService: r
      };
    },
    calculateDeathBenefit: function(t, r) {
      var a = 3 * t, n = r + a;
      return {
        rsaBalance: Math.round(r),
        annualBasic: Math.round(t),
        groupLife: Math.round(a),
        totalBenefit: Math.round(n)
      };
    },
    checkContributions: function(t, r, a) {
      var n = t * (r / 100), e = t * (a / 100), o = n + e;
      return {
        pensionableEmoluments: Math.round(t),
        expectedEmp: Math.round(n),
        expectedEr: Math.round(e),
        totalExpectedMonthly: Math.round(o),
        totalExpectedAnnual: Math.round(12 * o)
      };
    },
    comparePFAs: function(r, a, n) {
      var e = t.slice().sort(function(t, r) {
        return r.yr5 - t.yr5;
      }), o = e[0], u = e.map(function(t) {
        var r = a * Math.pow(1 + t.yr5 / 100, n);
        return {
          pfa: t,
          projected: Math.round(r)
        };
      }), i = u.find(function(t) {
        return t.pfa.name === r;
      }), h = u[0], d = i ? Math.max(0, h.projected - i.projected) : 0;
      return {
        currentPFA: r,
        results: u,
        best5yr: o.name,
        best5yrReturn: o.yr5,
        median5yr: 10.3,
        opportunityCost: d,
        yearsRemaining: n
      };
    },
    fmt: function(t) {
      return "₦" + Math.round(t).toLocaleString("en");
    },
    pct: function(t, r) {
      return (+t).toFixed(void 0 === r ? 1 : r) + "%";
    }
  };
}();
