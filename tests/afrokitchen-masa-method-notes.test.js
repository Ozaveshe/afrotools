"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCuisineIntelligence } = require("../scripts/lib/afrokitchen-cuisine-intelligence");
const rules = require("../data/afrokitchen/cuisine-intelligence-rules.json");
const manifest = require("../tools/afrokitchen/seo-manifest.json");
const researchAudit = require("../data/afrokitchen/recipe-research-audit.json").recipes;
const build = (selectedRules) => buildCuisineIntelligence(manifest, { rules: selectedRules, recipeImages: {}, researchAudit });

test("Masa method notes describe blended, fermented batter and a set cake", () => {
  const notes = build(rules).recipes["masa-waina-ng"].chef_notes;
  assert.match(notes.common_mistakes.join(" "), /blending it smooth/);
  assert.match(notes.readiness_cues.join(" "), /bubbly and slightly risen/);
  assert.match(notes.readiness_cues.join(" "), /no wet batter/);
  assert.doesNotMatch([...notes.common_mistakes, ...notes.readiness_cues].join(" "), /distinct|separate grains|coats the spoon|juicy/i);
});

test("recipe-specific method notes leave every other recipe and non-method advice unchanged", () => {
  const originalRules = structuredClone(rules);
  delete originalRules.recipe_notes;
  const before = build(originalRules);
  const after = build(rules);
  assert.ok(Object.keys(after.recipes).length >= 400);
  for (const slug of Object.keys(after.recipes)) {
    if (slug !== "masa-waina-ng") assert.deepEqual(after.recipes[slug].chef_notes, before.recipes[slug].chef_notes, slug);
  }
  const strip = ({common_mistakes, readiness_cues, ...rest}) => rest;
  assert.deepEqual(strip(after.recipes["masa-waina-ng"].chef_notes), strip(before.recipes["masa-waina-ng"].chef_notes));
});
