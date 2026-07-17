!function() {
  "use strict";
  var t = 17712, a = 632.84;
  function e(t) {
    if (!t || t <= 0) {
      return .58;
    }
    var a = (29.2 + 7173.92 / t) / 100;
    return Math.min(.58, Math.max(.38, a));
  }
  function n(a) {
    return Math.min(a, t) / 30;
  }
  window.UIFEngine = {
    calcIRR: e,
    calcDailyRate: n,
    calcDailyBenefit: function(t) {
      var r = n(t);
      return Math.min(r * e(r), a);
    },
    calcCreditDays: function(t, a, e) {
      var n = new Date(t), r = a ? new Date(a) : new Date, i = Math.max(0, Math.floor((r - n) / 864e5)), o = Math.floor(i / 4), l = Math.min(o, 238);
      return {
        daysWorked: i,
        rawCredits: o,
        creditsCapped: l,
        available: Math.max(0, l - (e || 0))
      };
    },
    calcCreditDaysFromYears: function(t) {
      var a = 365 * t, e = Math.floor(a / 4);
      return Math.min(e, 238);
    },
    calcBenefit: function(r) {
      var i, o = r.monthlySalary || 0, l = r.claimType || "unemployment", c = r.creditDays || 0, m = n(o), u = e(m), f = Math.min(m * u, a);
      i = "maternity" === l || "adoption" === l ? 121 : 238;
      var y = Math.min(c, i), h = 30 * f, M = f * y;
      return {
        monthlySalary: o,
        insurableSalary: Math.min(o, t),
        dailyRate: m,
        irr: u,
        irrPct: +(100 * u).toFixed(2),
        dailyBenefit: f,
        monthlyBenefit: h,
        totalBenefit: M,
        benefitDays: y,
        benefitWeeks: +(y / 7).toFixed(1),
        benefitMonths: +(y / 30).toFixed(1),
        creditDays: c,
        cappedAtMax: o > t
      };
    },
    calcReducedWorkTime: function(n, r) {
      var i = Math.max(0, n - r), o = Math.min(n, t), l = Math.min(r, t), c = Math.max(0, o - l) / 30, m = e(o / 30), u = Math.min(c * m, a);
      return {
        prevSalary: n,
        currSalary: r,
        lostSalary: i,
        irr: m,
        irrPct: +(100 * m).toFixed(2),
        dailyBenefit: u,
        monthlyBenefit: 30 * u,
        totalMonthlyIncome: r + 30 * u
      };
    },
    getIRRExamples: function() {
      return [ 3500, 5e3, 8e3, 1e4, 15e3, 17712, 25e3, 5e4 ].map(function(n) {
        var r = Math.min(n, t), i = r / 30, o = e(i), l = Math.min(i * o, a);
        return {
          salary: n,
          insurableSalary: r,
          daily: i,
          irr: o,
          irrPct: +(100 * o).toFixed(1),
          dailyBenefit: l,
          monthlyBenefit: 30 * l,
          capped: n > t
        };
      });
    },
    fmtZAR: function(t) {
      return "R " + Math.round(t).toLocaleString("en");
    },
    fmtPct: function(t) {
      return (100 * t).toFixed(1) + "%";
    },
    MAX_INSURABLE_SALARY: t,
    MAX_DAILY_BENEFIT: a,
    MAX_CREDIT_DAYS: 238
  };
}();
