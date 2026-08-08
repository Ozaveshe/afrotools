"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const { apps, render } = require("../scripts/build-sw-agriculture-assigned-apps.js");
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/swahili-free-app-parity-inventory.json"), "utf8"));
const assigned = inventory.rows.filter(row => row.categoryKey === "agriculture" && !row.accepted);
assert.strictEqual(assigned.length, 20, "exact Agriculture denominator");
assert.strictEqual(apps.length, 20, "20 maintained configurations");
assert.deepStrictEqual(new Set(apps.map(app => app.id)), new Set(assigned.map(row => row.englishId)), "exact assigned English IDs");
for (const app of apps) {
  const file = path.join(ROOT, "sw/zana", app.slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.strictEqual(html, render(app), `${app.id}: generated output current`);
  assert.match(html, /<html lang="sw">/, `${app.id}: native Swahili`);
  assert.match(html, /build-sw-agriculture-assigned-apps\.js/, `${app.id}: maintained owner`);
  assert.match(html, new RegExp(`canonical" href="https://afrotools\\.com/sw/zana/${app.slug}/`), `${app.id}: self canonical`);
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${app.en.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`), `${app.id}: English alternate`);
  assert.doesNotMatch(html, /<iframe\b/i, `${app.id}: no bridge`);
  for (const format of ["pdf","csv","json","txt"]) assert.match(html, new RegExp(`data-export="${format}"`), `${app.id}: ${format}`);
}
const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-agriculture-assigned-parity.js"), "utf8");
assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, "local-only runtime");
assert.match(runtime, /latest=null;box\.hidden=true;output\.textContent=""/, "fail-closed stale result clearing");
assert.match(runtime, /p\.tool!==cfg\.id\|\|p\.locale!=="sw"/, "scoped JSON reopen");
console.log("sw-agriculture-assigned-static.test.js passed: exact 20 native generated candidates");
