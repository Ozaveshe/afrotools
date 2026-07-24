const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const engine = require("../../assets/js/engines/km-consumption-tax.js");
const vatApi = require("../../netlify/functions/api-vat.js");

test("adds and extracts the 10% Comoros consumption tax", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 10,
    net: 100000,
    tax: 10000,
    gross: 110000,
  });
  assert.deepEqual(engine.calculate({ amount: 110000, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 10,
    net: 100000,
    tax: 10000,
    gross: 110000,
  });
});

test("supports only exact evidence-gated Article 152 rates", () => {
  assert.equal(
    engine.resolveRate("article-152-utilities-interisland-confirmed"),
    3,
  );
  assert.equal(
    engine.resolveRate("article-152-hospitality-bank-fixed-confirmed"),
    5,
  );
  assert.equal(
    engine.resolveRate("article-152-international-transport-confirmed"),
    5,
  );
  assert.equal(
    engine.resolveRate("article-152-mobile-recharge-confirmed"),
    7.5,
  );
  assert.equal(engine.resolveRate("article-152-casino-confirmed"), 25);
  assert.equal(engine.resolveRate("article-152-essential-list-confirmed"), 0);
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "article-152-mobile-recharge-confirmed",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.throws(
    () =>
      engine.calculate({
        amount: 100000,
        rateKind: "article-152-mobile-recharge-confirmed",
        rateEvidenceConfirmed: true,
        rateEvidenceType: "article-152-casino",
      }),
    (error) => error.code === "RATE_EVIDENCE_REQUIRED",
  );
  assert.equal(
    engine.calculate({
      amount: 100000,
      rateKind: "article-152-mobile-recharge-confirmed",
      rateEvidenceConfirmed: true,
      rateEvidenceType: "article-152-mobile-recharge",
    }).tax,
    7500,
  );
  assert.throws(() => engine.resolveRate("reduced"), /unsupported/);
  assert.throws(() => engine.resolveRate("zero"), /unsupported/);
});

test("calculates mixed invoice lines", () => {
  assert.deepEqual(
    engine.calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100000, rateKind: "standard" },
      {
        quantity: 1,
        unitPrice: 200000,
        rateKind: "article-152-mobile-recharge-confirmed",
        rateEvidenceConfirmed: true,
        rateEvidenceType: "article-152-mobile-recharge",
      },
    ]),
    { net: 300000, tax: 25000, gross: 325000 },
  );
});

test("screens Article 141 threshold and importer exception boundaries", () => {
  assert.equal(
    engine.thresholdScreen(14999999, true).status,
    "below-threshold-review",
  );
  assert.equal(
    engine.thresholdScreen(15000000, true).status,
    "importer-exception-review",
  );
  assert.equal(
    engine.thresholdScreen(19999999, true).status,
    "importer-exception-review",
  );
  assert.equal(
    engine.thresholdScreen(19999999, false).status,
    "below-threshold-review",
  );
  assert.equal(
    engine.thresholdScreen(20000000, false).status,
    "taxable-review",
  );
});

test("records official terminology and formula review", () => {
  assert.equal(engine.STANDARD_RATE, 10);
  assert.equal(engine.GENERAL_THRESHOLD, 20000000);
  assert.equal(engine.IMPORTER_EXCEPTION_START, 15000000);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.match(engine.formulaParameters.standard, /consumption-tax/);
  assert.match(engine.formulaParameters.threshold, /importers/);
  assert.match(engine.formulaParameters.incomingCallTermination, /KMF 50/);
});

test("rejects empty and negative inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.thresholdScreen(-1, false), RangeError);
});

test("executes accepted and rejected Comoros API evidence requests", () => {
  const rejectedMissing = vatApi._test.validateComorosRateRequest({
    country: "KM",
    amount: 100000,
    customRate: 7.5,
  });
  assert.deepEqual(rejectedMissing, {
    ok: false,
    statusCode: 400,
    error:
      "Comoros customRate requires rateEvidenceConfirmed=true and the exact Article 152 evidence type for 3%, 5%, 7.5%, 25% or 0%.",
    code: "RATE_EVIDENCE_REQUIRED",
  });
  const rejectedWrongType = vatApi._test.validateComorosRateRequest({
    country: "KM",
    amount: 100000,
    customRate: 7.5,
    rateEvidenceConfirmed: true,
    rateEvidenceType: "article-152-casino",
  });
  assert.equal(rejectedWrongType.ok, false);
  const accepted = vatApi._test.validateComorosRateRequest({
    country: "KM",
    amount: 100000,
    customRate: 7.5,
    rateEvidenceConfirmed: true,
    rateEvidenceType: "article-152-mobile-recharge",
  });
  assert.deepEqual(accepted, {
    ok: true,
    rate: 7.5,
    rateEvidenceType: "article-152-mobile-recharge",
  });
  const apiResult = vatApi._test.calculateVatResult(
    100000,
    accepted.rate,
    "add",
    "KMF",
  );
  const engineResult = engine.calculate({
    amount: 100000,
    rateKind: "article-152-mobile-recharge-confirmed",
    rateEvidenceConfirmed: true,
    rateEvidenceType: "article-152-mobile-recharge",
  });
  assert.deepEqual(apiResult, {
    operation: "add",
    amountExclusive: engineResult.net,
    vatRate: engineResult.rate,
    vatAmount: engineResult.tax,
    amountInclusive: engineResult.gross,
    currency: "KMF",
  });
});

test("keeps Comoros API metadata on the TC contract", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../../netlify/functions/api-vat.js"),
    "utf8",
  );
  assert.match(
    source,
    /name: 'Comoros', currency: 'KMF', rate: 10, reducedRates: \[\{ rate: 3/,
  );
  assert.match(source, /Officially Taxe sur la Consommation \(TC\), not VAT/);
  assert.match(source, /KMF 50 per minute/);
  assert.doesNotMatch(source, /name: 'Comoros'[\s\S]{0,700}Basic foodstuffs/);
});
