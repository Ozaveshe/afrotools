const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "../engineering/floor-planner/js/fp-mvp-sprint.js"), "utf8");

const context = {
  window: {
    addEventListener() {}
  },
  document: {
    readyState: "loading",
    addEventListener() {},
    getElementById() { return null; }
  },
  localStorage: {
    getItem() { return null; },
    setItem() {}
  },
  console,
  setTimeout() {}
};

vm.createContext(context);
vm.runInContext(source, context, { filename: "fp-mvp-sprint.js" });

const parser = context.window.FPMvpSprint;
assert.ok(parser && parser.parsePrompt, "prompt parser should be exported on window.FPMvpSprint");

function parse(prompt) {
  return parser.parsePrompt(prompt);
}

{
  const parsed = parse("3 bedroom on a one acre");
  assert.strictEqual(parsed.bedrooms, 3);
  assert.strictEqual(parsed.plotSize.sizeClass, "large");
  assert.strictEqual(parsed.planType, "compound-house");
  assert.strictEqual(parsed.templateKey, "tpl-3bed-one-acre");
  assert.strictEqual(parsed.intent, "family");
  assert.ok(parsed.siteFeatures.includes("boundary"));
  assert.ok(parsed.siteFeatures.includes("driveway"));
  assert.ok(parsed.siteFeatures.includes("septic/soakaway"));
  assert.ok(parsed.siteFeatures.includes("water tank"));
  assert.ok(parsed.futureExpansionNeeds);
  assert.ok(!/flats/i.test(parsed.templateKey), "large 3-bedroom family prompt must not map to flats");
  assert.ok(/3-bedroom bungalow/i.test(parsed.summary));
}

{
  const parsed = parse("3 bedroom bungalow on half plot in Lagos");
  assert.strictEqual(parsed.country, "NG");
  assert.strictEqual(parsed.city, "Lagos");
  assert.strictEqual(parsed.planType, "bungalow");
  assert.strictEqual(parsed.plotSize.sizeClass, "half");
  assert.strictEqual(parsed.templateKey, "tpl-3bed-half-plot");
}

{
  const parsed = parse("block of 4 flats for rental");
  assert.strictEqual(parsed.planType, "block-of-flats");
  assert.strictEqual(parsed.intent, "rental/investment");
  assert.strictEqual(parsed.templateKey, "tpl-block-4-flats");
}

{
  const parsed = parse("self contain studio for students");
  assert.strictEqual(parsed.planType, "self-contain");
  assert.strictEqual(parsed.intent, "student housing");
  assert.strictEqual(parsed.templateKey, "tpl-self-contain-studio");
}

{
  const parsed = parse("4 bedroom duplex with BQ");
  assert.strictEqual(parsed.bedrooms, 4);
  assert.strictEqual(parsed.planType, "duplex");
  assert.strictEqual(parsed.wantsBq, true);
  assert.strictEqual(parsed.templateKey, "tpl-4bed-duplex-bq");
  assert.ok(parsed.requiredRooms.includes("BQ room"));
}

{
  const parsed = parse("shop downstairs and rooms upstairs");
  assert.strictEqual(parsed.planType, "mixed-use");
  assert.strictEqual(parsed.intent, "commercial");
  assert.strictEqual(parsed.floorCount, 2);
  assert.strictEqual(parsed.templateKey, "tpl-shop-apartment");
}

{
  const parsed = parse("3 bedroom on one acre in Lagos");
  assert.strictEqual(parsed.country, "NG", "explicit Lagos location must override acre default");
  assert.strictEqual(parsed.city, "Lagos");
  assert.strictEqual(parsed.templateKey, "tpl-3bed-one-acre");
}

{
  const parsed = parse("low cost 2 bedroom starter home");
  assert.strictEqual(parsed.budgetLevel, "low-cost");
  assert.strictEqual(parsed.targetFinishLevel, "low-cost");
}

console.log("floor planner prompt parser tests passed");
