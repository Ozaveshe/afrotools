const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adminConfidence = require("../assets/js/lib/admin-data-confidence.js");

const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "source-registry.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "_meta.json"), "utf8"));
const latestReviewDate = Math.max.apply(null, registry.sources.map(function (source) {
  return Date.parse(source.lastCheckedAt || source.lastReviewedAt || source.effectiveFrom || "1970-01-01");
}));
const REVIEW_AS_OF = new Date(latestReviewDate + (366 * 3 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);

function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (error) {
    console.error("not ok - " + name);
    throw error;
  }
}

function products(adminStatus) {
  return adminConfidence.buildDataProducts(registry, meta, adminStatus || null, REVIEW_AS_OF);
}

test("admin data confidence helper tracks all required data lanes", function () {
  const rows = products();
  const sections = rows.map((row) => row.section).sort();

  assert.deepStrictEqual(sections, [
    "API health",
    "FX rates",
    "PAYE/tax rules",
    "VAT rates",
    "country intelligence data",
    "fuel prices",
    "import-duty rule packs",
    "scholarships"
  ].sort());

  for (const row of rows) {
    assert.ok(row.sourceName, row.id + " sourceName required");
    assert.ok(row.sourceStatus, row.id + " sourceStatus required");
    assert.ok(row.lastCheckedAt || row.id === "api-health", row.id + " checked date expected");
    assert.ok(row.lastReviewedAt || row.id === "api-health", row.id + " reviewed date expected");
    assert.ok(row.confidence, row.id + " confidence required");
    assert.ok(row.countryCoverage, row.id + " country coverage required");
    assert.ok(row.nextReviewAction, row.id + " next action required");
  }
});

test("stale and estimated datasets are highlighted for review", function () {
  const rows = products();
  const fx = rows.find((row) => row.id === "fx-rates");
  const fuel = rows.find((row) => row.id === "fuel-prices");

  assert.strictEqual(fx.freshnessStatus, "stale");
  assert.strictEqual(fx.confidence, "estimated");
  assert.strictEqual(fx.severity, "warning");
  assert.match(fx.nextReviewAction, /Refresh|official|estimate/i);

  assert.strictEqual(fuel.freshnessStatus, "stale");
  assert.strictEqual(fuel.confidence, "estimated");
  assert.strictEqual(fuel.severity, "warning");
  assert.match(fuel.statusNote, /Static fuel prices|not marked official/i);
});

test("protected API health can report healthy, degraded, or unavailable states", function () {
  const healthyRows = products({
    checked_at: "2026-06-16T08:00:00Z",
    summary: { overall_health: "healthy", endpoints: { working: 10, protected: 2, degraded: 0, broken: 0 } },
    warnings: []
  });
  const healthy = healthyRows.find((row) => row.id === "api-health");
  assert.strictEqual(healthy.sourceStatus, "healthy");
  assert.strictEqual(healthy.freshnessStatus, "fresh");
  assert.strictEqual(healthy.confidence, "reviewed");

  const degradedRows = products({
    checked_at: "2026-06-16T08:00:00Z",
    summary: { overall_health: "degraded", endpoints: { working: 9, protected: 2, degraded: 1, broken: 0 } },
    warnings: ["Forex latest is degraded."]
  });
  const degraded = degradedRows.find((row) => row.id === "api-health");
  assert.strictEqual(degraded.sourceStatus, "degraded");
  assert.strictEqual(degraded.freshnessStatus, "stale");
  assert.strictEqual(degraded.severity, "warning");
  assert.match(degraded.statusNote, /Forex latest/);

  const unavailable = products().find((row) => row.id === "api-health");
  assert.strictEqual(unavailable.sourceStatus, "unavailable");
  assert.strictEqual(unavailable.freshnessStatus, "unknown");
  assert.strictEqual(unavailable.confidence, "low_confidence");
});

test("summary and filters support admin review workflows", function () {
  const rows = products();
  const summary = adminConfidence.buildSummary(rows);
  assert.strictEqual(summary.total, 8);
  assert.ok(summary.needsReview >= 3, "stale/unknown lanes should need review");
  assert.ok(summary.lowConfidence >= 2, "estimated/low-confidence lanes should be counted");

  const taxRows = adminConfidence.filterProducts(rows, { category: "tax" });
  assert.deepStrictEqual(taxRows.map((row) => row.id).sort(), ["paye-tax", "vat-rates"]);

  const estimatedRows = adminConfidence.filterProducts(rows, { confidence: "estimated" });
  assert.ok(estimatedRows.some((row) => row.id === "fx-rates"));
  assert.ok(estimatedRows.some((row) => row.id === "fuel-prices"));

  const nigeriaRows = adminConfidence.filterProducts(rows, { country: "NG" });
  assert.strictEqual(nigeriaRows.length, rows.length, "ALL coverage and NG packs should match Nigeria filter");

  const staleRows = adminConfidence.filterProducts(rows, { freshness: "stale" });
  assert.ok(staleRows.every((row) => row.freshnessStatus === "stale"));
});

test("review exports are view-only snapshots without destructive fields", function () {
  const rows = products();
  const csv = adminConfidence.toReviewCsv(rows);
  const json = adminConfidence.toReviewJson(rows);
  const parsed = JSON.parse(json);

  assert.match(csv, /section,category,sourceStatus/);
  assert.match(csv, /fuel prices/);
  assert.strictEqual(parsed.length, 8);
  assert.ok(parsed.every((row) => row.nextReviewAction));
  assert.ok(parsed.every((row) => row.editUrl === undefined));
  assert.ok(parsed.every((row) => row.deleteUrl === undefined));
  assert.doesNotMatch(csv, /delete|publish|approve/i);
  assert.doesNotMatch(json, /deleteUrl|editUrl|publishUrl/);
});

test("admin dashboard is gated and does not expose write controls", function () {
  const html = fs.readFileSync(path.join(__dirname, "..", "admin", "data-confidence.html"), "utf8");

  assert.match(html, /\/api\/admin-session/);
  assert.match(html, /sessionStorage\.setItem\("admin_key"/);
  assert.match(html, /View-only/);
  assert.match(html, /Export CSV/);
  assert.match(html, /Export JSON/);
  assert.doesNotMatch(html, /Delete|Publish|Approve|Reject|Save changes/);
});
