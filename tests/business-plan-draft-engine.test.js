const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/business-plan-draft.js");

function fixture(overrides = {}) {
  return Object.assign({ currency: "KES", monthlyRevenue: 100000, monthlyVariableCosts: 40000,
    monthlyFixedCosts: 30000, startupNeed: 180000, workingCapitalNeed: 60000,
    confirmedFunding: 90000, scenarioChangePct: 20 }, overrides);
}

test("calculates contribution, profit, funding gap, break-even and simple payback", () => {
  const r = engine.calculate(fixture());
  assert.equal(r.valid, true);
  assert.equal(r.outputs.grossContribution, 60000);
  assert.equal(r.outputs.operatingProfit, 30000);
  assert.equal(r.outputs.fundingGap, 150000);
  assert.equal(r.outputs.fundingSurplus, 0);
  assert.equal(r.outputs.breakEvenRevenue, 50000);
  assert.equal(r.outputs.simplePaybackMonths, 8);
  assert.equal(r.outputs.annual.operatingProfit, 360000);
  assert.deepEqual(r.outputs.scenarios.low, { revenue: 80000, variableCosts: 32000, fixedCosts: 30000, grossContribution: 48000, operatingProfit: 18000 });
  assert.deepEqual(r.outputs.scenarios.high, { revenue: 120000, variableCosts: 48000, fixedCosts: 30000, grossContribution: 72000, operatingProfit: 42000 });
});

test("zero revenue and losses stay explicit and do not invent payback or break-even", () => {
  const r = engine.calculate(fixture({ monthlyRevenue: 0, monthlyVariableCosts: 0 }));
  assert.equal(r.outputs.operatingProfit, -30000);
  assert.equal(r.outputs.grossMarginPct, null);
  assert.equal(r.outputs.breakEvenRevenue, null);
  assert.equal(r.outputs.simplePaybackMonths, null);
});

test("confirmed funding can produce a surplus without a negative gap", () => {
  const r = engine.calculate(fixture({ confirmedFunding: 300000 }));
  assert.equal(r.outputs.fundingGap, 0);
  assert.equal(r.outputs.fundingSurplus, 60000);
});

test("input is not mutated, unsafe text is stripped and bounds fail closed", () => {
  const input = fixture({ currency: "XOF" });
  const before = JSON.stringify(input);
  assert.deepEqual(engine.calculate(input), engine.calculate(input));
  assert.equal(JSON.stringify(input), before);
  assert.equal(engine.cleanText('<img src=x onerror="boom"> Acme', 60), "Acme");
  [fixture({ currency: "" }), fixture({ monthlyRevenue: -1 }), fixture({ monthlyRevenue: 1000000000001 }),
    fixture({ scenarioChangePct: 101 }), fixture({ monthlyFixedCosts: Infinity })]
    .forEach(x => assert.equal(engine.calculate(x).valid, false));
});

test("maximum coordinated inputs remain cent-safe through annual and high scenarios", () => {
  const r = engine.calculate(fixture({ monthlyRevenue: 1000000000000, monthlyVariableCosts: 1000000000000,
    monthlyFixedCosts: 1000000000000, startupNeed: 1000000000000, workingCapitalNeed: 1000000000000,
    confirmedFunding: 1000000000000, scenarioChangePct: 100 }));
  assert.equal(r.valid, true);
  const values = [r.outputs.annual.revenue, r.outputs.annual.variableCosts, r.outputs.annual.fixedCosts,
    r.outputs.scenarios.high.revenue, r.outputs.scenarios.high.variableCosts];
  values.forEach(x => assert.ok(Math.abs(x * 100) <= Number.MAX_SAFE_INTEGER));
});
