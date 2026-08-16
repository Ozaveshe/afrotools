#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");
const { dossierSearchTitle } = require("./lib/africa-conflict-static");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const COUNTRIES = require("../data/registry/countries.json");
const COUNTRY_BY_SLUG = new Map(COUNTRIES.map((country) => [country.routeSlug, country.displayNames.en]));
const COUNTRY_ALIASES = Object.freeze({
  "cabo-verde": "cape-verde",
  "congo-brazzaville": "congo",
  "cote-d-ivoire": "cote-divoire",
  "republic-of-congo": "congo",
  "sao-tome-and-principe": "sao-tome"
});

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function attr(tag, name) {
  const match = String(tag).match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "i"));
  return match ? match[2] : "";
}

function countryName(slug) {
  const name = COUNTRY_BY_SLUG.get(COUNTRY_ALIASES[slug] || slug);
  if (!name) throw new Error("Unknown country snippet slug: " + slug);
  return name;
}

function metadataFor(target) {
  if (target.family === "africa-conflict") {
    const html = fs.readFileSync(target.file, "utf8");
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!h1) throw new Error("Conflict dossier has no source heading: " + target.file);
    const schemaName = dossierSearchTitle({ name: h1 }).replace(/ \| AfroTools$/, "");
    return { title: schemaName + " | AfroTools", schemaName, description: null };
  }

  const name = target.root ? null : countryName(target.slug);
  if (target.family === "business-license") {
    return target.root
      ? { title: "Business Licenses in Africa | AfroTools", schemaName: "Business Licenses in Africa", description: "Browse business license and permit categories across 16 African countries; confirm current requirements, fees and issuing authorities before operating." }
      : { title: `Business Licenses — ${name} | AfroTools`, schemaName: `Business Licenses — ${name}`, description: `Browse business license and permit categories for ${name} by industry; confirm current requirements, fees and issuing authorities before operating.` };
  }
  if (target.family === "freelancer-rate") {
    return target.root
      ? { title: "Freelancer Rate Calculator | AfroTools", schemaName: "Freelancer Rate Calculator", description: "Turn an income target, costs and billable time into hourly, daily and monthly freelancer rates, then verify current market context before quoting." }
      : { title: `Freelancer Rates — ${name} | AfroTools`, schemaName: `Freelancer Rates — ${name}`, description: `Compare the hourly and monthly freelancer ranges listed for ${name} by skill and seniority; treat them as planning ranges and verify current market context.` };
  }
  if (target.family === "maternity-leave") {
    return target.root
      ? { title: "Maternity Leave Pay Planner | AfroTools", schemaName: "Maternity Leave Pay Planner", description: "Plan maternity or parental leave pay from salary, dates, duration and rates you enter; verify eligibility, payer, caps and current rules officially." }
      : { title: `Maternity Leave — ${name} | AfroTools`, schemaName: `Maternity Leave — ${name}`, description: `Estimate leave pay from the rule data shown for ${name}; verify current duration, eligibility, payer, caps and legal references with an official source.` };
  }
  if (target.family === "tin-guide") {
    return target.root
      ? { title: "TIN Registration in Africa | AfroTools", schemaName: "TIN Registration in Africa", description: "Find tax identifier names, authorities, documents, costs and registration steps across African countries, then verify the current official process." }
      : { title: `TIN Registration — ${name} | AfroTools`, schemaName: `TIN Registration — ${name}`, description: `Review the tax identifier, authority, documents, cost and steps listed for ${name}; verify the current process with the official tax authority.` };
  }
  throw new Error("Unknown country-directory snippet family: " + target.family);
}

function setMeta(html, selector, value, content, required) {
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
      if (metadata.description) node.description = metadata.description;
      node.inLanguage = "en";
      changed = true;
    }
    return changed ? open + JSON.stringify(data) + close : whole;
  });
}

function apply(html, metadata) {
  let output = html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i, "$1" + escapeHtml(metadata.title) + "$2");
  if (metadata.description) {
    output = setMeta(output, "name", "description", metadata.description, true);
    output = setMeta(output, "property", "og:description", metadata.description, true);
    output = setMeta(output, "name", "twitter:description", metadata.description, false);
  }
  output = setMeta(output, "property", "og:title", metadata.title, true);
  output = setMeta(output, "name", "twitter:title", metadata.title, false);
  return syncSchema(output, metadata);
}

function addDirectoryTargets(rows, family, directory, shape) {
  rows.push({ family, root: true, file: path.join(directory, "index.html") });
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (shape === "file" && entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html") {
      rows.push({ family, slug: entry.name.replace(/\.html$/, ""), file: path.join(directory, entry.name) });
    }
    if (shape === "directory" && entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, "index.html"))) {
      rows.push({ family, slug: entry.name, file: path.join(directory, entry.name, "index.html") });
    }
  }
}

function targets() {
  const rows = [];
  addDirectoryTargets(rows, "business-license", path.join(ROOT, "tools", "business-license"), "file");
  addDirectoryTargets(rows, "freelancer-rate", path.join(ROOT, "tools", "freelancer-rate"), "directory");
  addDirectoryTargets(rows, "maternity-leave", path.join(ROOT, "tools", "maternity-leave"), "directory");
  addDirectoryTargets(rows, "tin-guide", path.join(ROOT, "tools", "tin-guide"), "file");
  const conflicts = path.join(ROOT, "tools", "africa-conflict", "conflicts");
  for (const entry of fs.readdirSync(conflicts, { withFileTypes: true })) {
    const file = path.join(conflicts, entry.name, "index.html");
    if (entry.isDirectory() && fs.existsSync(file)) rows.push({ family: "africa-conflict", slug: entry.name, file });
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
  console.log("English country-directory snippets: " + result.targets + " pages checked; " + result.stale.length + (WRITE ? " updated." : " stale."));
}

if (require.main === module) main();

module.exports = { apply, countryName, metadataFor, run, targets };
