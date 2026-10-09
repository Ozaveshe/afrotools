'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { applyReviewedManifest, overrides } = require('../scripts/lib/afrokitchen-method-corrections');
const { ROOT, loadAfroKitchenEngine, loadRecipeImages } = require('../scripts/lib/afrokitchen-static');
const { buildRecipePageHtml, refreshRecipeSchema } = require('../scripts/generate-afrokitchen-static-pages');
const { imageSize } = require('../scripts/lib/image-size');
const baseline = JSON.parse(cp.execFileSync('git', ['show', '1266694ee408bcc4ae9bf22e668688165e60c2e5:tools/afrokitchen/seo-manifest.json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
const manifest = applyReviewedManifest(baseline);
const saved = require('../tools/afrokitchen/seo-manifest.json');
const images = require('../data/image-generation/kitchen-method-corrections-2026-10-09.json').images;
const research = require('../data/afrokitchen/recipe-research-audit.json').recipes;

test('reviewed projection changes exactly nine recipes, preserving the other 401 and all route identities', () => {
  assert.equal(Object.keys(overrides).length, 9);
  assert.equal(manifest.recipes.length, 410);
  assert.equal(manifest.source.published_recipe_count, 410);
  assert.equal(manifest.source.verified_recipe_count, 401);
  assert.deepEqual(applyReviewedManifest(manifest), manifest);
  for (const original of baseline.recipes) {
    const next = manifest.recipes.find(recipe => recipe.slug === original.slug);
    for (const key of ['id', 'slug', 'route_path', 'country_route_path', 'country_code']) assert.equal(next[key], original[key]);
    if (!overrides[original.slug]) assert.deepEqual(next, original);
  }
});

for (const [slug, correction] of Object.entries(overrides)) test(`${slug}: published source adaptation has complete methods, unknown nutrition and testing disclosures`, () => {
  const recipe = manifest.recipes.find(recipe => recipe.slug === slug);
  const savedRecipe = saved.recipes.find(recipe => recipe.slug === slug);
  assert(savedRecipe, 'Reviewed recipe remains in the maintained manifest');
  // Other recipes and unrelated metadata can receive independent approved
  // updates. Validate the maintained correction without pinning the whole
  // current catalog to this historical preservation fixture.
  assert.deepEqual(savedRecipe.ingredients.map(item => [item.name, item.amount, item.unit, item.prep_note]), recipe.ingredients.map(item => [item.name, item.amount, item.unit, item.prep_note]));
  assert.deepEqual(savedRecipe.steps.map(step => [step.step_number, step.instruction, step.timer_seconds]), recipe.steps.map(step => [step.step_number, step.instruction, step.timer_seconds]));
  assert.equal(savedRecipe.is_published, true);
  assert.equal(savedRecipe.is_verified, false);
  assert.equal(savedRecipe.page_image, correction.image_url);
  assert.equal(savedRecipe.social_image, new URL(correction.image_url, 'https://afrotools.com').href);
  assert.equal(savedRecipe.source_reviewed_at, correction.reviewed_at);
  assert.equal(recipe.is_published, true);
  assert.equal(recipe.is_verified, false);
  for (const field of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'nutrition_basis']) assert.equal(recipe[field], null);
  assert.deepEqual(research[slug].sources, correction.sources);
  assert.equal(research[slug].reviewed_at, correction.reviewed_at);
  assert(!research[slug].static_recipe_patch);
  assert.deepEqual(recipe.steps.map(step => step.instruction), correction.steps.map(step => step.instruction));
  assert(!recipe.steps.some(step => /ferment loosely covered until lightly sour/i.test(step.instruction)));
  const html = buildRecipePageHtml(recipe, manifest, loadAfroKitchenEngine(), loadRecipeImages(), research);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.equal(schemas.find(schema => schema['@type'] === 'Recipe').dateModified, [correction.reviewed_at, recipe.updated_at?.slice(0, 10)].filter(Boolean).sort().at(-1));
  const recipeSchema = schemas.find(schema => schema['@type'] === 'Recipe');
  const staleSchemaHtml = html.replace('"dateModified":"' + recipeSchema.dateModified + '"', '"dateModified":"2000-01-01"');
  assert.notEqual(staleSchemaHtml, html);
  assert.equal(refreshRecipeSchema(staleSchemaHtml, recipeSchema, []), html, 'Native schema date refresh preserves all other page bytes');
  assert(html.includes('AfroTools has not kitchen-tested this version.'));
  for (const source of correction.sources) assert(html.includes(source.url.replace(/&/g, '&amp;')));
  const data = JSON.parse(html.match(/window\.__AK_STATIC_RECIPE = ([\s\S]*?);<\/script>/)[1]);
  assert.equal(data.method_review.reviewed_at, correction.reviewed_at);
  assert.deepEqual(data.steps, recipe.steps);
  for (const ingredient of correction.ingredients.filter(item => item.amount == null)) {
    assert(html.includes(ingredient.unit));
    assert.equal(recipe.ingredients.find(item => item.name === ingredient.name).amount, 0);
  }
  assert(!html.includes('"nutrition":'));
});

for (const artwork of images) test(`${artwork.slug}: accepted image bytes and dimensions match the provenance ledger`, () => {
  assert.match(artwork.alt, /illustration/i);
  for (const variant of artwork.variants) {
    const filename = path.join(ROOT, variant.path), bytes = fs.readFileSync(filename);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), variant.sha256);
    assert.deepEqual(imageSize(filename), { w: variant.width, h: variant.height });
    assert(bytes.length < (variant.width <= 640 ? 75000 : 200000));
  }
});
