#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "tools", "afrokitchen", "seo-manifest.json");
const AFROKITCHEN_DIR = path.join(ROOT, "tools", "afrokitchen");
const REPORTS_DIR = path.join(ROOT, "reports");
const REPORT_PATH = path.join(REPORTS_DIR, "afrokitchen-copy-quality-report.json");

const GENERATED_PATTERNS = [
  ["best_for_duplicate", /\bBest for\s+Best for\b/i],
  ["built_around_recipe", /\bbuilt around\b/i],
  ["serving_logic", /\bserving logic of\b/i],
  ["afrokitchen_gap", /\bfills a real AfroKitchen gap\b/i],
  ["generic_discover", /\b(discover|journey|delightful)\b/i],
  ["a_eswatini", /\ba Eswatini\b/i],
  ["fallback_caption", /Fallback collection artwork pending recipe-specific media/i],
  ["overclaim_verified", /\bverified [A-Z][A-Za-z -]+ dish in the AfroKitchen archive\b/i]
];

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35);
}

function sentenceTemplate(sentence, recipe) {
  let normalized = String(sentence || "").toLowerCase();
  const replacements = [
    recipe && recipe.name,
    recipe && recipe.country_name,
    recipe && recipe.region,
    recipe && recipe.category,
    recipe && recipe.best_served_with
  ].filter(Boolean);

  for (const value of replacements) {
    const escaped = String(value).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(escaped, "g"), "{value}");
  }

  normalized = normalized
    .replace(/\b\d+(?:\.\d+)?\b/g, "{n}")
    .replace(/\b[a-z]+-[a-z0-9-]+\b/g, "{slug}")
    .replace(/\b(algeria|angola|benin|botswana|burkina faso|burundi|cameroon|cape verde|central african republic|chad|comoros|congo|djibouti|egypt|equatorial guinea|eritrea|eswatini|ethiopia|gabon|gambia|ghana|guinea|guinea-bissau|ivory coast|kenya|lesotho|liberia|libya|madagascar|malawi|mali|mauritania|mauritius|morocco|mozambique|namibia|niger|nigeria|rwanda|senegal|seychelles|sierra leone|somalia|south africa|south sudan|sudan|tanzania|togo|tunisia|uganda|western sahara|zambia|zimbabwe)\b/g, "{country}")
    .replace(/\b(main|stew|soup|side|drink|snack|dessert|breakfast|grill|rice|beverage|dish)\b/g, "{category}")
    .replace(/\b[a-z][a-z']+\b/g, (word) => {
      const keep = new Set(["afrokitchen", "recipe", "recipes", "serve", "served", "with", "best", "for", "built", "around", "logic", "verified", "structured", "practical", "cook", "cooking", "dish", "table", "country", "archive"]);
      return keep.has(word) ? word : "{word}";
    })
    .replace(/(?:\{word\}\s*){3,}/g, "{words} ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

function scanValue(target, field, value, hits) {
  for (const [id, pattern] of GENERATED_PATTERNS) {
    if (pattern.test(String(value || ""))) {
      hits.push({ id, target, field, sample: String(value).slice(0, 220) });
    }
  }
}

function walkHtmlFiles(dirPath, files) {
  if (!fs.existsSync(dirPath)) return files;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

function afroKitchenHtmlFiles() {
  return walkHtmlFiles(AFROKITCHEN_DIR, []);
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const recipes = manifest.recipes || [];
  const hits = [];
  const duplicateTemplates = new Map();

  for (const recipe of recipes) {
    const fields = [
      "description",
      "story",
      "occasion",
      "best_served_with",
      "regional_variations",
      "image_alt"
    ];
    for (const field of fields) {
      const value = recipe[field] || "";
      scanValue(recipe.slug, field, value, hits);
      for (const sentence of sentences(value)) {
        const template = sentenceTemplate(sentence, recipe);
        if (!duplicateTemplates.has(template)) duplicateTemplates.set(template, []);
        duplicateTemplates.get(template).push({ slug: recipe.slug, field, sentence });
      }
    }

    for (const [index, media] of (recipe.media || []).entries()) {
      scanValue(recipe.slug, `media.${index}.caption`, media.caption || "", hits);
    }
  }

  for (const filePath of afroKitchenHtmlFiles()) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const text = stripTags(readText(filePath));
    scanValue(rel, "rendered_text", text, hits);
  }

  const worstDuplicates = [...duplicateTemplates.entries()]
    .map(([template, items]) => ({
      template,
      count: items.length,
      examples: items.slice(0, 5)
    }))
    .filter((entry) => entry.count >= 5)
    .sort((left, right) => right.count - left.count)
    .slice(0, 20);

  const patternCounts = hits.reduce((counts, hit) => {
    counts[hit.id] = (counts[hit.id] || 0) + 1;
    return counts;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    recipeCount: recipes.length,
    patternCounts,
    hits,
    worstDuplicates
  };

  if (fs.existsSync(REPORTS_DIR)) {
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log("AfroKitchen copy quality audit");
  console.log(`  Recipes scanned: ${recipes.length}`);
  console.log(`  Generated-copy pattern hits: ${hits.length}`);
  if (fs.existsSync(REPORTS_DIR)) {
    console.log(`  JSON report: ${path.relative(ROOT, REPORT_PATH).replace(/\\/g, "/")}`);
  }

  console.log("\nPattern counts");
  for (const [id] of GENERATED_PATTERNS) {
    console.log(`  ${id}: ${patternCounts[id] || 0}`);
  }

  console.log("\nWorst repeated sentence templates");
  if (!worstDuplicates.length) {
    console.log("  None above threshold.");
  } else {
    for (const entry of worstDuplicates.slice(0, 10)) {
      console.log(`  ${entry.count}x ${entry.template}`);
      entry.examples.slice(0, 3).forEach((example) => {
        console.log(`    - ${example.slug}.${example.field}: ${example.sentence.slice(0, 140)}`);
      });
    }
  }

  if (hits.length) {
    console.log("\nExamples");
    hits.slice(0, 12).forEach((hit) => {
      console.log(`  - ${hit.id} ${hit.target}.${hit.field}: ${hit.sample}`);
    });
    process.exitCode = 1;
  }
}

main();
