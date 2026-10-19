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

// Exact admitted source records, not a general exception for missing generation history.
// Whole-row digests bind prompt/provenance/asset identities to accepted recipe8 d5416fb6.
const admittedHistoricalArtwork = Object.freeze({
  'kapenta-stew-zm': '2863c6bf4af058043f25fde68ec23618caecfebfbaf46e68a6ace006e0b4ff43',
  'koba-mg': '99da95992cce2e6ec8c38af58528c86e13ceb238c2102b656f3bce5937f72102',
  'ibihaza-rw': 'dc1357fb74371db1894ea28b9190ec3a80f77d36eb2769ca4a1b016dfda60e9a',
  'kat-kat-banane-sc': '81f462000fae91e9bdffe4c3a3cf560721bd174a0f6c416f73bca74c29dcc750'
});
const attributedArtworkCaptions = Object.freeze({
  'mandazi-tanzania-tz': 'AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.',
  'koba-mg': 'AI-generated serving illustration of the attributed small-parcel adaptation; not kitchen-tested photography.'
});


// Finite historical 1280 exceptions: literal byte identities, never derived from ledger metadata.
const legacy1280Artwork = Object.freeze({
  "octopus-curry-sc": {
    "path": "/assets/img/kitchen/responsive/octopus-curry-sc-1280.webp",
    "sha256": "e34b9e31285fe6467bf1ddc1d9e0b673cb657bf92b297615a45cc2d38246031e",
    "width": 1280,
    "height": 853
  },
  "kisra-south-sudan-ss": {
    "path": "/assets/img/kitchen/responsive/kisra-south-sudan-ss-1280.webp",
    "sha256": "2c30c6b981b17c7973f1fc2aa59a4d8f128d23f7be9d9b1602e1a107cbad0f15",
    "width": 1280,
    "height": 853
  },
  "maheu-zm": {
    "path": "/assets/img/kitchen/responsive/maheu-zm-1280.webp",
    "sha256": "e6c2738ac7bdb8852317906576815d24888cb685c0bf1433b64a5eb616991f8a",
    "width": 1280,
    "height": 853
  }
});

for (const artwork of ledger.images) {
  test(`${artwork.slug}: reviewed image hashes, dimensions and mobile byte budget`, () => {
    if (Object.hasOwn(admittedHistoricalArtwork, artwork.slug)) {
      assert.equal(crypto.createHash('sha256').update(JSON.stringify(artwork)).digest('hex'), admittedHistoricalArtwork[artwork.slug], 'exact accepted prompt/provenance/asset record');
      if (artwork.slug === 'kapenta-stew-zm') {
        assert.equal(artwork.prompt, null);
        assert.equal(artwork.source, 'saved AI-generated candidate');
        assert.equal(artwork.upstream_prompt_status, 'Generation transcript not established in this review; saved pixel/byte identity inspected');
        assert.equal(artwork.saved_asset_blobs.length, artwork.variants.length);
        for (const blob of artwork.saved_asset_blobs) assert.match(blob, /^[a-f0-9]{40}$/);
      } else {
        assert.ok(artwork.prompt.length > 200);
      }
    } else {
      assert.ok(artwork.prompt.length > 200);
      assert.equal(artwork.source, 'built-in image_gen');
    }
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
    if (Object.hasOwn(attributedArtworkCaptions, artwork.slug)) {
      assert.equal(artwork.caption, attributedArtworkCaptions[artwork.slug]);
      assert.ok(html.includes(attributedArtworkCaptions[artwork.slug]));
    } else {
      assert.ok(html.includes('AI-generated illustration'));
    }
    assert.ok(html.includes(`content="https://afrotools.com${artwork.target}"`));
    for (const variant of artwork.variants) assert.ok(html.includes(`${variant.path} ${variant.width}w`));
    const card = renderStaticRecipeCard(recipe, recipeImages);
    assert.ok(card.includes('loading="lazy"'));
    const fixed = Object.hasOwn(legacy1280Artwork, artwork.slug) ? legacy1280Artwork[artwork.slug] : { width: 1200, height: 800 };
    const primary = artwork.variants.find(row => row.path === artwork.target);
    assert.equal(primary.width, fixed.width); assert.equal(primary.height, fixed.height);
    if (Object.hasOwn(legacy1280Artwork, artwork.slug)) { assert.equal(primary.path, fixed.path); assert.equal(primary.sha256, fixed.sha256); }
    assert.ok(card.includes(`width="${fixed.width}" height="${fixed.height}"`));
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

test('the original 39 artwork rows remain unchanged and only four exact recoveries are added',()=>{
 assert.equal(ledger.images.length,43);assert.equal(crypto.createHash('sha256').update(JSON.stringify(ledger.images.slice(0,39))).digest('hex'),'7825f375bfa93bc9f374ae110bb8a2f0f217b0310754b2168392e71f6a581770');
 assert.deepEqual(ledger.images.slice(39).map(row=>row.slug).sort(),['kisra-south-sudan-ss','maheu-zm','mchemsho-tz','octopus-curry-sc']);
 assert.deepEqual(Object.keys(legacy1280Artwork).sort(),['kisra-south-sudan-ss','maheu-zm','octopus-curry-sc']);
});
