const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "tools", "education-hub");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "education-hub.js"), "utf8");
const vipCss = fs.readFileSync(path.join(root, "education-hub-vip.css"), "utf8");

assert.match(html, /Private Education Planning Dashboard/);
assert.match(html, /Privacy and interpretation/);
assert.match(html, /planner, not an eligibility decision/i);
assert.match(html, /source-filter overlaps/i);
assert.match(html, /official provider/i);
assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);
assert.doesNotMatch(html, /next best action/i);
assert.doesNotMatch(html, /good scholarship matches/i);
assert.doesNotMatch(html, /judge study-abroad readiness/i);
assert.match(appJs, /More fields overlap/);
assert.match(appJs, /GPA cannot be greater than the selected scale/);
assert.match(appJs, /input\.checkValidity/);
assert.match(appJs, /function sanitizeProfile/);
assert.match(appJs, /function sanitizeJambSummary/);
assert.doesNotMatch(
  appJs,
  /Strong Match|A real application plan usually starts|judge your English readiness|Save schools before the route becomes too abstract/
);
assert.doesNotMatch(html, /education-hub-vip\.js/);
assert.match(vipCss, /max-width:\s*700px/);
assert.match(vipCss, /prefers-color-scheme:\s*dark/);

console.log("education-hub app VIP static assertions passed");
