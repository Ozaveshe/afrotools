const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tools/child-growth/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "tools/child-growth/child-growth-vip.css"), "utf8");
const js = fs.readFileSync(path.join(root, "tools/child-growth/child-growth-vip.js"), "utf8");
const data = fs.readFileSync(path.join(root, "tools/child-growth/who-growth-lms.js"), "utf8");
const context = JSON.parse(fs.readFileSync(path.join(root, "data/ai/tool-context/child-growth.json"), "utf8"));
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");

assert.match(html, /WHO 2006 screening reference/);
assert.match(html, /Birth–1,826 days/);
assert.match(html, /recumbent length through 730 completed days and standing height from 731 days/i);
assert.match(html, /generic chart cannot determine malnutrition, obesity, failure to thrive/i);
assert.match(html, /Unable to drink or breastfeed/);
assert.match(html, /Dates and measurements stay in this browser/);
assert.match(html, /Save on this device/);
assert.match(html, /Download PDF/);
assert.match(html, /Checked 26 July 2026/);
assert.doesNotMatch(html, /0–18|vaccination schedule|EPI|stunting assessment|wasting assessment|Normal Growth|Severe Malnutrition Indicators/i);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs/i);
assert.match(css, /max-width:600px/);
assert.match(css, /data-theme="dark"/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(js, /fetch\s*\(|localStorage|sessionStorage/);
assert.match(data, /WHO Child Growth Standards 2006/);
assert.match(data, /b776d8a12b1c97369c748b561159fd2ec4f4db58/);
assert.strictEqual(context.status, "unverified-static");
assert.match(context.staticText, /fail closed/i);
assert.match(context.staticText, /Never diagnose or rule out malnutrition/i);
assert.match(registry, /id: 'child-growth', name: 'WHO Child Growth Screening Reference'[\s\S]*?status: 'live', phase: 'LIVE'/);

console.log("child-growth VIP surface tests passed");
