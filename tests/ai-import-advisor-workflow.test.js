#!/usr/bin/env node

const assert = require("assert");
const advisor = require("../assets/js/ai/import-advisor-workflow.js");

function has(list, text) {
  return (list || []).some((item) => String(item).toLowerCase().includes(String(text).toLowerCase()));
}

const toyota = advisor.buildAdvisorPlan({}, {
  query: "How much duty will I pay to import a 2016 Toyota Axio into Nigeria?"
});
assert.strictEqual(toyota.mode, "car");
assert.strictEqual(toyota.inputs.destinationCountry, "Nigeria");
assert.strictEqual(toyota.inputs.make, "Toyota");
assert.strictEqual(toyota.inputs.model, "Axio");
assert.strictEqual(toyota.inputs.year, "2016");
assert.strictEqual(toyota.inputs.productCategory, "vehicle");
assert.ok(toyota.missingInputs.includes("purchasePrice"));
assert.ok(toyota.missingInputs.includes("shippingCost"));
assert.ok(toyota.missingInputs.includes("fxRate"));
assert.ok(toyota.warning.includes("Planning estimate only"));
assert.ok(has(toyota.checklist, "vehicle age"));
assert.strictEqual(toyota.importPrefillInputs.mode, "car");

const toyotaWithCosts = advisor.buildAdvisorPlan({}, {
  query: "Import a 2016 Toyota Axio into Nigeria from Japan price $8500 shipping $1200 insurance $250 FX 1600 1500cc Tin Can"
});
assert.strictEqual(toyotaWithCosts.inputs.originCountry, "Japan");
assert.strictEqual(toyotaWithCosts.inputs.port, "tin-can");
assert.strictEqual(toyotaWithCosts.inputs.purchasePrice, 8500);
assert.strictEqual(toyotaWithCosts.inputs.shippingCost, 1200);
assert.strictEqual(toyotaWithCosts.inputs.insuranceCost, 250);
assert.strictEqual(toyotaWithCosts.inputs.fxRate, 1600);
assert.strictEqual(toyotaWithCosts.inputs.engineCc, 1500);
assert.strictEqual(toyotaWithCosts.estimate.cif, 9950);
assert.ok(toyotaWithCosts.estimate.totalUSD > toyotaWithCosts.estimate.cif);
assert.deepStrictEqual(toyotaWithCosts.missingInputs, []);

const electronics = advisor.buildAdvisorPlan({}, {
  query: "Import laptops from China to Nigeria value $5000 freight $700 insurance $150 fx 1600"
});
assert.strictEqual(electronics.inputs.productCategory, "electronics");
assert.strictEqual(electronics.inputs.originCountry, "China");
assert.strictEqual(electronics.inputs.destinationCountry, "Nigeria");
assert.strictEqual(electronics.estimate.cif, 5850);
assert.ok(electronics.estimate.totalUSD > electronics.estimate.cif);
assert.ok(has(electronics.checklist, "HS classification"));

const clothing = advisor.buildAdvisorPlan({}, {
  query: "Import clothing into Nigeria price 3000 USD shipping 500 FX 1600"
});
assert.strictEqual(clothing.inputs.productCategory, "clothing");
assert.strictEqual(clothing.inputs.purchasePrice, 3000);
assert.strictEqual(clothing.inputs.shippingCost, 500);

const machinery = advisor.buildAdvisorPlan({}, {
  query: "Import industrial machinery from Germany to Nigeria purchase price $12000 freight $1800 fx 1600"
});
assert.strictEqual(machinery.inputs.productCategory, "machinery");
assert.strictEqual(machinery.inputs.originCountry, "Germany");
assert.strictEqual(machinery.inputs.purchasePrice, 12000);
assert.ok(machinery.estimate.totalUSD > machinery.estimate.cif);

const unknown = advisor.buildAdvisorPlan({}, {
  query: "How much duty to import something into Nigeria?"
});
assert.strictEqual(unknown.inputs.productCategory, "other");
assert.ok(unknown.missingInputs.includes("purchasePrice"));
assert.ok(unknown.missingInputs.includes("shippingCost"));
assert.ok(unknown.missingInputs.includes("fxRate"));
assert.ok(unknown.sourceConfidence.join(" ").includes("No final customs assessment"));
assert.match(advisor.renderImportAdvisorPanel(toyotaWithCosts), /Import advisor estimate/);
assert.match(advisor.renderImportAdvisorPanel(toyotaWithCosts), /Official verification checklist/);
assert.match(advisor.renderImportAdvisorPanel(toyotaWithCosts), /Planning estimate only/);
assert.match(advisor.renderImportAdvisorPanel(toyotaWithCosts), /FX Import Impact/);
assert.match(advisor.renderImportAdvisorPanel(toyotaWithCosts), /\/tools\/fx-import-impact\//);

console.log("AI import advisor workflow validated: extraction, missing inputs, estimates, source confidence, and cautious copy.");
