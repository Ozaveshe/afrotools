"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..", "..");
const TOOL_DIR = path.join(ROOT, "tools", "afrokitchen");
const RECIPES_DIR = path.join(TOOL_DIR, "recipes");
const COUNTRIES_DIR = path.join(TOOL_DIR, "countries");
const COLLECTIONS_DIR = path.join(TOOL_DIR, "collections");
const MANIFEST_PATH = path.join(TOOL_DIR, "seo-manifest.json");
const ROUTES_PATH = path.join(TOOL_DIR, "static-routes.js");
const SITE_ORIGIN = "https://afrotools.com";
const TOOL_OG_IMAGE = `${SITE_ORIGIN}/assets/img/tools/afrokitchen.webp`;
const LOCAL_RECIPE_IMAGE_ALIASES = {
  "jollof-rice-ng": ["ng_jollof_rice"]
};
const SUPABASE_URL =
  process.env.SUPABASE_AUTH_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0";

const DEFAULT_WAVE_STRATEGY = "all_verified";

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function excerpt(text, limit) {
  const input = normalizeText(text);
  if (!input) return "";
  if (input.length <= limit) return input;
  return `${input.slice(0, Math.max(limit - 3, 0)).trim()}...`;
}

function humanList(values, maxItems) {
  const items = (values || []).filter(Boolean).slice(0, maxItems || values.length);
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function recipeRoutePath(slug) {
  return `/tools/afrokitchen/recipes/${slug}/`;
}

function recipeUrl(slug) {
  return `${SITE_ORIGIN}${recipeRoutePath(slug)}`;
}

function fallbackRecipePath(slug) {
  return `/tools/afrokitchen/recipe.html?slug=${encodeURIComponent(slug || "")}`;
}

function fallbackRecipeUrl(slug) {
  return `${SITE_ORIGIN}${fallbackRecipePath(slug)}`;
}

function countryRoutePath(countrySlug) {
  return `/tools/afrokitchen/countries/${countrySlug}/`;
}

function countryUrl(countrySlug) {
  return `${SITE_ORIGIN}${countryRoutePath(countrySlug)}`;
}

function fallbackCountryPath(countryCode) {
  return `/tools/afrokitchen/country.html?country=${encodeURIComponent(countryCode || "")}`;
}

function fallbackCountryUrl(countryCode) {
  return `${SITE_ORIGIN}${fallbackCountryPath(countryCode)}`;
}

function collectionRoutePath(collectionSlug) {
  return `/tools/afrokitchen/collections/${collectionSlug}/`;
}

function collectionUrl(collectionSlug) {
  return `${SITE_ORIGIN}${collectionRoutePath(collectionSlug)}`;
}

function fallbackCollectionPath(collectionSlug) {
  return `/tools/afrokitchen/collection.html?slug=${encodeURIComponent(collectionSlug || "")}`;
}

function fallbackCollectionUrl(collectionSlug) {
  return `${SITE_ORIGIN}${fallbackCollectionPath(collectionSlug)}`;
}

function loadAfroKitchenEngine() {
  const enginePath = path.join(ROOT, "engines", "afrokitchen-engine.js");
  const code = fs.readFileSync(enginePath, "utf8");
  const sandbox = {
    window: {},
    console,
    setInterval,
    clearInterval
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  if (!sandbox.AfroKitchenEngine) {
    throw new Error("AfroKitchenEngine was not available after evaluation.");
  }

  return sandbox.AfroKitchenEngine;
}

function loadRecipeImages() {
  const imagePath = path.join(TOOL_DIR, "recipe-images.json");
  const overridePath = path.join(TOOL_DIR, "recipe-images-override.json");
  let recipes = {};

  if (fs.existsSync(imagePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(imagePath, "utf8"));
      recipes = parsed && parsed.recipes ? parsed.recipes : {};
    } catch (error) {
      console.warn("Unable to parse recipe-images.json, falling back to tool image.", error.message);
    }
  }

  if (fs.existsSync(overridePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(overridePath, "utf8"));
      const overrides = parsed && parsed.recipes ? parsed.recipes : {};
      Object.keys(overrides).forEach((slug) => {
        if (slug.startsWith("_")) return;
        recipes[slug] = {
          ...recipes[slug],
          ...overrides[slug],
          manual_override: true
        };
      });
    } catch (error) {
      console.warn("Unable to parse recipe-images-override.json.", error.message);
    }
  }

  return recipes;
}

function findLocalRecipeImage(slug) {
  const safeSlug = slugify(slug);
  if (!safeSlug) return null;

  const aliases = LOCAL_RECIPE_IMAGE_ALIASES[safeSlug] || [];
  for (const asset of aliases) {
    const relativePath = `/assets/img/kitchen/${asset}`;
    const absolutePath = path.join(ROOT, relativePath.replace(/^\//, ""));
    if (fs.existsSync(absolutePath)) {
      return relativePath;
    }
  }

  const extensions = [".webp", ".jpg", ".jpeg", ".png"];
  for (const extension of extensions) {
    const relativePath = `/assets/img/kitchen/${safeSlug}${extension}`;
    const absolutePath = path.join(ROOT, relativePath.replace(/^\//, ""));
    if (fs.existsSync(absolutePath)) {
      return relativePath;
    }
  }

  return null;
}

function resolveRecipeMedia(recipe, recipeImages) {
  const localImage = findLocalRecipeImage(recipe.slug);
  if (localImage) {
    return {
      pageImage: localImage,
      socialImage: `${SITE_ORIGIN}${localImage}`,
      credit: null
    };
  }

  const fromManifest = recipeImages[recipe.slug];
  if (fromManifest && fromManifest.full && fromManifest.manual_override) {
    return {
      pageImage: fromManifest.full,
      socialImage: fromManifest.full,
      credit: fromManifest.photographer
        ? {
            photographer: fromManifest.photographer,
            photographerUrl: fromManifest.photographer_url || "",
            source: fromManifest.source || "Unsplash"
          }
        : null
    };
  }

  if (recipe.image_url) {
    return {
      pageImage: recipe.image_url,
      socialImage: recipe.image_url.startsWith("http")
        ? recipe.image_url
        : `${SITE_ORIGIN}${recipe.image_url}`,
      credit: null
    };
  }

  return {
    pageImage: null,
    socialImage: TOOL_OG_IMAGE,
    credit: null
  };
}

function buildSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function fetchAllRows(makeQuery, pageSize) {
  const rows = [];
  const size = pageSize || 1000;
  let start = 0;

  while (true) {
    const query = makeQuery().range(start, start + size - 1);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < size) break;
    start += size;
  }

  return rows;
}

function groupRowsBy(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    const value = row[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row);
  });
  return map;
}

function compareRecipes(left, right) {
  return (
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    (right.view_count || 0) - (left.view_count || 0) ||
    left.country_name.localeCompare(right.country_name) ||
    left.name.localeCompare(right.name) ||
    left.slug.localeCompare(right.slug)
  );
}

function compareCountryRecipeSummaries(left, right) {
  return (
    Number(Boolean(right.generated_in_wave)) - Number(Boolean(left.generated_in_wave)) ||
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    (right.total_time_minutes || 0) - (left.total_time_minutes || 0) ||
    left.name.localeCompare(right.name) ||
    left.slug.localeCompare(right.slug)
  );
}

function compareCountryRecords(left, right) {
  return left.country_name.localeCompare(right.country_name);
}

function compareCollectionMemberships(left, right) {
  return (
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    (left.total_recipes || 0) - (right.total_recipes || 0) ||
    left.name.localeCompare(right.name) ||
    left.slug.localeCompare(right.slug)
  );
}

function compareCountryCollectionLinks(left, right) {
  return (
    (right.recipe_count || 0) - (left.recipe_count || 0) ||
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    (left.total_recipes || 0) - (right.total_recipes || 0) ||
    left.name.localeCompare(right.name) ||
    left.slug.localeCompare(right.slug)
  );
}

function compareCollectionCountryLinks(left, right) {
  return (
    (right.recipe_count || 0) - (left.recipe_count || 0) ||
    left.country_name.localeCompare(right.country_name) ||
    left.country_code.localeCompare(right.country_code)
  );
}

function compareCollectionRecords(left, right) {
  return (
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    left.name.localeCompare(right.name) ||
    left.slug.localeCompare(right.slug)
  );
}

function buildCountryDescription(country) {
  const highlighted = humanList(
    country.recipes
      .filter((recipe) => recipe.generated_in_wave)
      .map((recipe) => recipe.name),
    3
  );
  const fallbackNames = humanList(country.recipes.map((recipe) => recipe.name), 3);
  const recipeLead = highlighted || fallbackNames;
  return excerpt(
    `Discover ${country.total_recipes} ${country.country_name} recipes on AfroKitchen, including ${recipeLead}. Browse traditional dishes, regional context, and the wider African food atlas from one country hub.`,
    158
  );
}

function buildCollectionDescription(collection) {
  const highlightedRecipes = humanList(
    collection.recipes
      .filter((recipe) => recipe.generated_in_wave)
      .map((recipe) => recipe.name),
    3
  );
  const fallbackRecipes = humanList(collection.recipes.map((recipe) => recipe.name), 3);
  const highlightedCountries = humanList(
    collection.related_countries.map((country) => country.country_name),
    3
  );

  return excerpt(
    `Explore ${collection.name} on AfroKitchen with ${collection.total_recipes} recipes from ${collection.country_count} African countries, including ${highlightedRecipes || fallbackRecipes}. Follow dishes from ${highlightedCountries || "across the continent"} in one focused collection.`,
    158
  );
}

function normalizeRecipe(recipe) {
  return {
    ...recipe,
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    diet_tags: Array.isArray(recipe.diet_tags) ? recipe.diet_tags : [],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    reviews: Array.isArray(recipe.reviews) ? recipe.reviews : [],
    description: normalizeText(recipe.description),
    story: normalizeText(recipe.story),
    best_served_with: normalizeText(recipe.best_served_with),
    regional_variations: normalizeText(recipe.regional_variations),
    occasion: normalizeText(recipe.occasion),
    name_local: normalizeText(recipe.name_local),
    image_alt: normalizeText(recipe.image_alt),
    default_servings: recipe.default_servings || 1,
    total_time_minutes:
      recipe.total_time_minutes || (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0),
    country_slug: slugify(recipe.country_name),
    route_path: recipeRoutePath(recipe.slug),
    route_url: recipeUrl(recipe.slug),
    fallback_path: fallbackRecipePath(recipe.slug),
    fallback_url: fallbackRecipeUrl(recipe.slug)
  };
}

function collectStaticRecipeBlockers(recipe) {
  const blockers = [];

  if (!normalizeText(recipe.slug)) blockers.push("missing_slug");
  if (!normalizeText(recipe.name)) blockers.push("missing_name");
  if (!normalizeText(recipe.description)) blockers.push("missing_description");
  if (!normalizeText(recipe.country_code) || !normalizeText(recipe.country_name)) {
    blockers.push("missing_country");
  }
  if (!recipe.default_servings) blockers.push("missing_default_servings");
  if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
    blockers.push("missing_ingredients");
  }
  if (!Array.isArray(recipe.steps) || !recipe.steps.length) {
    blockers.push("missing_steps");
  }

  return blockers;
}

function selectProductionWave(recipes, strategy) {
  const rule = strategy || DEFAULT_WAVE_STRATEGY;
  const ordered = recipes.slice().sort(compareRecipes);

  if (rule === "all_verified") {
    return ordered;
  }

  if (rule === "featured_verified") {
    return ordered.filter((recipe) => recipe.is_featured);
  }

  const selected = new Map();
  ordered.forEach((recipe) => {
    if (recipe.is_featured) {
      selected.set(recipe.slug, recipe);
    }
  });

  const byCountry = new Map();
  ordered.forEach((recipe) => {
    if (!byCountry.has(recipe.country_code)) {
      byCountry.set(recipe.country_code, []);
    }
    byCountry.get(recipe.country_code).push(recipe);
  });

  Array.from(byCountry.values())
    .sort((left, right) => compareCountryRecords(left[0], right[0]))
    .forEach((recipesForCountry) => {
      if (recipesForCountry.some((recipe) => recipe.is_featured)) return;
      const seedRecipe = recipesForCountry
        .slice()
        .sort(
          (left, right) =>
            (right.view_count || 0) - (left.view_count || 0) ||
            left.name.localeCompare(right.name) ||
            left.slug.localeCompare(right.slug)
        )[0];
      if (seedRecipe) selected.set(seedRecipe.slug, seedRecipe);
    });

  return Array.from(selected.values()).sort(compareRecipes);
}

function buildCountryManifest(recipes) {
  const countryMap = new Map();

  recipes.forEach((recipe) => {
    if (!countryMap.has(recipe.country_code)) {
      countryMap.set(recipe.country_code, {
        country_code: recipe.country_code,
        country_name: recipe.country_name,
        country_slug: recipe.country_slug,
        region: recipe.region,
        total_recipes: 0,
        featured_recipes: 0,
        generated_recipe_count: 0,
        recipes: []
      });
    }

    const country = countryMap.get(recipe.country_code);
    country.recipes.push({
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      difficulty: recipe.difficulty,
      total_time_minutes: recipe.total_time_minutes,
      default_servings: recipe.default_servings,
      generated_in_wave: recipe.generated_in_wave,
      is_featured: Boolean(recipe.is_featured),
      route_path: recipe.route_path,
      route_url: recipe.route_url,
      fallback_path: recipe.fallback_path,
      fallback_url: recipe.fallback_url
    });
    country.total_recipes += 1;
    if (recipe.is_featured) country.featured_recipes += 1;
    if (recipe.generated_in_wave) country.generated_recipe_count += 1;
  });

  return Array.from(countryMap.values())
    .map((country) => {
      country.recipes.sort(compareCountryRecipeSummaries);
      country.description = buildCountryDescription(country);
      country.route_path = countryRoutePath(country.country_slug);
      country.route_url = countryUrl(country.country_slug);
      country.fallback_path = fallbackCountryPath(country.country_code);
      country.fallback_url = fallbackCountryUrl(country.country_code);
      country.top_recipe_names = country.recipes.slice(0, 3).map((recipe) => recipe.name);
      country.generated_recipe_slugs = country.recipes
        .filter((recipe) => recipe.generated_in_wave)
        .map((recipe) => recipe.slug);
      return country;
    })
    .sort(compareCountryRecords);
}

function buildCollectionManifest(recipes, countries, collectionRows) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const countryByCode = new Map(countries.map((country) => [country.country_code, country]));

  return (collectionRows || [])
    .map((collection) => {
      const seenRecipeIds = new Set();
      const recipeIds = Array.isArray(collection.recipe_ids) ? collection.recipe_ids : [];
      const memberRecipes = recipeIds
        .map((recipeId) => recipeById.get(recipeId))
        .filter(Boolean)
        .filter((recipe) => {
          if (seenRecipeIds.has(recipe.id)) return false;
          seenRecipeIds.add(recipe.id);
          return true;
        })
        .sort(compareRecipes);

      const countryCounts = new Map();
      memberRecipes.forEach((recipe) => {
        const current = countryCounts.get(recipe.country_code) || 0;
        countryCounts.set(recipe.country_code, current + 1);
      });

      const relatedCountries = Array.from(countryCounts.entries())
        .map(([countryCode, recipeCount]) => {
          const country = countryByCode.get(countryCode);
          if (!country) return null;
          return {
            country_code: country.country_code,
            country_name: country.country_name,
            country_slug: country.country_slug,
            region: country.region,
            recipe_count: recipeCount,
            route_path: country.route_path,
            route_url: country.route_url
          };
        })
        .filter(Boolean)
        .sort(compareCollectionCountryLinks);

      const summary = {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: normalizeText(collection.description),
        image_url: normalizeText(collection.image_url),
        is_featured: Boolean(collection.is_featured),
        total_recipes: memberRecipes.length,
        generated_recipe_count: memberRecipes.filter((recipe) => recipe.generated_in_wave).length,
        country_count: relatedCountries.length,
        route_path: collectionRoutePath(collection.slug),
        route_url: collectionUrl(collection.slug),
        fallback_path: fallbackCollectionPath(collection.slug),
        fallback_url: fallbackCollectionUrl(collection.slug),
        top_recipe_names: memberRecipes.slice(0, 3).map((recipe) => recipe.name),
        generated_recipe_slugs: memberRecipes
          .filter((recipe) => recipe.generated_in_wave)
          .map((recipe) => recipe.slug),
        related_countries: relatedCountries,
        recipes: memberRecipes.map((recipe) => ({
          id: recipe.id,
          slug: recipe.slug,
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          difficulty: recipe.difficulty,
          total_time_minutes: recipe.total_time_minutes,
          default_servings: recipe.default_servings,
          generated_in_wave: recipe.generated_in_wave,
          is_featured: Boolean(recipe.is_featured),
          country_code: recipe.country_code,
          country_name: recipe.country_name,
          country_slug: recipe.country_slug,
          route_path: recipe.route_path,
          route_url: recipe.route_url,
          fallback_path: recipe.fallback_path,
          fallback_url: recipe.fallback_url
        }))
      };

      summary.description = summary.description || buildCollectionDescription(summary);
      return summary;
    })
    .sort(compareCollectionRecords);
}

function attachRecipeCollectionLinks(recipes, collections) {
  const memberships = new Map();

  (collections || []).forEach((collection) => {
    collection.recipes.forEach((recipe) => {
      if (!memberships.has(recipe.slug)) memberships.set(recipe.slug, []);
      memberships.get(recipe.slug).push({
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        is_featured: collection.is_featured,
        total_recipes: collection.total_recipes,
        route_path: collection.route_path,
        route_url: collection.route_url
      });
    });
  });

  return recipes.map((recipe) => {
    const recipeCollections = (memberships.get(recipe.slug) || [])
      .slice()
      .sort(compareCollectionMemberships);
    const primaryCollection = recipeCollections[0] || null;

    return {
      ...recipe,
      collection_count: recipeCollections.length,
      collections: recipeCollections,
      collection_slugs: recipeCollections.map((collection) => collection.slug),
      primary_collection_slug: primaryCollection ? primaryCollection.slug : "",
      primary_collection_name: primaryCollection ? primaryCollection.name : "",
      primary_collection_route_path: primaryCollection ? primaryCollection.route_path : "",
      primary_collection_route_url: primaryCollection ? primaryCollection.route_url : ""
    };
  });
}

function attachCountryCollectionLinks(countries, collections) {
  const relatedCollectionsByCountry = new Map();

  (collections || []).forEach((collection) => {
    (collection.related_countries || []).forEach((country) => {
      if (!relatedCollectionsByCountry.has(country.country_code)) {
        relatedCollectionsByCountry.set(country.country_code, []);
      }

      relatedCollectionsByCountry.get(country.country_code).push({
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        is_featured: collection.is_featured,
        total_recipes: collection.total_recipes,
        recipe_count: country.recipe_count,
        route_path: collection.route_path,
        route_url: collection.route_url
      });
    });
  });

  return countries.map((country) => ({
    ...country,
    related_collections: (relatedCollectionsByCountry.get(country.country_code) || [])
      .slice()
      .sort(compareCountryCollectionLinks)
      .slice(0, 3)
  }));
}

async function buildManifest(options) {
  const settings = options || {};
  const supabase = buildSupabaseClient();

  const recipes = await fetchAllRows(() =>
    supabase
      .from("recipes")
      .select("*")
      .eq("is_verified", true)
      .order("country_name", { ascending: true })
      .order("name", { ascending: true })
  );

  const ingredients = await fetchAllRows(() =>
    supabase
      .from("recipe_ingredients")
      .select("*")
      .order("recipe_id", { ascending: true })
      .order("sort_order", { ascending: true })
  );

  const steps = await fetchAllRows(() =>
    supabase
      .from("recipe_steps")
      .select("*")
      .order("recipe_id", { ascending: true })
      .order("step_number", { ascending: true })
  );

  const recipeMedia = await fetchAllRows(() =>
    supabase
      .from("recipe_media")
      .select("*")
      .order("recipe_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
  );

  const reviews = await fetchAllRows(() =>
    supabase
      .from("recipe_reviews")
      .select("recipe_id,rating")
      .order("recipe_id", { ascending: true })
  );

  const collectionRows = await fetchAllRows(() =>
    supabase
      .from("collections")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
  );

  const ingredientMap = groupRowsBy(ingredients, "recipe_id");
  const stepMap = groupRowsBy(steps, "recipe_id");
  const mediaMap = groupRowsBy(recipeMedia, "recipe_id");
  const reviewMap = groupRowsBy(reviews, "recipe_id");

  const attachedRecipes = recipes.map((recipe) => {
    const reviewRows = reviewMap.get(recipe.id) || [];
    const ratingTotal = reviewRows.reduce((sum, review) => sum + (review.rating || 0), 0);
    const reviewCount = reviewRows.length;

    return normalizeRecipe({
      ...recipe,
      ingredients: ingredientMap.get(recipe.id) || [],
      steps: stepMap.get(recipe.id) || [],
      media: mediaMap.get(recipe.id) || [],
      reviews: reviewRows,
      avg_rating: reviewCount ? Math.round((ratingTotal / reviewCount) * 10) / 10 : null,
      review_count: reviewCount
    });
  });

  const exclusions = [];
  const eligibleRecipes = [];
  const exclusionMap = new Map();

  attachedRecipes.forEach((recipe) => {
    const blockers = collectStaticRecipeBlockers(recipe);
    if (blockers.length) {
      exclusions.push({
        id: recipe.id,
        slug: recipe.slug,
        name: recipe.name,
        blockers
      });
      exclusionMap.set(recipe.id, blockers);
      return;
    }

    eligibleRecipes.push(recipe);
  });

  const waveRecipes = selectProductionWave(eligibleRecipes, settings.waveStrategy);
  const waveSet = new Set(waveRecipes.map((recipe) => recipe.slug));
  const recipesWithWave = attachedRecipes
    .map((recipe) => ({
      ...recipe,
      generated_in_wave: waveSet.has(recipe.slug),
      excluded_from_static: exclusionMap.has(recipe.id),
      exclusion_reasons: exclusionMap.get(recipe.id) || []
    }))
    .sort(compareRecipes);

  const countries = buildCountryManifest(recipesWithWave);
  const imageManifest = loadRecipeImages();
  const recipesWithImages = recipesWithWave.map((recipe) => {
    const media = resolveRecipeMedia(recipe, imageManifest);
    return {
      ...recipe,
      social_image: media.socialImage,
      page_image: media.pageImage,
      image_credit: media.credit
    };
  });

  const collections = buildCollectionManifest(recipesWithImages, countries, collectionRows);
  const recipesWithCollections = attachRecipeCollectionLinks(recipesWithImages, collections);
  const countriesWithCollections = attachCountryCollectionLinks(countries, collections);
  const collectionMembershipCount = collections.reduce(
    (sum, collection) => sum + collection.total_recipes,
    0
  );

  return {
    generated_at: new Date().toISOString(),
    source: {
      dataset: "supabase.public.recipes",
      collection_dataset: "supabase.public.collections",
      recipe_count: recipesWithCollections.length,
      verified_recipe_count: recipesWithCollections.length,
      static_eligible_recipe_count: eligibleRecipes.length,
      excluded_recipe_count: exclusions.length,
      featured_recipe_count: recipesWithCollections.filter((recipe) => recipe.is_featured).length,
      country_count: countriesWithCollections.length,
      collection_count: collections.length,
      featured_collection_count: collections.filter((collection) => collection.is_featured).length,
      collection_membership_count: collectionMembershipCount,
      recipe_media_count: recipeMedia.length,
      image_url_coverage: recipesWithCollections.filter((recipe) => normalizeText(recipe.image_url)).length,
      story_coverage: recipesWithCollections.filter((recipe) => normalizeText(recipe.story)).length
    },
    wave: {
      strategy: settings.waveStrategy || DEFAULT_WAVE_STRATEGY,
      description:
        (settings.waveStrategy || DEFAULT_WAVE_STRATEGY) === "featured_verified"
          ? "All verified featured recipes."
          : (settings.waveStrategy || DEFAULT_WAVE_STRATEGY) === "all_verified"
            ? "All verified recipes."
            : "All verified featured recipes plus the highest-view verified recipe for any country that would otherwise have no clean recipe route in this wave.",
      recipe_count: waveSet.size,
      exclusion_count: exclusions.length,
      country_hub_count: countriesWithCollections.length,
      collection_page_count: collections.length
    },
    routes: {
      generated_recipe_slugs: recipesWithCollections
        .filter((recipe) => recipe.generated_in_wave)
        .map((recipe) => recipe.slug),
      generated_country_codes: countriesWithCollections.map((country) => country.country_code),
      generated_country_slugs: countriesWithCollections.map((country) => country.country_slug),
      generated_collection_slugs: collections.map((collection) => collection.slug)
    },
    countries: countriesWithCollections,
    collections,
    exclusions,
    recipes: recipesWithCollections
  };
}

function writeManifest(manifest, targetPath) {
  const outputPath = targetPath || MANIFEST_PATH;
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return outputPath;
}

function loadManifest(manifestPath) {
  const targetPath = manifestPath || MANIFEST_PATH;
  return JSON.parse(fs.readFileSync(targetPath, "utf8"));
}

function writeStaticRoutes(manifest, targetPath) {
  const outputPath = targetPath || ROUTES_PATH;
  const recipeRoutes = {};
  const countryRoutes = {};
  const collectionRoutes = {};

  manifest.recipes.forEach((recipe) => {
    if (recipe.generated_in_wave) {
      recipeRoutes[recipe.slug] = recipe.route_path;
    }
  });

  manifest.countries.forEach((country) => {
    countryRoutes[country.country_code] = country.route_path;
    countryRoutes[country.country_slug] = country.route_path;
  });

  (manifest.collections || []).forEach((collection) => {
    collectionRoutes[collection.slug] = collection.route_path;
  });

  const output = `(function (window) {
  'use strict';

  var recipeRoutes = ${safeJson(recipeRoutes)};
  var countryRoutes = ${safeJson(countryRoutes)};
  var collectionRoutes = ${safeJson(collectionRoutes)};

  function normalizeCountryKey(value) {
    var input = String(value || '').trim();
    if (!input) return '';
    var upper = input.toUpperCase();
    if (/^[A-Z]{2}$/.test(upper)) return upper;
    return input
      .normalize('NFKD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function fallbackRecipeUrl(slug) {
    return '/tools/afrokitchen/recipe.html?slug=' + encodeURIComponent(slug || '');
  }

  function fallbackCountryUrl(value) {
    return '/tools/afrokitchen/country.html?country=' + encodeURIComponent(String(value || '').trim().toUpperCase());
  }

  function fallbackCollectionUrl(slug) {
    return '/tools/afrokitchen/collection.html?slug=' + encodeURIComponent(slug || '');
  }

  window.AfroKitchenStaticRoutes = {
    recipes: recipeRoutes,
    countries: countryRoutes,
    collections: collectionRoutes,
    hasRecipe: function (slug) {
      return Object.prototype.hasOwnProperty.call(recipeRoutes, slug);
    },
    hasCollection: function (slug) {
      return Object.prototype.hasOwnProperty.call(collectionRoutes, slug);
    },
    recipe: function (slug) {
      return recipeRoutes[slug] || fallbackRecipeUrl(slug);
    },
    fallbackRecipe: fallbackRecipeUrl,
    country: function (value) {
      var key = normalizeCountryKey(value);
      return countryRoutes[key] || fallbackCountryUrl(value);
    },
    fallbackCountry: fallbackCountryUrl,
    collection: function (slug) {
      return collectionRoutes[slug] || fallbackCollectionUrl(slug);
    },
    fallbackCollection: fallbackCollectionUrl
  };
})(window);
`;

  fs.writeFileSync(outputPath, output, "utf8");
  return outputPath;
}

module.exports = {
  ROOT,
  TOOL_DIR,
  RECIPES_DIR,
  COUNTRIES_DIR,
  COLLECTIONS_DIR,
  MANIFEST_PATH,
  ROUTES_PATH,
  SITE_ORIGIN,
  TOOL_OG_IMAGE,
  DEFAULT_WAVE_STRATEGY,
  escapeHtml,
  safeJson,
  ensureDir,
  normalizeText,
  slugify,
  excerpt,
  humanList,
  recipeRoutePath,
  recipeUrl,
  fallbackRecipePath,
  fallbackRecipeUrl,
  countryRoutePath,
  countryUrl,
  fallbackCountryPath,
  fallbackCountryUrl,
  collectionRoutePath,
  collectionUrl,
  fallbackCollectionPath,
  fallbackCollectionUrl,
  loadAfroKitchenEngine,
  loadRecipeImages,
  findLocalRecipeImage,
  resolveRecipeMedia,
  buildManifest,
  writeManifest,
  loadManifest,
  writeStaticRoutes
};
