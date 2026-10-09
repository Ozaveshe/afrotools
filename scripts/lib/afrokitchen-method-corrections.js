'use strict';
const overrides = require('../../data/afrokitchen/recipe-method-overrides.json');
const RECIPE_FIELDS = ['name', 'name_local', 'description', 'story', 'regional_variations', 'occasion', 'best_served_with', 'tags', 'diet_tags', 'default_servings', 'serving_unit', 'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes', 'difficulty', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'nutrition_basis', 'source', 'is_verified', 'is_published', 'image_url', 'image_alt'];

function applyReviewedMethod(recipe) {
  const correction = overrides[recipe.slug];
  if (!correction) return recipe;
  if (correction.is_verified !== false || correction.is_published !== true) throw new Error('Reviewed method must preserve publication without claiming verification: ' + recipe.slug);
  const next = { ...recipe };
  for (const field of RECIPE_FIELDS) if (Object.hasOwn(correction, field)) next[field] = correction[field];
  next.page_image = next.image_url;
  next.social_image = new URL(next.image_url, 'https://afrotools.com').href;
  next.image_credit = null;
  // The maintained review date describes this source correction separately
  // from the last live database update timestamp.
  next.source_reviewed_at = correction.reviewed_at;
  next.ingredients = correction.ingredients.map((item, index) => ({
    id: `method-${recipe.slug}-ingredient-${index + 1}`, recipe_id: recipe.id,
    ingredient_id: null, sort_order: (index + 1) * 10, group_name: null,
    unit: '', prep_note: null, is_optional: false, substitution: null, created_at: null,
    ...item,
    // The database's existing non-null numeric contract uses zero for an
    // unmeasured amount; the visible unit/note carries "to taste" or "as needed".
    amount: item.amount == null ? 0 : item.amount
  }));
  next.steps = correction.steps.map((item, index) => ({
    id: `method-${recipe.slug}-step-${index + 1}`, recipe_id: recipe.id,
    step_number: index + 1, timer_seconds: null, timer_label: null,
    tip: null, image_url: null, created_at: null, ...item
  }));
  next.media = (recipe.media || []).map(item => item.role === 'hero' ? {
    ...item, image_url: next.image_url, alt_text: next.image_alt,
    caption: recipe.slug === 'nthochi-bread-mw' ? 'Recipe illustration' : 'AI-generated recipe illustration',
    credit_text: 'AfroTools recipe illustration', credit_url: null, source_type: 'local_generated'
  } : item);
  return next;
}

function applyReviewedManifest(manifest) {
  const next = structuredClone(manifest);
  next.recipes = next.recipes.map(applyReviewedMethod);
  const bySlug = new Map(next.recipes.map(recipe => [recipe.slug, recipe]));
  for (const slug of Object.keys(overrides)) if (!bySlug.has(slug)) throw new Error('Reviewed public recipe missing from manifest: ' + slug);
  function refreshSummary(summary) {
    if (!overrides[summary.slug]) return summary;
    const recipe = bySlug.get(summary.slug), result = { ...summary };
    for (const key of Object.keys(result)) if (Object.hasOwn(recipe, key)) result[key] = recipe[key];
    return result;
  }
  for (const country of next.countries || []) country.recipes = (country.recipes || []).map(refreshSummary);
  for (const collection of next.collections || []) collection.recipes = (collection.recipes || []).map(refreshSummary);
  next.source.published_recipe_count = next.recipes.length;
  next.source.verified_recipe_count = next.recipes.filter(recipe => recipe.is_verified === true).length;
  if (next.wave.description === 'All verified recipes.') next.wave.description = 'All published recipes.';
  return next;
}

module.exports = { applyReviewedMethod, applyReviewedManifest, overrides };
