'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, loadManifest, loadRecipeImages, loadAfroKitchenEngine } = require('./lib/afrokitchen-static');
const { imageSize } = require('./lib/image-size');
const { buildCuisineIntelligence, writeCuisineIntelligenceFiles } = require('./lib/afrokitchen-cuisine-intelligence');
const { buildRecipePageHtml, refreshRecipeImages } = require('./generate-afrokitchen-static-pages');
function run() {
  const manifest = loadManifest();
  const folder = path.join(ROOT, 'assets/img/new');
  const receiptPath = path.join(ROOT, 'data/image-generation/kitchen-import-2026-09-08.json');
  if (!fs.existsSync(receiptPath)) throw new Error('A visually reviewed, hashed intake receipt is required.');
  const entries = JSON.parse(fs.readFileSync(receiptPath)).images;
  for (const filename of fs.readdirSync(folder).sort()) {
    if (!filename.endsWith('.webp')) continue;
    const slug = filename.slice(0, -5);
    if (!entries.some(e => e.slug === slug)) throw new Error('New delivery needs a separate visual review: ' + filename);
  }
  // Validate every checksum before any move, including unchanged held files.
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.slug) || !['placed','needs-review'].includes(entry.status)) throw new Error('Invalid reviewed entry');
    const expectedSource = 'assets/img/new/' + entry.slug + '.webp';
    const expectedPath = '/' + (entry.status === 'placed' ? 'assets/img/kitchen/' : 'assets/img/new/') + entry.slug + '.webp';
    if (entry.source !== expectedSource || entry.path !== expectedPath) throw new Error('Invalid intake destination');
    if (!manifest.recipes.some(r => r.slug === entry.slug)) throw new Error('Unmapped recipe: ' + entry.slug);
    const source = path.join(ROOT, entry.source), target = path.join(ROOT, entry.path);
    for (const file of [...new Set([source,target])].filter(f=>fs.existsSync(f))) {
      if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.sha256) throw new Error('Reviewed image changed: ' + entry.slug);
    }
    if (!fs.existsSync(source) && !fs.existsSync(target)) throw new Error('Missing image: ' + entry.slug);
    if (entry.status === 'placed') {
      const size = imageSize(fs.existsSync(target) ? target : source);
      if (!size || size.w < 640 || size.h < 400) throw new Error('Insufficient image dimensions');
    }
  }
  for (const entry of entries.filter(e=>e.status === 'placed')) {
    const source = path.join(ROOT,entry.source), target=path.join(ROOT,entry.path);
    if (fs.existsSync(source)) {
      if (fs.existsSync(target)) throw new Error('Duplicate intake requires reconciliation: ' + entry.slug);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.renameSync(source, target);
    }
  }
  const recipeImages = loadRecipeImages();
  const researchAudit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/afrokitchen/recipe-research-audit.json'))).recipes || {};
  const intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit });
  writeCuisineIntelligenceFiles(intelligence);
  const engine = loadAfroKitchenEngine();
  const aliasSlugs = Object.keys(require('../data/image-generation/recipe-image-aliases.json').aliases);
  const refreshSlugs = [...entries.filter(e => e.status === 'placed').map(e=>e.slug), ...aliasSlugs];
  for (const slug of refreshSlugs) {
    const recipe = manifest.recipes.find(r => r.slug === slug);
    const file = path.join(ROOT, 'tools/afrokitchen/recipes', recipe.slug, 'index.html');
    const current = fs.readFileSync(file, 'utf8');
    const generated = buildRecipePageHtml(recipe, manifest, engine, recipeImages, researchAudit, intelligence);
    fs.writeFileSync(file, refreshRecipeImages(current, generated));
  }
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify({ schema_version: 1, reviewed_at: '2026-09-08', source_manifest_date: manifest.generated_at, evidence: 'Local file content and saved recipe catalog; no live database or deployment verification.', images: entries }, null, 2) + '\n');
  console.log(JSON.stringify({ placed: entries.filter(e => e.status === 'placed').length, held: entries.filter(e => e.status === 'needs-review').length }));
}
if (require.main === module) run();
module.exports = { run };
