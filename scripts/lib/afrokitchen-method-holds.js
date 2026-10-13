'use strict';
const policy = require('../../engines/src/afrokitchen-engine');

function pruneGroup(group) {
  if (!(group.recipes || []).some(recipe => policy.isMethodHeld(recipe))) return group;
  const recipes = group.recipes.filter(recipe => !policy.isMethodHeld(recipe));
  const next = { ...group, recipes, total_recipes: recipes.length,
    generated_recipe_count: recipes.filter(recipe => recipe.generated_in_wave).length,
    generated_recipe_slugs: recipes.filter(recipe => recipe.generated_in_wave).map(recipe => recipe.slug),
    top_recipe_names: recipes.slice(0, 3).map(recipe => recipe.name) };
  if (Object.hasOwn(group, 'featured_recipes')) next.featured_recipes = recipes.filter(recipe => recipe.is_featured).length;
  if (Array.isArray(group.related_countries)) {
    next.related_countries = group.related_countries.map(country => ({ ...country,
      recipe_count: recipes.filter(recipe => recipe.country_code === country.country_code).length
    })).filter(country => country.recipe_count > 0);
    next.country_count = next.related_countries.length;
  }
  if (group.country_code) next.description = `${group.country_name} recipes: ${recipes.length} dishes. Browse country context and practical cooking links.`;
  return next;
}

function applyHeldManifest(manifest) {
  const collections = (manifest.collections || []).map(pruneGroup);
  const bySlug = new Map(collections.map(collection => [collection.slug, collection]));
  const countries = (manifest.countries || []).map(pruneGroup).map(country => {
    const links = (country.related_collections || []).map(link => {
      const collection = bySlug.get(link.slug);
      if (!collection) return link;
      const count = collection.recipes.filter(recipe => recipe.country_code === country.country_code).length;
      return { ...link, total_recipes: collection.total_recipes, recipe_count: count };
    }).filter(link => link.recipe_count > 0);
    return { ...country, related_collections: links };
  });
  const recipes = (manifest.recipes || []).map(recipe => {
    if (policy.isMethodHeld(recipe)) return policy.applyMethodHold(recipe);
    return { ...recipe, collections: (recipe.collections || []).map(link => {
      const collection = bySlug.get(link.slug);
      return collection ? { ...link, total_recipes: collection.total_recipes } : link;
    }) };
  });
  return { ...manifest, recipes, countries, collections, source: { ...manifest.source,
    verified_recipe_count: recipes.filter(recipe => recipe.is_verified === true).length,
    method_hold_count: recipes.filter(recipe => policy.isMethodHeld(recipe)).length,
    collection_membership_count: collections.reduce((total, collection) => total + collection.total_recipes, 0)
  } };
}

module.exports = { applyHeldManifest, pruneGroup, isMethodHeld: policy.isMethodHeld,
  applyMethodHold: policy.applyMethodHold, METHOD_HOLD_SLUGS: policy.METHOD_HOLD_SLUGS,
  METHOD_HOLD_NOTICE: policy.METHOD_HOLD_NOTICE };
