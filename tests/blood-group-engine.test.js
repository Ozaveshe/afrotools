const assert = require("assert");
const engine = require("../tools/blood-group/blood-group-engine.js");

assert.deepStrictEqual(
  engine.redCellReference("O-", "A+").compatibleDonorGroups,
  ["O-", "O+", "A-", "A+"]
);
assert.strictEqual(engine.redCellReference("O-", "A+").listed, true);
assert.strictEqual(engine.redCellReference("B+", "A+").listed, false);
assert.strictEqual(engine.redCellReference("O+", "O-").listed, false);

assert.strictEqual(engine.plasmaReference("AB+", "A-").listed, true);
assert.strictEqual(engine.plasmaReference("O-", "A+").listed, false);
assert.deepStrictEqual(engine.plasmaReference("A-", "O+").compatibleDonorGroups, ["O", "A", "B", "AB"]);

assert.strictEqual(
  engine.plateletReference("O-", "AB+").classification,
  "laboratory-selection-required"
);
assert.match(engine.plateletReference("O-", "AB+").boundary, /does not classify/i);

assert.strictEqual(
  engine.pregnancyRhReference("O-", "A+").classification,
  "baby-may-be-rhd-positive"
);
assert.strictEqual(
  engine.pregnancyRhReference("A+", "O-").classification,
  "pregnant-person-rhd-positive"
);
assert.strictEqual(
  engine.pregnancyRhReference("B-", "O-").classification,
  "both-inputs-rhd-negative"
);
assert.match(engine.pregnancyRhReference("O-", "A+").boundary, /cannot determine|do not determine/i);

assert.throws(() => engine.redCellReference("X", "O+"), /valid ABO/);
assert.deepStrictEqual(engine.snapshot(engine.redCellReference("O-", "O-")), {
  title: "Blood component compatibility reference",
  component: "red-cells",
  donor: "O-",
  recipient: "O-",
  classification: "reference-match",
  note: "ABO/RhD is only an initial red-cell reference. A hospital must type, antibody-screen, select and crossmatch the actual unit."
});

console.log("blood-group engine tests passed");
