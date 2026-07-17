#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const AFROKITCHEN_DIR = path.join(ROOT, "tools", "afrokitchen");
const RECIPES_DIR = path.join(AFROKITCHEN_DIR, "recipes");
const MANIFEST_PATH = path.join(AFROKITCHEN_DIR, "seo-manifest.json");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "afrokitchen-indexability-report.json");
const TODAY = new Date().toISOString().slice(0, 10);

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

function hasRecipeJsonLd(html) {
  const blocks = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return blocks.some((block) => {
    const json = block.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(json);
      const nodes = Array.isArray(parsed && parsed["@graph"]) ? parsed["@graph"] : [parsed];
      return nodes.some((node) => {
        const type = node && node["@type"];
        return type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
      });
    } catch {
      return false;
    }
  });
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
  const formatted = asIsoDate(value);
  if (!formatted) return "";
  const ageDays = (Date.now() - new Date(formatted).getTime()) / 86400000;
  return ageDays > 7 ? TODAY : formatted;
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
  const generatedRecipeUrls = new Set(generatedRecipes.map((recipe) => recipe.route_url));
  const countryUrls = new Set((manifest.countries || []).map((country) => country.route_url));
  const collectionUrls = new Set((manifest.collections || []).map((collection) => collection.route_url));
  const recipeHtmlFiles = listIndexHtml(RECIPES_DIR);

  const noindexRecipePages = [];
  const missingCanonical = [];
  const missingImage = [];
  const missingJsonLd = [];
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
    if (!hasRecipeJsonLd(html)) missingJsonLd.push(url);
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
      missingIngredients,
      missingInstructions,
      missingLastmod,
      lastmodMismatches
    },
    noindexRecipePages
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

main();
