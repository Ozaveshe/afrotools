'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
for (const file of ['engines/src/afrokitchen-engine.js', 'engines/afrokitchen-engine.js']) {
  let printed = '';
  const context = { window: { open: () => ({ document: { write: text => { printed = text; }, close() {} }, print() {} }) }, console, setTimeout, clearTimeout, setInterval, clearInterval };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  const engine = context.AfroKitchenEngine;
  test(file + ': unknown times stay absent from JSON and explicit in print, known zero stays valid', () => {
    const recipe = { name: 'Synthetic source-reviewed drink', slug: 'synthetic', default_servings: 4, prep_time_minutes: null, cook_time_minutes: null, ingredients: [{ name: 'Water', amount: 0, unit: 'as needed' }], steps: [] };
    const json = JSON.parse(JSON.stringify(engine.getStructuredData(recipe, 4)));
    for (const field of ['prepTime', 'cookTime', 'totalTime']) assert.equal(Object.hasOwn(json, field), false);
    assert.deepEqual(json.recipeIngredient, ['as needed Water']);
    engine.printRecipe(recipe, 4);
    assert.match(printed, /Unspecified prep/);
    assert.match(printed, /unspecified cook/);
    assert.doesNotMatch(printed, /null min|0 min|0 as needed/);
    const known = engine.getStructuredData({ ...recipe, prep_time_minutes: 0, cook_time_minutes: 10 }, 4);
    assert.equal(known.prepTime, 'PT0M'); assert.equal(known.cookTime, 'PT10M'); assert.equal(known.totalTime, 'PT10M');
    const partial = JSON.parse(JSON.stringify(engine.getStructuredData({ ...recipe, prep_time_minutes: 10 }, 4)));
    assert.equal(partial.prepTime, 'PT10M'); assert.equal(Object.hasOwn(partial, 'totalTime'), false);
  });
}
test('nullable-time migration only relaxes unknown-duration storage and does not rewrite recipes', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261012011500_afrokitchen_nullable_preparation_times.sql'), 'utf8');
  assert.match(sql, /ALTER COLUMN prep_time_minutes DROP NOT NULL/i);
  assert.match(sql, /ALTER COLUMN cook_time_minutes DROP NOT NULL/i);
  assert.doesNotMatch(sql, /\b(?:UPDATE|DELETE|INSERT|DROP TABLE)\b/i);
});
