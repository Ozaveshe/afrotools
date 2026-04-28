#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_WAVE_PATH = path.join(
  ROOT,
  "data",
  "afrokitchen",
  "recipe-review-waves",
  "2026-04-28-old-wave-2.json"
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

function validateWave(wave) {
  const errors = [];
  const seen = new Set();

  if (!wave || !Array.isArray(wave.recipes) || !wave.recipes.length) {
    return ["Review wave must include at least one recipe."];
  }

  wave.recipes.forEach((entry) => {
    if (!entry.slug) errors.push("A review entry is missing slug.");
    if (seen.has(entry.slug)) errors.push(`Duplicate review slug: ${entry.slug}`);
    seen.add(entry.slug);
    if (!entry.review_summary) errors.push(`${entry.slug} missing review_summary.`);
    if (!Array.isArray(entry.sources) || entry.sources.length < 2) {
      errors.push(`${entry.slug} needs at least two backstage sources.`);
    }
    (entry.sources || []).forEach((source, index) => {
      if (!String(source.title || "").trim() || !String(source.url || "").startsWith("http")) {
        errors.push(`${entry.slug} source ${index + 1} needs title and URL.`);
      }
    });

    const patch = entry.static_recipe_patch;
    if (!patch) return;

    if (patch.replace_ingredients && !Array.isArray(patch.replace_ingredients)) {
      errors.push(`${entry.slug} replace_ingredients must be an array.`);
    }
    if (patch.replace_steps && !Array.isArray(patch.replace_steps)) {
      errors.push(`${entry.slug} replace_steps must be an array.`);
    }
    (patch.replace_ingredients || []).forEach((ingredient, index) => {
      if (!Number.isFinite(Number(ingredient.amount))) {
        errors.push(`${entry.slug} replacement ingredient ${index + 1} needs numeric amount.`);
      }
      if (!String(ingredient.name || "").trim()) {
        errors.push(`${entry.slug} replacement ingredient ${index + 1} needs name.`);
      }
    });
    (patch.replace_steps || []).forEach((step, index) => {
      if (!String(step.title || "").trim() || !String(step.instruction || "").trim()) {
        errors.push(`${entry.slug} replacement step ${index + 1} needs title and instruction.`);
      }
    });
  });

  return errors;
}

function recipePatchPayload(patch) {
  const fields = patch && patch.recipe ? { ...patch.recipe } : {};
  delete fields.total_time_minutes;
  if (!Object.keys(fields).length) return null;
  fields.updated_at = new Date().toISOString();
  return fields;
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

function mergeAudit(wave) {
  const audit = fs.existsSync(AUDIT_PATH)
    ? readJson(AUDIT_PATH)
    : { version: 1, updated_at: "", notes: "", recipes: {} };
  audit.version = audit.version || 1;
  audit.updated_at = wave.reviewed_at || new Date().toISOString().slice(0, 10);
  audit.notes =
    audit.notes ||
    "Human-reviewed recipe source audit. Use this to separate culinary/source verification from static route eligibility.";
  audit.recipes = audit.recipes || {};

  wave.recipes.forEach((entry) => {
    audit.recipes[entry.slug] = {
      status: "audited",
      confidence: entry.confidence || "medium",
      reviewed_at: wave.reviewed_at || new Date().toISOString().slice(0, 10),
      official_source_status: entry.official_source_status || "",
      review_summary: entry.review_summary,
      recommended_changes: entry.recommended_changes || [],
      static_recipe_patch: entry.static_recipe_patch || undefined,
      sources: entry.sources
    };
  });

  writeJson(AUDIT_PATH, audit);
}

async function applyPatchToSupabase(supabase, entry) {
  const patch = entry.static_recipe_patch;
  if (!patch) return false;

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, slug")
    .eq("slug", entry.slug)
    .single();
  if (recipeError) throw new Error(`${entry.slug}: recipe lookup failed: ${recipeError.message}`);

  const recipePayload = recipePatchPayload(patch);
  if (recipePayload) {
    const { error } = await supabase.from("recipes").update(recipePayload).eq("id", recipe.id);
    if (error) throw new Error(`${entry.slug}: recipe update failed: ${error.message}`);
  }

  if (Array.isArray(patch.replace_ingredients)) {
    const { error: deleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipe.id);
    if (deleteError) throw new Error(`${entry.slug}: ingredient cleanup failed: ${deleteError.message}`);

    const ingredients = patch.replace_ingredients.map((ingredient, index) =>
      ingredientPayload(recipe.id, ingredient, index)
    );
    if (ingredients.length) {
      const { error } = await supabase.from("recipe_ingredients").insert(ingredients);
      if (error) throw new Error(`${entry.slug}: ingredient insert failed: ${error.message}`);
    }
  }

  if (Array.isArray(patch.replace_steps)) {
    const { error: deleteError } = await supabase.from("recipe_steps").delete().eq("recipe_id", recipe.id);
    if (deleteError) throw new Error(`${entry.slug}: step cleanup failed: ${deleteError.message}`);

    const steps = patch.replace_steps.map((step, index) => stepPayload(recipe.id, step, index));
    if (steps.length) {
      const { error } = await supabase.from("recipe_steps").insert(steps);
      if (error) throw new Error(`${entry.slug}: step insert failed: ${error.message}`);
    }
  }

  return true;
}

async function main() {
  const wavePath = path.resolve(readFlag("--wave") || DEFAULT_WAVE_PATH);
  const dryRun = process.argv.includes("--dry-run");
  const auditOnly = process.argv.includes("--audit-only");
  const wave = readJson(wavePath);
  const errors = validateWave(wave);
  if (errors.length) {
    throw new Error(`Review wave validation failed:\n- ${errors.join("\n- ")}`);
  }

  if (dryRun) {
    console.log(`Validated ${wave.recipes.length} review entries from ${path.relative(ROOT, wavePath)}.`);
    return;
  }

  mergeAudit(wave);

  let patched = 0;
  if (!auditOnly) {
    if (!SUPABASE_KEY) {
      throw new Error("Missing Supabase service role key. Use --audit-only to skip live DB updates.");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    for (const entry of wave.recipes) {
      if (await applyPatchToSupabase(supabase, entry)) patched += 1;
    }
  }

  console.log(`Merged ${wave.recipes.length} AfroKitchen review entries.`);
  console.log(`Updated ${patched} live Supabase recipe records.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
