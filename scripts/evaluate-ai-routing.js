#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const prefill = require("../assets/js/ai/prefill-adapters.js");

const DEFAULT_FIXTURE_PATH = path.join(__dirname, "..", "data", "ai", "routing-eval-fixtures.json");
const REQUIRED_CATEGORIES = [
  "education",
  "career",
  "business-tax",
  "trade",
  "energy",
  "local-life",
  "documents",
  "agriculture",
  "construction",
  "country-intelligence",
];

function loadFixtures(filePath = DEFAULT_FIXTURE_PATH) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!raw || !Array.isArray(raw.fixtures)) {
    throw new Error("routing eval fixture file must contain a fixtures array");
  }
  return raw.fixtures;
}

function sameValue(actual, expected) {
  if (typeof expected === "number") return Number(actual) === expected;
  if (typeof expected === "string") return String(actual || "").toLowerCase() === expected.toLowerCase();
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function sorted(values) {
  return Array.from(values || []).map(String).sort();
}

function arrayEqual(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function compareExpectedExtracted(actualInputs, expectedInputs) {
  const errors = [];
  Object.entries(expectedInputs || {}).forEach(([key, expectedValue]) => {
    if (!sameValue(actualInputs && actualInputs[key], expectedValue)) {
      errors.push(`extractedInputs.${key} expected ${JSON.stringify(expectedValue)} got ${JSON.stringify(actualInputs && actualInputs[key])}`);
    }
  });
  return errors;
}

function possibleSensitiveValues(expectedInputs) {
  const publicRouteFields = new Set([
    "country",
    "countryCode",
    "destinationCountry",
    "originCountry",
    "targetCountry",
    "city",
    "currency",
    "year",
    "payPeriod",
    "studyLevel",
    "field",
    "productCategory",
    "pdfAction",
    "vatTreatment",
  ]);
  return Object.entries(expectedInputs || {})
    .filter(([key, value]) => !publicRouteFields.has(key) && value !== null && value !== undefined && value !== "")
    .map(([, value]) => String(value))
    .filter((value) => value.length >= 3);
}

function checkPrefill(decision, fixture) {
  const adapter = prefill.getPrefillAdapter(decision.selectedToolId);
  if (!adapter && !decision.canPrefill) {
    return { attempted: false, passed: true, errors: [] };
  }

  const launch = prefill.buildSafeLaunch(decision.selectedToolId, decision.extractedInputs, {
    selectedRoute: decision.selectedRoute,
  });
  const errors = [];
  if (adapter && !launch.supported) errors.push("expected a supported prefill adapter");
  if (launch.validation && !launch.validation.valid) {
    errors.push(`prefill validation failed: ${launch.validation.errors.join("; ")}`);
  }
  possibleSensitiveValues(fixture.expected && fixture.expected.extractedInputs).forEach((value) => {
    if (String(launch.launchUrl || "").toLowerCase().includes(value.toLowerCase())) {
      errors.push(`launch URL leaked expected input value ${value}`);
    }
  });
  if (launch.payload && launch.payload.type !== "afrotools_ai_prefill") {
    errors.push("prefill payload has unexpected type");
  }
  return { attempted: true, passed: errors.length === 0, errors };
}

function validateFixtures(fixtures, manifest) {
  const errors = [];
  const categories = new Set();
  const ids = new Set();
  fixtures.forEach((fixture, index) => {
    if (!fixture || typeof fixture !== "object") errors.push(`fixture[${index}] must be an object`);
    if (!fixture.id || ids.has(fixture.id)) errors.push(`fixture[${index}] has missing or duplicate id`);
    ids.add(fixture.id);
    if (!fixture.category) errors.push(`${fixture.id || `fixture[${index}]`} missing category`);
    categories.add(fixture.category);
    if (!fixture.prompt || typeof fixture.prompt !== "string") errors.push(`${fixture.id} missing prompt`);
    if (!fixture.expected || typeof fixture.expected !== "object") errors.push(`${fixture.id} missing expected object`);
    const expected = fixture.expected || {};
    const tool = manifest.find((entry) => entry.id === expected.selectedToolId);
    if (!tool) errors.push(`${fixture.id} expected selectedToolId not found in manifest: ${expected.selectedToolId}`);
    ["selectedToolId", "category", "safetyDomain"].forEach((field) => {
      if (!expected[field]) errors.push(`${fixture.id} expected.${field} is required`);
    });
    if (!expected.extractedInputs || typeof expected.extractedInputs !== "object" || Array.isArray(expected.extractedInputs)) {
      errors.push(`${fixture.id} expected.extractedInputs must be an object`);
    }
    if (!Array.isArray(expected.missingInputs)) errors.push(`${fixture.id} expected.missingInputs must be an array`);
  });
  REQUIRED_CATEGORIES.forEach((category) => {
    if (!categories.has(category)) errors.push(`missing required fixture category: ${category}`);
  });
  if (fixtures.length < 100) errors.push(`expected at least 100 fixtures, found ${fixtures.length}`);
  return errors;
}

async function deterministicDecision(fixture, manifest) {
  return router.routeDeterministically(fixture.prompt, { manifest });
}

async function liveDecision(fixture, index) {
  const api = require("../netlify/functions/ai-route-intent.js");
  const response = await api.handler({
    httpMethod: "POST",
    headers: {
      origin: "https://afrotools.com",
      "x-forwarded-for": `203.0.113.${(index % 200) + 20}`,
    },
    body: JSON.stringify({ query: fixture.prompt, consentToModel: true }),
  });
  if (response.statusCode !== 200) {
    throw new Error(`live router returned ${response.statusCode} for ${fixture.id}`);
  }
  return JSON.parse(response.body).decision;
}

function checkDecision(fixture, decision) {
  const expected = fixture.expected || {};
  const errors = [];
  const validation = router.validateRouterOutput(decision);
  if (!validation.valid) errors.push(`router output invalid: ${validation.errors.join("; ")}`);
  if (decision.selectedToolId !== expected.selectedToolId) errors.push(`selectedToolId expected ${expected.selectedToolId} got ${decision.selectedToolId}`);
  if (decision.intentCategory !== expected.category) errors.push(`category expected ${expected.category} got ${decision.intentCategory}`);
  if (decision.safetyDomain !== expected.safetyDomain) errors.push(`safetyDomain expected ${expected.safetyDomain} got ${decision.safetyDomain}`);
  errors.push(...compareExpectedExtracted(decision.extractedInputs, expected.extractedInputs));
  if (!arrayEqual(decision.missingInputs, expected.missingInputs)) {
    errors.push(`missingInputs expected ${JSON.stringify(sorted(expected.missingInputs))} got ${JSON.stringify(sorted(decision.missingInputs))}`);
  }
  const prefillResult = checkPrefill(decision, fixture);
  errors.push(...prefillResult.errors);
  return {
    passed: errors.length === 0,
    errors,
    prefillAttempted: prefillResult.attempted,
    prefillPassed: prefillResult.passed,
  };
}

function summarize(results) {
  const byCategory = {};
  results.forEach((result) => {
    const bucket = byCategory[result.fixture.category] || {
      total: 0,
      passed: 0,
      failed: 0,
      prefillAttempted: 0,
      prefillPassed: 0,
    };
    bucket.total += 1;
    if (result.passed) bucket.passed += 1;
    else bucket.failed += 1;
    if (result.prefillAttempted) {
      bucket.prefillAttempted += 1;
      if (result.prefillPassed) bucket.prefillPassed += 1;
    }
    byCategory[result.fixture.category] = bucket;
  });
  const totals = Object.values(byCategory).reduce((acc, bucket) => {
    acc.total += bucket.total;
    acc.passed += bucket.passed;
    acc.failed += bucket.failed;
    acc.prefillAttempted += bucket.prefillAttempted;
    acc.prefillPassed += bucket.prefillPassed;
    return acc;
  }, { total: 0, passed: 0, failed: 0, prefillAttempted: 0, prefillPassed: 0 });
  return { totals, byCategory };
}

function printSummary(summary, results, options) {
  console.log(`AfroTools AI routing eval (${options.mode})`);
  console.log(`Fixtures: ${summary.totals.total}, passed: ${summary.totals.passed}, failed: ${summary.totals.failed}`);
  console.log(`Prefill checks: ${summary.totals.prefillPassed}/${summary.totals.prefillAttempted} passed`);
  Object.keys(summary.byCategory).sort().forEach((category) => {
    const bucket = summary.byCategory[category];
    console.log(`- ${category}: ${bucket.passed}/${bucket.total} routing passed, ${bucket.prefillPassed}/${bucket.prefillAttempted} prefill passed`);
  });
  results.filter((result) => !result.passed).slice(0, options.maxFailures || 20).forEach((result) => {
    console.log(`FAIL ${result.fixture.id}: ${result.fixture.prompt}`);
    result.errors.forEach((error) => console.log(`  - ${error}`));
  });
}

async function runEvaluation(options = {}) {
  const mode = options.mode || "deterministic";
  if (mode === "live") {
    const hasKey = Boolean(process.env.AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
    if (!hasKey) return { skipped: true, reason: "No Anthropic provider key configured for live router eval." };
    if (process.env.CI && process.env.AFROTOOLS_ALLOW_LIVE_AI_EVAL !== "1") {
      return { skipped: true, reason: "Live router eval skipped in CI. Set AFROTOOLS_ALLOW_LIVE_AI_EVAL=1 to override." };
    }
  }

  const manifest = manifestApi.getToolManifestForRouter();
  const fixtures = loadFixtures(options.fixturePath);
  const fixtureErrors = validateFixtures(fixtures, manifest);
  if (fixtureErrors.length) {
    const err = new Error("AI routing eval fixtures are invalid:\n" + fixtureErrors.join("\n"));
    err.fixtureErrors = fixtureErrors;
    throw err;
  }

  const results = [];
  for (let index = 0; index < fixtures.length; index += 1) {
    const fixture = fixtures[index];
    const decision = mode === "live"
      ? await liveDecision(fixture, index)
      : await deterministicDecision(fixture, manifest);
    const checked = checkDecision(fixture, decision);
    results.push(Object.assign({ fixture, decision }, checked));
  }
  const summary = summarize(results);
  return { skipped: false, mode, fixtures, results, summary };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--live") ? "live" : "deterministic";
  const json = args.includes("--json");
  const result = await runEvaluation({ mode });
  if (result.skipped) {
    console.log(`AfroTools AI routing eval skipped: ${result.reason}`);
    return;
  }
  if (json) console.log(JSON.stringify(result.summary, null, 2));
  else printSummary(result.summary, result.results, { mode });
  if (result.summary.totals.failed > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  REQUIRED_CATEGORIES,
  loadFixtures,
  validateFixtures,
  runEvaluation,
  checkDecision,
  summarize,
};
