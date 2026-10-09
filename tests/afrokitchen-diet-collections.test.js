"use strict";
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildCuisineIntelligence, refreshDietaryCollectionData } = require('../scripts/lib/afrokitchen-cuisine-intelligence');
const { refreshCollectionDietLabels } = require('../scripts/generate-afrokitchen-static-pages');
const manifest = require('../tools/afrokitchen/seo-manifest.json');
const publicData = require('../tools/afrokitchen/cuisine-intelligence.json');

test('curated collection membership agrees with withdrawn tags and native ranking', () => {
  const intelligence = buildCuisineIntelligence(manifest);
  const result = refreshDietaryCollectionData(manifest, publicData, intelligence);
  for (const slug of ['ethiopian-fasting-table', 'vegetarian-african-classics']) {
    const collection = result.manifest.collections.find(row => row.slug === slug);
    assert.equal(collection.generated_recipe_slugs.includes('eritrean-ful'), false);
    assert.equal(collection.generated_recipe_slugs.includes('eritrean-shiro'), false);
    assert.deepEqual(manifest.collections.find(row => row.slug === slug), collection);
    assert.equal(collection.total_recipes, slug === 'ethiopian-fasting-table' ? 6 : 30);
    if (slug === 'vegetarian-african-classics') {
      assert.ok(collection.generated_recipe_slugs.includes('injera'));
      assert.ok(collection.generated_recipe_slugs.includes('shiro-wat-et'));
    }
  }
  assert.deepEqual(result.manifest, manifest);
  assert.deepEqual(result.publicData, publicData);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../tools/afrokitchen/cuisine-intelligence-data.js'), 'utf8'), context);
  assert.equal(JSON.stringify(context.window.AfroKitchenCuisineIntelligence), JSON.stringify(publicData));
});

test('derived refresh preserves dates, imagery and unrelated recipe content', () => {
  const saved = structuredClone(publicData);
  saved.generated_at = 'preserve-this-date';
  saved.recipes.injera.image.hero_src = '/accepted-picture.webp';
  saved.recipes.injera.chef_notes = ['Retain the editorial note'];
  saved.recipes.injera.curated_collections = [];
  const result = refreshDietaryCollectionData(manifest, saved, buildCuisineIntelligence(manifest));
  const expected = structuredClone(saved);
  expected.recipes.injera.curated_collections = publicData.recipes.injera.curated_collections;
  assert.deepEqual(result.publicData, expected);
  assert.deepEqual(saved.recipes.injera.curated_collections, []);
});

test('changed collection identity or editorial metadata fails before modifying inputs', () => {
  for (const field of ['id', 'description']) {
    const saved = structuredClone(manifest);
    saved.collections.find(row => row.slug === 'ethiopian-fasting-table')[field] = 'unreviewed-change';
    const original = structuredClone(saved);
    assert.throws(() => refreshDietaryCollectionData(saved, publicData, buildCuisineIntelligence(manifest)), /saved curated collection|collection metadata/);
    assert.deepEqual(saved, original);
  }
});

test('collection page refresh updates membership and counts while retaining existing card imagery and head assets', () => {
  const head = '<link rel="canonical" href="/collection/">' +
    '<meta name="description" content="2 dishes"><meta property="og:description" content="2 dishes"><meta name="twitter:description" content="2 dishes">' +
    '<script type="application/ld+json">{"@type":"ItemList","numberOfItems":2}</script>';
  const card = (slug, width) => '<a class="ak-static-recipe-card" href="/' + slug + '/"><img src="/' + slug + '.webp" width="' + width + '"></a>';
  const before = head + '<script src="/accepted.js"></script><div class="ak-page ak-collection-static-page"><p>2 dishes</p>' + card('kept', 800) + card('removed', 800) + '</div><afro-footer></afro-footer>';
  const generated = head.replaceAll('2 dishes', '1 dish').replace('"numberOfItems":2', '"numberOfItems":1') + '<div class="ak-page ak-collection-static-page"><p>1 dish</p>' + card('kept', 640) + '</div><afro-footer></afro-footer>';
  const expected = before.replaceAll('2 dishes', '1 dish').replace('"numberOfItems":2', '"numberOfItems":1').replace(card('removed', 800), '');
  assert.equal(refreshCollectionDietLabels(before, generated), expected);
  assert.equal(refreshCollectionDietLabels(expected, generated), expected);
  assert.throws(() => refreshCollectionDietLabels(before, generated.replace('/collection/', '/other/')), /identity changed/);
});
