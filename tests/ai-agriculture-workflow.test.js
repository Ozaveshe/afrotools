#!/usr/bin/env node

const assert = require("assert");
const workflow = require("../assets/js/ai/agriculture-workflow.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const manifest = manifestApi.getToolManifestForRouter();

function route(query) {
  return router.routeDeterministically(query, { manifest });
}

function build(query, inputs) {
  return workflow.buildAgriculturePlan(inputs || {}, { query });
}

function hasTool(plan, id) {
  return (plan.recommendedCalculators || []).some((tool) => tool.id === id);
}

function assertPlanningWarning(plan) {
  assert.match(plan.warning, /Planning estimate only/i);
  assert.match(plan.warning, /Verify with local extension officers/i);
}

function assertSourceState(plan) {
  const sourceIds = (plan.sourceState || []).map((source) => source.id || source.sourceName);
  assert.ok(sourceIds.includes("agriculture-static-datasets"), "static agriculture source should be present");
  assert.ok(sourceIds.includes("commodity-price-snapshot"), "market/input price source should be present");
  const commodity = plan.sourceState.find((source) => source.id === "commodity-price-snapshot");
  assert.strictEqual(commodity.freshnessStatus, "stale");
  assert.strictEqual(commodity.confidence, "estimated");
}

const maizePlan = build("Estimate maize yield for a 2 hectare farm in Nigeria");
assert.strictEqual(maizePlan.kind, "agriculture_assistant");
assert.strictEqual(maizePlan.selectedToolId, "crop-yield-estimator");
assert.strictEqual(maizePlan.inputs.country, "Nigeria");
assert.strictEqual(maizePlan.inputs.crop, "maize");
assert.strictEqual(maizePlan.inputs.farmSize, 2);
assert.strictEqual(maizePlan.inputs.farmSizeUnit, "hectare");
assert.ok(hasTool(maizePlan, "fertilizer-calculator"));
assert.ok(hasTool(maizePlan, "commodity-prices"));
assertSourceState(maizePlan);
assertPlanningWarning(maizePlan);
assert.match(workflow.renderAgriculturePanel(maizePlan), /Farm planning brief/);
assert.match(workflow.renderAgriculturePanel(maizePlan), /Risk checklist/);
assert.match(workflow.renderAgriculturePanel(maizePlan), /Planning estimate only/);

const poultryPlan = build("Calculate poultry ROI for 500 broilers in Ghana");
assert.strictEqual(poultryPlan.selectedToolId, "poultry-roi-calculator");
assert.strictEqual(poultryPlan.inputs.country, "Ghana");
assert.strictEqual(poultryPlan.inputs.enterpriseType, "poultry");
assert.strictEqual(poultryPlan.inputs.birdCount, 500);
assert.ok(hasTool(poultryPlan, "input-prices"));
assert.match(poultryPlan.riskChecklist[0], /feed conversion/i);

const fishPlan = build("Plan tilapia fish farming for 1000 fingerlings in Kenya");
assert.strictEqual(fishPlan.selectedToolId, "fish-farming-roi");
assert.strictEqual(fishPlan.inputs.country, "Kenya");
assert.strictEqual(fishPlan.inputs.enterpriseType, "fish");
assert.strictEqual(fishPlan.inputs.fishCount, 1000);
assert.match(fishPlan.riskChecklist[0], /water quality/i);

const cocoaPlan = build("Cocoa farm gate price planning in Cote d'Ivoire");
assert.strictEqual(cocoaPlan.selectedToolId, "cocoa-tracker");
assert.strictEqual(cocoaPlan.inputs.country, "Cote d'Ivoire");
assert.strictEqual(cocoaPlan.inputs.countryCode, "CI");
assert.strictEqual(cocoaPlan.inputs.crop, "cocoa");
assert.ok(hasTool(cocoaPlan, "commodity-prices"));
assert.match(cocoaPlan.riskChecklist[0], /buyer grade/i);

const irrigationPlan = build("Plan irrigation for onions on 3 ha in Senegal");
assert.strictEqual(irrigationPlan.selectedToolId, "irrigation-calculator");
assert.strictEqual(irrigationPlan.inputs.country, "Senegal");
assert.strictEqual(irrigationPlan.inputs.crop, "onion");
assert.strictEqual(irrigationPlan.inputs.farmSize, 3);
assert.strictEqual(irrigationPlan.inputs.farmSizeUnit, "hectare");
assert.match(irrigationPlan.riskChecklist[0], /pump sizing/i);

const fixtures = [
  ["Estimate maize yield for a 2 hectare farm in Nigeria", "crop-yield-estimator", "none"],
  ["Calculate poultry ROI for 500 broilers in Ghana", "poultry-roi-calculator", "finance"],
  ["Plan tilapia fish farming for 1000 fingerlings in Kenya", "fish-farming-roi", "finance"],
  ["Cocoa farm gate price planning in Cote d'Ivoire", "cocoa-tracker", "finance"],
  ["Plan irrigation for onions on 3 ha in Senegal", "irrigation-calculator", "none"],
];

for (const [query, expectedToolId, expectedDomain] of fixtures) {
  const decision = route(query);
  const validation = router.validateRouterOutput(decision);
  assert.deepStrictEqual(validation.errors, [], query);
  assert.strictEqual(decision.selectedToolId, expectedToolId, query);
  assert.strictEqual(decision.safetyDomain, expectedDomain, query);
  assert.ok(decision.selectedRoute.startsWith("/"), query);
}

const maizeRoute = route("Estimate maize yield for a 2 hectare farm in Nigeria");
assert.strictEqual(maizeRoute.extractedInputs.country, "Nigeria");
assert.strictEqual(maizeRoute.extractedInputs.crop, "maize");
assert.strictEqual(maizeRoute.extractedInputs.farmSize, 2);

const poultryRoute = route("Calculate poultry ROI for 500 broilers in Ghana");
assert.strictEqual(poultryRoute.extractedInputs.country, "Ghana");
assert.strictEqual(poultryRoute.extractedInputs.birdCount, 500);

const fishRoute = route("Plan tilapia fish farming for 1000 fingerlings in Kenya");
assert.strictEqual(fishRoute.extractedInputs.country, "Kenya");
assert.strictEqual(fishRoute.extractedInputs.fishCount, 1000);

console.log("AI agriculture workflow validated: crop yield, poultry, fish farming, cocoa, irrigation, source confidence, and planning warnings.");
