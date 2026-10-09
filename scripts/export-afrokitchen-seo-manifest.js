#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const { isDeepStrictEqual } = require("node:util");
const {
  MANIFEST_PATH,
  DEFAULT_WAVE_STRATEGY,
  buildManifest,
  writeManifest
} = require("./lib/afrokitchen-static");
const { buildCuisineIntelligence, refreshDietaryCollectionData } = require('./lib/afrokitchen-cuisine-intelligence');

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1 || index === process.argv.length - 1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function refreshRecipeDietTags(saved, live, slugs) {
  if (!Array.isArray(slugs) || !slugs.length || new Set(slugs).size !== slugs.length ||
      slugs.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    throw new Error("Diet tag refresh requires unique recipe slugs");
  }
  const updates = new Map();
  for (const slug of slugs) {
    const before = saved.recipes.filter((recipe) => recipe.slug === slug);
    const after = live.recipes.filter((recipe) => recipe.slug === slug);
    if (before.length !== 1 || after.length !== 1 || !before[0].id || before[0].id !== after[0].id) {
      throw new Error(`Recipe identity changed: ${slug}`);
    }
    if (!isDeepStrictEqual(before[0].ingredients, after[0].ingredients)) {
      throw new Error(`Recipe ingredients changed: ${slug}`);
    }
    for (const field of ["diet_tags", "tags"]) {
      if (!Array.isArray(before[0][field]) || !Array.isArray(after[0][field]) ||
          !isDeepStrictEqual(after[0][field], before[0][field].filter((tag) => after[0][field].includes(tag)))) {
        throw new Error(`Tag refresh only permits ordered removals: ${slug}.${field}`);
      }
    }
    updates.set(slug, { before: before[0], after: after[0] });
  }
  const manifest = structuredClone(saved);
  let updatedCopies = 0;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    const update = updates.get(value.slug);
    if (update && Array.isArray(value.diet_tags)) {
      let changed = false;
      for (const field of ["diet_tags", "tags"]) {
        if (!Object.hasOwn(value, field)) continue;
        if (!isDeepStrictEqual(value[field], update.before[field])) {
          throw new Error(`Saved recipe summary tags differ: ${value.slug}.${field}`);
        }
        changed ||= !isDeepStrictEqual(value[field], update.after[field]);
        value[field] = [...update.after[field]];
      }
      if (changed) updatedCopies += 1;
    }
    Object.values(value).forEach(visit);
  }
  visit(manifest);
  return {
    manifest,
    updatedCopies,
    changedSlugs: slugs.filter((slug) => {
      const { before, after } = updates.get(slug);
      return !isDeepStrictEqual(before.diet_tags, after.diet_tags) || !isDeepStrictEqual(before.tags, after.tags);
    })
  };
}

async function main() {
  if (process.argv.includes("--refresh-diet-tags")) {
    const slugs = readFlag("--slugs").split(",").map((slug) => slug.trim()).filter(Boolean);
    if (!slugs.length || process.argv.includes("--wave")) {
      throw new Error("Use --refresh-diet-tags --slugs slug-one,slug-two without --wave");
    }
    const saved = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const live = await buildManifest({ waveStrategy: saved.wave.strategy });
    const result = refreshRecipeDietTags(saved, live, slugs);
    const derived = refreshDietaryCollectionData(result.manifest, null, buildCuisineIntelligence(result.manifest));
    writeManifest(derived.manifest, MANIFEST_PATH);
    console.log(`Refreshed diet tags for ${result.changedSlugs.length} recipes across ${result.updatedCopies} saved recipe summaries and ${derived.changedCollections.length} curated collections. Other fields and generation dates preserved.`);
    return;
  }
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

if (require.main === module) main().catch((error) => {
  console.error("Failed to export AfroKitchen SEO manifest.");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});

module.exports = { refreshRecipeDietTags };
