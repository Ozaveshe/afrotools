"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const inventory = require("../reports/swahili-free-app-parity-inventory.json");
const routeForMissing = { "meta-tag-gen": "/sw/zana/kizalishaji-meta/" };
const sourceFor = {
  "meta-tag-gen": "assets/js/engines/meta-tag-engine.js",
  "ussd-simulator": "tools/ussd-simulator/index.html#inline-state-machine",
  "meta-tag-generator": "tools/meta-tag-generator/index.html#inline-controller"
};
const rows = inventory.rows.filter((row) => row.categoryKey === "developer" && !row.accepted);
if (rows.length !== 26) throw new Error(`Assigned Developer denominator drift: ${rows.length}/26`);
function slash(value) { return `/${String(value || "").replace(/^\/+|\/+$/g, "")}/`; }
function artwork(id) {
  for (const ext of ["webp", "svg", "png", "jpg"]) {
    const file = `assets/img/tools/${id}.${ext}`;
    if (fs.existsSync(path.join(root, file))) return file;
  }
  return `assets/img/tools/${id}.webp`;
}
const routes = rows.map((row) => {
  const swahili = slash(row.primarySwahiliRoute || routeForMissing[row.englishId]);
  const file = `${swahili.replace(/^\//, "")}index.html`;
  if (!fs.existsSync(path.join(root, file))) throw new Error(`${row.englishId}: missing ${file}`);
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (/afrotools-language-fallback|<iframe\b/i.test(html)) throw new Error(`${row.englishId}: fallback/transplant marker remains`);
  return {
    id: row.englishId, english: slash(row.englishRoute), swahili, file,
    baselineState: row.state, sourceOwner: sourceFor[row.englishId] || row.sourceOwner,
    artwork: artwork(row.englishId), state: "candidate-proof-pending"
  };
});
const manifest = { schemaVersion: 1, baseline: "6edacda8437e1fa9b9e5a512138cbdd3169e38be", category: "Developer Tools", categoryKey: "developer", denominator: 26, routes };
fs.writeFileSync(path.join(root, "data/localization/sw-developer-parity.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const missing = routes.filter((route) => !fs.existsSync(path.join(root, route.artwork))).map((route) => ({ id: route.id, route: route.swahili, artwork: route.artwork }));
fs.writeFileSync(path.join(root, "reports/sw-developer-missing-artwork.json"), `${JSON.stringify({ denominator: 26, missingCount: missing.length, missing }, null, 2)}\n`);
console.log(`Developer manifest ${routes.length}/26; artwork missing ${missing.length}.`);
