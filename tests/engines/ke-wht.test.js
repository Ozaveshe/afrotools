const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../../assets/js/engines/ke-wht.js");

const base = {
  grossAmount: 100000,
  paymentType: "professional",
  residency: "resident",
  treatment: "standard",
  scopeConfirmed: true,
};

test("resident professional fee uses 5% at or above the monthly threshold", () => {
  const result = engine.calculate(base);
  assert.equal(result.ok, true);
  assert.equal(result.rate, 5);
  assert.equal(result.deduction, 5000);
});

test("resident professional and contractual fees fail below KSh 24,000", () => {
  for (const paymentType of ["professional", "contractual"]) {
    const result = engine.calculate({ ...base, grossAmount: 23999, paymentType });
    assert.equal(result.ok, false);
    assert.match(result.error, /24,000/);
  }
});

test("non-resident professional and contractual rows use 20%", () => {
  for (const paymentType of ["professional", "contractual"]) {
    assert.equal(engine.calculate({ ...base, paymentType, residency: "nonresident" }).rate, 20);
  }
});

test("royalty and immovable rent distinguish resident and non-resident rates", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "royalty" }).rate, 5);
  assert.equal(engine.calculate({ ...base, paymentType: "royalty", residency: "nonresident" }).rate, 20);
  assert.equal(engine.calculate({ ...base, paymentType: "immovableRent" }).rate, 10);
  assert.equal(engine.calculate({ ...base, paymentType: "immovableRent", residency: "nonresident" }).rate, 30);
});

test("eligible residential MRI flow uses 7.5% resident and 30% non-resident", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "residentialRent" }).ok, false);
  assert.equal(engine.calculate({ ...base, paymentType: "residentialRent", evidenceConfirmed: true }).deduction, 7500);
  assert.equal(engine.calculate({ ...base, paymentType: "residentialRent", residency: "nonresident", evidenceConfirmed: true }).deduction, 30000);
});

test("winnings preserve the detailed KRA table's 20% resident and non-resident rates", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "winnings" }).rate, 20);
  assert.equal(engine.calculate({ ...base, paymentType: "winnings", residency: "nonresident" }).rate, 20);
});

test("movable-property rent only exposes the reviewed non-resident rate", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "movableRent" }).ok, false);
  assert.equal(engine.calculate({ ...base, paymentType: "movableRent", residency: "nonresident" }).rate, 15);
});

test("EAC dividend and consultancy reductions require evidence", () => {
  const unsupported = engine.calculate({ ...base, paymentType: "dividend", residency: "nonresident", treatment: "eac" });
  assert.equal(unsupported.ok, false);
  assert.equal(engine.calculate({ ...base, paymentType: "dividend", residency: "nonresident", treatment: "eac", evidenceConfirmed: true }).rate, 5);
  assert.equal(engine.calculate({ ...base, paymentType: "consultancy", residency: "nonresident", treatment: "eac", evidenceConfirmed: true }).rate, 15);
});

test("controlling resident-company dividend exemption is narrow and evidence-gated", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "dividend", treatment: "controllingDividend" }).ok, false);
  assert.equal(engine.calculate({ ...base, paymentType: "dividend", treatment: "controllingDividend", evidenceConfirmed: true }).rate, 0);
  assert.equal(engine.calculate({ ...base, paymentType: "professional", treatment: "controllingDividend", evidenceConfirmed: true }).ok, false);
});

test("public-entity goods use 0.5% resident and 5% non-resident", () => {
  assert.equal(engine.calculate({ ...base, paymentType: "publicGoods" }).ok, false);
  assert.equal(engine.calculate({ ...base, paymentType: "publicGoods", evidenceConfirmed: true }).deduction, 500);
  assert.equal(engine.calculate({ ...base, paymentType: "publicGoods", residency: "nonresident", evidenceConfirmed: true }).deduction, 5000);
});

test("treaty rates are non-resident, evidenced and below the standard rate", () => {
  assert.equal(engine.calculate({ ...base, residency: "nonresident", treatment: "treaty", treatyRatePercent: 10 }).ok, false);
  const result = engine.calculate({ ...base, residency: "nonresident", treatment: "treaty", treatyRatePercent: 10, evidenceConfirmed: true });
  assert.equal(result.ok, true);
  assert.equal(result.rate, 10);
});

test("unsupported general exemption treatment fails closed", () => {
  assert.equal(engine.calculate({ ...base, treatment: "exempt" }).ok, false);
  assert.equal(engine.calculate({ ...base, treatment: "exempt", evidenceConfirmed: true }).ok, false);
});

test("scope confirmation and positive amount are mandatory", () => {
  assert.equal(engine.calculate({ ...base, scopeConfirmed: false }).ok, false);
  assert.equal(engine.calculate({ ...base, grossAmount: 0 }).ok, false);
});

test("money rounds to cents", () => {
  assert.equal(engine.calculate({ ...base, grossAmount: 24000.11 }).deduction, 1200.01);
});
