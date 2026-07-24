const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/market-stall-profit.js");

function fixture(overrides = {}) {
  return Object.assign({
    currency: "KES",
    marketDays: 24,
    reinvestRate: 60,
    items: [
      { name: "Tomatoes", unitCost: 50, unitPrice: 80, unitsSold: 10, unitsLost: 2 },
      { name: "Onions", unitCost: 40, unitPrice: 70, unitsSold: 5, unitsLost: 0 }
    ],
    expenses: [
      { name: "Transport", amount: 100 },
      { name: "Market fee", amount: 50 }
    ]
  }, overrides);
}

test("calculates sold stock, loss, expenses, contribution and profit exactly", () => {
  const result = engine.calculate(fixture());
  assert.equal(result.valid, true);
  assert.deepEqual(result.outputs, {
    revenue: 1150,
    soldStockCost: 700,
    stockLossCost: 100,
    grossContribution: 450,
    operatingExpenses: 150,
    netDailyProfit: 200,
    netMarginPct: 17.39,
    contributionRatioPct: 39.13,
    breakEvenRevenue: 638.89,
    reinvestmentAllocation: 120,
    unallocatedPositiveProfit: 80,
    monthlyScenario: {
      days: 24,
      revenue: 27600,
      soldStockCost: 16800,
      stockLossCost: 2400,
      operatingExpenses: 3600,
      netProfit: 4800
    }
  });
});

test("loss and zero-revenue scenarios never invent positive allocations", () => {
  const loss = engine.calculate(fixture({
    items: [{ name: "Greens", unitCost: 100, unitPrice: 50, unitsSold: 2, unitsLost: 1 }],
    expenses: [{ name: "Transport", amount: 25 }]
  }));
  assert.equal(loss.outputs.netDailyProfit, -225);
  assert.equal(loss.outputs.reinvestmentAllocation, 0);
  assert.equal(loss.outputs.unallocatedPositiveProfit, 0);
  assert.equal(loss.outputs.breakEvenRevenue, null);

  const zero = engine.calculate(fixture({
    items: [{ name: "Closed day", unitCost: 100, unitPrice: 0, unitsSold: 0, unitsLost: 0 }],
    expenses: []
  }));
  assert.equal(zero.outputs.revenue, 0);
  assert.equal(zero.outputs.netMarginPct, null);
  assert.equal(zero.outputs.breakEvenRevenue, null);
});

test("same-mix break-even covers stock loss and operating expenses via contribution ratio", () => {
  const result = engine.calculate(fixture({
    items: [{ name: "Fabric", unitCost: 60, unitPrice: 100, unitsSold: 10, unitsLost: 1 }],
    expenses: [{ name: "Stall", amount: 140 }],
    reinvestRate: 0
  }));
  assert.equal(result.outputs.contributionRatioPct, 40);
  assert.equal(result.outputs.breakEvenRevenue, 500);
  assert.equal(result.outputs.netDailyProfit, 200);
});

test("rounding is deterministic and results do not mutate input", () => {
  const input = fixture({
    items: [{ name: "Spice", unitCost: 1.111, unitPrice: 2.222, unitsSold: 3, unitsLost: 1 }],
    expenses: [{ name: "Bag", amount: 0.335 }]
  });
  const snapshot = JSON.stringify(input);
  const first = engine.calculate(input);
  const second = engine.calculate(input);
  assert.deepEqual(first, second);
  assert.equal(first.outputs.revenue, 6.67);
  assert.equal(first.outputs.soldStockCost, 3.33);
  assert.equal(first.outputs.stockLossCost, 1.11);
  assert.equal(first.outputs.operatingExpenses, 0.34);
  assert.equal(JSON.stringify(input), snapshot);
});

test("unsafe text is normalized and invalid bounds fail closed", () => {
  const safe = engine.calculate(fixture({
    currency: "KES",
    items: [{ name: '<img src=x onerror="boom"> Tomatoes', unitCost: 1, unitPrice: 2, unitsSold: 1, unitsLost: 0 }]
  }));
  assert.equal(safe.valid, true);
  assert.doesNotMatch(JSON.stringify(safe), /<img|onerror=/i);

  [
    fixture({ currency: "" }),
    fixture({ marketDays: 0 }),
    fixture({ marketDays: 32 }),
    fixture({ reinvestRate: 101 }),
    fixture({ items: [] }),
    fixture({ items: [{ name: "", unitCost: 1, unitPrice: 2, unitsSold: 1, unitsLost: 0 }] }),
    fixture({ items: [{ name: "Bad", unitCost: -1, unitPrice: 2, unitsSold: 1, unitsLost: 0 }] }),
    fixture({ expenses: [{ name: "Bad", amount: -1 }] })
  ].forEach((input) => assert.equal(engine.calculate(input).valid, false));
});

test("coordinated caps preserve cent-safe arithmetic and reject larger inputs", () => {
  const boundary = engine.calculate(fixture({
    marketDays: 31,
    items: Array.from({ length: 20 }, (_, index) => ({
      name: `Item ${index + 1}`, unitCost: 1000000, unitPrice: 1000000,
      unitsSold: 100000, unitsLost: 100000
    })),
    expenses: Array.from({ length: 20 }, (_, index) => ({ name: `Expense ${index + 1}`, amount: 1000000 }))
  }));
  assert.equal(boundary.valid, true);
  assert.ok(Math.abs(boundary.outputs.monthlyScenario.revenue * 100) <= Number.MAX_SAFE_INTEGER);
  assert.equal(engine.calculate(fixture({
    items: [{ name: "Too large", unitCost: 1000001, unitPrice: 2, unitsSold: 1, unitsLost: 0 }]
  })).valid, false);
  assert.equal(engine.calculate(fixture({
    items: [{ name: "Too many", unitCost: 1, unitPrice: 2, unitsSold: 100001, unitsLost: 0 }]
  })).valid, false);
});
