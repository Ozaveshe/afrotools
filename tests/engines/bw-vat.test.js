const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/bw-vat.js");
const fs = require("node:fs");

test("adds and extracts Botswana's current 14% standard VAT", () => {
  assert.deepEqual(engine.calculate({ amount: 1000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 14,
    net: 1000,
    vat: 140,
    gross: 1140,
  });
  assert.deepEqual(engine.calculate({ amount: 1140, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 14,
    net: 1000,
    vat: 140,
    gross: 1140,
  });
});

test("keeps confirmed zero-rating distinct from a non-statutory scenario", () => {
  assert.equal(
    engine.calculate({ amount: 1000, rateKind: "confirmed-zero" }).vat,
    0,
  );
  assert.equal(
    engine.calculate({ amount: 1000, rateKind: "scenario", rate: 12.5 }).vat,
    125,
  );
});

test("rounds invoice lines before aggregation", () => {
  const result = engine.calculateInvoice([
    { quantity: 1, unitPrice: 0.015 },
    { quantity: 1, unitPrice: 0.015 },
  ]);
  assert.deepEqual(
    result.lines.map((line) => line.net),
    [0.02, 0.02],
  );
  assert.equal(result.net, 0.04);
  assert.equal(result.gross, 0.04);
});

test("screens current BURS registration bands without treating approval as automatic", () => {
  assert.equal(engine.registration(1000000).status, "voluntary");
  assert.equal(engine.registration(1000000.01).status, "mandatory");
  assert.equal(engine.registration(500000).status, "voluntary");
  assert.equal(engine.registration(499999.99).status, "below-voluntary-floor");
});

test("does not promote unconfirmed zero-rated or exempt classifications", () => {
  assert.equal(engine.classify("standard").rate, 14);
  assert.equal(engine.classify("confirmed-zero").treatment, "zero");
  assert.equal(engine.classify("confirmed-exempt").rate, null);
  assert.equal(engine.classify("medical").treatment, "review");
});

test("records reviewed source and rounding boundaries", () => {
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.match(engine.formulaParameters.compulsoryRegistration, /1,000,000/);
  assert.equal(engine.roundingPolicy.precision, 2);
});

test("rejects empty, negative, and excessive inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(
    () => engine.calculate({ amount: 1, rateKind: "scenario", rate: 101 }),
    RangeError,
  );
  assert.throws(() => engine.calculateInvoice([]), RangeError);
  assert.throws(() => engine.registration(""), RangeError);
});

test("keeps the launched AfroVAT API sibling on Botswana's 14% contract", () => {
  const source = fs.readFileSync(
    require.resolve("../../netlify/functions/api-vat.js"),
    "utf8",
  );
  assert.match(
    source,
    /BW:\s*\{[\s\S]*?name:\s*['"]Botswana['"][\s\S]*?rate:\s*14\b/,
  );
});
