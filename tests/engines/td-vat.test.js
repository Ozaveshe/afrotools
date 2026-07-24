const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const engine = require("../../assets/js/engines/td-vat.js");

test("adds and extracts Chad effective general VAT at 19.25%", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 19.25,
    net: 100000,
    vat: 19250,
    gross: 119250,
  });
  assert.deepEqual(engine.calculate({ amount: 119250, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 19.25,
    net: 100000,
    vat: 19250,
    gross: 119250,
  });
});

test("uses effective 9.9% only through confirmed Article 238 treatment", () => {
  assert.deepEqual(
    engine.calculate({
      amount: 100000,
      rateKind: "article-238-reduced-confirmed",
    }),
    {
      mode: "add",
      rateKind: "article-238-reduced-confirmed",
      rate: 9.9,
      net: 100000,
      vat: 9900,
      gross: 109900,
    },
  );
  assert.throws(
    () => engine.calculate({ amount: 100000, rateKind: "reduced" }),
    /unsupported/,
  );
});

test("uses zero only through a confirmed Article 238 case", () => {
  assert.equal(engine.classify("article-238-zero-confirmed").rate, 0);
  assert.equal(engine.classify("possible-exemption").rate, null);
  assert.throws(() => engine.resolveRate("zero"), /unsupported/);
});

test("totals mixed effective 19.25% and confirmed 9.9% invoice lines", () => {
  assert.deepEqual(
    engine.calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100000, rateKind: "standard" },
      {
        quantity: 1,
        unitPrice: 200000,
        rateKind: "article-238-reduced-confirmed",
      },
    ]),
    { net: 300000, vat: 39050, gross: 339050 },
  );
});

test("keeps annual and 2026 single-operation boundaries distinct", () => {
  assert.equal(engine.annualRegimeScreen(49999999, true).status, "igl-review");
  assert.equal(
    engine.annualRegimeScreen(50000000, true).status,
    "vat-regime-review",
  );
  assert.equal(
    engine.annualRegimeScreen(49999999, false).status,
    "legal-form-review",
  );
  assert.equal(
    engine.largeOperationScreen(50000000, true).status,
    "no-large-operation-override",
  );
  assert.equal(
    engine.largeOperationScreen(50000001, true).status,
    "vat-due-review",
  );
  assert.equal(
    engine.largeOperationScreen(50000001, false).status,
    "regime-unconfirmed",
  );
});

test("records official formula and filing-rounding boundaries", () => {
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.equal(engine.BASE_STANDARD_RATE, 17.5);
  assert.equal(engine.BASE_REDUCED_RATE, 9);
  assert.equal(engine.CENTIMES_RATE, 10);
  assert.equal(engine.STANDARD_RATE, 19.25);
  assert.equal(engine.REDUCED_RATE, 9.9);
  assert.match(engine.formulaParameters.centimes, /19\.25% and 9\.9%/);
  assert.match(engine.formulaParameters.largeOperation, /above, not equal to/);
  assert.match(engine.formulaParameters.roundingBoundary, /nearest thousand/);
  assert.equal(engine.roundingPolicy.precision, 2);
});

test("rejects empty, negative and unsupported inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.annualRegimeScreen(-1, true), RangeError);
  assert.throws(() => engine.largeOperationScreen(-1, true), RangeError);
});

test("keeps the generic VAT API on the reviewed Chad contract", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../../netlify/functions/api-vat.js"),
    "utf8",
  );
  assert.match(
    source,
    /name: 'Chad', currency: 'XAF', rate: 19\.25, reducedRates: \[\{ rate: 9\.9/,
  );
  assert.match(
    source,
    /countryCode === 'TD'[\s\S]*rate === 9\.9[\s\S]*rateEvidenceType === 'article-238-listed-supply'/,
  );
  assert.match(
    source,
    /countryCode === 'TD'[\s\S]*rateEvidenceType === 'article-238-zero-case'/,
  );
  assert.doesNotMatch(source, /name: 'Chad'[\s\S]{0,500}Basic foodstuffs/);
  assert.match(
    source,
    /Chad Ministry of Finance 2024 application circular, CGI 2025 and 2026 application circular/,
  );
});
