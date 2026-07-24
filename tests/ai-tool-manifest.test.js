#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const directoryPath = path.join(ROOT, "data", "tool-directory.json");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const prefill = require("../assets/js/ai/prefill-adapters.js");

const directoryEntries = JSON.parse(fs.readFileSync(directoryPath, "utf8"));
const manifest = manifestApi.buildToolManifest(directoryEntries);
const validation = manifestApi.validateToolManifest(manifest);

assert.deepStrictEqual(validation.errors, [], "AI tool manifest should validate cleanly");
assert.ok(manifest.length >= 1000, `expected at least 1000 manifest entries, found ${manifest.length}`);
assert.strictEqual(manifest.length, directoryEntries.length, "canonical directory records should already have unique router-safe routes");

const routeOwners = new Map();
for (const entry of manifest) {
  for (const field of manifestApi.TOOL_MANIFEST_SCHEMA.requiredFields) {
    assert.notStrictEqual(entry[field], undefined, `${entry.id}.${field} should exist`);
    assert.notStrictEqual(entry[field], null, `${entry.id}.${field} should not be null`);
  }
  assert.ok(entry.route.startsWith("/"), `${entry.id} route should be root-relative`);
  const routeKey = entry.route.replace(/\/index\.html$/i, "/").replace(/\/$/, "").toLowerCase();
  assert.ok(!routeOwners.has(routeKey), `${entry.id} duplicates route owned by ${routeOwners.get(routeKey)}`);
  routeOwners.set(routeKey, entry.id);
}

const byId = new Map(manifest.map((entry) => [entry.id, entry]));

const marketStall = byId.get("market-stall-profit");
assert.ok(marketStall, "market-stall-profit should be present");
assert.deepStrictEqual(marketStall.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(marketStall.requiredInputs, []);
assert.deepStrictEqual(marketStall.optionalInputs, []);
assert.deepStrictEqual(marketStall.outputTypes, ["number", "table", "pdf", "json", "report"]);
assert.strictEqual(marketStall.privacyMode, "browser_local");
assert.strictEqual(marketStall.sourcePolicy, "user_input");
assert.strictEqual(marketStall.highStakesDomain, "finance");
assert.deepStrictEqual(marketStall.monetizationSurfaces, []);
assert.strictEqual(prefill.getPrefillAdapter("market-stall-profit"), null);

const businessPlanDraft = byId.get("business-plan-builder");
assert.ok(businessPlanDraft, "business-plan-builder should be present");
assert.deepStrictEqual(businessPlanDraft.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(businessPlanDraft.requiredInputs, []);
assert.deepStrictEqual(businessPlanDraft.optionalInputs, []);
assert.deepStrictEqual(businessPlanDraft.outputTypes, ["table", "pdf", "json", "report"]);
assert.strictEqual(businessPlanDraft.privacyMode, "browser_local");
assert.strictEqual(businessPlanDraft.sourcePolicy, "user_input");
assert.strictEqual(businessPlanDraft.highStakesDomain, "finance");
assert.deepStrictEqual(businessPlanDraft.monetizationSurfaces, []);
assert.strictEqual(prefill.getPrefillAdapter("business-plan-builder"), null);

const ideaEvidence = byId.get("idea-board");
assert.ok(ideaEvidence, "idea-board should be present");
assert.deepStrictEqual(ideaEvidence.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(ideaEvidence.requiredInputs, []);
assert.deepStrictEqual(ideaEvidence.optionalInputs, []);
assert.deepStrictEqual(ideaEvidence.outputTypes, ["table", "shortlist", "pdf", "json", "report"]);
assert.strictEqual(ideaEvidence.privacyMode, "server_required");
assert.strictEqual(ideaEvidence.sourcePolicy, "mixed");
assert.strictEqual(ideaEvidence.highStakesDomain, "finance");
assert.deepStrictEqual(ideaEvidence.monetizationSurfaces, []);
assert.strictEqual(prefill.getPrefillAdapter("idea-board"), null);

const STRATEGIC_AI_ROUTABLE_TOOLS = [
  { id: "cv-builder", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "employment", prefill: true },
  { id: "cover-letter", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "employment", prefill: false },
  { id: "scholarship-finder", privacyMode: "account_optional", sourcePolicy: "mixed", highStakesDomain: "education", prefill: true },
  { id: "study-abroad-cost", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: true },
  { id: "import-duty", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: true },
  { id: "car-import-cost", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: true },
  { id: "paye-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "tax", prefill: true },
  { id: "vat-calc-pan-african", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "tax", prefill: true },
  { id: "invoice-generator", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "finance", prefill: true },
  { id: "solar-roi", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "fuel-tracker", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "generator-fuel", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "energy", prefill: true },
  { id: "cost-of-living", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "finance", prefill: false },
  { id: "japa-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "immigration", prefill: false },
  { id: "pdf-workspace", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "none", prefill: true },
  { id: "gpa-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "waec-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "ielts-calculator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "education", prefill: false },
  { id: "afroplan-floor-planner", privacyMode: "ai_optional", sourcePolicy: "user_input", highStakesDomain: "none", prefill: false },
  { id: "afrodraft", privacyMode: "browser_local", sourcePolicy: "user_input", highStakesDomain: "none", prefill: false },
  { id: "building-materials", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "legal", prefill: false },
  { id: "boq-generator", privacyMode: "browser_local", sourcePolicy: "estimated", highStakesDomain: "legal", prefill: false },
  { id: "crop-yield-estimator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "none", prefill: false },
  { id: "farm-profit-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: false },
  { id: "poultry-roi-calculator", privacyMode: "browser_local", sourcePolicy: "mixed", highStakesDomain: "finance", prefill: false },
];

function expectEntry(id) {
  const entry = byId.get(id);
  assert.ok(entry, `${id} should be present in the AI tool manifest`);
  return entry;
}

assert.strictEqual(expectEntry("cv-builder").privacyMode, "browser_local");
assert.strictEqual(expectEntry("cv-builder").highStakesDomain, "employment");
assert.ok(expectEntry("cv-builder").aiCapabilities.includes("generate_document"));

assert.strictEqual(expectEntry("scholarship-finder").highStakesDomain, "education");
assert.ok(expectEntry("scholarship-finder").outputTypes.includes("shortlist"));

assert.strictEqual(expectEntry("import-duty").sourcePolicy, "mixed");
assert.ok(expectEntry("import-duty").aiCapabilities.includes("prefill"));

assert.strictEqual(expectEntry("solar-roi").highStakesDomain, "energy");
assert.strictEqual(expectEntry("medical-report").highStakesDomain, "health");
assert.strictEqual(expectEntry("pdf-workspace").privacyMode, "browser_local");

const contractorComparison = expectEntry("contractor-vs-employee");
assert.deepStrictEqual(contractorComparison.aiCapabilities, ["route_only"], "contractor-vs-employee must not advertise AI prefill, comparison, explanation, or export");
assert.deepStrictEqual(contractorComparison.requiredInputs, [], "route-only contractor-vs-employee must not ask AI for calculator fields");
assert.deepStrictEqual(contractorComparison.optionalInputs, [], "route-only contractor-vs-employee must not accept calculator fields from AI");
assert.deepStrictEqual(contractorComparison.outputTypes, ["number", "report", "pdf"], "contractor-vs-employee outputs must match the local calculator");
assert.strictEqual(contractorComparison.privacyMode, "browser_local");
assert.strictEqual(contractorComparison.sourcePolicy, "user_input");
assert.deepStrictEqual(contractorComparison.monetizationSurfaces, [], "contractor-vs-employee has no API or AI monetization surface");
const contractorComparisonCall = manifestApi.buildToolInvocation(contractorComparison);
assert.strictEqual(contractorComparisonCall.action, "open_existing_tool");
assert.strictEqual(contractorComparisonCall.invocationMode, "route_only");
assert.strictEqual(contractorComparisonCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("contractor-vs-employee"), null, "contractor-vs-employee must remain adapter-free until a separately reviewed prefill contract exists");

const domesticWorker = expectEntry("domestic-worker");
assert.deepStrictEqual(domesticWorker.aiCapabilities, ["route_only"], "domestic-worker must not advertise AI prefill, explanation, comparison, or export");
assert.deepStrictEqual(domesticWorker.requiredInputs, [], "route-only domestic-worker must not ask AI for calculator fields");
assert.deepStrictEqual(domesticWorker.optionalInputs, [], "route-only domestic-worker must not accept calculator fields from AI");
assert.deepStrictEqual(domesticWorker.outputTypes, ["number", "report", "pdf"], "domestic-worker outputs must represent its local result, TXT summary, and print-to-PDF only");
assert.strictEqual(domesticWorker.privacyMode, "browser_local");
assert.strictEqual(domesticWorker.sourcePolicy, "user_input");
assert.deepStrictEqual(domesticWorker.monetizationSurfaces, [], "domestic-worker has no API or AI monetization surface");
const domesticWorkerCall = manifestApi.buildToolInvocation(domesticWorker);
assert.strictEqual(domesticWorkerCall.action, "open_existing_tool");
assert.strictEqual(domesticWorkerCall.invocationMode, "route_only");
assert.strictEqual(domesticWorkerCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("domestic-worker"), null, "domestic-worker must remain adapter-free until a separately reviewed prefill contract exists");

const gratuity = expectEntry("gratuity-calculator");
assert.deepStrictEqual(gratuity.aiCapabilities, ["route_only"], "gratuity-calculator must not advertise AI prefill, explanation, or export");
assert.deepStrictEqual(gratuity.requiredInputs, [], "route-only gratuity-calculator must not ask AI for calculator fields");
assert.deepStrictEqual(gratuity.optionalInputs, [], "route-only gratuity-calculator must not accept calculator fields from AI");
assert.deepStrictEqual(gratuity.outputTypes, ["number", "report", "pdf"], "gratuity-calculator outputs must represent its local result, TXT summary, and print-to-PDF only");
assert.strictEqual(gratuity.privacyMode, "browser_local");
assert.strictEqual(gratuity.sourcePolicy, "user_input");
assert.deepStrictEqual(gratuity.monetizationSurfaces, [], "gratuity-calculator has no API or AI monetization surface");
const gratuityCall = manifestApi.buildToolInvocation(gratuity);
assert.strictEqual(gratuityCall.action, "open_existing_tool");
assert.strictEqual(gratuityCall.invocationMode, "route_only");
assert.strictEqual(gratuityCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("gratuity-calculator"), null, "gratuity-calculator must remain adapter-free until a separately reviewed prefill contract exists");

const maternityLeave = expectEntry("maternity-leave");
assert.deepStrictEqual(maternityLeave.aiCapabilities, ["route_only"], "maternity-leave must not advertise AI prefill, explanation, or export");
assert.deepStrictEqual(maternityLeave.requiredInputs, [], "route-only maternity-leave must not ask AI for sensitive calculator fields");
assert.deepStrictEqual(maternityLeave.optionalInputs, [], "route-only maternity-leave must not accept sensitive calculator fields from AI");
assert.deepStrictEqual(maternityLeave.outputTypes, ["number", "report", "pdf"], "maternity-leave outputs must represent its local result, TXT summary, and print-to-PDF only");
assert.strictEqual(maternityLeave.privacyMode, "browser_local");
assert.strictEqual(maternityLeave.sourcePolicy, "user_input");
assert.deepStrictEqual(maternityLeave.monetizationSurfaces, [], "maternity-leave has no API or AI monetization surface");
const maternityLeaveCall = manifestApi.buildToolInvocation(maternityLeave);
assert.strictEqual(maternityLeaveCall.action, "open_existing_tool");
assert.strictEqual(maternityLeaveCall.invocationMode, "route_only");
assert.strictEqual(maternityLeaveCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("maternity-leave"), null, "maternity-leave must remain adapter-free until a separately reviewed prefill contract exists");

const retrenchment = expectEntry("retrenchment-calculator");
assert.deepStrictEqual(retrenchment.aiCapabilities, ["route_only"], "retrenchment-calculator must not advertise AI prefill, explanation, or export");
assert.deepStrictEqual(retrenchment.requiredInputs, [], "route-only retrenchment-calculator must not ask AI for sensitive calculator fields");
assert.deepStrictEqual(retrenchment.optionalInputs, [], "route-only retrenchment-calculator must not accept sensitive calculator fields from AI");
assert.deepStrictEqual(retrenchment.outputTypes, ["number", "report", "pdf"], "retrenchment-calculator outputs must represent its local result, TXT summary, and print-to-PDF only");
assert.strictEqual(retrenchment.privacyMode, "browser_local");
assert.strictEqual(retrenchment.sourcePolicy, "user_input");
assert.deepStrictEqual(retrenchment.monetizationSurfaces, [], "retrenchment-calculator has no API or AI monetization surface");
const retrenchmentCall = manifestApi.buildToolInvocation(retrenchment);
assert.strictEqual(retrenchmentCall.action, "open_existing_tool");
assert.strictEqual(retrenchmentCall.invocationMode, "route_only");
assert.strictEqual(retrenchmentCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("retrenchment-calculator"), null, "retrenchment-calculator must remain adapter-free until a separately reviewed prefill contract exists");

const employeeCost = expectEntry("employee-cost");
assert.deepStrictEqual(employeeCost.aiCapabilities, ["route_only"], "employee-cost must not advertise AI prefill, explanation, or export");
assert.deepStrictEqual(employeeCost.requiredInputs, [], "route-only employee-cost must not ask AI for calculator fields");
assert.deepStrictEqual(employeeCost.optionalInputs, [], "route-only employee-cost must not accept calculator fields from AI");
assert.deepStrictEqual(employeeCost.outputTypes, ["number", "report", "pdf"], "employee-cost outputs must match the local calculator");
assert.strictEqual(employeeCost.privacyMode, "browser_local");
assert.strictEqual(employeeCost.sourcePolicy, "user_input");
assert.deepStrictEqual(employeeCost.monetizationSurfaces, [], "employee-cost has no API or AI monetization surface");
const employeeCostCall = manifestApi.buildToolInvocation(employeeCost);
assert.strictEqual(employeeCostCall.action, "open_existing_tool");
assert.strictEqual(employeeCostCall.invocationMode, "route_only");
assert.strictEqual(employeeCostCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("employee-cost"), null, "employee-cost must remain adapter-free until a separately reviewed prefill contract exists");

const inventory = expectEntry("inventory");
assert.strictEqual(inventory.route, "/tools/inventory/");
assert.strictEqual(inventory.title, "Inventory Calculator & Local Stock Tracker");
assert.deepStrictEqual(inventory.languagesSupported, ["en", "fr", "sw"]);
assert.deepStrictEqual(inventory.requiredInputs, [], "route-only inventory must not ask AI for stock data");
assert.deepStrictEqual(inventory.optionalInputs, [], "route-only inventory must not accept stock data from AI");
assert.deepStrictEqual(inventory.aiCapabilities, ["route_only"], "inventory must remain a browser-local route-only worksheet");
assert.deepStrictEqual(inventory.outputTypes, ["table", "pdf", "json", "report"]);
assert.strictEqual(inventory.privacyMode, "browser_local");
assert.strictEqual(inventory.sourcePolicy, "user_input");
assert.strictEqual(inventory.highStakesDomain, "finance");
assert.deepStrictEqual(inventory.monetizationSurfaces, []);
const inventoryCall = manifestApi.buildToolInvocation(inventory);
assert.strictEqual(inventoryCall.action, "open_existing_tool");
assert.strictEqual(inventoryCall.invocationMode, "route_only");
assert.strictEqual(inventoryCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("inventory"), null, "inventory must remain adapter-free until a separately reviewed prefill contract exists");

const shippingPlanner = expectEntry("shipping-calc");
assert.strictEqual(shippingPlanner.route, "/tools/shipping-calc/");
assert.strictEqual(shippingPlanner.title, "Shipping Cost & Chargeable Weight Planner");
assert.deepStrictEqual(shippingPlanner.languagesSupported, ["en", "fr", "sw"]);
assert.deepStrictEqual(shippingPlanner.requiredInputs, []);
assert.deepStrictEqual(shippingPlanner.optionalInputs, []);
assert.deepStrictEqual(shippingPlanner.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(shippingPlanner.outputTypes, ["number", "table", "pdf", "json", "report"]);
assert.strictEqual(shippingPlanner.privacyMode, "browser_local");
assert.strictEqual(shippingPlanner.sourcePolicy, "user_input");
assert.strictEqual(shippingPlanner.highStakesDomain, "finance");
assert.deepStrictEqual(shippingPlanner.monetizationSurfaces, []);
const shippingPlannerCall = manifestApi.buildToolInvocation(shippingPlanner);
assert.strictEqual(shippingPlannerCall.action, "open_existing_tool");
assert.strictEqual(shippingPlannerCall.invocationMode, "route_only");
assert.strictEqual(shippingPlannerCall.canPrefill, false);

const discountPlanner = expectEntry("discount-calc");
assert.strictEqual(discountPlanner.route, "/tools/discount-calc/");
assert.strictEqual(discountPlanner.title, "Discount Calculator");
assert.deepStrictEqual(discountPlanner.languagesSupported, ["en", "fr", "sw"]);
assert.deepStrictEqual(discountPlanner.requiredInputs, []);
assert.deepStrictEqual(discountPlanner.optionalInputs, []);
assert.deepStrictEqual(discountPlanner.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(discountPlanner.outputTypes, ["number", "table", "pdf", "json", "report"]);
assert.strictEqual(discountPlanner.privacyMode, "browser_local");
assert.strictEqual(discountPlanner.sourcePolicy, "user_input");
assert.strictEqual(discountPlanner.highStakesDomain, "finance");
assert.deepStrictEqual(discountPlanner.monetizationSurfaces, []);
const discountPlannerCall = manifestApi.buildToolInvocation(discountPlanner);
assert.strictEqual(discountPlannerCall.action, "open_existing_tool");
assert.strictEqual(discountPlannerCall.invocationMode, "route_only");
assert.strictEqual(discountPlannerCall.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter("discount-calc"), null);

const businessNameWorkshop = expectEntry("business-name-gen");
assert.strictEqual(businessNameWorkshop.route, "/tools/business-name-gen/");
assert.strictEqual(businessNameWorkshop.title, "African Business Name Shortlist Workshop");
assert.deepStrictEqual(businessNameWorkshop.languagesSupported, ["en", "fr", "sw"]);
assert.deepStrictEqual(businessNameWorkshop.requiredInputs, []);
assert.deepStrictEqual(businessNameWorkshop.optionalInputs, []);
assert.deepStrictEqual(businessNameWorkshop.aiCapabilities, ["route_only"]);
assert.deepStrictEqual(businessNameWorkshop.outputTypes, ["shortlist", "table", "pdf", "json", "report"]);
assert.strictEqual(businessNameWorkshop.privacyMode, "browser_local");
assert.strictEqual(businessNameWorkshop.sourcePolicy, "user_input");
assert.strictEqual(businessNameWorkshop.highStakesDomain, "none");
assert.deepStrictEqual(businessNameWorkshop.monetizationSurfaces, []);
assert.strictEqual(prefill.getPrefillAdapter("business-name-gen"), null);

assert.strictEqual(STRATEGIC_AI_ROUTABLE_TOOLS.length, 25, "first AI-routable batch should cover exactly 25 strategic tools");
for (const expected of STRATEGIC_AI_ROUTABLE_TOOLS) {
  const entry = expectEntry(expected.id);
  assert.ok(entry.route.startsWith("/"), `${expected.id} should keep a public route`);
  assert.ok(entry.aiCapabilities.includes("route_only"), `${expected.id} should be safely routable without prefill`);
  assert.ok(entry.userIntents.length > 0, `${expected.id} should include intent phrases`);
  assert.ok(entry.exampleQueries.length > 0, `${expected.id} should include example queries`);
  assert.ok(entry.outputTypes.length > 0, `${expected.id} should define output types`);
  assert.strictEqual(entry.privacyMode, expected.privacyMode, `${expected.id} privacy mode should be curated`);
  assert.strictEqual(entry.sourcePolicy, expected.sourcePolicy, `${expected.id} source policy should be curated`);
  assert.strictEqual(entry.highStakesDomain, expected.highStakesDomain, `${expected.id} high-stakes domain should be curated`);
  if (expected.prefill) {
    assert.ok(entry.aiCapabilities.includes("prefill"), `${expected.id} should advertise prefill only with an adapter`);
    assert.ok(prefill.getPrefillAdapter(expected.id), `${expected.id} should have a safe prefill adapter`);
  } else {
    assert.ok(!entry.aiCapabilities.includes("prefill"), `${expected.id} should be route_only until a safe adapter exists`);
  }
}

const routerManifest = manifestApi.getToolManifestForRouter(manifest);
assert.strictEqual(routerManifest.length, manifest.length, "router helper should preserve manifest length");
const defaultRouterManifest = manifestApi.getToolManifestForRouter();
assert.strictEqual(defaultRouterManifest.length, manifest.length, "router helper should load the default manifest in Node");
const invocationManifest = manifestApi.getToolInvocationManifest(manifest);
assert.strictEqual(invocationManifest.length, manifest.length, "tool invocation manifest should cover the full router-safe tool catalog");
const cvToolCall = manifestApi.buildToolInvocation(expectEntry("cv-builder"), {
  providedInputNames: ["country", "targetRole"],
  missingInputNames: [],
});
assert.strictEqual(cvToolCall.type, "existing_tool_call");
assert.strictEqual(cvToolCall.action, "prefill_existing_tool");
assert.strictEqual(cvToolCall.toolId, "cv-builder");
assert.strictEqual(cvToolCall.route, expectEntry("cv-builder").route);
assert.strictEqual(cvToolCall.invocationMode, "session_prefill");
assert.ok(cvToolCall.inputSchema.requiredInputs.length >= 0);
assert.ok(cvToolCall.capabilities.includes("route_only"));
assert.ok(cvToolCall.capabilities.includes("prefill"));
assert.deepStrictEqual(cvToolCall.providedInputNames, ["country", "targetRole"]);
assert.deepStrictEqual(cvToolCall.missingInputNames, []);
const categoryCalls = manifestApi.getToolInvocationManifest(manifest, { category: "energy", limit: 5 });
assert.ok(categoryCalls.length > 0 && categoryCalls.length <= 5, "category-filtered tool calls should be bounded");
assert.ok(categoryCalls.every((toolCall) => toolCall.type === "existing_tool_call"), "category tool calls should keep the invocation contract");
const passportCandidates = manifestApi.rankToolCandidates("passport application checklist for Ghana", manifest, { limit: 3 });
assert.strictEqual(passportCandidates.catalogSize, manifest.length, "tool retrieval should rank across the full manifest");
assert.strictEqual(passportCandidates.candidates[0].tool.id, "passport-checklist", "manifest retrieval should find non-flagship government tools");
const mobileMoneyCandidates = manifestApi.rankToolCandidates("compare mobile money fees in Kenya", manifest, { limit: 3 });
assert.strictEqual(mobileMoneyCandidates.candidates[0].tool.id, "mobile-money-fees", "manifest retrieval should find exact fintech fee tools");
const ndaCandidates = manifestApi.rankToolCandidates("generate an NDA for a client in Ghana", manifest, { limit: 3 });
assert.strictEqual(ndaCandidates.candidates[0].tool.id, "nda-generator", "domain terms should beat geography-only matches");
const nonsenseCandidates = manifestApi.rankToolCandidates("blue sky weekend vibes", manifest, { limit: 3 });
assert.strictEqual(nonsenseCandidates.candidates.length, 0, "weak unrelated prompts should not produce tool calls");
const routerAllowedFields = new Set([
  "id",
  "slug",
  "route",
  "title",
  "shortDescription",
  "category",
  "subcategory",
  "countriesSupported",
  "languagesSupported",
  "currencySupport",
  "userIntents",
  "exampleQueries",
  "requiredInputs",
  "optionalInputs",
  "privacyMode",
  "aiCapabilities",
  "outputTypes",
  "sourcePolicy",
  "highStakesDomain",
  "aliases",
]);

for (const entry of routerManifest) {
  for (const key of Object.keys(entry)) {
    assert.ok(routerAllowedFields.has(key), `router manifest should not expose ${key}`);
  }
}

const minimumWage = expectEntry("minimum-wage");
assert.ok(minimumWage.aliases.includes("minimum-wage-legal"), "duplicate minimum-wage route should retain alias id");

console.log(`AI tool manifest validated: ${manifest.length} unique router entries from ${directoryEntries.length} directory rows.`);
