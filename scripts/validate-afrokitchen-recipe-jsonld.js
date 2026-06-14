"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "tools", "afrokitchen", "seo-manifest.json");
const SITE_ORIGIN = "https://afrotools.com";
const DEFAULT_SAMPLE_SIZE = 20;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function routeToFile(routePath) {
  return path.join(ROOT, routePath.replace(/^\/+/, ""), "index.html");
}

function extractJsonLd(html) {
  const blocks = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const raw = match[1].trim();
    if (!raw) continue;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) blocks.push(...parsed);
    else blocks.push(parsed);
  }
  return blocks;
}

function getType(schema) {
  const type = schema && schema["@type"];
  return Array.isArray(type) ? type : [type];
}

function findSchema(blocks, typeName) {
  return blocks.find((schema) => getType(schema).includes(typeName));
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isIsoDuration(value) {
  return /^PT(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+S)?$/.test(String(value || ""));
}

function localImageExists(absoluteUrl) {
  if (!String(absoluteUrl || "").startsWith(`${SITE_ORIGIN}/`)) return true;
  const pathname = new URL(absoluteUrl).pathname.replace(/^\/+/, "");
  return fs.existsSync(path.join(ROOT, pathname));
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function validateRecipePage(recipe) {
  const filePath = routeToFile(recipe.route_path);
  const relativeFile = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const errors = [];

  if (!fs.existsSync(filePath)) {
    return { slug: recipe.slug, file: relativeFile, errors: [`missing HTML file for ${recipe.route_path}`] };
  }

  const html = fs.readFileSync(filePath, "utf8");
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  const blocks = extractJsonLd(html);
  const recipeSchema = findSchema(blocks, "Recipe");
  const breadcrumbSchema = findSchema(blocks, "BreadcrumbList");

  if (!canonical || canonical[1] !== recipe.route_url) {
    errors.push(`canonical missing or mismatched: expected ${recipe.route_url}`);
  }

  if (!recipeSchema) {
    const noindex = robots && /noindex/i.test(robots[1]);
    if (!noindex) errors.push("missing Recipe JSON-LD without noindex fallback");
    return { slug: recipe.slug, file: relativeFile, errors };
  }

  if (robots && /noindex/i.test(robots[1])) errors.push("complete Recipe JSON-LD page is marked noindex");
  if (recipeSchema["@context"] !== "https://schema.org") errors.push("Recipe @context is not schema.org");
  if (!getType(recipeSchema).includes("Recipe")) errors.push("Recipe @type missing");
  if (recipeSchema.name !== recipe.name) errors.push("Recipe name does not match manifest");
  const visibleText = decodeHtml(stripTags(html));
  if (!visibleText.includes(recipeSchema.name)) errors.push("Recipe name is not visible in HTML");
  if (!visibleText.includes(recipeSchema.description)) errors.push("Recipe description is not visible in HTML");
  if (!Array.isArray(recipeSchema.image) || !recipeSchema.image.length) errors.push("Recipe image must be a non-empty array");
  (Array.isArray(recipeSchema.image) ? recipeSchema.image : []).forEach((imageUrl) => {
    if (!isAbsoluteUrl(imageUrl)) errors.push(`Recipe image is not absolute: ${imageUrl}`);
    if (isAbsoluteUrl(imageUrl) && !localImageExists(imageUrl)) errors.push(`Recipe image file is missing locally: ${imageUrl}`);
  });

  const authorName = recipeSchema.author && recipeSchema.author.name;
  const publisherName = recipeSchema.publisher && recipeSchema.publisher.name;
  if (!/AfroKitchen|AfroTools/.test(`${authorName || ""} ${publisherName || ""}`)) {
    errors.push("Recipe author/publisher must identify AfroKitchen or AfroTools");
  }
  if (recipe.created_at && !isIsoDate(recipeSchema.datePublished)) errors.push("datePublished missing or not YYYY-MM-DD");
  if (recipe.updated_at && !isIsoDate(recipeSchema.dateModified)) errors.push("dateModified missing or not YYYY-MM-DD");
  if (!recipeSchema.recipeCuisine || !String(recipeSchema.recipeCuisine).includes(recipe.country_name)) {
    errors.push("recipeCuisine missing country");
  }
  if (!recipeSchema.recipeCategory || !String(recipeSchema.recipeCategory).trim()) errors.push("recipeCategory missing");
  if (!recipeSchema.keywords || !String(recipeSchema.keywords).trim()) errors.push("keywords missing");
  ["prepTime", "cookTime", "totalTime"].forEach((field) => {
    if (!isIsoDuration(recipeSchema[field])) errors.push(`${field} missing or not ISO 8601 duration`);
  });
  if (!recipeSchema.recipeYield || !String(recipeSchema.recipeYield).includes(String(recipe.default_servings))) {
    errors.push("recipeYield missing servings");
  }
  if (!Array.isArray(recipeSchema.recipeIngredient) || !recipeSchema.recipeIngredient.length) {
    errors.push("recipeIngredient missing");
  } else if (recipeSchema.recipeIngredient.some((item) => !String(item || "").trim())) {
    errors.push("recipeIngredient contains empty entries");
  }
  if (!Array.isArray(recipeSchema.recipeInstructions) || !recipeSchema.recipeInstructions.length) {
    errors.push("recipeInstructions missing");
  } else {
    recipeSchema.recipeInstructions.forEach((step, index) => {
      if (!getType(step).includes("HowToStep")) errors.push(`instruction ${index + 1} is not HowToStep`);
      if (!step.name || !step.text) errors.push(`instruction ${index + 1} missing name or text`);
      if (!String(step.url || "").startsWith(`${recipe.route_url}#step-`)) {
        errors.push(`instruction ${index + 1} url must point to the canonical step anchor`);
      }
    });
  }
  if (recipe.calories && (!recipeSchema.nutrition || recipeSchema.nutrition["@type"] !== "NutritionInformation")) {
    errors.push("nutrition missing although nutrition data is available");
  }
  if (!recipeSchema.mainEntityOfPage || recipeSchema.mainEntityOfPage["@id"] !== recipe.route_url) {
    errors.push("mainEntityOfPage missing or mismatched");
  }
  if (recipeSchema.isAccessibleForFree !== true) errors.push("isAccessibleForFree must be true");
  if (recipeSchema.aggregateRating || recipeSchema.review) errors.push("rating or review schema must not be present");

  if (!breadcrumbSchema) {
    errors.push("BreadcrumbList JSON-LD missing");
  } else {
    const crumbs = breadcrumbSchema.itemListElement;
    if (!Array.isArray(crumbs) || crumbs.length < 5) errors.push("BreadcrumbList must include recipe trail");
    const lastCrumb = Array.isArray(crumbs) ? crumbs[crumbs.length - 1] : null;
    if (!lastCrumb || lastCrumb.item !== recipe.route_url) errors.push("BreadcrumbList final item must be recipe canonical");
  }

  return { slug: recipe.slug, file: relativeFile, errors };
}

function pickSample(recipes, sampleSize) {
  if (recipes.length <= sampleSize) return recipes;
  const sample = [];
  const step = (recipes.length - 1) / (sampleSize - 1);
  for (let index = 0; index < sampleSize; index += 1) {
    sample.push(recipes[Math.round(index * step)]);
  }
  return Array.from(new Map(sample.map((recipe) => [recipe.slug, recipe])).values());
}

function main() {
  const all = process.argv.includes("--all");
  const sampleArg = process.argv.find((arg) => arg.startsWith("--sample="));
  const sampleSize = sampleArg ? Number(sampleArg.split("=")[1]) : DEFAULT_SAMPLE_SIZE;
  const manifest = readJson(MANIFEST_PATH);
  const completeRecipes = (manifest.recipes || []).filter((recipe) => recipe.generated_in_wave);
  const targets = all ? completeRecipes : pickSample(completeRecipes, Math.max(DEFAULT_SAMPLE_SIZE, sampleSize || DEFAULT_SAMPLE_SIZE));
  const results = targets.map(validateRecipePage);
  const failures = results.filter((result) => result.errors.length);

  console.log("AfroKitchen Recipe JSON-LD validation");
  console.log(`  Recipe pages in manifest: ${completeRecipes.length}`);
  console.log(`  Pages checked: ${results.length}${all ? " (all)" : " (sample)"}`);
  console.log(`  Passed: ${results.length - failures.length}`);
  console.log(`  Failed: ${failures.length}`);

  if (failures.length) {
    failures.slice(0, 25).forEach((failure) => {
      console.log(`\n${failure.slug} (${failure.file})`);
      failure.errors.forEach((error) => console.log(`  - ${error}`));
    });
    if (failures.length > 25) console.log(`\n...${failures.length - 25} more failing pages omitted.`);
    process.exitCode = 1;
  }
}

main();
