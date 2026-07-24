(function initShippingCostPlanner(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ShippingCostPlanner = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createShippingCostPlanner() {
  "use strict";

  var VERSION = "shipping-cost-planner-2026-07-23";
  var LIMITS = {
    packageCount: 10000,
    weightKg: 1000000,
    dimensionCm: 100000,
    divisor: 1000000000,
    money: 1000000000000000,
    percentage: 100
  };
  var FIELDS = [
    "packageCount", "actualKgPerPackage", "lengthCm", "widthCm", "heightCm",
    "divisor", "ratePerKg", "fixedFees", "packagingFees", "fuelPct",
    "declaredValue", "insurancePct", "contingencyPct"
  ];

  function finiteNumber(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    var number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function normalize(input) {
    var values = {};
    FIELDS.forEach(function (field) { values[field] = finiteNumber(input && input[field]); });
    values.currencyLabel = String(input && input.currencyLabel || "").trim().slice(0, 16);
    return values;
  }

  function validate(input) {
    var values = normalize(input);
    var errors = [];
    if (!Number.isInteger(values.packageCount) || values.packageCount < 1 || values.packageCount > LIMITS.packageCount) errors.push("packageCount");
    if (!Number.isFinite(values.actualKgPerPackage) || values.actualKgPerPackage <= 0 || values.actualKgPerPackage > LIMITS.weightKg) errors.push("actualKgPerPackage");
    ["lengthCm", "widthCm", "heightCm"].forEach(function (field) {
      if (!Number.isFinite(values[field]) || values[field] <= 0 || values[field] > LIMITS.dimensionCm) errors.push(field);
    });
    if (!Number.isFinite(values.divisor) || values.divisor <= 0 || values.divisor > LIMITS.divisor) errors.push("divisor");
    ["ratePerKg", "fixedFees", "packagingFees", "declaredValue"].forEach(function (field) {
      if (!Number.isFinite(values[field]) || values[field] < 0 || values[field] > LIMITS.money) errors.push(field);
    });
    ["fuelPct", "insurancePct", "contingencyPct"].forEach(function (field) {
      if (!Number.isFinite(values[field]) || values[field] < 0 || values[field] > LIMITS.percentage) errors.push(field);
    });
    return { valid: errors.length === 0, errors: errors, values: values };
  }

  function calculate(input) {
    var validation = validate(input);
    if (!validation.valid) return validation;
    var v = validation.values;
    var actualTotalKg = v.packageCount * v.actualKgPerPackage;
    var volumetricTotalKg = v.packageCount * v.lengthCm * v.widthCm * v.heightCm / v.divisor;
    var chargeableKg = Math.max(actualTotalKg, volumetricTotalKg);
    var freight = chargeableKg * v.ratePerKg;
    var fuel = freight * v.fuelPct / 100;
    var insurance = v.declaredValue * v.insurancePct / 100;
    var subtotal = freight + fuel + insurance + v.fixedFees + v.packagingFees;
    var contingency = subtotal * v.contingencyPct / 100;
    var total = subtotal + contingency;
    var outputs = {
      actualTotalKg: actualTotalKg,
      volumetricTotalKg: volumetricTotalKg,
      chargeableKg: chargeableKg,
      freight: freight,
      fuel: fuel,
      insurance: insurance,
      fixedFees: v.fixedFees,
      packagingFees: v.packagingFees,
      subtotal: subtotal,
      contingency: contingency,
      total: total
    };
    if (Object.keys(outputs).some(function (key) { return !Number.isFinite(outputs[key]); })) {
      return { valid: false, errors: ["calculationRange"], values: v };
    }
    return {
      valid: true,
      errors: [],
      version: VERSION,
      inputs: v,
      outputs: outputs
    };
  }

  return { VERSION: VERSION, LIMITS: Object.assign({}, LIMITS), FIELDS: FIELDS.slice(), validate: validate, calculate: calculate };
});
