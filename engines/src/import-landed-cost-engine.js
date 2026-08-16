(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfroImportLandedCostEngine = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function number(value) {
    if (value === "" || value === null || typeof value === "undefined") return 0;
    var parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function money(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function nonNegative(value, field, errors) {
    var parsed = number(value);
    if (!Number.isFinite(parsed) || parsed < 0) errors.push(field);
    return parsed;
  }

  function daysBetween(fromDate, toDate) {
    var from = Date.parse(String(fromDate || "") + "T00:00:00Z");
    var to = Date.parse(String(toDate || "") + "T00:00:00Z");
    if (!Number.isFinite(from) || !Number.isFinite(to)) return Infinity;
    return Math.floor((to - from) / 86400000);
  }

  function hoursBetween(fromDate, toDate) {
    var from = Date.parse(String(fromDate || ""));
    var toValue = String(toDate || "");
    var to = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(toValue) ? toValue + "T00:00:00Z" : toValue);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return Infinity;
    return Math.floor((to - from) / 3600000);
  }

  function isRuleStale(rule, dataset, asOfDate) {
    var threshold = number((rule && rule.staleAfterDays) || (dataset && dataset.staleAfterDays));
    if (!(threshold > 0) || !rule || !rule.lastVerified) return true;
    return daysBetween(rule.lastVerified, asOfDate) > threshold;
  }

  function isFxStale(snapshot, dataset, asOfDate) {
    var fxConfig = dataset && dataset.fx || {};
    var threshold = number(fxConfig.staleAfterHours) || number(fxConfig.staleAfterDays) * 24;
    var timestamp = snapshot && snapshot.timestamp ? String(snapshot.timestamp) : "";
    if (!(threshold > 0) || !timestamp) return true;
    return hoursBetween(timestamp, asOfDate) > threshold;
  }

  function calculateCustomsBase(purchase, freight, insurance, assessedOverride) {
    var assessed = number(assessedOverride);
    if (assessed > 0) return money(assessed);
    return money(number(purchase) + number(freight) + number(insurance));
  }

  function calculateAdValoremDuty(customsBase, rate) {
    return money(number(customsBase) * number(rate) / 100);
  }

  function calculateFixedDuty(amount) {
    var fixed = number(amount);
    return Number.isFinite(fixed) && fixed >= 0 ? money(fixed) : NaN;
  }

  function calculateTieredDuty(customsBase, tiers) {
    var remaining = number(customsBase);
    var lowerBound = 0;
    var total = 0;
    if (!(remaining >= 0) || !Array.isArray(tiers)) return NaN;
    tiers.forEach(function (tier) {
      if (!(remaining > 0)) return;
      var upperBound = tier && tier.upTo != null ? number(tier.upTo) : Infinity;
      var width = upperBound === Infinity ? remaining : Math.max(0, upperBound - lowerBound);
      var taxable = Math.min(remaining, width);
      total += taxable * number(tier && tier.rate) / 100;
      remaining -= taxable;
      lowerBound = upperBound;
    });
    return money(total);
  }

  function calculateFxRate(snapshot, fromCurrency, toCurrency) {
    var from = String(fromCurrency || "USD").toUpperCase();
    var to = String(toCurrency || "USD").toUpperCase();
    if (from === to) return 1;
    var rates = snapshot && snapshot.rates ? snapshot.rates : {};
    var base = String(snapshot && snapshot.base || "USD").toUpperCase();
    var fromRate = from === base ? 1 : number(rates[from]);
    var toRate = to === base ? 1 : number(rates[to]);
    if (!(fromRate > 0) || !(toRate > 0)) return null;
    return toRate / fromRate;
  }

  function componentTotal(names, values) {
    return (names || []).reduce(function (total, name) {
      return total + (number(values[name]) || 0);
    }, 0);
  }

  function calculateCore(input, dataset, options) {
    var values = input || {};
    var config = dataset || {};
    var market = config.markets && config.markets[values.destination];
    var errors = [];
    if (!market) return { valid: false, unsupported: true, errors: ["destination"] };
    if ((values.goodsType || "general") === "vehicle") {
      return {
        valid: false,
        unsupported: true,
        errors: ["goodsType"],
        reason: config.goodsTypes && config.goodsTypes.vehicle ? config.goodsTypes.vehicle.notes : "Use the dedicated vehicle workflow.",
        route: config.goodsTypes && config.goodsTypes.vehicle ? config.goodsTypes.vehicle.route : "/tools/car-import-cost/"
      };
    }

    var purchase = nonNegative(values.purchaseValue, "purchaseValue", errors);
    var freight = nonNegative(values.freight, "freight", errors);
    var insurance = nonNegative(values.insurance, "insurance", errors);
    var quantity = nonNegative(values.quantity || 1, "quantity", errors);
    var dutyRate = nonNegative(values.dutyRate, "dutyRate", errors);
    var exciseRate = nonNegative(values.exciseRate, "exciseRate", errors);
    var exciseFixed = nonNegative(values.exciseFixedLocal, "exciseFixedLocal", errors);
    var customsOverride = nonNegative(values.customsValueOverrideLocal, "customsValueOverrideLocal", errors);
    var otherStatutory = nonNegative(values.otherStatutoryLocal, "otherStatutoryLocal", errors);
    var assumptionKeys = ["clearingAgent", "portTerminal", "storage", "inlandHaulage", "inspection", "documentation", "bankRemittance", "miscellaneous"];
    var assumptions = {};
    assumptionKeys.forEach(function (key) {
      assumptions[key] = nonNegative(values[key], key, errors);
    });
    if (!(purchase > 0)) errors.push("purchaseValue");
    if (!(quantity > 0)) errors.push("quantity");
    if (dutyRate > 100) errors.push("dutyRate");
    if (exciseRate > 100) errors.push("exciseRate");

    var sourceCurrency = String(values.sourceCurrency || "USD").toUpperCase();
    var referenceFxRate = calculateFxRate(options && options.fxSnapshot, sourceCurrency, market.currency);
    var requestedFxRate = number(values.fxRate);
    var fxRate = requestedFxRate > 0 ? requestedFxRate : referenceFxRate;
    if (!(fxRate > 0)) errors.push("fxRate");
    if (errors.length) return { valid: false, errors: Array.from(new Set(errors)) };

    var purchaseLocal = money(purchase * fxRate);
    var freightLocal = money(freight * fxRate);
    var insuranceLocal = money(insurance * fxRate);
    var cifLocal = calculateCustomsBase(purchaseLocal, freightLocal, insuranceLocal, 0);
    var customsValue = calculateCustomsBase(purchaseLocal, freightLocal, insuranceLocal, customsOverride);
    var duty = calculateAdValoremDuty(customsValue, dutyRate);
    var componentValues = {
      purchaseValue: purchaseLocal,
      freight: freightLocal,
      insurance: insuranceLocal,
      cif: cifLocal,
      customsValue: customsValue,
      duty: duty,
      otherStatutory: otherStatutory,
      customsUplift: 0,
      excise: 0,
      levies: 0
    };

    var exciseBase = componentTotal(market.excise && market.excise.base, componentValues);
    var excise = exciseFixed > 0 ? money(exciseFixed) : money(exciseBase * exciseRate / 100);
    componentValues.excise = excise;

    var levyItems = (market.levies || []).map(function (levy) {
      var base = money(componentTotal(levy.base, componentValues));
      return {
        id: levy.id,
        name: levy.name,
        rate: levy.rate,
        base: base,
        amount: money(base * number(levy.rate) / 100),
        description: levy.description || ""
      };
    });
    var levies = money(levyItems.reduce(function (total, levy) { return total + levy.amount; }, 0));
    componentValues.levies = levies;

    var upliftRate = number(market.vat && market.vat.upliftRate);
    var exemptOrigins = market.vat && market.vat.upliftExemptOrigins || [];
    var origin = String(values.origin || "OTHER").toUpperCase();
    var upliftApplies = upliftRate > 0 && exemptOrigins.indexOf(origin) === -1;
    var customsUplift = upliftApplies ? money(customsValue * upliftRate / 100) : 0;
    componentValues.customsUplift = customsUplift;

    var vatRate = typeof values.vatRate === "undefined" || values.vatRate === "" ? number(market.vat.rate) : nonNegative(values.vatRate, "vatRate", errors);
    if (vatRate > 100) errors.push("vatRate");
    if (errors.length) return { valid: false, errors: Array.from(new Set(errors)) };
    var vatBase = money(componentTotal(market.vat.base, componentValues));
    var vat = money(vatBase * vatRate / 100);
    var governmentCharges = money(duty + excise + levies + vat + otherStatutory);
    var optionalCosts = money(assumptionKeys.reduce(function (total, key) { return total + assumptions[key]; }, 0));
    var landedCostLocal = money(cifLocal + governmentCharges + optionalCosts);
    var purchasePriceBurden = purchaseLocal > 0 ? money(governmentCharges / purchaseLocal * 100) : 0;
    var customsBurden = customsValue > 0 ? money(governmentCharges / customsValue * 100) : 0;
    var asOfDate = options && options.asOfDate || new Date().toISOString().slice(0, 10);
    var stale = isRuleStale(market, config, asOfDate);
    var fxStale = isFxStale(options && options.fxSnapshot, config, asOfDate);
    var warnings = [];
    if (stale || market.status !== "current") warnings.push("stale-rule");
    if (fxStale) warnings.push("stale-fx");
    if (!values.classificationConfirmed) warnings.push("classification-unconfirmed");
    if (customsOverride > 0) warnings.push("customs-value-override");
    if (otherStatutory === 0 && market.limitations && market.limitations.length) warnings.push("other-charges-may-apply");
    if (upliftRate > 0) warnings.push(upliftApplies ? "vat-uplift-applied" : "vat-uplift-origin-exception");

    return {
      valid: true,
      unsupported: false,
      destination: values.destination,
      country: market.country,
      origin: origin,
      sourceCurrency: sourceCurrency,
      destinationCurrency: market.currency,
      symbol: market.symbol,
      fxRate: fxRate,
      referenceFxRate: referenceFxRate,
      fxSource: requestedFxRate > 0 ? "user-override" : "bundled-snapshot",
      fxReferenceSource: options && options.fxSnapshot && options.fxSnapshot.source || "unknown",
      fxReferenceTimestamp: options && options.fxSnapshot && options.fxSnapshot.timestamp || null,
      fxFreshness: fxStale ? "stale" : "fresh",
      fxStale: fxStale,
      purchaseValueSource: purchase,
      freightSource: freight,
      insuranceSource: insurance,
      purchaseValueLocal: purchaseLocal,
      freightLocal: freightLocal,
      insuranceLocal: insuranceLocal,
      cifLocal: cifLocal,
      customsValue: customsValue,
      customsValueSource: customsOverride > 0 ? "user-assessed" : "cif",
      dutyRate: dutyRate,
      duty: duty,
      exciseRate: exciseRate,
      exciseBase: money(exciseBase),
      excise: excise,
      levyItems: levyItems,
      totalLevies: levies,
      customsUplift: customsUplift,
      upliftApplies: upliftApplies,
      vatRate: vatRate,
      vatBase: vatBase,
      vat: vat,
      otherStatutory: otherStatutory,
      governmentCharges: governmentCharges,
      optionalCosts: assumptions,
      optionalCostsTotal: optionalCosts,
      landedCostLocal: landedCostLocal,
      landedCostPerUnit: money(landedCostLocal / quantity),
      quantity: quantity,
      effectiveImportBurden: customsBurden,
      taxesAsPurchasePercent: purchasePriceBurden,
      ruleVersion: market.ruleVersion,
      effectiveDate: market.effectiveDate,
      lastVerified: market.lastVerified,
      stale: stale,
      confidence: stale ? "stale" : (values.classificationConfirmed ? market.confidence : "needs-review"),
      warnings: warnings,
      sources: market.sources || [],
      limitations: market.limitations || [],
      authority: market.authority,
      customsValuationBasis: market.customsValuationBasis
    };
  }

  function calculate(input, dataset, options) {
    var result = calculateCore(input, dataset, options || {});
    if (!result.valid) return result;
    var customRate = number(input && input.fxRate);
    if (customRate > 0 && result.referenceFxRate > 0 && Math.abs(customRate - result.referenceFxRate) > 0.0000001) {
      var referenceInput = Object.assign({}, input, { fxRate: result.referenceFxRate });
      var reference = calculateCore(referenceInput, dataset, options || {});
      result.referenceLandedCostLocal = reference.valid ? reference.landedCostLocal : null;
      result.fxImpactLocal = reference.valid ? money(result.landedCostLocal - reference.landedCostLocal) : null;
    } else {
      result.referenceLandedCostLocal = result.landedCostLocal;
      result.fxImpactLocal = 0;
    }
    return result;
  }

  function compare(left, right, dataset, options) {
    var a = calculate(left, dataset, options);
    var b = calculate(right, dataset, options);
    if (!a.valid || !b.valid) return { valid: false, left: a, right: b };
    return {
      valid: true,
      left: a,
      right: b,
      compatible: a.destination === b.destination,
      differenceLocal: a.destinationCurrency === b.destinationCurrency ? money(b.landedCostLocal - a.landedCostLocal) : null,
      differencePercent: a.landedCostLocal > 0 ? money((b.landedCostLocal - a.landedCostLocal) / a.landedCostLocal * 100) : null
    };
  }

  return {
    lastUpdated: "2026-08-15",
    formulaParameters: {
      ruleDatasetPath: "data/trade/import-rules.json",
      customsBase: "purchase value plus freight plus insurance, unless the user supplies an assessed customs value",
      adValoremDuty: "customs value multiplied by the user-confirmed duty rate",
      excise: "country rule-pack base multiplied by a user-confirmed rate, or a user-entered fixed assessed amount",
      levies: "country rule-pack levy rate multiplied by its declared component base",
      vat: "country rule-pack VAT rate multiplied by its declared tax-inclusive base",
      landedCost: "CIF plus government charges plus separately entered optional local costs",
      fx: "bundled reference cross-rate or explicit user override"
    },
    roundingPolicy: {
      method: "Math.round with Number.EPSILON",
      precision: "2 decimal places",
      stages: [
        "source amounts after FX conversion",
        "customs value, duty, excise, each levy and VAT",
        "government charges, optional costs, landed total, unit cost and burden percentages"
      ]
    },
    calculate: calculate,
    compare: compare,
    calculateFxRate: calculateFxRate,
    calculateCustomsBase: calculateCustomsBase,
    calculateAdValoremDuty: calculateAdValoremDuty,
    calculateFixedDuty: calculateFixedDuty,
    calculateTieredDuty: calculateTieredDuty,
    isRuleStale: isRuleStale,
    isFxStale: isFxStale,
    money: money
  };
}));
