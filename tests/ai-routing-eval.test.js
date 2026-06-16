#!/usr/bin/env node

const assert = require("assert");
const evalRunner = require("../scripts/evaluate-ai-routing.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");

async function run() {
  const manifest = manifestApi.getToolManifestForRouter();
  const fixtures = evalRunner.loadFixtures();
  const fixtureErrors = evalRunner.validateFixtures(fixtures, manifest);

  assert.strictEqual(fixtureErrors.length, 0, fixtureErrors.join("\n"));
  assert.ok(fixtures.length >= 100, "routing eval must include at least 100 fixtures");

  const categories = new Set(fixtures.map((fixture) => fixture.category));
  evalRunner.REQUIRED_CATEGORIES.forEach((category) => {
    assert.ok(categories.has(category), `missing required eval category ${category}`);
  });

  const result = await evalRunner.runEvaluation({ mode: "deterministic" });
  assert.strictEqual(result.skipped, false);
  assert.strictEqual(result.summary.totals.total, fixtures.length);
  assert.strictEqual(result.summary.totals.failed, 0, result.results
    .filter((item) => !item.passed)
    .slice(0, 10)
    .map((item) => `${item.fixture.id}: ${item.errors.join("; ")}`)
    .join("\n"));
  assert.ok(result.summary.totals.prefillAttempted > 0, "prefill checks should run for supported tools");
  assert.strictEqual(result.summary.totals.prefillAttempted, result.summary.totals.prefillPassed);
}

run()
  .then(() => {
    console.log("AI routing eval fixtures validated: deterministic routing and prefill checks passed.");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
