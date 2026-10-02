const test = require('node:test');
const assert = require('node:assert/strict');
const { loadAfroKitchenEngine } = require('../scripts/lib/afrokitchen-static');
const engine = loadAfroKitchenEngine();
const fs = require('node:fs');
const path = require('node:path');
const { refreshRecipeNutrition } = require('../scripts/generate-afrokitchen-static-pages');
const { validateNutritionSchema } = require('../scripts/validate-afrokitchen-recipe-jsonld');

test('legacy nutrition has an unverified basis and does not invent a portion or scale missing data', () => {
  const recipe = { default_servings: 6, calories: 380, protein_g: 0 };
  const result = engine.scaleNutrition(recipe, 7);
  assert.equal(result.calories, 380);
  assert.equal(result.basis, 'unverified');
  assert.equal(result.per_serving, null);
  assert.equal(result.protein_g, 0);
  assert.equal(result.fat_g, null);
  assert.match(engine.nutritionLabel(result, 7), /basis not recorded/);
});

test('explicit serving and batch bases preserve their meaning as ingredient quantities change', () => {
  const serving = engine.scaleNutrition({ default_servings: 6, calories: 380, nutrition_basis: 'per_serving' }, 7);
  assert.equal(serving.calories, 380);
  assert.match(engine.nutritionLabel(serving, 7), /per serving/);
  const batch = engine.scaleNutrition({ default_servings: 6, calories: 2280, nutrition_basis: 'batch' }, 7);
  assert.equal(batch.calories, 2660);
  assert.match(engine.nutritionLabel(batch, 7), /whole batch \(7 servings\)/);
});

test('blank and malformed nutrition never becomes a reported zero', () => {
  for (const invalid of [' ', false, [], {}, 'not reported', -1, NaN, Infinity]) {
    assert.equal(engine.scaleNutrition({ calories: invalid }, 4), null);
    const nutrition = engine.scaleNutrition({ calories: 380, protein_g: invalid }, 4);
    assert.equal(nutrition.protein_g, null);
  }
  assert.equal(engine.scaleNutrition({ calories: '0', protein_g: '0.0' }, 4).protein_g, 0);
});

test('recipe search metadata requires a documented portion basis and preserves missing versus zero', () => {
  const recipe = { name: 'Synthetic recipe', default_servings: 6, ingredients: [], calories: 380, protein_g: 0 };
  for (const basis of [undefined, null, 'estimated', '']) {
    assert.equal(engine.getStructuredData({ ...recipe, nutrition_basis: basis }).nutrition, undefined);
  }
  const schema = engine.getStructuredData({ ...recipe, nutrition_basis: 'per_serving' }, 4);
  assert.equal(schema.recipeYield, '4 servings');
  assert.equal(schema.nutrition.servingSize, '1 serving');
  assert.equal(schema.nutrition.calories, '380 calories');
  assert.equal(schema.nutrition.proteinContent, '0g');
  assert.equal(Object.hasOwn(schema.nutrition, 'fatContent'), false);
  assert.equal(engine.getStructuredData({ ...recipe, calories: 0, nutrition_basis: 'per_serving' }).nutrition.calories, '0 calories');
});

test('documented batch metadata is normalized to a serving and invalid yield stays unavailable', () => {
  const recipe = { name: 'Synthetic batch', default_servings: 6, ingredients: [], nutrition_basis: 'batch', calories: 2280, protein_g: 84 };
  for (const servings of [4, 7, 12]) {
    const schema = engine.getStructuredData(recipe, servings);
    assert.equal(schema.nutrition.calories, '380 calories');
    assert.equal(schema.nutrition.proteinContent, '14g');
    assert.equal(schema.recipeYield, servings + ' servings');
  }
  for (const default_servings of [0, -1, NaN, Infinity]) {
    assert.equal(engine.getStructuredData({ ...recipe, default_servings }).nutrition, undefined);
  }
});

test('nutrition refresh preserves all other recipe data and metadata and is idempotent', () => {
  const file = path.join(__dirname, '../tools/afrokitchen/recipes/amiwo-bj/index.html');
  const manifest = require('../tools/afrokitchen/seo-manifest.json');
  const recipe = { ...manifest.recipes.find(row => row.slug === 'amiwo-bj'), protein_g: 0, nutrition_basis: 'per_serving' };
  const original = fs.readFileSync(file, 'utf8');
  const payloadPattern = /(<script>window\.__AK_STATIC_RECIPE = )([\s\S]*?)(;<\/script>)/;
  const schemaPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const schemas = html => [...html.matchAll(schemaPattern)].map(match => JSON.parse(match[1]));
  const updated = refreshRecipeNutrition(original, recipe, engine);
  const before = JSON.parse(original.match(payloadPattern)[2]);
  const after = JSON.parse(updated.match(payloadPattern)[2]);
  assert.equal(after.protein_g, 0);
  assert.equal(after.nutrition_basis, 'per_serving');
  for (const key of ['nutrition_basis', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g']) { delete before[key]; delete after[key]; }
  assert.deepEqual(after, before);
  const beforeSchemas = schemas(original);
  const afterSchemas = schemas(updated);
  assert.equal(afterSchemas.find(row => row['@type'] === 'Recipe').nutrition.proteinContent, '0g');
  for (const row of beforeSchemas) delete row.nutrition;
  for (const row of afterSchemas) delete row.nutrition;
  assert.deepEqual(afterSchemas, beforeSchemas);
  assert.equal(refreshRecipeNutrition(updated, recipe, engine), updated);
  const unknown = refreshRecipeNutrition(updated, { ...recipe, nutrition_basis: undefined }, engine);
  assert.equal(schemas(unknown).find(row => row['@type'] === 'Recipe').nutrition, undefined);
  assert.match(unknown, /basis not recorded/);
});

test('page validator rejects invented portions, missing documented values and unknown macros shown as zero', () => {
  const recipe = { default_servings: 6, calories: 2280, nutrition_basis: 'batch', protein_g: 0 };
  const nutrition = { '@type': 'NutritionInformation', servingSize: '1 serving', calories: '380 calories', proteinContent: '0g' };
  assert.deepEqual(validateNutritionSchema(recipe, nutrition), []);
  assert.ok(validateNutritionSchema({ ...recipe, nutrition_basis: undefined }, nutrition).length);
  assert.ok(validateNutritionSchema(recipe, undefined).length);
  assert.ok(validateNutritionSchema(recipe, { ...nutrition, calories: '2280 calories' }).length);
  assert.ok(validateNutritionSchema(recipe, { ...nutrition, fatContent: '0g' }).length);
  assert.ok(validateNutritionSchema({ ...recipe, default_servings: 0 }, nutrition).length);
  assert.deepEqual(validateNutritionSchema({ default_servings: 6, calories: 380 }, undefined), []);
});
