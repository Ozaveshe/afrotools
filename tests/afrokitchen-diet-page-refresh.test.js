"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { refreshRecipeDietLabels } = require("../scripts/generate-afrokitchen-static-pages");

const schema = keywords => '<script type="application/ld+json">' + JSON.stringify({ "@type": "Recipe", name: "Synthetic dish", image: ["/approved.webp"], keywords }) + '</script>';
const diet = value => '<span><svg class="ak-icon"><path d="M0 0"></path></svg><span><small>Diet</small><strong>' + value + '</strong></span></span>';
const card = (value, width = 800) => '<a class="ak-static-recipe-card" href="/tools/afrokitchen/recipes/synthetic-dish/"><img src="/approved.webp" width="' + width + '"><span class="ak-static-recipe-card-meta"><span><svg><path d="M1 1"></path></svg><span><small>Time</small><strong>20 min</strong></span></span>' + (value ? diet(value) : '') + '</span></a>';

test("diet refresh preserves image markup, head order, other metadata and repeatability", () => {
  const before = '<head><meta name="keep" content="yes">' + schema("beans, vegan, gluten-free") + '</head>' + card("Vegan");
  const generated = '<head>' + schema("beans, gluten-free") + '</head><img class="extra-cover" src="/different.webp">' + card("Gluten Free", 640);
  const expected = before.replace('beans, vegan, gluten-free', 'beans, gluten-free').replace(diet("Vegan"), diet("Gluten Free"));
  assert.equal(refreshRecipeDietLabels(before, generated), expected);
  assert.equal(refreshRecipeDietLabels(expected, generated), expected);
});

test("removing the last diet label preserves neighbouring time metadata", () => {
  const before = schema("beans, dairy-free") + card("Dairy Free");
  const after = schema("beans") + card("");
  assert.equal(refreshRecipeDietLabels(before, after), after);
});

test("recipe content, image, keyword additions and reorderings require a separate review", () => {
  const before = schema("beans, vegan, gluten-free") + card("Vegan");
  for (const generated of [
    before.replace('/approved.webp', '/new.webp'),
    before.replace('Synthetic dish', 'Different dish'),
    before.replace('beans, vegan, gluten-free', 'beans, nut-free'),
    before.replace('beans, vegan, gluten-free', 'gluten-free, beans')
  ]) assert.throws(() => refreshRecipeDietLabels(before, generated), /cannot change|only permits/);
});

test("missing or duplicated schemas and missing cards abort the refresh", () => {
  const before = schema("beans") + card("Vegan");
  assert.throws(() => refreshRecipeDietLabels(before, card("Vegan")), /cannot remove Recipe/);
  assert.throws(() => refreshRecipeDietLabels(before, schema("beans") + before), /Duplicate Recipe/);
  assert.throws(() => refreshRecipeDietLabels(before, schema("beans")), /cannot remove a recipe card/);
  assert.throws(() => refreshRecipeDietLabels(schema("beans") + card(""), before), /cannot add/);
});

test("derived collection links update without changing adjacent page content", () => {
  const block = href => '<div class="ak-intel-mini"><strong>Collections to keep cooking</strong><div class="ak-intel-links"><a href="' + href + '">Continue</a></div></div>';
  const before = '<p>Keep this</p>' + block('/vegan/');
  const generated = '<p>Unrelated changed prose</p>' + block('/country/');
  assert.equal(refreshRecipeDietLabels(before, generated), '<p>Keep this</p>' + block('/country/'));
});
