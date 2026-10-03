const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildRecipePageHtml } = require('../scripts/generate-afrokitchen-static-pages');
const { loadAfroKitchenEngine, loadRecipeImages } = require('../scripts/lib/afrokitchen-static');

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../tools/afrokitchen/seo-manifest.json')));
const engine = loadAfroKitchenEngine();
const recipeImages = loadRecipeImages();
const recipe = slug => structuredClone(manifest.recipes.find(item => item.slug === slug));
const page = item => buildRecipePageHtml(item, manifest, engine, recipeImages, { recipes: {} });
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
const recipeSchema = html => schemas(html).find(item => item['@type'] === 'Recipe');

test('a photo-less published recipe stays searchable without claiming the category banner is its dish photo', () => {
  const html = page(recipe('fisherman-soup-ng'));
  assert.equal(recipeSchema(html), undefined);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<meta name="afrokitchen-schema-blockers" content="missing_image">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools.com\/tools\/afrokitchen\/recipes\/fisherman-soup-ng\/">/);
  assert.match(html, /property="og:image" content="https:\/\/afrotools.com\/assets\/img\/kitchen-category-banner.webp"/);
});

test('a plated dish photo is not substituted for a missing preparation-step photo', () => {
  const schema = recipeSchema(page(recipe('jollof-rice-ng')));
  assert.ok(schema.image.every(image => image.includes('/assets/img/kitchen/jollof-rice-ng')));
  assert.ok(schema.recipeInstructions.length > 0);
  assert.ok(schema.recipeInstructions.every(step => !Object.hasOwn(step, 'image')));
});

test('an explicit preparation-step image is preserved without fetching it', () => {
  const item = recipe('jollof-rice-ng');
  item.steps[0].image_url = 'https://example.test/synthetic-preparation-step.png';
  const schema = recipeSchema(page(item));
  assert.equal(schema.recipeInstructions[0].image, item.steps[0].image_url);
});

test('missing recipe content keeps the existing noindex safeguard', () => {
  const item = recipe('jollof-rice-ng');
  item.ingredients = [];
  const html = page(item);
  assert.equal(recipeSchema(html), undefined);
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /content="missing_ingredients"/);
});
