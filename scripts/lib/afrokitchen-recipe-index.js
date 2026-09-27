"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(ROOT, "tools", "afrokitchen", "seo-manifest.json");
const INDEX_PATH = path.join(ROOT, "tools", "afrokitchen", "recipe-index.json");
const RECIPE_FIELDS = [
  "id", "slug", "name", "description", "country_code", "country_name",
  "region", "category", "tags", "diet_tags", "prep_time_minutes",
  "cook_time_minutes", "difficulty", "default_servings", "occasion",
  "is_featured", "view_count", "image_url"
];

function buildRecipeIndex(manifest) {
  const recipes = (manifest.recipes || [])
    .filter((recipe) => recipe.generated_in_wave && recipe.is_verified)
    .map((recipe) => ({
      ...Object.fromEntries(RECIPE_FIELDS.map((field) => [field, recipe[field] == null ? null : recipe[field]])),
      ingredients: (recipe.ingredients || []).map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit
      }))
    }))
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) ||
      Number(b.view_count || 0) - Number(a.view_count || 0) || a.name.localeCompare(b.name));
  return { version: 1, generated_at: manifest.generated_at, recipes };
}

function writeRecipeIndex(manifest, targetPath = INDEX_PATH) {
  const output = `${JSON.stringify(buildRecipeIndex(manifest))}\n`;
  if (!fs.existsSync(targetPath) || fs.readFileSync(targetPath, "utf8") !== output) {
    fs.writeFileSync(targetPath, output, "utf8");
  }
  return targetPath;
}

module.exports = { buildRecipeIndex, writeRecipeIndex, MANIFEST_PATH, INDEX_PATH };
