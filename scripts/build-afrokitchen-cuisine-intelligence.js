#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  DEFAULT_WAVE_STRATEGY,
  loadRecipeImages,
  buildManifest
} = require("./lib/afrokitchen-static");
const {
  buildCuisineIntelligence,
  writeCuisineIntelligenceFiles,
  mergeIntelligenceCollections
} = require("./lib/afrokitchen-cuisine-intelligence");

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1 || index === process.argv.length - 1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function loadRecipeResearchAudit() {
  const auditPath = path.join(ROOT, "data", "afrokitchen", "recipe-research-audit.json");
  if (!fs.existsSync(auditPath)) return {};
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  return audit && audit.recipes ? audit.recipes : {};
}

async function main() {
  const waveStrategy = readFlag("--wave") || DEFAULT_WAVE_STRATEGY;
  const recipeImages = loadRecipeImages();
  const researchAudit = loadRecipeResearchAudit();
  const manifest = await buildManifest({ waveStrategy });
  const intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit });
  mergeIntelligenceCollections(manifest, intelligence);
  writeCuisineIntelligenceFiles(intelligence);
  console.log(
    `AfroKitchen cuisine intelligence built: ${intelligence.summary.recipe_count} recipes, ` +
      `${intelligence.summary.country_count} countries, ` +
      `${intelligence.summary.curated_collection_count} curated collections.`
  );
  console.log(
    `Images: ${intelligence.summary.hero_image_count} hero-ready, ` +
      `${intelligence.summary.gallery_ready_count} gallery-ready, ` +
      `${intelligence.summary.needs_image_count} need images.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
