'use strict';
const fs = require('node:fs');
const path = require('node:path');
const policy = require('./lib/afrokitchen-method-holds');
const { ROOT, MANIFEST_PATH, loadRecipeImages, writeManifest } = require('./lib/afrokitchen-static');
const pages = require('./generate-afrokitchen-static-pages');
const { buildCuisineIntelligence, writeCuisineIntelligenceFiles } = require('./lib/afrokitchen-cuisine-intelligence');
const { writeRecipeIndex } = require('./lib/afrokitchen-recipe-index');

// Preserve unrelated markup, post-processing and recipe bodies while replacing
// old recommendations with an explicit status link. Never retain a hidden image
// or countdown behind the notice.
function refreshHeldLinks(html) {
  return html.replace(/<a\b[^>]*href="([^"#]+)"[^>]*>[\s\S]*?<\/a>/g, (all, href) => {
    const match = href.match(/^(?:https:\/\/afrotools\.com)?\/tools\/afrokitchen\/recipes\/([^/]+)\/$/);
    if (!match || !policy.isMethodHeld(match[1])) return all;
    const held = policy.applyMethodHold(match[1]);
    return /class="ak-static-recipe-card\b/.test(all)
      ? pages.renderStaticRecipeCard(held, {})
      : pages.renderCompactRecipeLink(held, 'Method under review');
  });
}

function main() {
  const original = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manifest = policy.applyHeldManifest(original);
  const recipeImages = loadRecipeImages();
  const research = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/afrokitchen/recipe-research-audit.json'), 'utf8')).recipes;
  const intelligence = buildCuisineIntelligence(manifest, { recipeImages, researchAudit: research });
  const sourceDate = [manifest.generated_at, ...policy.METHOD_HOLD_SLUGS.map(slug => policy.applyMethodHold(slug).method_hold.since + 'T00:00:00.000Z')].filter(Boolean).sort().at(-1);
  intelligence.generated_at = sourceDate;
  intelligence.summary.generated_at = sourceDate;
  const pending = new Map();
  const prepare = (relative, html) => pending.set(relative, html.replace(/[ \t]+$/gm, ''));
  for (const recipe of manifest.recipes.filter(policy.isMethodHeld)) {
    prepare('tools/afrokitchen/recipes/' + recipe.slug + '/index.html', pages.buildRecipePageHtml(recipe));
  }
  for (const country of manifest.countries) {
    const before = original.countries.find(item => item.country_code === country.country_code);
    if (JSON.stringify(before) !== JSON.stringify(country)) prepare('tools/afrokitchen/countries/' + country.country_slug + '/index.html', pages.buildCountryPageHtml(country, manifest, intelligence, recipeImages));
  }
  for (const collection of manifest.collections) {
    const before = original.collections.find(item => item.slug === collection.slug);
    if (JSON.stringify(before) !== JSON.stringify(collection)) prepare('tools/afrokitchen/collections/' + collection.slug + '/index.html', pages.buildCollectionPageHtml(collection, manifest, intelligence, recipeImages));
  }
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relative = path.relative(ROOT, full).split(path.sep).join('/');
        if (pending.has(relative)) continue;
        const before = fs.readFileSync(full, 'utf8'), after = refreshHeldLinks(before);
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
  pages.updateLandingSource(manifest, intelligence);
  console.log(`Applied ${policy.METHOD_HOLD_SLUGS.length} method holds; ${manifest.recipes.length} route identities retained, ${intelligence.summary.recipe_count} available methods, ${changed} recipe/group/link pages changed. No live reads or writes.`);
}

if (require.main === module) main();
module.exports = { refreshHeldLinks };
