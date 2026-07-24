const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/gq-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("adds and extracts the official general IVA rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add", rateKind: "standard", rate: 15,
    net: 100000, vat: 15000, gross: 115000, rounding: "nearest-XAF",
  });
  const extracted = engine.calculate({ amount: 115000, mode: "extract" });
  assert.deepEqual(
    { net: extracted.net, vat: extracted.vat, gross: extracted.gross },
    { net: 100000, vat: 15000, gross: 115000 },
  );
});

test("fails closed for both Article 13 import treatments", () => {
  assert.throws(
    () => engine.calculate({ amount: 100000, rateKind: "lpge-2026-reduced-import-confirmed" }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.throws(
    () => engine.calculate({ amount: 100000, rateKind: "lpge-2026-zero-import-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "generic-food" }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.equal(engine.calculate({ amount: 100000, rateKind: "lpge-2026-reduced-import-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "lpge-2026-article-13-five-import-line" }).vat, 5000);
  assert.equal(engine.calculate({ amount: 100000, rateKind: "lpge-2026-zero-import-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "lpge-2026-article-13-zero-import-line" }).vat, 0);
});

test("API accepts only matching Equatorial Guinea evidence", () => {
  const validate = vatApi._test.validateEquatorialGuineaRateRequest;
  assert.equal(validate({ customRate: 5 }).ok, false);
  assert.equal(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: "generic-export" }).ok, false);
  assert.deepEqual(validate({ customRate: 5, rateEvidenceConfirmed: true, rateEvidenceType: "lpge-2026-article-13-five-import-line" }), { ok: true, rate: 5, rateEvidenceType: "lpge-2026-article-13-five-import-line" });
  assert.deepEqual(validate({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: "lpge-2026-article-13-zero-import-line" }), { ok: true, rate: 0, rateEvidenceType: "lpge-2026-article-13-zero-import-line" });
});

test("rejects invalid values and exposes reviewed constants", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.equal(engine.STANDARD_RATE, 15);
  assert.equal(engine.REDUCED_RATE, 5);
  assert.equal(engine.ZERO_RATE, 0);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
});
