"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const storage = {};
const context = { console, Date, Math, JSON, Number, String, Array, Object, setTimeout, localStorage: {
  getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
  setItem(key, value) { storage[key] = String(value); }, removeItem(key) { delete storage[key]; }
} };
vm.runInNewContext(fs.readFileSync(path.join(root, "engines/src/creator-split-engine.js"), "utf8"), context);
const engine = context.CreatorSplitEngine;
const result = engine.calculateShares({ project: "English project", projectType: "video", currency: "USD", revenue: 100.01, members: [
  { name: "Creator A", role: "Director", percentage: 33.33 },
  { name: "Creator B", role: "Editor", percentage: 33.33 },
  { name: "Creator C", role: "Writer", percentage: 33.34 }
] });
assert.equal(result.totalPercentage, 100);
assert.deepEqual(JSON.parse(JSON.stringify(result.shares.map((share) => share.amount))), [33.33, 33.33, 33.35]);
assert.equal(result.shares.reduce((total, share) => Math.round((total + share.amount) * 100) / 100, 0), 100.01);
assert.deepEqual(JSON.parse(JSON.stringify(result.shares.map((share) => [share.name, share.role, share.percentage]))), [
  ["Creator A", "Director", 33.33], ["Creator B", "Editor", 33.33], ["Creator C", "Writer", 33.34]
]);
assert.throws(() => engine.calculateShares({ revenue: 100, members: [{ name: "A", percentage: 50 }, { name: "B", percentage: 49 }] }), /exactly 100/);
assert.throws(() => engine.calculateShares({ revenue: 100, members: [{ name: "A", percentage: 100 }] }), /at least two/);
assert.throws(() => engine.calculateShares({ revenue: 100, members: [{ name: "", percentage: 50 }, { name: "B", percentage: 50 }] }), /needs a name/);
const controller = fs.readFileSync(path.join(root, "assets/js/pages/creative/creator-split-calculator.js"), "utf8");
assert.match(controller, /Total allocated/); assert.match(controller, /REVENUE SPLIT AGREEMENT/); assert.match(controller, /Jumla iliyogawiwa/);
const html = fs.readFileSync(path.join(root, "sw/zana/mgawanyo-wa-mapato-ya-watayarishi/index.html"), "utf8");
assert.match(html, /data-creator-split data-lang="sw"/); assert.match(html, /creator-split\.webp/); assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza/);
console.log("Swahili creator-split final: 13 assertions passed");
