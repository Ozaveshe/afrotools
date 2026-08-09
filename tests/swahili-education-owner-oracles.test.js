"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-education-parity.json");
const routeEngine = require("../engines/src/education-route-engine.js");

assert.strictEqual(manifest.denominator, 32, "Assigned Education denominator must remain exact");
assert.strictEqual(manifest.routes.length, 32, "Every assigned Education app needs an owner declaration");
assert.strictEqual(manifest.routes.filter((route) => route.owner !== "existing-native-owner").length, 31);
assert.strictEqual(manifest.routes.filter((route) => route.owner === "existing-native-owner").length, 1);

const controller = fs.readFileSync(path.join(root, "assets/js/pages/sw-education-parity.js"), "utf8");
for (const route of manifest.routes.filter((item) => item.owner !== "existing-native-owner")) {
  const html = fs.readFileSync(path.join(root, route.swahili.replace(/^\/|\/$/g, ""), "index.html"), "utf8");
  assert(html.includes(`"global":"${route.owner}"`), `${route.id} must declare the reviewed English owner`);
  assert(html.includes("/assets/js/pages/sw-education-parity.js"), `${route.id} must use the shared Swahili adapter`);
  assert(html.includes(`content="${route.id}"`), `${route.id} must declare its native Swahili ownership`);
  assert(fs.existsSync(path.join(root, route.artwork)), `${route.id} must have its declared artwork`);
}
assert(controller.includes("await runners[config.recipe](input, engine(config.global))"), "Swahili adapter must call the declared owner");
assert(controller.includes("runOwner(recipe, input, globalPath)"), "Browser proof must be able to replay the exact owner oracle");

const admission = routeEngine.plan({
  country: "nigeria",
  programme: "Computer Science",
  institution: "Example University",
  requirementsChecked: "no"
});
assert.strictEqual(admission.ok, true);
assert.strictEqual(admission.source, "https://eligibility.jamb.gov.ng/");
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

console.log("Swahili Education owner oracles: 32/32 declarations and focused source fixtures passed.");
