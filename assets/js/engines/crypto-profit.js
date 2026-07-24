(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.cryptoProfit = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LIMITS = Object.freeze({
    unitPrice: 1000000000000000,
    quantity: 1000000000,
    flatFee: 1000000000000000,
    money: Number.MAX_SAFE_INTEGER
  });

  function number(value, name, options) {
    var parsed = Number(value);
    var opts = options || {};
    if (!Number.isFinite(parsed)) throw new Error(name + " must be a finite number.");
    if (opts.positive && parsed <= 0) throw new Error(name + " must be greater than zero.");
    if (!opts.positive && parsed < 0) throw new Error(name + " cannot be negative.");
    if (opts.max != null && parsed > opts.max) throw new Error(name + " exceeds the supported limit.");
    return parsed;
  }

  function money(value, name) {
    if (!Number.isFinite(value) || Math.abs(value) > LIMITS.money) {
      throw new Error(name + " exceeds the safe calculation limit.");
    }
    return value;
  }

  function fee(spec, base, name) {
    var input = spec || {};
    var type = input.type === "flat" ? "flat" : input.type === "percent" ? "percent" : "";
    if (!type) throw new Error(name + " fee type must be percent or flat.");
    var value = number(input.value, name + " fee", {
      max: type === "flat" ? LIMITS.flatFee : 100
    });
    if (type === "percent" && value >= 100) {
      throw new Error(name + " fee percentage must be below 100.");
    }
    return {
      type: type,
      value: value,
      amount: money(type === "percent" ? base * value / 100 : value, name + " fee amount")
    };
  }

  function calculate(input) {
    var values = input || {};
    var buyPrice = number(values.buyPrice, "Buy price", { positive: true, max: LIMITS.unitPrice });
    var sellPrice = number(values.sellPrice, "Sell price", { positive: true, max: LIMITS.unitPrice });
    var quantity = number(values.quantity, "Quantity", { positive: true, max: LIMITS.quantity });
    var acquisitionValue = money(buyPrice * quantity, "Acquisition value");
    var disposalValue = money(sellPrice * quantity, "Sale value");
    var buyFee = fee(values.buyFee, acquisitionValue, "Buy");
    var sellFee = fee(values.sellFee, disposalValue, "Sell");
    var totalCost = money(acquisitionValue + buyFee.amount, "Total acquisition cost");
    var netProceeds = money(disposalValue - sellFee.amount, "Net sale proceeds");
    var netProfit = money(netProceeds - totalCost, "Net profit or loss");
    var roi = netProfit / totalCost * 100;
    var breakEvenPrice = money(sellFee.type === "percent"
      ? totalCost / (quantity * (1 - sellFee.value / 100))
      : money(totalCost + sellFee.amount, "Break-even cost") / quantity, "Break-even price");

    return Object.freeze({
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      quantity: quantity,
      acquisitionValue: acquisitionValue,
      disposalValue: disposalValue,
      buyFee: Object.freeze(buyFee),
      sellFee: Object.freeze(sellFee),
      totalFees: money(buyFee.amount + sellFee.amount, "Total fees"),
      totalCost: totalCost,
      netProceeds: netProceeds,
      netProfit: netProfit,
      roi: roi,
      breakEvenPrice: breakEvenPrice
    });
  }

  function scenarios(input, prices) {
    if (!Array.isArray(prices)) throw new Error("Scenario prices must be an array.");
    return prices.map(function (price) {
      return calculate(Object.assign({}, input, { sellPrice: price }));
    });
  }

  return {
    LIMITS: LIMITS,
    calculate: calculate,
    scenarios: scenarios
  };
});
