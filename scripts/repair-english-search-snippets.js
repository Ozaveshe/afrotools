#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const COUNTRIES = require("../data/registry/countries.json");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const ALIASES = new Map([
  ["cabo-verde", "cape-verde"],
  ["congo-brazzaville", "congo"],
  ["cote-d-ivoire", "cote-divoire"],
  ["sao-tome-and-principe", "sao-tome"]
]);
const BY_SLUG = new Map(COUNTRIES.map((country) => [country.routeSlug, country]));

function attr(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function setTitle(html, value) {
  if (!/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) throw new Error("Missing title.");
  return html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, `$1${escapeHtml(value)}$2`);
}

function setMeta(html, selector, value, content) {
  let found = false;
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (attr(tag, selector).toLowerCase() !== value.toLowerCase()) return tag;
    found = true;
    return tag.replace(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i, (_, quote) => `content=${quote}${escapeHtml(content)}${quote}`);
  });
  if (!found) throw new Error(`Missing meta ${selector}=${value}.`);
  return next;
}

function syncSchema(html, metadata) {
  return html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, source, close) => {
    let data;
    try { data = JSON.parse(source); } catch { return whole; }
    const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
    if (!types.some((type) => ["WebApplication", "WebPage"].includes(type))) return whole;
    data.name = metadata.schemaName;
    data.description = metadata.description;
    data.inLanguage = "en";
    return `${open}${JSON.stringify(data)}${close}`;
  });
}

function metadataFor(slug) {
  const country = BY_SLUG.get(ALIASES.get(slug) || slug);
  if (!country) throw new Error(`Unknown export-doc country slug: ${slug}`);
  const name = country.title;
  return {
    title: `Export Documents — ${name} | AfroTools`,
    description: `Plan an agricultural export from ${name}: check licences, phytosanitary and origin documents, customs forms, and commodity requirements before shipment.`,
    schemaName: `Agricultural export documents — ${name}`
  };
}

function apply(html, metadata) {
  let output = setTitle(html, metadata.title);
  output = setMeta(output, "name", "description", metadata.description);
  output = setMeta(output, "property", "og:title", metadata.title);
  output = setMeta(output, "property", "og:description", metadata.description);
  output = setMeta(output, "name", "twitter:title", metadata.title);
  output = setMeta(output, "name", "twitter:description", metadata.description);
  return syncSchema(output, metadata);
}

function targets() {
  const directory = path.join(ROOT, "agriculture", "export-docs");
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html")
    .map((entry) => ({ file: path.join(directory, entry.name), slug: entry.name.replace(/\.html$/, "") }))
    .sort((left, right) => left.file.localeCompare(right.file));
}

function run({ write = false } = {}) {
  const stale = [];
  for (const target of targets()) {
    const current = fs.readFileSync(target.file, "utf8");
    const expected = apply(current, metadataFor(target.slug));
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
    result.stale.forEach((file) => console.error(`STALE ${file}`));
    process.exitCode = 1;
  }
  console.log(`English export-document snippets: ${result.targets} pages checked; ${result.stale.length} ${WRITE ? "updated" : "stale"}.`);
}

if (require.main === module) main();

module.exports = { apply, metadataFor, run, targets };
