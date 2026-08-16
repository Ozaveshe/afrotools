#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const DEFINITIONS = Object.freeze({
  "car-insurance": {
    title: "Car Insurance Planner",
    description: "Estimate a premium from cover, rates and fees you enter."
  },
  "health-contribution": {
    title: "Health Contribution",
    description: "Estimate health contributions from salary and rates you enter."
  },
  "motor-third-party": {
    title: "Third-Party Motor Planner",
    description: "Estimate third-party motor costs from values and rates you enter."
  },
  "workers-comp": {
    title: "Workers' Comp Worksheet",
    description: "Estimate workers' compensation from payroll and rates you enter."
  }
});

const dataCode = fs.readFileSync(path.join(ROOT, "data", "insurance", "country-insurance-index.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(dataCode, sandbox);
const COUNTRIES = new Map(Object.values(sandbox.window.AfroTools.insuranceData.countries).map((country) => [country.slug, country]));

function attr(tag, name) {
  const match = String(tag).match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function metadataFor(tool, slug) {
  const definition = DEFINITIONS[tool];
  const country = COUNTRIES.get(slug);
  if (!definition || !country) throw new Error("Unknown insurance snippet target: " + tool + "/" + slug);
  const schemaName = definition.title + " — " + country.name;
  return {
    title: schemaName + " | AfroTools",
    schemaName,
    description: definition.description + " Use your own inputs for " + country.name + "; verify current rules and insurer terms."
  };
}

function setMeta(html, selector, value, content) {
  let found = false;
  const output = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (attr(tag, selector).toLowerCase() !== value.toLowerCase()) return tag;
    found = true;
    return tag.replace(/\bcontent\s*=\s*([\"'])([\s\S]*?)\1/i, (_, quote) => "content=" + quote + escapeHtml(content) + quote);
  });
  if (!found && ((selector === "name" && value === "description") || selector === "property")) {
    throw new Error("Missing meta " + selector + "=" + value);
  }
  return output;
}

function syncSchema(html, metadata) {
  return html.replace(/(<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, source, close) => {
    let data;
    try { data = JSON.parse(source); } catch { return whole; }
    const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
    if (!types.some((type) => ["WebApplication", "WebPage"].includes(type))) return whole;
    data.name = metadata.schemaName;
    data.description = metadata.description;
    data.inLanguage = "en";
    return open + JSON.stringify(data) + close;
  });
}

function apply(html, metadata) {
  let output = html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, "$1" + escapeHtml(metadata.title) + "$2");
  output = setMeta(output, "name", "description", metadata.description);
  output = setMeta(output, "property", "og:title", metadata.title);
  output = setMeta(output, "property", "og:description", metadata.description);
  output = setMeta(output, "name", "twitter:title", metadata.title);
  output = setMeta(output, "name", "twitter:description", metadata.description);
  return syncSchema(output, metadata);
}

function targets() {
  const rows = [];
  for (const tool of Object.keys(DEFINITIONS)) {
    const directory = path.join(ROOT, "tools", tool);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".html") || entry.name === "index.html") continue;
      rows.push({ tool, slug: entry.name.replace(/\.html$/, ""), file: path.join(directory, entry.name) });
    }
  }
  return rows.sort((left, right) => left.file.localeCompare(right.file));
}

function run({ write = false } = {}) {
  const stale = [];
  for (const target of targets()) {
    const current = fs.readFileSync(target.file, "utf8");
    const expected = apply(current, metadataFor(target.tool, target.slug));
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
  console.log("English insurance snippets: " + result.targets + " pages checked; " + result.stale.length + (WRITE ? " updated." : " stale."));
}

if (require.main === module) main();

module.exports = { DEFINITIONS, apply, metadataFor, run, targets };
