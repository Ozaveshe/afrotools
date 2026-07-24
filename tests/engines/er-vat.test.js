const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../../assets/js/engines/er-vat.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("Eritrea calculator fails closed without exact rate evidence", () => {
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: "goods-five-confirmed" }), error => error.code === "RATE_EVIDENCE_REQUIRED");
});

test("calculates 5% goods reference only with matching evidence", () => {
  assert.deepEqual(engine.calculate({ amount: 10000, mode: "add", rateKind: "goods-five-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "listed-goods-five-percent" }), {
    mode: "add", rateKind: "goods-five-confirmed", rate: 5, net: 10000, tax: 500, gross: 10500, legalCurrency: "ERN", currentRateConfirmed: false, sourceAsOf: "2002-12-31"
  });
});

test("extracts the 12% residual-goods reference", () => {
  const result = engine.calculate({ amount: 11200, mode: "extract", rateKind: "goods-twelve-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "residual-goods-twelve-percent" });
  assert.deepEqual({ net: result.net, tax: result.tax, gross: result.gross }, { net: 10000, tax: 1200, gross: 11200 });
});

test("API rejects Eritrea without an explicit evidenced band", () => {
  const validate = vatApi._test.validateEritreaRateRequest;
  assert.equal(validate({}).code, "RATE_EVIDENCE_REQUIRED");
  assert.equal(validate({ customRate: 5, rateEvidenceConfirmed: true, rateEvidenceType: "unverified" }).code, "RATE_EVIDENCE_REQUIRED");
});

test("API accepts only matching Eritrea evidence types", () => {
  const validate = vatApi._test.validateEritreaRateRequest;
  assert.deepEqual(validate({ customRate: 10, rateEvidenceConfirmed: true, rateEvidenceType: "listed-services-ten-percent" }), { ok: true, rate: 10, rateEvidenceType: "listed-services-ten-percent" });
  assert.equal(validate({ customRate: 10, rateEvidenceConfirmed: true, rateEvidenceType: "listed-goods-five-percent" }).ok, false);
});
