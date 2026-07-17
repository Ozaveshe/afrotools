!function(e, t) {
  "use strict";
  if ("object" == typeof module && module.exports) {
    module.exports = t();
  } else {
    var a = t();
    e.AfroTools = e.AfroTools || {}, e.AfroTools.engines = e.AfroTools.engines || {},
    e.AfroTools.engines.solarRoi = a, e.AfroTools.SolarROIEngine = {
      calculate: function(t, r) {
        return a.calculateCountryQuick(t, r, e.ENERGY_DATA);
      }
    };
  }
}("undefined" != typeof globalThis ? globalThis : this, function() {
  "use strict";
  var e = {
    analysisYears: 25,
    discountRatePct: 10,
    tariffEscalationPct: 5,
    fuelEscalationPct: 6,
    panelDegradationPct: .6,
    batteryReplacementYear: 8,
    inverterReplacementAllowancePct: 10,
    annualMaintenancePct: 2.5,
    systemEfficiencyPct: 78,
    safetyMarginPct: 0,
    batteryDepthPct: 80,
    panelWatt: 550,
    panelAreaSqm: 2.6,
    fuelKwhPerLitre: 2.2,
    generatorLitresPerHour: 1.2,
    gridEmissionKgPerKwh: .5,
    generatorCo2KgPerLitre: 2.31,
    maxIrrIterations: 80
  }, t = {
    none: {
      label: "No battery",
      costFactor: .75,
      generatorFactor: .18
    },
    starter: {
      label: "Starter backup",
      costFactor: .9,
      generatorFactor: .45
    },
    essential: {
      label: "Essential loads",
      costFactor: 1,
      generatorFactor: .7
    },
    extended: {
      label: "Extended backup",
      costFactor: 1.25,
      generatorFactor: .88
    }
  };
  function a(e, t) {
    var a = parseFloat(String(null == e ? "" : e).replace(/[^0-9.-]/g, ""));
    return isFinite(a) ? a : t || 0;
  }
  function r(e, t, a) {
    return e = isFinite(e) ? e : t, Math.max(t, Math.min(a, e));
  }
  function n(e, t) {
    var a = Math.pow(10, null == t ? 2 : t);
    return Math.round(((isFinite(e) ? e : 0) + Number.EPSILON) * a) / a;
  }
  function o(e) {
    return (e = a(e, 0)) > 1 ? e / 100 : e;
  }
  function i(e, t) {
    return (e = a(e, t || 0)) > 0 ? e : t || 0;
  }
  function s(e) {
    return e && "object" == typeof e ? {
      label: e.label || "Custom battery",
      costFactor: a(e.costFactor, 1),
      generatorFactor: r(a(e.generatorFactor, .7), 0, 1)
    } : t[e] || t.essential;
  }
  function l(e, t, r) {
    e = Math.max(0, a(e, 0)), r = Math.max(1, Math.round(a(r, 1)));
    var n = o(t) / 12;
    if (e <= 0) {
      return 0;
    }
    if (n <= 0) {
      return e / r;
    }
    var i = Math.pow(1 + n, r);
    return e * (n * i) / (i - 1);
  }
  function c(e, t) {
    return e = Math.max(0, a(e, 0)), t = a(t, 0), e > 0 && t > 0 ? e / t : null;
  }
  function u(e, t, r) {
    var n = Math.max(0, a(e, 0)), i = o(r);
    if (n <= 0) {
      return 0;
    }
    for (var s = 0; s < t.length; s++) {
      var l = a(t[s], 0) / Math.pow(1 + i, s + 1);
      if (!(l <= 0)) {
        if (l >= n) {
          return s + n / l;
        }
        n -= l;
      }
    }
    return null;
  }
  function d(e, t, r) {
    for (var n = o(r), i = -Math.max(0, a(e, 0)), s = 0; s < t.length; s++) {
      i += a(t[s], 0) / Math.pow(1 + n, s + 1);
    }
    return i;
  }
  function f(t) {
    var r = t.map(function(e) {
      return a(e, 0);
    }), n = r.some(function(e) {
      return e > 0;
    }), o = r.some(function(e) {
      return e < 0;
    });
    if (!n || !o) {
      return null;
    }
    function i(e) {
      for (var t = 0, a = 0; a < r.length; a++) {
        t += r[a] / Math.pow(1 + e, a);
      }
      return t;
    }
    for (var s = -.999, l = 1, c = i(s), u = i(l), d = 0; c * u > 0 && l < 100 && d < 40; ) {
      u = i(l *= 2), d++;
    }
    if (c * u > 0) {
      return null;
    }
    for (var f = 0; f < e.maxIrrIterations; f++) {
      var h = (s + l) / 2, m = i(h);
      if (Math.abs(m) < 1e-7) {
        return h;
      }
      c * m <= 0 ? (l = h, u = m) : (s = h, c = m);
    }
    return (s + l) / 2;
  }
  function h(t) {
    var o = s((t = t || {}).batteryProfile || t.batteryOption), l = Math.max(0, a(t.systemKw, 0)), c = i(t.avgSunHours, 5), u = Math.max(0, a(t.dailyLoadKwh, 0)), d = Math.max(0, a(t.peakLoadKw, 0)), f = Math.max(0, a(t.generatorSizeKva, 0)), h = r(a(t.generatorPowerFactor, .8), .1, 1), m = r(a(t.backupHours, 0), 0, 48), y = Math.max(100, a(t.panelWatt, e.panelWatt)), g = i(t.panelAreaSqm, e.panelAreaSqm), p = r(a(t.systemEfficiencyPct, e.systemEfficiencyPct), 1, 100) / 100, v = r(a(t.safetyMarginPct, e.safetyMarginPct), 0, 100) / 100, b = r(a(t.batteryDepthPct, e.batteryDepthPct), 1, 100) / 100, P = f * h, w = 1 + r(a(t.outageHoursPerDay, 0), 0, 24) / 24, M = u > 0 ? u * (1 + v) / (c * p) : 0, S = P > 0 ? P * w : 0, k = Math.max(M, S, l), A = Math.max(0, Math.ceil(1e3 * k / y)), K = l > 0 ? Math.ceil(1e3 * l / y) : 0, C = u * o.generatorFactor * (m / 24), R = b > 0 ? C / b : C, Y = Math.max(1.25 * d, .85 * P, .8 * l), x = d > 0 ? 100 * (Y / d - 1) : null, L = d > 0 && P > 0 ? P / d : null, E = l >= .9 * k ? "near the suggested range" : l >= .9 * M ? "covers daily load but may not replace generator peak" : "undersized against this load";
    return {
      sunHours: n(c, 3),
      dailyLoadKwh: n(u, 3),
      peakLoadKw: n(d, 3),
      generatorKva: n(f, 3),
      generatorKw: n(P, 3),
      powerFactor: n(h, 3),
      loadPvKw: n(M, 3),
      generatorPvKw: n(S, 3),
      suggestedPvKw: n(k, 3),
      panelWatt: n(y, 0),
      panelCount: A,
      roofAreaSqm: n(A * g, 2),
      selectedSystemPanelCount: K,
      selectedSystemRoofAreaSqm: n(K * g, 2),
      panelAreaSqm: n(g, 2),
      suggestedBatteryUsableKwh: n(C, 3),
      suggestedBatteryNominalKwh: n(R, 3),
      suggestedInverterKw: n(Y, 3),
      suggestedInverterContinuousKw: n(Y, 3),
      inverterHeadroomPct: null == x ? null : n(x, 1),
      generatorLoadRatio: null == L ? null : n(L, 3),
      fit: E,
      efficiency: n(p, 4),
      safety: n(v, 4),
      backupHours: n(m, 2),
      batteryDepth: n(b, 4)
    };
  }
  function m(t) {
    var m = function(t) {
      t = t || {};
      var c = Math.max(1, Math.round(a(t.analysisYears, e.analysisYears))), u = Math.max(0, a(t.systemKw, 0)), h = s(t.batteryProfile || t.batteryOption), m = i(t.avgSunHours, 5), y = r(a(t.systemEfficiencyPct, e.systemEfficiencyPct), 1, 100) / 100, g = a(t.tariffPerKwh, 0), p = a(t.fuelPricePerLitre, 0), v = i(t.fuelBaselinePerLitre, p || 1), b = Math.max(0, a(t.monthlyElectricitySpend, 0)), P = Math.max(0, a(t.monthlyGeneratorFuelSpend, 0)), w = r(a(t.outageHoursPerDay, 0), 0, 24), M = Math.min(1, w / 8), S = Math.max(0, a(t.installCostPerKw, 0)), k = Math.max(0, a(t.batteryCostTotal, 0)), A = Math.max(0, a(t.systemCost, u * S + k)), K = null == t.annualMaintenance || "" === t.annualMaintenance, C = a(t.annualMaintenance, 0);
      K && A > 0 && (C = A * o(null == t.annualMaintenancePct ? e.annualMaintenancePct : t.annualMaintenancePct));
      var R = A * (r(a(t.depositPct, 0), 0, 100) / 100), Y = Math.max(0, A - R), x = Math.max(1, Math.round(a(t.loanTermMonths, 1))), L = l(Y, t.annualInterestRatePct, x), E = L * x, F = Math.max(0, E - Y), G = !!t.includeFinancing, q = o(null == t.tariffEscalationPct ? e.tariffEscalationPct : t.tariffEscalationPct), T = o(null == t.fuelEscalationPct ? e.fuelEscalationPct : t.fuelEscalationPct), H = o(null == t.panelDegradationPct ? e.panelDegradationPct : t.panelDegradationPct), N = o(null == t.discountRatePct ? e.discountRatePct : t.discountRatePct), O = Math.round(a(t.batteryReplacementYear, e.batteryReplacementYear)), I = a(t.inverterReplacementAllowance, 0), D = Math.round(a(t.inverterReplacementYear, 12));
      I <= 0 ? I = A * o(null == t.inverterReplacementAllowancePct ? e.inverterReplacementAllowancePct : t.inverterReplacementAllowancePct) : I <= 1 && (I *= A);
      for (var W = u * m * 30 * y * 12, j = p > 0 ? P / p : 0, z = h.generatorFactor * (.35 + .65 * M), B = 12 * j * z, U = B / i(t.generatorLitresPerHour, e.generatorLitresPerHour), Q = [], V = [], $ = -A, _ = -A, J = A, X = 0, Z = 0, ee = 0, te = 0, ae = 1; ae <= c; ae++) {
        var re = ae - 1, ne = Math.pow(1 + q, re), oe = Math.pow(1 + T, re), ie = W * Math.pow(1 - H, re), se = 12 * b * ne, le = ie * g * ne, ce = Math.min(se, le), ue = 12 * P * oe * (p / v) * z, de = ce + ue, fe = C * Math.pow(1 + q, re), he = O > 0 && ae === O ? k : 0, me = D > 0 && ae === D ? I : 0, ye = he + me, ge = de - fe - ye, pe = L * (G ? Math.max(0, Math.min(12, x - 12 * (ae - 1))) : 0), ve = ge - pe, be = Math.pow(1 + N, ae);
        $ += ge, _ += ge / be, J += (fe + ye) / be, X += ie / be;
        var Pe = B, we = U, Me = ie * a(t.gridEmissionKgPerKwh, e.gridEmissionKgPerKwh) + Pe * a(t.generatorCo2KgPerLitre, e.generatorCo2KgPerLitre);
        Z += Me, ee += Pe, te += we, V.push(ge), Q.push({
          year: ae,
          generationKwh: n(ie, 2),
          tariffPerKwh: n(g * ne, 4),
          fuelPricePerLitre: n(p * oe, 4),
          gridOffset: n(ce, 2),
          generatorOffset: n(ue, 2),
          grossSavings: n(de, 2),
          maintenance: n(fe, 2),
          batteryReplacement: n(he, 2),
          inverterReplacement: n(me, 2),
          replacementCosts: n(ye, 2),
          loanPayments: n(pe, 2),
          projectNetCashflow: n(ge, 2),
          ownerNetCashflow: n(ve, 2),
          discountedProjectNetCashflow: n(ge / be, 2),
          cumulativeProjectCashflow: n($, 2),
          cumulativeDiscountedCashflow: n(_, 2),
          generatorLitresAvoided: n(Pe, 2),
          generatorRunHoursAvoided: n(we, 2),
          co2AvoidedKg: n(Me, 2)
        });
      }
      return {
        cashflows: Q,
        projectCashflows: V,
        systemCost: n(A, 2),
        depositAmount: n(R, 2),
        financedPrincipal: n(Y, 2),
        loanMonthlyPayment: n(L, 2),
        totalLoanPayments: n(E, 2),
        totalInterestPaid: n(F, 2),
        firstYearGenerationKwh: n(W, 2),
        firstYearGrossSavings: Q[0] ? Q[0].grossSavings : 0,
        firstYearCashflow: Q[0] ? Q[0].ownerNetCashflow : 0,
        firstYearProjectCashflow: Q[0] ? Q[0].projectNetCashflow : 0,
        tenYearNetSavings: n(V.slice(0, 10).reduce(function(e, t) {
          return e + t;
        }, 0) - A, 2),
        twentyFiveYearNetSavings: n(V.slice(0, 25).reduce(function(e, t) {
          return e + t;
        }, 0) - A, 2),
        npv: n(d(A, V, null == t.discountRatePct ? e.discountRatePct : t.discountRatePct), 2),
        irr: f([ -A ].concat(V)),
        lcoe: X > 0 ? n(J / X, 4) : null,
        lifetimeCo2AvoidedKg: n(Z, 2),
        firstYearCo2AvoidedKg: Q[0] ? Q[0].co2AvoidedKg : 0,
        lifetimeGeneratorLitresAvoided: n(ee, 2),
        firstYearGeneratorLitresAvoided: n(B, 2),
        lifetimeGeneratorRunHoursAvoided: n(te, 2),
        firstYearGeneratorRunHoursAvoided: n(U, 2)
      };
    }(t = t || {}), y = h(t), g = c(m.systemCost, m.firstYearProjectCashflow), p = u(m.systemCost, m.projectCashflows, null == t.discountRatePct ? e.discountRatePct : t.discountRatePct);
    return {
      input: t,
      assumptions: {
        analysisYears: Math.max(1, Math.round(a(t.analysisYears, e.analysisYears))),
        tariffEscalationPct: a(t.tariffEscalationPct, e.tariffEscalationPct),
        fuelEscalationPct: a(t.fuelEscalationPct, e.fuelEscalationPct),
        panelDegradationPct: a(t.panelDegradationPct, e.panelDegradationPct),
        discountRatePct: a(t.discountRatePct, e.discountRatePct),
        batteryReplacementYear: Math.round(a(t.batteryReplacementYear, e.batteryReplacementYear))
      },
      systemCost: m.systemCost,
      simplePaybackYears: null == g ? null : n(g, 3),
      discountedPaybackYears: null == p ? null : n(p, 3),
      tenYearNetSavings: m.tenYearNetSavings,
      twentyFiveYearNetSavings: m.twentyFiveYearNetSavings,
      annualCashflows: m.cashflows,
      firstYearCashflow: m.firstYearCashflow,
      firstYearProjectCashflow: m.firstYearProjectCashflow,
      firstYearGrossSavings: m.firstYearGrossSavings,
      firstYearGenerationKwh: m.firstYearGenerationKwh,
      npv: m.npv,
      irr: null == m.irr ? null : n(m.irr, 6),
      irrPct: null == m.irr ? null : n(100 * m.irr, 3),
      lcoe: m.lcoe,
      co2AvoidedKg: m.firstYearCo2AvoidedKg,
      lifetimeCo2AvoidedKg: m.lifetimeCo2AvoidedKg,
      generatorLitresAvoided: m.firstYearGeneratorLitresAvoided,
      lifetimeGeneratorLitresAvoided: m.lifetimeGeneratorLitresAvoided,
      generatorRunHoursAvoided: m.firstYearGeneratorRunHoursAvoided,
      lifetimeGeneratorRunHoursAvoided: m.lifetimeGeneratorRunHoursAvoided,
      roofAreaSqm: y.roofAreaSqm,
      panelCount: y.panelCount,
      suggestedInverterKw: y.suggestedInverterKw,
      suggestedBatteryUsableKwh: y.suggestedBatteryUsableKwh,
      suggestedBatteryNominalKwh: y.suggestedBatteryNominalKwh,
      sizing: y,
      finance: {
        depositPct: r(a(t.depositPct, 0), 0, 100),
        depositAmount: m.depositAmount,
        principal: m.financedPrincipal,
        monthlyPayment: m.loanMonthlyPayment,
        termMonths: Math.max(1, Math.round(a(t.loanTermMonths, 1))),
        totalInterestPaid: m.totalInterestPaid,
        totalLoanPayments: m.totalLoanPayments
      }
    };
  }
  function y(e, t) {
    return e = Math.round(a(e, 0)), String(t || "") + e.toLocaleString();
  }
  return {
    id: "solar-roi-engine",
    defaults: e,
    batteryProfiles: t,
    calculate: m,
    decisionEngine: function(e) {
      var t = a((e = e || {}).paybackYears, 0), n = r(a(e.outageHoursPerDay, 0), 0, 24), o = Math.max(0, a(e.monthlyGeneratorFuelSpend, 0)), i = Math.max(0, a(e.monthlyElectricitySpend, 0)), s = Math.max(0, a(e.financeMonthlyPayment, 0)), l = Math.max(0, a(e.netMonthlyAfterMaintenance, 0)), c = String(e.batteryNeed || "").toLowerCase(), u = String(e.systemAffordability || "").toLowerCase(), d = Math.max(0, a(e.fuelAvoidedLitresPerMonth, 0)), f = i > 0 || o > 0, h = s > 0 && l > 0 ? s / l : s > 0 ? 2 : 0, m = c.indexOf("strong") >= 0 || c.indexOf("extended") >= 0 || n >= 6, y = n >= 4 || o > .5 * i || d >= 20, g = !t || t > 8, p = t > 0 && t <= 7, v = t > 0 && t <= 5, b = h > 1 || s > 0 && u.indexOf("high") >= 0;
      function P(e, t, a, r) {
        return {
          label: e,
          headline: t,
          reasons: a.slice(0, 3),
          nextSteps: r.slice(0, 3)
        };
      }
      return f ? b ? P("Quote needed before decision", "The solar idea may work, but the payment pressure needs quote validation.", [ "The finance payment is high compared with estimated monthly relief.", "Payback can change quickly once deposit, interest, and term are replaced with real lender terms.", "A smaller backup-first system may protect cash flow better than a full solar purchase." ], [ "Get a written installer quote with cash and financed totals.", "Ask for the total repayment amount, not only monthly instalment.", "Compare a smaller inverter+battery quote against the full solar quote." ]) : v && d >= 10 && l > 0 ? P("Strong solar case", "Solar looks commercially sensible if a written quote matches these assumptions.", [ "Simple payback is in a practical range under the current cost assumptions.", "The model shows meaningful monthly relief from grid bill and generator reduction.", "Generator fuel avoided is material enough to support the savings case." ], [ "Request a written quote using the same system size and battery plan.", "Verify roof condition, shading, inverter surge capacity, and usable battery kWh.", "Replace tariff, fuel, battery, and installation defaults with quote values before paying." ]) : p && !m && n <= 4 ? P("Solar is good, battery optional", "Solar savings look useful, but a large battery may not be the first purchase.", [ "Payback is reasonable without treating backup as the whole decision.", "Outage hours do not force an extended battery in this scenario.", "Generator fuel avoided is present but not the only driver of ROI." ], [ "Price a solar-first quote and a smaller battery quote side by side.", "Keep essential loads separate so battery capacity can stay disciplined.", "Use a recent bill to confirm how much solar energy you can actually self-consume." ]) : g && m ? P("Weak ROI but strong resilience case", "The money case is weak, but backup value may still justify a smaller system.", [ "Payback is long or unavailable under the current assumptions.", "Outage hours make resilience valuable even when bill savings are limited.", "Battery sizing should focus on essential loads, not the whole daily energy use." ], [ "Treat this as a resilience purchase, not a pure ROI purchase.", "Price a critical-load inverter+battery system before a full solar quote.", "Recheck the model with a written quote and a measured appliance list." ]) : y && m && (!t || t > 5) ? P("Battery-first backup case", "Your pain is backup reliability first; full solar can come after quote validation.", [ "Outage hours or generator spend point to a strong backup need.", "The payback case is not yet strong enough to rush a full solar purchase.", "Fuel avoided improves when essential loads can move from generator to battery." ], [ "Ask for an inverter+battery quote sized around essential loads.", "Confirm fridge, freezer, pump, AC, or motor surge before choosing inverter capacity.", "Add solar panels once the backup system size and budget are validated." ]) : P("Quote needed before decision", "The numbers are close enough that a real quote should decide the next move.", [ "Payback is not clearly strong or clearly weak under the current assumptions.", "Small changes in tariff, fuel price, battery cost, or install price can change the recommendation.", "The model still depends on planning defaults rather than a verified installer design." ], [ "Get at least one written quote with panels, inverter, battery, protection, and labour separated.", "Replace the editable assumptions with quote and bill values.", "Compare full solar against a smaller backup-first option before paying a deposit." ]) : P("Too little data", "Add bill or generator spend before trusting the recommendation.", [ "Solar ROI needs at least one current cost: grid bill, generator spend, or both.", "Outage hours alone can show backup need, but not whether the system pays back.", "The estimate will improve once you add monthly spend and a rough load profile." ], [ "Enter your latest monthly electricity bill.", "Add monthly generator fuel spend if you use backup power.", "Use the appliance estimator or preset to set daily kWh and peak load." ]);
    },
    calculateCountryQuick: function(e, r, n) {
      e = e || {};
      var o = n && n.countries && n.countries[r];
      if (!o) {
        return {
          error: "Country data not available."
        };
      }
      var i = a(e.systemKW || e.systemKw, 0), s = a(e.currentMonthlyBill || e.monthlyElectricitySpend, 0);
      if (i <= 0) {
        return {
          error: "Please enter a valid system size (kW)."
        };
      }
      if (s <= 0) {
        return {
          error: "Please enter your current monthly electricity bill."
        };
      }
      var l, c = o.currencySymbol || o.currency || "", u = function(e, t) {
        var a = e && e.solar && e.solar.systems || {}, r = a[String(t) + "kW"], n = r && r.total;
        if (!n) {
          for (var o = Object.keys(a).map(function(e) {
            return parseFloat(e);
          }).filter(function(e) {
            return isFinite(e);
          }).sort(function(e, t) {
            return e - t;
          }), i = 0; i < o.length; i++) {
            if (o[i] >= t) {
              var s = o[i];
              (n = a[String(s) + "kW"] && a[String(s) + "kW"].total) && s !== t && (n = n * (t / s) * 1.08);
              break;
            }
          }
        }
        return n || (n = 850 * (e.usdRate || 1) * t), n;
      }(o, i), d = m({
        systemKw: i,
        avgSunHours: o.solar && o.solar.avgSunHours || 5,
        monthlyElectricitySpend: s,
        monthlyGeneratorFuelSpend: 0,
        tariffPerKwh: o.electricityTariff && o.electricityTariff.residential || 0,
        fuelPricePerLitre: o.fuel && (o.fuel.petrol || o.fuel.diesel || o.fuel.kerosene) || 0,
        installCostPerKw: .75 * u / i,
        batteryCostTotal: .25 * u,
        annualMaintenance: .025 * u,
        batteryProfile: t.essential
      }), f = d.annualCashflows[0] || {}, h = (f.gridOffset || 0) / 12, g = f.gridOffset || 0, p = Math.round(d.co2AvoidedKg || 0), v = [ o.name + " averages " + (o.solar && o.solar.avgSunHours || 5) + " peak sun hours/day for solar planning.", "A " + i + " kW system generates about " + Math.round(d.firstYearGenerationKwh / 12).toLocaleString() + " kWh/month in this estimate.", "Use the full Solar ROI decision tool before buying if generator fuel, battery backup, outages, or financing matter." ];
      return d.simplePaybackYears && d.simplePaybackYears < 7 && v.push("Payback is under 7 years before quote validation. Confirm tariff, roof, inverter, battery, and warranty terms."),
      {
        installCostLocal: y(u, c),
        installCostUSD: o.usdRate ? y(u / o.usdRate, "$") : "",
        monthlyGeneration: Math.round(d.firstYearGenerationKwh / 12).toLocaleString() + " kWh",
        monthlySaving: y(h, c),
        annualSaving: y(g, c),
        paybackYears: (l = d.simplePaybackYears, null == l || !isFinite(l) || l <= 0 || l > 25 ? ">25 years" : l.toFixed(l >= 10 ? 0 : 1) + " years"),
        roi10yr: y(d.tenYearNetSavings, c),
        roi25yr: y(d.twentyFiveYearNetSavings, c),
        co2SavedYr: p >= 1e3 ? (p / 1e3).toFixed(1) + " t" : p.toLocaleString() + " kg",
        sunHours: (o.solar && o.solar.avgSunHours || 5) + " hrs/day",
        observations: v,
        countryName: o.name,
        currencySymbol: c,
        raw: d
      };
    },
    sizingGuide: h,
    monthlyLoanPayment: l,
    simplePayback: c,
    discountedPayback: u,
    npv: d,
    irr: f
  };
});
