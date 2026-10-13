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
const methodPolicy = require("../engines/src/afrokitchen-engine");
assert.equal(manifest.recipes.length, 410, "all canonical route identities are retained");
assert.equal(manifest.recipes.filter(methodPolicy.isMethodHeld).length, 8, "exact eight pending methods have status routes");
assert.ok(published.recipes.every(recipe => !methodPolicy.isMethodHeld(recipe)), "published cooking index excludes held methods");
assert.deepEqual(published, expected, "published index must match the static recipe route manifest");
assert.equal(published.recipes.length, 402);
assert.ok(published.recipes.every((recipe) => recipe.id && recipe.slug && recipe.ingredients.length));

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
  Date
};
vm.runInNewContext(source, context);

(async () => {
  const engine = context.AfroKitchenEngine;
  const all = await engine.fetchRecipes({});
  assert.equal(all.length, 402, "planner sees all available methods without held preparations or Supabase");
  assert.equal((await engine.fetchRecipes({ country: "NG" })).every((recipe) => recipe.country_code === "NG"), true);
  const chosen = all.find((recipe) => recipe.country_code === "NG");
  const collection = await engine.fetchRecipes({ ids: [chosen.id] });
  assert.equal(collection.length, 1, "collection ID filters must work on the published index");
  assert.equal(collection[0].id, chosen.id);
  assert.equal((await engine.fetchRecipes({ limit: 12 })).length, 12);
  assert.equal(fetchCount, 1, "the index should load only once per page");
  console.log("AfroKitchen published recipe index verified: 402 available methods, 410 routes retained, ingredients, filters");
})().catch((error) => { console.error(error); process.exitCode = 1; });
