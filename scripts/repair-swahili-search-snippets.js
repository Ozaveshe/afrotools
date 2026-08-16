#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const COUNTRIES = require("../data/registry/countries.json");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const FAMILIES = Object.freeze({
  "kikokotoo-gharama-ya-kibali-cha-kazi": "Gharama ya Kibali cha Kazi",
  "kikokotoo-gharama-ya-mfanyakazi": "Gharama ya Mfanyakazi",
  "kikokotoo-kodi-mshahara": "Kodi ya Mshahara",
  "kikokotoo-malipo-ya-kuachishwa-kazi": "Malipo ya Kuachishwa Kazi",
  "kilinganisha-mkandarasi-na-mfanyakazi": "Mkandarasi au Mfanyakazi"
});
const SHORT_NAMES = Object.freeze({
  "central-african-republic": "Afrika ya Kati",
  "cote-divoire": "Côte d’Ivoire",
  "dr-congo": "Kongo-Kinshasa",
  "sao-tome": "Sao Tome"
});
const COUNTRY_BY_SLUG = new Map(COUNTRIES.map((country) => [country.routeSlug, country]));

function attr(tag, name) {
  const match = String(tag).match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function countryName(slug) {
  if (SHORT_NAMES[slug]) return SHORT_NAMES[slug];
  const country = COUNTRY_BY_SLUG.get(slug);
  if (!country) throw new Error("Unknown Swahili country slug: " + slug);
  return country.displayNames.sw;
}

function metadataFor(countrySlug, family) {
  if (!FAMILIES[family]) throw new Error("Unknown Swahili employment family: " + family);
  const name = countryName(countrySlug);
  const schemaName = FAMILIES[family] + " — " + name;
  return { title: schemaName + " | AfroTools", schemaName };
}

function setMeta(html, selector, value, content) {
  let found = false;
  const output = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (attr(tag, selector).toLowerCase() !== value.toLowerCase()) return tag;
    found = true;
    return tag.replace(/\bcontent\s*=\s*([\"'])([\s\S]*?)\1/i, (_, quote) => "content=" + quote + escapeHtml(content) + quote);
  });
  return found ? output : output;
}

function syncSchema(html, metadata) {
  return html.replace(/(<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, source, close) => {
    let data;
    try { data = JSON.parse(source); } catch { return whole; }
    const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
    if (!types.some((type) => ["WebApplication", "WebPage"].includes(type))) return whole;
    data.name = metadata.schemaName;
    data.inLanguage = "sw";
    return open + JSON.stringify(data) + close;
  });
}

function apply(html, metadata) {
  let output = html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, "$1" + escapeHtml(metadata.title) + "$2");
  output = setMeta(output, "property", "og:title", metadata.title);
  output = setMeta(output, "name", "twitter:title", metadata.title);
  return syncSchema(output, metadata);
}

function targets() {
  const swRoot = path.join(ROOT, "sw");
  const rows = [];
  for (const countryEntry of fs.readdirSync(swRoot, { withFileTypes: true })) {
    if (!countryEntry.isDirectory() || !COUNTRY_BY_SLUG.has(countryEntry.name)) continue;
    for (const family of Object.keys(FAMILIES)) {
      const file = path.join(swRoot, countryEntry.name, family, "index.html");
      if (fs.existsSync(file)) rows.push({ countrySlug: countryEntry.name, family, file });
    }
  }
  return rows.sort((left, right) => left.file.localeCompare(right.file));
}

function run({ write = false } = {}) {
  const stale = [];
  for (const target of targets()) {
    const current = fs.readFileSync(target.file, "utf8");
    const expected = apply(current, metadataFor(target.countrySlug, target.family));
    if (current === expected) continue;
    stale.push(path.relative(ROOT, target.file).replace(/\\/g, "/"));
    if (write) writeFileSyncWithRetry(target.file, expected, "utf8");
  }
  return { targets: targets().length, stale };
}

function main() {
  if (WRITE === CHECK) throw new Error("Choose exactly one of --write or --check.");
  const result = run({ write: WRITE });
  if (CHECK && result.stale.length) {
    result.stale.forEach((file) => console.error("STALE " + file));
    process.exitCode = 1;
  }
  console.log("Swahili employment snippets: " + result.targets + " pages checked; " + result.stale.length + (WRITE ? " updated." : " stale."));
}

if (require.main === module) main();

module.exports = { FAMILIES, apply, countryName, metadataFor, run, targets };
