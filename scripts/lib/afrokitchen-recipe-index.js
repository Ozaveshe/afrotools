"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const attributedRecipes = require("../../engines/src/afrokitchen-engine");

const ROOT = path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(ROOT, "tools", "afrokitchen", "seo-manifest.json");
const INDEX_PATH = path.join(ROOT, "tools", "afrokitchen", "recipe-index.json");
const RECIPE_FIELDS = [
  "id", "slug", "name", "description", "country_code", "country_name",
  "region", "category", "tags", "diet_tags", "prep_time_minutes",
  "cook_time_minutes", "difficulty", "default_servings", "occasion",
  "is_featured", "view_count", "image_url", "is_published", "is_verified"
];
const KAPENTA_ID = '76572d95-eb8e-4c78-bbb6-ea754f61c758';
const KAPENTA_REVISION = 'kapenta-zambian-kitchen-20261016';
const CURATED_CONTENT_FIELDS = ['name','description','story','author','source','best_served_with','occasion','regional_variations','prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','serving_unit','yield_status','calories','protein_g','carbs_g','fat_g','fiber_g','diet_tags','image_url','image_alt','ingredients','steps','media'];

function projectCuratedDetail(recipe) {
  if (attributedRecipes.isPendingRecipeMethod(recipe)) return {
    method_review_status: recipe.method_review_status,
    method_review_revision: recipe.method_review_revision,
    yield_status: 'not-recorded',
    curated_detail: { id: recipe.id, slug: recipe.slug, method_review_status: recipe.method_review_status,
      fields: Object.fromEntries(CURATED_CONTENT_FIELDS.map(field => [field, recipe[field] ?? null])) }
  };
  if (attributedRecipes.isAttributedRecipe(recipe)) return { method_revision: recipe.method_revision, ...(recipe.yield_status === 'not-recorded' ? { yield_status: 'not-recorded' } : {}), curated_detail: { id: recipe.id, slug: recipe.slug, method_revision: recipe.method_revision, fields: Object.fromEntries(CURATED_CONTENT_FIELDS.map(field => [field, recipe[field] ?? null])) } };
  if (recipe.slug !== 'kapenta-stew-zm' || recipe.method_revision !== KAPENTA_REVISION) return {};
  if (recipe.id !== KAPENTA_ID || recipe.yield_status !== 'not-recorded' || recipe.default_servings !== null) throw new Error('Curated Kapenta identity/yield mismatch');
  return { method_revision: KAPENTA_REVISION, yield_status: 'not-recorded', curated_detail: {
    id: KAPENTA_ID, slug: recipe.slug, method_revision: KAPENTA_REVISION,
    fields: Object.fromEntries(CURATED_CONTENT_FIELDS.map(field => [field, recipe[field] ?? null]))
  } };
}

function buildRecipeIndex(manifest) {
  const recipes = (manifest.recipes || [])
    .filter((recipe) => recipe.generated_in_wave && recipe.is_published === true && recipe.is_verified === true)
    .map(recipe => { const projected = attributedRecipes.projectAttributedRecipe(recipe); if (!projected) throw new Error("Attributed index identity mismatch"); return projected; })
    .map((recipe) => ({
      ...Object.fromEntries(RECIPE_FIELDS.map((field) => [field, recipe[field] == null ? null : recipe[field]])),
      ...projectCuratedDetail(recipe),
      ingredients: (recipe.ingredients || []).map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit
      }))
    }))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) ||
      Number(b.view_count || 0) - Number(a.view_count || 0) || a.name.localeCompare(b.name));
  return { version: 2, generated_at: manifest.generated_at, recipes };
}

// Copy observed public eligibility only after an exact ID AND slug join. This
// does not infer publication from verification or authorize new recipe content.
function projectPublicationEvidence(manifest, snapshot, snapshotBytes) {
  if (snapshot.kind !== "CONFIGURED_AFROTOOLS_READONLY_PUBLIC_RECIPE_ELIGIBILITY_SNAPSHOT" ||
      snapshot.projectUrl !== "https://zpclagtgczsygrgztlts.supabase.co" ||
      snapshot.projectVerifiedBeforeQuery !== true || !Number.isFinite(Date.parse(snapshot.observedAt)) ||
      !Array.isArray(snapshot.records) || snapshot.count !== snapshot.records.length ||
      !Array.isArray(manifest.recipes) || manifest.recipes.length !== snapshot.count) {
    throw new Error("Invalid public eligibility snapshot");
  }
  const byId = new Map(), slugs = new Set();
  for (const row of snapshot.records) {
    if (!row.id || !row.slug || byId.has(row.id) || slugs.has(row.slug) ||
        typeof row.is_published !== "boolean" || typeof row.is_verified !== "boolean") {
      throw new Error("Invalid or duplicate eligibility identity");
    }
    byId.set(row.id, row); slugs.add(row.slug);
  }
  const result = structuredClone(manifest), joined = new Map(), seen = new Set();
  for (const recipe of result.recipes) {
    const row = byId.get(recipe.id);
    if (!row || row.slug !== recipe.slug || seen.has(recipe.id) ||
        (Object.hasOwn(recipe, "is_verified") && recipe.is_verified !== row.is_verified) ||
        (Object.hasOwn(recipe, "is_published") && recipe.is_published !== row.is_published)) {
      throw new Error("Eligibility identity or existing status differs: " + recipe.slug);
    }
    seen.add(recipe.id); joined.set(recipe.slug, row);
    recipe.is_published = row.is_published; recipe.is_verified = row.is_verified;
  }
  for (const group of [...(result.countries || []), ...(result.collections || [])]) {
    for (const recipe of group.recipes || []) {
      const row = joined.get(recipe.slug);
      if (!row || (recipe.id && recipe.id !== row.id)) throw new Error("Unknown recipe summary: " + recipe.slug);
      recipe.is_published = row.is_published; recipe.is_verified = row.is_verified;
    }
  }
  result.publication_evidence = {
    project: "zpclagtgczsygrgztlts", observed_at: snapshot.observedAt,
    snapshot_sha256: crypto.createHash("sha256").update(snapshotBytes).digest("hex"),
    exact_id_slug_count: seen.size,
  };
  return result;
}

function writeRecipeIndex(manifest, targetPath = INDEX_PATH) {
  if ((manifest.recipes || []).some(recipe => typeof recipe.is_published !== "boolean" || typeof recipe.is_verified !== "boolean")) {
    throw new Error("Publication flags missing; obtain explicit current eligibility before writing the public index");
  }
  const output = `${JSON.stringify(buildRecipeIndex(manifest))}\n`;
  if (!fs.existsSync(targetPath) || fs.readFileSync(targetPath, "utf8") !== output) {
    fs.writeFileSync(targetPath, output, "utf8");
  }
  return targetPath;
}

module.exports = { buildRecipeIndex, writeRecipeIndex, projectPublicationEvidence, MANIFEST_PATH, INDEX_PATH };
