const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/za-dividend-tax.js");

function base(overrides = {}) {
  return {
    grossDividend: 100000,
    paymentCount: 1,
    paymentDate: "2026-07-22",
    treatment: "standard",
    reducedRatePercent: 15,
    documentationConfirmed: false,
    scopeConfirmed: true,
    ...overrides,
  };
}

test("standard treatment withholds 20% from gross cash", () => {
  const out = engine.calculate(base());
  assert.equal(out.rate, 0.2);
  assert.equal(out.taxPerPayment, 20000);
  assert.equal(out.netPerPayment, 80000);
  assert.equal(out.indicativeRemittanceDate, "2026-08-31");
});

test("scenario totals multiply equal payments without changing the rate", () => {
  const out = engine.calculate(base({ grossDividend: 1234.56, paymentCount: 4 }));
  assert.equal(out.taxPerPayment, 246.91);
  assert.equal(out.scenarioGross, 4938.24);
  assert.equal(out.scenarioTax, 987.64);
  assert.equal(out.scenarioNet, 3950.6);
});

test("a verified reduced DTA rate is accepted as a decimal percentage", () => {
  const out = engine.calculate(
    base({
      treatment: "reduced",
      reducedRatePercent: 12.5,
      documentationConfirmed: true,
    }),
  );
  assert.equal(out.rate, 0.125);
  assert.equal(out.taxPerPayment, 12500);
  assert.equal(out.netPerPayment, 87500);
});

test("a verified exemption produces zero withholding", () => {
  const out = engine.calculate(
    base({ treatment: "exempt", documentationConfirmed: true }),
  );
  assert.equal(out.rate, 0);
  assert.equal(out.taxPerPayment, 0);
  assert.equal(out.netPerPayment, 100000);
});

test("reduced and exempt paths fail closed without documentation", () => {
  assert.throws(
    () => engine.calculate(base({ treatment: "reduced" })),
    /documentation confirmation/,
  );
  assert.throws(
    () => engine.calculate(base({ treatment: "exempt" })),
    /documentation confirmation/,
  );
});

test("reduced rates outside the domestic-rate boundary fail", () => {
  assert.throws(
    () =>
      engine.calculate(
        base({
          treatment: "reduced",
          reducedRatePercent: 20,
          documentationConfirmed: true,
        }),
      ),
    /below 20/,
  );
  assert.throws(
    () =>
      engine.calculate(
        base({
          treatment: "reduced",
          reducedRatePercent: -1,
          documentationConfirmed: true,
        }),
      ),
    /below 20/,
  );
});

test("scope, date, amount and payment count are validated", () => {
  assert.throws(
    () => engine.calculate(base({ scopeConfirmed: false })),
    /scope confirmation/,
  );
  assert.throws(
    () => engine.calculate(base({ paymentDate: "2017-02-21" })),
    /22 February 2017/,
  );
  assert.throws(
    () => engine.calculate(base({ grossDividend: -1 })),
    /grossDividend/,
  );
  assert.throws(
    () => engine.calculate(base({ paymentCount: 1.5 })),
    /whole number/,
  );
});

test("following-month date handles December and leap-year February", () => {
  assert.equal(
    engine.calculate(base({ paymentDate: "2026-12-15" })).indicativeRemittanceDate,
    "2027-01-31",
  );
  assert.equal(
    engine.calculate(base({ paymentDate: "2024-01-31" })).indicativeRemittanceDate,
    "2024-02-29",
  );
});
