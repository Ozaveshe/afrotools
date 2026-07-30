"use strict";

const assert = require("assert");
const { routes } = require("../scripts/lib/fr-small-business-parity-config");
const engine = require("../assets/js/engines/small-business-parity");

const frozen = {
  "startup-runway": { cash: 12000000, revenue: 3000000 },
  "tam-sam-som": { tam: 5000000000, sam: 1250000000 },
  "unit-economics": { realisedPrice: 14550, contributionUnit: 8550 },
  "churn-rate": { churned: 70, customerChurnPct: 7.000000000000001 },
  "burn-rate": { cash: 18000000, revenue: 4000000 },
  "cash-flow-forecast": { yearRevenue: 70960147.8076965, yearEndBalance: 29621686.46750245 },
  "pos-agent": { completedDailyTransactions: 77.6, commissionPerTransaction: 50 },
  "mini-importation": { productCost: 496000, duty: 129200 },
  "mama-put": { revenue: 200000, ingredientTotal: 72000 },
  "marketplace-fees": { price: 25000, fees: 6100 },
  "brand-collab-roi": { grossProfit: 1350000, contribution: 350000 },
  "business-continuity": { threatCount: 2, rto: "4 heures" },
  "event-decoration-cost": { subtotal: 1160000, contingency: 116000 },
  "factory-setup-cost": { subtotal: 104000000, workingCapital: 18000000 },
  "fashion-brand-startup": { cogs: 12700, setup: 1950000 },
  "freelance-contract": { fee: 750000 },
  "freelancer-rate": { requiredBilling: 1562500, dayRate: 104166.66666666667 },
  "graphic-design-pricing": { labour: 450000, expenses: 50000 },
  "guard-service-cost": { guards: 6, companyMonthly: 1230000 },
  "influencer-rate": { labour: 240000, production: 100000 },
  "made-in-africa-label": { originatingValue: 750000, originatingPct: 75 },
  "nafdac-registration": { officialTotal: 100000, supportCosts: 150000 },
  "oee-calculator": { plannedMinutes: 450, runMinutes: 405 },
  "packaging-cost": { baseUnitCost: 260, wasteCost: 7.8 },
  "production-cost": { startedUnits: 1000, goodUnits: 950 },
  "quality-sampling": { outcome: "ACCEPTER selon le plan saisi", samplePct: 8 },
  "tailoring-pricing": { labourCost: 60000, costFloor: 115500.00000000001 },
  "youtube-revenue": { youtubeRevenue: 750, effectiveRpm: 1.5 }
};

assert.strictEqual(routes.length, 28, "the exact SME denominator must remain 28");
assert.strictEqual(new Set(routes.map(({ id }) => id)).size, 28, "English ids must be unique");
assert.strictEqual(new Set(routes.map(({ slug }) => slug)).size, 28, "French slugs must be unique");
assert.deepStrictEqual(Object.keys(frozen).sort(), routes.map(({ id }) => id).sort(), "every route needs a frozen oracle");

for (const route of routes) {
  const input = Object.fromEntries(route.fields.map((field) => [field.name, field.value]));
  const result = engine.calculate(route.id, input);
  assert.strictEqual(result.ok, true, `${route.id} default fixture must calculate`);
  for (const [key, expected] of Object.entries(frozen[route.id])) {
    assert.strictEqual(result.values[key], expected, `${route.id}.${key} drifted from the frozen English oracle`);
  }
}

assert.deepStrictEqual(engine.calculate("unknown-tool", {}), {
  ok: false,
  error: "Outil non pris en charge."
});

console.log("PASS fr-small-business engine parity: 28/28 frozen fixtures");
