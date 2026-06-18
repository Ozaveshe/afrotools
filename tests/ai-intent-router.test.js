#!/usr/bin/env node

const assert = require("assert");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const api = require("../netlify/functions/ai-route-intent.js");

const manifest = manifestApi.getToolManifestForRouter();

const cases = [
  ["Write a CV for an electrical engineer in Ghana", "cv-builder", "employment"],
  ["Build my resume for an NGO job", "cv-builder", "employment"],
  ["Find scholarships for a Cameroonian student", "scholarship-finder", "education"],
  ["Scholarships for masters in Canada from Nigeria", "scholarship-finder", "education"],
  ["Calculate payroll for 5 employees in Kenya", "paye-calculator", "tax"],
  ["PAYE on 250000 KES monthly salary", "paye-calculator", "tax"],
  ["I want to calculate my salary tax in angoa 1000000", "ao-paye", "tax"],
  ["How much duty to import a 2016 Toyota Axio into Nigeria?", "import-duty", "finance"],
  ["Car import landed cost for Honda Fit to Ghana", "import-duty", "finance"],
  ["Should I install solar for my shop in Lagos?", "solar-roi", "energy"],
  ["Compare solar battery payback for a shop in Ghana", "solar-roi", "energy"],
  ["Generator fuel cost for my restaurant", "fuel-tracker", "energy"],
  ["Current petrol price context in Kenya", "fuel-tracker", "energy"],
  ["Create an invoice for a client in Accra", "invoice-generator", "finance"],
  ["VAT calculator for a small business in Rwanda", "vat-calc-pan-african", "tax"],
  ["Merge PDF files locally", "pdf-workspace", "none"],
  ["compress my PDF", "pdf-workspace", "none"],
  ["add page numbers", "pdf-workspace", "none"],
  ["protect a PDF", "pdf-workspace", "none"],
  ["Calculate my GPA for university", "gpa-calculator", "education"],
  ["IELTS band score for Canada study", "ielts-calculator", "education"],
  ["I want to study in Canada from Nigeria with $8,000", "study-abroad-cost", "education"],
  ["Japa cost to move to the UK", "japa-calculator", "immigration"],
  ["Draw a floor plan for a two bedroom house", "afroplan-floor-planner", "none"],
  ["passport application checklist for Ghana", "passport-checklist", "immigration"],
  ["Get Ghana passport documents, fees to check, and next steps", "passport-checklist", "immigration"],
  ["compare mobile money fees in Kenya", "mobile-money-fees", "finance"],
  ["generate an NDA for a client in Ghana", "nda-generator", "legal"],
  ["check land title before buying land in Lagos", "land-title-check", "legal"],
  ["starlink vs local isp in Nigeria", "telecom-starlink", "finance"],
];

for (const [query, expectedTool, expectedDomain] of cases) {
  const decision = router.routeDeterministically(query, { manifest });
  const validation = router.validateRouterOutput(decision);
  assert.deepStrictEqual(validation.errors, [], query);
  assert.strictEqual(decision.selectedToolId, expectedTool, query);
  assert.strictEqual(decision.safetyDomain, expectedDomain, query);
  assert.ok(decision.selectedRoute.startsWith("/"), query);
  assert.ok(decision.confidence >= 0 && decision.confidence <= 1, query);
  assert.ok(Array.isArray(decision.suggestedNextActions) && decision.suggestedNextActions.length > 0, query);
}

const noMatch = router.routeDeterministically("blue sky weekend vibes", { manifest });
assert.strictEqual(noMatch.selectedToolId, "tool-search");
assert.strictEqual(noMatch.selectedRoute, "/search/?source=ask");
assert.strictEqual(noMatch.canPrefill, false);

const careerRoute = router.routeDeterministically("Write me a CV for an electrical engineer in Ghana", { manifest });
assert.strictEqual(careerRoute.selectedToolId, "cv-builder");
assert.strictEqual(careerRoute.safetyDomain, "employment");
assert.strictEqual(careerRoute.extractedInputs.country, "Ghana");
assert.strictEqual(careerRoute.extractedInputs.targetRole, "electrical engineer");

const educationPlanRoute = router.routeDeterministically("I want to study in Canada from Nigeria with a budget of $8,000", { manifest });
assert.strictEqual(educationPlanRoute.selectedToolId, "study-abroad-cost");
assert.strictEqual(educationPlanRoute.extractedInputs.country, "Nigeria");
assert.strictEqual(educationPlanRoute.extractedInputs.targetCountry, "Canada");
assert.strictEqual(educationPlanRoute.extractedInputs.budgetAmount, 8000);
assert.strictEqual(educationPlanRoute.extractedInputs.currency, "USD");

const angolaSalaryRoute = router.routeDeterministically("I want to calculate my salary tax in angoa 1000000", { manifest });
assert.strictEqual(angolaSalaryRoute.selectedToolId, "ao-paye");
assert.strictEqual(angolaSalaryRoute.selectedRoute, "/angola/ao-paye?source=ask");
assert.strictEqual(angolaSalaryRoute.extractedInputs.country, "Angola");
assert.strictEqual(angolaSalaryRoute.extractedInputs.grossPay, 1000000);
assert.strictEqual(angolaSalaryRoute.extractedInputs.payPeriod, "monthly");
assert.deepStrictEqual(angolaSalaryRoute.missingInputs, []);

const pdfPageNumbersRoute = router.routeDeterministically("add page numbers to my PDF", { manifest });
assert.strictEqual(pdfPageNumbersRoute.selectedToolId, "pdf-workspace");
assert.strictEqual(pdfPageNumbersRoute.extractedInputs.pdfAction, "page_numbers");

const pdfProtectRoute = router.routeDeterministically("protect a PDF with a password", { manifest });
assert.strictEqual(pdfProtectRoute.selectedToolId, "pdf-workspace");
assert.strictEqual(pdfProtectRoute.extractedInputs.pdfAction, "protect");

const catalogRoute = router.routeDeterministically("compare mobile money fees in Kenya", { manifest });
assert.strictEqual(catalogRoute.selectedToolId, "mobile-money-fees");
assert.strictEqual(catalogRoute._meta.retrievalSource, "rule");
assert.strictEqual(catalogRoute.intentCategory, "african");

const countryComparisonRoute = router.routeDeterministically("Compare Kenya and Ghana for ecommerce", { manifest });
assert.strictEqual(countryComparisonRoute.selectedToolId, "afroatlas");
assert.strictEqual(countryComparisonRoute._meta.retrievalSource, "rule");

const invalid = router.validateRouterOutput({ selectedToolId: "cv-builder" });
assert.strictEqual(invalid.valid, false);
assert.ok(invalid.errors.length > 3);

async function runApiTests() {
  const response = await api.handler({
    httpMethod: "POST",
    headers: { origin: "https://afrotools.com", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify({ query: "Calculate PAYE for 500000 NGN monthly in Nigeria" }),
  });
  assert.strictEqual(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  assert.strictEqual(payload.ok, true);
  assert.strictEqual(payload.decision.selectedToolId, "paye-calculator");
  assert.strictEqual(payload.decision.safetyDomain, "tax");
  assert.strictEqual(payload.decision.extractedInputs.country, "Nigeria");
  assert.ok(payload.decision.extractedInputs.grossPay);
  assert.ok(payload.fallbackReason === "provider_key_not_configured" || payload.fallbackReason === "model_consent_not_provided");

  const tooLarge = await api.handler({
    httpMethod: "POST",
    headers: { origin: "https://afrotools.com", "x-forwarded-for": "203.0.113.11" },
    body: JSON.stringify({ query: "x".repeat(2000) }),
  });
  assert.strictEqual(tooLarge.statusCode, 413);

  const invalidJson = await api.handler({
    httpMethod: "POST",
    headers: { origin: "https://afrotools.com", "x-forwarded-for": "203.0.113.12" },
    body: "{",
  });
  assert.strictEqual(invalidJson.statusCode, 400);

  const method = await api.handler({
    httpMethod: "GET",
    headers: { origin: "https://afrotools.com", "x-forwarded-for": "203.0.113.13" },
    body: "",
  });
  assert.strictEqual(method.statusCode, 405);
}

runApiTests()
  .then(() => {
    console.log("AI intent router validated: " + cases.length + " deterministic samples plus API guardrails.");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
