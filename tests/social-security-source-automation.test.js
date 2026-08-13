"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = {
  window: { AfroTools: {} },
  Math,
  isNaN,
  isFinite,
  parseInt,
  parseFloat,
  Infinity,
  console
};

vm.runInNewContext(
  fs.readFileSync(path.join(root, "data/hr/social-security-rates.js"), "utf8"),
  context,
  { filename: "data/hr/social-security-rates.js" }
);
vm.runInNewContext(
  fs.readFileSync(path.join(root, "engines/hr-engine.js"), "utf8"),
  context,
  { filename: "engines/hr-engine.js" }
);

const engine = context.window.AfroTools.HREngine;

assert.strictEqual(Object.keys(context.SOCIAL_SECURITY).length, 34);

const kenya = engine.calculateSocialSecurity("KE", 108000);
assert.strictEqual(Math.round(kenya.totalEmployee), 11070);
assert.strictEqual(Math.round(kenya.totalEmployer), 8100);

const ghana = engine.calculateSocialSecurity("GH", 100000);
assert.strictEqual(Math.round(ghana.totalEmployee), 3795);
assert.strictEqual(Math.round(ghana.totalEmployer), 8970);

const southAfrica = engine.calculateSocialSecurity("ZA", 50000);
assert.strictEqual(southAfrica.totalEmployee, 177.12);
assert.strictEqual(southAfrica.totalEmployer, 677.12);
assert(!southAfrica.breakdown.some((row) => /Retirement Fund/i.test(row.name)));
assert.strictEqual(
  southAfrica.breakdown.find((row) => /COIDA/.test(row.name)).employerAmount,
  0
);

const coteDIvoire = engine.calculateSocialSecurity("CI", 4000000);
assert.strictEqual(Math.round(coteDIvoire.totalEmployee), 212625);
assert.strictEqual(Math.round(coteDIvoire.totalEmployer * 10) / 10, 266437.5);

const cameroon = engine.calculateSocialSecurity("CM", 1000000);
assert.strictEqual(Math.round(cameroon.totalEmployee), 31500);
assert.strictEqual(Math.round(cameroon.totalEmployer), 109000);

console.log("Social Security source automation checks passed.");
