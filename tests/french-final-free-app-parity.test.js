"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/localization/fr-final-free-app-parity.json"), "utf8"));
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");

assert.deepStrictEqual(manifest.owners.map((owner) => owner.sourceId), ["boq-gen", "export-docs-trade"]);

for (const owner of manifest.owners) {
  const frenchFile = path.join(root, owner.frenchRoute.replace(/^\/|\/$/g, ""), "index.html");
  const englishFile = path.join(root, owner.englishRoute.replace(/^\/|\/$/g, ""), "index.html");
  const artwork = path.join(root, owner.artwork.replace(/^\//, ""));
  const french = fs.readFileSync(frenchFile, "utf8");
  const english = fs.readFileSync(englishFile, "utf8");

  assert(fs.existsSync(artwork), `${owner.sourceId}: missing artwork`);
  assert(!/<iframe\b/i.test(french), `${owner.sourceId}: iframe bridge is not native`);
  assert(/<html[^>]+lang="fr"/i.test(french), `${owner.sourceId}: French lang missing`);
  assert(french.includes(`https://afrotools.com${owner.frenchRoute}`), `${owner.sourceId}: French canonical missing`);
  assert(french.includes(`hreflang="en" href="https://afrotools.com${owner.englishRoute}"`), `${owner.sourceId}: English alternate missing`);
  assert(english.includes(`hreflang="fr" href="https://afrotools.com${owner.frenchRoute}"`), `${owner.sourceId}: reciprocal alternate missing`);
  assert(/"inLanguage"\s*:\s*"fr"/.test(french), `${owner.sourceId}: French schema missing`);
  assert(/Local par défaut|local-first|reste dans ce navigateur/i.test(french), `${owner.sourceId}: privacy boundary missing`);
  assert(/source|hypothèse|limite|autorité/i.test(french), `${owner.sourceId}: source/confidence boundary missing`);
  assert(registry.includes(`id: '${owner.registryId}'`) && registry.includes(`sourceId: '${owner.sourceId}'`), `${owner.sourceId}: registry ownership missing`);
}

const boq = fs.readFileSync(path.join(root, "fr/tools/generateur-boq/index.html"), "utf8");
assert(boq.includes("data-fr-engineering-import"), "boq-gen: JSON reopen missing");
assert(boq.includes("exportCSV()") && boq.includes("window.print()"), "boq-gen: advertised exports missing");
for (const residue of ["Bill of Quantities", "Non. of", "Mur Type", "Groupe électrogène"]) {
  assert(!boq.includes(residue), `boq-gen: residual presentation copy ${residue}`);
}
assert(boq.includes("Bordereau quantitatif") && boq.includes("Nombre de portes"), "boq-gen: reviewed French workflow copy missing");

const trade = fs.readFileSync(path.join(root, "fr/tools/documents-export/index.html"), "utf8");
for (const format of ["pdf", "csv", "json", "txt"]) {
  assert(trade.includes(`data-export="${format}"`), `export-docs-trade: ${format} export missing`);
}
assert(trade.includes("data-import-json"), "export-docs-trade: JSON reopen missing");

const check = spawnSync(process.execPath, ["scripts/build-french-final-free-app-parity.js"], {
  cwd: root,
  encoding: "utf8"
});
assert.strictEqual(check.status, 0, `${check.stdout}\n${check.stderr}`);

console.log("French final free-app parity: 2/2 owner contracts passed.");
