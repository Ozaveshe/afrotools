#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { isDeepStrictEqual } = require("util");
const { loadRecipeImages, resolveRecipeMedia } = require("./lib/afrokitchen-static");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const AFROKITCHEN_DIR = path.join(ROOT, "tools", "afrokitchen");
const RECIPES_DIR = path.join(AFROKITCHEN_DIR, "recipes");
const MANIFEST_PATH = path.join(AFROKITCHEN_DIR, "seo-manifest.json");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "afrokitchen-indexability-report.json");

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function listIndexHtml(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name, "index.html"))
    .filter((filePath) => fs.existsSync(filePath));
}

function extractMetaContent(html, name) {
  const pattern =
    new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${name}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`, "i");
  const match = html.match(pattern);
  return match ? match[1] : "";
}

function extractCanonical(html) {
  const match =
    html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i) ||
    html.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  return match ? match[1] : "";
}

function hasNoindex(html) {
  return /\bnoindex\b/i.test(extractMetaContent(html, "robots"));
}

function inspectRecipeSchemaState(recipe, html, recipeImages) {
  const errors = [];
  const nodes = [];
  const contexts = new Map();
  const flatten = (value, inheritedContext) => {
    if (Array.isArray(value)) return value.forEach(node => flatten(node, inheritedContext));
    if (!value || typeof value !== "object") return errors.push("JSON-LD must contain objects");
    nodes.push(value);
    const context = value["@context"] || inheritedContext;
    contexts.set(value, context);
    if (value["@graph"] != null) {
      if (!Array.isArray(value["@graph"])) errors.push("JSON-LD @graph must be an array");
      else value["@graph"].forEach(node => flatten(node, context));
    }
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { flatten(JSON.parse(match[1])); }
    catch { errors.push("malformed JSON-LD"); }
  }
  const typeIs = (node, type) => node["@type"] === type || (Array.isArray(node["@type"]) && node["@type"].includes(type));
  const recipes = nodes.filter(node => typeIs(node, "Recipe"));
  const markers = [...html.matchAll(/<meta\b(?=[^>]*\bname=["']afrokitchen-schema-blockers["'])(?=[^>]*\bcontent=["']([^"']*)["'])[^>]*>/gi)];
  if (recipes.length) {
    if (recipes.length !== 1) errors.push("duplicate Recipe JSON-LD");
    if (markers.length) errors.push("Recipe JSON-LD conflicts with a schema blocker");
    return { state: "recipe-markup", errors };
  }

  // A missing dish photo affects rich-result eligibility, not the complete page's indexability.
  // Verify the source and rendered content; the marker alone is never an exemption.
  if (markers.length !== 1 || markers[0][1] !== "missing_image") errors.push("missing or invalid image-only schema blocker");
  if (!resolveRecipeMedia(recipe, recipeImages).isFallback) errors.push("dish image is available; Recipe JSON-LD is required");
  const canonicalLinks = [...html.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi)];
  if (canonicalLinks.length !== 1 || extractCanonical(html) !== recipe.route_url) errors.push("photo-less page canonical is missing or mismatched");
  if (!/^index,\s*follow$/i.test(extractMetaContent(html, "robots"))) errors.push("photo-less page must remain index, follow");
  const breadcrumbs = nodes.filter(node => typeIs(node, "BreadcrumbList"));
  const crumbs = breadcrumbs[0]?.itemListElement;
  if (breadcrumbs.length !== 1 || contexts.get(breadcrumbs[0]) !== "https://schema.org" ||
      !Array.isArray(crumbs) || crumbs.length < 5 ||
      crumbs.some((item, index) => !item || !typeIs(item, "ListItem") || item.position !== index + 1 || !String(item.name || "").trim() || !String(item.item || "").startsWith(`${SITE_ORIGIN}/`)) ||
      crumbs.at(-1)?.item !== recipe.route_url || crumbs.at(-1)?.name !== recipe.name) errors.push("photo-less page must preserve its canonical breadcrumb trail");
  const payloads = [...html.matchAll(/window\.__AK_STATIC_RECIPE\s*=\s*([\s\S]*?);\s*<\/script>/g)];
  let payload;
  try { if (payloads.length === 1) payload = JSON.parse(payloads[0][1]); }
  catch { errors.push("malformed static recipe payload"); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) errors.push("photo-less page must have one complete static recipe payload");
  const textFields = ["slug", "name", "description", "country_name", "category"];
  const durationFields = ["prep_time_minutes", "cook_time_minutes", "total_time_minutes"];
  for (const field of [...textFields, ...durationFields, "default_servings"]) {
    if (!isDeepStrictEqual(payload?.[field], recipe[field])) errors.push(`static recipe payload does not match source: ${field}`);
  }
  // The editorial owner can replace database IDs and timestamps without changing cooking content.
  const cookingContent = items => Array.isArray(items) ? items.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const { id, recipe_id, ingredient_id, created_at, updated_at, ...content } = item;
    // A null or zero duration both mean that this step has no countdown timer.
    if (Object.hasOwn(content, "timer_seconds") && content.timer_seconds == null) content.timer_seconds = 0;
    return content;
  }) : items;
  for (const field of ["ingredients", "steps"]) {
    if (!isDeepStrictEqual(cookingContent(payload?.[field]), cookingContent(recipe[field]))) errors.push(`static recipe payload does not match source: ${field}`);
  }
  const sourceIncomplete = !recipe.generated_in_wave ||
    textFields.some(field => !String(recipe[field] || "").trim()) ||
    durationFields.some(field => recipe[field] == null || !Number.isFinite(Number(recipe[field])) || Number(recipe[field]) < 0) ||
    !Number.isFinite(Number(recipe.default_servings)) || Number(recipe.default_servings) <= 0 ||
    !Array.isArray(recipe.ingredients) || !recipe.ingredients.length ||
    recipe.ingredients.some(item => !String(item?.name || "").trim()) ||
    !Array.isArray(recipe.steps) || !recipe.steps.length ||
    recipe.steps.some(item => !String(item?.title || "").trim() || !String(item?.instruction || "").trim());
  if (sourceIncomplete) errors.push("image-only deferral requires complete recipe source content");
  const visibleText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
  if (![recipe.name, recipe.description, ...(recipe.ingredients || []).map(item => item.name), ...(recipe.steps || []).map(item => item.instruction)].every(value => visibleText.includes(String(value || "").replace(/\s+/g, " ")))) errors.push("photo-less recipe content must be visible in HTML");
  return { state: errors.length ? "invalid" : "awaiting-dish-image", errors };
}

function htmlRouteUrl(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  return `${SITE_ORIGIN}/${rel.replace(/index\.html$/, "")}`;
}

function readSitemapEntries() {
  const entries = new Map();
  const sitemapFiles = fs.readdirSync(ROOT)
    .filter((name) => /^sitemap.*\.xml$/i.test(name))
    .map((name) => path.join(ROOT, name));

  for (const filePath of sitemapFiles) {
    const xml = readText(filePath);
    const urlPattern = /<url>([\s\S]*?)<\/url>/g;
    let match;
    while ((match = urlPattern.exec(xml)) !== null) {
      const block = match[1];
      const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
      if (!loc) continue;
      entries.set(loc, {
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        lastmod: (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || "",
        imageCount: (block.match(/<image:image>/g) || []).length
      });
    }
  }

  return entries;
}

function asIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function maxDate(values) {
  return values.map(asIsoDate).filter(Boolean).sort().slice(-1)[0] || "";
}

function normalizeSitemapLastmod(value) {
  // Match the sitemap generator: age alone does not mean a recipe changed.
  return asIsoDate(value);
}

function robotsAllowsAfroKitchenRecipes() {
  const robots = readText(path.join(ROOT, "robots.txt"));
  const groups = [];
  let currentGroup = null;
  const targetPath = "/tools/afrokitchen/recipes/";
  const checkedAgents = new Set(["*"]);

  function ruleBlocksTarget(rule) {
    if (!rule) return false;
    if (rule === "/") return true;
    const escaped = rule
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${escaped}`).test(targetPath);
  }

  for (const line of robots.split(/\r?\n/)) {
    const agentMatch = line.match(/^\s*User-agent:\s*(\S+)/i);
    if (agentMatch) {
      currentGroup = { agents: [agentMatch[1]], disallows: [] };
      groups.push(currentGroup);
      continue;
    }

    if (!currentGroup) continue;

    const disallowMatch = line.match(/^\s*Disallow:\s*(\S+)/i);
    if (disallowMatch) {
      currentGroup.disallows.push(disallowMatch[1].trim());
      continue;
    }

    const allowMatch = line.match(/^\s*Allow:\s*(\S+)/i);
    if (allowMatch && allowMatch[1].startsWith("/tools/afrokitchen/recipes/")) {
      currentGroup.allowsRecipePath = true;
    }
  }

  const searchAgents = new Set(["*", "GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]);
  const blockers = [];

  for (const group of groups) {
    const relevantAgents = group.agents.filter((agent) => searchAgents.has(agent));
    if (!relevantAgents.length) continue;
    relevantAgents.forEach((agent) => checkedAgents.add(agent));
    for (const rule of group.disallows) {
      if (ruleBlocksTarget(rule)) {
        blockers.push(`${relevantAgents.join(",")}: ${rule}`);
      }
    }
  }

  return { allowed: blockers.length === 0, blockers, checkedAgents: [...checkedAgents].sort() };
}

function recipeImageValue(recipe, html) {
  return recipe.social_image || recipe.page_image || recipe.image_url || extractMetaContent(html, "og:image");
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const sitemapEntries = readSitemapEntries();
  const recipeByUrl = new Map((manifest.recipes || []).map((recipe) => [recipe.route_url, recipe]));
  const generatedRecipes = (manifest.recipes || []).filter((recipe) => recipe.generated_in_wave);
  const recipeImages = loadRecipeImages();
  const generatedRecipeUrls = new Set(generatedRecipes.map((recipe) => recipe.route_url));
  const countryUrls = new Set((manifest.countries || []).map((country) => country.route_url));
  const collectionUrls = new Set((manifest.collections || []).map((collection) => collection.route_url));
  const recipeHtmlFiles = listIndexHtml(RECIPES_DIR);

  const noindexRecipePages = [];
  const missingCanonical = [];
  const missingImage = [];
  const missingJsonLd = [];
  const invalidSchemaStates = [];
  const awaitingDishImage = [];
  const recipeMarkupPages = [];
  const missingIngredients = [];
  const missingInstructions = [];
  const noindexInSitemap = [];
  const missingLastmod = [];
  const lastmodMismatches = [];

  for (const filePath of recipeHtmlFiles) {
    const html = readText(filePath);
    const url = htmlRouteUrl(filePath);
    const recipe = recipeByUrl.get(url);
    const noindex = hasNoindex(html);
    if (noindex) noindexRecipePages.push(url);
    if (noindex && sitemapEntries.has(url)) noindexInSitemap.push(url);

    if (!generatedRecipeUrls.has(url)) continue;

    const canonical = extractCanonical(html);
    if (canonical !== url) missingCanonical.push(url);
    if (!recipeImageValue(recipe, html)) missingImage.push(url);
    const schema = inspectRecipeSchemaState(recipe, html, recipeImages);
    if (schema.state === "recipe-markup") recipeMarkupPages.push(url);
    else if (schema.state === "awaiting-dish-image") awaitingDishImage.push(url);
    else missingJsonLd.push(url);
    if (schema.errors.length) invalidSchemaStates.push({ url, errors: schema.errors });
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) missingIngredients.push(url);
    if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) missingInstructions.push(url);

    const sitemapEntry = sitemapEntries.get(url);
    if (!sitemapEntry || !sitemapEntry.lastmod) {
      missingLastmod.push(url);
    } else {
      const expected = normalizeSitemapLastmod(maxDate([recipe.updated_at, recipe.created_at]) || manifest.generated_at);
      if (expected && sitemapEntry.lastmod !== expected) {
        lastmodMismatches.push({ url, expected, actual: sitemapEntry.lastmod });
      }
    }
  }

  const missingRecipeSitemap = [...generatedRecipeUrls].filter((url) => !sitemapEntries.has(url));
  const includedRecipeUrls = [...generatedRecipeUrls].filter((url) => sitemapEntries.has(url));
  const missingCountrySitemap = [...countryUrls].filter((url) => !sitemapEntries.has(url));
  const missingCollectionSitemap = [...collectionUrls].filter((url) => !sitemapEntries.has(url));
  const recipeImageSitemapEntries = includedRecipeUrls.filter((url) => (sitemapEntries.get(url) || {}).imageCount > 0);
  const robots = robotsAllowsAfroKitchenRecipes();

  const report = {
    generatedAt: new Date().toISOString(),
    source: manifest.source || {},
    totals: {
      manifestRecipePages: (manifest.recipes || []).length,
      completeRecipePages: generatedRecipes.length,
      recipeHtmlPages: recipeHtmlFiles.length,
      sitemapIncludedRecipePages: includedRecipeUrls.length,
      noindexRecipePages: noindexRecipePages.length,
      recipeMarkupPages: recipeMarkupPages.length,
      completePagesAwaitingDishImage: awaitingDishImage.length,
      countryHubPages: countryUrls.size,
      sitemapIncludedCountryHubs: [...countryUrls].filter((url) => sitemapEntries.has(url)).length,
      collectionPages: collectionUrls.size,
      sitemapIncludedCollections: [...collectionUrls].filter((url) => sitemapEntries.has(url)).length,
      recipeImageSitemapEntries: recipeImageSitemapEntries.length
    },
    robots,
    issues: {
      missingRecipeSitemap,
      missingCountrySitemap,
      missingCollectionSitemap,
      noindexInSitemap,
      missingCanonical,
      missingImage,
      missingJsonLd,
      invalidSchemaStates,
      missingIngredients,
      missingInstructions,
      missingLastmod,
      lastmodMismatches
    },
    noindexRecipePages,
    awaitingDishImage
  };

  if (fs.existsSync(REPORTS_DIR)) {
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log("AfroKitchen sitemap/indexability audit");
  console.log(`  Manifest recipe pages: ${report.totals.manifestRecipePages}`);
  console.log(`  Complete recipe pages: ${report.totals.completeRecipePages}`);
  console.log(`  Recipe HTML pages: ${report.totals.recipeHtmlPages}`);
  console.log(`  Sitemap-included recipe pages: ${report.totals.sitemapIncludedRecipePages}`);
  console.log(`  Noindex recipe pages: ${report.totals.noindexRecipePages}`);
  console.log(`  Recipe markup pages: ${report.totals.recipeMarkupPages}`);
  console.log(`  Complete pages awaiting dish images: ${report.totals.completePagesAwaitingDishImage}`);
  console.log(`  Country hubs in sitemap: ${report.totals.sitemapIncludedCountryHubs}/${report.totals.countryHubPages}`);
  console.log(`  Collections in sitemap: ${report.totals.sitemapIncludedCollections}/${report.totals.collectionPages}`);
  console.log(`  Recipe image sitemap entries: ${report.totals.recipeImageSitemapEntries}/${report.totals.sitemapIncludedRecipePages}`);
  console.log(`  Robots allows /tools/afrokitchen/recipes/: ${robots.allowed ? "yes" : "no"}`);
  if (fs.existsSync(REPORTS_DIR)) {
    console.log(`  JSON report: ${path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/")}`);
  }

  const issueSummary = [
    ["Missing recipe sitemap URLs", missingRecipeSitemap.length],
    ["Missing country hub sitemap URLs", missingCountrySitemap.length],
    ["Missing collection sitemap URLs", missingCollectionSitemap.length],
    ["Noindex recipe URLs in sitemap", noindexInSitemap.length],
    ["Missing canonical", missingCanonical.length],
    ["Missing image", missingImage.length],
    ["Missing JSON-LD", missingJsonLd.length],
    ["Invalid recipe schema states", invalidSchemaStates.length],
    ["Missing ingredients", missingIngredients.length],
    ["Missing instructions", missingInstructions.length],
    ["Missing lastmod", missingLastmod.length],
    ["Lastmod mismatches", lastmodMismatches.length],
    ["Robots blockers", robots.blockers.length]
  ];

  console.log("\nIssue summary");
  for (const [label, count] of issueSummary) {
    console.log(`  ${label}: ${count}`);
  }

  const hasBlockingIssues = issueSummary.some(([, count]) => count > 0);
  if (hasBlockingIssues) {
    console.log("\nBlocking examples");
    for (const [name, values] of Object.entries(report.issues)) {
      if (!Array.isArray(values) || values.length === 0) continue;
      console.log(`  ${name}:`);
      values.slice(0, 5).forEach((value) => {
        console.log(`    - ${typeof value === "string" ? value : JSON.stringify(value)}`);
      });
    }
    process.exitCode = 1;
  }
}

if (require.main === module) main();
module.exports = { inspectRecipeSchemaState };
