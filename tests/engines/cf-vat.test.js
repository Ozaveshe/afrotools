const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const engine = require("../../assets/js/engines/cf-vat.js");
test("adds and extracts 19% general VAT", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 19,
    net: 100000,
    vat: 19000,
    gross: 119000,
  });
  assert.deepEqual(engine.calculate({ amount: 119000, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 19,
    net: 100000,
    vat: 19000,
    gross: 119000,
  });
});
test("uses 5% only through the confirmed listed-goods treatment", () => {
  assert.deepEqual(
    engine.calculate({ amount: 100000, rateKind: "listed-goods-confirmed" }),
    {
      mode: "add",
      rateKind: "listed-goods-confirmed",
      rate: 5,
      net: 100000,
      vat: 5000,
      gross: 105000,
    },
  );
  assert.throws(
    () => engine.calculate({ amount: 100000, rateKind: "reduced" }),
    /unsupported/,
  );
});
test("uses zero only through confirmed export customs evidence", () => {
  assert.equal(engine.classify("export-declaration-confirmed").rate, 0);
  assert.deepEqual(
    engine.calculate({
      amount: 100000,
      rateKind: "export-declaration-confirmed",
    }),
    {
      mode: "add",
      rateKind: "export-declaration-confirmed",
      rate: 0,
      net: 100000,
      vat: 0,
      gross: 100000,
    },
  );
  assert.equal(engine.classify("export").rate, null);
});
test("totals a mixed 19% and confirmed 5% invoice", () => {
  assert.deepEqual(
    engine.calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100000, rateKind: "standard" },
      { quantity: 1, unitPrice: 200000, rateKind: "listed-goods-confirmed" },
    ]),
    { net: 300000, vat: 29000, gross: 329000 },
  );
});
test("keeps the 30 million boundary strict", () => {
  assert.equal(engine.registrationScreen(30000000).status, "igu-review");
  assert.equal(engine.registrationScreen(30000000.01).status, "vat-review");
  assert.equal(engine.registrationScreen(30000001).status, "vat-review");
  assert.equal(
    engine.registrationScreen(30000000).determinesRegistration,
    false,
  );
});
test("records reviewed formula boundaries", () => {
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.equal(engine.STANDARD_RATE, 19);
  assert.equal(engine.LISTED_GOODS_RATE, 5);
  assert.match(engine.formulaParameters.zero, /customs-endorsed/);
  assert.match(engine.formulaParameters.threshold, /exactly XAF 30,000,000/);
  assert.equal(engine.roundingPolicy.precision, 2);
});
test("rejects empty and negative inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.registrationScreen(-1), RangeError);
});
test("keeps the generic VAT API on the reviewed CAR contract", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../../netlify/functions/api-vat.js"),
    "utf8",
  );
  assert.match(
    source,
    /name: 'Central African Republic', currency: 'XAF', rate: 19, reducedRates: \[5\]/,
  );
  assert.match(
    source,
    /countryCode === 'CF'[\s\S]*rate === 5[\s\S]*rateEvidenceType === 'tariff-listed-goods'/,
  );
  assert.match(
    source,
    /countryCode === 'CF'[\s\S]*rate === 0[\s\S]*rateEvidenceType === 'qualifying-export-customs-proof'/,
  );
  assert.doesNotMatch(
    source,
    /name: 'Central African Republic'[\s\S]{0,500}Basic foodstuffs/,
  );
  assert.match(source, /lastUpdated: '2026-07-22'/);
});
