#!/usr/bin/env node
"use strict";

const {
  MANIFEST_PATH,
  DEFAULT_WAVE_STRATEGY,
  buildManifest,
  writeManifest
} = require("./lib/afrokitchen-static");

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1 || index === process.argv.length - 1) return "";
  return String(process.argv[index + 1] || "").trim();
}

async function main() {
  const waveStrategy = readFlag("--wave") || DEFAULT_WAVE_STRATEGY;
  const manifest = await buildManifest({ waveStrategy });
  writeManifest(manifest, MANIFEST_PATH);

  console.log("AfroKitchen SEO manifest exported.");
  console.log(`Manifest path: ${MANIFEST_PATH}`);
  console.log(`Verified recipes: ${manifest.source.verified_recipe_count}`);
  console.log(`Generated recipe wave: ${manifest.wave.recipe_count}`);
  console.log(`Country hubs: ${manifest.wave.country_hub_count}`);
  console.log(`Collection pages: ${manifest.wave.collection_page_count}`);
  console.log(`Wave strategy: ${manifest.wave.strategy}`);
}

main().catch((error) => {
  console.error("Failed to export AfroKitchen SEO manifest.");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
