const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../../assets/js/engines/tz-vat");
test("Tanzania standard VAT adds and extracts 18%", () => {
  assert.deepEqual(engine.calculate({ amount: 1000, mode: "add" }), {
    mode: "add",
    rate: 18,
    rateKind: "standard",
    net: 1000,
    vat: 180,
    gross: 1180,
  });
  assert.deepEqual(engine.calculate({ amount: 1180, mode: "extract" }), {
    mode: "extract",
    rate: 18,
    rateKind: "standard",
    net: 1000,
    vat: 180,
    gross: 1180,
  });
});
test("conditional e-payment rate is explicit and invoice shares the engine", () => {
  assert.deepEqual(
    engine.calculate({ amount: 1000, rate: 16, rateKind: "epayment" }),
    {
      mode: "add",
      rate: 16,
      rateKind: "epayment",
      net: 1000,
      vat: 160,
      gross: 1160,
    },
  );
  assert.equal(
    engine.calculateInvoice([{ quantity: 2, unitPrice: 500 }], 18, "standard")
      .vat,
    180,
  );
  assert.equal(engine.classify("confirmed-epayment").treatment, "conditional");
});
test("appointed withholding agent retains exactly three points of an 18% invoice", () => {
  assert.deepEqual(engine.calculateWithholdingAgent(1000), {
    net: 1000,
    vat: 180,
    retained: 30,
    supplierVat: 150,
    invoiceGross: 1180,
    supplierPayment: 1150,
  });
  assert.equal(engine.classify("confirmed-withholding").rate, 18);
});
test("all three registration windows use inclusive thresholds", () => {
  assert.deepEqual(
    engine.registrationBand({
      prospective12: 199999999,
      prior12: 199999999,
      prior6: 99999999,
    }),
    { band: "below-threshold", triggers: [] },
  );
  assert.deepEqual(
    engine.registrationBand({
      prospective12: 200000000,
      prior12: 200000000,
      prior6: 100000000,
    }),
    {
      band: "threshold-review",
      triggers: ["prospective-12-month", "prior-12-month", "prior-6-month"],
    },
  );
});
test("Tanzania engine rejects unsafe values", () => {
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.calculate({ amount: 1, rate: 101 }), RangeError);
  assert.throws(() => engine.calculateInvoice([], 18), RangeError);
});
