const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/dj-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("adds and extracts Djibouti VAT at the current 10% rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 10,
    net: 100000,
    vat: 10000,
    gross: 110000,
    rounding: "nearest-FDJ",
  });
  const extracted = engine.calculate({ amount: 110000, mode: "extract" });
  assert.deepEqual(
    { net: extracted.net, vat: extracted.vat, gross: extracted.gross },
    { net: 100000, vat: 10000, gross: 110000 },
  );
});

test("rounds VAT to the nearest whole Djibouti franc", () => {
  const result = engine.calculate({ amount: 100005 });
  assert.deepEqual(
    { net: result.net, vat: result.vat, gross: result.gross },
    { net: 100005, vat: 10001, gross: 110006 },
  );
});

test("fails closed for zero-rated and exempt treatments", () => {
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "article-19-export-confirmed",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "article-8-exempt-confirmed",
        rateEvidenceConfirmed: true,
        rateEvidenceType: "customs-export-declaration",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  const exported = engine.calculate({
    amount: 100000,
    rateKind: "article-19-export-confirmed",
    rateEvidenceConfirmed: true,
    rateEvidenceType: "customs-export-declaration",
  });
  assert.deepEqual(
    { rate: exported.rate, vat: exported.vat, gross: exported.gross },
    { rate: 0, vat: 0, gross: 100000 },
  );
  const exempt = engine.calculate({
    amount: 100000,
    rateKind: "article-8-exempt-confirmed",
    rateEvidenceConfirmed: true,
    rateEvidenceType: "article-8-exemption-item",
  });
  assert.equal(exempt.vat, 0);
});

test("screens exact Article 6 turnover boundaries without deciding liability", () => {
  assert.equal(
    engine.thresholdScreen(79999999).status,
    "below-threshold-review",
  );
  assert.equal(engine.thresholdScreen(80000000).status, "next-year-review");
  assert.equal(engine.thresholdScreen(119999999).status, "next-year-review");
  assert.equal(engine.thresholdScreen(120000000).status, "immediate-review");
  assert.equal(engine.thresholdScreen(120000000).determinesLiability, false);
});

test("API accepts only exact Djibouti evidence for 0%", () => {
  const validate = vatApi._test.validateDjiboutiRateRequest;
  assert.equal(validate({ customRate: 10 }).ok, false);
  assert.equal(
    validate({
      customRate: 0,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "generic-export",
    }).ok,
    false,
  );
  assert.deepEqual(
    validate({
      customRate: 0,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "article-19-international-trade-proof",
    }),
    {
      ok: true,
      rate: 0,
      rateEvidenceType: "article-19-international-trade-proof",
    },
  );
});

test("rejects invalid values and exposes reviewed constants", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.thresholdScreen(-1), RangeError);
  assert.equal(engine.STANDARD_RATE, 10);
  assert.equal(engine.NEXT_YEAR_THRESHOLD, 80000000);
  assert.equal(engine.IMMEDIATE_THRESHOLD, 120000000);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
});
