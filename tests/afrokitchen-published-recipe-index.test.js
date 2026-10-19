"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildRecipeIndex } = require("../scripts/lib/afrokitchen-recipe-index");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "tools/afrokitchen/seo-manifest.json"), "utf8"));
const published = JSON.parse(fs.readFileSync(path.join(root, "tools/afrokitchen/recipe-index.json"), "utf8"));
const expected = buildRecipeIndex(manifest);
assert.deepEqual(published, expected, "published index must match the static recipe route manifest");
assert.equal(published.recipes.length, 410);
const engineSource = require('../engines/src/afrokitchen-engine');
assert.ok(published.recipes.every((recipe) => recipe.id && recipe.slug && (recipe.ingredients.length ||
  (engineSource.isPendingRecipeMethod(recipe) && recipe.method_review_status === 'pending-source-method' && recipe.yield_status === 'not-recorded'))));
assert.deepEqual(published.recipes.filter(recipe => engineSource.isPendingRecipeMethod(recipe)).map(recipe => [recipe.slug, recipe.id]).sort((a,b)=>a[0].localeCompare(b[0])), [
  ['ikivuguto-rw','f2850789-0ffd-41b3-bbaf-e3229132c9e6'],
  ['kisra-south-sudan-ss','c0aced74-68d6-437d-b00b-abd1895605f0'],
  ['kunu-zaki-ng','8a2bb743-87d9-462e-bc09-335e78f9584a'],
  ['maheu-zm','626fd465-87e1-4f93-bca7-747decbf63d0']
], 'only the exact four held identities may carry empty instructional ingredients');

const source = fs.readFileSync(path.join(root, "engines/src/afrokitchen-engine.js"), "utf8");
let fetchCount = 0;
const context = {
  window: {
    fetch: async (url) => {
      assert.equal(url, "/tools/afrokitchen/recipe-index.json");
      fetchCount += 1;
      return { ok: true, json: async () => published };
    }
  },
  console,
  Promise,
  Date,
  AbortController,
  setTimeout,
  clearTimeout
};
vm.runInNewContext(source, context);

(async () => {
  const engine = context.AfroKitchenEngine;
  const all = await engine.fetchRecipes({});
  assert.equal(all.length, 410, "planner should see every published recipe without Supabase");
  assert.equal((await engine.fetchRecipes({ country: "NG" })).every((recipe) => recipe.country_code === "NG"), true);
  const chosen = all.find((recipe) => recipe.country_code === "NG");
  const collection = await engine.fetchRecipes({ ids: [chosen.id] });
  assert.equal(collection.length, 1, "collection ID filters must work on the published index");
  assert.equal(collection[0].id, chosen.id);
  assert.equal((await engine.fetchRecipes({ limit: 12 })).length, 12);
  assert.equal(fetchCount, 1, "the index should load only once per page");
  console.log("AfroKitchen published recipe index verified: 410 routes, ingredients, filters");
})().catch((error) => { console.error(error); process.exitCode = 1; });
