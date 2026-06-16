#!/usr/bin/env node

const assert = require("assert");
const workflow = require("../assets/js/ai/construction-workflow.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const manifest = manifestApi.getToolManifestForRouter();

function route(query) {
  return router.routeDeterministically(query, { manifest });
}

function build(query, inputs) {
  return workflow.buildConstructionPlan(inputs || {}, { query });
}

function hasTool(plan, id) {
  return (plan.nextTools || []).some((tool) => tool.id === id);
}

function assertPlanningWarning(plan) {
  assert.match(plan.warning, /Planning estimate only/i);
  assert.match(plan.warning, /professional architectural\/engineering sign-off/i);
  assert.doesNotMatch(plan.planningBrief, /certified|guaranteed|approved/i);
}

const beninPlan = build("Design a simple 2-bedroom floor plan for a 450 sqm plot in Benin City");
assert.strictEqual(beninPlan.kind, "construction_assistant");
assert.strictEqual(beninPlan.inputs.country, "Nigeria");
assert.strictEqual(beninPlan.inputs.city, "Benin City");
assert.strictEqual(beninPlan.inputs.plotSize, 450);
assert.strictEqual(beninPlan.inputs.plotUnit, "sqm");
assert.strictEqual(beninPlan.inputs.rooms.bedrooms, 2);
assert.strictEqual(beninPlan.selectedToolId, "afroplan-floor-planner");
assert.strictEqual(beninPlan.materialEstimateToolId, "building-materials");
assert.ok(beninPlan.materialEstimate.blocks > 0);
assert.ok(hasTool(beninPlan, "building-permit"));
assert.ok(hasTool(beninPlan, "survey-cost"));
assertPlanningWarning(beninPlan);
assert.match(workflow.renderConstructionPanel(beninPlan), /Planning brief/);
assert.match(workflow.renderConstructionPanel(beninPlan), /Planning estimate only/);

const blocksPlan = build("Estimate blocks and cement for a small room");
assert.strictEqual(blocksPlan.workflowKind, "materials");
assert.strictEqual(blocksPlan.selectedToolId, "building-materials");
assert.strictEqual(blocksPlan.inputs.rooms.count, 1);
assert.ok(blocksPlan.materialEstimate.blocks >= 100);
assert.ok(blocksPlan.materialEstimate.totalCementBagsPlanningRange[1] > blocksPlan.materialEstimate.totalCementBagsPlanningRange[0]);
assertPlanningWarning(blocksPlan);

const cadPlan = build("Create a CAD-like plan in AfroDraft for a shop in Accra on a 300 sqm plot");
assert.strictEqual(cadPlan.selectedToolId, "afrodraft");
assert.strictEqual(cadPlan.inputs.city, "Accra");
assert.strictEqual(cadPlan.inputs.country, "Ghana");
assert.strictEqual(cadPlan.inputs.outputDesired, "CAD-like plan");
assert.ok(hasTool(cadPlan, "afrodraft"));

const boqPlan = build("BOQ for a 3 bedroom bungalow in Nairobi with KES 5m budget");
assert.strictEqual(boqPlan.selectedToolId, "boq-generator");
assert.strictEqual(boqPlan.inputs.country, "Kenya");
assert.strictEqual(boqPlan.inputs.budget, 5000000);
assert.strictEqual(boqPlan.inputs.currency, "KES");
assert.strictEqual(boqPlan.inputs.rooms.bedrooms, 3);
assert.ok(hasTool(boqPlan, "boq-generator"));

const landPlan = build("Convert a 50 by 100 plot for a duplex in Lagos");
assert.strictEqual(landPlan.selectedToolId, "land-size");
assert.strictEqual(landPlan.inputs.city, "Lagos");
assert.strictEqual(landPlan.inputs.plotSize, 5000);
assert.strictEqual(landPlan.inputs.plotLength, 50);
assert.strictEqual(landPlan.inputs.plotWidth, 100);

const fixtures = [
  ["Design a simple 2-bedroom floor plan for a 450 sqm plot in Benin City", "afroplan-floor-planner", "none"],
  ["Estimate blocks and cement for a small room", "building-materials", "legal"],
  ["Create a CAD-like plan in AfroDraft for a shop in Accra on a 300 sqm plot", "afrodraft", "none"],
  ["BOQ for a 3 bedroom bungalow in Nairobi with KES 5m budget", "boq-generator", "legal"],
  ["Convert a 50 by 100 plot for a duplex in Lagos", "land-size", "none"],
];

for (const [query, expectedToolId, expectedDomain] of fixtures) {
  const decision = route(query);
  const validation = router.validateRouterOutput(decision);
  assert.deepStrictEqual(validation.errors, [], query);
  assert.strictEqual(decision.selectedToolId, expectedToolId, query);
  assert.strictEqual(decision.safetyDomain, expectedDomain, query);
  assert.ok(decision.selectedRoute.startsWith("/"), query);
}

const beninRoute = route("Design a simple 2-bedroom floor plan for a 450 sqm plot in Benin City");
assert.strictEqual(beninRoute.extractedInputs.country, "Nigeria");
assert.strictEqual(beninRoute.extractedInputs.city, "Benin City");
assert.strictEqual(beninRoute.extractedInputs.plotSize, 450);
assert.strictEqual(beninRoute.extractedInputs.rooms.bedrooms, 2);

console.log("AI construction workflow validated: floor plan, materials, AfroDraft, BOQ, land-size routing, and planning warnings.");
