const assert = require("assert");
const fs = require("fs");
const path = require("path");

const sourceConfidence = require("../assets/js/lib/source-confidence.js");

const registryPath = path.join(__dirname, "..", "data", "source-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (error) {
    console.error("not ok - " + name);
    throw error;
  }
}

test("source registry entries satisfy the DataSourceMeta schema", function () {
  assert.strictEqual(registry.schemaVersion, 1);
  assert.ok(Array.isArray(registry.sources));
  const ids = new Set();

  for (const source of registry.sources) {
    assert.ok(source.id, "source id required");
    assert.ok(!ids.has(source.id), "duplicate source id: " + source.id);
    ids.add(source.id);
    assert.ok(source.sourceName, source.id + " sourceName required");
    assert.ok(sourceConfidence.SOURCE_TYPES.includes(source.sourceType), source.id + " sourceType valid");
    assert.ok(Array.isArray(source.countryCodes) && source.countryCodes.length, source.id + " countryCodes required");
    assert.ok(Array.isArray(source.appliesTo) && source.appliesTo.length, source.id + " appliesTo required");
    assert.ok(source.appliesTo.every((scope) => sourceConfidence.APPLIES_TO.includes(scope)), source.id + " appliesTo valid");
    assert.ok(sourceConfidence.FRESHNESS_STATUSES.includes(source.freshnessStatus), source.id + " freshness valid");
    assert.ok(sourceConfidence.CONFIDENCE_LEVELS.includes(source.confidence), source.id + " confidence valid");
    assert.ok(source.displayDisclaimer, source.id + " displayDisclaimer required");
  }
});

test("freshness calculation uses review cadence conservatively", function () {
  const source = {
    sourceName: "Example",
    lastCheckedAt: "2026-01-01",
    reviewCadenceDays: 30,
    freshnessStatus: "fresh",
    confidence: "reviewed"
  };

  assert.strictEqual(sourceConfidence.calculateFreshnessStatus(source, "2026-01-20"), "fresh");
  assert.strictEqual(sourceConfidence.calculateFreshnessStatus(source, "2026-02-15"), "acceptable");
  assert.strictEqual(sourceConfidence.calculateFreshnessStatus(source, "2026-03-10"), "stale");
});

test("confidence label mapping is user-facing and cautious", function () {
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "official_verified" }), "Official verified");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "reviewed" }), "Reviewed");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "estimated" }), "Estimated");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "low_confidence" }), "Low confidence");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "user_entered" }), "User entered");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "nope" }), "Unavailable");
});

test("stale warning behavior flags stale, unknown, unavailable, and low confidence sources", function () {
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "fresh", confidence: "reviewed", lastCheckedAt: "2026-06-01" }, "2026-06-14"), false);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "stale", confidence: "reviewed" }, "2026-06-14"), true);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "unknown", confidence: "reviewed" }, "2026-06-14"), true);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "fresh", confidence: "low_confidence" }, "2026-06-14"), true);
});

test("merged result source keeps the most cautious state", function () {
  const merged = sourceConfidence.mergeSourceMetaForResult([
    { id: "a", sourceName: "A", sourceType: "reviewed_dataset", countryCodes: ["NG"], appliesTo: ["tax"], freshnessStatus: "fresh", confidence: "reviewed", displayDisclaimer: "Reviewed source." },
    { id: "b", sourceName: "B", sourceType: "third_party_snapshot", countryCodes: ["KE"], appliesTo: ["fuel"], freshnessStatus: "stale", confidence: "estimated", displayDisclaimer: "Longer caution copy for estimates." }
  ]);

  assert.strictEqual(merged.sourceName, "Mixed sources");
  assert.strictEqual(merged.freshnessStatus, "stale");
  assert.strictEqual(merged.confidence, "estimated");
  assert.deepStrictEqual(merged.countryCodes.sort(), ["KE", "NG"]);
});

test("unknown source produces cautious copy", function () {
  const unknown = sourceConfidence.getSourceMetaById("missing-source", registry);
  const html = sourceConfidence.renderSourceSummary(unknown);
  assert.match(html, /Unknown source|Source confidence is unavailable/);
  assert.doesNotMatch(html, /Official verified/);
});

test("migrated flagship entries do not overclaim official verification", function () {
  const ids = ["import-duty-planning-rates", "scholarship-provider-feed", "afrofuel-static-snapshot"];
  for (const id of ids) {
    const source = sourceConfidence.getSourceMetaById(id, registry);
    assert.notStrictEqual(source.confidence, "official_verified", id + " should not be official_verified");
    const badge = sourceConfidence.getSourceBadgeProps(source);
    assert.notStrictEqual(badge.label, "Official verified", id + " badge should not say official verified");
  }
});
