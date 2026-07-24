const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/ng-wht.js");

function base(overrides = {}) {
  return {
    transactionType: "professional",
    recipientClass: "corporate",
    residency: "resident",
    grossAmount: 5000000,
    transactionDate: "2026-07-22",
    taxIdAvailable: true,
    treatment: "schedule",
    documentationConfirmed: false,
    treatyRatePercent: 0,
    scopeConfirmed: true,
    ...overrides,
  };
}

test("resident corporate professional payment uses the 5% Schedule rate", () => {
  const out = engine.calculate(base());
  assert.equal(out.scheduleRatePercent, 5);
  assert.equal(out.appliedRatePercent, 5);
  assert.equal(out.deduction, 250000);
  assert.equal(out.netPayment, 4750000);
});

test("non-resident professional payment uses 10%", () => {
  const out = engine.calculate(base({ residency: "nonresident" }));
  assert.equal(out.deduction, 500000);
});

test("royalty distinguishes corporate and non-corporate recipients", () => {
  assert.equal(engine.calculate(base({ transactionType: "royalty" })).appliedRatePercent, 10);
  assert.equal(
    engine.calculate(base({ transactionType: "royalty", recipientClass: "noncorporate" })).appliedRatePercent,
    5,
  );
});

test("resident rent is 10% for every recipient class under the exact Gazette row", () => {
  assert.equal(engine.calculate(base({ transactionType: "rent" })).appliedRatePercent, 10);
  assert.equal(
    engine.calculate(base({ transactionType: "rent", recipientClass: "noncorporate" })).appliedRatePercent,
    10,
  );
});

test("special non-corporate rows cover directors fees and net winnings", () => {
  assert.equal(
    engine.calculate(base({ transactionType: "directorsFees", recipientClass: "noncorporate" })).appliedRatePercent,
    15,
  );
  assert.equal(
    engine.calculate(base({ transactionType: "directorsFees", recipientClass: "noncorporate", residency: "nonresident" })).appliedRatePercent,
    20,
  );
  assert.equal(
    engine.calculate(base({ transactionType: "winnings", recipientClass: "noncorporate" })).appliedRatePercent,
    5,
  );
  assert.equal(
    engine.calculate(base({ transactionType: "winnings", recipientClass: "noncorporate", residency: "nonresident" })).appliedRatePercent,
    15,
  );
  assert.throws(() => engine.calculate(base({ transactionType: "directorsFees" })), /no schedule rate/);
});

test("missing Tax ID doubles a non-passive Schedule rate", () => {
  const out = engine.calculate(base({ taxIdAvailable: false }));
  assert.equal(out.scheduleRatePercent, 5);
  assert.equal(out.appliedRatePercent, 10);
  assert.equal(out.doubledForMissingTaxId, true);
});

test("missing Tax ID does not double passive income", () => {
  const out = engine.calculate(base({ transactionType: "dividend", taxIdAvailable: false }));
  assert.equal(out.appliedRatePercent, 10);
  assert.equal(out.doubledForMissingTaxId, false);
});

test("verified treaty rate is restricted to non-residents and below Schedule rate", () => {
  const out = engine.calculate(
    base({
      transactionType: "dividend",
      residency: "nonresident",
      treatment: "treaty",
      treatyRatePercent: 7.5,
      documentationConfirmed: true,
    }),
  );
  assert.equal(out.appliedRatePercent, 7.5);
  assert.equal(out.deduction, 375000);
  assert.throws(
    () => engine.calculate(base({ treatment: "treaty", treatyRatePercent: 4, documentationConfirmed: true })),
    /non-resident/,
  );
  assert.throws(
    () => engine.calculate(base({ residency: "nonresident", treatment: "treaty", treatyRatePercent: 10, documentationConfirmed: true })),
    /below the schedule rate/,
  );
});

test("treaty and exemption treatments fail closed without evidence", () => {
  assert.throws(
    () => engine.calculate(base({ residency: "nonresident", treatment: "treaty", treatyRatePercent: 5 })),
    /documentation confirmation/,
  );
  assert.throws(
    () => engine.calculate(base({ treatment: "exempt" })),
    /documentation confirmation/,
  );
  assert.equal(
    engine.calculate(base({ treatment: "exempt", documentationConfirmed: true })).deduction,
    0,
  );
});

test("unsupported non-resident goods and unconfirmed scope fail closed", () => {
  assert.throws(
    () => engine.calculate(base({ transactionType: "goods", residency: "nonresident" })),
    /no schedule rate/,
  );
  assert.throws(
    () => engine.calculate(base({ scopeConfirmed: false })),
    /scope confirmation/,
  );
  assert.throws(
    () => engine.calculate(base({ transactionDate: "2025-12-31" })),
    /1 January 2026/,
  );
});

test("money is rounded to kobo", () => {
  const out = engine.calculate(base({ grossAmount: 1234.56 }));
  assert.equal(out.deduction, 61.73);
  assert.equal(out.netPayment, 1172.83);
});
