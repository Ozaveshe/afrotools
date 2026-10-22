// Readable Car Import Cost engine source. Build via scripts/minify.js.
!function(e, a) {
  "object" == typeof module && module.exports ? module.exports = a() : e.AfroCarImportCost = a();
}("undefined" != typeof self ? self : this, function() {
  "use strict";
  var e = {
    USD: 1,
    NGN: 1535.5,
    KES: 129.45,
    GHS: 14.89,
    UGX: 3720,
    ZMW: 27.5,
    TZS: 2650
  };
  function a(e, a) {
    var t = Number(e);
    return Number.isFinite(t) ? t : a || 0;
  }
  function t(e, t) {
    var s = Math.pow(10, null == t ? 2 : t);
    return Math.round((a(e) + Number.EPSILON) * s) / s;
  }
  function s(e, t) {
    return Math.max(null == t ? 0 : t, a(e));
  }
  function n(e) {
    return String(e || "").trim().toLowerCase();
  }
  function r(e, a) {
    return String(e || a || "").trim().toUpperCase();
  }
  function i(e, a) {
    var t = e && e.countryRulePacks ? e.countryRulePacks : {};
    return t[r(a, "NG")] || t.NG;
  }
  function o(e, a) {
    return new Date(a && a.asOfDate || Date.now());
  }
  function l(e, t) {
    var s = o(t, e), n = Math.trunc(a(e.year, s.getUTCFullYear())), r = Math.trunc(a(e.firstRegistrationMonth || e.monthOfFirstRegistration, 1)), i = s.getUTCFullYear() - n;
    return r > s.getUTCMonth() + 1 && (i -= 1), Math.max(0, i);
  }
  function c(e, a) {
    var t = e && e.sourceMarkets || {};
    return t[a] || t.japan || {
      id: "japan",
      label: "Japan",
      defaultFreightUsd: {},
      vehiclePriceMultiplier: 1
    };
  }
  function u(e, t) {
    var s = r((e = e || {}).countryCode || e.country, "NG"), l = i(t, s), u = n(e.sourceMarket || "japan") || "japan", d = function(e, t) {
      var s = t && t.valuationSeeds || [], r = n(e.make), i = n(e.model), o = Math.trunc(a(e.year, 0)), l = s.find(function(e) {
        return n(e.make) === r && n(e.model) === i && a(e.year) === o;
      });
      return l || r && i && s.find(function(e) {
        return n(e.make) === r && n(e.model) === i;
      }) || null;
    }(e, t), f = c(t, u), p = n(e.ev || e.isEv ? "ev" : e.fuelType || "petrol");
    "electric" === p && (p = "ev");
    var g = n(e.vehicleClass || e.bodyType || d && d.vehicleClass || "sedan"), m = d && d.sourcePricesUsd && d.sourcePricesUsd[u] || d && d.fobUsd ? a(d.sourcePricesUsd && d.sourcePricesUsd[u] || d.fobUsd) * a(f.vehiclePriceMultiplier, 1) : 0, U = n(e.inputMode || e.valueMode || (e.cifUsd ? "cif" : e.fobUsd ? "fob" : m ? "make-model-year" : "purchase"));
    var normalized = {
      countryCode: s,
      sourceMarket: u,
      sourceMarketLabel: f.label || u,
      inputMode: U,
      outputMode: n(e.outputMode || "practical"),
      make: e.make || d && d.make || "",
      model: e.model || d && d.model || "",
      trim: e.trim || "",
      year: Math.trunc(a(e.year || d && d.year, o(t, e).getUTCFullYear())),
      asOfDate: e.asOfDate || null,
      firstRegistrationMonth: Math.trunc(a(e.firstRegistrationMonth || e.monthOfFirstRegistration, 1)),
      fuelType: p,
      engineCc: Math.trunc(a(e.engineCc || d && d.engineCc, 0)),
      transmission: n(e.transmission || "automatic"),
      vehicleClass: g,
      bodyType: n(e.bodyType || g),
      driveSide: n(e.driveSide || e.steering || l.steeringRules && l.steeringRules.required || "right"),
      condition: n(e.condition || "used"),
      mileage: a(e.mileage, 0),
      purchasePriceUsd: a(e.purchasePriceUsd || e.purchasePrice || e.vehiclePriceUsd, m),
      fobUsd: a(e.fobUsd || e.fob, 0),
      cifUsd: a(e.cifUsd || e.cif, 0),
      customsValueUsd: a(e.customsValueUsd || e.customsValue, 0),
      freightUsd: a(e.freightUsd || e.freight, 0),
      insuranceUsd: a(e.insuranceUsd || e.insurance, 0),
      portCode: e.portCode || e.port || "",
      destinationCity: n(e.destinationCity || e.city || ""),
      delayDays: Math.max(0, Math.trunc(a(e.delayDays, 0))),
      storageDays: Math.max(0, Math.trunc(a(e.storageDays, 0))),
      clearingMode: n(e.clearingMode || "agent"),
      downPaymentPct: a(e.downPaymentPct, .25),
      financeAprPct: a(e.financeAprPct, .24),
      financeMonths: Math.trunc(a(e.financeMonths, 36)),
      localDealerPriceUsd: a(e.localDealerPriceUsd || e.localDealerPrice, 0),
      extraAgencyChargesUsd: a(e.extraAgencyChargesUsd, 0),
      fxRates: e.fxRates || null,
      valuationSeedId: d && d.id || null
    };
    if (s === "NG") {
      normalized.ngAssessmentMode = String(e.ngAssessmentMode || "ntip-reference");
      normalized.ngHsCode = String(e.ngHsCode || "").trim();
      normalized.ngExactCcConfirmed = e.ngExactCcConfirmed === true;
      normalized.ngAssessmentNgn = e.ngAssessmentNgn == null ? "" : String(e.ngAssessmentNgn).trim();
      normalized.ngAssessmentDate = String(e.ngAssessmentDate || "").trim();
      normalized.ngAssessmentSource = String(e.ngAssessmentSource || "").trim().slice(0, 200);
    }
    return normalized;
  }
  function d(e, s, n) {
    var r = s.customsBasisRules || {}, i = function(e, t, s) {
      var n = c(s, e.sourceMarket).defaultFreightUsd || {};
      return a(e.freightUsd || e.freight || n[t.countryCode] || t.customsBasisRules && t.customsBasisRules.freightFallbackUsd, 0);
    }(e, s, n), o = a(r.insuranceRate, .012), l = 0, u = a(e.insuranceUsd, 0), d = a(e.cifUsd, 0), f = e.valuationSeedId ? "valuation-pack" : "manual";
    return "cif" === e.inputMode && d > 0 ? (u || (u = d * o), l = Math.max(0, d - i - u)) : (l = "fob" === e.inputMode && e.fobUsd > 0 ? e.fobUsd : e.purchasePriceUsd,
    e.fobUsd > 0 && (l = e.fobUsd), i || (i = a(r.freightFallbackUsd, 0)), u || (u = (l + i) * o),
    d = l + i + u), e.customsValueUsd > 0 && (d = e.customsValueUsd, f = "manual-customs-value"),
    {
      fobUsd: t(l),
      freightUsd: t(i),
      insuranceUsd: t(u),
      cifUsd: t(d),
      customsValueUsd: t(d),
      basis: r.basis || "CIF",
      valuationStatus: f
    };
  }
  function f(e, a) {
    return !(e && (e.fuelTypes && -1 === e.fuelTypes.indexOf(a.fuelType) || e.vehicleClasses && -1 === e.vehicleClasses.indexOf(a.vehicleClass) || e.evOnly && "ev" !== a.fuelType || e.notEv && "ev" === a.fuelType));
  }
  function p(e, t, s) {
    return (e || []).find(function(e) {
      return function(e, t, s) {
        return !(!f(e.conditions, t) || e.vehicleClasses && -1 === e.vehicleClasses.indexOf(t.vehicleClass) || e.fuelTypes && -1 === e.fuelTypes.indexOf(t.fuelType) || null != e.minCc && t.engineCc < a(e.minCc) || null != e.maxCc && t.engineCc > a(e.maxCc) || null != e.minAge && s < a(e.minAge) || null != e.maxAge && s > a(e.maxAge));
      }(e, t, s);
    }) || null;
  }
  function g(e, t, s) {
    return null != (s = s || e).amountUsd ? a(s.amountUsd) : null != s.amountLocal ? a(s.amountLocal) / t.fxRate : 0;
  }
  function m(e, n) {
    if (!1 === e.enabled || !f(e.conditions, n.input)) return null;
    var r = n.input, i = n.ageYears, o = function(e, a) {
      switch (e.base) {
       case "FOB":
        return a.valueBasis.fobUsd;

       case "CIF":
       case "customsValue":
       default:
        return a.valueBasis.customsValueUsd;

       case "customsValuePlusPriorOfficialTaxes":
       case "dutyInclusiveValue":
        return a.valueBasis.customsValueUsd + a.priorOfficialTaxesUsd;

       case "officialSubtotal":
        return a.officialSubtotalUsd;

       case "fixed":
        return 1;
      }
    }(e, n), l = 0, c = e.rateOrFormula, u = null;
    if ("percentage" === e.type) l = o * a(c, 0); else if ("fixed" === e.type) l = g(e, n); else if ("engine-based" === e.type || "tiered" === e.type) {
      if (!(u = p(e.tiers, r, i))) return null;
      l = null != u.amountUsd || null != u.amountLocal ? g(e, n, u) : o * a(u.rate, 0),
      c = u.rate;
    } else if ("age-based" === e.type) {
      if (!(u = p(e.tiers, r, i))) return null;
      l = null != u.amountUsd || null != u.amountLocal ? g(e, n, u) : o * a(u.rate, 0),
      c = u.rate;
    } else "schedule-lookup" === e.type ? (u = p(e.schedule, r, i)) ? (l = null != u.amountUsd || null != u.amountLocal ? g(e, n, u) : o * a(u.rate, 0),
    c = u.rate) : e.fallback && (l = o * a(e.fallback.rate, 0), c = e.fallback.rate) : "formula" === e.type && (l = o * a(c, 0));
    return (l = t(s(l))) || e.forceDisplay ? {
      id: e.id,
      label: e.label,
      group: e.group || "officialTaxes",
      official: !1 !== e.official,
      amountUsd: l,
      amountLocal: t(l * n.fxRate, 0),
      baseUsd: t(o),
      rate: null != c ? a(c) : null,
      tierLabel: u && u.label || e.fallback && e.fallback.label || "",
      displayOrder: a(e.displayOrder, 999),
      notes: e.notes || ""
    } : null;
  }
  function U(e, t) {
    var s = [];
    return (e || []).slice().sort(function(e, t) {
      return a(e.displayOrder, 999) - a(t.displayOrder, 999);
    }).forEach(function(e) {
      var a = m(e, t);
      a && (s.push(a), "officialTaxes" === a.group && (t.priorOfficialTaxesUsd += a.amountUsd),
      a.official && (t.officialSubtotalUsd += a.amountUsd));
    }), s;
  }
  function h(e, a) {
    return (e.ports || []).find(function(e) {
      return e.code === a.portCode;
    }) || (e.ports || [])[0] || {};
  }
  function y(e, a, n, r, i, o) {
    return (n = t(s(n))) ? {
      id: e,
      label: a,
      group: r || "practicalCosts",
      official: !!i,
      amountUsd: n,
      amountLocal: 0,
      notes: o || ""
    } : null;
  }
  function v(e) {
    return t((e || []).reduce(function(e, t) {
      return e + a(t.amountUsd, 0);
    }, 0));
  }
  // Dated NTIP calculator reference, not a representation of settled current law.
  // The portal's VAT excludes its separately displayed vehicle levy.
  function nigeriaAssessment(input, basis, fx, pack) {
    var reference = pack.nigeriaReference;
    var cc = input.engineCc;
    var inferredCode = cc > 3000 ? "8703242000" : cc > 1500 ? "8703232000" : "";
    var referenceClass = input.condition === "used" && input.fuelType === "petrol" &&
      ["sedan", "hatchback", "suv", "wagon", "coupe"].indexOf(input.vehicleClass) !== -1;
    var code = input.ngHsCode || (referenceClass ? inferredCode : "");
    var supported = reference && reference.id === "ntip-observed-2026-10-22" &&
      input.condition === "used" && input.fuelType === "petrol" &&
      ["sedan", "hatchback", "suv", "wagon", "coupe"].indexOf(input.vehicleClass) !== -1 &&
      code === inferredCode && reference.supportedCodes.indexOf(code) !== -1;
    var output = { status: "unsupported", mode: input.ngAssessmentMode, hsCode: code,
      label: "Customs charges not assessed", observedAt: reference && reference.observedAt || null,
      sourceUrl: reference && reference.sourceUrl || null, rows: [], totalUsd: null, totalNgn: null,
      greenTax: { status: "not-assessed", rate: null, amount: null },
      note: "The dated reference covers used petrol passenger cars above 1500cc only. For another class, use your full Customs or broker assessment total." };
    function line(id, label, base, rate, amount) {
      return { id: id, label: label, baseUsd: base, rate: rate, amountUsd: amount,
        amountLocal: t(amount * fx), group: "officialTaxes", official: false,
        notes: "Dated reference; not a current Customs assessment." };
    }
    if (input.ngAssessmentMode === "quoted-total") {
      var amountText = input.ngAssessmentNgn;
      var amount = Number(amountText);
      var date = input.ngAssessmentDate;
      var parsedDate = Date.parse(date + "T00:00:00Z");
      var today = o(null, input).toISOString().slice(0, 10);
      if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount < 0 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate) ||
          new Date(parsedDate).toISOString().slice(0, 10) !== date || date > today || !input.ngAssessmentSource.trim()) {
        output.status = "invalid-quote";
        output.note = "Enter a non-negative assessment total in NGN, its date (not in the future), and who supplied it.";
        return output;
      }
      output.status = "user-assessment";
      output.label = "Your entered customs assessment";
      output.observedAt = null; output.sourceUrl = null;
      output.totalNgn = amount; output.totalUsd = amount / fx;
      output.rows = [line("ng-entered-assessment", output.label, amount / fx, null, amount / fx)];
      output.assessmentDate = date; output.assessmentSource = input.ngAssessmentSource;
      output.greenTax.status = "coverage-to-check-with-quote";
      output.note = "Uses your entered full tax/levy/fee total instead of the portal rates. Check that your assessment matches this vehicle/value and includes every applicable charge, including Green Tax; port and registration budgets stay separate.";
      return output;
    }
    if (!supported) return output;
    if (input.ngExactCcConfirmed) {
      output.greenTax.rate = cc < 2000 ? 0 : cc < 4000 ? .02 : .04;
      output.greenTax.status = cc < 2000 ? "excluded-by-engine-size" : "rate-known-base-unconfirmed";
    } else output.greenTax.status = "exact-displacement-unconfirmed";
    if (input.ngAssessmentMode !== "ntip-reference") {
      output.status = "invalid-scenario"; output.note = "Choose the dated NTIP reference or enter an assessment total."; return output;
    }
    var components = pack.taxComponents || [];
    function rate(id) {
      var item = components.find(function(row) { return row.id === id; });
      return item && item.enabled !== false && Number.isFinite(item.rateOrFormula) && item.rateOrFormula >= 0 && item.rateOrFormula <= 1 ? item.rateOrFormula : null;
    }
    var rates = ["ng-import-duty", "ng-vehicle-levy", "ng-etls", "ng-surcharge", "ng-fcs", "ng-vat"].map(rate);
    if (rates.some(function(value) { return value === null; })) {
      output.status = "invalid-reference"; output.note = "This reference pack is incomplete; use your full assessment total."; return output;
    }
    var cif = basis.customsValueUsd, duty = cif * rates[0], levy = cif * rates[1], etls = cif * rates[2],
      surcharge = duty * rates[3], fcs = basis.fobUsd * rates[4],
      vatBase = cif + duty + etls + surcharge + fcs, vat = vatBase * rates[5];
    output.rows = [line("ng-import-duty", "Import duty (NTIP reference)", cif, rates[0], duty),
      line("ng-etls", "ETLS (NTIP reference)", cif, rates[2], etls),
      line("ng-surcharge", "Surcharge on import duty", duty, rates[3], surcharge),
      line("ng-fcs", "FCS on FOB (NTIP reference)", basis.fobUsd, rates[4], fcs),
      line("ng-vat", "VAT excluding the separate vehicle levy (NTIP reference)", vatBase, rates[5], vat),
      line("ng-vehicle-levy", "Vehicle levy (NTIP reference)", cif, rates[1], levy)];
    output.status = "dated-reference"; output.label = reference.label;
    output.totalUsd = duty + levy + etls + surcharge + fcs + vat;
    output.totalNgn = t(output.totalUsd * fx);
    output.vatBaseUsd = vatBase;
    output.note = "Reproduces the two checked NTIP codes, not a current Customs bill. The portal shows 15% levy and 4% FOB; other official notices disagree. Green Tax is not included unless your confirmed engine size is below 2000cc (excluded). Use a full quoted assessment to replace these charges.";
    return output;
  }
  function compareLocalQuote(result, input) {
    var quote = a(input.localDealerPriceUsd, 0);
    var comparison = {
      status: "quote-required",
      localDealerEstimateUsd: quote > 0 ? t(quote) : null,
      importSavingsUsd: null,
      cheaperOption: null,
      note: "Add a local on-road quote in Advanced costs to compare."
    };
    if (quote <= 0) return comparison;
    if (result.warnings.some(function(warning) {
      return warning.severity === "critical" || warning.code === "stale-rule-pack" || warning.code === "valuation-pack-missing";
    })) {
      comparison.status = "review-required";
      comparison.note = "Resolve import rule or eligibility warnings before comparing the local quote.";
      return comparison;
    }
    comparison.status = "planning-comparison";
    comparison.importSavingsUsd = t(quote - result.totals.onRoadUsd);
    comparison.cheaperOption = comparison.importSavingsUsd > 0 ? "import" : comparison.importSavingsUsd < 0 ? "buy-locally" : "same-cost";
    comparison.note = "Planning difference against your entered local on-road quote; confirm both quotes cover the same vehicle and costs.";
    return comparison;
  }
  return {
    normalizeInput: u,
    calculate: function s(n, c, f) {
      f = f || {};
      var p = u(n, c = c || {}), g = i(c, p.countryCode), m = function(t, s, n) {
        var i = r(s, "USD"), o = n && n[i], l = t && t.fxRates && t.fxRates[i];
        return a(o || l || e[i] || 1, 1);
      }(c, g.currency, p.fxRates), b = d(p, g, c), C = {
        input: p,
        pack: g,
        fxRate: m,
        valueBasis: b,
        ageYears: l(p, c),
        priorOfficialTaxesUsd: 0,
        officialSubtotalUsd: 0
      }, assessment = g.countryCode === "NG" ? nigeriaAssessment(p, b, m, g) : null, M = assessment ? assessment.rows : U(g.taxComponents, C), x = U(g.registrationComponents, C), R = function(e, s, n) {
        if ("official" === s.outputMode) return [];
        var r = e.practicalCostPresets || {}, i = h(e, s), o = function(e, a) {
          return (e.cities || []).find(function(e) {
            return e.id === a.destinationCity;
          }) || (e.cities || [])[0] || {};
        }(e, s), l = "diy" === s.clearingMode ? r.diyClearingUsd : r.clearingAgentUsd, c = Math.max(s.storageDays, s.delayDays - a(i.freeStorageDays, 0), 0), u = [ y("terminal-handling", "Terminal handling", i.terminalHandlingUsd || r.terminalHandlingUsd, "practicalCosts", !1, i.label), y("shipping-line", "Shipping-line and release charges", i.shippingLineChargesUsd || r.shippingLineChargesUsd, "practicalCosts", !1, i.label), y("inspection", e.inspectionRules && e.inspectionRules.label || "Inspection and compliance", r.inspectionUsd, "practicalCosts", !1, ""), y("clearing-agent", "diy" === s.clearingMode ? "DIY clearing processing estimate" : "Customs broker / clearing agent", l, "practicalCosts", !1, ""), y("storage-demurrage", "Storage and demurrage risk", c * (a(i.dailyStorageUsd, 0) + a(i.dailyDemurrageUsd, 0)), "practicalCosts", !1, c + " chargeable days"), y("inland-delivery", "Inland delivery to " + (o.label || "destination city"), o.inlandUsd, "inlandDelivery", !1, "") ].filter(Boolean);
        if ("GH" === e.countryCode && r.safeBondRentUsd && u.push(y("safe-bond-rent", "Safe bond terminal handling / rent", r.safeBondRentUsd, "practicalCosts", !1, "")),
        "ZM" === e.countryCode && u.push(y("extra-agency-charges", "Extra agency charges estimate", s.extraAgencyChargesUsd || r.extraAgencyChargesUsd, "practicalCosts", !1, "")),
        "stress" === s.outputMode) {
          var d = v(u);
          u.push(y("stress-buffer", "Stress-test buffer", d * a(r.bufferRate, .06), "practicalCosts", !1, "Applies to practical costs only."));
        }
        return u.forEach(function(e) {
          e.amountLocal = t(e.amountUsd * n.fxRate, 0);
        }), u;
      }(g, p, C), P = M.filter(function(e) {
        return "officialTaxes" === e.group;
      }), k = M.filter(function(e) {
        return "officialTaxes" !== e.group;
      }), S = x, T = function(e, t, s) {
        var n = e.ageRules && "manufactureYear" === e.ageRules.basis ? Math.max(0, o(s, t).getUTCFullYear() - t.year) : l(t, s), r = [];
        return t.engineCc || r.push({
          code: "missing-engine-cc",
          severity: "warning",
          message: "Engine size is missing, so engine-based charges may use fallback logic or be omitted."
        }), t.purchasePriceUsd || t.fobUsd || t.cifUsd || t.customsValueUsd || r.push({
          code: "valuation-estimate",
          severity: "warning",
          message: "No declared price was supplied. The calculator used the closest valuation seed where available."
        }), e.ageRules && (null != e.ageRules.maxYearsExclusive && n >= a(e.ageRules.maxYearsExclusive) || null != e.ageRules.maxYears && n > a(e.ageRules.maxYears) ? r.push({
          code: "age-ineligible",
          severity: "critical",
          message: e.ageRules.message
        }) : e.ageRules.message && n >= 8 && "NG" !== e.countryCode && "KE" !== e.countryCode && r.push({
          code: "age-sensitive",
          severity: "info",
          message: e.ageRules.message
        })), e.steeringRules && e.steeringRules.required && t.driveSide && t.driveSide !== e.steeringRules.required && r.push({
          code: "steering-ineligible",
          severity: "critical",
          message: e.steeringRules.message
        }), e.customsBasisRules && e.customsBasisRules.valuationPackRequired && !t.valuationSeedId && !t.customsValueUsd && r.push({
          code: "valuation-pack-missing",
          severity: "warning",
          message: "This country is designed around official valuation tables. Result is an estimate until a valuation pack or customs value is supplied."
        }), r;
      }(g, p, c);
      (function(e, t, s) {
        var n = a(t && t.staleAfterDays, 180), r = o(t, s);
        return (e.sourceNotes || []).some(function(e) {
          if (!e.lastVerified) return !0;
          var a = new Date(e.lastVerified + "T00:00:00Z");
          return (r.getTime() - a.getTime()) / 864e5 > n;
        });
      })(g, c, p) && T.push({
        code: "stale-rule-pack",
        severity: "warning",
        message: "One or more source notes are older than the configured freshness threshold."
      }), g.policyReviewRequired && T.unshift({
        code: "policy-review-required",
        severity: "critical",
        message: assessment ? assessment.note : g.policyReviewRequired
      }), b.freightUsd || T.push({
        code: "missing-shipping",
        severity: "warning",
        message: "Shipping is zero or missing; totals can be materially understated."
      });
      var D = {
        vehicleBaseUsd: b.fobUsd,
        freightUsd: b.freightUsd,
        marineInsuranceUsd: b.insuranceUsd,
        cifUsd: b.cifUsd,
        officialTaxesUsd: v(P),
        officialFeesUsd: v(k),
        practicalCostsUsd: v(R.filter(function(e) {
          return "practicalCosts" === e.group;
        })),
        inlandDeliveryUsd: v(R.filter(function(e) {
          return "inlandDelivery" === e.group;
        })),
        registrationUsd: v(S)
      };
      D.totalLandedUsd = t(D.cifUsd + D.officialTaxesUsd + D.officialFeesUsd + D.practicalCostsUsd + D.inlandDeliveryUsd),
      D.onRoadUsd = t(D.totalLandedUsd + D.registrationUsd), Object.keys(D).forEach(function(e) {
        D[e.replace("Usd", "Local")] = t(D[e] * m, 0);
      });
      var O = {
        schemaVersion: c.schemaVersion || "2026-04-10.1",
        calculatedAt: (new Date).toISOString(),
        input: p,
        country: {
          code: g.countryCode,
          name: g.countryName,
          slug: g.slug,
          currency: g.currency,
          flagLabel: g.flagLabel
        },
        rulePack: {
          effectiveFrom: g.effectiveFrom,
          effectiveTo: g.effectiveTo,
          status: g.status,
          confidence: g.confidence,
          valuationMethod: g.valuationMethod
        },
        fx: {
          baseCurrency: "USD",
          localCurrency: g.currency,
          usdToLocal: m
        },
        valueBasis: b,
        warnings: T,
        badges: [ {
          label: "official",
          type: "official"
        }, {
          label: g.confidence || "estimate",
          type: "estimate"
        }, {
          label: b.valuationStatus,
          type: "manual"
        } ],
        breakdowns: {
          customsValueBasis: [ {
            id: "vehicle-base",
            label: "Vehicle base / FOB",
            amountUsd: b.fobUsd
          }, {
            id: "freight",
            label: "Freight to port",
            amountUsd: b.freightUsd
          }, {
            id: "marine-insurance",
            label: "Marine insurance",
            amountUsd: b.insuranceUsd
          }, {
            id: "cif",
            label: "CIF / customs value",
            amountUsd: b.cifUsd
          } ],
          officialTaxes: P,
          officialFees: k,
          practicalCosts: R.filter(function(e) {
            return "practicalCosts" === e.group;
          }),
          inlandDelivery: R.filter(function(e) {
            return "inlandDelivery" === e.group;
          }),
          registration: S,
          allItems: M.concat(R, S)
        },
        totals: D,
        documents: g.documents || [],
        sourceMetadata: g.sourceNotes || [],
        disclaimers: g.disclaimers || [],
        faqs: g.faqs || [],
        copy: g.copy || {},
        explanation: {
          summary: "The engine estimated FOB, freight, and insurance to build a customs value, applied the active country rule pack, added practical port costs when selected, then added registration/on-road costs.",
          trust: "Use this as a planning estimate. Final customs, port, clearing, registration, and FX outcomes can differ."
        }
      };
      if (assessment) {
        var fxObservation = c.fxObservations && c.fxObservations.NGN;
        O.fx.observedAt = fxObservation && fxObservation.rate === m ? fxObservation.observed_at || null : null;
        O.fx.source = fxObservation && fxObservation.rate === m ? fxObservation.source || null : "configured/fallback";
        O.nigeriaAssessment = assessment;
        O.badges = [{ label: assessment.status === "user-assessment" ? "entered assessment" : assessment.status === "dated-reference" ? "dated reference" : "unassessed taxes", type: "estimate" }];
        if (assessment.status !== "dated-reference") f = Object.assign({}, f, {skipCompare:true});
        if (assessment.totalNgn !== null) {
          O.totals.officialTaxesLocal = assessment.totalNgn;
          O.totals.totalLandedLocal = t((O.totals.totalLandedUsd - O.totals.officialTaxesUsd) * m + assessment.totalNgn, 0);
          O.totals.onRoadLocal = t((O.totals.onRoadUsd - O.totals.officialTaxesUsd) * m + assessment.totalNgn, 0);
        }
        O.rulePack.referenceObservedAt = assessment.observedAt;
        O.rulePack.referenceScenario = assessment.mode;
        O.explanation.summary = assessment.note;
      }
      O.sensitivity = function(e, s) {
        var n = e.totals.onRoadUsd, r = s.fxRate, i = h(s.pack, s.input), o = a(i.dailyStorageUsd, 0) + a(i.dailyDemurrageUsd, 0);
        return {
          exchangeRate: [ {
            label: "-5% FX",
            fxRate: t(.95 * r, 4),
            totalLocal: t(n * r * .95, 0)
          }, {
            label: "Current FX",
            fxRate: t(r, 4),
            totalLocal: t(n * r, 0)
          }, {
            label: "+5% FX",
            fxRate: t(1.05 * r, 4),
            totalLocal: t(n * r * 1.05, 0)
          } ],
          delayDays: [ 0, 7, 14, 30 ].map(function(e) {
            return {
              days: e,
              extraUsd: t(e * o),
              onRoadUsd: t(n + e * o)
            };
          })
        };
      }(O, C);
      if (assessment && assessment.status === "user-assessment") {
        O.sensitivity.exchangeRate.forEach(function(row) {
          row.totalLocal = t((O.totals.onRoadUsd - O.totals.officialTaxesUsd) * row.fxRate + assessment.totalNgn, 0);
          row.assumption = "Entered NGN assessment stays fixed; only USD budget portions change.";
        });
      }
      O.finance = function(e, s) {
        var n = Math.min(.95, Math.max(0, a(s.downPaymentPct, .25))), r = Math.max(1, a(s.financeMonths, 36)), i = a(s.financeAprPct, .24) / 12, o = e * (1 - n), l = i ? o * i / (1 - Math.pow(1 + i, -r)) : o / r;
        return {
          downPaymentUsd: t(e * n),
          financedAmountUsd: t(o),
          aprPct: t(100 * a(s.financeAprPct, .24), 2),
          months: r,
          monthlyPaymentUsd: t(l)
        };
      }(O.totals.onRoadUsd, p), O.localComparator = compareLocalQuote(O, p), O.scenarios = function(e, s) {
        var n = s.pack.practicalCostPresets || {}, r = e.totals.onRoadUsd, i = a(n.bufferRate, .06);
        return [ {
          id: "best",
          label: "Best case",
          totalUsd: t(.95 * r),
          assumption: "Clean documents, no storage, slightly cheaper port extras."
        }, {
          id: "normal",
          label: "Normal",
          totalUsd: t(r),
          assumption: "Current inputs and active rule pack."
        }, {
          id: "painful",
          label: "Painful case",
          totalUsd: t(r * (1 + i) + 250),
          assumption: "FX slip, slower clearing, extra storage, and agent buffer."
        } ];
      }(O, C);
      if (assessment && assessment.status === "user-assessment") O.scenarios = [{id:"entered-assessment",label:"Entered assessment budget",totalUsd:O.totals.onRoadUsd,assumption:"Your NGN assessment is held fixed. Get a revised quote before applying it to a different vehicle, value or source."}];
      f.skipCompare || (O.sourceMarketCompare = function(e, n) {
        var r = n && n.sourceMarkets || {};
        return Object.keys(r).map(function(i) {
          var o = r[i], l = {};
          if (Object.keys(e).forEach(function(a) {
            l[a] = e[a];
          }), l.sourceMarket = i, l.inputMode = "cif" === e.inputMode ? "purchase" : e.inputMode,
          "local-dealer" === i) {
            var c = a(e.localDealerPriceUsd, 0);
            if (c <= 0) return null;
            return {
              sourceMarket: i,
              label: "Local on-road quote (entered)",
              evidenceType: "user-quote",
              freightUsd: 0,
              onRoadUsd: t(c),
              totalLandedUsd: t(c),
              warningCount: 0
            };
          }
          if (e.valuationSeedId) {
            var d = (n.valuationSeeds || []).find(function(a) {
              return a.id === e.valuationSeedId;
            });
            d && d.sourcePricesUsd && d.sourcePricesUsd[i] && (l.purchasePriceUsd = d.sourcePricesUsd[i]);
          } else l.purchasePriceUsd = a(e.purchasePriceUsd, 0) * a(o.vehiclePriceMultiplier, 1);
          var f = s(l, n, {
            skipCompare: !0
          });
          return {
            sourceMarket: i,
            label: (o.label || i) + " (modeled)",
            evidenceType: "planning-scenario",
            freightUsd: f.valueBasis.freightUsd,
            onRoadUsd: f.totals.onRoadUsd,
            totalLandedUsd: f.totals.totalLandedUsd,
            warningCount: f.warnings.length
          };
        }).filter(Boolean).sort(function(e, a) {
          return e.onRoadUsd - a.onRoadUsd;
        });
      }(p, c));
      return O;
    },
    mergeData: function(e, a, t) {
      var s = {};
      return e = e || {}, Object.keys(e).forEach(function(a) {
        s[a] = e[a];
      }), s.countryRulePacks = {}, (a || []).forEach(function(e) {
        e && e.countryCode && (s.countryRulePacks[e.countryCode] = e);
      }), t && (s.fxRates = t), s;
    },
    formatMoney: function(e, t, s) {
      try {
        return new Intl.NumberFormat(s || "en", {
          style: "currency",
          currency: t || "USD",
          maximumFractionDigits: 0
        }).format(a(e));
      } catch (s) {
        return (t || "USD") + " " + Math.round(a(e)).toLocaleString();
      }
    },
    _private: {
      computeAge: l,
      resolveValueBasis: d,
      componentResult: m
    }
  };
});
