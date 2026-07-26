const assert = require("assert");
const engine = require("../tools/child-growth/child-growth-engine.js");

assert.strictEqual(engine.exactAgeDays("2023-01-01", "2025-09-27"), 1000);
assert.strictEqual(engine.exactAgeDays("2024-02-28", "2024-03-01"), 2);
assert.strictEqual(engine.expectedMethod(730), "recumbent");
assert.strictEqual(engine.expectedMethod(731), "standing");

const whoExample = engine.assess({
  birthDate: "2023-01-01",
  measurementDate: "2025-09-27",
  sex: "male",
  weight: 15,
  weightUnit: "kg",
  length: 100,
  lengthUnit: "cm",
  method: "standing"
});
assert.strictEqual(whoExample.ageDays, 1000);
assert.strictEqual(whoExample.indicators.lengthHeightForAge.zScore, 1.7);
assert.strictEqual(whoExample.indicators.weightForAge.zScore, 0.69);
assert.strictEqual(whoExample.indicators.bmiForAge.zScore, -0.58);
assert.strictEqual(whoExample.indicators.lengthHeightForAge.percentileLabel, "95.5");
assert.match(whoExample.boundary, /not a diagnosis/i);

const imperial = engine.assess({
  birthDate: "2023-01-01",
  measurementDate: "2025-09-27",
  sex: "male",
  weight: 33.0693393,
  weightUnit: "lb",
  length: 39.3700787,
  lengthUnit: "in",
  method: "standing"
});
assert.strictEqual(imperial.indicators.weightForAge.zScore, 0.69);
assert.strictEqual(imperial.indicators.lengthHeightForAge.zScore, 1.7);

const female = engine.assess({
  birthDate: "2023-01-01",
  measurementDate: "2025-09-27",
  sex: "female",
  weight: 15,
  weightUnit: "kg",
  length: 100,
  lengthUnit: "cm",
  method: "standing"
});
assert.notStrictEqual(female.indicators.weightForAge.zScore, whoExample.indicators.weightForAge.zScore);

assert.throws(() => engine.assess({
  birthDate: "2025-01-01", measurementDate: "2025-07-01", sex: "male",
  weight: 8, weightUnit: "kg", length: 68, lengthUnit: "cm", method: "standing"
}), error => error.code === "METHOD_MISMATCH");

assert.throws(() => engine.assess({
  birthDate: "2020-01-01", measurementDate: "2025-01-02", sex: "male",
  weight: 20, weightUnit: "kg", length: 110, lengthUnit: "cm", method: "standing"
}), error => error.code === "AGE_UNSUPPORTED");

assert.throws(() => engine.assess({
  birthDate: "2025-01-01", measurementDate: "2025-07-01", sex: "unknown",
  weight: 8, weightUnit: "kg", length: 68, lengthUnit: "cm", method: "recumbent"
}), error => error.code === "SEX_UNSUPPORTED");

assert.throws(() => engine.assess({
  birthDate: "2025-01-01", measurementDate: "2025-07-01", sex: "male",
  weight: 200, weightUnit: "kg", length: 68, lengthUnit: "cm", method: "recumbent"
}), error => error.code === "PLAUSIBILITY_REVIEW");

const saved = engine.snapshot(whoExample);
assert.strictEqual(saved.ageDays, 1000);
assert.strictEqual(saved.birthDate, undefined);
assert.strictEqual(saved.measurementDate, undefined);

console.log("child-growth engine tests passed");
