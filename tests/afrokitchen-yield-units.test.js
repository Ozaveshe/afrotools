'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const engine = require('../engines/src/afrokitchen-engine');
const { buildRecipeIndex } = require('../scripts/lib/afrokitchen-recipe-index');
const { renderStaticRecipeCard } = require('../scripts/generate-afrokitchen-static-pages');
const manifest = require('../tools/afrokitchen/seo-manifest.json');

test('Masa yields cakes and scales in cakes', () => {
  const masa = manifest.recipes.find(recipe => recipe.slug === 'masa-waina-ng');
  assert.equal(engine.formatRecipeYield(masa), '6 cakes');
  assert.equal(engine.formatRecipeYield(masa, 1), '1 cake');
  assert.equal(engine.formatRecipeYield(masa, 7), '7 cakes');
  assert.equal(engine.formatRecipeYield({ default_servings: 4, serving_unit: 'servings' }), 'Serves 4');
  assert.equal(engine.formatRecipeYield({ default_servings: null, yield_status: 'not-recorded' }), 'Not recorded');
});

test('unit-based recipe pages, cards and browse index agree with the recorded yield', () => {
  const index = new Map(buildRecipeIndex(manifest).recipes.map(recipe => [recipe.slug, recipe]));
  for (const recipe of manifest.recipes.filter(recipe => recipe.generated_in_wave && engine.hasUnitYield(recipe))) {
    const amount = engine.formatRecipeYield(recipe);
    const file = path.join(__dirname, '..', 'tools', 'afrokitchen', 'recipes', recipe.slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    assert.equal(schemas.find(schema => schema['@type'] === 'Recipe').recipeYield, amount, recipe.slug);
    assert.ok(html.includes('<div class="ak-stat-lbl">Yield</div><div class="ak-stat-val">' + amount + '</div>'), recipe.slug);
    assert.ok(renderStaticRecipeCard(recipe, {}).includes('<small>Yield</small><strong>' + amount + '</strong>'), recipe.slug);
    assert.equal(index.get(recipe.slug).serving_unit, recipe.serving_unit, recipe.slug);
  }
});
