#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  TOOL_DIR,
  RECIPES_DIR,
  COUNTRIES_DIR,
  COLLECTIONS_DIR,
  MANIFEST_PATH,
  DEFAULT_WAVE_STRATEGY,
  SITE_ORIGIN,
  TOOL_OG_IMAGE,
  RECIPE_FALLBACK_IMAGE,
  RECIPE_FALLBACK_OG_IMAGE,
  escapeHtml,
  safeJson,
  ensureDir,
  writeTextFileSync,
  excerpt,
  humanList,
  slugify,
  countryUrl,
  loadAfroKitchenEngine,
  loadRecipeImages,
  resolveRecipeMedia,
  isGenericRecipeImage,
  isUsableRecipeImage,
  buildManifest,
  writeManifest,
  writeStaticRoutes
} = require("./lib/afrokitchen-static");
const {
  buildCuisineIntelligence,
  writeCuisineIntelligenceFiles,
  mergeIntelligenceCollections
} = require("./lib/afrokitchen-cuisine-intelligence");

const LANDING_PATH = path.join(TOOL_DIR, "index.html");
const RECIPE_RESEARCH_AUDIT_PATH = path.join(ROOT, "data", "afrokitchen", "recipe-research-audit.json");
const AK_FONT_HREF = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&display=swap";
const LEGACY_RECIPE_ALIASES = [
  {
    legacySlug: "nigerian-jollof-rice",
    targetRecipeSlug: "jollof-rice-ng",
    reason: "This older link now opens the richer Nigerian Jollof Rice recipe."
  },
  {
    legacySlug: "ethiopian-doro-wat",
    targetRecipeSlug: "doro-wat",
    reason: "This older link now opens the richer Doro Wat recipe."
  },
  {
    legacySlug: "egyptian-koshari",
    targetRecipeSlug: "koshari-eg",
    reason: "This older link now opens the richer Koshari recipe."
  },
  {
    legacySlug: "moroccan-chicken-tagine",
    targetRecipeSlug: "chicken-tagine-preserved-lemons-ma",
    reason: "This older link now opens the richer Moroccan chicken tagine recipe."
  },
  {
    legacySlug: "ugali-sukuma-wiki",
    targetRecipeSlug: "ugali-na-sukuma-wiki",
    reason: "This older link now opens the richer Ugali na Sukuma Wiki recipe."
  },
  {
    legacySlug: "ghanaian-waakye",
    targetCountryCode: "GH",
    reason: "This older Waakye link now sends you to the Ghana cuisine hub while the dedicated recipe is being prepared."
  },
  {
    legacySlug: "dovi",
    targetRecipeSlug: "dovi-zw",
    reason: "This older Dovi link now opens the richer Zimbabwe Dovi recipe."
  }
];
const RECIPE_TITLE_QUALIFIERS = {
  "bamia-south-sudan-ss": "Okra and Lamb",
  "caldo-chabeu-gw": "Palm Fruit Stew",
  "caldo-mancarra-gw": "Peanut Stew",
  "chikanda-zm": "Peanut Snack",
  "dholl-puri-mu": "Split Pea Flatbread",
  "fah-fah-dj": "Goat Soup",
  "fouti-guinea-gn": "Fonio Porridge",
  "groundnut-stew-sierra-leone-sl": "Rice Stew",
  "isombe-rw": "Cassava Leaf Stew",
  "kondowole-mw": "Cassava Starch",
  "ladob-sc": "Coconut Plantain Dessert",
  "langouste-vanille-km": "Vanilla Seafood",
  "matapa-mz": "Cassava Leaf Seafood Stew"
};

function readFlag(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1 || index === process.argv.length - 1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function categoryLabel(recipe) {
  const labels = {
    main: "Main dish",
    stew: "Stew",
    soup: "Soup",
    sauce: "Sauce",
    soup_stew: "Soup or stew",
    rice: "Rice dish",
    snack: "Snack",
    dessert: "Dessert",
    drink: "Drink",
    breakfast: "Breakfast",
    side: "Side",
    street_food: "Street food",
    starter: "Starter"
  };
  return labels[recipe.category] || "Recipe";
}

function recipeSeoName(recipe) {
  const qualifier = RECIPE_TITLE_QUALIFIERS[recipe.slug];
  return qualifier ? `${recipe.name} (${qualifier})` : recipe.name;
}

function loadRecipeResearchAudit() {
  if (!fs.existsSync(RECIPE_RESEARCH_AUDIT_PATH)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(RECIPE_RESEARCH_AUDIT_PATH, "utf8"));
    return parsed && parsed.recipes ? parsed.recipes : {};
  } catch (error) {
    console.warn("Unable to parse AfroKitchen recipe research audit.", error.message);
    return {};
  }
}

function applyRecipeResearchPatch(recipe, researchAudit) {
  const entry = researchAudit && researchAudit[recipe.slug];
  const patch = entry && entry.static_recipe_patch;
  if (!patch) return recipe;

  const next = {
    ...recipe,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.slice() : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps.slice() : []
  };

  if (patch.recipe && typeof patch.recipe === "object") {
    Object.assign(next, patch.recipe);
  }

  if (Array.isArray(patch.replace_ingredients)) {
    next.ingredients = patch.replace_ingredients.map((ingredient, index) => ({
      id: `research-${recipe.slug}-replace-ingredient-${index + 1}`,
      recipe_id: recipe.id,
      ingredient_id: null,
      sort_order: ingredient.sort_order || (index + 1) * 10,
      group_name: null,
      amount: 0,
      unit: "",
      name: "",
      prep_note: null,
      is_optional: false,
      substitution: null,
      created_at: null,
      ...ingredient
    }));
  }

  if (Array.isArray(patch.replace_steps)) {
    next.steps = patch.replace_steps.map((step, index) => ({
      id: `research-${recipe.slug}-replace-step-${index + 1}`,
      recipe_id: recipe.id,
      step_number: step.step_number || index + 1,
      title: "",
      instruction: "",
      timer_seconds: null,
      timer_label: null,
      tip: null,
      image_url: null,
      created_at: null,
      ...step
    }));
  }

  if (Array.isArray(patch.update_ingredients)) {
    patch.update_ingredients.forEach((update) => {
      const index = next.ingredients.findIndex((ingredient) => {
        if (update.id && ingredient.id === update.id) return true;
        if (update.sort_order && ingredient.sort_order === update.sort_order) return true;
        if (update.name && ingredient.name === update.name) return true;
        return false;
      });
      if (index === -1) return;
      next.ingredients[index] = {
        ...next.ingredients[index],
        ...(update.fields || {})
      };
    });
  }

  if (Array.isArray(patch.update_steps)) {
    patch.update_steps.forEach((update) => {
      const index = next.steps.findIndex((step) => {
        if (update.id && step.id === update.id) return true;
        if (update.step_number && step.step_number === update.step_number) return true;
        if (update.title && step.title === update.title) return true;
        return false;
      });
      if (index === -1) return;
      next.steps[index] = {
        ...next.steps[index],
        ...(update.fields || {})
      };
    });
  }

  if (Array.isArray(patch.append_ingredients)) {
    patch.append_ingredients.forEach((ingredient, index) => {
      next.ingredients.push({
        id: `research-${recipe.slug}-${index + 1}`,
        recipe_id: recipe.id,
        ingredient_id: null,
        is_optional: false,
        substitution: null,
        created_at: null,
        ...ingredient
      });
    });
    next.ingredients.sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0));
  }

  return next;
}

function cleanGeneratedCopyText(value) {
  return String(value || "")
    .replace(/\bfills a real AfroKitchen gap\b/gi, "adds practical cooking context")
    .replace(/\ba table built around\b/gi, "served with")
    .replace(/\btable built around\b/gi, "served with")
    .replace(/\bbuilt around\b/gi, "made with")
    .replace(/\bserving logic of\b/gi, "served with")
    .replace(/\ba Eswatini\b/g, "an Eswatini")
    .replace(/\bverified ([A-Z][A-Za-z -]+) dish in the AfroKitchen archive\b/g, "structured $1 dish in the AfroKitchen archive");
}

function cleanPatchedRecipeCopy(recipe) {
  return {
    ...recipe,
    description: cleanGeneratedCopyText(recipe.description),
    story: cleanGeneratedCopyText(recipe.story),
    occasion: cleanGeneratedCopyText(recipe.occasion),
    best_served_with: cleanGeneratedCopyText(recipe.best_served_with),
    regional_variations: cleanGeneratedCopyText(recipe.regional_variations),
    image_alt: cleanGeneratedCopyText(recipe.image_alt)
  };
}

function renderIngredientsHtml(engine, recipe, servings) {
  const ingredients = engine.scaleIngredients(
    recipe.ingredients || [],
    recipe.default_servings || 1,
    servings
  );
  let currentGroup = "";
  let html = "";

  ingredients.forEach((ingredient) => {
    if (ingredient.group_name && ingredient.group_name !== currentGroup) {
      currentGroup = ingredient.group_name;
      html += `<div class="ak-ing-group">${escapeHtml(currentGroup)}</div>`;
    }

    const hasAmount = Number(ingredient.scaled_amount || 0) > 0;
    const amountHtml = hasAmount
      ? `<span class="ak-ing-amount">${escapeHtml(engine.formatAmount(ingredient.scaled_amount))} ${escapeHtml(ingredient.unit || "")}</span> `
      : "";

    html += `<label class="ak-ing-item">
      <input type="checkbox" class="ak-ing-check">
      <span class="ak-ing-text">
        ${amountHtml}${escapeHtml(ingredient.name)}${ingredient.prep_note ? `, <em>${escapeHtml(ingredient.prep_note)}</em>` : ""}${ingredient.is_optional ? ' <span class="ak-ing-optional">(optional)</span>' : ""}${ingredient.substitution ? ` <span class="ak-ing-optional">[Sub: ${escapeHtml(ingredient.substitution)}]</span>` : ""}
      </span>
    </label>`;
  });

  return html;
}

function renderNutritionHtml(engine, recipe) {
  const nutrition = engine.scaleNutrition(recipe, recipe.default_servings || 1);
  if (!nutrition) return "";

  return `<div class="ak-nutrition" id="ak-static-nutrition">
    <div class="ak-nutrition-card"><span>Calories</span><strong>${escapeHtml(String(nutrition.calories))}</strong></div>
    <div class="ak-nutrition-card"><span>Protein</span><strong>${escapeHtml(String(nutrition.protein_g || 0))}g</strong></div>
    <div class="ak-nutrition-card"><span>Carbs</span><strong>${escapeHtml(String(nutrition.carbs_g || 0))}g</strong></div>
    <div class="ak-nutrition-card"><span>Fat</span><strong>${escapeHtml(String(nutrition.fat_g || 0))}g</strong></div>
    <div class="ak-nutrition-card"><span>Fiber</span><strong>${escapeHtml(String(nutrition.fiber_g || 0))}g</strong></div>
  </div>`;
}

function formatSchemaIngredient(engine, ingredient) {
  const amount = Number(ingredient.scaled_amount || 0);
  const amountText = amount > 0 ? engine.formatAmount(amount) : "";
  const unitText = ingredient.unit ? String(ingredient.unit).trim() : "";
  const quantityText = [amountText, unitText].filter(Boolean).join(" ");
  const nameText = ingredient.name || "";
  const prepText = ingredient.prep_note ? `, ${ingredient.prep_note}` : "";

  return [quantityText, nameText].filter(Boolean).join(" ") + prepText;
}

function renderStepsHtml(recipe) {
  return (recipe.steps || [])
    .map((step) => {
      const timerHtml = step.timer_seconds
        ? `<div class="ak-static-step-actions">
            <div class="ak-static-timer-chip">
              ${akIcon("timer", "ak-icon-sm ak-icon-accent")}
              <span class="ak-static-timer-label">${escapeHtml(step.timer_label || "Cooking timer")}</span>
              <strong id="ak-timer-display-${step.step_number}">${formatTime(step.timer_seconds)}</strong>
            </div>
            <div class="ak-static-timer-buttons">
              <button type="button" class="ak-btn ak-btn-sm ak-btn-outline" id="ak-timer-toggle-${step.step_number}" onclick="AKStaticRecipePage.toggleTimer(${step.step_number}, ${step.timer_seconds})">${akIcon("timer", "ak-icon-sm")}<span>Start timer</span></button>
              <button type="button" class="ak-btn ak-btn-sm ak-btn-outline" onclick="AKStaticRecipePage.resetTimer(${step.step_number}, ${step.timer_seconds})">${akIcon("check", "ak-icon-sm")}<span>Reset</span></button>
            </div>
            <div class="ak-static-timer-bar"><div class="ak-static-timer-bar-fill" id="ak-timer-progress-${step.step_number}" style="width:100%"></div></div>
          </div>`
        : "";

      return `<article class="ak-step" id="step-${step.step_number}">
        <div class="ak-step-header">
          <div class="ak-step-num">${step.step_number}</div>
          <div class="ak-step-title">${escapeHtml(step.title)}</div>
        </div>
        <div class="ak-step-text">${escapeHtml(step.instruction)}</div>
        ${step.tip ? `<div class="ak-step-tip"><span class="ak-step-tip-label">${akIcon("note", "ak-icon-sm")}<span>Kitchen note</span></span><span class="ak-step-tip-copy">${escapeHtml(step.tip)}</span></div>` : ""}
        ${timerHtml}
      </article>`;
    })
    .join("\n");
}

function resolveRecipeHref(recipe) {
  return recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
}

function uniqueRecipesBySlug(recipes) {
  const seen = new Set();
  return (recipes || []).filter((recipe) => {
    if (!recipe || !recipe.slug || seen.has(recipe.slug)) return false;
    seen.add(recipe.slug);
    return true;
  });
}

function sortRecipeCandidates(currentRecipe, recipes) {
  return uniqueRecipesBySlug(recipes).sort(
    (left, right) =>
      Number(Boolean(right.generated_in_wave)) - Number(Boolean(left.generated_in_wave)) ||
      Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
      Math.abs((left.total_time_minutes || 9999) - (currentRecipe.total_time_minutes || 9999)) -
        Math.abs((right.total_time_minutes || 9999) - (currentRecipe.total_time_minutes || 9999)) ||
      (right.view_count || 0) - (left.view_count || 0) ||
      left.name.localeCompare(right.name)
  );
}

function recipesFromCollectionMemberships(recipe, manifest) {
  const collectionSlugs = new Set((recipe.collection_slugs || []).filter(Boolean));
  if (!collectionSlugs.size) return [];
  const collectionRecipeSlugs = new Set();
  (manifest.collections || [])
    .filter((collection) => collectionSlugs.has(collection.slug))
    .forEach((collection) => {
      (collection.recipes || []).forEach((entry) => {
        if (entry.slug !== recipe.slug) collectionRecipeSlugs.add(entry.slug);
      });
    });
  return (manifest.recipes || []).filter((entry) => collectionRecipeSlugs.has(entry.slug));
}

function pickComplementaryRecipes(currentRecipe, manifest) {
  const wantedCategories = ["main", "side", "drink", "dessert"];
  const pool = (manifest.recipes || []).filter((recipe) => recipe.slug !== currentRecipe.slug);
  const collectionSlugs = new Set((currentRecipe.collection_slugs || []).filter(Boolean));

  return wantedCategories
    .map((category) => {
      const categoryPool = pool.filter((recipe) => recipe.category === category);
      const ranked = categoryPool
        .map((recipe) => {
          const sameCountry = recipe.country_code === currentRecipe.country_code ? 8 : 0;
          const sameRegion = recipe.region === currentRecipe.region ? 4 : 0;
          const sameCollection = (recipe.collection_slugs || []).some((slug) => collectionSlugs.has(slug)) ? 3 : 0;
          const generated = recipe.generated_in_wave ? 2 : 0;
          return {
            recipe,
            score: sameCountry + sameRegion + sameCollection + generated + Number(Boolean(recipe.is_featured))
          };
        })
        .sort(
          (left, right) =>
            right.score - left.score ||
            (left.recipe.total_time_minutes || 9999) - (right.recipe.total_time_minutes || 9999) ||
            left.recipe.name.localeCompare(right.recipe.name)
        );
      return ranked[0] ? ranked[0].recipe : null;
    })
    .filter(Boolean);
}

function pickRecipeInternalLinkGroups(currentRecipe, manifest) {
  const pool = (manifest.recipes || []).filter((recipe) => recipe.slug !== currentRecipe.slug);
  const sameCountry = sortRecipeCandidates(
    currentRecipe,
    pool.filter((recipe) => recipe.country_code === currentRecipe.country_code)
  ).slice(0, 4);
  const sameCategory = sortRecipeCandidates(
    currentRecipe,
    pool.filter((recipe) => recipe.category === currentRecipe.category)
  ).slice(0, 4);
  const sameCollection = sortRecipeCandidates(currentRecipe, recipesFromCollectionMemberships(currentRecipe, manifest)).slice(0, 4);
  const similarTime = sortRecipeCandidates(
    currentRecipe,
    pool.filter((recipe) => {
      if (!recipe.total_time_minutes || !currentRecipe.total_time_minutes) return false;
      return Math.abs(recipe.total_time_minutes - currentRecipe.total_time_minutes) <= 20;
    })
  ).slice(0, 4);
  const complementary = uniqueRecipesBySlug(pickComplementaryRecipes(currentRecipe, manifest)).slice(0, 4);

  return [
    {
      key: "same-country",
      title: `More ${currentRecipe.country_name} recipes`,
      intro: `Stay inside the ${currentRecipe.country_name} country hub.`,
      recipes: sameCountry
    },
    {
      key: "same-category",
      title: `More ${categoryLabel(currentRecipe).toLowerCase()} recipes`,
      intro: `Compare dishes in the same course or cooking style.`,
      recipes: sameCategory
    },
    {
      key: "same-collection",
      title: "From the same collection",
      intro: currentRecipe.primary_collection_name
        ? `Continue through ${currentRecipe.primary_collection_name}.`
        : "Follow the collection lane this recipe belongs to.",
      recipes: sameCollection
    },
    {
      key: "similar-time",
      title: "Similar cooking time",
      intro: "Pick another dish with a nearby time commitment.",
      recipes: similarTime
    },
    {
      key: "complementary",
      title: "Build a fuller table",
      intro: "Pair a main, side, drink, or dessert where the atlas has a useful match.",
      recipes: complementary
    }
  ].filter((group) => group.recipes && group.recipes.length);
}

function titleCaseLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function normalizeRecipeTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[|,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function recipeDietLabel(recipe) {
  const tags = normalizeRecipeTags(recipe.diet_tags);
  return tags.length ? titleCaseLabel(tags[0]) : "";
}

const AK_ICON_PATHS = {
  action: '<path d="M7 17 17 7"></path><path d="M9 7h8v8"></path>',
  category: '<path d="M5 6h14"></path><path d="M5 12h14"></path><path d="M5 18h9"></path>',
  check: '<circle cx="12" cy="12" r="8"></circle><path d="m8.5 12.5 2.2 2.2 4.8-5.2"></path>',
  copy: '<rect x="8" y="8" width="10" height="10" rx="2"></rect><path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>',
  country: '<path d="M5 20V5"></path><path d="M5 5h11l-1.5 3L16 11H5"></path>',
  diet: '<path d="M6 19c8 0 12-5 12-13-8 0-12 5-12 13Z"></path><path d="M6 19c2.4-4.2 5.4-7.2 9-9"></path>',
  difficulty: '<path d="M5 15a7 7 0 0 1 14 0"></path><path d="m12 15 3-4"></path><path d="M8 19h8"></path>',
  note: '<path d="M6 4h9l3 3v13H6z"></path><path d="M14 4v4h4"></path><path d="M9 12h6"></path><path d="M9 16h4"></path>',
  print: '<path d="M7 8V4h10v4"></path><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"></path><path d="M7 14h10v6H7z"></path>',
  servings: '<path d="M7 4v16"></path><path d="M5 4v5a2 2 0 0 0 4 0V4"></path><path d="M15 4v16"></path><path d="M15 4c2.2.8 3.5 2.8 3.5 5.4 0 2.1-.9 3.8-2.5 4.6"></path>',
  share: '<path d="M8 12h8"></path><path d="M13 7l5 5-5 5"></path><path d="M6 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1"></path>',
  shopping: '<path d="M6 9h12l-1 10H7L6 9Z"></path><path d="M9 9a3 3 0 0 1 6 0"></path>',
  source: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z"></path><path d="M8 7h8"></path><path d="M8 11h7"></path>',
  time: '<circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l2.5 1.5"></path>',
  timer: '<circle cx="12" cy="13" r="7"></circle><path d="M9 2h6"></path><path d="M12 6v7l3 2"></path>',
  warning: '<path d="M12 3 22 20H2L12 3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>'
};

function akIcon(name, className) {
  const classes = ["ak-icon", className || ""].filter(Boolean).join(" ");
  return `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${AK_ICON_PATHS[name] || AK_ICON_PATHS.category}</svg>`;
}

function staticCardMeta(icon, label, value) {
  if (!value) return "";
  return `<span>${akIcon(icon, "ak-static-card-icon")}<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span></span>`;
}

function imageSizeAttributes(width, height) {
  return ` width="${Number(width) || 1200}" height="${Number(height) || 900}"`;
}

function recipeImageAlt(recipe, role) {
  if (role === "prep") return `${recipe.name} ingredients/prep step`;
  if (role === "process") return `${recipe.name} cooking/process step`;
  if (role === "serving") return `${recipe.name} serving/detail image`;
  return `${recipe.name} recipe from ${recipe.country_name || "AfroKitchen"}`;
}

function renderRecipeFallbackMarkup(recipe, compact) {
  const category = categoryLabel(recipe);
  const country = recipe.country_name || "AfroKitchen";
  return `<span class="${compact ? "ak-static-recipe-card-fallback" : "ak-recipe-image-fallback"}" aria-hidden="true">
    <span class="ak-fallback-mark">${escapeHtml(String(recipe.country_code || "AK").slice(0, 2).toUpperCase())}</span>
    <span class="ak-fallback-copy"><strong>${escapeHtml(recipe.name || "AfroKitchen recipe")}</strong><small>${escapeHtml(country)} - ${escapeHtml(category)}</small></span>
  </span>`;
}

function renderStaticRecipeCard(recipe, recipeImages) {
  const media = resolveRecipeMedia(recipe, recipeImages);
  const imageSrc = media && media.pageImage ? String(media.pageImage) : "";
  const hasImage = Boolean(isUsableRecipeImage(imageSrc));
  const href = resolveRecipeHref(recipe);
  const category = categoryLabel(recipe);
  const country = recipe.country_name || "Africa";
  const diet = recipeDietLabel(recipe);
  const region = recipe.region || "";
  const time = recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : "Time varies";
  const servings = recipe.default_servings ? `Serves ${recipe.default_servings}` : "";
  const imageAlt = recipeImageAlt(recipe);
  const thumb = hasImage
    ? `<span class="ak-static-recipe-card-thumb"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async"${imageSizeAttributes(640, 480)}></span>`
    : renderRecipeFallbackMarkup(recipe, true);

  return `<a class="ak-static-recipe-card${hasImage ? " has-thumb" : " has-fallback"}" href="${escapeHtml(href)}" aria-label="Open recipe: ${escapeHtml(recipe.name)}">
    ${thumb}
    <span class="ak-static-recipe-card-body">
      <span class="ak-static-recipe-card-badges">
        <span class="ak-static-recipe-badge">${escapeHtml(country)}</span>
        <span class="ak-static-recipe-badge">${escapeHtml(category)}</span>
      </span>
      <span class="ak-static-recipe-card-title">${escapeHtml(recipe.name)}</span>
      <span class="ak-static-recipe-card-desc">${escapeHtml(excerpt(recipe.description, 126))}</span>
      <span class="ak-static-recipe-card-meta">
        ${staticCardMeta("time", "Time", time)}
        ${staticCardMeta("servings", "Servings", servings)}
        ${staticCardMeta("difficulty", "Difficulty", titleCaseLabel(recipe.difficulty || "medium"))}
        ${staticCardMeta("diet", "Diet", diet)}
        ${staticCardMeta("country", "Region", region)}
      </span>
      <span class="ak-static-recipe-card-cta">Open recipe ${akIcon("action", "ak-static-card-icon")}</span>
    </span>
  </a>`;
}

function renderCompactRecipeLink(recipe, contextLabel) {
  const meta = [
    recipe.country_name,
    categoryLabel(recipe),
    recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : ""
  ]
    .filter(Boolean)
    .join(" - ");
  return `<a class="ak-internal-link" href="${escapeHtml(resolveRecipeHref(recipe))}">
        <span>${escapeHtml(recipe.name)}</span>
        <small>${escapeHtml(contextLabel || meta)}</small>
      </a>`;
}

function renderRelatedHtml(recipe, linkGroups, recipeImages) {
  const primaryCards = (linkGroups[0] ? linkGroups[0].recipes : [])
    .slice(0, 4)
    .map((entry) => renderStaticRecipeCard(entry, recipeImages))
    .join("\n");
  const compactGroups = linkGroups
    .map(
      (group) => `<article class="ak-internal-link-group">
        <div class="ak-support-label">${escapeHtml(group.title)}</div>
        <p>${escapeHtml(group.intro)}</p>
        <div class="ak-internal-link-list">
          ${group.recipes
            .slice(0, 4)
            .map((entry) => renderCompactRecipeLink(entry))
            .join("\n")}
        </div>
      </article>`
    )
    .join("\n");

  return `<section class="ak-section ak-static-related ak-internal-link-section">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Keep exploring</div>
      <h2 class="ak-section-title">Cook around ${escapeHtml(recipe.name)}</h2>
      <p class="ak-section-sub">Follow country, category, collection, time, and pairing paths without turning the recipe page into a link farm.</p>
    </div>
    ${primaryCards ? `<div class="ak-static-related-grid">${primaryCards}</div>` : ""}
    <div class="ak-internal-link-grid">${compactGroups}</div>
    <div class="ak-hero-actions ak-static-related-actions">
      <a href="/tools/afrokitchen/" class="ak-btn ak-btn-secondary">Browse AfroKitchen</a>
      <a href="${recipe.country_route_path}" class="ak-btn ak-btn-outline">Explore ${escapeHtml(recipe.country_name)} recipes</a>
    </div>
  </section>`;
}

function renderRecipeCollectionSummaryCard(recipe) {
  if (!recipe.primary_collection_slug || !recipe.primary_collection_route_path) return "";

  const collectionCopy =
    recipe.collection_count > 1
      ? `${recipe.name} appears in ${recipe.collection_count} AfroKitchen collections. Start with ${recipe.primary_collection_name} if you want more dishes in the same mood.`
      : `${recipe.primary_collection_name} is the easiest collection to explore after this dish.`;

  return `<div class="ak-static-summary-card">
            <strong>Follow the collection</strong>
            <p>${escapeHtml(collectionCopy)} <a href="${recipe.primary_collection_route_path}">${escapeHtml(recipe.primary_collection_name)}</a></p>
          </div>`;
}

function getRecipeInsight(recipe, cuisineIntelligence) {
  return cuisineIntelligence && cuisineIntelligence.recipes
    ? cuisineIntelligence.recipes[recipe.slug]
    : null;
}

function getCountryInsight(country, cuisineIntelligence) {
  return cuisineIntelligence && cuisineIntelligence.countries
    ? cuisineIntelligence.countries[country.country_code]
    : null;
}

function renderRecipeIntelligenceCards(recipe, insight) {
  if (!insight) return "";

  const lens = insight.region_lens || {};
  const notes = insight.chef_notes || {};
  const mistakes = (notes.common_mistakes || []).slice(0, 3);
  const cues = (notes.readiness_cues || []).slice(0, 3);
  const pantry = (notes.pantry_notes || []).slice(0, 5);

  return `${lens.name ? `<div class="ak-static-summary-card ak-intel-card">
            <strong>Regional lane</strong>
            <p>${escapeHtml(lens.name)}. ${escapeHtml(lens.description || "")}</p>
          </div>` : ""}
          ${mistakes.length ? `<div class="ak-static-summary-card ak-intel-card">
            <strong>Chef watch-outs</strong>
            <ul>${mistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>` : ""}
          ${cues.length ? `<div class="ak-static-summary-card ak-intel-card">
            <strong>How you know it is ready</strong>
            <ul>${cues.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>` : ""}
          ${pantry.length ? `<div class="ak-static-summary-card ak-intel-card">
            <strong>Pantry lane</strong>
            <p>${escapeHtml(pantry.join(", "))}</p>
          </div>` : ""}`;
}

function renderRecipePairingRail(recipe, insight) {
  if (!insight) return "";

  const notes = insight.chef_notes || {};
  const collections = (insight.curated_collections || []).slice(0, 3);
  const collectionLinks = collections
    .map(
      (collection) =>
        `<a class="ak-support-link" href="${collection.route_path}">${escapeHtml(collection.name)}</a>`
    )
    .join("\n");

  return `<section class="ak-intel-panel ak-recipe-intel-panel">
    <div>
      <div class="ak-section-kicker">Chef board</div>
      <h2 class="ak-section-title">Build the table around ${escapeHtml(recipe.name)}</h2>
      <p class="ak-section-sub">${escapeHtml(notes.serve_with || recipe.best_served_with || "Use the country hub to choose a side, sauce, starch, drink, or nearby dish.")}</p>
    </div>
    <div class="ak-intel-split">
      <div class="ak-intel-mini">
        <strong>Best route from here</strong>
        <p>${escapeHtml((insight.region_lens && insight.region_lens.name) || `${recipe.country_name} national table`)}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Collections to keep cooking</strong>
        <div class="ak-intel-links">${collectionLinks || `<a class="ak-support-link" href="${recipe.country_route_path}">Explore ${escapeHtml(recipe.country_name)} recipes</a>`}</div>
      </div>
    </div>
  </section>`;
}

function renderRecipeSocialPlate(recipe, insight) {
  const social = insight && insight.social ? insight.social : null;
  if (!social || !social.is_showstopper) return "";

  const recipeUrl = `${SITE_ORIGIN}${recipe.route_path}`;
  const caption = `${social.caption} #AfroKitchen`;
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipeUrl)}`;
  const postUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(recipeUrl)}&text=${encodeURIComponent(caption)}`;

  return `<section class="ak-intel-panel ak-social-plate">
    <div class="ak-social-plate-head">
      <div>
        <div class="ak-section-kicker">Social plate</div>
        <h2 class="ak-section-title">Why ${escapeHtml(recipe.name)} gets people talking</h2>
        <p class="ak-section-sub">${escapeHtml(social.why_it_moves)}</p>
      </div>
      <div class="ak-social-rank" aria-label="Showstopper rank">
        <span>#${escapeHtml(String(social.rank))}</span>
        <small>Showstopper</small>
      </div>
    </div>
    <div class="ak-social-grid">
      <div class="ak-intel-mini">
        <strong>Hook</strong>
        <p>${escapeHtml(social.hook)}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Caption starter</strong>
        <p>${escapeHtml(social.caption)}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Hosting move</strong>
        <p>${escapeHtml(social.hosting_move)}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Photo angle</strong>
        <p>${escapeHtml(social.photo_angle)}</p>
      </div>
    </div>
    <div class="ak-social-actions">
      <a class="ak-support-link" href="${shareUrl}" target="_blank" rel="noopener">Share this recipe</a>
      <a class="ak-support-link" href="${postUrl}" target="_blank" rel="noopener">Post the caption</a>
      <a class="ak-support-link" href="${escapeHtml(social.showcase_route_path)}">Open the showstopper board</a>
    </div>
  </section>`;
}

function renderCountryRegionalAtlas(country, cuisineIntelligence) {
  const insight = getCountryInsight(country, cuisineIntelligence);
  if (!insight || !insight.regions || !insight.regions.length) return "";
  const hasOnlyNationalFallback = insight.regions.length === 1 && insight.regions[0].slug === "national-table";
  if (hasOnlyNationalFallback) return "";

  const cards = insight.regions
    .map(
      (region) => `<article class="ak-country-region-card">
        <div class="ak-support-label">${escapeHtml(String(region.recipe_count))} dishes</div>
        <h3>${escapeHtml(region.name)}</h3>
        <p>${escapeHtml(region.description)}</p>
        <div class="ak-region-recipe-list">
          ${(region.recipes || [])
            .slice(0, 5)
            .map((recipe) => `<a href="${recipe.route_path}">${escapeHtml(recipe.name)}</a>`)
            .join("")}
        </div>
      </article>`
    )
    .join("\n");

  return `<section class="ak-section ak-country-intel-section">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Regional depth</div>
      <h2 class="ak-section-title">Cook ${escapeHtml(country.country_name)} by region and food culture</h2>
      <p class="ak-section-sub">Country cuisine is not one flat list. This hub now groups dishes into practical lanes so you can explore the table with more context.</p>
    </div>
    <div class="ak-country-region-grid">${cards}</div>
  </section>`;
}

function renderCountryPantryGuide(country, cuisineIntelligence) {
  const insight = getCountryInsight(country, cuisineIntelligence);
  if (!insight) return "";

  const pantry = (insight.pantry || []).slice(0, 8);
  const techniques = (insight.techniques || []).slice(0, 6);
  if (!pantry.length && !techniques.length) return "";

  return `<section class="ak-intel-panel ak-country-pantry-panel">
    <div>
      <div class="ak-section-kicker">Pantry and technique</div>
      <h2 class="ak-section-title">What gives ${escapeHtml(country.country_name)} recipes their shape</h2>
      <p class="ak-section-sub">Use this as a shopping and cooking compass before you jump into the individual recipes.</p>
    </div>
    <div class="ak-intel-chip-grid">
      ${pantry.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      ${techniques.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
  </section>`;
}

function renderCollectionIntelligence(collection) {
  if (!collection.is_cuisine_intelligence) return "";

  const countries = (collection.related_countries || [])
    .slice(0, 5)
    .map((country) => country.country_name)
    .join(", ");
  const dishes = (collection.top_recipe_names || []).join(", ");

  return `<section class="ak-intel-panel ak-collection-intel-panel">
    <div>
      <div class="ak-section-kicker">Why this collection works</div>
      <h2 class="ak-section-title">A practical cooking lane, not a random shelf</h2>
      <p class="ak-section-sub">Start with ${escapeHtml(dishes || collection.name)}, then use the country links and related dishes to build a complete table.</p>
    </div>
    <div class="ak-intel-split">
      <div class="ak-intel-mini">
        <strong>Country spread</strong>
        <p>${escapeHtml(countries || "Multiple AfroKitchen country hubs")}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Best use</strong>
        <p>Use this collection for meal planning, photo batching, and deciding which connected recipes to cook next.</p>
      </div>
    </div>
  </section>`;
}

function renderCollectionSocialShowcase(collection, cuisineIntelligence) {
  const showcase = cuisineIntelligence && cuisineIntelligence.social_showcase ? cuisineIntelligence.social_showcase : null;
  if (!showcase || collection.slug !== showcase.slug || !Array.isArray(showcase.recipes)) return "";

  const cards = showcase.recipes
    .map(
      (recipe) => `<a class="ak-social-showcase-card" href="${recipe.route_path}">
        <span class="ak-social-showcase-rank">#${escapeHtml(String(recipe.rank))}</span>
        <h3>${escapeHtml(recipe.name)}</h3>
        <p>${escapeHtml(recipe.hook)}</p>
        <small>${escapeHtml(recipe.country_name)}</small>
      </a>`
    )
    .join("\n");

  return `<section class="ak-intel-panel ak-social-showcase-panel">
    <div class="ak-social-plate-head">
      <div>
        <div class="ak-section-kicker">Showstopper board</div>
        <h2 class="ak-section-title">Cook, post, compare notes</h2>
        <p class="ak-section-sub">${escapeHtml(showcase.description)}</p>
      </div>
      <div class="ak-social-rank">
        <span>${escapeHtml(String(showcase.total_recipes))}</span>
        <small>Dishes</small>
      </div>
    </div>
    <div class="ak-social-showcase-grid">${cards}</div>
  </section>`;
}

function toAbsoluteSchemaUrl(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("//")) return `https:${input}`;
  if (input.startsWith("/")) return `${SITE_ORIGIN}${input}`;
  return `${SITE_ORIGIN}/${input.replace(/^\/+/, "")}`;
}

function imageExists(relativePath) {
  if (!relativePath || !relativePath.startsWith("/")) return false;
  return fs.existsSync(path.join(ROOT, relativePath.replace(/^\//, "")));
}

function findLocalGalleryImage(stem) {
  const safeStem = slugify(stem);
  if (!safeStem) return "";

  const extensions = [".webp", ".jpg", ".jpeg", ".png"];
  for (const extension of extensions) {
    const relativePath = `/assets/img/kitchen/${safeStem}${extension}`;
    if (imageExists(relativePath)) return relativePath;
  }

  return "";
}

function addGalleryImage(images, seen, src, alt, caption, credit) {
  const input = String(src || "").trim();
  if (!input || isGenericRecipeImage(input)) return;

  const key = input.replace(/\?.*$/, "");
  if (seen.has(key)) return;
  seen.add(key);

  images.push({
    src: input,
    alt: alt || "AfroKitchen recipe photo",
    caption: caption || "",
    credit: credit || null
  });
}

function cleanGalleryCaption(caption, recipe, fallback) {
  const input = String(caption || "").trim();
  if (
    !input ||
    /Fallback collection artwork pending recipe-specific media/i.test(input) ||
    /^Photo \d+$/i.test(input) ||
    /^Prep or serving detail$/i.test(input)
  ) {
    return fallback || `${recipe.name} photo`;
  }

  return cleanGeneratedCopyText(input);
}

function recipeOccasionText(recipe) {
  const occasion = String(recipe.occasion || "").trim().replace(/^best\s+for\s+/i, "");
  return occasion || "everyday meals";
}

function collectRecipeGalleryImages(recipe, media, recipeImages) {
  const images = [];
  const seen = new Set();
  const baseAlt = recipeImageAlt(recipe);

  addGalleryImage(
    images,
    seen,
    media.pageImage,
    baseAlt,
    `${recipe.name} finished dish`,
    media.credit
  );

  if (isUsableRecipeImage(recipe.image_url)) {
    addGalleryImage(images, seen, recipe.image_url, baseAlt, `${recipe.name} finished dish`);
  }

  const manifestEntry = recipeImages && recipeImages[recipe.slug] ? recipeImages[recipe.slug] : {};
  const manifestGallery = manifestEntry.manual_override
    ? []
      .concat(Array.isArray(manifestEntry.images) ? manifestEntry.images : [])
      .concat(Array.isArray(manifestEntry.gallery) ? manifestEntry.gallery : [])
    : [];
  const sourceGallery = manifestGallery
    .concat(Array.isArray(recipe.media) ? recipe.media : [])
    .concat(Array.isArray(recipe.recipe_media) ? recipe.recipe_media : []);

  sourceGallery.forEach((entry, index) => {
    if (typeof entry === "string") {
      addGalleryImage(images, seen, entry, baseAlt, `${recipe.name} cooking detail`);
      return;
    }

    const role = String(entry.role || "").toLowerCase();
    const roleAlt = role.includes("prep") || role.includes("ingredient")
      ? recipeImageAlt(recipe, "prep")
      : role.includes("process") || role.includes("cook")
        ? recipeImageAlt(recipe, "process")
        : role.includes("serving") || role.includes("detail") || role.includes("table")
          ? recipeImageAlt(recipe, "serving")
          : baseAlt;

    addGalleryImage(
      images,
      seen,
      entry.full || entry.url || entry.src || entry.image_url,
      entry.alt || entry.alt_text || roleAlt,
      cleanGalleryCaption(entry.caption, recipe, index === 0 ? `${recipe.name} finished dish` : `${recipe.name} cooking detail`),
      entry.photographer
        ? {
            source: entry.source || "image source",
            photographer: entry.photographer,
            photographerUrl: entry.photographer_url || entry.credit_url || ""
          }
        : entry.credit_text
          ? {
              source: entry.source_type || "image source",
              photographer: entry.credit_text,
              photographerUrl: entry.credit_url || ""
            }
        : null
    );
  });

  for (let index = 2; index <= 5; index += 1) {
    const localImage = findLocalGalleryImage(`${recipe.slug}-${index}`);
    if (localImage) {
      const role = index === 2 ? "prep" : index === 3 ? "process" : "serving";
      addGalleryImage(
        images,
        seen,
        localImage,
        recipeImageAlt(recipe, role),
        index === 2 ? `${recipe.name} ingredients/prep step` : index === 3 ? `${recipe.name} cooking/process step` : `${recipe.name} serving/detail image`
      );
    }
  }

  (recipe.steps || []).forEach((step) => {
    addGalleryImage(
      images,
      seen,
      step.image_url,
      recipeImageAlt(recipe, "process"),
      step.title || `Step ${step.step_number}`
    );
  });

  return images.slice(0, 5);
}

function renderRecipePhotoGallery(recipe, galleryImages) {
  if (!galleryImages || !galleryImages.length) return "";

  const featured = galleryImages[0];
  const supporting = galleryImages.slice(1);

  return `<section class="ak-photo-gallery" aria-label="${escapeHtml(recipe.name)} photos">
        <div class="ak-photo-gallery-head">
          <div>
            <div class="ak-section-kicker">Recipe photos</div>
            <h2 class="ak-section-title">See the dish before you cook</h2>
          </div>
          <p>Each recipe supports one main image and up to four extra prep, serving, or step photos when they are available.</p>
        </div>
        <div class="ak-photo-gallery-grid${supporting.length ? "" : " is-single"}">
          <figure class="ak-photo-main">
            <img src="${escapeHtml(featured.src)}" alt="${escapeHtml(featured.alt)}" loading="lazy" decoding="async"${imageSizeAttributes(1200, 750)}>
            ${featured.caption ? `<figcaption>${escapeHtml(featured.caption)}</figcaption>` : ""}
          </figure>
          ${
            supporting.length
              ? `<div class="ak-photo-thumbs">${supporting
                  .map(
                    (image) => `<figure>
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async"${imageSizeAttributes(640, 640)}>
            ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}
          </figure>`
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
        ${
          galleryImages.some((image) => image.credit)
            ? `<div class="ak-static-credit">${galleryImages
                .filter((image) => image.credit)
                .map((image) => {
                  const credit = image.credit || {};
                  const source = credit.source || "image source";
                  const photographer = credit.photographer || source;
                  const photographerUrl = credit.photographerUrl || "";
                  return photographerUrl
                    ? `Image sourced from ${escapeHtml(source)} by <a href="${escapeHtml(photographerUrl)}">${escapeHtml(photographer)}</a>.`
                    : `Image sourced from ${escapeHtml(source)} by ${escapeHtml(photographer)}.`;
                })
                .join(" ")}</div>`
            : ""
        }
      </section>`;
}

function buildRecipeKeywords(recipe) {
  const values = [
    ...(Array.isArray(recipe.tags) ? recipe.tags : []),
    ...(Array.isArray(recipe.diet_tags) ? recipe.diet_tags : []),
    recipe.occasion,
    recipe.name_local
  ];
  const keywords = Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value) => value.toLowerCase() !== String(recipe.name || "").trim().toLowerCase())
    )
  );

  return keywords.length ? keywords.join(", ") : "";
}

function metaDescription(value, limit) {
  return excerpt(value, limit || 155);
}

function buildCountryMetaDescription(country) {
  const names = humanList((country.top_recipe_names || []).filter(Boolean), 1);
  return metaDescription(
    `${country.country_name} recipes: ${country.total_recipes} dishes${names ? ` including ${names}` : ""}. Browse categories, country context, and ready-to-cook links.`,
    158
  );
}

function buildCollectionMetaDescription(collection) {
  return metaDescription(buildCollectionShareText(collection), 158);
}

function isoDate(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function isoDurationFromMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return "";
  return `PT${Math.round(minutes)}M`;
}

function isUsableSchemaText(value) {
  return Boolean(String(value || "").trim());
}

function collectRecipeSchemaBlockers(recipe, schemaImages, schemaIngredients) {
  const blockers = [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  if (!isUsableSchemaText(recipe.name)) blockers.push("missing_name");
  if (!isUsableSchemaText(recipe.description)) blockers.push("missing_description");
  if (!Array.isArray(schemaImages) || !schemaImages.length) blockers.push("missing_image");
  if (!isUsableSchemaText(recipe.country_name)) blockers.push("missing_cuisine");
  if (!isUsableSchemaText(recipe.category)) blockers.push("missing_category");
  if (!isoDurationFromMinutes(recipe.prep_time_minutes)) blockers.push("missing_prep_time");
  if (!isoDurationFromMinutes(recipe.cook_time_minutes)) blockers.push("missing_cook_time");
  if (!isoDurationFromMinutes(recipe.total_time_minutes)) blockers.push("missing_total_time");
  if (!recipe.default_servings) blockers.push("missing_yield");
  if (!Array.isArray(schemaIngredients) || !schemaIngredients.length) blockers.push("missing_ingredients");
  if (!steps.length || steps.some((step) => !isUsableSchemaText(step.title) || !isUsableSchemaText(step.instruction))) {
    blockers.push("missing_instructions");
  }

  return blockers;
}

function canUseSchemaImage(value) {
  const absoluteUrl = toAbsoluteSchemaUrl(value);
  if (!absoluteUrl || absoluteUrl === TOOL_OG_IMAGE) return false;

  if (absoluteUrl.startsWith(`${SITE_ORIGIN}/`)) {
    try {
      const pathname = new URL(absoluteUrl).pathname.replace(/^\/+/, "");
      return imageExists(`/${pathname}`);
    } catch (error) {
      return false;
    }
  }

  return /^https?:\/\//i.test(absoluteUrl);
}

function buildRecipeInstructionSchemas(recipe, pageUrl, socialImage) {
  const fallbackImage = canUseSchemaImage(socialImage)
    ? toAbsoluteSchemaUrl(socialImage)
    : "";

  return (recipe.steps || []).map((step) => {
    const stepSchema = {
      "@type": "HowToStep",
      name: step.title,
      text: step.instruction,
      url: `${pageUrl}#step-${step.step_number}`
    };
    const stepImage = canUseSchemaImage(step.image_url)
      ? toAbsoluteSchemaUrl(step.image_url)
      : fallbackImage;

    if (stepImage) {
      stepSchema.image = stepImage;
    }

    return stepSchema;
  });
}

function buildRecipeSchemas(recipe, engine, socialImage, galleryImages) {
  const pageUrl = recipe.route_url;
  const recipeSchema = JSON.parse(
    JSON.stringify(engine.getStructuredData(recipe, recipe.default_servings || 1))
  );
  const schemaIngredients = engine
    .scaleIngredients(recipe.ingredients || [], recipe.default_servings || 1, recipe.default_servings || 1)
    .map((ingredient) => formatSchemaIngredient(engine, ingredient));
  const normalizedSocialImage = toAbsoluteSchemaUrl(socialImage || TOOL_OG_IMAGE) || TOOL_OG_IMAGE;
  let schemaImages = (galleryImages || [])
    .map((image) => toAbsoluteSchemaUrl(image.src))
    .filter((src) => canUseSchemaImage(src));
  if (!schemaImages.length && canUseSchemaImage(normalizedSocialImage)) {
    schemaImages = [normalizedSocialImage];
  }
  const keywords = buildRecipeKeywords(recipe);
  const schemaBlockers = collectRecipeSchemaBlockers(recipe, schemaImages, schemaIngredients);

  if (!schemaBlockers.length) {
    recipeSchema.image = schemaImages;
    recipeSchema.url = pageUrl;
    recipeSchema.author = {
      "@type": "Organization",
      name: "AfroKitchen"
    };
    recipeSchema.publisher = {
      "@type": "Organization",
      name: "AfroTools",
      url: SITE_ORIGIN
    };
    recipeSchema.datePublished = isoDate(recipe.created_at) || undefined;
    recipeSchema.dateModified = isoDate(recipe.updated_at) || undefined;
    recipeSchema.prepTime = isoDurationFromMinutes(recipe.prep_time_minutes);
    recipeSchema.cookTime = isoDurationFromMinutes(recipe.cook_time_minutes);
    recipeSchema.totalTime = isoDurationFromMinutes(recipe.total_time_minutes);
    recipeSchema.recipeCuisine = [recipe.country_name, recipe.region].filter(Boolean).join(", ");
    recipeSchema.recipeCategory = categoryLabel(recipe);
    recipeSchema.recipeYield = `${recipe.default_servings} ${recipe.serving_unit || "servings"}`;
    recipeSchema.recipeIngredient = schemaIngredients;
    recipeSchema.recipeInstructions = buildRecipeInstructionSchemas(
      recipe,
      pageUrl,
      normalizedSocialImage
    );
    recipeSchema.isAccessibleForFree = true;
    delete recipeSchema.aggregateRating;
    delete recipeSchema.review;
    if (keywords) {
      recipeSchema.keywords = keywords;
    }
    recipeSchema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": pageUrl
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AfroTools",
        item: `${SITE_ORIGIN}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${SITE_ORIGIN}/tools/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "AfroKitchen",
        item: `${SITE_ORIGIN}/tools/afrokitchen/`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: recipe.country_name,
        item: recipe.country_route_url
      },
      {
        "@type": "ListItem",
        position: 5,
        name: recipe.name,
        item: pageUrl
      }
    ]
  };

  return {
    recipeSchema: schemaBlockers.length ? null : recipeSchema,
    breadcrumbSchema,
    schemaBlockers
  };
}

function buildRecipePageHtml(recipe, manifest, engine, recipeImages, researchAudit, cuisineIntelligence) {
  recipe = cleanPatchedRecipeCopy(applyRecipeResearchPatch(recipe, researchAudit));
  const recipeInsight = getRecipeInsight(recipe, cuisineIntelligence);
  const recipeInternalLinkGroups = pickRecipeInternalLinkGroups(recipe, manifest);
  const media = resolveRecipeMedia(recipe, recipeImages);
  const galleryImages = collectRecipeGalleryImages(recipe, media, recipeImages);
  const title = `${recipeSeoName(recipe)} Recipe | ${recipe.country_name} | AfroKitchen`;
  const description = excerpt(recipe.description, 158);
  const { recipeSchema, breadcrumbSchema, schemaBlockers } = buildRecipeSchemas(
    recipe,
    engine,
    media.socialImage,
    galleryImages
  );
  const robotsContent = recipeSchema ? "index, follow" : "noindex, follow";
  const recipeSchemaScript = recipeSchema
    ? `  <script type="application/ld+json">${safeJson(recipeSchema)}</script>\n`
    : "";
  const renderedIngredients = renderIngredientsHtml(engine, recipe, recipe.default_servings || 1);
  const renderedNutrition = renderNutritionHtml(engine, recipe);
  const renderedSteps = renderStepsHtml(recipe);
  const renderedGallery = renderRecipePhotoGallery(recipe, galleryImages);
  const renderedInsightCards = renderRecipeIntelligenceCards(recipe, recipeInsight);
  const renderedPairingRail = renderRecipePairingRail(recipe, recipeInsight);
  const renderedSocialPlate = renderRecipeSocialPlate(recipe, recipeInsight);
  const relatedSection = renderRelatedHtml(recipe, recipeInternalLinkGroups, recipeImages);
  const storyLead = recipe.story ? excerpt(recipe.story, 420) : description;
  const heroImage = media.pageImage || RECIPE_FALLBACK_IMAGE;
  const heroStyle = heroImage
    ? ` style="background-image:linear-gradient(140deg,rgba(36,18,8,.9),rgba(123,31,12,.72) 46%,rgba(199,62,29,.58)),url('${escapeHtml(heroImage)}')"`
    : "";

  const recipeData = {
    slug: recipe.slug,
    name: recipe.name,
    description: recipe.description,
    story: recipe.story || "",
    default_servings: recipe.default_servings || 1,
    serving_unit: recipe.serving_unit || "servings",
    country_name: recipe.country_name,
    country_code: recipe.country_code,
    region: recipe.region,
    difficulty: recipe.difficulty || "medium",
    category: recipe.category,
    calories: recipe.calories || null,
    protein_g: recipe.protein_g || null,
    carbs_g: recipe.carbs_g || null,
    fat_g: recipe.fat_g || null,
    fiber_g: recipe.fiber_g || null,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    gallery_images: galleryImages,
    region_lens: recipeInsight ? recipeInsight.region_lens : null,
    chef_notes: recipeInsight ? recipeInsight.chef_notes : null,
    image_status: recipeInsight ? recipeInsight.image : null
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${recipe.route_url}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta name="robots" content="${robotsContent}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(media.socialImage || TOOL_OG_IMAGE)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${recipe.route_url}">
  <meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(media.socialImage || TOOL_OG_IMAGE)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${AK_FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${AK_FONT_HREF}"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=b8aa6b54">
  <link rel="stylesheet" href="/tools/afrokitchen/style.css?v=20260424a">
  <link rel="stylesheet" href="/tools/afrokitchen/icon-system.css?v=20260612a">
  <link rel="stylesheet" href="/tools/afrokitchen/cuisine-intelligence.css?v=20260501a">
  <link rel="stylesheet" href="/tools/afrokitchen/responsive-fixes.css?v=20260425a">
  <style>
    .ak-static-page .ak-hero-inner > * { min-width: 0; }
    .ak-static-page .ak-hero-sub { max-width: 58ch; margin: 18px 0 0; color: rgba(255,255,255,.82); font-size: 1.02rem; line-height: 1.75; }
    .ak-static-page .ak-static-hero-card,
    .ak-static-page .ak-static-summary-shell,
    .ak-static-page .ak-static-helper-note { background: var(--ak-panel); border: 1px solid var(--ak-line); border-radius: var(--ak-radius); box-shadow: var(--ak-shadow-card); }
    .ak-static-page .ak-static-hero-card { padding: 24px; align-self: stretch; display: grid; gap: 16px; color: var(--ak-text); }
    .ak-static-page .ak-static-hero-card h2 { margin: 0; font-family: var(--font-display); font-size: 2rem; line-height: .95; }
    .ak-static-page .ak-static-hero-card p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    .ak-static-page .ak-static-facts { display: grid; gap: 10px; }
    .ak-static-page .ak-static-facts div { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--ak-line); font-size: .95rem; }
    .ak-static-page .ak-static-facts span,
    .ak-static-page .ak-static-facts strong { min-width: 0; }
    .ak-static-page .ak-static-facts strong { text-align: right; overflow-wrap: anywhere; }
    .ak-static-page .ak-static-facts div:last-child { border-bottom: 0; padding-bottom: 0; }
    .ak-static-page .ak-static-summary-shell { padding: 26px; margin-top: -52px; position: relative; z-index: 2; }
    .ak-static-page .ak-static-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 22px; }
    .ak-static-page .ak-static-summary-card { padding: 18px; border-radius: 20px; background: rgba(255,255,255,.72); border: 1px solid var(--ak-line); }
    .ak-static-page .ak-static-summary-card strong { display: block; margin-bottom: 8px; color: var(--ak-dark); }
    .ak-static-page .ak-static-summary-card p { margin: 0; color: var(--ak-muted); line-height: 1.6; }
    .ak-static-page .ak-photo-gallery { margin-top: 28px; }
    .ak-static-page .ak-photo-gallery-head { display: flex; align-items: end; justify-content: space-between; gap: 22px; margin-bottom: 18px; }
    .ak-static-page .ak-photo-gallery-head p { max-width: 42ch; margin: 0; color: var(--ak-muted); line-height: 1.65; }
    .ak-static-page .ak-photo-gallery-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(240px, .7fr); gap: 14px; }
    .ak-static-page .ak-photo-gallery-grid.is-single { grid-template-columns: minmax(0, 1fr); }
    .ak-static-page .ak-photo-gallery figure { margin: 0; position: relative; overflow: hidden; border-radius: 24px; background: var(--ak-panel); border: 1px solid var(--ak-line); box-shadow: var(--ak-shadow-sm); }
    .ak-static-page .ak-photo-gallery img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .ak-static-page .ak-photo-main { aspect-ratio: 16 / 10; min-height: 320px; }
    .ak-static-page .ak-photo-thumbs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .ak-static-page .ak-photo-thumbs figure { aspect-ratio: 1 / 1; min-height: 0; }
    .ak-static-page .ak-photo-gallery figcaption { position: absolute; left: 12px; bottom: 12px; max-width: calc(100% - 24px); padding: 7px 10px; border-radius: 999px; background: rgba(12,10,8,.72); color: #fff; font-size: .74rem; font-weight: 700; backdrop-filter: blur(8px); }
    .ak-static-page .ak-cook-shell { margin-top: 30px; padding: clamp(18px, 3vw, 34px); border: 1px solid var(--ak-line); border-radius: 28px; background: linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,241,222,.9)); box-shadow: var(--ak-shadow-sm); }
    .ak-static-page .ak-static-serving-bar { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 0 0 24px; padding: 16px 18px; border-radius: 22px; background: var(--ak-panel); border: 1px solid var(--ak-line); }
    .ak-static-page .ak-static-serving-note { max-width: 42ch; margin: 0; color: var(--ak-muted); font-size: .92rem; line-height: 1.55; }
    .ak-static-page .ak-recipe-layout { gap: 28px; padding: 0; align-items: start; }
    .ak-static-page .ak-ingredients-panel { border-radius: 24px; border-color: var(--ak-primary-border); background: linear-gradient(180deg, #fff, var(--ak-panel-tint)); box-shadow: 0 18px 36px rgba(60,30,10,.08); }
    .ak-static-page .ak-panel-title-row { display: flex; align-items: start; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
    .ak-static-page .ak-panel-title-row .ak-panel-title { margin: 0; }
    .ak-static-page .ak-panel-helper { margin: 6px 0 0; color: var(--ak-muted); font-size: .86rem; line-height: 1.55; }
    .ak-static-page .ak-panel-pill { display: inline-flex; align-items: center; min-height: 34px; padding: 0 12px; border-radius: 999px; background: var(--ak-accent); color: var(--ak-dark); font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
    .ak-static-page .ak-ing-item { padding: 13px 0; gap: 14px; font-size: .98rem; }
    .ak-static-page .ak-ing-check { width: 26px; height: 26px; border-radius: 50%; }
    .ak-static-page .ak-ingredients-footer { margin-top: 22px; padding-top: 20px; border-top: 1px solid var(--ak-line); }
    .ak-static-page .ak-mini-title { margin: 0 0 12px; font-family: var(--font-body); font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ak-primary-deep); }
    .ak-static-page .ak-nutrition { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 0; }
    .ak-static-page .ak-nutrition-card { padding: 12px; border-radius: 16px; background: var(--ak-bg); border: 1px solid var(--ak-line); }
    .ak-static-page .ak-nutrition-card span { display: block; font-size: .64rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ak-subtle); }
    .ak-static-page .ak-nutrition-card strong { display: block; margin-top: 3px; font-family: var(--font-display); font-size: 1.35rem; line-height: 1; color: var(--ak-primary-deep); }
    .ak-static-page .ak-method-panel { min-width: 0; }
    .ak-static-page .ak-method-head { display: flex; justify-content: space-between; gap: 18px; align-items: start; margin-bottom: 16px; padding: 20px 22px; border-radius: 24px; background: var(--ak-panel); border: 1px solid var(--ak-line); box-shadow: var(--ak-shadow-sm); }
    .ak-static-page .ak-panel-kicker { margin-bottom: 8px; font-size: .72rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--ak-leaf-deep); }
    .ak-static-page .ak-method-sub { margin: 8px 0 0; color: var(--ak-muted); line-height: 1.55; font-size: .92rem; }
    .ak-static-page .ak-method-stat-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 18px; }
    .ak-static-page .ak-method-stat-row span { display: inline-flex; align-items: center; min-height: 36px; padding: 0 13px; border-radius: 999px; background: var(--ak-surface-soft); border: 1px solid var(--ak-line); color: var(--ak-primary-deep); font-size: .78rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
    .ak-static-page .ak-step { position: relative; overflow: hidden; padding: 24px 26px 24px 82px; border-radius: 24px; }
    .ak-static-page .ak-step::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 6px; background: linear-gradient(180deg, var(--ak-primary), var(--ak-accent)); }
    .ak-static-page .ak-step-header { margin-bottom: 10px; }
    .ak-static-page .ak-step-num { position: absolute; left: 26px; top: 24px; width: 40px; height: 40px; background: var(--ak-primary-deep); }
    .ak-static-page .ak-step-title { font-family: var(--font-body); font-size: 1.05rem; font-weight: 800; line-height: 1.25; }
    .ak-static-page .ak-step-text { max-width: 70ch; color: var(--ak-muted); font-size: 1.02rem; line-height: 1.7; }
    .ak-static-page .ak-step-tip { max-width: 68ch; border-radius: 18px; background: linear-gradient(180deg, var(--ak-accent-soft), #fff7df); }
    .ak-static-page .ak-step-tip::before { content: none; }
    .ak-static-page .ak-static-step-actions { display: grid; gap: 10px; margin-top: 16px; }
    .ak-static-page .ak-static-timer-chip { display: inline-flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 999px; background: var(--ak-surface-soft); color: var(--ak-dark); width: fit-content; }
    .ak-static-page .ak-static-timer-label { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--ak-subtle); }
    .ak-static-page .ak-static-timer-buttons { display: flex; flex-wrap: wrap; gap: 10px; }
    .ak-static-page .ak-static-timer-bar { height: 8px; border-radius: 999px; background: var(--ak-line); overflow: hidden; }
    .ak-static-page .ak-static-timer-bar-fill { height: 100%; background: linear-gradient(90deg, var(--ak-primary), var(--ak-accent)); transition: width .25s ease; }
    .ak-static-page .ak-static-helper-note { padding: 22px; margin-top: 28px; }
    .ak-static-page .ak-static-helper-note p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    .ak-static-page .ak-static-related { margin-top: 36px; }
    .ak-static-page .ak-static-related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .ak-static-page .ak-internal-link-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
    .ak-static-page .ak-internal-link-group { min-width: 0; padding: 18px; border-radius: 20px; background: var(--ak-panel); border: 1px solid var(--ak-line); box-shadow: var(--ak-shadow-sm); }
    .ak-static-page .ak-internal-link-group p { margin: 6px 0 14px; color: var(--ak-muted); line-height: 1.6; }
    .ak-static-page .ak-internal-link-list { display: grid; gap: 9px; }
    .ak-static-page .ak-internal-link { display: grid; gap: 3px; padding: 11px 12px; border-radius: 14px; background: var(--ak-bg); border: 1px solid var(--ak-line); color: var(--ak-dark); text-decoration: none; }
    .ak-static-page .ak-internal-link span { font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; }
    .ak-static-page .ak-internal-link small { color: var(--ak-muted); line-height: 1.35; }
    .ak-static-page .ak-internal-link:hover,
    .ak-static-page .ak-internal-link:focus-visible { border-color: var(--ak-primary-border); color: var(--ak-primary-deep); outline: none; }
    .ak-static-page .ak-static-recipe-card { min-width: 0; display: grid; grid-template-columns: minmax(112px, .34fr) minmax(0, 1fr); overflow: hidden; text-decoration: none; color: var(--ak-text); background: #fffdfa; border: 1px solid rgba(82,50,28,.14); border-radius: 18px; box-shadow: 0 12px 28px rgba(36,21,10,.06); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
    .ak-static-page .ak-static-recipe-card:not(.has-thumb) { grid-template-columns: 1fr; }
    .ak-static-page .ak-static-recipe-card:hover,
    .ak-static-page .ak-static-recipe-card:focus-visible { transform: translateY(-3px); border-color: rgba(199,62,29,.34); box-shadow: 0 18px 34px rgba(36,21,10,.1); outline: none; }
    .ak-static-page .ak-static-recipe-card:focus-visible { box-shadow: 0 0 0 4px rgba(199,62,29,.16), 0 18px 34px rgba(36,21,10,.1); }
    .ak-static-page .ak-static-recipe-card-thumb { min-width: 0; min-height: 100%; background: var(--ak-surface-soft); overflow: hidden; }
    .ak-static-page .ak-static-recipe-card-thumb img { display: block; width: 100%; height: 100%; min-height: 188px; object-fit: cover; }
    .ak-static-page .ak-static-recipe-card-fallback { min-height: 156px; display: grid; align-content: end; gap: 12px; padding: 18px; background:
      radial-gradient(circle at 18% 20%, rgba(15,123,67,.18), transparent 28%),
      linear-gradient(135deg, #fff7ec, #f6eadb 58%, #eef6e7); border-bottom: 1px solid rgba(82,50,28,.12); }
    .ak-static-page .ak-fallback-mark { width: 44px; height: 44px; display: inline-grid; place-items: center; border-radius: 50%; background: #2d1b12; color: #fff8ef; font-weight: 900; letter-spacing: .06em; }
    .ak-static-page .ak-fallback-copy { display: grid; gap: 4px; min-width: 0; }
    .ak-static-page .ak-fallback-copy strong { color: #2d1b12; line-height: 1.12; overflow-wrap: anywhere; }
    .ak-static-page .ak-fallback-copy small { color: #6c503b; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
    .ak-static-page .ak-static-recipe-card-body { min-width: 0; display: grid; align-content: start; gap: 12px; padding: 18px; }
    .ak-static-page .ak-static-recipe-card-badges { display: flex; flex-wrap: wrap; gap: 8px; }
    .ak-static-page .ak-static-recipe-badge { display: inline-flex; align-items: center; min-height: 28px; max-width: 100%; padding: 0 10px; border-radius: 999px; background: #fff4e6; border: 1px solid rgba(82,50,28,.12); color: #573723; font-size: .68rem; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ak-static-page .ak-static-recipe-badge:first-child { background: #f4fbef; border-color: rgba(15,123,67,.16); color: #245b35; }
    .ak-static-page .ak-static-recipe-card-title { color: var(--ak-dark); font-family: var(--font-display); font-size: clamp(1.25rem, 2vw, 1.55rem); line-height: 1.02; overflow-wrap: anywhere; }
    .ak-static-page .ak-static-recipe-card-desc { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin: 0; color: var(--ak-muted); line-height: 1.58; font-size: .93rem; }
    .ak-static-page .ak-static-recipe-card-meta { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; }
    .ak-static-page .ak-static-recipe-card-meta > span { gap: 7px; min-width: 0; max-width: 100%; padding: 7px 9px; border-radius: 12px; background: #fff6ea; border: 1px solid rgba(82,50,28,.1); color: #4c3322; font-size: .76rem; }
    .ak-static-page .ak-static-recipe-card-meta small { display: block; color: #8b6e58; font-size: .62rem; font-weight: 850; letter-spacing: .08em; line-height: 1.1; text-transform: uppercase; }
    .ak-static-page .ak-static-recipe-card-meta strong { display: block; min-width: 0; color: #2b1b12; line-height: 1.2; overflow-wrap: anywhere; }
    .ak-static-page .ak-static-recipe-card-cta { display: inline-flex; align-items: center; gap: 7px; justify-self: start; margin-top: 2px; color: var(--ak-primary-deep); font-size: .78rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
    .ak-static-page .ak-static-recipe-card:hover .ak-static-recipe-card-cta,
    .ak-static-page .ak-static-recipe-card:focus-visible .ak-static-recipe-card-cta { color: var(--ak-primary); }
    .ak-static-page .ak-static-credit { font-size: .88rem; color: var(--ak-subtle); }
    @media (max-width: 960px) {
      .ak-static-page .ak-static-summary-grid,
      .ak-static-page .ak-static-related-grid,
      .ak-static-page .ak-internal-link-grid,
      .ak-static-page .ak-photo-gallery-grid { grid-template-columns: 1fr; }
      .ak-static-page .ak-static-summary-shell { margin-top: 24px; }
      .ak-static-page .ak-photo-gallery-head { align-items: start; flex-direction: column; }
      .ak-static-page .ak-static-serving-bar,
      .ak-static-page .ak-method-head { flex-direction: column; align-items: stretch; }
    }
    @media (max-width: 560px) {
      .ak-static-page .ak-hero { padding-left: 16px; padding-right: 16px; }
      .ak-static-page .ak-hero-inner { grid-template-columns: minmax(0, 1fr); max-width: 100%; }
      .ak-static-page .ak-hero-text,
      .ak-static-page .ak-static-hero-card,
      .ak-static-page .ak-hero-stats,
      .ak-static-page .ak-hero-actions { width: 100%; max-width: 100%; }
      .ak-static-page .ak-hero-actions .ak-btn { width: 100%; }
      .ak-static-page .ak-static-facts div { display: grid; gap: 4px; }
      .ak-static-page .ak-static-facts strong { text-align: left; }
      .ak-static-page .ak-cook-shell { padding: 14px; border-radius: 22px; }
      .ak-static-page .ak-photo-main { min-height: 220px; }
      .ak-static-page .ak-photo-thumbs { grid-template-columns: 1fr; }
      .ak-static-page .ak-photo-thumbs figure { aspect-ratio: 4 / 3; }
      .ak-static-page .ak-nutrition { grid-template-columns: 1fr; }
      .ak-static-page .ak-static-recipe-card.has-thumb { grid-template-columns: 1fr; }
      .ak-static-page .ak-static-recipe-card-thumb img { min-height: 180px; }
      .ak-static-page .ak-step { padding: 76px 20px 22px; }
      .ak-static-page .ak-step-num { left: 20px; top: 20px; }
    }
  </style>
${recipeSchemaScript}${schemaBlockers.length ? `  <meta name="afrokitchen-schema-blockers" content="${escapeHtml(schemaBlockers.join(","))}">\n` : ""}
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<div class="ak-page ak-static-page">
  <section class="ak-hero"${heroStyle}>
    <div class="ak-hero-inner ak-hero-single">
      <div class="ak-hero-text">
        <nav class="ak-breadcrumb" aria-label="breadcrumb">
          <a href="/">AfroTools</a><span>/</span><a href="/tools/">Tools</a><span>/</span><a href="/tools/afrokitchen/">AfroKitchen</a><span>/</span><a href="${recipe.country_route_path}">${escapeHtml(recipe.country_name)}</a><span>/</span><span>${escapeHtml(recipe.name)}</span>
        </nav>
        <div class="ak-eyebrow">${escapeHtml(recipe.country_name)} | ${escapeHtml(categoryLabel(recipe))}</div>
        <h1>${escapeHtml(recipe.name)}</h1>
        <p class="ak-hero-sub">${escapeHtml(recipe.description)}</p>
        <div class="ak-hero-stats">
          <div class="ak-stat"><div class="ak-stat-lbl">Country</div><div class="ak-stat-val">${escapeHtml(recipe.country_name)}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Region</div><div class="ak-stat-val">${escapeHtml(recipe.region)}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Time</div><div class="ak-stat-val accent">${escapeHtml(String(recipe.total_time_minutes || 0))} min</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Serves</div><div class="ak-stat-val">${escapeHtml(String(recipe.default_servings || 1))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Level</div><div class="ak-stat-val">${escapeHtml(recipe.difficulty || "medium")}</div></div>
        </div>
        <div class="ak-hero-actions">
          <a href="${recipe.country_route_path}" class="ak-btn ak-btn-secondary">${akIcon("country", "ak-icon-sm")}<span>Explore ${escapeHtml(recipe.country_name)} recipes</span></a>
          ${recipe.primary_collection_route_path ? `<a href="${recipe.primary_collection_route_path}" class="ak-btn ak-btn-primary">${akIcon("category", "ak-icon-sm")}<span>Open ${escapeHtml(recipe.primary_collection_name)}</span></a>` : `<a href="/tools/afrokitchen/" class="ak-btn ak-btn-primary">${akIcon("shopping", "ak-icon-sm")}<span>Browse AfroKitchen</span></a>`}
        </div>
      </div>
      <aside class="ak-static-hero-card">
        <div class="ak-support-label">Kitchen snapshot</div>
        <h2>${escapeHtml(recipe.name)}</h2>
        <p>${escapeHtml(storyLead)}</p>
        <div class="ak-static-facts">
          <div><span>Best served with</span><strong>${escapeHtml(recipe.best_served_with || "Browse the country hub for pairing ideas and nearby dishes.")}</strong></div>
          <div><span>Best occasion</span><strong>${escapeHtml(recipe.occasion || "Any time you want to cook deeper into the AfroKitchen archive.")}</strong></div>
          ${recipeInsight && recipeInsight.region_lens ? `<div><span>Regional lane</span><strong>${escapeHtml(recipeInsight.region_lens.name)}</strong></div>` : ""}
          <div><span>Country hub</span><strong><a href="${recipe.country_route_path}">${escapeHtml(recipe.country_name)} cuisine hub</a></strong></div>
          ${recipe.primary_collection_slug ? `<div><span>Collection</span><strong><a href="${recipe.primary_collection_route_path}">${escapeHtml(recipe.primary_collection_name)}</a></strong></div>` : ""}
        </div>
        ${media.credit ? `<div class="ak-static-credit">${akIcon("source", "ak-icon-sm ak-icon-muted")}<span>Image sourced from ${escapeHtml(media.credit.source)} by <a href="${escapeHtml(media.credit.photographerUrl)}">${escapeHtml(media.credit.photographer)}</a>.</span></div>` : ""}
      </aside>
    </div>
  </section>

  <section class="ak-section">
    <div class="ak-container">
      <div class="ak-static-summary-shell rv visible">
        <div class="ak-section-kicker">Recipe overview</div>
        <h2 class="ak-section-title">What to know before you cook</h2>
        <p class="ak-section-sub">${escapeHtml(recipe.story || recipe.description)}</p>
        <div class="ak-static-summary-grid">
          <div class="ak-static-summary-card">
            <strong>What the dish tastes like</strong>
            <p>${escapeHtml(recipe.description)}</p>
          </div>
          <div class="ak-static-summary-card">
            <strong>When to cook it</strong>
            <p>Best for ${escapeHtml(recipeOccasionText(recipe))}. Plan on a ${escapeHtml(recipe.difficulty || "medium")} cook and about ${escapeHtml(String(recipe.total_time_minutes || 0))} minutes total.</p>
          </div>
          <div class="ak-static-summary-card">
            <strong>What to serve alongside it</strong>
            <p>${escapeHtml(recipe.best_served_with || "Use the country hub to explore pairings and nearby dishes.")}</p>
          </div>
          ${renderRecipeCollectionSummaryCard(recipe)}
          ${renderedInsightCards}
        </div>
      </div>

      ${renderedGallery}
      ${renderedPairingRail}
      ${renderedSocialPlate}

      <div class="ak-cook-shell">
        <div class="ak-static-serving-bar">
          <div class="ak-servings">
            <span class="ak-servings-label">Servings</span>
            <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(-1)" aria-label="Decrease servings">-</button>
            <span class="ak-servings-val" id="ak-static-servings">${escapeHtml(String(recipe.default_servings || 1))}</span>
            <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(1)" aria-label="Increase servings">+</button>
          </div>
          <p class="ak-static-serving-note">Scale the dish before you shop, then use the checklist while you cook.</p>
        </div>

        <div class="ak-recipe-layout">
          <aside class="ak-ingredients-panel">
            <div class="ak-panel-title-row">
              <div>
                <h2 class="ak-panel-title">Ingredients</h2>
                <p class="ak-panel-helper">For ${escapeHtml(String(recipe.default_servings || 1))} ${escapeHtml(recipe.serving_unit || "servings")}</p>
              </div>
              <span class="ak-panel-pill">${escapeHtml(categoryLabel(recipe))}</span>
            </div>
            <div id="ak-static-ingredients">${renderedIngredients}</div>
            ${renderedNutrition ? `<div class="ak-ingredients-footer"><h3 class="ak-mini-title">Nutrition estimate</h3>${renderedNutrition}</div>` : ""}
          </aside>

          <section class="ak-method-panel">
            <div class="ak-method-head">
              <div>
                <div class="ak-panel-kicker">How to cook it</div>
                <h2 class="ak-panel-title">Step-by-step method</h2>
                <p class="ak-method-sub">Keep the rhythm calm, watch the texture, and adjust seasoning at the end.</p>
              </div>
              <a class="ak-btn ak-btn-outline" href="${recipe.country_route_path}">${akIcon("country", "ak-icon-sm")}<span>Back to ${escapeHtml(recipe.country_name)}</span></a>
            </div>
            <div class="ak-method-stat-row">
              <span>${akIcon("check", "ak-icon-sm")}${escapeHtml(String((recipe.steps || []).length))} steps</span>
              <span>${akIcon("time", "ak-icon-sm")}${escapeHtml(String(recipe.prep_time_minutes || 0))} min prep</span>
              <span>${akIcon("timer", "ak-icon-sm")}${escapeHtml(String(recipe.cook_time_minutes || 0))} min cook</span>
              <span>${akIcon("time", "ak-icon-sm")}${escapeHtml(String(recipe.total_time_minutes || 0))} min total</span>
              <span>${akIcon("difficulty", "ak-icon-sm")}${escapeHtml(recipe.difficulty || "medium")}</span>
            </div>
            <div class="ak-steps">${renderedSteps}</div>
            <div class="ak-static-helper-note">
              <p>${akIcon("warning", "ak-icon-sm ak-icon-accent")}<span>${escapeHtml(recipe.regional_variations || "Every household has small variations. Start here, then adjust seasoning, heat, and serving sides to your kitchen.")}</span></p>
            </div>
          </section>
        </div>
      </div>

      ${relatedSection}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
<script src="/assets/js/components/footer.min.js?v=f68d6568" defer></script>
<script src="/engines/afrokitchen-engine.js?v=3"></script>
<script>window.__AK_STATIC_RECIPE = ${safeJson(recipeData)};</script>
<script src="/tools/afrokitchen/static-recipe-runtime.js?v=20260612a" defer></script>
</body>
</html>
`;
}

function buildCountrySchemas(country) {
  const faqPageSchema = buildCountryFaqSchema(country);
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${country.country_name} Recipes | Traditional Dishes & Food Guide | AfroKitchen`,
    description: buildCountryMetaDescription(country),
    url: country.route_url,
    isPartOf: {
      "@type": "WebSite",
      name: "AfroTools",
      url: `${SITE_ORIGIN}/`
    },
    about: {
      "@type": "Place",
      name: country.country_name
    }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${country.country_name} recipe archive`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: country.recipes.length,
    itemListElement: country.recipes.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: recipe.name,
      url: recipe.generated_in_wave ? recipe.route_url : recipe.fallback_url
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AfroTools",
        item: `${SITE_ORIGIN}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${SITE_ORIGIN}/tools/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "AfroKitchen",
        item: `${SITE_ORIGIN}/tools/afrokitchen/`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: country.country_name,
        item: country.route_url
      }
    ]
  };

  return { collectionPageSchema, itemListSchema, breadcrumbSchema, faqPageSchema };
}

function buildCollectionSchemas(collection) {
  const description = buildCollectionMetaDescription(collection);
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${collection.name} Recipes Collection | AfroKitchen`,
    description,
    url: collection.route_url,
    isPartOf: {
      "@type": "WebSite",
      name: "AfroTools",
      url: `${SITE_ORIGIN}/`
    },
    about: {
      "@type": "Thing",
      name: collection.name
    }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${collection.name} recipe collection`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: collection.recipes.length,
    itemListElement: collection.recipes.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: recipe.name,
      url: recipe.generated_in_wave ? recipe.route_url : recipe.fallback_url
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AfroTools",
        item: `${SITE_ORIGIN}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${SITE_ORIGIN}/tools/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "AfroKitchen",
        item: `${SITE_ORIGIN}/tools/afrokitchen/`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: collection.name,
        item: collection.route_url
      }
    ]
  };

  return { collectionPageSchema, itemListSchema, breadcrumbSchema };
}

function pickNeighborCountries(country, manifest) {
  return manifest.countries
    .filter(
      (entry) =>
        entry.country_code !== country.country_code && entry.region === country.region
    )
    .slice(0, 4);
}

function renderCountryRecipeCards(country, recipeImages) {
  return country.recipes
    .map((recipe) => renderStaticRecipeCard(recipe, recipeImages))
    .join("\n");
}

function renderNeighborCountryLinks(country, manifest) {
  const neighbors = pickNeighborCountries(country, manifest);
  if (!neighbors.length) return "";
  const hasFallbackRecipes = country.recipes.some((recipe) => !recipe.generated_in_wave);

  return `<section class="ak-section ak-static-related">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Keep browsing</div>
      <h2 class="ak-section-title">More ${escapeHtml(country.region)} country hubs</h2>
      <p class="ak-section-sub">${hasFallbackRecipes ? "Explore nearby cuisines while this country surface keeps every verified dish easy to reach." : "Explore nearby cuisines and keep building a meal from the same region."}</p>
    </div>
    <div class="ak-hero-route-grid">
      ${neighbors
        .map(
          (neighbor) =>
            `<a class="ak-support-link" href="${neighbor.route_path}">${escapeHtml(neighbor.country_name)}</a>`
        )
        .join("\n")}
    </div>
  </section>`;
}

function renderCountryCollectionLinks(country) {
  if (!country.related_collections || !country.related_collections.length) return "";

  return `<section class="ak-section ak-static-related">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Collections</div>
      <h2 class="ak-section-title">Collections that include ${escapeHtml(country.country_name)}</h2>
      <p class="ak-section-sub">Use these collections when you want a faster path into party dishes, one-pot meals, street food, or vegetable-forward cooking.</p>
    </div>
    <div class="ak-hero-route-grid">
      ${country.related_collections
        .map(
          (collection) =>
            `<a class="ak-support-link" href="${collection.route_path}">${escapeHtml(collection.name)} (${escapeHtml(String(collection.recipe_count))})</a>`
        )
        .join("\n")}
    </div>
  </section>`;
}

const COUNTRY_CATEGORY_ORDER = [
  "main",
  "stew",
  "breakfast",
  "snack",
  "dessert",
  "drink",
  "side",
  "soup",
  "rice",
  "street_food",
  "sauce",
  "soup_stew",
  "starter"
];

function countryFeaturedRecipes(country, limit) {
  return (country.recipes || [])
    .slice()
    .sort(
      (left, right) =>
        Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
        Number(Boolean(right.generated_in_wave)) - Number(Boolean(left.generated_in_wave)) ||
        (left.total_time_minutes || 9999) - (right.total_time_minutes || 9999) ||
        left.name.localeCompare(right.name)
    )
    .slice(0, limit || 4);
}

function countryCategoryGroups(country) {
  const groups = new Map();
  (country.recipes || []).forEach((recipe) => {
    const key = recipe.category || "recipe";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(recipe);
  });

  return Array.from(groups.entries())
    .map(([category, recipes]) => ({
      category,
      label: categoryLabel({ category }),
      recipes: recipes
        .slice()
        .sort(
          (left, right) =>
            Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
            Number(Boolean(right.generated_in_wave)) - Number(Boolean(left.generated_in_wave)) ||
            (left.total_time_minutes || 9999) - (right.total_time_minutes || 9999) ||
            left.name.localeCompare(right.name)
        )
    }))
    .sort((left, right) => {
      const leftIndex = COUNTRY_CATEGORY_ORDER.indexOf(left.category);
      const rightIndex = COUNTRY_CATEGORY_ORDER.indexOf(right.category);
      const normalizedLeft = leftIndex === -1 ? COUNTRY_CATEGORY_ORDER.length : leftIndex;
      const normalizedRight = rightIndex === -1 ? COUNTRY_CATEGORY_ORDER.length : rightIndex;
      return normalizedLeft - normalizedRight || right.recipes.length - left.recipes.length || left.label.localeCompare(right.label);
    });
}

function commonCountryIngredients(country, limit) {
  const counts = new Map();
  (country.recipes || []).forEach((recipe) => {
    (recipe.ingredients || []).forEach((ingredient) => {
      const name = String(ingredient && ingredient.name ? ingredient.name : "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      const current = counts.get(key) || { name, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });
  });

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit || 8)
    .map((entry) => entry.name);
}

function buildCountryIntroParagraph(country) {
  const categoryNames = humanList(countryCategoryGroups(country).map((group) => group.label.toLowerCase()), 4);
  const dishNames = humanList(countryFeaturedRecipes(country, 3).map((recipe) => recipe.name), 3);
  const ingredientNames = humanList(commonCountryIngredients(country, 4), 4);
  const categoryCopy = categoryNames ? ` across ${categoryNames}` : "";
  const dishCopy = dishNames ? ` Good starting points include ${dishNames}.` : "";
  const ingredientCopy = ingredientNames ? ` The stored recipes often use ingredients such as ${ingredientNames}.` : "";

  return `This ${country.region || "African"} country hub organizes ${country.total_recipes} ${country.country_name} recipes from the AfroKitchen atlas${categoryCopy}. Use it to compare dishes, cooking time, difficulty, and practical recipe links without leaving the country page.${dishCopy}${ingredientCopy}`;
}

function firstCountryRecipeToCook(country) {
  return (country.recipes || [])
    .slice()
    .sort(
      (left, right) =>
        Number(Boolean(right.generated_in_wave)) - Number(Boolean(left.generated_in_wave)) ||
        Number(String(right.difficulty || "").toLowerCase() === "easy") -
          Number(String(left.difficulty || "").toLowerCase() === "easy") ||
        (left.total_time_minutes || 9999) - (right.total_time_minutes || 9999) ||
        Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
        left.name.localeCompare(right.name)
    )[0];
}

function buildCountryFaqItems(country) {
  const featuredNames = humanList(countryFeaturedRecipes(country, 5).map((recipe) => recipe.name), 5);
  const ingredients = humanList(commonCountryIngredients(country, 8), 8);
  const firstRecipe = firstCountryRecipeToCook(country);
  const firstRecipeCopy = firstRecipe
    ? `${firstRecipe.name} is a practical first pick from this hub${firstRecipe.total_time_minutes ? ` at about ${firstRecipe.total_time_minutes} minutes` : ""}.`
    : `Start with the shortest complete recipe in the ${country.country_name} hub, then use the category lanes to choose another dish.`;

  return [
    {
      question: `What are popular dishes from ${country.country_name}?`,
      answer: featuredNames
        ? `Popular starting points in this AfroKitchen country hub include ${featuredNames}.`
        : `Use the recipe list on this page to compare available ${country.country_name} dishes.`
    },
    {
      question: `What ingredients are common in ${country.country_name} cooking?`,
      answer: ingredients
        ? `In the stored ${country.country_name} recipes, common ingredients include ${ingredients}.`
        : `Open the listed recipes to compare their ingredient lists.`
    },
    {
      question: `What can I cook first from ${country.country_name}?`,
      answer: firstRecipeCopy
    }
  ];
}

function buildCountryFaqSchema(country) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: buildCountryFaqItems(country).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function renderCountryFeaturedDishes(country, recipeImages) {
  const recipes = countryFeaturedRecipes(country, 4);
  if (!recipes.length) return "";

  return `<section class="ak-section ak-static-related ak-country-featured-section">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Featured dishes</div>
      <h2 class="ak-section-title">Start with these ${escapeHtml(country.country_name)} recipes</h2>
      <p class="ak-section-sub">These cards are selected from the stored country hub, prioritizing featured and ready-to-cook recipes.</p>
    </div>
    <div class="ak-static-related-grid">${recipes.map((recipe) => renderStaticRecipeCard(recipe, recipeImages)).join("\n")}</div>
  </section>`;
}

function renderCountryCategoryLanes(country) {
  const groups = countryCategoryGroups(country);
  if (!groups.length) return "";

  return `<section class="ak-section ak-country-category-section">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Recipe categories</div>
      <h2 class="ak-section-title">Browse ${escapeHtml(country.country_name)} dishes by course</h2>
      <p class="ak-section-sub">Jump into the category that matches the way you want to cook: main dishes, stews, soups, snacks, sides, breakfast, desserts, drinks, and more where available.</p>
    </div>
    <div class="ak-country-category-grid">
      ${groups
        .map(
          (group) => `<article class="ak-country-category-card">
        <div class="ak-support-label">${escapeHtml(String(group.recipes.length))} ${group.recipes.length === 1 ? "recipe" : "recipes"}</div>
        <h3 id="category-${escapeHtml(group.category)}">${escapeHtml(group.label)}</h3>
        <div class="ak-region-recipe-list">
          ${group.recipes
            .slice(0, 6)
            .map((recipe) => `<a href="${escapeHtml(resolveRecipeHref(recipe))}">${escapeHtml(recipe.name)}</a>`)
            .join("")}
        </div>
      </article>`
        )
        .join("\n")}
    </div>
  </section>`;
}

function renderCountryPopularCategoryLinks(country) {
  const groups = countryCategoryGroups(country).slice(0, 6);
  if (!groups.length) return "";

  return `<section class="ak-section ak-country-category-links">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Popular category links</div>
      <h2 class="ak-section-title">Quick paths through ${escapeHtml(country.country_name)} recipes</h2>
      <p class="ak-section-sub">Jump by dish type, then open a specific recipe card with full ingredients and method.</p>
    </div>
    <div class="ak-hero-route-grid">
      ${groups
        .map(
          (group) =>
            `<a class="ak-support-link" href="#category-${escapeHtml(group.category)}">${akIcon("category", "ak-icon-sm")}<span>${escapeHtml(group.label)} recipes from ${escapeHtml(country.country_name)} (${escapeHtml(String(group.recipes.length))})</span></a>`
        )
        .join("\n")}
    </div>
  </section>`;
}

function renderCountryFaq(country) {
  const items = buildCountryFaqItems(country);
  if (!items.length) return "";

  return `<section class="ak-section ak-country-faq-section">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Country FAQ</div>
      <h2 class="ak-section-title">Cooking ${escapeHtml(country.country_name)} from the AfroKitchen atlas</h2>
      <p class="ak-section-sub">Short answers based on the recipes currently stored in this country hub.</p>
    </div>
    <div class="ak-country-faq-list">
      ${items
        .map(
          (item) => `<article class="ak-country-faq-card">
        <h3>${escapeHtml(item.question)}</h3>
        <p>${escapeHtml(item.answer)}</p>
      </article>`
        )
        .join("\n")}
    </div>
  </section>`;
}

function renderCollectionRecipeCards(collection, recipeImages) {
  return collection.recipes
    .map((recipe) => renderStaticRecipeCard(recipe, recipeImages))
    .join("\n");
}

function renderCollectionCountryLinks(collection) {
  if (!collection.related_countries || !collection.related_countries.length) return "";

  const visibleCountries = collection.related_countries.slice(0, 6);
  const additionalCountries = collection.country_count - visibleCountries.length;
  return `<section class="ak-section ak-static-related">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Country hubs</div>
      <h2 class="ak-section-title">Countries behind ${escapeHtml(collection.name)}</h2>
      <p class="ak-section-sub">Jump from the collection back into the countries behind the dishes.</p>
    </div>
    <div class="ak-hero-route-grid">
      ${visibleCountries
        .map(
          (country) =>
            `<a class="ak-support-link" href="${country.route_path}">${akIcon("country", "ak-icon-sm")}<span>${escapeHtml(country.country_name)} (${escapeHtml(String(country.recipe_count))})</span></a>`
        )
        .join("\n")}
    </div>
    ${additionalCountries > 0 ? `<p class="ak-section-sub">This collection also touches ${escapeHtml(String(additionalCountries))} more country hubs across AfroKitchen.</p>` : ""}
  </section>`;
}

const COLLECTION_EDITORIAL_COPY = {
  "quick-and-easy": {
    intro: "A weeknight-friendly collection for African dishes with shorter cooking windows, simple serving logic, and direct recipe paths.",
    bestFor: "Busy weeknights, first-time AfroKitchen browsing, and quick sides, drinks, snacks, or mains when time is tight."
  },
  "vegetarian-africa": {
    intro: "A vegetable, bean, grain, and sauce-forward path through the AfroKitchen atlas, built from recipes that do not need meat to carry the table.",
    bestFor: "Meat-free planning, fasting-style meals where data supports it, vegetable sides, legumes, grains, and lighter shared plates."
  },
  "one-pot-wonders": {
    intro: "A practical collection for rice dishes, stews, soups, and simmered meals where one pot does most of the work.",
    bestFor: "Batch cooking, family meals, low-cleanup weekends, and dishes that build flavor in one pot or pan."
  },
  "street-food": {
    intro: "A market-food route through snacks, grills, fritters, breads, and handheld dishes from the AfroKitchen atlas.",
    bestFor: "Casual hosting, snack boards, small plates, and fast-moving dishes with clear country links."
  },
  "sunday-specials": {
    intro: "A slower-cooking collection for stews, soups, mains, and shared dishes that suit a longer weekend table.",
    bestFor: "Sunday lunch, family cooking, celebratory mains, and recipes where time and serving sides matter."
  },
  "breakfast-and-tea-table": {
    intro: "A breakfast and tea-table collection for porridges, breads, drinks, fritters, and morning-friendly dishes.",
    bestFor: "Breakfast planning, tea service, weekend brunch, and gentle entry points into country hubs."
  },
  "across-africa-showstoppers": {
    intro: "A showcase board for visually strong, table-centering dishes from across the AfroKitchen atlas.",
    bestFor: "Party tables, photo-ready finished dishes, celebratory cooking, and browsing standout recipes across countries."
  },
  "nigerian-regional-table": {
    intro: "A Nigeria-focused collection that keeps regional dishes, soups, swallows, street foods, and party plates connected.",
    bestFor: "Exploring Nigeria by region, building a fuller table, and moving from one Nigerian dish to the next with context."
  },
  "west-african-street-food": {
    intro: "A West African street-food collection for grills, fritters, fried snacks, drinks, and market-style plates.",
    bestFor: "Snack nights, casual parties, street-food boards, and quick links into West African country hubs."
  }
};

function collectionCategoryGroups(collection) {
  const groups = new Map();
  (collection.recipes || []).forEach((recipe) => {
    const key = recipe.category || "recipe";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(recipe);
  });

  return Array.from(groups.entries())
    .map(([category, recipes]) => ({
      category,
      label: categoryLabel({ category }),
      recipes: recipes.slice().sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) => right.recipes.length - left.recipes.length || left.label.localeCompare(right.label));
}

function collectionCountryNames(collection, limit) {
  return (collection.related_countries || [])
    .slice(0, limit || 5)
    .map((country) => country.country_name);
}

function collectionCategoryNames(collection, limit) {
  return collectionCategoryGroups(collection)
    .slice(0, limit || 4)
    .map((group) => group.label.toLowerCase());
}

function collectionTimeSummary(collection) {
  const times = (collection.recipes || [])
    .map((recipe) => Number(recipe.total_time_minutes || 0))
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  if (!times.length) return "";
  const min = times[0];
  const max = times[times.length - 1];
  return min === max ? `${min} minutes` : `${min}-${max} minutes`;
}

function getCollectionEditorialCopy(collection) {
  const custom = COLLECTION_EDITORIAL_COPY[collection.slug];
  if (custom) return custom;

  const categories = humanList(collectionCategoryNames(collection, 3), 3);
  const countries = humanList(collectionCountryNames(collection, 3), 3);
  const intro = `${collection.name} gathers ${collection.total_recipes} AfroKitchen recipes${categories ? ` across ${categories}` : ""}${countries ? `, with country links for ${countries}` : ""}.`;
  const bestFor = `Use it when you want a focused cooking lane from the AfroKitchen atlas instead of browsing every country hub one by one.`;
  return { intro, bestFor };
}

function buildCollectionIntroParagraph(collection) {
  const copy = getCollectionEditorialCopy(collection);
  const countries = humanList(collectionCountryNames(collection, 4), 4);
  const categories = humanList(collectionCategoryNames(collection, 4), 4);
  const time = collectionTimeSummary(collection);
  const pieces = [copy.intro];
  if (countries) pieces.push(`It currently spans ${countries}.`);
  if (categories) pieces.push(`Recipe types include ${categories}.`);
  if (time) pieces.push(`Cooking times in this collection run about ${time}.`);
  return pieces.join(" ");
}

function buildCollectionBestForCopy(collection) {
  return getCollectionEditorialCopy(collection).bestFor;
}

function buildCollectionShareText(collection) {
  const countries = humanList(collectionCountryNames(collection, 2), 2);
  return `${collection.name} - ${collection.total_recipes} African recipes${countries ? ` from ${countries} and more` : ""} on AfroKitchen`;
}

function renderCollectionBestForPanel(collection) {
  const categories = collectionCategoryGroups(collection).slice(0, 5);
  const time = collectionTimeSummary(collection);

  return `<section class="ak-intel-panel ak-collection-best-panel">
    <div>
      <div class="ak-section-kicker">Best for</div>
      <h2 class="ak-section-title">When to use ${escapeHtml(collection.name)}</h2>
      <p class="ak-section-sub">${escapeHtml(buildCollectionBestForCopy(collection))}</p>
    </div>
    <div class="ak-intel-split">
      <div class="ak-intel-mini">
        <strong>Cooking lane</strong>
        <p>${escapeHtml(categories.length ? humanList(categories.map((group) => group.label.toLowerCase()), 4) : "A focused recipe set from the AfroKitchen atlas")}</p>
      </div>
      <div class="ak-intel-mini">
        <strong>Time window</strong>
        <p>${escapeHtml(time || "Open each card for its stored cooking time.")}</p>
      </div>
    </div>
  </section>`;
}

function renderCollectionShareIntro(collection) {
  const shareText = buildCollectionShareText(collection);
  const encodedUrl = encodeURIComponent(collection.route_url);
  const encodedText = encodeURIComponent(shareText);

  return `<section class="ak-section ak-collection-share-section">
    <div class="ak-collection-share-card rv visible">
      <div>
        <div class="ak-section-eyebrow">Shareable intro</div>
        <h2 class="ak-section-title">${escapeHtml(collection.name)} on AfroKitchen</h2>
        <p>${escapeHtml(shareText)}</p>
      </div>
      <div class="ak-collection-share-actions">
        <a class="ak-support-link" href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener">${akIcon("share", "ak-icon-sm")}<span>Share on WhatsApp</span></a>
        <a class="ak-support-link" href="https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}" target="_blank" rel="noopener">${akIcon("share", "ak-icon-sm")}<span>Share on X</span></a>
        <a class="ak-support-link" href="${collection.route_path}">${akIcon("source", "ak-icon-sm")}<span>Open canonical link</span></a>
      </div>
    </div>
  </section>`;
}

function pickRelatedCollections(collection, manifest) {
  const currentCategories = new Set((collection.recipes || []).map((recipe) => recipe.category).filter(Boolean));
  const currentCountries = new Set((collection.related_countries || []).map((country) => country.country_code).filter(Boolean));
  return (manifest.collections || [])
    .filter((entry) => entry.slug !== collection.slug)
    .map((entry) => {
      const categoryOverlap = (entry.recipes || []).filter((recipe) => currentCategories.has(recipe.category)).length;
      const countryOverlap = (entry.related_countries || []).filter((country) => currentCountries.has(country.country_code)).length;
      const score = categoryOverlap * 2 + countryOverlap + Number(Boolean(entry.is_featured));
      return { ...entry, related_score: score };
    })
    .sort(
      (left, right) =>
        (right.related_score || 0) - (left.related_score || 0) ||
        Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 4);
}

function renderRelatedCollectionLinks(collection, manifest) {
  const related = pickRelatedCollections(collection, manifest);
  if (!related.length) return "";

  return `<section class="ak-section ak-static-related">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Related collections</div>
      <h2 class="ak-section-title">Keep cooking after ${escapeHtml(collection.name)}</h2>
      <p class="ak-section-sub">Move into another focused lane without losing the country and recipe context behind this collection.</p>
    </div>
    <div class="ak-collection-related-grid">
      ${related
        .map((entry) => {
          const countries = humanList(collectionCountryNames(entry, 2), 2);
          return `<a class="ak-collection-related-card" href="${entry.route_path}">
        <span class="ak-support-label">${akIcon("category", "ak-icon-sm")}${escapeHtml(String(entry.total_recipes))} recipes</span>
        <strong>${escapeHtml(entry.name)}</strong>
        <small>${escapeHtml(countries || "AfroKitchen collection")}</small>
      </a>`;
        })
        .join("\n")}
    </div>
  </section>`;
}

function renderCollectionEmptyState(collection, manifest) {
  const countries = (collection.related_countries || []).slice(0, 3);
  const related = pickRelatedCollections(collection, manifest).slice(0, 3);
  return `<div class="ak-collection-empty-state">
    <div class="ak-section-kicker">Small collection</div>
    <h2>${escapeHtml(collection.name)} is still a short shelf</h2>
    <p>This collection has ${escapeHtml(String(collection.total_recipes))} ${collection.total_recipes === 1 ? "recipe" : "recipes"} right now. Use the country and related collection links while more recipes are reviewed into this lane.</p>
    <div class="ak-hero-route-grid">
      ${countries.map((country) => `<a class="ak-support-link" href="${country.route_path}">${akIcon("country", "ak-icon-sm")}<span>${escapeHtml(country.country_name)} recipes</span></a>`).join("")}
      ${related.map((entry) => `<a class="ak-support-link" href="${entry.route_path}">${akIcon("category", "ak-icon-sm")}<span>${escapeHtml(entry.name)}</span></a>`).join("")}
      <a class="ak-support-link" href="/tools/afrokitchen/">${akIcon("shopping", "ak-icon-sm")}<span>Browse all AfroKitchen recipes</span></a>
    </div>
  </div>`;
}

function renderCollectionArchive(collection, manifest, recipeImages) {
  const isSmall = collection.total_recipes < 3;
  const cards = renderCollectionRecipeCards(collection, recipeImages);

  return `<div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Collection archive</div>
        <h2 class="ak-section-title">Dishes inside ${escapeHtml(collection.name)}</h2>
        <p class="ak-section-sub">${escapeHtml(
          isSmall
            ? "This collection is intentionally small today, so the page points you toward nearby country hubs and related collections."
            : "Open any dish below for ingredients, story, timing, serving notes, and pairings."
        )}</p>
        ${
          isSmall
            ? `${renderCollectionEmptyState(collection, manifest)}
        ${cards ? `<div class="ak-country-hub-grid">${cards}</div>` : ""}`
            : `<div class="ak-country-hub-grid">${cards}</div>
        <div class="ak-country-archive-note">
          <p>${collection.generated_recipe_count < collection.total_recipes ? `${escapeHtml(collection.name)} has ${escapeHtml(String(collection.total_recipes - collection.generated_recipe_count))} more dishes queued for deeper cooking pages.` : `Every recipe linked from ${escapeHtml(collection.name)} is ready to open from the card above.`}</p>
        </div>`
        }
      </div>`;
}

function buildCountryPageHtml(country, manifest, cuisineIntelligence, recipeImages) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema, faqPageSchema } = buildCountrySchemas(country);
  const title = `${country.country_name} Recipes | Traditional Dishes & Food Guide | AfroKitchen`;
  const description = buildCountryMetaDescription(country);
  const introParagraph = buildCountryIntroParagraph(country);
  const featuredDishes = renderCountryFeaturedDishes(country, recipeImages);
  const popularCategoryLinks = renderCountryPopularCategoryLinks(country);
  const categoryLanes = renderCountryCategoryLanes(country);
  const countryRegionalAtlas = renderCountryRegionalAtlas(country, cuisineIntelligence);
  const countryPantryGuide = renderCountryPantryGuide(country, cuisineIntelligence);
  const countryFaq = renderCountryFaq(country);
  const generatedRecipeLead =
    country.generated_recipe_count === country.total_recipes
      ? `${country.total_recipes} dishes are ready to open and cook`
      : country.generated_recipe_count
        ? `${country.generated_recipe_count} of ${country.total_recipes} dishes are ready to open and cook`
        : "This hub is ready for browsing, with more detail pages coming into the full cooking experience.";
  const recipeListCopy =
    country.generated_recipe_count === country.total_recipes
      ? "Open any dish below for ingredients, story, timing, serving notes, and pairings."
      : "Open any dish below to start cooking, then keep exploring the rest of this country hub.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${country.route_url}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${TOOL_OG_IMAGE}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${country.route_url}">
  <meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${TOOL_OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${AK_FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${AK_FONT_HREF}"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=b8aa6b54">
  <link rel="stylesheet" href="/tools/afrokitchen/style.css?v=20260424a">
  <link rel="stylesheet" href="/tools/afrokitchen/icon-system.css?v=20260612a">
  <link rel="stylesheet" href="/tools/afrokitchen/cuisine-intelligence.css?v=20260501a">
  <link rel="stylesheet" href="/tools/afrokitchen/responsive-fixes.css?v=20260425a">
  <style>
    .ak-country-static-page .ak-country-hub-shell,
    .ak-country-static-page .ak-country-hub-card,
    .ak-country-static-page .ak-country-archive-note { background: var(--ak-panel); border: 1px solid var(--ak-line); border-radius: var(--ak-radius); box-shadow: var(--ak-shadow-card); }
    .ak-country-static-page .ak-country-hub-shell { padding: 28px; margin-top: -48px; position: relative; z-index: 2; }
    .ak-country-static-page .ak-country-hub-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
    .ak-country-static-page .ak-country-hub-card { padding: 20px; text-decoration: none; display: grid; gap: 10px; }
    .ak-country-static-page .ak-country-hub-card h3 { margin: 0; color: var(--ak-dark); font-size: 1.2rem; }
    .ak-country-static-page .ak-country-hub-card p { margin: 0; color: var(--ak-muted); line-height: 1.65; }
    .ak-country-static-page .ak-country-intro-panel { margin-top: 26px; padding: 24px; border-radius: 24px; background: rgba(255,255,255,.76); border: 1px solid var(--ak-line); box-shadow: var(--ak-shadow-sm); }
    .ak-country-static-page .ak-country-intro-panel p { margin: 0; max-width: 78ch; color: var(--ak-muted); font-size: 1.02rem; line-height: 1.75; }
    .ak-country-static-page .ak-country-category-grid,
    .ak-country-static-page .ak-country-faq-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .ak-country-static-page .ak-country-category-card,
    .ak-country-static-page .ak-country-faq-card { min-width: 0; padding: 20px; border-radius: 22px; background: var(--ak-panel); border: 1px solid var(--ak-line); box-shadow: var(--ak-shadow-card); }
    .ak-country-static-page .ak-country-category-card h3,
    .ak-country-static-page .ak-country-faq-card h3 { margin: 0 0 12px; color: var(--ak-dark); font-family: var(--font-display); font-size: 1.35rem; line-height: 1.05; }
    .ak-country-static-page .ak-country-faq-card p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    .ak-country-static-page .ak-country-archive-note { padding: 22px; margin-top: 26px; }
    .ak-country-static-page .ak-country-archive-note p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    @media (max-width: 960px) {
      .ak-country-static-page .ak-country-hub-grid,
      .ak-country-static-page .ak-country-category-grid,
      .ak-country-static-page .ak-country-faq-list { grid-template-columns: 1fr; }
      .ak-country-static-page .ak-country-hub-shell { margin-top: 24px; }
    }
  </style>
  <script type="application/ld+json">${safeJson(collectionPageSchema)}</script>
  <script type="application/ld+json">${safeJson(itemListSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
  <script type="application/ld+json">${safeJson(faqPageSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<div class="ak-page ak-country-static-page">
  <section class="ak-hero">
    <div class="ak-hero-inner ak-hero-single">
      <div class="ak-hero-text">
        <nav class="ak-breadcrumb" aria-label="breadcrumb">
          <a href="/">AfroTools</a><span>/</span><a href="/tools/">Tools</a><span>/</span><a href="/tools/afrokitchen/">AfroKitchen</a><span>/</span><span>${escapeHtml(country.country_name)}</span>
        </nav>
        <div class="ak-hero-badges">
          <span class="ak-badge ak-badge-live">Country hub</span>
          <span class="ak-badge ak-badge-atlas">${escapeHtml(country.region)}</span>
        </div>
        <div class="ak-eyebrow">${escapeHtml(country.region)}</div>
        <h1>${escapeHtml(country.country_name)} Recipes</h1>
        <p class="ak-hero-sub">${escapeHtml(introParagraph)}</p>
        <div class="ak-hero-stats">
          <div class="ak-stat"><div class="ak-stat-lbl">Recipes</div><div class="ak-stat-val accent">${escapeHtml(String(country.total_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Featured dishes</div><div class="ak-stat-val">${escapeHtml(String(country.featured_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Ready to cook</div><div class="ak-stat-val">${escapeHtml(String(country.generated_recipe_count))}</div></div>
        </div>
        <div class="ak-hero-actions">
          <a href="/tools/afrokitchen/" class="ak-btn ak-btn-secondary">Browse AfroKitchen</a>
          <a href="/tools/afrokitchen/#collections-grid" class="ak-btn ak-btn-outline">Browse collections</a>
        </div>
      </div>
      <div class="ak-hero-facts">
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Country table</div>
          <span class="ak-fact-card-value">${escapeHtml(String(country.total_recipes))}</span>
          <p class="ak-fact-card-copy">${escapeHtml(humanList(countryFeaturedRecipes(country, 3).map((recipe) => recipe.name), 3) || `Dishes from ${country.country_name}`)}</p>
        </div>
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">What to expect</div>
          <p class="ak-fact-card-copy">${escapeHtml(generatedRecipeLead)}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="ak-section">
    <div class="ak-container">
      <div class="ak-country-intro-panel rv visible">
        <p>${escapeHtml(introParagraph)}</p>
      </div>

      ${featuredDishes}
      ${popularCategoryLinks}
      ${categoryLanes}

      <div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Country archive</div>
        <h2 class="ak-section-title">All ${escapeHtml(country.country_name)} recipes in one place</h2>
        <p class="ak-section-sub">${escapeHtml(recipeListCopy)}</p>
        <div class="ak-country-hub-grid">
          ${renderCountryRecipeCards(country, recipeImages)}
        </div>
        <div class="ak-country-archive-note">
          <p>${country.generated_recipe_count < country.total_recipes ? `${escapeHtml(country.country_name)} has ${escapeHtml(String(country.total_recipes - country.generated_recipe_count))} more dishes queued for deeper cooking pages.` : `Every ${escapeHtml(country.country_name)} recipe in this country hub is ready to open from the card above.`}</p>
        </div>
      </div>

      ${countryPantryGuide}
      ${countryRegionalAtlas}
      ${renderCountryCollectionLinks(country)}
      ${renderNeighborCountryLinks(country, manifest)}
      ${countryFaq}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
<script src="/assets/js/components/footer.min.js?v=f68d6568" defer></script>
</body>
</html>
`;
}

function buildCollectionPageHtml(collection, manifest, cuisineIntelligence, recipeImages) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema } =
    buildCollectionSchemas(collection);
  const title = `${collection.name} | African Recipe Collection | AfroKitchen`;
  const description = buildCollectionMetaDescription(collection);
  const introParagraph = buildCollectionIntroParagraph(collection);
  const bestForPanel = renderCollectionBestForPanel(collection);
  const shareIntro = renderCollectionShareIntro(collection);
  const collectionArchive = renderCollectionArchive(collection, manifest, recipeImages);
  const relatedCollections = renderRelatedCollectionLinks(collection, manifest);
  const collectionIntelligence = renderCollectionIntelligence(collection, cuisineIntelligence);
  const collectionSocialShowcase = renderCollectionSocialShowcase(collection, cuisineIntelligence);
  const generatedRecipeLead =
    collection.generated_recipe_count === collection.total_recipes
      ? `${collection.total_recipes} dishes are ready to open from this collection`
      : collection.generated_recipe_count
        ? `${collection.generated_recipe_count} of ${collection.total_recipes} dishes are ready to open from this collection`
        : "This collection is ready for browsing, with more detail pages coming into the full cooking experience.";
  const recipeListCopy =
    collection.generated_recipe_count === collection.total_recipes
      ? "Open any dish below for ingredients, story, timing, serving notes, and pairings."
      : "Open any dish below to start cooking, then keep exploring the rest of this collection.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${collection.route_url}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${TOOL_OG_IMAGE}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${collection.route_url}">
  <meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${TOOL_OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${AK_FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${AK_FONT_HREF}"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=b8aa6b54">
  <link rel="stylesheet" href="/tools/afrokitchen/style.css?v=20260424a">
  <link rel="stylesheet" href="/tools/afrokitchen/icon-system.css?v=20260612a">
  <link rel="stylesheet" href="/tools/afrokitchen/cuisine-intelligence.css?v=20260501a">
  <link rel="stylesheet" href="/tools/afrokitchen/responsive-fixes.css?v=20260425a">
  <style>
    .ak-collection-static-page .ak-country-hub-shell,
    .ak-collection-static-page .ak-country-hub-card,
    .ak-collection-static-page .ak-country-archive-note { background: var(--ak-panel); border: 1px solid var(--ak-line); border-radius: var(--ak-radius); box-shadow: var(--ak-shadow-card); }
    .ak-collection-static-page .ak-country-hub-shell { padding: 28px; margin-top: -48px; position: relative; z-index: 2; }
    .ak-collection-static-page .ak-country-hub-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
    .ak-collection-static-page .ak-country-hub-card { padding: 20px; text-decoration: none; display: grid; gap: 10px; }
    .ak-collection-static-page .ak-country-hub-card h3 { margin: 0; color: var(--ak-dark); font-size: 1.2rem; }
    .ak-collection-static-page .ak-country-hub-card p { margin: 0; color: var(--ak-muted); line-height: 1.65; }
    .ak-collection-static-page .ak-collection-intro-panel,
    .ak-collection-static-page .ak-collection-share-card,
    .ak-collection-static-page .ak-collection-empty-state,
    .ak-collection-static-page .ak-collection-related-card { background: var(--ak-panel); border: 1px solid var(--ak-line); border-radius: var(--ak-radius); box-shadow: var(--ak-shadow-card); }
    .ak-collection-static-page .ak-collection-intro-panel { margin-top: 26px; padding: 24px; }
    .ak-collection-static-page .ak-collection-intro-panel p { margin: 0; max-width: 78ch; color: var(--ak-muted); font-size: 1.02rem; line-height: 1.75; }
    .ak-collection-static-page .ak-collection-share-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, auto); gap: 22px; align-items: center; padding: 24px; }
    .ak-collection-static-page .ak-collection-share-card p { margin: 8px 0 0; max-width: 68ch; color: var(--ak-muted); line-height: 1.65; }
    .ak-collection-static-page .ak-collection-share-actions,
    .ak-collection-static-page .ak-collection-related-grid { display: grid; gap: 10px; }
    .ak-collection-static-page .ak-collection-related-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .ak-collection-static-page .ak-collection-related-card { min-width: 0; padding: 18px; text-decoration: none; display: grid; gap: 8px; color: var(--ak-text); }
    .ak-collection-static-page .ak-collection-related-card strong { color: var(--ak-dark); font-family: var(--font-display); font-size: 1.3rem; line-height: 1.05; }
    .ak-collection-static-page .ak-collection-related-card small { color: var(--ak-muted); line-height: 1.45; }
    .ak-collection-static-page .ak-collection-empty-state { padding: 24px; margin-top: 20px; }
    .ak-collection-static-page .ak-collection-empty-state h2 { margin: 0 0 10px; color: var(--ak-dark); font-family: var(--font-display); font-size: clamp(1.7rem, 3vw, 2.4rem); line-height: 1; }
    .ak-collection-static-page .ak-collection-empty-state p { margin: 0 0 18px; max-width: 68ch; color: var(--ak-muted); line-height: 1.7; }
    .ak-collection-static-page .ak-country-archive-note { padding: 22px; margin-top: 26px; }
    .ak-collection-static-page .ak-country-archive-note p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    @media (max-width: 960px) {
      .ak-collection-static-page .ak-country-hub-grid,
      .ak-collection-static-page .ak-collection-share-card,
      .ak-collection-static-page .ak-collection-related-grid { grid-template-columns: 1fr; }
      .ak-collection-static-page .ak-country-hub-shell { margin-top: 24px; }
    }
  </style>
  <script type="application/ld+json">${safeJson(collectionPageSchema)}</script>
  <script type="application/ld+json">${safeJson(itemListSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<div class="ak-page ak-collection-static-page">
  <section class="ak-hero">
    <div class="ak-hero-inner ak-hero-single">
      <div class="ak-hero-text">
        <nav class="ak-breadcrumb" aria-label="breadcrumb">
          <a href="/">AfroTools</a><span>/</span><a href="/tools/">Tools</a><span>/</span><a href="/tools/afrokitchen/">AfroKitchen</a><span>/</span><span>${escapeHtml(collection.name)}</span>
        </nav>
        <div class="ak-hero-badges">
          <span class="ak-badge ak-badge-live">Collection hub</span>
          <span class="ak-badge ak-badge-atlas">${collection.is_featured ? "Featured" : "Curated"}</span>
        </div>
        <div class="ak-eyebrow">Curated collection</div>
        <h1>${escapeHtml(collection.name)}</h1>
        <p class="ak-hero-sub">${escapeHtml(introParagraph)}</p>
        <div class="ak-hero-stats">
          <div class="ak-stat"><div class="ak-stat-lbl">Recipes</div><div class="ak-stat-val accent">${escapeHtml(String(collection.total_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Country hubs</div><div class="ak-stat-val">${escapeHtml(String(collection.country_count))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Ready to cook</div><div class="ak-stat-val">${escapeHtml(String(collection.generated_recipe_count))}</div></div>
        </div>
        <div class="ak-hero-actions">
          <a href="/tools/afrokitchen/" class="ak-btn ak-btn-secondary">Browse AfroKitchen</a>
          <a href="/tools/afrokitchen/#country-grid" class="ak-btn ak-btn-outline">Browse country hubs</a>
        </div>
      </div>
      <div class="ak-hero-facts">
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Collection table</div>
          <span class="ak-fact-card-value">${escapeHtml(String(collection.total_recipes))}</span>
          <p class="ak-fact-card-copy">${escapeHtml(buildCollectionBestForCopy(collection))}</p>
        </div>
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">What to expect</div>
          <p class="ak-fact-card-copy">${escapeHtml(generatedRecipeLead)}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="ak-section">
    <div class="ak-container">
      <div class="ak-collection-intro-panel rv visible">
        <p>${escapeHtml(introParagraph)}</p>
      </div>

      ${bestForPanel}
      ${shareIntro}
      ${collectionArchive}
      ${collectionIntelligence}
      ${collectionSocialShowcase}
      ${renderCollectionCountryLinks(collection)}
      ${relatedCollections}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
<script src="/assets/js/components/footer.min.js?v=f68d6568" defer></script>
</body>
</html>
`;
}

function buildLegacyAliasPage(alias, manifest) {
  let targetUrl = `${SITE_ORIGIN}/tools/afrokitchen/`;
  let targetPath = "/tools/afrokitchen/";

  if (alias.targetRecipeSlug) {
    const targetRecipe = manifest.recipes.find((recipe) => recipe.slug === alias.targetRecipeSlug);
    if (targetRecipe) {
      targetUrl = targetRecipe.route_url;
      targetPath = targetRecipe.route_path;
    }
  } else if (alias.targetCountryCode) {
    const targetCountry = manifest.countries.find(
      (country) => country.country_code === alias.targetCountryCode
    );
    if (targetCountry) {
      targetUrl = targetCountry.route_url;
      targetPath = targetCountry.route_path;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AfroKitchen page moved</title>
  <meta name="description" content="This AfroKitchen page now lives at a newer recipe or country link.">
  <link rel="canonical" href="${targetUrl}">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0;url=${targetPath}">
</head>
<body>
  <main style="font-family:system-ui, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; line-height: 1.6;">
    <h1>AfroKitchen page updated</h1>
    <p>${escapeHtml(alias.reason)}</p>
    <p><a href="${targetPath}">Continue to the current AfroKitchen page.</a></p>
  </main>
</body>
</html>
`;
}

function syncGeneratedDirectory(baseDir, keepSlugs) {
  ensureDir(baseDir);
  const resolvedBase = path.resolve(baseDir);
  const keep = new Set(keepSlugs);

  fs.readdirSync(resolvedBase, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isDirectory()) return;
    if (keep.has(entry.name)) return;

    const fullPath = path.join(resolvedBase, entry.name);
    if (!fullPath.startsWith(resolvedBase)) {
      throw new Error(`Refusing to remove path outside generator root: ${fullPath}`);
    }
    fs.rmSync(fullPath, { recursive: true, force: true });
  });
}

function trimTrailingWhitespace(content) {
  return String(content).replace(/[ \t]+$/gm, "");
}

function writeHtmlPage(outputDir, html) {
  ensureDir(outputDir);
  writeTextFileSync(path.join(outputDir, "index.html"), trimTrailingWhitespace(html), "utf8");
}

function replaceMarkedBlock(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Unable to find marker pair ${startMarker} / ${endMarker}`);
  }

  return `${content.slice(0, start + startMarker.length)}\n${replacement}\n${content.slice(end)}`;
}

function buildLandingRegionalPreview(cuisineIntelligence) {
  if (!cuisineIntelligence || !cuisineIntelligence.countries) return "";
  const countries = Object.values(cuisineIntelligence.countries)
    .filter((country) => country.regions && country.regions.length > 1)
    .sort((left, right) => right.regions.length - left.regions.length || left.country_name.localeCompare(right.country_name))
    .slice(0, 4);
  if (!countries.length) return "";

  return `<div class="ak-intel-preview-grid">
        ${countries
          .map(
            (country) => `<a class="ak-intel-preview-card" href="${country.route_path}">
          <div class="ak-support-label">${escapeHtml(String(country.regions.length))} regional lanes</div>
          <h3>${escapeHtml(country.country_name)}</h3>
          <p>${escapeHtml(country.regions.slice(0, 3).map((region) => region.name).join(", "))}</p>
        </a>`
          )
          .join("\n")}
      </div>`;
}

function buildLandingMenuBuilderPreview(cuisineIntelligence) {
  const menus =
    cuisineIntelligence &&
    cuisineIntelligence.menu_builder &&
    Array.isArray(cuisineIntelligence.menu_builder.menus)
      ? cuisineIntelligence.menu_builder.menus.slice(0, 4)
      : [];
  if (!menus.length) return "";

  return `<div class="ak-intel-preview-grid ak-menu-preview-grid">
        ${menus
          .map(
            (menu) => `<article class="ak-intel-preview-card">
          <div class="ak-support-label">${escapeHtml(String(menu.recipes.length))} dishes</div>
          <h3>${escapeHtml(menu.name)}</h3>
          <p>${escapeHtml(menu.description)}</p>
          <div class="ak-intel-links">
            ${menu.recipes
              .slice(0, 3)
              .map((recipe) => `<a href="${recipe.route_path}">${escapeHtml(recipe.name)}</a>`)
              .join("")}
          </div>
        </article>`
          )
          .join("\n")}
      </div>`;
}

function buildLandingSocialShowcasePreview(cuisineIntelligence) {
  const showcase =
    cuisineIntelligence &&
    cuisineIntelligence.social_showcase &&
    Array.isArray(cuisineIntelligence.social_showcase.recipes)
      ? cuisineIntelligence.social_showcase
      : null;
  if (!showcase || !showcase.recipes.length) return "";

  const cards = showcase.recipes
    .slice(0, 6)
    .map(
      (recipe) => `<a class="ak-social-card" href="${recipe.route_path}">
        <span class="ak-social-card-rank">#${escapeHtml(String(recipe.rank))}</span>
        <h3>${escapeHtml(recipe.name)}</h3>
        <p>${escapeHtml(recipe.hook)}</p>
        <small>${escapeHtml(recipe.country_name)}</small>
      </a>`
    )
    .join("\n");

  return `<div class="ak-social-card-grid">${cards}</div>
      <div class="ak-intel-links ak-social-board-link">
        <a href="/tools/afrokitchen/collections/${escapeHtml(showcase.slug)}/">Open all ${escapeHtml(String(showcase.total_recipes))} showstoppers</a>
      </div>`;
}

function buildLandingWaveMarkup(manifest, cuisineIntelligence) {
  const featuredLinks = manifest.recipes
    .filter((recipe) => recipe.generated_in_wave)
    .slice(0, 12)
    .map(
      (recipe) =>
        `<a class="ak-support-link" href="${recipe.route_path}">${escapeHtml(recipe.name)}</a>`
    )
    .join("\n");
  const regionalPreview = buildLandingRegionalPreview(cuisineIntelligence);
  const menuPreview = buildLandingMenuBuilderPreview(cuisineIntelligence);
  const socialPreview = buildLandingSocialShowcasePreview(cuisineIntelligence);
  const summary = cuisineIntelligence && cuisineIntelligence.summary ? cuisineIntelligence.summary : null;

  return `<section class="ak-section ak-section-soft">
    <div class="ak-container">
      <div class="ak-support-card rv visible">
        <div class="ak-section-kicker">First bites</div>
        <h2 class="ak-section-title">Popular dishes to open first</h2>
        <p class="ak-section-sub">A quick tasting board from the wider AfroKitchen atlas. ${summary ? `${escapeHtml(String(summary.recipe_count))} recipes, ${escapeHtml(String(summary.country_count))} country hubs, and ${escapeHtml(String(summary.curated_collection_count))} new chef-built collections are now wired into the archive.` : "Open one now, or keep browsing by country, collection, ingredient, or difficulty."}</p>
        <div class="ak-hero-route-grid">
          ${featuredLinks}
        </div>
      </div>
      ${socialPreview ? `<div class="ak-support-card ak-intel-landing-card ak-social-landing-card rv visible">
        <div class="ak-section-kicker">Showstopper board</div>
        <h2 class="ak-section-title">Cook, post, compare notes</h2>
        <p class="ak-section-sub">A social cooking lane for the dishes people photograph first, argue about kindly, and send to friends when the table goes quiet.</p>
        ${socialPreview}
      </div>` : ""}
      ${regionalPreview ? `<div class="ak-support-card ak-intel-landing-card rv visible">
        <div class="ak-section-kicker">Regional atlas</div>
        <h2 class="ak-section-title">Countries now open by food lane</h2>
        <p class="ak-section-sub">Regional cuisine is visible inside country hubs, so Nigeria, Ethiopia, Morocco, Senegal, Ghana, Ivory Coast, Cameroon, and South Africa no longer feel like flat recipe lists.</p>
        ${regionalPreview}
      </div>` : ""}
      ${menuPreview ? `<div class="ak-support-card ak-intel-landing-card rv visible">
        <div class="ak-section-kicker">Menu builder</div>
        <h2 class="ak-section-title">Start with a table, not one lonely recipe</h2>
        <p class="ak-section-sub">These menu boards connect mains, sides, soups, snacks, and serving logic so AfroKitchen can help people cook a real spread.</p>
        ${menuPreview}
      </div>` : ""}
    </div>
  </section>`;
}

function buildLandingCountryLinksMarkup(manifest) {
  return manifest.countries
    .map((country) => {
      const countLabel = country.total_recipes === 1 ? "Dish" : "Dishes";
      return `<a class="ak-country-chip" href="${country.route_path}">
        <span class="ak-country-chip-flag">${escapeHtml(country.country_code)}</span>
        <span class="ak-country-chip-copy"><strong>${escapeHtml(country.country_name)}</strong><small>${escapeHtml(country.region)}</small></span>
        <span class="ak-country-chip-count"><strong>${escapeHtml(String(country.total_recipes))}</strong><small>${countLabel}</small></span>
      </a>`;
    })
    .join("\n");
}

function buildLandingCollectionLinksMarkup(manifest) {
  return (manifest.collections || [])
    .map(
      (collection) => `<a class="ak-collection-card" href="${collection.route_path}">
        <div class="ak-collection-card-kicker">${collection.is_cuisine_intelligence ? "Chef-built collection" : collection.is_featured ? "Featured collection" : "Collection"}</div>
        <h3>${escapeHtml(collection.name)}</h3>
        <p>${escapeHtml(collection.description)}</p>
        <span class="ak-collection-card-link">Open collection</span>
      </a>`
    )
    .join("\n");
}

function updateLandingInventoryCopy(content, manifest) {
  const recipeCount = manifest.recipes.length;
  const countryHubCount = manifest.countries.length;
  const collectionCount = (manifest.collections || []).length;
  const description = `A warm African recipe atlas with ${recipeCount} dishes across ${countryHubCount} country hubs. Search by country, ingredient, occasion, difficulty, or collection.`;
  const socialDescription = `Browse a warmer AfroKitchen recipe atlas with ${recipeCount} dishes across ${countryHubCount} African country hubs.`;
  const faqAnswer = `AfroKitchen has ${recipeCount} recipes across ${countryHubCount} African country hubs, spanning`;

  return content
    .replace(
      /A warm African recipe atlas with \d+\+? dishes (?:from all \d+ countries|across \d+ country hubs)\. Search by country, ingredient, occasion, difficulty, or collection\./g,
      description
    )
    .replace(
      /Browse a warmer AfroKitchen recipe atlas with \d+\+? dishes (?:from all \d+ African countries|across \d+ African country hubs)\./g,
      socialDescription
    )
    .replace(
      /AfroKitchen has \d+\+? recipes (?:from all \d+ African countries|across \d+ African country hubs), spanning/g,
      faqAnswer
    )
    .replace(/<span class="ak-badge ak-badge-live">\d+\+? recipes<\/span>/, `<span class="ak-badge ak-badge-live">${recipeCount} recipes</span>`)
    .replace(/<span class="ak-badge ak-badge-(?:ai|atlas)">\d+ (?:countries|country hubs)<\/span>/, `<span class="ak-badge ak-badge-atlas">${countryHubCount} country hubs</span>`)
    .replace(/(<div class="ak-stat-val accent" id="recipe-total">)\d+(\<\/div>)/, `$1${recipeCount}$2`)
    .replace(
      /<div class="ak-stat-lbl">(?:Countries|Country hubs)<\/div><div class="ak-stat-val">\d+<\/div>/,
      `<div class="ak-stat-lbl">Country hubs</div><div class="ak-stat-val">${countryHubCount}</div>`
    )
    .replace(
      /<div class="ak-stat-lbl">Collections<\/div><div class="ak-stat-val">\d+<\/div>/,
      `<div class="ak-stat-lbl">Collections</div><div class="ak-stat-val">${collectionCount}</div>`
    )
    .replace(
      /<div class="ak-section-eyebrow">\d+ (?:COUNTRIES|COUNTRY HUBS)<\/div>/,
      `<div class="ak-section-eyebrow">${countryHubCount} COUNTRY HUBS</div>`
    );
}

function updateLandingSource(manifest, cuisineIntelligence) {
  let content = fs.readFileSync(LANDING_PATH, "utf8");
  content = updateLandingInventoryCopy(content, manifest);
  content = replaceMarkedBlock(
    content,
    "<!-- ak-static-wave:start -->",
    "<!-- ak-static-wave:end -->",
    buildLandingWaveMarkup(manifest, cuisineIntelligence)
  );
  content = replaceMarkedBlock(
    content,
    "<!-- ak-static-country-links:start -->",
    "<!-- ak-static-country-links:end -->",
    buildLandingCountryLinksMarkup(manifest)
  );
  content = replaceMarkedBlock(
    content,
    "<!-- ak-static-collection-links:start -->",
    "<!-- ak-static-collection-links:end -->",
    buildLandingCollectionLinksMarkup(manifest)
  );
  writeTextFileSync(LANDING_PATH, trimTrailingWhitespace(content), "utf8");
}

async function main() {
  const waveStrategy = readFlag("--wave") || DEFAULT_WAVE_STRATEGY;
  const engine = loadAfroKitchenEngine();
  const recipeImages = loadRecipeImages();
  const recipeResearchAudit = loadRecipeResearchAudit();
  const manifest = await buildManifest({ waveStrategy });

  manifest.recipes = manifest.recipes.map((recipe) => ({
    ...recipe,
    country_route_path: `/tools/afrokitchen/countries/${recipe.country_slug}/`,
    country_route_url: countryUrl(recipe.country_slug)
  }));

  const cuisineIntelligence = buildCuisineIntelligence(manifest, {
    recipeImages,
    researchAudit: recipeResearchAudit
  });
  mergeIntelligenceCollections(manifest, cuisineIntelligence);
  writeCuisineIntelligenceFiles(cuisineIntelligence);

  writeManifest(manifest, MANIFEST_PATH);
  writeStaticRoutes(manifest);
  updateLandingSource(manifest, cuisineIntelligence);

  const keepRecipeSlugs = new Set(manifest.routes.generated_recipe_slugs);
  LEGACY_RECIPE_ALIASES.forEach((alias) => keepRecipeSlugs.add(alias.legacySlug));
  syncGeneratedDirectory(RECIPES_DIR, Array.from(keepRecipeSlugs));
  syncGeneratedDirectory(COUNTRIES_DIR, manifest.routes.generated_country_slugs);
  syncGeneratedDirectory(COLLECTIONS_DIR, manifest.routes.generated_collection_slugs);

  manifest.recipes
    .filter((recipe) => recipe.generated_in_wave)
    .forEach((recipe) => {
      const html = buildRecipePageHtml(
        recipe,
        manifest,
        engine,
        recipeImages,
        recipeResearchAudit,
        cuisineIntelligence
      );
      writeHtmlPage(path.join(RECIPES_DIR, recipe.slug), html);
    });

  manifest.countries.forEach((country) => {
    const html = buildCountryPageHtml(country, manifest, cuisineIntelligence, recipeImages);
    writeHtmlPage(path.join(COUNTRIES_DIR, country.country_slug), html);
  });

  (manifest.collections || []).forEach((collection) => {
    const html = buildCollectionPageHtml(collection, manifest, cuisineIntelligence, recipeImages);
    writeHtmlPage(path.join(COLLECTIONS_DIR, collection.slug), html);
  });

  LEGACY_RECIPE_ALIASES.forEach((alias) => {
    const html = buildLegacyAliasPage(alias, manifest);
    writeHtmlPage(path.join(RECIPES_DIR, alias.legacySlug), html);
  });

  console.log("Generated AfroKitchen manifest-driven static pages.");
  console.log(`Manifest path: ${MANIFEST_PATH}`);
  console.log(`Wave strategy: ${manifest.wave.strategy}`);
  console.log(`Recipe inventory available: ${manifest.source.verified_recipe_count}`);
  console.log(`Recipe pages generated in this pass: ${manifest.wave.recipe_count}`);
  console.log(`Country hubs generated in this pass: ${manifest.wave.country_hub_count}`);
  console.log(`Collection pages generated in this pass: ${manifest.wave.collection_page_count}`);
}

main().catch((error) => {
  console.error("Failed to generate AfroKitchen static pages.");
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
