"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { refreshRecipeDietTags } = require("../scripts/export-afrokitchen-seo-manifest");

function fixtures() {
  const recipe = {
    id: "recipe-one", slug: "reviewed-dish", diet_tags: ["vegan", "gluten-free", "dairy-free"],
    tags: ["stew", "vegan"], ingredients: [{ name: "oil or butter", is_optional: false }],
    image_url: "/approved-image.webp", updated_at: "2026-01-01"
  };
  const saved = {
    generated_at: "2026-01-01", recipes: [recipe, { ...recipe, id: "recipe-two", slug: "other-dish" }],
    countries: [{ recipes: [{ slug: recipe.slug, diet_tags: [...recipe.diet_tags], description: "Retain this" }] }],
    collections: [{ recipes: [structuredClone(recipe)] }]
  };
  const live = structuredClone(saved);
  Object.assign(live.recipes[0], {
    diet_tags: ["gluten-free"], tags: ["stew"], image_url: "/unreviewed-image.webp", updated_at: "2026-10-09"
  });
  return { saved, live };
}

test("reviewed removals reach every summary and preserve unrelated live fields and inputs", () => {
  const { saved, live } = fixtures();
  const original = structuredClone(saved);
  const result = refreshRecipeDietTags(saved, live, ["reviewed-dish"]);
  assert.deepEqual(result.changedSlugs, ["reviewed-dish"]);
  assert.equal(result.updatedCopies, 3);
  const expected = structuredClone(saved);
  for (const row of [expected.recipes[0], expected.countries[0].recipes[0], expected.collections[0].recipes[0]]) {
    row.diet_tags = ["gluten-free"];
    if (row.tags) row.tags = ["stew"];
  }
  assert.deepEqual(result.manifest, expected);
  assert.deepEqual(saved, original);
  const repeated = refreshRecipeDietTags(result.manifest, live, ["reviewed-dish"]);
  assert.deepEqual(repeated.manifest, expected);
  assert.deepEqual(repeated.changedSlugs, []);
  assert.equal(repeated.updatedCopies, 0);
});

test("changed identity or ingredients require a new content review", () => {
  for (const change of [row => { row.id = "different"; }, row => { row.ingredients[0].is_optional = true; }]) {
    const { saved, live } = fixtures();
    change(live.recipes[0]);
    assert.throws(() => refreshRecipeDietTags(saved, live, ["reviewed-dish"]), /identity changed|ingredients changed/);
  }
});

test("tag additions and reordering cannot enter through a removal-only refresh", () => {
  for (const tags of [["gluten-free", "nut-free"], ["dairy-free", "vegan"]]) {
    const { saved, live } = fixtures();
    live.recipes[0].diet_tags = tags;
    assert.throws(() => refreshRecipeDietTags(saved, live, ["reviewed-dish"]), /only permits ordered removals/);
  }
});

test("stale embedded summaries abort without changing the saved manifest", () => {
  const { saved, live } = fixtures();
  saved.collections[0].recipes[0].tags.push("separate-review");
  const original = structuredClone(saved);
  assert.throws(() => refreshRecipeDietTags(saved, live, ["reviewed-dish"]), /summary tags differ/);
  assert.deepEqual(saved, original);
});

test("empty, repeated, invalid or unknown slugs cannot silently broaden the refresh", () => {
  const { saved, live } = fixtures();
  for (const slugs of [[], ["reviewed-dish", "reviewed-dish"], ["../reviewed-dish"], ["unknown-dish"]]) {
    assert.throws(() => refreshRecipeDietTags(saved, live, slugs), /unique recipe slugs|identity changed/);
  }
});
