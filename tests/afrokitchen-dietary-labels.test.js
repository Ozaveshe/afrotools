"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const withdrawals = require("./fixtures/afrokitchen/reviewed-dietary-withdrawals.json");
const manifest = require("../tools/afrokitchen/seo-manifest.json");
const index = require("../tools/afrokitchen/recipe-index.json");
const root = path.resolve(__dirname, "..");

// Reviewed ingredient conflicts and unspecified variants, October 2026. These
// withdrawals do not certify other labels. A later recipe revision needs review.
test("reviewed dietary withdrawals survive index and embedded summary generation", () => {
  let summaries = 0;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (withdrawals[value.slug] && Array.isArray(value.diet_tags)) {
      for (const field of ["diet_tags", "tags"]) {
        for (const tag of withdrawals[value.slug]) {
          assert.ok(!(value[field] || []).includes(tag), `${value.slug}.${field} restored ${tag}`);
        }
      }
      summaries += 1;
    }
    Object.values(value).forEach(visit);
  }
  visit(manifest);
  assert.ok(summaries > Object.keys(withdrawals).length, "nested recipe summaries must be checked");
  for (const slug of Object.keys(withdrawals)) {
    assert.equal(index.recipes.filter(recipe => recipe.slug === slug).length, 1, `${slug} remains discoverable`);
  }
  visit(index);
});

test("native recipe metadata cannot regain a withdrawn claim through research overrides", () => {
  for (const [slug, removed] of Object.entries(withdrawals)) {
    const html = fs.readFileSync(path.join(root, "tools/afrokitchen/recipes", slug, "index.html"), "utf8");
    // Match the existing JSON-LD validator's script extraction, then parse JSON.
    const schemas = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(match => {
      const schema = JSON.parse(match[1]);
      return schema["@graph"] || [schema];
    });
    const recipe = schemas.find(schema => schema["@type"] === "Recipe");
    if (!recipe) {
      assert.match(html, /<meta\b(?=[^>]*name=["']afrokitchen-schema-blockers["'])(?=[^>]*content=["']missing_image["'])[^>]*>/i, slug);
      continue;
    }
    const keywords = String(recipe.keywords || "").split(",").map(value => value.trim().toLowerCase());
    for (const tag of removed) assert.ok(!keywords.includes(tag), `${slug} metadata restored ${tag}`);
    assert.ok(recipe.recipeIngredient.length && recipe.recipeInstructions.length, `${slug} retains cooking content`);
  }
});
