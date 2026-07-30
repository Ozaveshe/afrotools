const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "engines", "src", "creator-split-engine.js"), "utf8");
const storage = {};
const context = {
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  setTimeout,
  localStorage: {
    getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = String(value); },
    removeItem(key) { delete storage[key]; }
  }
};
vm.runInNewContext(source, context);
const engine = context.CreatorSplitEngine;

const result = engine.calculateShares({
  project: "Album",
  currency: "XOF",
  revenue: 1001,
  members: [
    {name: "Awa", role: "Artiste", percentage: 50},
    {name: "Moussa", role: "Producteur", percentage: 30},
    {name: "Fatou", role: "Autrice", percentage: 20}
  ]
});
assert.equal(result.totalPercentage, 100);
assert.equal(result.shares.reduce((sum, share) => sum + share.amount, 0), 1001);
assert.equal(result.shares[1].amount, 300.3);
assert.throws(() => engine.calculateShares({
  revenue: 100,
  members: [{name: "A", percentage: 50}, {name: "B", percentage: 40}]
}), /exactly 100/);
assert.throws(() => engine.calculateShares({
  revenue: 100,
  members: [{name: "", percentage: 50}, {name: "B", percentage: 50}]
}), /needs a name/);
assert.throws(() => engine.calculateShares({revenue: -1, members: []}), /non-negative/);
console.log("creator-split calculator engine: 8 assertions passed");
