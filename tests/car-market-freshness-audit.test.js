const test = require("node:test");
const assert = require("node:assert/strict");
const { auditMarketObservations, auditExitCode } = require("../scripts/audit-car-market-observations");
const NOW = new Date("2026-10-02T00:00:00Z");

function fixture() {
  const vehicle = { id: "toyota-corolla-2018", make: "Toyota", model: "Corolla", year: 2018 };
  const local = {
    vehicleId: vehicle.id, countryCode: "NG", market: "Lagos", condition: "Foreign used", currency: "NGN",
    sourceName: "Synthetic dealer", sourceUrl: "https://example.org/local", method: "Quartiles of three asks",
    limitations: "Asking prices; availability unconfirmed", reviewedAt: "2026-09-30", sampleSize: 3,
    lowerQuartile: 2000000, median: 3000000, upperQuartile: 4000000
  };
  const source = {
    ...local, sourceMarket: "uae", market: "Dubai", currency: "AED", sourceUrl: "https://example.org/source",
    sampleVariant: "2018 Corolla petrol", sourceSnapshotAt: "2026-09-30",
    sourceCurrencyPerUsd: 4, fxSourceName: "Synthetic FX", fxSourceUrl: "https://example.org/fx"
  };
  return {
    price: {
      staleAfterDays: 14, countries: { NG: {} }, vehicles: [vehicle],
      localMarketPrices: [{ country_code: "NG", make: vehicle.make, model: vehicle.model, year: 2018,
        source_url: local.sourceUrl, median_ask: local.median, sample_size: 3 }],
      sourceMarketPrices: [{ source_market: "uae", make: vehicle.make, model: vehicle.model, year: 2018,
        source_url: source.sourceUrl, median_price: 750000, sample_size: 3 }]
    },
    local: { observations: [local] }, source: { observations: [source] }
  };
}
const audit = (f, now = NOW) => auditMarketObservations(f.price, f.local, f.source, { now });

test("fresh synthetic samples pass both validation and strict freshness", () => {
  const report = audit(fixture());
  assert.equal(report.asOf, NOW.toISOString());
  assert.equal(report.validationFailed, false);
  assert.equal(report.freshnessFailed, false);
  assert.equal(auditExitCode(report, true), 0);
});

test("a fresh review cannot reset an old source snapshot", () => {
  const f = fixture();
  f.source.observations[0].sourceSnapshotAt = "2026-09-16";
  const report = audit(f);
  assert.equal(report.validationFailed, false);
  assert.equal(report.counts.staleSource, 1);
  assert.deepEqual(report.stale.source[0], {
    key: "uae:toyota-corolla-2018", dateField: "sourceSnapshotAt", date: "2026-09-16",
    sourceUrl: "https://example.org/source"
  });
  assert.equal(auditExitCode(report), 0, "default remains a validation check with stale diagnostics");
  assert.equal(auditExitCode(report, true), 1, "automation strict mode must fail on stale input");
});

test("the exact 14-day boundary passes, then expires", () => {
  const f = fixture();
  f.local.observations[0].reviewedAt = "2026-09-18";
  assert.equal(audit(f).counts.staleLocal, 0);
  assert.equal(audit(f, new Date(NOW.getTime() + 1)).counts.staleLocal, 1);
});

test("the configured price-pack window controls the audit", () => {
  const f = fixture(); f.price.staleAfterDays = 1;
  assert.equal(audit(f).counts.staleLocal, 1);
  assert.equal(audit(f).counts.staleSource, 1);
});

test("missing or malformed freshness policy is refused", () => {
  for (const value of [undefined, 0, -1, "14", 1.5, 366]) {
    const f = fixture(); f.price.staleAfterDays = value;
    assert.throws(() => audit(f), /freshness window/);
  }
});

test("calendar rollover and missing dates are validation failures", () => {
  for (const value of ["2026-02-30", "2026-09-31", undefined, "yesterday"]) {
    const f = fixture();
    f.local.observations[0].reviewedAt = value;
    f.source.observations[0].reviewedAt = value;
    f.source.observations[0].sourceSnapshotAt = value;
    const report = audit(f);
    assert.equal(report.validationFailed, true);
    assert.equal(auditExitCode(report), 1);
    assert.ok(report.problems.some(problem => problem.includes("invalid source snapshot date")));
    assert.ok(report.problems.some(problem => problem.includes("invalid review date")));
  }
});

test("future source dates and reviews preceding source evidence fail", () => {
  const f = fixture(); f.source.observations[0].sourceSnapshotAt = "2026-10-03";
  let report = audit(f);
  assert.ok(report.problems.some(problem => problem.includes("source snapshot date is in the future")));
  f.source.observations[0].sourceSnapshotAt = "2026-10-01";
  report = audit(f);
  assert.ok(report.problems.some(problem => problem.includes("review precedes source snapshot")));
});

test("invalid audit clocks and missing evidence arrays fail instead of reporting healthy", () => {
  assert.throws(() => audit(fixture(), new Date("invalid")), /audit clock/);
  const f = fixture(); delete f.source.observations;
  assert.throws(() => audit(f), /observation arrays/);
});

test("empty evidence reports uncovered starter profiles and invents no ranges", () => {
  const f = fixture(); f.local.observations = []; f.source.observations = [];
  const report = audit(f);
  assert.equal(report.counts.localObservations, 0);
  assert.equal(report.counts.sourceObservations, 0);
  assert.deepEqual(report.uncoveredNigeria, ["toyota-corolla-2018"]);
  assert.deepEqual(report.stale, { local: [], source: [] });
  assert.equal(report.freshnessFailed, false);
});

test("projection mismatches fail even without strict mode", () => {
  const f = fixture(); f.price.localMarketPrices[0].median_ask = 1;
  const report = audit(f);
  assert.equal(report.freshnessFailed, false);
  assert.equal(auditExitCode(report), 1);
  assert.ok(report.problems.some(problem => problem.includes("interactive price pack")));
});
