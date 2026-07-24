#!/usr/bin/env node
"use strict";
const assert = require("assert");
const engine = require("../assets/js/engines/crypto-mining-margin.js");

function base(overrides) {
  return Object.assign({
    grossCoinPerDay: 2,
    coinPrice: 100,
    powerWatts: 1000,
    uptimeHours: 10,
    electricityRate: 2,
    poolFeePercent: 10,
    otherDailyCost: 10,
    hardwareCost: 300,
    periodDays: 30
  }, overrides || {});
}

const result = engine.calculate(base());
assert.strictEqual(result.grossRevenueDaily, 200);
assert.strictEqual(result.poolFeeDaily, 20);
assert.strictEqual(result.netCoinPerDay, 1.8);
assert.strictEqual(result.energyKwhDaily, 10);
assert.strictEqual(result.energyCostDaily, 20);
assert.strictEqual(result.operatingCostDaily, 30);
assert.strictEqual(result.totalDeductionsDaily, 50);
assert.strictEqual(result.netResultDaily, 150);
assert.strictEqual(result.marginPercent, 75);
assert.strictEqual(result.breakEvenCoinPrice, 30 / 1.8);
assert.strictEqual(result.costPerNetCoin, 30 / 1.8);
assert.strictEqual(result.grossRevenuePeriod, 6000);
assert.strictEqual(result.netResultPeriod, 4500);
assert.strictEqual(result.hardwarePaybackDays, 2);

assert.strictEqual(engine.calculate(base({ hardwareCost: 0 })).hardwarePaybackDays, null);
assert.strictEqual(engine.calculate(base({ electricityRate: 20 })).hardwarePaybackDays, null);
assert.strictEqual(engine.calculate(base({ poolFeePercent: 0, electricityRate: 0, otherDailyCost: 0 })).netResultDaily, 200);
assert.throws(() => engine.calculate(base({ poolFeePercent: 100 })), /supported limit/);
assert.throws(() => engine.calculate(base({ uptimeHours: 25 })), /supported limit/);
assert.throws(() => engine.calculate(base({ grossCoinPerDay: -1 })), /at least/);
assert.throws(() => engine.calculate(base({ coinPrice: Infinity })), /finite/);
assert.throws(() => engine.calculate(base({ grossCoinPerDay: engine.LIMITS.coinPerDay, coinPrice: engine.LIMITS.coinPrice })), /safe arithmetic/);
assert.throws(() => engine.calculate(base({ periodDays: 30.5 })), /whole number/);
console.log("crypto mining margin engine: ok");
