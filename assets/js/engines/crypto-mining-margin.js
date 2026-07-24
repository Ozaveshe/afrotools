(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.cryptoMiningMargin = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MAX_MONEY = Number.MAX_SAFE_INTEGER;
  var LIMITS = Object.freeze({
    coinPerDay: 1000000000,
    coinPrice: 1000000000000000,
    powerWatts: 1000000000,
    electricityRate: 1000000000000,
    otherDailyCost: 1000000000000000,
    hardwareCost: 1000000000000000,
    periodDays: 3650,
    money: MAX_MONEY
  });

  function finite(name, value, minimum, maximum) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new Error(name + " must be a finite number.");
    if (number < minimum) throw new Error(name + " must be at least " + minimum + ".");
    if (number > maximum) throw new Error(name + " exceeds the supported limit.");
    return number;
  }

  function safe(name, value) {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_MONEY) {
      throw new Error(name + " exceeds the supported safe arithmetic range.");
    }
    return value;
  }

  function calculate(input) {
    input = input || {};
    var grossCoinPerDay = finite("Gross coin output per day", input.grossCoinPerDay, Number.EPSILON, LIMITS.coinPerDay);
    var coinPrice = finite("Coin price", input.coinPrice, Number.EPSILON, LIMITS.coinPrice);
    var powerWatts = finite("Power", input.powerWatts, 0, LIMITS.powerWatts);
    var uptimeHours = finite("Uptime hours", input.uptimeHours, 0, 24);
    var electricityRate = finite("Electricity rate", input.electricityRate, 0, LIMITS.electricityRate);
    var poolFeePercent = finite("Pool fee", input.poolFeePercent, 0, 99.999999);
    var otherDailyCost = finite("Other daily cost", input.otherDailyCost, 0, LIMITS.otherDailyCost);
    var hardwareCost = finite("Hardware cost", input.hardwareCost || 0, 0, LIMITS.hardwareCost);
    var periodDays = finite("Period days", input.periodDays, 1, LIMITS.periodDays);
    if (!Number.isInteger(periodDays)) throw new Error("Period days must be a whole number.");

    var grossRevenueDaily = safe("Gross daily revenue", grossCoinPerDay * coinPrice);
    var poolFeeDaily = safe("Daily pool fee", grossRevenueDaily * poolFeePercent / 100);
    var netCoinPerDay = safe("Net daily coin output", grossCoinPerDay * (1 - poolFeePercent / 100));
    var energyKwhDaily = safe("Daily energy use", powerWatts / 1000 * uptimeHours);
    var energyCostDaily = safe("Daily energy cost", energyKwhDaily * electricityRate);
    var operatingCostDaily = safe("Daily operating cost", energyCostDaily + otherDailyCost);
    var totalDeductionsDaily = safe("Daily deductions", poolFeeDaily + operatingCostDaily);
    var netResultDaily = safe("Daily net result", grossRevenueDaily - totalDeductionsDaily);
    var marginPercent = safe("Operating margin", netResultDaily / grossRevenueDaily * 100);
    var breakEvenCoinPrice = safe("Break-even coin price", operatingCostDaily / netCoinPerDay);
    var costPerNetCoin = breakEvenCoinPrice;
    var hardwarePaybackDays = hardwareCost > 0 && netResultDaily > 0
      ? safe("Simple hardware payback", hardwareCost / netResultDaily)
      : null;

    return Object.freeze({
      grossCoinPerDay: grossCoinPerDay,
      netCoinPerDay: netCoinPerDay,
      coinPrice: coinPrice,
      poolFeePercent: poolFeePercent,
      grossRevenueDaily: grossRevenueDaily,
      poolFeeDaily: poolFeeDaily,
      energyKwhDaily: energyKwhDaily,
      energyCostDaily: energyCostDaily,
      otherDailyCost: otherDailyCost,
      operatingCostDaily: operatingCostDaily,
      totalDeductionsDaily: totalDeductionsDaily,
      netResultDaily: netResultDaily,
      marginPercent: marginPercent,
      breakEvenCoinPrice: breakEvenCoinPrice,
      costPerNetCoin: costPerNetCoin,
      periodDays: periodDays,
      grossRevenuePeriod: safe("Period gross revenue", grossRevenueDaily * periodDays),
      poolFeePeriod: safe("Period pool fee", poolFeeDaily * periodDays),
      energyKwhPeriod: safe("Period energy use", energyKwhDaily * periodDays),
      energyCostPeriod: safe("Period energy cost", energyCostDaily * periodDays),
      otherCostPeriod: safe("Period other cost", otherDailyCost * periodDays),
      netResultPeriod: safe("Period net result", netResultDaily * periodDays),
      hardwareCost: hardwareCost,
      hardwarePaybackDays: hardwarePaybackDays
    });
  }

  return Object.freeze({ LIMITS: LIMITS, calculate: calculate });
});
