const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/ug-vat.js");

test("adds and extracts the 18% standard rate", () => {
  assert.deepEqual(engine.calculate({ amount: 1000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 18,
    net: 1000,
    vat: 180,
    gross: 1180,
  });
  assert.deepEqual(engine.calculate({ amount: 1180, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 18,
    net: 1000,
    vat: 180,
    gross: 1180,
  });
});
test("keeps confirmed zero and planning scenarios distinct", () => {
  assert.equal(engine.calculate({ amount: 1000, rateKind: "zero" }).vat, 0);
  assert.equal(
    engine.calculate({ amount: 1000, rateKind: "scenario", rate: 12 }).vat,
    120,
  );
});
test("calculates invoice lines through the same engine", () => {
  const result = engine.calculateInvoice([{ quantity: 2, unitPrice: 500 }]);
  assert.equal(result.net, 1000);
  assert.equal(result.vat, 180);
  assert.equal(result.gross, 1180);
  const fractional = engine.calculateInvoice([
    { quantity: 1, unitPrice: 0.015 },
    { quantity: 1, unitPrice: 0.015 },
  ]);
  assert.deepEqual(
    fractional.lines.map((line) => line.net),
    [0.02, 0.02],
  );
  assert.equal(fractional.net, 0.04);
  assert.equal(fractional.vat, 0.01);
  assert.equal(fractional.gross, 0.05);
});
test("classifies only confirmed statutory treatments", () => {
  assert.match(engine.classify("standard").source, /section 4/i);
  assert.match(engine.classify("confirmed-zero").source, /Third Schedule/);
  assert.match(engine.classify("confirmed-exempt").source, /Second Schedule/);
  const withholding = engine.classify("confirmed-designated-withholding");
  assert.equal(withholding.rate, null);
  assert.equal(withholding.withholdingPercent, 6);
  assert.equal(withholding.withholdingBasis, "taxable-value");
  assert.equal(withholding.outputTaxContextRate, 18);
  assert.equal(withholding.automaticCalculation, false);
  assert.deepEqual(withholding.eligibilityConditions, [
    "payer-is-designated-vat-withholding-agent",
    "supplier-is-vat-registered-or-supply-is-at-least-37500000",
    "supplier-has-no-current-vat-withholding-exemption",
  ]);
  assert.match(withholding.source, /6% of taxable value/i);
  assert.equal(engine.classify("food").treatment, "review");
});
test("registration threshold is strictly exceeded for past or expected three months", () => {
  assert.equal(
    engine.registrationBand({ pastThreeMonths: 37499999 }).band,
    "below-threshold",
  );
  assert.equal(
    engine.registrationBand({
      pastThreeMonths: 37500000,
      expectedNextThreeMonths: 37500000,
    }).band,
    "below-threshold",
  );
  assert.deepEqual(
    engine.registrationBand({ pastThreeMonths: 37500001 }).triggers,
    ["past-three-months"],
  );
  assert.deepEqual(
    engine.registrationBand({ expectedNextThreeMonths: 37500001 }).triggers,
    ["expected-next-three-months"],
  );
  const annualOnly = engine.registrationBand({ annualTurnover: 150000001 });
  assert.equal(annualOnly.band, "below-threshold");
  assert.deepEqual(annualOnly.triggers, []);
  assert.equal(annualOnly.annualThresholdReference, 150000000);
  assert.equal(annualOnly.annualReferenceOnly, true);
});
test("rejects invalid inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.calculateInvoice([]), RangeError);
  assert.throws(
    () => engine.calculateInvoice([{ quantity: "", unitPrice: 100 }]),
    RangeError,
  );
  assert.throws(
    () => engine.calculateInvoice([{ quantity: 1, unitPrice: -1 }]),
    RangeError,
  );
  assert.throws(
    () => engine.calculate({ amount: 1, rateKind: "scenario", rate: "" }),
    RangeError,
  );
  assert.throws(
    () => engine.calculate({ amount: 1, rateKind: "scenario", rate: 101 }),
    RangeError,
  );
});
