const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/cm-vat.js");
const fs = require("node:fs");

test("adds and extracts the 19.25% effective standard rate", () => {
  assert.deepEqual(engine.calculate({ amount: 10000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 19.25,
    net: 10000,
    vat: 1925,
    gross: 11925,
  });
  assert.deepEqual(engine.calculate({ amount: 11925, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 19.25,
    net: 10000,
    vat: 1925,
    gross: 11925,
  });
});

test("keeps the qualifying 10% social-housing rate explicit", () => {
  assert.deepEqual(
    engine.calculate({ amount: 10000, rateKind: "social-housing" }),
    {
      mode: "add",
      rateKind: "social-housing",
      rate: 10,
      net: 10000,
      vat: 1000,
      gross: 11000,
    },
  );
  assert.equal(engine.classify("social-housing").treatment, "reduced");
});

test("fails closed for unknown rates and classifications", () => {
  assert.throws(
    () => engine.calculate({ amount: 100, rateKind: "reduced" }),
    /unsupported rate treatment/,
  );
  assert.equal(engine.classify("medical").treatment, "review");
  assert.equal(engine.classify("confirmed-zero").rate, 0);
  assert.equal(engine.classify("confirmed-exempt").rate, null);
});

test("calculates a supported invoice line", () => {
  assert.deepEqual(
    engine.calculateInvoice(
      { description: "Service", quantity: 2, unitPrice: 5000 },
      { rateKind: "standard" },
    ),
    {
      description: "Service",
      quantity: 2,
      unitPrice: 5000,
      rateKind: "standard",
      rate: 19.25,
      net: 10000,
      vat: 1925,
      gross: 11925,
    },
  );
});

test("withholding is zero unless current buyer authorization is confirmed", () => {
  const result = engine.calculate({ amount: 10000 });
  assert.deepEqual(engine.calculateWithholding(result, false), {
    status: "not-confirmed",
    withheldVat: 0,
    supplierReceives: 11925,
    supplierVatToRemitFromThisInvoice: 1925,
  });
  assert.deepEqual(engine.calculateWithholding(result, true), {
    status: "full-vat-withholding",
    withheldVat: 1925,
    supplierReceives: 10000,
    supplierVatToRemitFromThisInvoice: 0,
  });
});

test("uses XAF 50 million as an inclusive real-regime review boundary", () => {
  assert.equal(engine.registrationScreen(49999999.99).status, "review-igs-regime");
  assert.equal(engine.registrationScreen(50000000).status, "review-real-regime");
  assert.equal(engine.registrationScreen(50000001).status, "review-real-regime");
  assert.equal(engine.registrationScreen(50000000).determinesRegistration, false);
});

test("records source, formula and rounding boundaries", () => {
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
  assert.equal(engine.BASE_RATE, 17.5);
  assert.equal(engine.CAC_ON_BASE_RATE, 10);
  assert.match(engine.formulaParameters.standardRate, /19\.25/);
  assert.match(engine.formulaParameters.turnoverBoundary, /50,000,000/);
  assert.equal(engine.roundingPolicy.precision, 2);
});

test("rejects empty and negative numeric inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.calculateInvoice({ quantity: "", unitPrice: 2 }), RangeError);
  assert.throws(() => engine.registrationScreen(-1), RangeError);
});

test("keeps the launched AfroVAT API sibling on the reviewed Cameroon contract", () => {
  const source = fs.readFileSync(
    require.resolve("../../netlify/functions/api-vat.js"),
    "utf8",
  );
  assert.match(
    source,
    /CM:\s*\{[\s\S]*?name:\s*['"]Cameroon['"][\s\S]*?rate:\s*19\.25\b[\s\S]*?rate:\s*10\b[\s\S]*?lastUpdated:\s*['"]2026-07-22['"]/,
  );
  assert.match(source, /countryCode === 'CM'[\s\S]*?rateEvidenceConfirmed === true/);
  assert.doesNotMatch(
    source.match(/CM:\s*\{[\s\S]*?\n\s*\},\n\s*SN:/)?.[0] || "",
    /Basic foodstuffs|Medical supplies|Educational materials/,
  );
});
