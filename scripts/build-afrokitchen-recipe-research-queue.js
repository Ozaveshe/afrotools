#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "tools", "afrokitchen", "seo-manifest.json");
const AUDIT_PATH = path.join(ROOT, "data", "afrokitchen", "recipe-research-audit.json");
const OUT_CSV = path.join(ROOT, "data", "afrokitchen", "recipe-research-queue.csv");
const OUT_REPORT = path.join(ROOT, "data", "afrokitchen", "recipe-research-report.md");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function sourceCount(entry) {
  return Array.isArray(entry && entry.sources) ? entry.sources.length : 0;
}

function main() {
  const manifest = readJson(MANIFEST_PATH, null);
  if (!manifest || !Array.isArray(manifest.recipes)) {
    throw new Error(`Missing AfroKitchen manifest at ${MANIFEST_PATH}. Run node scripts/generate-afrokitchen-static-pages.js first.`);
  }

  const audit = readJson(AUDIT_PATH, { recipes: {} });
  const entries = audit.recipes || {};
  const recipes = manifest.recipes
    .filter((recipe) => recipe.generated_in_wave)
    .sort((left, right) => {
      return (
        (left.country_name || "").localeCompare(right.country_name || "") ||
        (left.name || "").localeCompare(right.name || "")
      );
    });

  const rows = recipes.map((recipe) => {
    const entry = entries[recipe.slug] || {};
    const status = entry.status || "pending";
    const query = `${recipe.name} ${recipe.country_name} traditional recipe sources official`;
    return {
      slug: recipe.slug,
      name: recipe.name,
      country: recipe.country_name,
      category: recipe.category,
      status,
      confidence: entry.confidence || "",
      source_count: sourceCount(entry),
      route: recipe.route_path,
      search_query: query,
      notes: entry.review_summary || ""
    };
  });

  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(
    OUT_CSV,
    [
      ["slug", "name", "country", "category", "status", "confidence", "source_count", "route", "search_query", "notes"].map(csvCell).join(","),
      ...rows.map((row) =>
        [row.slug, row.name, row.country, row.category, row.status, row.confidence, row.source_count, row.route, row.search_query, row.notes]
          .map(csvCell)
          .join(",")
      )
    ].join("\n") + "\n"
  );

  const audited = rows.filter((row) => row.status === "audited");
  const pending = rows.filter((row) => row.status !== "audited");
  const report = [
    "# AfroKitchen Recipe Research Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `- Canonical recipe pages: ${rows.length}`,
    `- Audited recipes: ${audited.length}`,
    `- Pending recipes: ${pending.length}`,
    "",
    "## Audited",
    "",
    ...audited.map((row) => `- ${row.name} (${row.country}) - ${row.confidence || "unscored"} confidence, ${row.source_count} sources, ${row.route}`),
    "",
    "## Next Pending",
    "",
    ...(pending.length
      ? pending.slice(0, 40).map((row) => `- ${row.name} (${row.country}) - ${row.search_query}`)
      : ["No pending recipes."])
  ].join("\n");

  fs.writeFileSync(OUT_REPORT, report + "\n");
  console.log(`Wrote ${OUT_CSV}`);
  console.log(`Wrote ${OUT_REPORT}`);
  console.log(`Audited ${audited.length}/${rows.length}; pending ${pending.length}.`);
}

main();
