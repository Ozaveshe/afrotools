const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/ci-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("calculates and extracts the Côte d'Ivoire 18% common rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 18,
    net: 100000,
    vat: 18000,
    gross: 118000,
  });
  const extracted = engine.calculate({ amount: 118000, mode: "extract" });
  assert.deepEqual(
    { net: extracted.net, vat: extracted.vat, gross: extracted.gross },
    { net: 100000, vat: 18000, gross: 118000 },
  );
});

test("fails closed for reduced and exempt treatments", () => {
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "ordinance-2026-reduced-confirmed",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "article-355-exempt-confirmed",
        rateEvidenceConfirmed: true,
        rateEvidenceType: "ordinance-2026-03-item",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  const reduced = engine.calculate({
    amount: 100000,
    rateKind: "ordinance-2026-reduced-confirmed",
    rateEvidenceConfirmed: true,
    rateEvidenceType: "ordinance-2026-03-item",
  });
  assert.deepEqual(
    { rate: reduced.rate, vat: reduced.vat, gross: reduced.gross },
    { rate: 9, vat: 9000, gross: 109000 },
  );
  const exempt = engine.calculate({
    amount: 100000,
    rateKind: "article-355-exempt-confirmed",
    rateEvidenceConfirmed: true,
    rateEvidenceType: "cgi-article-355-item",
  });
  assert.equal(exempt.vat, 0);
});

test("screens regime bands without deciding VAT liability", () => {
  assert.equal(engine.regimeScreen(200000000).status, "micro-review");
  assert.equal(engine.regimeScreen(200000001).status, "rsi-review");
  assert.equal(engine.regimeScreen(500000001).status, "rni-review");
  assert.equal(engine.regimeScreen(500000001).determinesVatLiability, false);
});

test("API accepts only exact Côte d'Ivoire evidence", () => {
  const validate = vatApi._test.validateCoteDIvoireRateRequest;
  assert.equal(validate({ customRate: 9 }).ok, false);
  assert.equal(
    validate({
      customRate: 9,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "generic-food",
    }).ok,
    false,
  );
  assert.deepEqual(
    validate({
      customRate: 9,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "ordinance-2026-03-item",
    }),
    { ok: true, rate: 9, rateEvidenceType: "ordinance-2026-03-item" },
  );
  assert.equal(
    validate({
      customRate: 0,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "cgi-article-355-item",
    }).ok,
    true,
  );
});

test("rejects invalid values and exposes reviewed constants", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.equal(engine.STANDARD_RATE, 18);
  assert.equal(engine.REDUCED_RATE, 9);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
});
