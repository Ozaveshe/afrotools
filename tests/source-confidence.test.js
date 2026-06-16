const assert = require("assert");
const fs = require("fs");
const path = require("path");

const sourceConfidence = require("../assets/js/lib/source-confidence.js");

const registryPath = path.join(__dirname, "..", "data", "source-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const schemaPath = path.join(__dirname, "..", "data", "source-registry.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (error) {
    console.error("not ok - " + name);
    throw error;
  }
}

test("DataSourceMeta schema exposes the shared source and confidence contract", function () {
  const dataSourceMeta = schema.$defs.DataSourceMeta;
  assert.ok(dataSourceMeta, "DataSourceMeta schema required");
  for (const field of [
    "id",
    "sourceName",
    "sourceType",
    "countryCodes",
    "appliesTo",
    "lastCheckedAt",
    "lastReviewedAt",
    "freshnessStatus",
    "confidence",
    "notes",
    "displayDisclaimer"
  ]) {
    assert.ok(dataSourceMeta.required.includes(field), field + " should be required");
  }
  for (const sourceType of [
    "official",
    "regulator",
    "central_bank",
    "university",
    "foundation",
    "reviewed_dataset",
    "third_party_snapshot",
    "user_input",
    "estimate"
  ]) {
    assert.ok(dataSourceMeta.properties.sourceType.enum.includes(sourceType), sourceType + " sourceType supported");
    assert.ok(sourceConfidence.SOURCE_TYPES.includes(sourceType), sourceType + " helper sourceType supported");
  }
  assert.deepStrictEqual(dataSourceMeta.properties.sourceType.enum, sourceConfidence.SOURCE_TYPES);
  for (const confidence of ["official_verified", "reviewed", "estimated", "low_confidence", "user_entered"]) {
    assert.ok(dataSourceMeta.properties.confidence.enum.includes(confidence), confidence + " confidence supported");
    assert.ok(sourceConfidence.CONFIDENCE_LEVELS.includes(confidence), confidence + " helper confidence supported");
  }
  assert.deepStrictEqual(dataSourceMeta.properties.confidence.enum, sourceConfidence.CONFIDENCE_LEVELS);
});

test("source registry entries satisfy the DataSourceMeta schema", function () {
  assert.strictEqual(registry.schemaVersion, 1);
  assert.ok(Array.isArray(registry.sources));
  const ids = new Set();

  for (const source of registry.sources) {
    assert.ok(source.id, "source id required");
    assert.ok(!ids.has(source.id), "duplicate source id: " + source.id);
    ids.add(source.id);
    for (const field of schema.$defs.DataSourceMeta.required) {
      assert.ok(Object.prototype.hasOwnProperty.call(source, field), source.id + " " + field + " required");
    }
    assert.ok(source.sourceName, source.id + " sourceName required");
    assert.ok(schema.$defs.DataSourceMeta.properties.sourceType.enum.includes(source.sourceType), source.id + " sourceType valid against schema");
    assert.ok(sourceConfidence.SOURCE_TYPES.includes(source.sourceType), source.id + " sourceType valid");
    assert.ok(Array.isArray(source.countryCodes) && source.countryCodes.length, source.id + " countryCodes required");
    assert.ok(Array.isArray(source.appliesTo) && source.appliesTo.length, source.id + " appliesTo required");
    assert.ok(source.appliesTo.every((scope) => sourceConfidence.APPLIES_TO.includes(scope)), source.id + " appliesTo valid");
    assert.ok(sourceConfidence.FRESHNESS_STATUSES.includes(source.freshnessStatus), source.id + " freshness valid");
    assert.ok(sourceConfidence.CONFIDENCE_LEVELS.includes(source.confidence), source.id + " confidence valid");
    assert.ok(source.notes !== undefined, source.id + " notes required");
    assert.ok(source.lastCheckedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(source.lastCheckedAt), source.id + " lastCheckedAt date or null");
    assert.ok(source.lastReviewedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(source.lastReviewedAt), source.id + " lastReviewedAt date or null");
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
  assert.strictEqual(sourceConfidence.calculateFreshnessStatus({ freshnessStatus: "unavailable" }, "2026-01-20"), "unavailable");
  assert.strictEqual(sourceConfidence.calculateFreshnessStatus({ freshnessStatus: "unknown" }, "2026-01-20"), "unknown");
});

test("confidence label mapping is user-facing and cautious", function () {
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "official_verified" }), "Official verified");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "reviewed" }), "Reviewed");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "estimated" }), "Estimated");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "low_confidence" }), "Low confidence");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "user_entered" }), "User entered");
  assert.strictEqual(sourceConfidence.getConfidenceLabel({ confidence: "nope" }), "Low confidence");
});

test("stale warning behavior flags stale, unknown, unavailable, and low confidence sources", function () {
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "fresh", confidence: "reviewed", lastCheckedAt: "2026-06-01" }, "2026-06-14"), false);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "stale", confidence: "reviewed" }, "2026-06-14"), true);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "unknown", confidence: "reviewed" }, "2026-06-14"), true);
  assert.strictEqual(sourceConfidence.shouldShowStaleWarning({ freshnessStatus: "fresh", confidence: "low_confidence" }, "2026-06-14"), true);
});

test("source badge helpers render cautious, reusable UI fragments", function () {
  const source = {
    sourceName: "Example reviewed source",
    sourceType: "reviewed_dataset",
    countryCodes: ["NG"],
    appliesTo: ["tax"],
    freshnessStatus: "stale",
    confidence: "reviewed",
    lastCheckedAt: "2025-01-01",
    lastReviewedAt: "2025-01-01",
    displayDisclaimer: "Review current authority guidance before filing."
  };

  assert.match(sourceConfidence.SourceBadge(source), /Reviewed source/);
  assert.match(sourceConfidence.FreshnessBadge(source, "2026-06-14"), /Stale/);
  assert.match(sourceConfidence.ConfidenceNotice(source), /Review current authority guidance/);
  assert.match(sourceConfidence.StaleDataWarning(source, "2026-06-14"), /Verify before making a high-stakes decision/);
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
  const ids = [
    "import-duty-planning-rates",
    "scholarship-provider-feed",
    "afrofuel-static-snapshot",
    "forex-third-party-snapshot",
    "vat-country-rate-packs"
  ];
  for (const id of ids) {
    const source = sourceConfidence.getSourceMetaById(id, registry);
    assert.notStrictEqual(source.confidence, "official_verified", id + " should not be official_verified");
    const badge = sourceConfidence.getSourceBadgeProps(source);
    assert.notStrictEqual(badge.label, "Official verified", id + " badge should not say official verified");
  }
});

test("named data-heavy lanes are represented in the shared source registry", function () {
  const requiredIds = [
    "afrofuel-static-snapshot",
    "forex-third-party-snapshot",
    "afrorates-policy-rate-pack",
    "scholarship-provider-feed",
    "country-profile-reviewed-dataset",
    "import-duty-planning-rates",
    "paye-tax-engine-country-packs",
    "vat-country-rate-packs"
  ];

  for (const id of requiredIds) {
    const source = sourceConfidence.getSourceMetaById(id, registry);
    assert.strictEqual(source.id, id, id + " should exist");
    assert.ok(source.countryCodes.length, id + " should have country scope");
    assert.ok(source.lastCheckedAt || source.lastReviewedAt, id + " should have checked or reviewed metadata");
  }
});

test("migrated data-heavy tools include source registry UI hooks", function () {
  const pages = [
    ["tools/import-duty/index.html", "import-duty-planning-rates"],
    ["tools/fuel-tracker/index.html", "afrofuel-static-snapshot"],
    ["tools/paye-calculator/index.html", "paye-tax-engine-country-packs"]
  ];

  for (const [file, sourceId] of pages) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.match(html, /source-confidence\.js/, file + " should load source-confidence helper");
    assert.ok(html.includes('data-source-meta-id="' + sourceId + '"'), file + " should render " + sourceId);
  }
});
