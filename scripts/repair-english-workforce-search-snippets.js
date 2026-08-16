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
  "vaccination-schedule": {
    rootTitle: "Livestock Vaccination Planner | AfroTools",
    countryTitle: "Livestock Vaccination",
    rootDescription: "Build a livestock vaccination calendar by animal and date, then verify timing, availability and local campaigns with a veterinarian or authority.",
    description(country) {
      return `Build a livestock vaccination plan for ${country} by animal and date; verify timing, availability and campaigns with a local veterinarian or authority.`;
    }
  },
  "farm-payroll": {
    rootTitle: "Farm Payroll Calculator | AfroTools",
    countryTitle: "Farm Payroll",
    rootDescription: "Estimate farm wages, deductions and take-home pay across worker types, then verify current wage, tax and contribution rules before payroll.",
    description(country) {
      return `Estimate farm wages, deductions and take-home pay for ${country} workers; verify current wage, tax and contribution rules before payroll.`;
    }
  },
  "employee-cost": {
    countryTitle: "Employee Cost",
    description(country) {
      return `Estimate salary plus employer contributions in ${country} using the country rules bundled with this page; verify current rates and ceilings before hiring.`;
    }
  }
});

const dataCode = fs.readFileSync(path.join(ROOT, "data", "insurance", "country-insurance-index.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(dataCode, sandbox);
const COUNTRIES = new Map(Object.values(sandbox.window.AfroTools.insuranceData.countries).map((country) => [country.slug, country]));
const COUNTRY_ALIASES = Object.freeze({
  "cape-verde": "cabo-verde",
  "cote-divoire": "cote-d-ivoire",
  "republic-of-congo": "congo-brazzaville",
  "sao-tome": "sao-tome-and-principe"
});

function attr(tag, name) {
  const match = String(tag).match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function metadataFor(target) {
  const definition = DEFINITIONS[target.family];
  if (target.root) {
    return { title: definition.rootTitle, schemaName: definition.rootTitle.replace(/ \| AfroTools$/, ""), description: definition.rootDescription };
  }
  const country = COUNTRIES.get(COUNTRY_ALIASES[target.slug] || target.slug);
  if (!country) throw new Error("Unknown workforce snippet country: " + target.family + "/" + target.slug);
  const schemaName = definition.countryTitle + " — " + country.name;
  return { title: schemaName + " | AfroTools", schemaName, description: definition.description(country.name) };
}

function setMeta(html, selector, value, content, required = false) {
  let found = false;
  const output = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (attr(tag, selector).toLowerCase() !== value.toLowerCase()) return tag;
    found = true;
    return tag.replace(/\bcontent\s*=\s*([\"'])([\s\S]*?)\1/i, (_, quote) => "content=" + quote + escapeHtml(content) + quote);
  });
  if (required && !found) throw new Error("Missing meta " + selector + "=" + value);
  return output;
}

function syncSchema(html, metadata) {
  return html.replace(/(<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, source, close) => {
    let data;
    try { data = JSON.parse(source); } catch { return whole; }
    const nodes = Array.isArray(data) ? data : [data];
    let changed = false;
    for (const node of nodes) {
      const types = Array.isArray(node && node["@type"]) ? node["@type"] : [node && node["@type"]];
      if (!types.some((type) => ["WebApplication", "WebPage"].includes(type))) continue;
      node.name = metadata.schemaName;
      node.description = metadata.description;
      node.inLanguage = "en";
      changed = true;
    }
    return changed ? open + JSON.stringify(data) + close : whole;
  });
}

function apply(html, metadata) {
  let output = html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, "$1" + escapeHtml(metadata.title) + "$2");
  output = setMeta(output, "name", "description", metadata.description, true);
  output = setMeta(output, "property", "og:title", metadata.title, true);
  output = setMeta(output, "property", "og:description", metadata.description, true);
  output = setMeta(output, "name", "twitter:title", metadata.title);
  output = setMeta(output, "name", "twitter:description", metadata.description);
  return syncSchema(output, metadata);
}

function targets() {
  const rows = [];
  for (const family of ["vaccination-schedule", "farm-payroll"]) {
    const directory = path.join(ROOT, "agriculture", family);
    rows.push({ family, root: true, file: path.join(directory, "index.html") });
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".html") || entry.name === "index.html" || entry.name.startsWith("_")) continue;
      rows.push({ family, slug: entry.name.replace(/\.html$/, ""), file: path.join(directory, entry.name) });
    }
  }
  const employeeDirectory = path.join(ROOT, "tools", "employee-cost");
  for (const entry of fs.readdirSync(employeeDirectory, { withFileTypes: true })) {
    const file = path.join(employeeDirectory, entry.name, "index.html");
    if (entry.isDirectory() && fs.existsSync(file)) rows.push({ family: "employee-cost", slug: entry.name, file });
  }
  return rows.sort((left, right) => left.file.localeCompare(right.file));
}

function run({ write = false } = {}) {
  const stale = [];
  for (const target of targets()) {
    const current = fs.readFileSync(target.file, "utf8");
    const expected = apply(current, metadataFor(target));
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
  console.log("English workforce snippets: " + result.targets + " pages checked; " + result.stale.length + (WRITE ? " updated." : " stale."));
}

if (require.main === module) main();

module.exports = { DEFINITIONS, apply, metadataFor, run, targets };
