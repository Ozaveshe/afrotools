'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROOT, loadManifest, loadAfroKitchenEngine, loadRecipeImages, resolveRecipeMedia } = require('../scripts/lib/afrokitchen-static');
const { buildRecipePageHtml, renderStaticRecipeCard, buildLegacyAliasPage, LEGACY_RECIPE_ALIASES } = require('../scripts/generate-afrokitchen-static-pages');
const { imageSize } = require('../scripts/lib/image-size');
const ledger = require('../data/image-generation/kitchen-generated-2026-10-09.json');
const manifest = loadManifest();
const engine = loadAfroKitchenEngine();
const recipeImages = loadRecipeImages();
const aliasLedger = require('../data/image-generation/recipe-image-aliases.json');
const importedArtwork = require('../data/image-generation/kitchen-imported-2026-10-09.json').images;

for (const artwork of importedArtwork) {
  test(`${artwork.slug}: imported artwork stays responsive and keeps unknown generation history explicit`, () => {
    assert.equal(artwork.original_prompt, null);
    assert.match(artwork.source_sha256, /^[a-f0-9]{64}$/);
    for (const variant of artwork.variants) {
      const file = path.join(ROOT, variant.path), bytes = fs.readFileSync(file);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), variant.sha256);
      assert.deepEqual(imageSize(file), { w: variant.width, h: variant.height });
      assert.ok(bytes.length < (variant.width <= 640 ? 75000 : 200000));
    }
    const recipe = manifest.recipes.find(row => row.slug === artwork.slug);
    const html = buildRecipePageHtml(recipe, manifest, engine, recipeImages, {});
    assert.equal(resolveRecipeMedia(recipe, recipeImages).pageImage, artwork.path);
    assert.ok(html.includes(artwork.alt));
    assert.ok(html.includes('Recipe illustration'));
    assert.ok(!html.includes('AI-generated illustration'));
    for (const variant of artwork.variants) assert.ok(html.includes(`${variant.path} ${variant.width}w`));
    const card = renderStaticRecipeCard(recipe, recipeImages);
    assert.ok(card.includes('srcset='));
    assert.ok(card.includes(artwork.alt));
  });
}

for (const artwork of ledger.images) {
  test(`${artwork.slug}: reviewed image hashes, dimensions and mobile byte budget`, () => {
    assert.ok(artwork.prompt.length > 200);
    assert.equal(artwork.source, 'built-in image_gen');
    for (const variant of artwork.variants) {
      const file = path.join(ROOT, variant.path);
      const bytes = fs.readFileSync(file);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), variant.sha256);
      assert.deepEqual(imageSize(file), { w: variant.width, h: variant.height });
      assert.ok(bytes.length < (variant.width <= 640 ? 75000 : 200000));
    }
  });
  test(`${artwork.slug}: recipe and card use responsive artwork with honest labels`, () => {
    const recipe = manifest.recipes.find(row => row.slug === artwork.slug);
    const html = buildRecipePageHtml(recipe, manifest, engine, recipeImages, {});
    assert.ok(html.includes(artwork.alt));
    assert.ok(html.includes('AI-generated illustration'));
    assert.ok(html.includes(`content="https://afrotools.com${artwork.target}"`));
    for (const variant of artwork.variants) assert.ok(html.includes(`${variant.path} ${variant.width}w`));
    const card = renderStaticRecipeCard(recipe, recipeImages);
    assert.ok(card.includes('loading="lazy"'));
    assert.ok(card.includes('width="1200" height="800"'));
    assert.ok(card.includes('srcset='));
    assert.ok(card.includes(artwork.alt));
  });
}
for (const artwork of aliasLedger.hero_reviews || []) {
  test(`${artwork.slug}: reviewed secondary artwork becomes the same-recipe hero without invented provenance`, () => {
    const recipe = manifest.recipes.find(row => row.slug === artwork.slug);
    const bytes = fs.readFileSync(path.join(ROOT, artwork.path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), artwork.sha256);
    assert.deepEqual(imageSize(path.join(ROOT, artwork.path)), { w: artwork.width, h: artwork.height });
    assert.equal(artwork.path, `/assets/img/kitchen/${aliasLedger.aliases[artwork.slug]}.webp`);
    assert.equal(artwork.original_prompt, null);
    assert.equal(resolveRecipeMedia(recipe, recipeImages).pageImage, artwork.path);
    const html = buildRecipePageHtml(recipe, manifest, engine, recipeImages, {});
    assert.ok(html.includes(`content="https://afrotools.com${artwork.path}"`));
    assert.ok(html.includes(artwork.alt));
    assert.ok(html.includes('Recipe illustration'));
    assert.ok(!html.includes('AI-generated illustration'));
    const gallery = html.match(/<section class="ak-photo-gallery"[\s\S]*?<\/section>/)?.[0] || '';
    assert.equal((gallery.match(new RegExp(`src="${artwork.path}"`, 'g')) || []).length, 1, 'Gallery must not duplicate the promoted secondary image');
    const cover = html.match(/<img class="ak-cookbook-cover-photo"[^>]*>/)?.[0] || '';
    assert.ok(cover.includes(artwork.alt));
    assert.ok(cover.includes(`width="${artwork.width}" height="${artwork.height}"`));
    const card = renderStaticRecipeCard(recipe, recipeImages);
    assert.ok(card.includes(`src="${artwork.path}"`));
    assert.ok(card.includes(`width="${artwork.width}" height="${artwork.height}"`));
  });
}
test('existing unregistered recipe artwork gets no generated-image claim', () => {
  const recipe = manifest.recipes.find(row => row.slug === 'jollof-rice-ng');
  const html = buildRecipePageHtml(recipe, manifest, engine, recipeImages, {});
  assert.ok(!html.includes('AI-generated illustration'));
  assert.ok(!html.includes('Recipe illustration'));
});

test('legacy Waakye navigation reaches the existing illustrated recipe without inventing shell imagery', () => {
  const alias = LEGACY_RECIPE_ALIASES.find(row => row.legacySlug === 'ghanaian-waakye');
  const target = manifest.recipes.find(row => row.slug === alias.targetRecipeSlug);
  assert.equal(target.slug, 'waakye-gh');
  assert.ok(resolveRecipeMedia(target, recipeImages).pageImage);
  const html = buildLegacyAliasPage(alias, manifest);
  assert.ok(html.includes(`content="0;url=${target.route_path}"`));
  assert.ok(html.includes(`href="${target.route_path}"`));
  assert.ok(html.includes('content="noindex, follow"'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('"@type":"Recipe"'));
});
