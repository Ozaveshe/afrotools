(function initDiscountPlanner(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.DiscountPlanner = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDiscountPlanner() {
  "use strict";

  var VERSION = "discount-planner-2026-07-23";
  var LIMITS = {
    price: 1000000000000000,
    quantity: 10000,
    percentage: 100,
    discounts: 5
  };

  function finiteNumber(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    var number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function optionalZero(value) {
    return value === "" || value === null || value === undefined ? 0 : finiteNumber(value);
  }

  function normalize(input) {
    var discounts = Array.isArray(input && input.discounts) ? input.discounts.slice(0, LIMITS.discounts + 1) : [];
    return {
      unitPrice: finiteNumber(input && input.unitPrice),
      quantity: finiteNumber(input && input.quantity),
      discounts: discounts.map(finiteNumber),
      taxPct: optionalZero(input && input.taxPct),
      currencyLabel: String(input && input.currencyLabel || "").trim().slice(0, 16)
    };
  }

  function validate(input) {
    var values = normalize(input);
    var errors = [];
    if (!Number.isFinite(values.unitPrice) || values.unitPrice < 0 || values.unitPrice > LIMITS.price) errors.push("unitPrice");
    if (!Number.isInteger(values.quantity) || values.quantity < 1 || values.quantity > LIMITS.quantity) errors.push("quantity");
    if (values.discounts.length < 1 || values.discounts.length > LIMITS.discounts) errors.push("discounts");
    values.discounts.forEach(function (discount, index) {
      if (!Number.isFinite(discount) || discount < 0 || discount > LIMITS.percentage) errors.push("discount-" + index);
    });
    if (!Number.isFinite(values.taxPct) || values.taxPct < 0 || values.taxPct > LIMITS.percentage) errors.push("taxPct");
    return { valid: errors.length === 0, errors: errors, values: values };
  }

  function calculate(input) {
    var validation = validate(input);
    if (!validation.valid) return validation;
    var v = validation.values;
    var originalSubtotal = v.unitPrice * v.quantity;
    var discountFactor = v.discounts.reduce(function (factor, discount) {
      return factor * (1 - discount / 100);
    }, 1);
    var discountedUnitPrice = v.unitPrice * discountFactor;
    var discountedSubtotal = discountedUnitPrice * v.quantity;
    var savings = originalSubtotal - discountedSubtotal;
    var effectiveDiscountPct = (1 - discountFactor) * 100;
    var taxAmount = discountedSubtotal * v.taxPct / 100;
    var finalTotal = discountedSubtotal + taxAmount;
    var rawOutputs = {
      originalSubtotal: originalSubtotal,
      discountedUnitPrice: discountedUnitPrice,
      discountedSubtotal: discountedSubtotal,
      savings: savings,
      effectiveDiscountPct: effectiveDiscountPct,
      taxAmount: taxAmount,
      finalTotal: finalTotal
    };
    if (Object.keys(rawOutputs).some(function (key) { return !Number.isFinite(rawOutputs[key]); })) {
      return { valid: false, errors: ["calculationRange"], values: v };
    }
    var outputs = {};
    Object.keys(rawOutputs).forEach(function (key) {
      outputs[key] = Number(rawOutputs[key].toPrecision(15));
    });
    return { valid: true, errors: [], version: VERSION, inputs: v, outputs: outputs };
  }

  return {
    VERSION: VERSION,
    LIMITS: Object.assign({}, LIMITS),
    validate: validate,
    calculate: calculate
  };
});
