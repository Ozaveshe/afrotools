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
  escapeHtml,
  safeJson,
  ensureDir,
  writeTextFileSync,
  excerpt,
  slugify,
  countryUrl,
  loadAfroKitchenEngine,
  loadRecipeImages,
  resolveRecipeMedia,
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
              <span class="ak-static-timer-label">${escapeHtml(step.timer_label || "Cooking timer")}</span>
              <strong id="ak-timer-display-${step.step_number}">${formatTime(step.timer_seconds)}</strong>
            </div>
            <div class="ak-static-timer-buttons">
              <button type="button" class="ak-btn ak-btn-sm ak-btn-outline" id="ak-timer-toggle-${step.step_number}" onclick="AKStaticRecipePage.toggleTimer(${step.step_number}, ${step.timer_seconds})">Start timer</button>
              <button type="button" class="ak-btn ak-btn-sm ak-btn-outline" onclick="AKStaticRecipePage.resetTimer(${step.step_number}, ${step.timer_seconds})">Reset</button>
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
        ${step.tip ? `<div class="ak-step-tip">${escapeHtml(step.tip)}</div>` : ""}
        ${timerHtml}
      </article>`;
    })
    .join("\n");
}

function pickRelatedRecipes(currentRecipe, manifest) {
  const pool = manifest.recipes.filter((recipe) => recipe.slug !== currentRecipe.slug);
  const sameCountry = pool
    .filter((recipe) => recipe.country_code === currentRecipe.country_code)
    .sort((left, right) => (right.view_count || 0) - (left.view_count || 0));
  const sameRegion = pool
    .filter(
      (recipe) =>
        recipe.country_code !== currentRecipe.country_code && recipe.region === currentRecipe.region
    )
    .sort((left, right) => (right.view_count || 0) - (left.view_count || 0));
  const fallback = pool
    .filter((recipe) => recipe.region !== currentRecipe.region)
    .sort((left, right) => (right.view_count || 0) - (left.view_count || 0));

  return [...sameCountry, ...sameRegion, ...fallback].slice(0, 4);
}

function resolveRecipeHref(recipe) {
  return recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
}

function renderRelatedHtml(recipe, relatedRecipes) {
  const cards = relatedRecipes
    .map((entry) => {
      const modeLabel = `${entry.country_name} | ${categoryLabel(entry)}`;
      return `<a class="ak-support-card ak-static-related-card" href="${resolveRecipeHref(entry)}">
        <div class="ak-support-label">${escapeHtml(modeLabel)}</div>
        <h3>${escapeHtml(entry.name)}</h3>
        <p>${escapeHtml(excerpt(entry.description, 130))}</p>
        <div class="ak-static-card-meta">${escapeHtml(String(entry.total_time_minutes || 0))} min | ${escapeHtml(categoryLabel(entry))}</div>
      </a>`;
    })
    .join("\n");

  return `<section class="ak-section ak-static-related">
    <div class="ak-section-head rv visible">
      <div class="ak-section-eyebrow">Keep exploring</div>
      <h2 class="ak-section-title">More AfroKitchen dishes from the same food atlas</h2>
      <p class="ak-section-sub">Try another dish from the same country, region, or cooking mood.</p>
    </div>
    <div class="ak-static-related-grid">${cards}</div>
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
  if (!input) return;

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

function collectRecipeGalleryImages(recipe, media, recipeImages) {
  const images = [];
  const seen = new Set();
  const baseAlt = recipe.image_alt || `${recipe.name} recipe from ${recipe.country_name}`;

  addGalleryImage(
    images,
    seen,
    media.pageImage,
    baseAlt,
    `${recipe.name} finished dish`,
    media.credit
  );

  if (recipe.image_url) {
    addGalleryImage(images, seen, recipe.image_url, baseAlt, `${recipe.name} finished dish`);
  }

  const manifestEntry = recipeImages && recipeImages[recipe.slug] ? recipeImages[recipe.slug] : {};
  const manifestGallery = []
    .concat(Array.isArray(manifestEntry.images) ? manifestEntry.images : [])
    .concat(Array.isArray(manifestEntry.gallery) ? manifestEntry.gallery : [])
    .concat(Array.isArray(recipe.media) ? recipe.media : [])
    .concat(Array.isArray(recipe.recipe_media) ? recipe.recipe_media : []);

  manifestGallery.forEach((entry, index) => {
    if (typeof entry === "string") {
      addGalleryImage(images, seen, entry, baseAlt, `Photo ${index + 1}`);
      return;
    }

    addGalleryImage(
      images,
      seen,
      entry.full || entry.url || entry.src || entry.image_url,
      entry.alt || entry.alt_text || baseAlt,
      entry.caption || `Photo ${index + 1}`,
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
      addGalleryImage(
        images,
        seen,
        localImage,
        `${recipe.name} photo ${index}`,
        index === 2 ? "Prep or serving detail" : `Photo ${index}`
      );
    }
  }

  (recipe.steps || []).forEach((step) => {
    addGalleryImage(
      images,
      seen,
      step.image_url,
      `${recipe.name}: ${step.title || `step ${step.step_number}`}`,
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
            <img src="${escapeHtml(featured.src)}" alt="${escapeHtml(featured.alt)}" loading="lazy" decoding="async">
            ${featured.caption ? `<figcaption>${escapeHtml(featured.caption)}</figcaption>` : ""}
          </figure>
          ${
            supporting.length
              ? `<div class="ak-photo-thumbs">${supporting
                  .map(
                    (image) => `<figure>
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async">
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
  const schemaImages = (galleryImages || [])
    .map((image) => toAbsoluteSchemaUrl(image.src))
    .filter((src) => canUseSchemaImage(src));
  const keywords = buildRecipeKeywords(recipe);

  recipeSchema.image = schemaImages.length ? schemaImages : normalizedSocialImage;
  recipeSchema.url = pageUrl;
  recipeSchema.recipeIngredient = schemaIngredients;
  recipeSchema.recipeInstructions = buildRecipeInstructionSchemas(
    recipe,
    pageUrl,
    normalizedSocialImage
  );
  if (keywords) {
    recipeSchema.keywords = keywords;
  }
  recipeSchema.mainEntityOfPage = {
    "@type": "WebPage",
    "@id": pageUrl
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

  return { recipeSchema, breadcrumbSchema };
}

function buildRecipePageHtml(recipe, manifest, engine, recipeImages, researchAudit, cuisineIntelligence) {
  recipe = applyRecipeResearchPatch(recipe, researchAudit);
  const recipeInsight = getRecipeInsight(recipe, cuisineIntelligence);
  const relatedRecipes = pickRelatedRecipes(recipe, manifest);
  const media = resolveRecipeMedia(recipe, recipeImages);
  const galleryImages = collectRecipeGalleryImages(recipe, media, recipeImages);
  const title = `${recipe.name} Recipe | ${recipe.country_name} | AfroKitchen`;
  const description = excerpt(recipe.description, 158);
  const { recipeSchema, breadcrumbSchema } = buildRecipeSchemas(
    recipe,
    engine,
    media.socialImage,
    galleryImages
  );
  const renderedIngredients = renderIngredientsHtml(engine, recipe, recipe.default_servings || 1);
  const renderedNutrition = renderNutritionHtml(engine, recipe);
  const renderedSteps = renderStepsHtml(recipe);
  const renderedGallery = renderRecipePhotoGallery(recipe, galleryImages);
  const renderedInsightCards = renderRecipeIntelligenceCards(recipe, recipeInsight);
  const renderedPairingRail = renderRecipePairingRail(recipe, recipeInsight);
  const renderedSocialPlate = renderRecipeSocialPlate(recipe, recipeInsight);
  const relatedSection = renderRelatedHtml(recipe, relatedRecipes);
  const storyLead = recipe.story ? excerpt(recipe.story, 420) : description;
  const heroStyle = media.pageImage
    ? ` style="background-image:linear-gradient(140deg,rgba(36,18,8,.9),rgba(123,31,12,.72) 46%,rgba(199,62,29,.58)),url('${escapeHtml(media.pageImage)}')"`
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
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(media.socialImage || TOOL_OG_IMAGE)}">
  <meta property="og:type" content="website">
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
  <link rel="stylesheet" href="/tools/afrokitchen/cuisine-intelligence.css?v=20260501a">
  <link rel="stylesheet" href="/tools/afrokitchen/responsive-fixes.css?v=20260425a">
  <style>
    .ak-static-page .ak-hero-inner > * { min-width: 0; }
    .ak-static-page .ak-hero-sub { max-width: 58ch; margin: 18px 0 0; color: rgba(255,255,255,.82); font-size: 1.02rem; line-height: 1.75; }
    .ak-static-page .ak-static-hero-card,
    .ak-static-page .ak-static-summary-shell,
    .ak-static-page .ak-static-helper-note,
    .ak-static-page .ak-static-related-card { background: var(--ak-panel); border: 1px solid var(--ak-line); border-radius: var(--ak-radius); box-shadow: var(--ak-shadow-card); }
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
    .ak-static-page .ak-static-related-card { padding: 20px; text-decoration: none; display: grid; gap: 10px; }
    .ak-static-page .ak-static-related-card h3 { margin: 0; color: var(--ak-dark); font-size: 1.2rem; }
    .ak-static-page .ak-static-related-card p { margin: 0; color: var(--ak-muted); line-height: 1.65; }
    .ak-static-page .ak-static-card-meta { color: var(--ak-subtle); font-size: .92rem; }
    .ak-static-page .ak-static-credit { font-size: .88rem; color: var(--ak-subtle); }
    @media (max-width: 960px) {
      .ak-static-page .ak-static-summary-grid,
      .ak-static-page .ak-static-related-grid,
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
      .ak-static-page .ak-step { padding: 76px 20px 22px; }
      .ak-static-page .ak-step-num { left: 20px; top: 20px; }
    }
  </style>
  <script type="application/ld+json">${safeJson(recipeSchema)}</script>
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
          <a href="${recipe.country_route_path}" class="ak-btn ak-btn-secondary">Explore ${escapeHtml(recipe.country_name)} recipes</a>
          ${recipe.primary_collection_route_path ? `<a href="${recipe.primary_collection_route_path}" class="ak-btn ak-btn-primary">Open ${escapeHtml(recipe.primary_collection_name)}</a>` : `<a href="/tools/afrokitchen/" class="ak-btn ak-btn-primary">Browse AfroKitchen</a>`}
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
        ${media.credit ? `<div class="ak-static-credit">Image sourced from ${escapeHtml(media.credit.source)} by <a href="${escapeHtml(media.credit.photographerUrl)}">${escapeHtml(media.credit.photographer)}</a>.</div>` : ""}
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
            <p>Best for ${escapeHtml(recipe.occasion || "everyday meals")}, with a ${escapeHtml(recipe.difficulty || "medium")} cooking level and about ${escapeHtml(String(recipe.total_time_minutes || 0))} minutes total.</p>
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
            <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(-1)">-</button>
            <span class="ak-servings-val" id="ak-static-servings">${escapeHtml(String(recipe.default_servings || 1))}</span>
            <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(1)">+</button>
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
              <a class="ak-btn ak-btn-outline" href="${recipe.country_route_path}">Back to ${escapeHtml(recipe.country_name)}</a>
            </div>
            <div class="ak-method-stat-row">
              <span>${escapeHtml(String((recipe.steps || []).length))} steps</span>
              <span>${escapeHtml(String(recipe.total_time_minutes || 0))} min total</span>
              <span>${escapeHtml(recipe.difficulty || "medium")}</span>
            </div>
            <div class="ak-steps">${renderedSteps}</div>
            <div class="ak-static-helper-note">
              <p>${escapeHtml(recipe.regional_variations || "Every household has small variations. Start here, then adjust seasoning, heat, and serving sides to your kitchen.")}</p>
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
<script src="/tools/afrokitchen/static-recipe-runtime.js?v=20260427a" defer></script>
</body>
</html>
`;
}

function buildCountrySchemas(country) {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${country.country_name} Recipes & Traditional Dishes | AfroKitchen`,
    description: country.description,
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

  return { collectionPageSchema, itemListSchema, breadcrumbSchema };
}

function buildCollectionSchemas(collection) {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${collection.name} Recipes Collection | AfroKitchen`,
    description: collection.description,
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

function renderCountryRecipeCards(country) {
  return country.recipes
    .map((recipe) => {
      const modeLabel = `${categoryLabel(recipe)} | ${recipe.difficulty || "medium"}`;
      const href = recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
      return `<a class="ak-country-hub-card" href="${href}">
        <div class="ak-support-label">${escapeHtml(modeLabel)}</div>
        <h3>${escapeHtml(recipe.name)}</h3>
        <p>${escapeHtml(excerpt(recipe.description, 128))}</p>
        <div class="ak-static-card-meta">${escapeHtml(String(recipe.total_time_minutes || 0))} min | ${escapeHtml(categoryLabel(recipe))}</div>
      </a>`;
    })
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

function renderCollectionRecipeCards(collection) {
  return collection.recipes
    .map((recipe) => {
      const modeLabel = `${recipe.country_name} | ${categoryLabel(recipe)}`;
      const href = recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
      return `<a class="ak-country-hub-card" href="${href}">
        <div class="ak-support-label">${escapeHtml(modeLabel)}</div>
        <h3>${escapeHtml(recipe.name)}</h3>
        <p>${escapeHtml(excerpt(recipe.description, 128))}</p>
        <div class="ak-static-card-meta">${escapeHtml(String(recipe.total_time_minutes || 0))} min | ${escapeHtml(categoryLabel(recipe))}</div>
      </a>`;
    })
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
            `<a class="ak-support-link" href="${country.route_path}">${escapeHtml(country.country_name)} (${escapeHtml(String(country.recipe_count))})</a>`
        )
        .join("\n")}
    </div>
    ${additionalCountries > 0 ? `<p class="ak-section-sub">This collection also touches ${escapeHtml(String(additionalCountries))} more country hubs across AfroKitchen.</p>` : ""}
  </section>`;
}

function buildCountryPageHtml(country, manifest, cuisineIntelligence) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema } = buildCountrySchemas(country);
  const title = `${country.country_name} Recipes & Traditional Dishes | AfroKitchen`;
  const description = excerpt(country.description, 158);
  const countryRegionalAtlas = renderCountryRegionalAtlas(country, cuisineIntelligence);
  const countryPantryGuide = renderCountryPantryGuide(country, cuisineIntelligence);
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
    .ak-country-static-page .ak-country-archive-note { padding: 22px; margin-top: 26px; }
    .ak-country-static-page .ak-country-archive-note p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    @media (max-width: 960px) {
      .ak-country-static-page .ak-country-hub-grid { grid-template-columns: 1fr; }
      .ak-country-static-page .ak-country-hub-shell { margin-top: 24px; }
    }
  </style>
  <script type="application/ld+json">${safeJson(collectionPageSchema)}</script>
  <script type="application/ld+json">${safeJson(itemListSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
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
          <span class="ak-badge ak-badge-ai">${escapeHtml(country.region)}</span>
        </div>
        <div class="ak-eyebrow">${escapeHtml(country.region)}</div>
        <h1>${escapeHtml(country.country_name)} Recipes & Traditional Dishes</h1>
        <p class="ak-hero-sub">${escapeHtml(country.description)}</p>
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
          <p class="ak-fact-card-copy">A small set of dishes to start cooking from ${escapeHtml(country.country_name)}.</p>
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
      <div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Country archive</div>
        <h2 class="ak-section-title">Every ${escapeHtml(country.country_name)} dish in one place</h2>
        <p class="ak-section-sub">${escapeHtml(recipeListCopy)}</p>
        <div class="ak-country-hub-grid">
          ${renderCountryRecipeCards(country)}
        </div>
        <div class="ak-country-archive-note">
          <p>${country.generated_recipe_count < country.total_recipes ? `${escapeHtml(country.country_name)} has ${escapeHtml(String(country.total_recipes - country.generated_recipe_count))} more dishes queued for deeper cooking pages.` : `Every ${escapeHtml(country.country_name)} recipe in this country hub is ready to open from the card above.`}</p>
        </div>
      </div>

      ${countryPantryGuide}
      ${countryRegionalAtlas}
      ${renderCountryCollectionLinks(country)}
      ${renderNeighborCountryLinks(country, manifest)}
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

function buildCollectionPageHtml(collection, cuisineIntelligence) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema } =
    buildCollectionSchemas(collection);
  const title = `${collection.name} Recipes Collection | AfroKitchen`;
  const description = excerpt(collection.description, 158);
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
    .ak-collection-static-page .ak-country-archive-note { padding: 22px; margin-top: 26px; }
    .ak-collection-static-page .ak-country-archive-note p { margin: 0; color: var(--ak-muted); line-height: 1.7; }
    @media (max-width: 960px) {
      .ak-collection-static-page .ak-country-hub-grid { grid-template-columns: 1fr; }
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
          <span class="ak-badge ak-badge-ai">${collection.is_featured ? "Featured" : "Curated"}</span>
        </div>
        <div class="ak-eyebrow">Curated collection</div>
        <h1>${escapeHtml(collection.name)}</h1>
        <p class="ak-hero-sub">${escapeHtml(collection.description)}</p>
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
          <p class="ak-fact-card-copy">A focused set of dishes for this craving, occasion, or cooking style.</p>
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
      <div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Collection archive</div>
        <h2 class="ak-section-title">Dishes inside ${escapeHtml(collection.name)}</h2>
        <p class="ak-section-sub">${escapeHtml(recipeListCopy)}</p>
        <div class="ak-country-hub-grid">
          ${renderCollectionRecipeCards(collection)}
        </div>
        <div class="ak-country-archive-note">
          <p>${collection.generated_recipe_count < collection.total_recipes ? `${escapeHtml(collection.name)} has ${escapeHtml(String(collection.total_recipes - collection.generated_recipe_count))} more dishes queued for deeper cooking pages.` : `Every recipe linked from ${escapeHtml(collection.name)} is ready to open from the card above.`}</p>
        </div>
      </div>

      ${collectionIntelligence}
      ${collectionSocialShowcase}
      ${renderCollectionCountryLinks(collection)}
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
    .replace(/<span class="ak-badge ak-badge-ai">\d+ (?:countries|country hubs)<\/span>/, `<span class="ak-badge ak-badge-ai">${countryHubCount} country hubs</span>`)
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
    const html = buildCountryPageHtml(country, manifest, cuisineIntelligence);
    writeHtmlPage(path.join(COUNTRIES_DIR, country.country_slug), html);
  });

  (manifest.collections || []).forEach((collection) => {
    const html = buildCollectionPageHtml(collection, cuisineIntelligence);
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
