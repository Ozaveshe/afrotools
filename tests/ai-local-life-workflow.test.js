#!/usr/bin/env node

const assert = require("assert");
const workflow = require("../assets/js/ai/local-life-workflow.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const manifest = manifestApi.getToolManifestForRouter();

function build(query, inputs) {
  return workflow.buildLocalLifePlan(inputs || {}, { query });
}

function hasTool(plan, id) {
  return (plan.nextTools || []).some((tool) => tool.id === id);
}

function hasSource(plan, id) {
  return (plan.sourceState || []).some((source) => source.id === id);
}

function assertLocalLifePlan(plan, cityName) {
  assert.strictEqual(plan.kind, "local_life");
  assert.strictEqual(plan.cityProfile.city, cityName);
  assert.ok(plan.monthlyTotal > 0);
  assert.ok(Array.isArray(plan.budgetBreakdown));
  assert.ok(plan.budgetBreakdown.length >= 5);
  assert.ok(Array.isArray(plan.missingCostsChecklist));
  assert.ok(plan.missingCostsChecklist.some((item) => /rent quote/i.test(item)));
  assert.ok(hasTool(plan, "cost-of-living"));
  assert.ok(hasTool(plan, "rent-affordability"));
  assert.ok(hasTool(plan, "japa-calculator"));
  assert.ok(hasTool(plan, "currency-converter"));
  assert.ok(hasSource(plan, "local-life-planning-estimates"));
  assert.ok(hasSource(plan, "forex-third-party-snapshot"));
  assert.ok(plan.warning.includes("Estimate only"));
}

const accra = build("Can I live in Accra on GHS 9000 per month?");
assertLocalLifePlan(accra, "Accra");
assert.strictEqual(accra.inputs.currency, "GHS");
assert.strictEqual(accra.inputs.budget, 9000);
assert.ok(accra.affordability.label);
assert.match(workflow.renderLocalLifePanel(accra), /Budget breakdown/);
assert.match(workflow.renderLocalLifePanel(accra), /Estimate only/);

const lagos = build("Can I live in Lagos on NGN 900000 per month with public transport?");
assertLocalLifePlan(lagos, "Lagos");
assert.strictEqual(lagos.inputs.transportAssumption, "public");
assert.strictEqual(lagos.inputs.currency, "NGN");

const nairobi = build("How much should I save before moving from Lagos to Nairobi in 6 months?");
assertLocalLifePlan(nairobi, "Nairobi");
assert.strictEqual(nairobi.workflowKind, "relocation");
assert.strictEqual(nairobi.inputs.originCity, "Lagos");
assert.strictEqual(nairobi.inputs.originCountry, "Nigeria");
assert.strictEqual(nairobi.inputs.timelineMonths, 6);
assert.ok(nairobi.relocationEstimate.targetSavings > nairobi.monthlyTotal);
assert.ok(nairobi.relocationEstimate.timelineMonthlySavings > 0);

const johannesburg = build("Johannesburg rent affordability on ZAR 32000 income for 2 people with own car");
assertLocalLifePlan(johannesburg, "Johannesburg");
assert.strictEqual(johannesburg.workflowKind, "rent");
assert.strictEqual(johannesburg.inputs.householdSize, 2);
assert.strictEqual(johannesburg.inputs.transportAssumption, "private");
assert.ok(johannesburg.budgetBreakdown.find((item) => item.label === "Transport").amount > 0);

const kigali = build("Kigali family budget with RWF 2500000, rent override 800000 and school fees 300000", {
  rentOverride: 800000,
  schoolFeesOverride: 300000,
});
assertLocalLifePlan(kigali, "Kigali");
assert.strictEqual(kigali.inputs.rentOverride, 800000);
assert.strictEqual(kigali.inputs.schoolFeesOverride, 300000);
assert.ok(kigali.manualOverrides.some((item) => item.label === "Rent"));
assert.ok(kigali.manualOverrides.some((item) => item.label === "School fees"));

const missing = build("Can I live on GHS X per month?");
assert.ok(missing.missingInputs.includes("destinationCity"));
assert.ok(missing.missingInputs.includes("budget"));
assert.strictEqual(missing.affordability.status, "budget_needed");

const routedLive = router.routeDeterministically("Can I live in Accra on GHS 9000 per month?", { manifest });
assert.strictEqual(routedLive.selectedToolId, "cost-of-living");
assert.strictEqual(routedLive.intentCategory, "local-life");

const routedMove = router.routeDeterministically("How much should I save before moving from Lagos to Nairobi?", { manifest });
assert.strictEqual(routedMove.selectedToolId, "japa-calculator");

console.log("AI local life workflow validated: Lagos, Accra, Nairobi, Johannesburg, Kigali, manual overrides, source warnings, and routing.");
