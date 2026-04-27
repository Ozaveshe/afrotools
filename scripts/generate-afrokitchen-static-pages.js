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
  excerpt,
  countryUrl,
  loadAfroKitchenEngine,
  loadRecipeImages,
  resolveRecipeMedia,
  buildManifest,
  writeManifest,
  writeStaticRoutes
} = require("./lib/afrokitchen-static");

const LANDING_PATH = path.join(TOOL_DIR, "index.html");
const AK_FONT_HREF = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&display=swap";
const LEGACY_RECIPE_ALIASES = [
  {
    legacySlug: "nigerian-jollof-rice",
    targetRecipeSlug: "jollof-rice-ng",
    reason: "Legacy seed route preserved while AfroKitchen canonical routes switch to the verified Supabase slug."
  },
  {
    legacySlug: "ethiopian-doro-wat",
    targetRecipeSlug: "doro-wat",
    reason: "Legacy seed route preserved while AfroKitchen canonical routes switch to the verified Supabase slug."
  },
  {
    legacySlug: "egyptian-koshari",
    targetRecipeSlug: "koshari-eg",
    reason: "Legacy seed route preserved while AfroKitchen canonical routes switch to the verified Supabase slug."
  },
  {
    legacySlug: "moroccan-chicken-tagine",
    targetRecipeSlug: "chicken-tagine-preserved-lemons-ma",
    reason: "Legacy seed route preserved while AfroKitchen canonical routes switch to the verified Supabase slug."
  },
  {
    legacySlug: "ugali-sukuma-wiki",
    targetRecipeSlug: "ugali-na-sukuma-wiki",
    reason: "Legacy seed route preserved while AfroKitchen canonical routes switch to the verified Supabase slug."
  },
  {
    legacySlug: "ghanaian-waakye",
    targetCountryCode: "GH",
    reason: "Legacy seed route preserved as a noindex compatibility alias because the current verified Supabase inventory does not include a Waakye record yet."
  },
  {
    legacySlug: "dovi",
    targetRecipeSlug: "dovi-zw",
    reason: "Duplicate Zimbabwe Dovi route retired in favor of the richer verified dovi-zw recipe record."
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

    html += `<label class="ak-ing-item">
      <input type="checkbox" class="ak-ing-check">
      <span class="ak-ing-text">
        <span class="ak-ing-amount">${escapeHtml(
          engine.formatAmount(ingredient.scaled_amount)
        )} ${escapeHtml(ingredient.unit)}</span> ${escapeHtml(ingredient.name)}${ingredient.prep_note ? `, <em>${escapeHtml(ingredient.prep_note)}</em>` : ""}${ingredient.is_optional ? ' <span class="ak-ing-optional">(optional)</span>' : ""}${ingredient.substitution ? ` <span class="ak-ing-optional">[Sub: ${escapeHtml(ingredient.substitution)}]</span>` : ""}
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
  const hasFallbackRecipes = relatedRecipes.some((entry) => !entry.generated_in_wave);
  const cards = relatedRecipes
    .map((entry) => {
      const modeLabel = entry.generated_in_wave ? "Static route" : "Interactive fallback";
      return `<a class="ak-support-card ak-static-related-card" href="${resolveRecipeHref(entry)}">
        <div class="ak-support-label">${escapeHtml(entry.country_name)} | ${modeLabel}</div>
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
      <p class="ak-section-sub">${hasFallbackRecipes ? "Clean recipe routes are preferred whenever this wave has generated them. Remaining dishes still resolve through the interactive fallback until the next static expansion." : "Every related dish below links through a clean static recipe route from the verified AfroKitchen inventory."}</p>
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
      ? `${recipe.name} belongs to ${recipe.collection_count} AfroKitchen collections. ${recipe.primary_collection_name} is the strongest cluster route to start from.`
      : `${recipe.primary_collection_name} is the main AfroKitchen collection route tied to this dish right now.`;

  return `<div class="ak-static-summary-card">
            <strong>Follow the collection route</strong>
            <p>${escapeHtml(collectionCopy)} <a href="${recipe.primary_collection_route_path}">${escapeHtml(recipe.primary_collection_name)}</a></p>
          </div>`;
}

function toAbsoluteSchemaUrl(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("//")) return `https:${input}`;
  if (input.startsWith("/")) return `${SITE_ORIGIN}${input}`;
  return `${SITE_ORIGIN}/${input.replace(/^\/+/, "")}`;
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
      return fs.existsSync(path.join(ROOT, pathname));
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

function buildRecipeSchemas(recipe, engine, socialImage) {
  const pageUrl = recipe.route_url;
  const recipeSchema = JSON.parse(
    JSON.stringify(engine.getStructuredData(recipe, recipe.default_servings || 1))
  );
  const normalizedSocialImage = toAbsoluteSchemaUrl(socialImage || TOOL_OG_IMAGE) || TOOL_OG_IMAGE;
  const keywords = buildRecipeKeywords(recipe);

  recipeSchema.image = normalizedSocialImage;
  recipeSchema.url = pageUrl;
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

function buildRecipePageHtml(recipe, manifest, engine, recipeImages) {
  const relatedRecipes = pickRelatedRecipes(recipe, manifest);
  const media = resolveRecipeMedia(recipe, recipeImages);
  const title = `${recipe.name} Recipe | ${recipe.country_name} | AfroKitchen`;
  const description = excerpt(recipe.description, 158);
  const { recipeSchema, breadcrumbSchema } = buildRecipeSchemas(recipe, engine, media.socialImage);
  const renderedIngredients = renderIngredientsHtml(engine, recipe, recipe.default_servings || 1);
  const renderedNutrition = renderNutritionHtml(engine, recipe);
  const renderedSteps = renderStepsHtml(recipe);
  const relatedSection = renderRelatedHtml(recipe, relatedRecipes);
  const storyLead = recipe.story ? excerpt(recipe.story, 420) : description;

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
    steps: recipe.steps || []
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
    .ak-static-page .ak-static-serving-bar { margin: 26px 0 18px; }
    .ak-static-page .ak-static-serving-note { margin: 10px 0 0; color: var(--ak-subtle); font-size: .9rem; }
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
      .ak-static-page .ak-static-related-grid { grid-template-columns: 1fr; }
      .ak-static-page .ak-static-summary-shell { margin-top: 24px; }
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
    }
  </style>
  <script type="application/ld+json">${safeJson(recipeSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<div class="ak-page ak-static-page">
  <section class="ak-hero">
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
          <div><span>Country hub</span><strong><a href="${recipe.country_route_path}">${escapeHtml(recipe.country_name)} cuisine hub</a></strong></div>
          ${recipe.primary_collection_slug ? `<div><span>Collection route</span><strong><a href="${recipe.primary_collection_route_path}">${escapeHtml(recipe.primary_collection_name)}</a></strong></div>` : ""}
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
        </div>
      </div>

      <div class="ak-static-serving-bar">
        <div class="ak-servings">
          <span class="ak-servings-label">Servings:</span>
          <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(-1)">-</button>
          <span class="ak-servings-val" id="ak-static-servings">${escapeHtml(String(recipe.default_servings || 1))}</span>
          <button class="ak-servings-btn" type="button" onclick="AKStaticRecipePage.adjustServings(1)">+</button>
        </div>
        <p class="ak-static-serving-note">The core SEO content is fully visible in HTML. The controls above only recalculate ingredients and nutrition client-side for convenience.</p>
      </div>

      <div class="ak-recipe-layout">
        <aside class="ak-ingredients-panel">
          <h2 class="ak-panel-title">Ingredients</h2>
          <div id="ak-static-ingredients">${renderedIngredients}</div>
          ${renderedNutrition ? `<div class="ak-ingredients-footer"><h3 class="ak-mini-title">Nutrition</h3>${renderedNutrition}</div>` : ""}
        </aside>

        <section class="ak-method-panel">
          <div class="ak-method-head">
            <div>
              <div class="ak-panel-kicker">How to cook it</div>
              <h2 class="ak-panel-title">Step-by-step instructions</h2>
            </div>
            <a class="ak-btn ak-btn-outline" href="${recipe.country_route_path}">Back to ${escapeHtml(recipe.country_name)}</a>
          </div>
          <div class="ak-steps">${renderedSteps}</div>
          <div class="ak-static-helper-note">
            <p>${escapeHtml(recipe.regional_variations || "Regional variations and live helpers layer onto this clean static recipe route without changing the canonical URL.")}</p>
          </div>
        </section>
      </div>

      ${relatedSection}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=cd2d4746" defer></script>
<script src="/assets/js/components/footer.min.js?v=f68d6568" defer></script>
<script src="/engines/afrokitchen-engine.js?v=3"></script>
<script>window.__AK_STATIC_RECIPE = ${safeJson(recipeData)};</script>
<script src="/tools/afrokitchen/static-recipe-runtime.js?v=20260417a" defer></script>
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
      const modeLabel = recipe.generated_in_wave ? "Static recipe route" : "Interactive fallback";
      const href = recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
      return `<a class="ak-country-hub-card" href="${href}">
        <div class="ak-support-label">${modeLabel}</div>
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
      <p class="ak-section-sub">${hasFallbackRecipes ? "Country hubs are fully static in this wave, even when some recipe detail pages still resolve through the interactive fallback." : "Country hubs are fully static and now cross-link to clean verified recipe routes."}</p>
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
      <div class="ak-section-eyebrow">Collection routes</div>
      <h2 class="ak-section-title">Collections that include ${escapeHtml(country.country_name)}</h2>
      <p class="ak-section-sub">These collection hubs are pulled from live AfroKitchen membership data, so the strongest cross-links stay tied to real recipe coverage instead of guessed tags.</p>
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
      const modeLabel = recipe.generated_in_wave ? "Static recipe route" : "Interactive fallback";
      const href = recipe.generated_in_wave ? recipe.route_path : recipe.fallback_path;
      return `<a class="ak-country-hub-card" href="${href}">
        <div class="ak-support-label">${escapeHtml(recipe.country_name)} | ${modeLabel}</div>
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
      <h2 class="ak-section-title">Country routes connected to ${escapeHtml(collection.name)}</h2>
      <p class="ak-section-sub">Collections work best when they also feed country discovery, so these hub links stay visible in HTML alongside the recipe grid.</p>
    </div>
    <div class="ak-hero-route-grid">
      ${visibleCountries
        .map(
          (country) =>
            `<a class="ak-support-link" href="${country.route_path}">${escapeHtml(country.country_name)} (${escapeHtml(String(country.recipe_count))})</a>`
        )
        .join("\n")}
    </div>
    ${additionalCountries > 0 ? `<p class="ak-section-sub">This collection also touches ${escapeHtml(String(additionalCountries))} more country hubs through the wider verified inventory.</p>` : ""}
  </section>`;
}

function buildCountryPageHtml(country, manifest) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema } = buildCountrySchemas(country);
  const title = `${country.country_name} Recipes & Traditional Dishes | AfroKitchen`;
  const description = excerpt(country.description, 158);
  const generatedRecipeLead =
    country.generated_recipe_count === country.total_recipes
      ? `All ${country.total_recipes} verified recipes use clean static routes`
      : country.generated_recipe_count
        ? `${country.generated_recipe_count} of ${country.total_recipes} verified recipes use clean static routes`
        : "This hub is already static, but its recipe detail links still point to the interactive fallback until a later recipe wave ships.";
  const recipeListCopy =
    country.generated_recipe_count === country.total_recipes
      ? "Every card below links to a clean static recipe URL from the verified live AfroKitchen inventory."
      : "The cards below use clean static recipe URLs when this production wave has generated them. Remaining dishes still link through the interactive fallback so the hub reflects the full verified inventory from the live AfroKitchen dataset.";

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
          <div class="ak-stat"><div class="ak-stat-lbl">Verified recipes</div><div class="ak-stat-val accent">${escapeHtml(String(country.total_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Featured dishes</div><div class="ak-stat-val">${escapeHtml(String(country.featured_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Static recipe routes</div><div class="ak-stat-val">${escapeHtml(String(country.generated_recipe_count))}</div></div>
        </div>
        <div class="ak-hero-actions">
          <a href="/tools/afrokitchen/" class="ak-btn ak-btn-secondary">Browse AfroKitchen</a>
          <a href="/tools/afrokitchen/#collections-grid" class="ak-btn ak-btn-outline">Browse collections</a>
        </div>
      </div>
      <div class="ak-hero-facts">
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Why this hub matters</div>
          <span class="ak-fact-card-value">${escapeHtml(String(country.total_recipes))}</span>
          <p class="ak-fact-card-copy">The country hub is static and points verified dishes at their canonical recipe routes.</p>
        </div>
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Current route coverage</div>
          <p class="ak-fact-card-copy">${escapeHtml(generatedRecipeLead)}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="ak-section">
    <div class="ak-container">
      <div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Country archive</div>
        <h2 class="ak-section-title">Every verified ${escapeHtml(country.country_name)} recipe in one crawlable hub</h2>
        <p class="ak-section-sub">${escapeHtml(recipeListCopy)}</p>
        <div class="ak-country-hub-grid">
          ${renderCountryRecipeCards(country)}
        </div>
        <div class="ak-country-archive-note">
          <p>${country.generated_recipe_count < country.total_recipes ? `${escapeHtml(country.country_name)} currently has ${escapeHtml(String(country.total_recipes - country.generated_recipe_count))} verified dishes that still resolve through the noindex query template while the static recipe rollout expands beyond this first production wave.` : `Every verified ${escapeHtml(country.country_name)} recipe in the current inventory already has a clean static route in this wave.`}</p>
        </div>
      </div>

      ${renderCountryCollectionLinks(country)}
      ${renderNeighborCountryLinks(country, manifest)}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=cd2d4746" defer></script>
<script src="/assets/js/components/footer.min.js?v=f68d6568" defer></script>
</body>
</html>
`;
}

function buildCollectionPageHtml(collection) {
  const { collectionPageSchema, itemListSchema, breadcrumbSchema } =
    buildCollectionSchemas(collection);
  const title = `${collection.name} Recipes Collection | AfroKitchen`;
  const description = excerpt(collection.description, 158);
  const generatedRecipeLead =
    collection.generated_recipe_count === collection.total_recipes
      ? `All ${collection.total_recipes} recipes in this collection use clean static routes`
      : collection.generated_recipe_count
        ? `${collection.generated_recipe_count} of ${collection.total_recipes} recipes in this collection use clean static routes`
        : "This collection route is static, but its recipe detail links still point to the interactive fallback until a later recipe wave ships.";
  const recipeListCopy =
    collection.generated_recipe_count === collection.total_recipes
      ? "This page ships the collection intro and recipe list directly in HTML, with every member linked through its clean static recipe URL."
      : "This page ships the collection intro and recipe list directly in HTML, with clean recipe URLs preferred wherever the current static wave has generated them.";

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
        <div class="ak-eyebrow">Curated route</div>
        <h1>${escapeHtml(collection.name)}</h1>
        <p class="ak-hero-sub">${escapeHtml(collection.description)}</p>
        <div class="ak-hero-stats">
          <div class="ak-stat"><div class="ak-stat-lbl">Verified recipes</div><div class="ak-stat-val accent">${escapeHtml(String(collection.total_recipes))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Country hubs</div><div class="ak-stat-val">${escapeHtml(String(collection.country_count))}</div></div>
          <div class="ak-stat"><div class="ak-stat-lbl">Static recipe routes</div><div class="ak-stat-val">${escapeHtml(String(collection.generated_recipe_count))}</div></div>
        </div>
        <div class="ak-hero-actions">
          <a href="/tools/afrokitchen/" class="ak-btn ak-btn-secondary">Browse AfroKitchen</a>
          <a href="/tools/afrokitchen/#country-grid" class="ak-btn ak-btn-outline">Browse country hubs</a>
        </div>
      </div>
      <div class="ak-hero-facts">
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Why this cluster matters</div>
          <span class="ak-fact-card-value">${escapeHtml(String(collection.total_recipes))}</span>
          <p class="ak-fact-card-copy">Collections are the editorial layer of AfroKitchen, turning scattered recipe inventory into a crawlable route with a clear theme.</p>
        </div>
        <div class="ak-fact-card">
          <div class="ak-fact-card-label">Current route coverage</div>
          <p class="ak-fact-card-copy">${escapeHtml(generatedRecipeLead)}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="ak-section">
    <div class="ak-container">
      <div class="ak-country-hub-shell rv visible">
        <div class="ak-section-kicker">Collection archive</div>
        <h2 class="ak-section-title">Contained recipe routes for ${escapeHtml(collection.name)}</h2>
        <p class="ak-section-sub">${escapeHtml(recipeListCopy)}</p>
        <div class="ak-country-hub-grid">
          ${renderCollectionRecipeCards(collection)}
        </div>
        <div class="ak-country-archive-note">
          <p>${collection.generated_recipe_count < collection.total_recipes ? `${escapeHtml(collection.name)} currently includes ${escapeHtml(String(collection.total_recipes - collection.generated_recipe_count))} verified dishes that still resolve through the noindex query template while the static recipe rollout continues.` : `Every recipe linked from ${escapeHtml(collection.name)} already has a clean static route in the current AfroKitchen wave.`}</p>
        </div>
      </div>

      ${renderCollectionCountryLinks(collection)}
    </div>
  </section>
</div>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js?v=cd2d4746" defer></script>
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
  <title>AfroKitchen route moved</title>
  <meta name="description" content="This AfroKitchen route has moved to a newer static path sourced from the verified recipe inventory.">
  <link rel="canonical" href="${targetUrl}">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0;url=${targetPath}">
</head>
<body>
  <main style="font-family:system-ui, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 20px; line-height: 1.6;">
    <h1>AfroKitchen route updated</h1>
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

function writeHtmlPage(outputDir, html) {
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
}

function replaceMarkedBlock(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Unable to find marker pair ${startMarker} / ${endMarker}`);
  }

  return `${content.slice(0, start + startMarker.length)}\n${replacement}\n${content.slice(end)}`;
}

function buildLandingWaveMarkup(manifest) {
  const featuredLinks = manifest.recipes
    .filter((recipe) => recipe.generated_in_wave)
    .slice(0, 12)
    .map(
      (recipe) =>
        `<a class="ak-support-link" href="${recipe.route_path}">${escapeHtml(recipe.name)}</a>`
    )
    .join("\n");

  return `<section class="ak-section ak-section-soft">
    <div class="ak-container">
      <div class="ak-support-card rv visible">
        <div class="ak-section-kicker">Static route wave</div>
        <h2 class="ak-section-title">Manifest-driven AfroKitchen routes now front the archive</h2>
        <p class="ak-section-sub">This production wave ships ${manifest.wave.recipe_count} clean recipe routes and ${manifest.wave.country_hub_count} country hubs from the verified AfroKitchen inventory. Country hubs map the full archive, and clean recipe routes are preferred wherever this wave has generated them.</p>
        <div class="ak-hero-route-grid">
          ${featuredLinks}
        </div>
      </div>
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
        <div class="ak-collection-card-kicker">${collection.is_featured ? "Featured collection" : "Collection"}</div>
        <h3>${escapeHtml(collection.name)}</h3>
        <p>${escapeHtml(collection.description)}</p>
        <span class="ak-collection-card-link">Open collection</span>
      </a>`
    )
    .join("\n");
}

function updateLandingSource(manifest) {
  let content = fs.readFileSync(LANDING_PATH, "utf8");
  content = replaceMarkedBlock(
    content,
    "<!-- ak-static-wave:start -->",
    "<!-- ak-static-wave:end -->",
    buildLandingWaveMarkup(manifest)
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
  fs.writeFileSync(LANDING_PATH, content, "utf8");
}

async function main() {
  const waveStrategy = readFlag("--wave") || DEFAULT_WAVE_STRATEGY;
  const engine = loadAfroKitchenEngine();
  const recipeImages = loadRecipeImages();
  const manifest = await buildManifest({ waveStrategy });

  manifest.recipes = manifest.recipes.map((recipe) => ({
    ...recipe,
    country_route_path: `/tools/afrokitchen/countries/${recipe.country_slug}/`,
    country_route_url: countryUrl(recipe.country_slug)
  }));

  writeManifest(manifest, MANIFEST_PATH);
  writeStaticRoutes(manifest);
  updateLandingSource(manifest);

  const keepRecipeSlugs = new Set(manifest.routes.generated_recipe_slugs);
  LEGACY_RECIPE_ALIASES.forEach((alias) => keepRecipeSlugs.add(alias.legacySlug));
  syncGeneratedDirectory(RECIPES_DIR, Array.from(keepRecipeSlugs));
  syncGeneratedDirectory(COUNTRIES_DIR, manifest.routes.generated_country_slugs);
  syncGeneratedDirectory(COLLECTIONS_DIR, manifest.routes.generated_collection_slugs);

  manifest.recipes
    .filter((recipe) => recipe.generated_in_wave)
    .forEach((recipe) => {
      const html = buildRecipePageHtml(recipe, manifest, engine, recipeImages);
      writeHtmlPage(path.join(RECIPES_DIR, recipe.slug), html);
    });

  manifest.countries.forEach((country) => {
    const html = buildCountryPageHtml(country, manifest);
    writeHtmlPage(path.join(COUNTRIES_DIR, country.country_slug), html);
  });

  (manifest.collections || []).forEach((collection) => {
    const html = buildCollectionPageHtml(collection);
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
