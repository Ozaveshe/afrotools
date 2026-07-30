"use strict";

const fs = require("fs");
const path = require("path");
const { synchronizeHtml } = require("./lib/fr-agriculture-hreflang");

const ROOT = path.resolve(__dirname, "..");
const swahiliManifest = require("../data/localization/sw-agriculture-parity-manifest.json");
const frenchManifest = require("../data/localization/fr-agriculture-parity-manifest.json");

function main() {
  const check = process.argv.includes("--check");
  const swahiliRows = swahiliManifest.rows.filter(row => row.family === "fertilizer");
  const frenchById = new Map(
    frenchManifest.rows
      .filter(row => row.family === "fertilizer")
      .map(row => [row.english.id, row.french])
  );
  const hubRows = swahiliRows.filter(row => !row.country);
  const countryRows = swahiliRows.filter(row => row.country);
  if (swahiliRows.length !== 55 || hubRows.length !== 1 || countryRows.length !== 54) {
    throw new Error(`Expected 55/1/54 fertilizer hreflang rows, received ${swahiliRows.length}/${hubRows.length}/${countryRows.length}.`);
  }

  let changed = 0;
  for (const row of swahiliRows) {
    const french = frenchById.get(row.english.id);
    if (!french) throw new Error(`Missing French reciprocal route for ${row.english.id}.`);
    const file = path.join(ROOT, row.english.file);
    const current = fs.readFileSync(file, "utf8");
    const next = synchronizeHtml(current, {
      english: row.english,
      french,
      swahili: row.swahili
    });
    if (!next.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`)) {
      throw new Error(`Swahili reciprocal alternate was not written for ${row.english.id}.`);
    }
    if (next !== current) {
      changed += 1;
      if (!check) fs.writeFileSync(file, next, "utf8");
    }
  }
  if (check && changed) {
    throw new Error(`${changed} English fertilizer hreflang blocks are stale.`);
  }
  console.log(JSON.stringify({
    family: "fertilizer",
    rows: swahiliRows.length,
    changed,
    mode: check ? "check" : "write"
  }, null, 2));
}

if (require.main === module) main();

module.exports = { main };
