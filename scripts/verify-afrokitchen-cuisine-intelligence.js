#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const TOOL_DIR = path.join(ROOT, "tools", "afrokitchen");

const paths = {
  manifest: path.join(TOOL_DIR, "seo-manifest.json"),
  publicJson: path.join(TOOL_DIR, "cuisine-intelligence.json"),
  publicJs: path.join(TOOL_DIR, "cuisine-intelligence-data.js"),
  report: path.join(ROOT, "data", "afrokitchen", "cuisine-intelligence-report.json"),
  rules: path.join(ROOT, "data", "afrokitchen", "cuisine-intelligence-rules.json"),
  shotListCsv: path.join(ROOT, "data", "afrokitchen", "recipe-image-shot-list.csv"),
  landing: path.join(TOOL_DIR, "index.html"),
  submit: path.join(TOOL_DIR, "submit.html"),
  kedjenou: path.join(TOOL_DIR, "recipes", "kedjenou-ci", "index.html"),
  jollof: path.join(TOOL_DIR, "recipes", "jollof-rice-ng", "index.html"),
  showstoppers: path.join(TOOL_DIR, "collections", "across-africa-showstoppers", "index.html")
};

const failures = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(haystack, needles, label) {
  needles.forEach((needle) => {
    assert(haystack.includes(needle), `${label} is missing "${needle}"`);
  });
}

function countrySlug(country) {
  return country.country_slug || String(country.route_path || "").split("/").filter(Boolean).pop();
}

function parsePublicJs(filePath) {
  const source = readText(filePath).trim();
  const exposesIntelligence = /^window\.AfroKitchenCuisineIntelligence\s*=/.test(source);
  assert(exposesIntelligence, "Public cuisine JS does not expose window.AfroKitchenCuisineIntelligence");
  if (!exposesIntelligence) return {};

  try {
    const sandbox = { window: {} };
    vm.runInNewContext(source, sandbox, { timeout: 1000 });
    return sandbox.window.AfroKitchenCuisineIntelligence || {};
  } catch (error) {
    assert(false, `Public cuisine JS could not be evaluated: ${error.message}`);
    return {};
  }
}

function walkKeys(value, visitor, trail = []) {
  if (!value || typeof value !== "object") return;
  Object.keys(value).forEach((key) => {
    visitor(key, value[key], trail);
    walkKeys(value[key], visitor, trail.concat(key));
  });
}

function verifyFilesExist() {
  Object.entries(paths).forEach(([label, filePath]) => {
    assert(exists(filePath), `${label} file is missing at ${path.relative(ROOT, filePath)}`);
  });
}

function verifyManifest(manifest, intelligence, publicJsData, rules) {
  const recipes = manifest.recipes || [];
  const generatedRecipes = recipes.filter((recipe) => recipe.generated_in_wave);
  const recipeRouteCount = ((manifest.routes && manifest.routes.generated_recipe_slugs) || []).length;
  const collectionRoutes = ((manifest.routes && manifest.routes.generated_collection_slugs) || []).length;
  const collectionCount = (manifest.collections || []).length;
  const expectedCuratedCount = (rules.curated_collections || []).length;
  const baseCollectionCount = collectionCount - expectedCuratedCount;
  const membershipCount = (manifest.collections || []).reduce((sum, collection) => sum + Number(collection.total_recipes || 0), 0);

  assert(recipeRouteCount === generatedRecipes.length, "Generated recipe route count does not match generated recipe pages");
  assert(recipeRouteCount === recipes.length, "Generated recipe route count does not match manifest recipe count");
  assert((manifest.source || {}).recipe_count === recipes.length, "Manifest source recipe_count does not match recipe array length");
  assert((manifest.source || {}).verified_recipe_count === recipes.length, "Manifest verified_recipe_count does not match recipe array length");
  assert(baseCollectionCount >= 5, `Expected at least 5 base collections before curated additions, found ${baseCollectionCount}`);
  assert(collectionCount === baseCollectionCount + expectedCuratedCount, "Collection count does not include every curated collection");
  assert(collectionRoutes === collectionCount, `Generated collection routes ${collectionRoutes} do not match collection count ${collectionCount}`);
  assert(((manifest.wave || {}).collection_page_count) === collectionCount, "Wave collection page count does not match collection count");
  assert(((manifest.source || {}).collection_count) === collectionCount, "Manifest source collection_count does not match collection count");
  assert(((manifest.source || {}).curated_collection_count) === expectedCuratedCount, "Curated collection count does not match rules");
  assert(((manifest.source || {}).collection_membership_count) === membershipCount, "Collection membership count excludes generated collections");

  assert(Object.keys(intelligence.recipes || {}).length === recipeRouteCount, "Public intelligence recipe count does not match manifest routes");
  assert(Object.keys(publicJsData.recipes || {}).length === recipeRouteCount, "Cuisine intelligence JS recipe count does not match public JSON");
  assert(((intelligence.summary || {}).recipe_count) === recipeRouteCount, "Public intelligence summary recipe count does not match routes");
  assert(((publicJsData.summary || {}).recipe_count) === recipeRouteCount, "Cuisine intelligence JS summary recipe count does not match routes");
}

function verifySocialShowcase(intelligence, publicJsData) {
  const showcase = intelligence.social_showcase || {};
  const jsShowcase = publicJsData.social_showcase || {};
  const recipes = Array.isArray(showcase.recipes) ? showcase.recipes : [];
  const jsRecipes = Array.isArray(jsShowcase.recipes) ? jsShowcase.recipes : [];

  assert(showcase.slug === "across-africa-showstoppers", "Social showcase slug is missing or incorrect");
  assert(recipes.length === 20, `Social showcase should expose 20 recipes, found ${recipes.length}`);
  assert(jsRecipes.length === recipes.length, "Cuisine intelligence JS social showcase does not match public JSON");
  assert(((intelligence.summary || {}).showstopper_count) === 20, "Public summary showstopper count is not 20");

  recipes.forEach((recipe) => {
    const publicRecipe = (intelligence.recipes || {})[recipe.slug];
    assert(publicRecipe, `Social showcase recipe missing from public recipes: ${recipe.slug}`);
    assert(publicRecipe && publicRecipe.social && publicRecipe.social.is_showstopper, `Recipe ${recipe.slug} is not flagged as a showstopper`);
    assert(recipe.hook && recipe.caption && recipe.photo_angle, `Recipe ${recipe.slug} is missing social metadata`);
  });
}

function verifyPublicSafety(intelligence) {
  const forbiddenKeys = new Set(["quality", "score", "grade", "editorial_status", "research", "sources"]);
  walkKeys(intelligence, (key, _value, trail) => {
    assert(!forbiddenKeys.has(key), `Public intelligence exposes raw review field "${trail.concat(key).join(".")}"`);
  });
}

function verifyCollections(rules) {
  (rules.curated_collections || []).forEach((collection) => {
    const pagePath = path.join(TOOL_DIR, "collections", collection.slug, "index.html");
    assert(exists(pagePath), `Curated collection page missing: ${collection.slug}`);
    if (exists(pagePath)) {
      const html = readText(pagePath);
      includesAll(html, ["Why this collection works", "A practical cooking lane"], `Collection ${collection.slug}`);
    }
  });
}

function verifyCountries(manifest, rules) {
  const countriesByCode = new Map((manifest.countries || []).map((country) => [country.country_code, country]));
  Object.keys(rules.countries || {}).forEach((countryCode) => {
    const country = countriesByCode.get(countryCode);
    assert(country, `Country rules exist without a manifest country: ${countryCode}`);
    if (!country) return;
    const hubPath = path.join(TOOL_DIR, "countries", countrySlug(country), "index.html");
    assert(exists(hubPath), `Country hub missing for ${country.country_name}`);
    if (!exists(hubPath)) return;
    const html = readText(hubPath);
    includesAll(html, ["Regional depth", `Cook ${country.country_name} by region and food culture`], `${country.country_name} country hub`);
    if (((rules.countries[countryCode] || {}).pantry || []).length || ((rules.countries[countryCode] || {}).techniques || []).length) {
      includesAll(html, ["Pantry and technique"], `${country.country_name} country hub`);
    }
  });

  const algeriaPath = path.join(TOOL_DIR, "countries", "algeria", "index.html");
  assert(exists(algeriaPath), "Algeria country hub is missing");
  if (exists(algeriaPath)) {
    const html = readText(algeriaPath);
    assert(!html.includes("Cook Algeria by region and food culture"), "Generic Algeria hub still renders a national fallback as regional depth");
  }
}

function verifyPages(manifest) {
  const landing = readText(paths.landing);
  const submit = readText(paths.submit);
  const kedjenou = readText(paths.kedjenou);
  const jollof = readText(paths.jollof);
  const showstoppers = readText(paths.showstoppers);

  includesAll(landing, ["Regional atlas", "Menu builder", "Chef-built collection", "Showstopper board", "Cook, post, compare notes"], "AfroKitchen landing");
  includesAll(
    landing,
    [
      `${(manifest.recipes || []).length} recipes`,
      `${(manifest.countries || []).length} country hubs`,
      `${(manifest.countries || []).length} COUNTRY HUBS`
    ],
    "AfroKitchen landing inventory copy"
  );
  ["164 recipes", "54 countries", "54 COUNTRIES", "160+ recipes", "160+ dishes"].forEach((staleCopy) => {
    assert(!landing.includes(staleCopy), `AfroKitchen landing still contains stale inventory copy "${staleCopy}"`);
  });
  includesAll(submit, ["Region / Community", "Review flow", "Photo links"], "AfroKitchen submit page");
  includesAll(kedjenou, ["Chef board", "Akan and Baoule slow table"], "Kedjenou recipe page");
  assert(!kedjenou.includes("Adding too much liquid after the rice"), "Kedjenou inherits a rice-specific chef warning");
  includesAll(jollof, ["Social plate", "Caption starter", "Open the showstopper board"], "Jollof recipe page");
  includesAll(showstoppers, ["Across Africa Showstoppers", "Why this collection works", "Showstopper board", "Cook, post, compare notes"], "Showstopper collection page");
}

function verifyShotList(manifest, report, rules) {
  assert(exists(paths.shotListCsv), "Recipe image shot-list CSV is missing");
  if (exists(paths.shotListCsv)) {
    const lines = readText(paths.shotListCsv).trimEnd().split(/\r?\n/);
    const expectedRows = (manifest.recipes || []).length * ((rules.image_roles || []).length || 5);
    assert(lines.length === expectedRows + 1, `Shot-list CSV should have ${expectedRows + 1} lines, found ${lines.length}`);
  }

  const imageRows = ((report || {}).image || []);
  const heroReadyCount = imageRows.filter((row) => row.status !== "missing").length;
  assert(((report.summary || {}).hero_image_count) === heroReadyCount, "Report hero image count does not match image rows");
}

function main() {
  verifyFilesExist();
  if (failures.length) {
    console.error("AfroKitchen cuisine intelligence verification failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  const manifest = readJson(paths.manifest);
  const intelligence = readJson(paths.publicJson);
  const publicJsData = parsePublicJs(paths.publicJs);
  const report = readJson(paths.report);
  const rules = readJson(paths.rules);

  verifyManifest(manifest, intelligence, publicJsData, rules);
  verifyPublicSafety(intelligence);
  verifySocialShowcase(intelligence, publicJsData);
  verifyCollections(rules);
  verifyCountries(manifest, rules);
  verifyPages(manifest);
  verifyShotList(manifest, report, rules);

  if (failures.length) {
    console.error("AfroKitchen cuisine intelligence verification failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(
    `AfroKitchen cuisine intelligence verified: ${(manifest.recipes || []).length} recipes, ` +
      `${(manifest.countries || []).length} country hubs, ${(manifest.collections || []).length} collections.`
  );
}

main();
