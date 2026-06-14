"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  TOOL_DIR,
  SITE_ORIGIN,
  ensureDir,
  writeTextFileSync,
  normalizeText,
  slugify,
  excerpt,
  isUsableRecipeImage
} = require("./afrokitchen-static");

const RULES_PATH = path.join(ROOT, "data", "afrokitchen", "cuisine-intelligence-rules.json");
const PUBLIC_PATH = path.join(TOOL_DIR, "cuisine-intelligence.json");
const PUBLIC_JS_PATH = path.join(TOOL_DIR, "cuisine-intelligence-data.js");
const REPORT_PATH = path.join(ROOT, "data", "afrokitchen", "cuisine-intelligence-report.json");
const SHOT_LIST_CSV_PATH = path.join(ROOT, "data", "afrokitchen", "recipe-image-shot-list.csv");
const SHOT_LIST_MD_PATH = path.join(TOOL_DIR, "AFROKITCHEN_IMAGE_SHOT_LIST.md");

function loadCuisineRules() {
  return JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));
}

function compact(value) {
  return normalizeText(value).toLowerCase();
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function cleanEditorialText(value) {
  return normalizeText(value)
    .replace(/\ba table built around\b/gi, "served with")
    .replace(/\btable built around\b/gi, "served with")
    .replace(/\bbuilt around\b/gi, "made with")
    .replace(/\ba Eswatini\b/g, "an Eswatini")
    .replace(/\bverified ([A-Z][A-Za-z -]+) dish in the AfroKitchen archive\b/g, "structured $1 dish in the AfroKitchen archive");
}

function recipeSearchText(recipe) {
  return compact(
    [
      recipe.slug,
      recipe.name,
      recipe.name_local,
      recipe.description,
      recipe.story,
      recipe.country_name,
      recipe.region,
      recipe.category,
      recipe.occasion,
      recipe.best_served_with,
      recipe.regional_variations,
      ...(Array.isArray(recipe.tags) ? recipe.tags : []),
      ...(Array.isArray(recipe.diet_tags) ? recipe.diet_tags : []),
      ...(Array.isArray(recipe.ingredients) ? recipe.ingredients.map((item) => item.name) : [])
    ].join(" ")
  );
}

function recipeMatchesKeyword(recipe, keyword) {
  const needle = compact(keyword);
  if (!needle) return false;
  return recipeSearchText(recipe).includes(needle);
}

function assignRegionalLens(recipe, rules) {
  const countryRules = rules.countries && rules.countries[recipe.country_code];
  if (!countryRules || !Array.isArray(countryRules.regions)) {
    return {
      slug: "national-table",
      name: `${recipe.country_name} national table`,
      description: `A structured ${recipe.country_name} dish in the AfroKitchen archive.`,
      confidence: "medium",
      match_reason: "country-level fallback"
    };
  }

  const scored = countryRules.regions
    .map((region) => {
      let score = 0;
      const reasons = [];
      if ((region.recipe_slugs || []).includes(recipe.slug)) {
        score += 100;
        reasons.push("curated recipe mapping");
      }
      (region.keywords || []).forEach((keyword) => {
        if (recipeMatchesKeyword(recipe, keyword)) {
          score += 8;
          reasons.push(keyword);
        }
      });
      return { region, score, reasons };
    })
    .sort((left, right) => right.score - left.score);

  const best = scored[0];
  if (best && best.score > 0) {
    return {
      slug: best.region.slug,
      name: best.region.name,
      description: cleanEditorialText(best.region.description),
      confidence: best.score >= 100 ? "high" : "medium",
      match_reason: unique(best.reasons).slice(0, 4).join(", ")
    };
  }

  return {
    slug: "national-table",
    name: `${recipe.country_name} national table`,
    description: cleanEditorialText(countryRules.description || `A structured ${recipe.country_name} dish in the AfroKitchen archive.`),
    confidence: "medium",
    match_reason: "country-level fallback"
  };
}

function hasAnyKeyword(recipe, keywords) {
  return (keywords || []).some((keyword) => recipeMatchesKeyword(recipe, keyword));
}

function hasAnyValue(values, allowed) {
  const set = new Set((values || []).map(compact));
  return (allowed || []).some((value) => set.has(compact(value)));
}

function buildChefNotes(recipe, rules) {
  const coreText = compact(
    [
      recipe.slug,
      recipe.name,
      recipe.name_local,
      recipe.description,
      recipe.story,
      recipe.category,
      recipe.occasion,
      recipe.regional_variations,
      ...(Array.isArray(recipe.tags) ? recipe.tags : []),
      ...(Array.isArray(recipe.diet_tags) ? recipe.diet_tags : []),
      ...(Array.isArray(recipe.ingredients) ? recipe.ingredients.map((item) => item.name) : [])
    ].join(" ")
  );
  const category = compact(recipe.category);
  const mistakes = [];
  const readiness = [];

  if (coreText.includes("rice") || category === "rice") {
    mistakes.push("Adding too much liquid after the rice goes in.");
    mistakes.push("Stirring too often once the grains should be steaming.");
    readiness.push("The grains should be tender but still distinct, with steam carrying the seasoning upward.");
  }

  if (category === "soup" || category === "stew" || coreText.includes("soup") || coreText.includes("stew")) {
    mistakes.push("Stopping the base before the pepper, onion, or spice edge has mellowed.");
    mistakes.push("Thinning the pot before the body of the soup or stew has developed.");
    readiness.push("The sauce should coat the spoon and taste rounded, not watery or raw.");
  }

  if (coreText.includes("leaf") || coreText.includes("greens") || coreText.includes("waterleaf") || coreText.includes("collard")) {
    mistakes.push("Overcooking the greens until the color and texture collapse.");
    readiness.push("Greens should be cooked through but still look alive and glossy.");
  }

  if (coreText.includes("grill") || coreText.includes("suya") || coreText.includes("dibi") || coreText.includes("choma")) {
    mistakes.push("Skipping the resting time after grilling.");
    readiness.push("The surface should be deeply colored while the center stays juicy.");
  }

  if (coreText.includes("sealed") || coreText.includes("no-water") || coreText.includes("no water")) {
    mistakes.push("Opening the pot too often or adding water before the ingredients release their own juices.");
    readiness.push("The pot should smell concentrated and steamy, with vegetables collapsed into their own sauce.");
  }

  if (coreText.includes("ferment") || coreText.includes("injera") || coreText.includes("msemen") || coreText.includes("bread")) {
    mistakes.push("Rushing the rest or fermentation period.");
    readiness.push("The bread or batter should smell pleasantly fermented, toasted, or nutty rather than floury.");
  }

  const defaults = rules.default_notes || {};
  const countryRules = rules.countries && rules.countries[recipe.country_code] ? rules.countries[recipe.country_code] : {};
  const pantry = (countryRules.pantry || []).slice(0, 5);
  const techniques = (countryRules.techniques || []).slice(0, 4);
  const serveWith = normalizeText(recipe.best_served_with)
    ? recipe.best_served_with
    : "Use the country hub to pick a matching side, starch, sauce, salad, or drink.";

  return {
    common_mistakes: unique(mistakes.concat(defaults.mistakes || [])).slice(0, 4),
    readiness_cues: unique(readiness.concat(defaults.readiness || [])).slice(0, 4),
    pantry_notes: pantry,
    technique_notes: techniques,
    serve_with: serveWith
  };
}

function localImagePathExists(relativePath) {
  if (!relativePath || !relativePath.startsWith("/")) return false;
  return fs.existsSync(path.join(ROOT, relativePath.replace(/^\//, "")));
}

function collectLocalImagePaths(slug) {
  const safeSlug = slugify(slug);
  const stems = [safeSlug, `${safeSlug}-1`, `${safeSlug}-2`, `${safeSlug}-3`, `${safeSlug}-4`, `${safeSlug}-5`];
  const extensions = [".webp", ".jpg", ".jpeg", ".png"];
  const matches = [];
  stems.forEach((stem) => {
    extensions.forEach((extension) => {
      const relativePath = `/assets/img/kitchen/${stem}${extension}`;
      if (localImagePathExists(relativePath)) matches.push(relativePath);
    });
  });
  return unique(matches);
}

function collectRecipeImageSources(recipe, recipeImages) {
  const sources = [];
  collectLocalImagePaths(recipe.slug).forEach((source) => sources.push(source));
  if (isUsableRecipeImage(recipe.image_url)) sources.push(recipe.image_url);

  const manifestEntry = recipeImages && recipeImages[recipe.slug] ? recipeImages[recipe.slug] : {};
  if (manifestEntry.full && manifestEntry.manual_override && isUsableRecipeImage(manifestEntry.full)) sources.push(manifestEntry.full);
  const manifestGallery = manifestEntry.manual_override
    ? []
      .concat(Array.isArray(manifestEntry.images) ? manifestEntry.images : [])
      .concat(Array.isArray(manifestEntry.gallery) ? manifestEntry.gallery : [])
    : [];
  manifestGallery
    .concat(Array.isArray(recipe.media) ? recipe.media : [])
    .concat(Array.isArray(recipe.recipe_media) ? recipe.recipe_media : [])
    .forEach((entry) => {
      if (typeof entry === "string") {
        if (isUsableRecipeImage(entry)) sources.push(entry);
        return;
      }
      if (entry && typeof entry === "object") {
        const source = entry.full || entry.url || entry.src || entry.image_url;
        if (isUsableRecipeImage(source)) sources.push(source);
      }
    });

  return unique(sources);
}

function buildImageStatus(recipe, recipeImages, rules) {
  const roles = rules.image_roles || [];
  const sources = collectRecipeImageSources(recipe, recipeImages);
  const galleryCount = Math.min(sources.length, roles.length || 5);
  const status = galleryCount >= 3 ? "gallery-ready" : galleryCount >= 1 ? "hero-ready" : "missing";
  const missingRoles = roles.slice(galleryCount).map((role) => role.role);
  const shots = roles.map((role) => {
    const filename = `${recipe.slug}${role.suffix || ""}.webp`;
    return {
      role: role.role,
      label: role.label,
      filename,
      route_path: recipe.route_path,
      prompt: `Finished ${recipe.name}, ${recipe.category || "recipe"} from ${recipe.country_name}, ${role.prompt_note}.`
    };
  });

  return {
    status,
    gallery_count: galleryCount,
    hero_ready: galleryCount > 0,
    hero_src: sources[0] || "",
    local_image_count: collectLocalImagePaths(recipe.slug).length,
    sources: sources.slice(0, 5),
    missing_roles: missingRoles,
    shots
  };
}

function researchStatusFor(recipe, researchAudit) {
  const entry = researchAudit && researchAudit[recipe.slug] ? researchAudit[recipe.slug] : null;
  return {
    status: entry ? entry.status || "reviewed" : "not-audited",
    confidence: entry ? entry.confidence || "medium" : "unknown",
    reviewed_at: entry ? entry.reviewed_at || "" : ""
  };
}

function scoreRecipe(recipe, researchAudit, imageStatus) {
  const research = researchStatusFor(recipe, researchAudit);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const timedSteps = steps.filter((step) => Number(step.timer_seconds || 0) > 0).length;
  const checks = [
    { key: "identity", points: 8, pass: recipe.slug && recipe.name && recipe.country_code && recipe.country_name },
    { key: "description", points: 8, pass: normalizeText(recipe.description).length >= 70 },
    { key: "story", points: 10, pass: normalizeText(recipe.story).length >= 120 },
    { key: "ingredients", points: 12, pass: ingredients.length >= 5 },
    { key: "ingredient_quantities", points: 8, pass: ingredients.filter((item) => item.amount != null || normalizeText(item.unit)).length >= Math.min(ingredients.length, 4) },
    { key: "steps", points: 12, pass: steps.length >= 3 },
    { key: "timers", points: 8, pass: timedSteps >= 1 },
    { key: "serving_notes", points: 8, pass: normalizeText(recipe.best_served_with).length >= 16 },
    { key: "regional_variations", points: 8, pass: normalizeText(recipe.regional_variations).length >= 30 },
    { key: "nutrition", points: 6, pass: Number(recipe.calories || 0) > 0 && Number(recipe.protein_g || 0) >= 0 },
    { key: "research_review", points: 12, pass: research.status === "audited" || research.status === "reviewed" },
    { key: "image", points: 8, pass: imageStatus.hero_ready }
  ];
  const score = checks.reduce((sum, check) => sum + (check.pass ? check.points : 0), 0);
  const missing = checks.filter((check) => !check.pass).map((check) => check.key);
  const grade = score >= 88 ? "A" : score >= 76 ? "B" : score >= 62 ? "C" : "D";
  const editorialStatus =
    !imageStatus.hero_ready ? "needs-image" : score >= 88 ? "chef-ready" : score >= 76 ? "publish-ready" : "needs-editorial";

  return {
    score,
    grade,
    editorial_status: editorialStatus,
    missing,
    research
  };
}

function buildMenuTags(recipe, lens) {
  const tags = unique(
    []
      .concat(Array.isArray(recipe.tags) ? recipe.tags : [])
      .concat(Array.isArray(recipe.diet_tags) ? recipe.diet_tags : [])
      .concat([recipe.category, recipe.occasion, recipe.country_name, recipe.region, lens.slug])
  );
  return tags.map(slugify).filter(Boolean).slice(0, 14);
}

function matchCuratedCollection(recipe, rule) {
  if ((rule.priority_recipe_slugs || []).includes(recipe.slug)) return true;
  if (rule.country_codes && rule.country_codes.length && !rule.country_codes.includes(recipe.country_code)) return false;
  if (rule.regions && rule.regions.length && !rule.regions.includes(recipe.region)) return false;
  if (rule.categories && rule.categories.length && !rule.categories.includes(recipe.category)) return false;
  if (rule.diet_tags_any && rule.diet_tags_any.length && !hasAnyValue(recipe.diet_tags, rule.diet_tags_any)) return false;
  if (rule.max_time_minutes && Number(recipe.total_time_minutes || 0) > rule.max_time_minutes) return false;
  if (rule.keywords && rule.keywords.length && !hasAnyKeyword(recipe, rule.keywords)) return false;
  return true;
}

function recipeSortForCollection(rule, left, right) {
  const priority = new Map((rule.priority_recipe_slugs || []).map((slug, index) => [slug, index]));
  const leftPriority = priority.has(left.slug) ? priority.get(left.slug) : 999;
  const rightPriority = priority.has(right.slug) ? priority.get(right.slug) : 999;
  return (
    leftPriority - rightPriority ||
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    (right.view_count || 0) - (left.view_count || 0) ||
    left.country_name.localeCompare(right.country_name) ||
    left.name.localeCompare(right.name)
  );
}

function summarizeRecipeForCollection(recipe) {
  return {
    id: recipe.id,
    slug: recipe.slug,
    name: recipe.name,
    description: recipe.description,
    category: recipe.category,
    difficulty: recipe.difficulty,
    total_time_minutes: recipe.total_time_minutes,
    default_servings: recipe.default_servings,
    diet_tags: Array.isArray(recipe.diet_tags) ? recipe.diet_tags : [],
    generated_in_wave: recipe.generated_in_wave,
    is_featured: Boolean(recipe.is_featured),
    country_code: recipe.country_code,
    country_name: recipe.country_name,
    country_slug: recipe.country_slug,
    region: recipe.region,
    route_path: recipe.route_path,
    route_url: recipe.route_url,
    fallback_path: recipe.fallback_path,
    fallback_url: recipe.fallback_url
  };
}

function buildCuratedCollections(manifest, rules) {
  const countryByCode = new Map((manifest.countries || []).map((country) => [country.country_code, country]));
  return (rules.curated_collections || [])
    .map((rule) => {
      const recipes = (manifest.recipes || [])
        .filter((recipe) => recipe.generated_in_wave)
        .filter((recipe) => matchCuratedCollection(recipe, rule))
        .sort((left, right) => recipeSortForCollection(rule, left, right))
        .slice(0, rule.limit || 24);

      if (!recipes.length) return null;

      const countryCounts = new Map();
      recipes.forEach((recipe) => {
        countryCounts.set(recipe.country_code, (countryCounts.get(recipe.country_code) || 0) + 1);
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
        .sort((left, right) => right.recipe_count - left.recipe_count || left.country_name.localeCompare(right.country_name));

      return {
        id: `ak-curated-${rule.slug}`,
        slug: rule.slug,
        name: rule.name,
        description: rule.description,
        image_url: "",
        is_featured: Boolean(rule.is_featured),
        is_cuisine_intelligence: true,
        total_recipes: recipes.length,
        generated_recipe_count: recipes.length,
        country_count: relatedCountries.length,
        route_path: `/tools/afrokitchen/collections/${rule.slug}/`,
        route_url: `${SITE_ORIGIN}/tools/afrokitchen/collections/${rule.slug}/`,
        fallback_path: `/tools/afrokitchen/collection.html?slug=${encodeURIComponent(rule.slug)}`,
        fallback_url: `${SITE_ORIGIN}/tools/afrokitchen/collection.html?slug=${encodeURIComponent(rule.slug)}`,
        top_recipe_names: recipes.slice(0, 3).map((recipe) => recipe.name),
        generated_recipe_slugs: recipes.map((recipe) => recipe.slug),
        related_countries: relatedCountries,
        recipes: recipes.map(summarizeRecipeForCollection)
      };
    })
    .filter(Boolean);
}

function mergeIntelligenceCollections(manifest, intelligence) {
  const existingSlugs = new Set((manifest.collections || []).map((collection) => collection.slug));
  const additions = (intelligence.curated_collections || []).filter((collection) => !existingSlugs.has(collection.slug));
  if (!additions.length) return manifest;

  manifest.collections = (manifest.collections || []).concat(additions);
  manifest.routes.generated_collection_slugs = manifest.collections.map((collection) => collection.slug);
  manifest.source.collection_count = manifest.collections.length;
  manifest.source.curated_collection_count = additions.length;
  manifest.source.featured_collection_count = manifest.collections.filter((collection) => collection.is_featured).length;
  manifest.source.collection_membership_count = manifest.collections.reduce(
    (sum, collection) => sum + Number(collection.total_recipes || 0),
    0
  );
  manifest.wave.collection_page_count = manifest.collections.length;
  return manifest;
}

function buildCountryInsights(manifest, recipeInsights, rules) {
  const countries = {};
  (manifest.countries || []).forEach((country) => {
    const countryRules = rules.countries && rules.countries[country.country_code] ? rules.countries[country.country_code] : {};
    const regionMap = new Map();
    (country.recipes || []).forEach((recipeSummary) => {
      const insight = recipeInsights[recipeSummary.slug];
      if (!insight) return;
      const key = insight.region_lens.slug;
      if (!regionMap.has(key)) {
        regionMap.set(key, {
          slug: key,
          name: insight.region_lens.name,
          description: insight.region_lens.description,
          recipes: []
        });
      }
      regionMap.get(key).recipes.push({
        slug: recipeSummary.slug,
        name: recipeSummary.name,
        route_path: recipeSummary.route_path,
        category: recipeSummary.category,
        total_time_minutes: recipeSummary.total_time_minutes,
        image_status: insight.image.status,
        quality_grade: insight.quality.grade
      });
    });

    const regions = Array.from(regionMap.values())
      .map((region) => ({
        ...region,
        recipe_count: region.recipes.length,
        recipes: region.recipes.slice(0, 8)
      }))
      .sort((left, right) => right.recipe_count - left.recipe_count || left.name.localeCompare(right.name));

    const recipeInsightsForCountry = (country.recipes || [])
      .map((recipe) => recipeInsights[recipe.slug])
      .filter(Boolean);

    countries[country.country_code] = {
      country_code: country.country_code,
      country_name: country.country_name,
      route_path: country.route_path,
      pantry: countryRules.pantry || [],
      techniques: countryRules.techniques || [],
      regions,
      start_here: (country.recipes || []).slice(0, 4).map((recipe) => ({
        slug: recipe.slug,
        name: recipe.name,
        route_path: recipe.route_path
      })),
      image_coverage: recipeInsightsForCountry.filter((insight) => insight.image.hero_ready).length,
      chef_ready_count: recipeInsightsForCountry.filter((insight) => insight.quality.editorial_status === "chef-ready").length
    };
  });
  return countries;
}

function buildMenuBuilder(manifest, rules, recipeInsights) {
  const recipeBySlug = new Map((manifest.recipes || []).map((recipe) => [recipe.slug, recipe]));
  const menus = ((rules.menu_builder && rules.menu_builder.menus) || [])
    .map((menu) => {
      const recipes = (menu.recipe_slugs || [])
        .map((slug) => recipeBySlug.get(slug))
        .filter((recipe) => recipe && recipe.generated_in_wave)
        .map((recipe) => ({
          slug: recipe.slug,
          name: recipe.name,
          country_name: recipe.country_name,
          route_path: recipe.route_path,
          category: recipe.category,
          total_time_minutes: recipe.total_time_minutes,
          image_status: recipeInsights[recipe.slug] ? recipeInsights[recipe.slug].image.status : "missing"
        }));
      if (!recipes.length) return null;
      return {
        slug: menu.slug,
        name: menu.name,
        description: menu.description,
        total_minutes: recipes.reduce((max, recipe) => Math.max(max, recipe.total_time_minutes || 0), 0),
        recipes
      };
    })
    .filter(Boolean);

  return {
    filters: rules.menu_builder ? rules.menu_builder.filters : {},
    menus
  };
}

function summarizeRecipeForSocial(recipe, socialMeta, index, showcase) {
  const meta = socialMeta || {};
  return {
    slug: recipe.slug,
    name: recipe.name,
    country_code: recipe.country_code,
    country_name: recipe.country_name,
    route_path: recipe.route_path,
    route_url: recipe.route_url,
    category: recipe.category,
    total_time_minutes: recipe.total_time_minutes,
    rank: index + 1,
    showcase_slug: showcase.slug,
    showcase_name: showcase.name,
    showcase_route_path: `/tools/afrokitchen/collections/${showcase.slug}/`,
    hook: meta.hook || `${recipe.name} deserves the center of the table.`,
    why_it_moves: meta.why_it_moves || "It has enough visual, cultural, and serving energy to carry a shared table.",
    caption: meta.caption || `Cooking ${recipe.name} from ${recipe.country_name}.`,
    hosting_move: meta.hosting_move || "Serve it family-style so the dish can carry the room.",
    photo_angle: meta.photo_angle || "Shoot the finished plate in warm natural light with the main texture visible."
  };
}

function buildSocialShowcase(manifest, rules) {
  const socialRules = rules.social_showcase || {};
  const recipeBySlug = new Map((manifest.recipes || []).map((recipe) => [recipe.slug, recipe]));
  const showcase = {
    slug: socialRules.slug || "across-africa-showstoppers",
    name: socialRules.name || "Across Africa Showstoppers"
  };
  const recipes = (socialRules.recipe_slugs || [])
    .map((slug, index) => {
      const recipe = recipeBySlug.get(slug);
      if (!recipe || !recipe.generated_in_wave) return null;
      return summarizeRecipeForSocial(recipe, (socialRules.recipes || {})[slug], index, showcase);
    })
    .filter(Boolean);

  return {
    ...showcase,
    description:
      socialRules.description ||
      "A social cooking board for the dishes people photograph, debate, serve proudly, and remember.",
    hashtags: socialRules.hashtags || [],
    share_actions: socialRules.share_actions || [],
    total_recipes: recipes.length,
    recipes
  };
}

function attachCollectionRefsToRecipes(recipeInsights, curatedCollections) {
  (curatedCollections || []).forEach((collection) => {
    (collection.recipes || []).forEach((recipe) => {
      const insight = recipeInsights[recipe.slug];
      if (!insight) return;
      insight.curated_collections.push({
        slug: collection.slug,
        name: collection.name,
        route_path: collection.route_path
      });
    });
  });
}

function attachSocialRefsToRecipes(recipeInsights, socialShowcase) {
  (socialShowcase.recipes || []).forEach((recipe) => {
    const insight = recipeInsights[recipe.slug];
    if (!insight) return;
    insight.social = {
      is_showstopper: true,
      rank: recipe.rank,
      showcase_slug: socialShowcase.slug,
      showcase_name: socialShowcase.name,
      showcase_route_path: recipe.showcase_route_path,
      hook: recipe.hook,
      why_it_moves: recipe.why_it_moves,
      caption: recipe.caption,
      hosting_move: recipe.hosting_move,
      photo_angle: recipe.photo_angle
    };
  });
}

function buildCuisineIntelligence(manifest, options) {
  const settings = options || {};
  const rules = settings.rules || loadCuisineRules();
  const recipeImages = settings.recipeImages || {};
  const researchAudit = settings.researchAudit || {};
  const recipeInsights = {};
  const qualityRows = [];
  const imageRows = [];
  const shotRows = [];

  (manifest.recipes || []).forEach((recipe) => {
    const regionLens = assignRegionalLens(recipe, rules);
    const image = buildImageStatus(recipe, recipeImages, rules);
    const quality = scoreRecipe(recipe, researchAudit, image);
    const chefNotes = buildChefNotes(recipe, rules);
    const menuTags = buildMenuTags(recipe, regionLens);

    recipeInsights[recipe.slug] = {
      slug: recipe.slug,
      name: recipe.name,
      country_code: recipe.country_code,
      country_name: recipe.country_name,
      route_path: recipe.route_path,
      region_lens: regionLens,
      chef_notes: chefNotes,
      image,
      quality,
      menu_tags: menuTags,
      curated_collections: []
    };

    qualityRows.push({
      slug: recipe.slug,
      name: recipe.name,
      country: recipe.country_name,
      score: quality.score,
      grade: quality.grade,
      status: quality.editorial_status,
      missing: quality.missing
    });
    imageRows.push({
      slug: recipe.slug,
      name: recipe.name,
      country: recipe.country_name,
      status: image.status,
      gallery_count: image.gallery_count,
      missing_roles: image.missing_roles
    });
    image.shots.forEach((shot) => {
      shotRows.push({
        slug: recipe.slug,
        recipe: recipe.name,
        country: recipe.country_name,
        category: recipe.category,
        ...shot
      });
    });
  });

  const curatedCollections = buildCuratedCollections(manifest, rules);
  attachCollectionRefsToRecipes(recipeInsights, curatedCollections);
  const countries = buildCountryInsights(manifest, recipeInsights, rules);
  const menuBuilder = buildMenuBuilder(manifest, rules, recipeInsights);
  const socialShowcase = buildSocialShowcase(manifest, rules);
  attachSocialRefsToRecipes(recipeInsights, socialShowcase);
  const publicRecipes = {};
  Object.keys(recipeInsights).forEach((slug) => {
    const insight = recipeInsights[slug];
    publicRecipes[slug] = {
      slug: insight.slug,
      name: insight.name,
      country_code: insight.country_code,
      country_name: insight.country_name,
      route_path: insight.route_path,
      region_lens: insight.region_lens,
      chef_notes: insight.chef_notes,
      image: {
        status: insight.image.status,
        gallery_count: insight.image.gallery_count,
        hero_ready: insight.image.hero_ready,
        hero_src: insight.image.hero_src,
        missing_roles: insight.image.missing_roles
      },
      menu_tags: insight.menu_tags,
      curated_collections: insight.curated_collections,
      social: insight.social || null
    };
  });

  const generatedAt = new Date().toISOString();
  const summary = {
    generated_at: generatedAt,
    recipe_count: (manifest.recipes || []).length,
    country_count: (manifest.countries || []).length,
    curated_collection_count: curatedCollections.length,
    hero_image_count: imageRows.filter((row) => row.status !== "missing").length,
    gallery_ready_count: imageRows.filter((row) => row.status === "gallery-ready").length,
    chef_ready_count: qualityRows.filter((row) => row.status === "chef-ready").length,
    needs_image_count: qualityRows.filter((row) => row.status === "needs-image").length,
    showstopper_count: socialShowcase.total_recipes
  };

  return {
    version: rules.version,
    generated_at: generatedAt,
    summary,
    recipes: recipeInsights,
    public_recipes: publicRecipes,
    countries,
    curated_collections: curatedCollections,
    menu_builder: menuBuilder,
    social_showcase: socialShowcase,
    contribution_workflow: rules.contribution_workflow,
    report: {
      quality: qualityRows.sort((left, right) => left.score - right.score || left.name.localeCompare(right.name)),
      image: imageRows.sort((left, right) => left.status.localeCompare(right.status) || left.name.localeCompare(right.name)),
      shot_list: shotRows
    }
  };
}

function publicPayload(intelligence) {
  return {
    version: intelligence.version,
    generated_at: intelligence.generated_at,
    summary: intelligence.summary,
    recipes: intelligence.public_recipes,
    countries: intelligence.countries,
    curated_collections: intelligence.curated_collections.map((collection) => ({
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      is_featured: collection.is_featured,
      is_cuisine_intelligence: true,
      total_recipes: collection.total_recipes,
      country_count: collection.country_count,
      route_path: collection.route_path,
      top_recipe_names: collection.top_recipe_names,
      recipes: collection.recipes.slice(0, 12).map((recipe) => ({
        slug: recipe.slug,
        name: recipe.name,
        country_name: recipe.country_name,
        route_path: recipe.route_path,
        category: recipe.category,
        total_time_minutes: recipe.total_time_minutes
      }))
    })),
    menu_builder: intelligence.menu_builder,
    social_showcase: intelligence.social_showcase,
    contribution_workflow: intelligence.contribution_workflow
  };
}

function csvEscape(value) {
  const input = String(value == null ? "" : value);
  if (!/[",\n\r]/.test(input)) return input;
  return `"${input.replace(/"/g, '""')}"`;
}

function writeShotListCsv(rows) {
  const headers = ["slug", "recipe", "country", "category", "role", "label", "filename", "route_path", "prompt"];
  const lines = [headers.join(",")].concat(
    rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  );
  ensureDir(path.dirname(SHOT_LIST_CSV_PATH));
  writeTextFileSync(SHOT_LIST_CSV_PATH, `${lines.join("\n")}\n`, "utf8");
}

function writeShotListMarkdown(rows, summary) {
  const heroRows = rows.filter((row) => row.role === "hero");
  const lines = [
    "# AfroKitchen Recipe Image Shot List",
    "",
    "Use this as the working list for generating and saving recipe images.",
    "",
    `- Canonical recipe pages needing image coverage: ${summary.recipe_count}`,
    `- Recipes with at least one image detected: ${summary.hero_image_count}`,
    `- Gallery-ready recipes with three or more images: ${summary.gallery_ready_count}`,
    "- Save finished images under `assets/img/kitchen/`",
    "- Preferred format: `.webp` at roughly 1600x1200 or 1200x900",
    "- Keep images natural and inspectable: real plated dish, bright food styling, no text, no logos, no dark blurry mood shots",
    "- Filename should match the `filename` column exactly where possible",
    "",
    "| # | Recipe | Country | Category | Filename | Route | Image prompt starter |",
    "|---:|---|---|---|---|---|---|"
  ];
  heroRows.forEach((row, index) => {
    lines.push(
      `| ${index + 1} | ${row.recipe} | ${row.country} | ${row.category || "recipe"} | \`${row.filename}\` | ${row.route_path} | ${row.prompt} |`
    );
  });
  writeTextFileSync(SHOT_LIST_MD_PATH, `${lines.join("\n")}\n`, "utf8");
}

function writeCuisineIntelligenceFiles(intelligence) {
  ensureDir(path.dirname(PUBLIC_PATH));
  ensureDir(path.dirname(REPORT_PATH));
  const publicData = publicPayload(intelligence);
  writeTextFileSync(PUBLIC_PATH, `${JSON.stringify(publicData, null, 2)}\n`, "utf8");
  writeTextFileSync(
    PUBLIC_JS_PATH,
    `window.AfroKitchenCuisineIntelligence = ${JSON.stringify(publicData)};\n`,
    "utf8"
  );
  writeTextFileSync(REPORT_PATH, `${JSON.stringify({
    version: intelligence.version,
    generated_at: intelligence.generated_at,
    summary: intelligence.summary,
    quality: intelligence.report.quality,
    image: intelligence.report.image
  }, null, 2)}\n`, "utf8");
  writeShotListCsv(intelligence.report.shot_list);
  writeShotListMarkdown(intelligence.report.shot_list, intelligence.summary);
}

function loadCuisineIntelligence() {
  if (!fs.existsSync(PUBLIC_PATH)) return null;
  return JSON.parse(fs.readFileSync(PUBLIC_PATH, "utf8"));
}

module.exports = {
  RULES_PATH,
  PUBLIC_PATH,
  PUBLIC_JS_PATH,
  REPORT_PATH,
  SHOT_LIST_CSV_PATH,
  SHOT_LIST_MD_PATH,
  loadCuisineRules,
  buildCuisineIntelligence,
  writeCuisineIntelligenceFiles,
  mergeIntelligenceCollections,
  loadCuisineIntelligence
};
