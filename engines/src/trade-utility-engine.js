(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TradeUtilityEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  function proformaTotals(input) {
    var items = (input.items || []).map(function (item) {
      var quantity = Math.max(0, finite(item.quantity));
      var unitPrice = Math.max(0, finite(item.unitPrice));
      return {
        description: String(item.description || "").trim(),
        quantity: quantity,
        unitPrice: unitPrice,
        total: quantity * unitPrice
      };
    }).filter(function (item) {
      return item.description && item.quantity > 0;
    });
    var subtotal = items.reduce(function (sum, item) { return sum + item.total; }, 0);
    var freight = Math.max(0, finite(input.freight));
    var insurance = Math.max(0, finite(input.insurance));
    return {
      items: items,
      itemCount: items.length,
      subtotal: subtotal,
      fob: subtotal,
      freight: freight,
      cfr: subtotal + freight,
      insurance: insurance,
      cif: subtotal + freight + insurance,
      total: subtotal + freight + insurance
    };
  }

  function packingTotals(input) {
    var weightsAreTotals = Boolean(input.weightsAreTotals);
    var packages = (input.packages || []).map(function (item) {
      var count = Math.max(0, finite(item.count));
      var netWeight = Math.max(0, finite(item.netWeight));
      var grossWeight = Math.max(0, finite(item.grossWeight));
      var lengthCm = Math.max(0, finite(item.lengthCm));
      var widthCm = Math.max(0, finite(item.widthCm));
      var heightCm = Math.max(0, finite(item.heightCm));
      return {
        count: count,
        netWeight: netWeight,
        grossWeight: grossWeight,
        cbm: Number.isFinite(Number(item.cbm)) ?
          Math.max(0, Number(item.cbm)) :
          count * lengthCm * widthCm * heightCm / 1000000
      };
    });
    return packages.reduce(function (totals, item) {
      totals.packageCount += item.count;
      totals.netWeight += weightsAreTotals ? item.netWeight : item.count * item.netWeight;
      totals.grossWeight += weightsAreTotals ? item.grossWeight : item.count * item.grossWeight;
      totals.cbm += item.cbm;
      return totals;
    }, { packageCount: 0, netWeight: 0, grossWeight: 0, cbm: 0 });
  }

  function billOfLadingDraft(input) {
    var required = ["shipper", "consignee", "cargo"];
    var missing = required.filter(function (key) { return !String(input[key] || "").trim(); });
    return {
      valid: missing.length === 0,
      missing: missing,
      route: [input.loadPort, input.dischargePort].map(function (value) {
        return String(value || "").trim();
      }).filter(Boolean).join(" \u2192 "),
      grossWeight: Math.max(0, finite(input.grossWeight)),
      volume: Math.max(0, finite(input.volume)),
      freight: Math.max(0, finite(input.freight))
    };
  }

  function crossBorderChecklist(input) {
    var keys = [
      "legalBasis", "contract", "riskAssessment", "security",
      "processors", "retention", "rights", "incident"
    ];
    var completed = keys.filter(function (key) { return Boolean(input[key]); }).length;
    return {
      completed: completed,
      total: keys.length,
      completionRate: completed / keys.length * 100,
      highRisk: Boolean(input.sensitive || input.children || input.largeScale)
    };
  }

  function crossBorderCountryProfile(input) {
    return {
      code: String(input.code || ""),
      name: String(input.name || ""),
      law: String(input.law || ""),
      regulator: String(input.regulator || ""),
      adequacy: input.adequacy || { exists: false, note: "" },
      mechanisms: Array.isArray(input.mechanisms) ? input.mechanisms.slice() : [],
      steps: Array.isArray(input.steps) ? input.steps.slice() : [],
      warnings: Array.isArray(input.warnings) ? input.warnings.slice() : []
    };
  }

  function customsTime(input) {
    var baseByMode = { air: [1, 3], sea: [3, 7], road: [1, 4], rail: [2, 5] };
    var base = baseByMode[input.mode] || [2, 5];
    var add = 0;
    if (!input.documentsReady) add += 3;
    if (input.inspection) add += 4;
    if (input.regulated) add += 5;
    if (input.congestion) add += 3;
    if (!input.broker) add += 1;
    if (input.preArrival) add = Math.max(0, add - 1);
    return {
      lowDays: base[0] + Math.floor(add * 0.55),
      highDays: base[1] + add,
      riskDays: add
    };
  }

  function customsClearanceModel(input) {
    var documentationMultiplier = input.documentStatus === "complete" ? 1 :
      (input.documentStatus === "partial" ? 1.5 : 2.5);
    var goodsMultiplier = input.goodsType === "food" || input.goodsType === "pharma" ? 1.3 : 1;
    var minimum = Math.round(finite(input.minimumDays) *
      (input.documentStatus === "complete" ? 1 : 1.3));
    var typical = Math.round(finite(input.typicalDays) * documentationMultiplier * goodsMultiplier);
    var maximum = Math.round(finite(input.maximumDays) * documentationMultiplier * goodsMultiplier);
    var agentFee = Math.round(Math.max(0, finite(input.cargoValue)) *
      Math.max(0, finite(input.agentRate)));
    return {
      minimumDays: minimum,
      typicalDays: typical,
      maximumDays: maximum,
      agentFee: agentFee,
      storageCost: Math.max(0, finite(input.storagePerDay)) * typical
    };
  }

  function shippingWeight(input) {
    var packages = Math.max(1, Math.floor(finite(input.packages, 1)));
    var actualWeight = packages * Math.max(0, finite(input.actualWeight));
    var divisor = Math.max(1, finite(input.divisor, 5000));
    var volumetricWeight = packages *
      Math.max(0, finite(input.length)) *
      Math.max(0, finite(input.width)) *
      Math.max(0, finite(input.height)) / divisor;
    var chargeableWeight = Math.max(actualWeight, volumetricWeight);
    var freight = chargeableWeight * Math.max(0, finite(input.rate));
    var fuel = freight * Math.max(0, finite(input.fuelRate)) / 100;
    var insurance = Math.max(0, finite(input.declaredValue)) *
      Math.max(0, finite(input.insuranceRate)) / 100;
    var fixedCharges = Math.max(0, finite(input.fixedCharges));
    var subtotal = freight + fuel + insurance + fixedCharges;
    var contingency = subtotal * Math.max(0, finite(input.contingencyRate)) / 100;
    return {
      packages: packages,
      actualWeight: actualWeight,
      volumetricWeight: volumetricWeight,
      chargeableWeight: chargeableWeight,
      freight: freight,
      fuel: fuel,
      insurance: insurance,
      fixedCharges: fixedCharges,
      contingency: contingency,
      total: subtotal + contingency
    };
  }

  return {
    proformaTotals: proformaTotals,
    packingTotals: packingTotals,
    billOfLadingDraft: billOfLadingDraft,
    crossBorderChecklist: crossBorderChecklist,
    crossBorderCountryProfile: crossBorderCountryProfile,
    customsTime: customsTime,
    customsClearanceModel: customsClearanceModel,
    shippingWeight: shippingWeight
  };
});
