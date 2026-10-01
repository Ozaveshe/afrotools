const test = require('node:test');
const assert = require('node:assert/strict');
const { loadAfroKitchenEngine } = require('../scripts/lib/afrokitchen-static');
const engine = loadAfroKitchenEngine();

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
