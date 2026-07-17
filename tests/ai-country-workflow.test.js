#!/usr/bin/env node

const assert = require("assert");
const workflow = require("../assets/js/ai/country-workflow.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

const manifest = manifestApi.getToolManifestForRouter();

function hasTool(plan, id) {
  return (plan.relevantCalculators || []).some((tool) => tool.id === id);
}

function hasSource(plan, id) {
  return (plan.dataConfidence || []).some((source) => source.id === id);
}

function build(query, inputs) {
  return workflow.buildCountryPlan(inputs || {}, { query });
}

function assertCountryPlan(plan, countryName) {
  assert.strictEqual(plan.kind, "country_intelligence");
  assert.strictEqual(normalizeName(plan.countrySummary.name), normalizeName(countryName));
  assert.ok(plan.countrySummary.currency);
  assert.ok(Array.isArray(plan.relevantCalculators));
  assert.ok(plan.relevantCalculators.length >= 3);
  assert.ok(hasSource(plan, "country-profile-reviewed-dataset"));
  assert.ok(hasTool(plan, "afroatlas"));
  assert.ok(plan.warning.includes("Planning context only"));
  assert.ok(plan.officialVerificationChecklist.some((item) => /Revenue authority/i.test(item)));
  assert.doesNotMatch(plan.briefText, /official source URL|sourceUrl/i);
}

function normalizeName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const rwandaBusiness = build("What should I know before starting a business in Rwanda?");
assertCountryPlan(rwandaBusiness, "Rwanda");
assert.strictEqual(rwandaBusiness.workflowKind, "business");
assert.ok(hasTool(rwandaBusiness, "business-registration"));
assert.ok(hasTool(rwandaBusiness, "vat-calc-pan-african"));
assert.ok(hasTool(rwandaBusiness, "paye-calculator"));
assert.ok(hasSource(rwandaBusiness, "vat-country-rate-packs"));
assert.match(workflow.renderCountryPanel(rwandaBusiness), /Official-source verification checklist/);
assert.match(workflow.renderCountryPanel(rwandaBusiness), /Data confidence and freshness/);

const ghanaKenyaRemote = build("Compare Ghana and Kenya for a remote worker.");
assertCountryPlan(ghanaKenyaRemote, "Ghana");
assert.strictEqual(ghanaKenyaRemote.workflowKind, "compare");
assert.strictEqual(ghanaKenyaRemote.comparisonSummary.name, "Kenya");
assert.ok(ghanaKenyaRemote.relevantCalculators.some((tool) => tool.route === "/tools/afroatlas/compare.html?a=GH&b=KE"));
assert.ok(hasTool(ghanaKenyaRemote, "cost-of-living"));
assert.ok(hasSource(ghanaKenyaRemote, "afrofuel-static-snapshot"));

const nigeriaToSouthAfrica = build("What are the main costs of moving to South Africa from Nigeria?");
assertCountryPlan(nigeriaToSouthAfrica, "South Africa");
assert.strictEqual(nigeriaToSouthAfrica.workflowKind, "relocation");
assert.strictEqual(nigeriaToSouthAfrica.originCountry.name, "Nigeria");
assert.ok(hasTool(nigeriaToSouthAfrica, "japa-calculator"));
assert.ok(hasTool(nigeriaToSouthAfrica, "cost-of-living"));
assert.ok(nigeriaToSouthAfrica.officialVerificationChecklist.some((item) => /Immigration/i.test(item)));

const kenyaMarket = build("Market entry checklist for a fintech startup in Kenya");
assertCountryPlan(kenyaMarket, "Kenya");
assert.strictEqual(kenyaMarket.workflowKind, "business");
assert.ok(hasTool(kenyaMarket, "afrorates"));

const egyptMorocco = build("Compare Egypt vs Morocco for ecommerce expansion");
assertCountryPlan(egyptMorocco, "Egypt");
assert.strictEqual(egyptMorocco.comparisonSummary.name, "Morocco");
assert.ok(egyptMorocco.insights.length >= 2);

const senegalProfile = build("Country profile and fuel pressure for Senegal");
assertCountryPlan(senegalProfile, "Senegal");
assert.ok(hasTool(senegalProfile, "fuel-tracker"));

const ivoryCoastMarket = build("What should a cocoa exporter know about Cote d'Ivoire?");
assertCountryPlan(ivoryCoastMarket, "Cote d'Ivoire");
assert.ok(ivoryCoastMarket.countrySummary.topExports.length > 0);

const tanzaniaRemote = build("Is Tanzania practical for a remote worker?");
assertCountryPlan(tanzaniaRemote, "Tanzania");
assert.strictEqual(tanzaniaRemote.workflowKind, "remote_worker");
assert.ok(hasTool(tanzaniaRemote, "cost-of-living"));

const zambiaMining = build("Zambia market data for a mining services business");
assertCountryPlan(zambiaMining, "Zambia");
assert.strictEqual(zambiaMining.workflowKind, "market");
assert.ok(zambiaMining.countrySummary.resources.length > 0);

const cameroonBusiness = build("Register business and understand taxes in Cameroon");
assertCountryPlan(cameroonBusiness, "Cameroon");
assert.ok(hasTool(cameroonBusiness, "business-registration"));

const unknown = build("Compare Atlantis and Wakanda for remote work");
assert.strictEqual(unknown.countrySummary.name, "Country not identified");
assert.ok(unknown.missingInputs.includes("country"));
assert.ok(unknown.missingData.some((item) => /not found in AfroAtlas/i.test(item)));
assert.ok(hasSource(unknown, "unknown-source"));
assert.match(workflow.renderCountryPanel(unknown), /Missing or low-confidence data/);

const routedBusiness = router.routeDeterministically("What should I know before starting a business in Rwanda?", { manifest });
assert.strictEqual(routedBusiness.selectedToolId, "afroatlas");
assert.strictEqual(routedBusiness.intentCategory, "country-intelligence");

const routedMoving = router.routeDeterministically("What are the main costs of moving to South Africa from Nigeria?", { manifest });
assert.strictEqual(routedMoving.selectedToolId, "afroatlas");

console.log("AI country intelligence workflow validated: 10 country queries, routing, source confidence, missing-data handling, and AfroAtlas tool links.");
