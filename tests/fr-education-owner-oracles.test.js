"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const manifest = require("../data/localization/fr-education-parity.json");
const routeEngine = require("../engines/src/education-route-engine.js");

assert.strictEqual(manifest.routes.length, 42, "Education parity denominator must remain exact");
assert.strictEqual(manifest.routes.filter((route) => route.owner !== "existing-native-owner").length, 41);
assert.strictEqual(manifest.routes.filter((route) => route.owner === "existing-native-owner").length, 1);

const controller = fs.readFileSync(path.join(root, "assets/js/pages/fr-education-parity.js"), "utf8");
for (const route of manifest.routes.filter((item) => item.owner !== "existing-native-owner")) {
  const html = fs.readFileSync(path.join(root, route.french.replace(/^\/|\/$/g, ""), "index.html"), "utf8");
  assert(html.includes(`"global":"${route.owner}"`), `${route.id} must declare the reviewed English owner`);
  assert(html.includes("/assets/js/pages/fr-education-parity.js"), `${route.id} must use the shared French adapter`);
}
assert(controller.includes("await runners[config.recipe](input, engine(config.global))"), "French adapter must call the declared owner");

const admission = routeEngine.plan({
  country: "nigeria",
  programme: "Informatique",
  institution: "Université exemple",
  requirementsChecked: "no"
});
assert.strictEqual(admission.ok, true);
assert.strictEqual(admission.owner, "JAMB et l’établissement visé");
assert.strictEqual(admission.stepCount, 3);
assert.strictEqual(admission.gapCount, 3);

const matcherSource = fs.readFileSync(path.join(root, "engines/scholarship-matcher.js"), "utf8");
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(`${matcherSource};this.matcher=ScholarshipMatcher;`, sandbox);
const scholarships = [{
  name: "Fixture Scholarship",
  levels: ["masters"],
  destinations: ["uk"],
  fields: ["stem"],
  min_gpa_4: 3,
  min_ielts: 6.5,
  info_url: "https://example.org/official"
}];
const matches = sandbox.matcher.match(scholarships, {
  gpa_value: 3.6,
  gpa_scale: "4.0",
  ielts_overall: 7,
  target_study_level: "masters",
  target_fields: ["stem"],
  target_countries: ["uk"]
});
assert.strictEqual(matches.length, 1);
assert.strictEqual(matches[0].percent, 97);
assert.strictEqual(matches[0].category, "Strong Match");
assert.strictEqual(matches[0].scholarship.info_url, "https://example.org/official");

console.log("French Education owner oracles: 42/42 declarations and focused exact fixtures passed.");
