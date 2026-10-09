'use strict';

// Offline image-only refresh: preserve release-owned markup and recipe content.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, loadManifest, loadRecipeImages, loadAfroKitchenEngine } = require('./lib/afrokitchen-static');
const { imageSize } = require('./lib/image-size');
const { buildCuisineIntelligence, writeCuisineIntelligenceFiles } = require('./lib/afrokitchen-cuisine-intelligence');
const { buildRecipePageHtml, refreshRecipeImages, refreshRecipeSchema, renderStaticRecipeCard } = require('./generate-afrokitchen-static-pages');
const ledger = require('../data/image-generation/kitchen-generated-2026-10-09.json');
const aliasLedger = require('../data/image-generation/recipe-image-aliases.json');

function run() {
  const manifest = loadManifest();
  const reused = aliasLedger.hero_reviews || [];
  const targets = new Set([...ledger.images, ...reused].map(image => image.slug));
  for (const image of ledger.images) {
    if (!manifest.recipes.some(recipe => recipe.slug === image.slug)) throw new Error(`Unknown recipe: ${image.slug}`);
    for (const variant of image.variants) {
      if (!variant.path.startsWith('/assets/img/kitchen/') || variant.path.includes('..')) throw new Error('Invalid artwork path');
      const file = path.join(ROOT, variant.path);
      const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      const size = imageSize(file);
      if (hash !== variant.sha256 || size?.w !== variant.width || size?.h !== variant.height) throw new Error(`Artwork changed: ${file}`);
    }
  }
  for (const image of reused) {
    if (!manifest.recipes.some(recipe => recipe.slug === image.slug)) throw new Error(`Unknown recipe: ${image.slug}`);
    if (image.path !== `/assets/img/kitchen/${aliasLedger.aliases[image.slug]}.webp` || image.path.includes('..')) throw new Error(`Invalid recipe alias: ${image.slug}`);
    const file = path.join(ROOT, image.path);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    const size = imageSize(file);
    if (hash !== image.sha256 || size?.w !== image.width || size?.h !== image.height) throw new Error(`Reviewed artwork changed: ${file}`);
  }
  const recipeImages = loadRecipeImages();
  const researchAudit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/afrokitchen/recipe-research-audit.json'))).recipes || {};
  const intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit });
  // The source ledger date makes a repeated offline refresh deterministic.
  intelligence.generated_at = `${ledger.created_at}T00:00:00.000Z`;
  intelligence.summary.generated_at = intelligence.generated_at;
  writeCuisineIntelligenceFiles(intelligence);
  const engine = loadAfroKitchenEngine();
  const cards = new Map();
  const changed = [];
  for (const recipe of manifest.recipes.filter(recipe => targets.has(recipe.slug))) {
    const file = path.join(ROOT, 'tools/afrokitchen/recipes', recipe.slug, 'index.html');
    const current = fs.readFileSync(file, 'utf8');
    const generated = buildRecipePageHtml(recipe, manifest, engine, recipeImages, researchAudit, intelligence);
    let next = refreshRecipeImages(current, generated);
    const schemas = [...generated.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const schema = schemas.find(value => value['@type'] === 'Recipe');
    const blockers = generated.match(/name="afrokitchen-schema-blockers" content="([^"]*)"/)?.[1].split(',').filter(Boolean) || [];
    next = refreshRecipeSchema(next, schema, blockers);
    if (next !== current) { fs.writeFileSync(file, next); changed.push(path.relative(ROOT, file)); }
    cards.set(`/tools/afrokitchen/recipes/${recipe.slug}/`, renderStaticRecipeCard(recipe, recipeImages));
  }
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.html')) {
        const current = fs.readFileSync(file, 'utf8');
        const next = current.replace(/<a class="ak-static-recipe-card[^>]*href="([^"]+)"[\s\S]*?<\/a>/g, (all, href) => cards.get(href) || all);
        if (next !== current) { fs.writeFileSync(file, next.replace(/[ \t]+$/gm, '')); changed.push(path.relative(ROOT, file)); }
      }
    }
  }
  visit(path.join(ROOT, 'tools/afrokitchen'));
  console.log(JSON.stringify({ images: targets.size, refreshed: [...new Set(changed)] }, null, 2));
}
if (require.main === module) run();
module.exports = { run };
