const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/cg-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("separates Congo VAT and centimes at the standard rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add", rateKind: "standard", vatRate: 18, centimesRate: 5,
    effectiveRate: 18.9, net: 100000, vat: 18000, centimes: 900,
    totalTax: 18900, gross: 118900,
  });
  const extracted = engine.calculate({ amount: 118900, mode: "extract" });
  assert.equal(extracted.net, 100000);
  assert.equal(extracted.totalTax, 18900);
});

test("fails closed for reduced and zero treatments", () => {
  assert.throws(() => engine.calculate({ amount: 100000, rateKind: "annex-5-confirmed" }), e => e.code === "RATE_EVIDENCE_REQUIRED");
  assert.throws(() => engine.calculate({ amount: 100000, rateKind: "article-22-zero-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "annex-5-tariff-line" }), e => e.code === "RATE_EVIDENCE_REQUIRED");
  const reduced = engine.calculate({ amount: 100000, rateKind: "annex-5-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "annex-5-tariff-line" });
  assert.deepEqual({ vat: reduced.vat, centimes: reduced.centimes, totalTax: reduced.totalTax, gross: reduced.gross }, { vat: 5000, centimes: 250, totalTax: 5250, gross: 105250 });
  const zero = engine.calculate({ amount: 100000, rateKind: "article-22-zero-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "article-22-zero-case" });
  assert.equal(zero.totalTax, 0);
});

test("screens the XAF 100m boundary without deciding liability", () => {
  assert.equal(engine.registrationScreen(99999999).status, "forfait-review");
  assert.equal(engine.registrationScreen(100000000).status, "real-regime-review");
  assert.equal(engine.registrationScreen(100000000).determinesRegistration, false);
});

test("Congo API accepts only exact evidence and matches engine totals", () => {
  assert.equal(vatApi._test.validateCongoRateRequest({ customRate: 5.25 }).ok, false);
  const accepted = vatApi._test.validateCongoRateRequest({ customRate: 5.25, rateEvidenceConfirmed: true, rateEvidenceType: "annex-5-tariff-line" });
  assert.deepEqual(accepted, { ok: true, rate: 5.25, rateEvidenceType: "annex-5-tariff-line" });
  assert.equal(vatApi._test.validateCongoRateRequest({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: "article-22-zero-case" }).ok, true);
  assert.equal(vatApi._test.validateCongoRateRequest({ customRate: 5, rateEvidenceConfirmed: true, rateEvidenceType: "annex-5-tariff-line" }).ok, false);
});

test("rejects invalid values and records reviewed constants", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.equal(engine.STANDARD_EFFECTIVE_RATE, 18.9);
  assert.equal(engine.REDUCED_EFFECTIVE_RATE, 5.25);
});
