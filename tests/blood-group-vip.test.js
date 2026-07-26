const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tools/blood-group/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "tools/blood-group/blood-group-vip.css"), "utf8");
const js = fs.readFileSync(path.join(root, "tools/blood-group/blood-group-vip.js"), "utf8");
const context = JSON.parse(fs.readFileSync(path.join(root, "data/ai/tool-context/blood-group.json"), "utf8"));
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");

assert.match(html, /Red cells ≠ plasma/);
assert.match(html, /type, antibody-screen|type the blood, screen/i);
assert.match(html, /crossmatch/i);
assert.match(html, /does not label this platelet|platelet selection/i);
assert.match(html, /does not give a schedule/i);
assert.match(html, /stay in this browser/i);
assert.match(html, /Save on this device/);
assert.match(html, /Download PDF/);
assert.match(html, /Reviewed 26 July 2026/);
assert.match(html, /updated April 2026/i);
assert.doesNotMatch(html, /West Africa Blood Type Frequencies|Only 1% of Africans|1 in 5 hospitalised|every 3 months|50-55%|6-8% of Africans/i);
assert.doesNotMatch(html, /Safe to transfuse|Seek a compatible donor|What You Must Do|within 72 hours|at 28 weeks/i);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs/i);
assert.match(css, /max-width:560px/);
assert.match(css, /data-theme="dark"/);
assert.match(css, /prefers-reduced-motion/);
assert.match(js, /recordSnapshot/);
assert.doesNotMatch(js, /fetch\s*\(|localStorage|sessionStorage/);
assert.strictEqual(context.toolKey, "blood-group");
assert.strictEqual(context.status, "unverified-static");
assert.match(context.staticText, /Red-cell and plasma compatibility directions are different/i);
assert.match(context.staticText, /Local save and PDF are optional and ungated/i);
assert.match(registry, /id: 'blood-group', name: 'Blood Component Compatibility Reference'[\s\S]*?status: 'live', phase: 'LIVE'/);

console.log("blood-group VIP surface tests passed");
