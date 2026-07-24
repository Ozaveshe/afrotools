const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/cd-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("adds and extracts the DGI 16% general rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 16,
    net: 100000,
    vat: 16000,
    gross: 116000,
    rounding: "nearest-CDF",
  });
  const extracted = engine.calculate({ amount: 116000, mode: "extract" });
  assert.deepEqual(
    { net: extracted.net, vat: extracted.vat, gross: extracted.gross },
    { net: 100000, vat: 16000, gross: 116000 },
  );
});

test("fails closed for reduced and qualifying-export treatment", () => {
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "current-reduced-item-confirmed",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "qualifying-export-confirmed",
        rateEvidenceConfirmed: true,
        rateEvidenceType: "generic-export",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.equal(
    engine.calculate({
      amount: 100000,
      rateKind: "current-reduced-item-confirmed",
      rateEvidenceConfirmed: true,
      rateEvidenceType: "current-dgi-eight-percent-item",
    }).vat,
    8000,
  );
  assert.equal(
    engine.calculate({
      amount: 100000,
      rateKind: "qualifying-export-confirmed",
      rateEvidenceConfirmed: true,
      rateEvidenceType: "customs-export-declaration",
    }).vat,
    0,
  );
});

test("screens registration boundary and liberal-profession exception", () => {
  assert.equal(
    engine.registrationScreen(79999999, false).status,
    "below-threshold-review",
  );
  assert.equal(
    engine.registrationScreen(80000000, false).status,
    "threshold-review",
  );
  assert.equal(
    engine.registrationScreen(0, true).status,
    "liberal-profession-review",
  );
  assert.equal(
    engine.registrationScreen(80000000, false).determinesLiability,
    false,
  );
});

test("API accepts only exact DR Congo evidence", () => {
  const validate = vatApi._test.validateDrCongoRateRequest;
  assert.equal(validate({ customRate: 8 }).ok, false);
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
      customRate: 8,
      rateEvidenceConfirmed: true,
      rateEvidenceType: "current-dgi-eight-percent-item",
    }),
    { ok: true, rate: 8, rateEvidenceType: "current-dgi-eight-percent-item" },
  );
});

test("rejects invalid values and exposes reviewed constants", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.registrationScreen(-1), RangeError);
  assert.equal(engine.STANDARD_RATE, 16);
  assert.equal(engine.REDUCED_RATE, 8);
  assert.equal(engine.REGISTRATION_THRESHOLD, 80000000);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
});
