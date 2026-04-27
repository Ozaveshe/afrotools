#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BATCH_PATH = path.join(
  ROOT,
  "data",
  "afrokitchen",
  "recipe-expansion-batches",
  "2026-04-28-wave-1.json"
);
const AUDIT_PATH = path.join(ROOT, "data", "afrokitchen", "recipe-research-audit.json");
const SUPABASE_URL =
  process.env.SUPABASE_AUTH_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

function readFlag(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function requireText(recipe, field, errors) {
  if (!String(recipe[field] || "").trim()) {
    errors.push(`${recipe.slug || recipe.name || "recipe"} missing ${field}`);
  }
}

function validateBatch(batch) {
  const errors = [];
  const slugs = new Set();

  if (!batch || !Array.isArray(batch.recipes) || !batch.recipes.length) {
    errors.push("Batch must contain at least one recipe.");
    return errors;
  }

  batch.recipes.forEach((recipe) => {
    requireText(recipe, "slug", errors);
    requireText(recipe, "name", errors);
    requireText(recipe, "description", errors);
    requireText(recipe, "country_code", errors);
    requireText(recipe, "country_name", errors);
    requireText(recipe, "region", errors);
    requireText(recipe, "category", errors);
    requireText(recipe, "difficulty", errors);

    if (recipe.slug) {
      if (slugs.has(recipe.slug)) errors.push(`Duplicate slug in batch: ${recipe.slug}`);
      slugs.add(recipe.slug);
    }

    if (!Number.isInteger(recipe.prep_time_minutes) || recipe.prep_time_minutes < 0) {
      errors.push(`${recipe.slug} has invalid prep_time_minutes`);
    }
    if (!Number.isInteger(recipe.cook_time_minutes) || recipe.cook_time_minutes < 0) {
      errors.push(`${recipe.slug} has invalid cook_time_minutes`);
    }
    if (!Number.isInteger(recipe.default_servings) || recipe.default_servings < 1) {
      errors.push(`${recipe.slug} has invalid default_servings`);
    }

    if (!Array.isArray(recipe.sources) || recipe.sources.length < 2) {
      errors.push(`${recipe.slug} needs at least two source references.`);
    } else {
      recipe.sources.forEach((source, index) => {
        if (!String(source.title || "").trim() || !String(source.url || "").startsWith("http")) {
          errors.push(`${recipe.slug} source ${index + 1} must include title and URL.`);
        }
      });
    }

    if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
      errors.push(`${recipe.slug} needs ingredients.`);
    } else {
      recipe.ingredients.forEach((ingredient, index) => {
        if (!Number.isFinite(Number(ingredient.amount))) {
          errors.push(`${recipe.slug} ingredient ${index + 1} has a non-numeric amount.`);
        }
        if (!String(ingredient.unit || "").trim() && Number(ingredient.amount) > 0) {
          errors.push(`${recipe.slug} ingredient ${index + 1} needs a unit, or amount must be 0.`);
        }
        if (!String(ingredient.name || "").trim()) {
          errors.push(`${recipe.slug} ingredient ${index + 1} needs a name.`);
        }
      });
    }

    if (!Array.isArray(recipe.steps) || recipe.steps.length < 3) {
      errors.push(`${recipe.slug} needs at least three method steps.`);
    } else {
      const hasTimer = recipe.steps.some((step) => Number(step.timer_seconds || 0) > 0);
      if (!hasTimer) errors.push(`${recipe.slug} needs at least one step timer.`);
      recipe.steps.forEach((step, index) => {
        if (!String(step.title || "").trim()) {
          errors.push(`${recipe.slug} step ${index + 1} needs a title.`);
        }
        if (!String(step.instruction || "").trim()) {
          errors.push(`${recipe.slug} step ${index + 1} needs instructions.`);
        }
      });
    }
  });

  return errors;
}

function recipePayload(recipe) {
  return {
    slug: recipe.slug,
    name: recipe.name,
    name_local: recipe.name_local || null,
    description: recipe.description,
    country_code: recipe.country_code,
    country_name: recipe.country_name,
    region: recipe.region,
    ethnic_group: recipe.ethnic_group || null,
    category: recipe.category,
    tags: recipe.tags || [],
    diet_tags: recipe.diet_tags || [],
    prep_time_minutes: recipe.prep_time_minutes,
    cook_time_minutes: recipe.cook_time_minutes,
    difficulty: recipe.difficulty,
    default_servings: recipe.default_servings,
    serving_unit: recipe.serving_unit || "servings",
    story: recipe.story || null,
    occasion: recipe.occasion || null,
    best_served_with: recipe.best_served_with || null,
    regional_variations: recipe.regional_variations || null,
    image_url: recipe.image_url || null,
    image_alt: recipe.image_alt || (recipe.image_url ? `${recipe.name} recipe` : null),
    video_url: recipe.video_url || null,
    calories: recipe.calories || null,
    protein_g: recipe.protein_g || null,
    carbs_g: recipe.carbs_g || null,
    fat_g: recipe.fat_g || null,
    fiber_g: recipe.fiber_g || null,
    author: recipe.author || "AfroKitchen research desk",
    source: recipe.sources && recipe.sources[0] ? recipe.sources[0].url : null,
    is_verified: true,
    is_featured: Boolean(recipe.is_featured),
    updated_at: new Date().toISOString()
  };
}

function ingredientPayload(recipeId, ingredient, index) {
  return {
    recipe_id: recipeId,
    ingredient_id: null,
    sort_order: ingredient.sort_order || (index + 1) * 10,
    group_name: ingredient.group_name || null,
    amount: Number(ingredient.amount),
    unit: ingredient.unit || "",
    name: ingredient.name,
    prep_note: ingredient.prep_note || null,
    is_optional: Boolean(ingredient.is_optional),
    substitution: ingredient.substitution || null
  };
}

function stepPayload(recipeId, step, index) {
  return {
    recipe_id: recipeId,
    step_number: step.step_number || index + 1,
    title: step.title,
    instruction: step.instruction,
    timer_seconds: step.timer_seconds || null,
    timer_label: step.timer_label || null,
    tip: step.tip || null,
    image_url: step.image_url || null
  };
}

function mediaPayload(recipeId, media, index) {
  return {
    recipe_id: recipeId,
    sort_order: media.sort_order || (index + 1) * 10,
    role: media.role || (index === 0 ? "hero" : "gallery"),
    image_url: media.image_url,
    alt_text: media.alt_text || null,
    caption: media.caption || null,
    credit_text: media.credit_text || null,
    credit_url: media.credit_url || null,
    source_type: media.source_type || "generated",
    updated_at: new Date().toISOString()
  };
}

async function upsertRecipe(supabase, recipe) {
  const { data, error } = await supabase
    .from("recipes")
    .upsert(recipePayload(recipe), { onConflict: "slug" })
    .select("id, slug")
    .single();

  if (error) throw new Error(`${recipe.slug}: recipe upsert failed: ${error.message}`);
  const recipeId = data.id;

  for (const table of ["recipe_ingredients", "recipe_steps"]) {
    const { error: deleteError } = await supabase.from(table).delete().eq("recipe_id", recipeId);
    if (deleteError) throw new Error(`${recipe.slug}: ${table} cleanup failed: ${deleteError.message}`);
  }

  const ingredients = recipe.ingredients.map((ingredient, index) =>
    ingredientPayload(recipeId, ingredient, index)
  );
  const steps = recipe.steps.map((step, index) => stepPayload(recipeId, step, index));
  const replaceMedia = Array.isArray(recipe.media);
  const media = (recipe.media || [])
    .filter((item) => item && item.image_url)
    .map((item, index) => mediaPayload(recipeId, item, index));

  if (replaceMedia) {
    const { error: deleteMediaError } = await supabase
      .from("recipe_media")
      .delete()
      .eq("recipe_id", recipeId);
    if (deleteMediaError) {
      throw new Error(`${recipe.slug}: recipe_media cleanup failed: ${deleteMediaError.message}`);
    }
  }

  if (ingredients.length) {
    const { error: ingredientError } = await supabase.from("recipe_ingredients").insert(ingredients);
    if (ingredientError) {
      throw new Error(`${recipe.slug}: ingredient insert failed: ${ingredientError.message}`);
    }
  }

  if (steps.length) {
    const { error: stepError } = await supabase.from("recipe_steps").insert(steps);
    if (stepError) throw new Error(`${recipe.slug}: step insert failed: ${stepError.message}`);
  }

  if (replaceMedia && media.length) {
    const { error: mediaError } = await supabase.from("recipe_media").insert(media);
    if (mediaError) throw new Error(`${recipe.slug}: media insert failed: ${mediaError.message}`);
  }

  return { recipeId, slug: recipe.slug };
}

function mergeAuditEntries(batch) {
  const audit = fs.existsSync(AUDIT_PATH)
    ? readJson(AUDIT_PATH)
    : { version: 1, updated_at: "", notes: "", recipes: {} };
  audit.version = audit.version || 1;
  audit.updated_at = batch.reviewed_at || new Date().toISOString().slice(0, 10);
  audit.notes =
    audit.notes ||
    "Human-reviewed recipe source audit. Use this to separate culinary/source verification from static route eligibility.";
  audit.recipes = audit.recipes || {};

  batch.recipes.forEach((recipe) => {
    audit.recipes[recipe.slug] = {
      status: "audited",
      confidence: recipe.confidence || "medium",
      reviewed_at: batch.reviewed_at || new Date().toISOString().slice(0, 10),
      official_source_status:
        recipe.official_source_status ||
        "No official tourism or ministry recipe source was found in this batch pass. The recipe is synthesized from multiple culinary and reference sources.",
      review_summary: recipe.review_summary,
      recommended_changes: recipe.recommended_changes || [],
      sources: recipe.sources
    };
  });

  writeJson(AUDIT_PATH, audit);
}

async function main() {
  const batchPath = path.resolve(readFlag("--batch") || DEFAULT_BATCH_PATH);
  const dryRun = process.argv.includes("--dry-run");

  if (!SUPABASE_KEY && !dryRun) {
    throw new Error(
      "Missing SUPABASE_DATA_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY. Use --dry-run for validation only."
    );
  }

  const batch = readJson(batchPath);
  const errors = validateBatch(batch);
  if (errors.length) {
    throw new Error(`Expansion batch validation failed:\n- ${errors.join("\n- ")}`);
  }

  if (dryRun) {
    console.log(`Validated ${batch.recipes.length} recipes from ${path.relative(ROOT, batchPath)}.`);
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const imported = [];
  for (const recipe of batch.recipes) {
    imported.push(await upsertRecipe(supabase, recipe));
  }

  mergeAuditEntries(batch);

  console.log(`Imported ${imported.length} AfroKitchen recipes.`);
  console.log(imported.map((recipe) => `- ${recipe.slug}`).join("\n"));
  console.log("Updated local recipe research audit entries for imported recipes.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
