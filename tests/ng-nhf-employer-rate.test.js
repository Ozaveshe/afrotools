"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadFrontendEngine() {
  const source = fs.readFileSync(path.join(ROOT, "assets/js/engines/ng-paye.js"), "utf8");
  const sandbox = {
    window: { AfroTools: { engines: {} } },
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    Infinity,
    console
  };
  vm.runInNewContext(source, sandbox, { filename: "assets/js/engines/ng-paye.js" });
  return sandbox.window.AfroTools.engines.ngPAYE;
}

const grossAnnual = 5000000;
const frontend = loadFrontendEngine();
const backend = require(path.join(ROOT, "netlify/functions/_engines/ng-paye.js"));

const frontendPita = frontend.calculate(grossAnnual, { regime: "pita", pension: true, nhf: true });
const frontendNta = frontend.calculate(grossAnnual, { regime: "nta", pension: true, nhf: true });
const backendPita = backend.calculate({ grossAnnual, regime: "PITA_2025", pension: true, nhf: true });
const backendNta = backend.calculate({ grossAnnual, regime: "NTA_2026", pension: true, nhf: true });

assert.strictEqual(frontendPita.employerNHF, 0);
assert.strictEqual(frontendNta.employerNHF, 0);
assert.strictEqual(backendPita.employer.nhf, 0);
assert.strictEqual(backendNta.employer.nhf, 0);
assert.strictEqual(backendPita.employer.totalCostAnnual, grossAnnual + backendPita.employer.pension);
assert.strictEqual(backendNta.employer.totalCostAnnual, grossAnnual + backendNta.employer.pension);

console.log("Nigeria employer NHF rate regression passed.");
