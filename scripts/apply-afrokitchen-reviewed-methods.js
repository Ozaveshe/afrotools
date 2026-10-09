'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { applyReviewedManifest, overrides } = require('./lib/afrokitchen-method-corrections');
const { ROOT, MANIFEST_PATH, loadAfroKitchenEngine, loadRecipeImages, writeManifest } = require('./lib/afrokitchen-static');
const { buildRecipePageHtml, buildCountryPageHtml, buildCollectionPageHtml, renderStaticRecipeCard } = require('./generate-afrokitchen-static-pages');
const { buildCuisineIntelligence, writeCuisineIntelligenceFiles } = require('./lib/afrokitchen-cuisine-intelligence');
const { writeRecipeIndex } = require('./lib/afrokitchen-recipe-index');

const original = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const manifest = applyReviewedManifest(original);
const research = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/afrokitchen/recipe-research-audit.json'), 'utf8')).recipes;
for (const [slug, correction] of Object.entries(overrides)) {
  assert.deepEqual(research[slug].sources, correction.sources, 'Method research sources drift: ' + slug);
  assert.equal(research[slug].reviewed_at, correction.reviewed_at, 'Method review date drift: ' + slug);
  assert(!research[slug].static_recipe_patch, 'An older research patch must not override the accepted method: ' + slug);
}
const recipeImages = loadRecipeImages(), engine = loadAfroKitchenEngine();
let intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit: research });
const curated = new Map((intelligence.curated_collections || []).map(collection => [collection.slug, collection]));
manifest.collections = (manifest.collections || []).map(collection => curated.get(collection.slug) || collection);
manifest.source.collection_membership_count = manifest.collections.reduce((sum, collection) => sum + Number(collection.total_recipes || 0), 0);
intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit: research });
// This offline build is reproducible from maintained source dates. Regeneration
// does not imply a new culinary review or a fresh live-data observation.
const sourceDate = [manifest.generated_at, ...Object.values(overrides).map(recipe => recipe.reviewed_at + 'T00:00:00.000Z')].filter(Boolean).sort().at(-1);
intelligence.generated_at = sourceDate;
intelligence.summary.generated_at = sourceDate;
const revised = new Set(Object.keys(overrides)), pending = new Map();
const normalize = html => html.replace(/[ \t]+$/gm, '');
function prepare(relative, html) { pending.set(relative, normalize(html)); }
for (const recipe of manifest.recipes.filter(recipe => revised.has(recipe.slug))) {
  prepare('tools/afrokitchen/recipes/' + recipe.slug + '/index.html', buildRecipePageHtml(recipe, manifest, engine, recipeImages, research, intelligence));
}
for (const country of manifest.countries || []) if ((country.recipes || []).some(recipe => revised.has(recipe.slug))) {
  prepare('tools/afrokitchen/countries/' + country.country_slug + '/index.html', buildCountryPageHtml(country, manifest, intelligence, recipeImages));
}
for (const collection of manifest.collections || []) {
  const before = original.collections.find(item => item.slug === collection.slug);
  if ([...(collection.recipes || []), ...(before?.recipes || [])].some(recipe => revised.has(recipe.slug))) {
    prepare('tools/afrokitchen/collections/' + collection.slug + '/index.html', buildCollectionPageHtml(collection, manifest, intelligence, recipeImages));
  }
}
const cards = new Map(manifest.recipes.filter(recipe => revised.has(recipe.slug)).map(recipe => [recipe.route_path, renderStaticRecipeCard(recipe, recipeImages)]));
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const relative = path.relative(ROOT, full).split(path.sep).join('/');
      if (pending.has(relative)) continue;
      const before = fs.readFileSync(full, 'utf8');
      const after = before.replace(/<a class="ak-static-recipe-card[^>]*href="([^"]+)"[\s\S]*?<\/a>/g, (all, href) => cards.get(href) || all);
      if (after !== before) prepare(relative, after);
    }
  }
}
visit(path.join(ROOT, 'tools/afrokitchen'));
writeManifest(manifest, MANIFEST_PATH);
writeRecipeIndex(manifest);
writeCuisineIntelligenceFiles(intelligence);
let changed = 0;
for (const [relative, next] of pending) {
  const full = path.join(ROOT, relative);
  if (fs.readFileSync(full, 'utf8') !== next) { fs.writeFileSync(full, next, 'utf8'); changed++; }
}
console.log('Applied nine reviewed method/image pairs through native page, index and cuisine owners; changed ' + changed + ' pages. Live data was not read or changed.');
