const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

for (const file of ["engines/src/payment-comparator-engine.js", "engines/payment-comparator-engine.js"]) {
  test(file + " counts actual payments and preserves legacy schedules", () => {
    const ctx = vm.createContext({});
    for (const name of ["data/trade/b2b-payments-data.js",file]) {
      vm.runInContext(fs.readFileSync(path.join(__dirname,"..",name),"utf8"),ctx);
    }
    const engine = ctx.PaymentComparatorEngine;
    for (const [id,count] of Object.entries({monthly:12,weekly:48,four_per_month:48,weekly_52:52,daily:240,operating_days_20:240})) {
      const scenario = engine.calculateScenario(5000,id,"papss");
      assert.equal(scenario.paymentsPerYear,count);
      assert.equal(scenario.perTxnFee,53.5);
      assert.equal(scenario.annualFee,count * 53.5);
      assert.equal(scenario.annualVolume,count * 5000);
      assert.equal(scenario.monthlyFee,scenario.annualFee / 12);
    }
    assert.equal(engine.calculateScenario(5000,"unknown","papss"),null);
    assert.equal(engine.calculateScenario(-100,"monthly","papss"),null);
  });
}
