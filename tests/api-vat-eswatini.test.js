const assert = require("node:assert/strict");
const test = require("node:test");
const vatApi = require("../netlify/functions/api-vat.js");

test("Eswatini API accepts the standard rate and exact evidenced zero rate", () => {
  assert.deepEqual(vatApi._test.validateEswatiniRateRequest({}), { ok: true, rate: 15 });
  assert.deepEqual(vatApi._test.validateEswatiniRateRequest({ customRate: 15 }), { ok: true, rate: 15 });
  assert.deepEqual(vatApi._test.validateEswatiniRateRequest({ customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: "vat-act-current-second-schedule-zero-rated-supply" }), { ok: true, rate: 0, rateEvidenceType: "vat-act-current-second-schedule-zero-rated-supply" });
});

test("Eswatini API fails closed for unsupported or unevidenced rates", () => {
  for (const request of [
    { customRate: 0 },
    { customRate: 0, rateEvidenceConfirmed: true, rateEvidenceType: "generic-export" },
    { customRate: 12 },
  ]) {
    const result = vatApi._test.validateEswatiniRateRequest(request);
    assert.equal(result.ok, false);
    assert.equal(result.code, "RATE_EVIDENCE_REQUIRED");
  }
});
