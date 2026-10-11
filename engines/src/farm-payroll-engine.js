!function() {
  "use strict";
  function a(a, e) {
    return isFinite(a) ? e + Math.abs(a).toLocaleString("en-US", {
      maximumFractionDigits: 0
    }) : e + "0";
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.FarmPayrollEngine = {
    calculate: function(e, t) {
      var o = t;
      if (!o) {
        return {
          error: !0,
          message: "No country data"
        };
      }
      var ngPolicy = o.contributionPolicy === "NG-user-confirmed-v1", ngContributions = null, ngLabour = null;
      if (ngPolicy) {
        var model = window.AfroTools.NigeriaFarmContributions;
        if (!model) return { error: true, message: "Contribution rules could not be loaded. Reload and try again." };
        ngContributions = model.calculate(e.contributionSelection);
        if (!ngContributions.valid) return { error: true, message: "Complete the contribution choices and salary bases.", field: ngContributions.field, code: ngContributions.code };
        var labourModel = window.AfroTools.NigeriaPayrollLabour;
        if (!labourModel) return { error: true, field: "labourAssumptions", message: "Labour assumptions could not be loaded. Reload and try again." };
        ngLabour = labourModel.calculate(Object.assign({}, e.labourSelection, { overtimeHours: e.overtimeHours }));
        if (!ngLabour.valid) return { error: true, field: ngLabour.field, code: ngLabour.code, message: "Confirm the overtime pay and leave-budget assumptions." };
      }
      var r = o.symbol || "", n = Math.max(1, parseInt(e.numWorkers) || 1), s = 0;
      "permanent" === e.workerType ? s = parseFloat(e.grossPay) || 0 : "casual" === e.workerType || "seasonal" === e.workerType ? s = (parseFloat(e.grossPay) || 0) * (parseFloat(e.daysWorked) || 26) : "piece_rate" === e.workerType && (s = (parseFloat(e.ratePerUnit) || 0) * (parseFloat(e.unitsCompleted) || 0));
      var i = ngPolicy ? ngLabour.overtimePayKobo / 100 : (parseFloat(e.overtimeHours) || 0) * (s / 173.33) * ((o.laborLaw.overtimeRate || 1.5) - 1), l = (parseFloat(e.inKindHousing) || 0) + (parseFloat(e.inKindFood) || 0), p = s + i + l, m = [], y = 0, h = ngPolicy ? {} : (o.deductions || {});
      if (ngPolicy) {
        ngContributions.rows.forEach(function (row) {
          if (row.employeeRatePercent > 0) m.push({ name: row.scheme, rate: row.employeeRatePercent, amount: row.employeeKobo / 100, basis: row.basisKobo / 100, sourceId: row.sourceId });
        });
        y = ngContributions.employeeKobo / 100;
    if (y > s + i) return { error: true, message: "Contributions exceed cash earnings. Check the selected salary bases.", field: "contributions", code: "contributions-exceed-cash" };
      }
      if (h.pension && h.pension.rate_pct) {
        var u = p * h.pension.rate_pct / 100;
        m.push({
          name: h.pension.name,
          rate: h.pension.rate_pct,
          amount: u,
          notes: h.pension.notes
        }), y += u;
      }
      if (h.health && h.health.rate_pct) {
        var c = p * h.health.rate_pct / 100;
        m.push({
          name: h.health.name,
          rate: h.health.rate_pct,
          amount: c,
          notes: h.health.notes
        }), y += c;
      }
      if (h.other && h.other.rate_pct) {
        var f = p * h.other.rate_pct / 100;
        m.push({
          name: h.other.name,
          rate: h.other.rate_pct,
          amount: f,
          notes: h.other.notes
        }), y += f;
      }
      var d = p > 2 * (o.nationalMinWage_monthly || o.agriMinWage_monthly || 0), g = (ngPolicy ? s + i : p) - y, w = [], _ = 0;
      if (ngPolicy) {
        ngContributions.rows.forEach(function (row) {
          if (row.employerRatePercent > 0) w.push({ name: "Employer " + row.scheme, amount: row.employerKobo / 100, rate: row.employerRatePercent, basis: row.basisKobo / 100, sourceId: row.sourceId });
        });
        _ = ngContributions.employerKobo / 100;
      }
      if (h.pension && h.pension.employerRate_pct) {
        var v = p * h.pension.employerRate_pct / 100;
        w.push({
          name: "Employer " + h.pension.name,
          amount: v
        }), _ += v;
      }
      if (h.health && h.health.employerRate_pct) {
        var k = p * h.health.employerRate_pct / 100;
        w.push({
          name: "Employer " + h.health.name,
          amount: k
        }), _ += k;
      }
      var F = ngPolicy ? ngLabour.leaveMonthlyBudgetKobo / 100 : p / 26 * (o.laborLaw.annualLeave_days || 15) / 12;
      if (!ngPolicy) w.push({
        name: "Annual Leave Provision",
        amount: F
      });
      var M = p + (_ += F), b = o.agriMinWage_monthly || o.nationalMinWage_monthly, T = o.agriMinWage_daily, C = null;
      if (b && "permanent" === e.workerType) {
        var P = p - b;
        C = {
          compliant: P >= 0,
          minWage: b,
          gross: p,
          diff: Math.abs(P),
          diffPct: Math.abs(P / b * 100)
        };
      } else if (T && ("casual" === e.workerType || "seasonal" === e.workerType)) {
        var W = parseFloat(e.grossPay) || 0, L = W - T;
        C = {
          compliant: L >= 0,
          minWage: T,
          gross: W,
          diff: Math.abs(L),
          diffPct: Math.abs(L / T * 100),
          isDaily: !0
        };
      }
      if (ngPolicy) {
        C = model.compareWage(e.minimumWageSelection);
        if (!C.valid) return { error: true, field: C.field, code: C.code, message: "Check the minimum wage coverage choice and monthly wage." };
        d = null;
      }
      var result = {
        sym: r,
        currency: o.currency,
        workerType: e.workerType,
        numWorkers: n,
        baseGross: s,
        overtimePay: i,
        inKindValue: l,
        grossForDeductions: p,
        deductions: m,
        totalDeductions: y,
        netPay: g,
        employerContributions: w,
        totalEmployerExtra: _,
        totalEmployerCost: M,
        farmMonthlyGross: p * n,
        farmMonthlyNet: g * n,
        farmMonthlyCost: M * n,
        farmAnnualCost: M * n * 12,
        mwCheck: C,
        likelyTaxable: d,
        laborLaw: o.laborLaw,
        payeLink: o.payeLink,
        payeCountryName: o.payeCountryName,
        typicalDailyRate: o.typicalDailyRate,
        fGross: a(p, r),
        fNet: a(g, r),
        fDeductions: a(y, r),
        fEmployerCost: a(M, r),
        fFarmMonthlyCost: a(M * n, r),
        fFarmAnnualCost: a(M * n * 12, r)
      };
      if (ngPolicy) {
        var monetaryTotals = [s, i, l, p, y, g, _, M, p * n, g * n, M * n, M * n * 12];
        if (monetaryTotals.some(function (value) { return !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 100; })) {
          return { error: true, field: "payrollTotals", code: "payroll-total-too-large", message: "The combined payroll amounts are too large to calculate reliably. Reduce pay amounts or worker count and try again." };
        }
        result.contributionCalculation = ngContributions;
        result.labourAssumptions = ngLabour;
        result.laborLaw = { sourceId: ngLabour.sourceId, assumptions: "user-confirmed", currentLawVerified: false };
        result.employerCostBeforeLeaveBudget = M - F;
        result.cashGross = s + i;
        result.netCashPay = g;
        result.netRemuneration = p - y;
        result.totalEmployerContributions = ngContributions.employerKobo / 100;
        result.leaveProvision = F;
        [["fGross", p], ["fNet", g], ["fDeductions", y], ["fEmployerCost", M], ["fFarmMonthlyCost", M * n], ["fFarmAnnualCost", M * n * 12]].forEach(function (pair) {
          result[pair[0]] = r + pair[1].toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        });
      }
      return result;
    },
    fmt: a
  };
}();
