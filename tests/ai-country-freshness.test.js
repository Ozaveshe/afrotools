#!/usr/bin/env node
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const workflowText = read("assets/js/ai/country-workflow.js");
const helperText = read("assets/js/lib/source-confidence.js");
const atlasText = read("engines/afroatlas-engine.js");
const registryText = read("data/source-registry.json");
const pageText = read("ai/index.html");
const query = "Compare Nigeria and Kenya for remote work";
const results = [];
function test(name, fn) {
  try { fn(); results.push({name, pass:true}); }
  catch (error) { results.push({name, pass:false, error:error.message}); }
}
function fixture(options) {
  const opts = options || {};
  let now = opts.day || "2026-10-19";
  const NativeDate = Date;
  class Clock extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [now + "T12:00:00Z"])); }
    static now() { return new NativeDate(now + "T12:00:00Z").getTime(); }
  }
  const scope = { Date:Clock };
  vm.runInNewContext(atlasText, scope, {filename:"engines/afroatlas-engine.js"});
  function helper() {
    const isolated = { Date:Clock };
    vm.runInNewContext(helperText, isolated, {filename:"assets/js/lib/source-confidence.js"});
    return isolated.AfroToolsSourceConfidence;
  }
  if (opts.mode === "commonjs") {
    scope.module = {exports:{}};
    scope.__dirname = "/repo/assets/js/ai";
    scope.require = (id) => {
      if (id === "../lib/source-confidence.js") return opts.helper === "missing-capability" ? {} : helper();
      if (id === "path") return path;
      if (id === "fs") return {readFileSync(file, encoding) {
        assert.strictEqual(file, path.join(scope.__dirname, "..", "..", "..", "data", "source-registry.json"));
        assert.strictEqual(encoding, "utf8");
        return opts.registry || registryText;
      }};
      throw new Error("Unexpected dependency: " + id);
    };
  } else if (opts.helper === "early") scope.AfroToolsSourceConfidence = helper();
  else if (opts.helper === "legacy") scope.AfroTools = {sourceConfidence:helper()};
  vm.runInNewContext(workflowText, scope, {filename:"assets/js/ai/country-workflow.js"});
  const api = scope.module ? scope.module.exports : scope.AfroToolsAICountryWorkflow;
  const result = {api, sharedStatus(meta) {return helper().calculateFreshnessStatus(meta);}, attachHelper() {scope.AfroToolsSourceConfidence = helper();}, setDay(day) {now = day;}, plan() {return api.buildCountryPlan({}, {query});}};
  if (!opts.mode && (!opts.helper || opts.helper === "late")) scope.AfroToolsSourceConfidence = helper();
  return result;
}
function source(plan, id) {
  const row = plan.dataConfidence.find((item) => item.id === id);
  assert.ok(row, "Missing source " + id);
  return row;
}
function status(f, id) {return source(f.plan(), id).freshnessStatus;}
const rates = "afrorates-policy-rate-pack", fuel = "afrofuel-static-snapshot", fx = "forex-third-party-snapshot";
// Synthetic metadata for deterministic age regressions, not an assertion of current source dates.
// Retain the real registry row's identity/context; override every date/cadence/status used by age policy.
function fixedRegistry(overrides) {
  const registry = JSON.parse(registryText);
  const row = registry.sources.find((item) => item.id === fx);
  assert.ok(row, "Forex source identity must remain in the registry");
  Object.assign(row, {lastCheckedAt:"2026-09-24",lastReviewedAt:"2026-09-24",effectiveFrom:null,
    reviewCadenceDays:7,freshnessStatus:"fresh"}, overrides || {});
  return JSON.stringify(registry);
}
test("Actual public page loads the shared helper after workflow", () => {
  const a = pageText.indexOf('src="/assets/js/ai/country-workflow.js');
  const b = pageText.indexOf('src="/assets/js/lib/source-confidence.js');
  assert.ok(a > 0 && b > a);
});
test("Public late-helper plan finds real countries and ages fallback rates", () => {
  const f = fixture(), p = f.plan();
  assert.strictEqual(p.countrySummary.name, "Nigeria");
  assert.strictEqual(p.comparisonSummary.name, "Kenya");
  assert.strictEqual(status(f, rates), "stale");
  assert.match(f.api.renderCountryPanel(p), /<span>stale<\/span><strong>AfroRates/);
});
test("Public late-helper ages fallback fuel", () => assert.strictEqual(status(fixture(), fuel), "stale"));
test("Public early-helper global also calculates age", () => assert.strictEqual(status(fixture({helper:"early"}), rates), "stale"));
test("Legacy nested helper alias remains supported", () => assert.strictEqual(status(fixture({helper:"legacy"}), rates), "stale"));
test("No helper cannot present stored acceptable as current", () => {
  const f = fixture({helper:"missing"});
  assert.strictEqual(status(f, rates), "unknown");
  assert.strictEqual(status(f, fuel), "unknown");
});
test("Actual public unknown source remains unknown", () => assert.strictEqual(status(fixture(), "unknown-source"), "unknown"));
test("Fallback default cadence includes exact fresh boundary", () => assert.strictEqual(status(fixture({day:"2026-07-07"}), rates), "fresh"));
test("Fallback default cadence moves to acceptable after fresh boundary", () => assert.strictEqual(status(fixture({day:"2026-07-08"}), rates), "acceptable"));
test("Fallback default cadence includes exact acceptable boundary", () => assert.strictEqual(status(fixture({day:"2026-10-05"}), rates), "acceptable"));
test("Fallback default cadence becomes stale after acceptable boundary", () => assert.strictEqual(status(fixture({day:"2026-10-06"}), rates), "stale"));
test("Same live module re-evaluates age on each new plan", () => {
  const f = fixture({day:"2026-07-07"});
  assert.strictEqual(status(f, rates), "fresh");
  f.setDay("2026-10-19");
  assert.strictEqual(status(f, rates), "stale");
});
test("Explicit fixed registry fixture ages a recorded fresh forex flag to stale", () => {
  const f = fixture({mode:"commonjs",registry:fixedRegistry()});
  assert.strictEqual(status(f, fx), "stale");
});
test("Actual registry read flow delegates current rows to the shared age policy", () => {
  const f = fixture({mode:"commonjs"});
  const registry = JSON.parse(registryText);
  for (const id of [fx, rates, fuel]) {
    const row = registry.sources.find((item) => item.id === id);
    assert.ok(row, "Missing current registry identity " + id);
    assert.strictEqual(status(f, id), f.sharedStatus(row));
  }
});
for (const [day, expected] of [["2026-10-01","fresh"],["2026-10-02","acceptable"],["2026-10-08","acceptable"],["2026-10-09","stale"]]) {
  test("Explicit fixed 7-day registry fixture at " + day + " is " + expected, () =>
    assert.strictEqual(status(fixture({mode:"commonjs",registry:fixedRegistry(),day}), fx), expected));
}
test("Explicit unavailable remains unavailable despite a recent date", () => {
  assert.strictEqual(status(fixture({mode:"commonjs",registry:fixedRegistry({freshnessStatus:"unavailable"}),day:"2026-09-24"}), fx), "unavailable");
});
test("Undated unknown remains unknown", () => {
  assert.strictEqual(status(fixture({mode:"commonjs",registry:fixedRegistry({lastCheckedAt:null,lastReviewedAt:null,freshnessStatus:"unknown"})}), fx), "unknown");
});
test("Late helper changes only freshness in the complete public plan", () => {
  const f = fixture({helper:"missing"}), before = JSON.parse(JSON.stringify(f.plan()));
  f.attachHelper();
  const after = JSON.parse(JSON.stringify(f.plan()));
  for (const plan of [before, after]) plan.dataConfidence.forEach((row) => delete row.freshnessStatus);
  assert.deepStrictEqual(after, before);
});
test("Rendered public source cards preserve all non-status HTML", () => {
  const f = fixture({helper:"missing"});
  const before = f.api.renderCountryPanel(f.plan());
  f.attachHelper();
  const after = f.api.renderCountryPanel(f.plan());
  const statuses = /(<div class="ai-country-source"><span>)(fresh|acceptable|stale|unknown|unavailable)(<\/span>)/g;
  assert.strictEqual(after.replace(statuses, "$1STATUS$3"), before.replace(statuses, "$1STATUS$3"));
});
test("Missing calculation capability preserves explicit unavailable", () => {
  assert.strictEqual(status(fixture({mode:"commonjs",helper:"missing-capability",registry:fixedRegistry({freshnessStatus:"unavailable"})}), fx), "unavailable");
});
test("Missing calculation capability cannot claim stored registry freshness", () => {
  assert.strictEqual(status(fixture({mode:"commonjs",helper:"missing-capability",registry:fixedRegistry()}), fx), "unknown");
});
test("Legitimate later registry refresh is accepted without fixed-date assertions", () => {
  const refreshed = fixedRegistry({lastCheckedAt:"2026-10-18",lastReviewedAt:"2026-10-18",reviewCadenceDays:30,freshnessStatus:"acceptable"});
  const f = fixture({mode:"commonjs",registry:refreshed});
  assert.strictEqual(status(f, fx), "fresh");
  assert.strictEqual(status(f, fx), f.sharedStatus(JSON.parse(refreshed).sources.find((row) => row.id === fx)));
});
test("Legitimate unavailable registry update remains unavailable without date assertions", () => {
  const updated = fixedRegistry({lastCheckedAt:"2026-10-18",lastReviewedAt:"2026-10-18",reviewCadenceDays:30,freshnessStatus:"unavailable"});
  const f = fixture({mode:"commonjs",registry:updated});
  assert.strictEqual(status(f, fx), "unavailable");
});
console.log(JSON.stringify({suite:"ai-country-freshness",passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results}, null, 2));
if (results.some((r) => !r.pass)) throw new Error("AI country freshness regression failed");
