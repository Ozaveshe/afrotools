#!/usr/bin/env node
/**
 * Enrich agriculture tool country pages with server-rendered per-country data
 * from data/agriculture/<cc>-agri-data.js, and replace the site-wide generic
 * FAQ sentence with a tool/country-specific one.
 *
 * Idempotent: skips pages that already contain the agri-facts marker.
 * Usage: node scripts/enrich-agriculture-country-pages.js [--dry]
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");
const MARKER = "agri-country-facts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function slugify(name) {
  return String(name).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ── load all per-country data files ──
const countryData = new Map(); // slug -> countryData object
for (const fn of fs.readdirSync(path.join(ROOT, "data", "agriculture"))) {
  if (!/^[a-z]{2}-agri-data\.js$/.test(fn)) continue;
  const src = fs.readFileSync(path.join(ROOT, "data", "agriculture", fn), "utf8");
  const ctx = { window: {} };
  vm.createContext(ctx);
  try { vm.runInContext(src, ctx, { filename: fn }); } catch (err) { /* browser-only tails */ }
  let data = null;
  for (const scope of [ctx, ctx.window]) {
    for (const key of Object.keys(scope)) {
      const val = scope[key];
      if (val && typeof val === "object" && val.countryData) data = val.countryData;
      else if (val && typeof val === "object" && val.countryCode && val.agriStats) data = val;
    }
  }
  if (data && data.name) {
    countryData.set(slugify(data.name), data);
  }
}
// common slug aliases used by page filenames
const ALIASES = {
  "cote-d-ivoire": "cote-divoire", "cote-divoire": "cote-divoire",
  "dr-congo": "dr-congo", "drc": "dr-congo",
  "cape-verde": "cabo-verde", "cabo-verde": "cabo-verde",
  "sao-tome": "sao-tome-and-principe", "swaziland": "eswatini",
};
for (const [alias, target] of Object.entries(ALIASES)) {
  const hit = countryData.get(target) || countryData.get(alias);
  if (hit) { countryData.set(alias, hit); countryData.set(target, hit); }
}

// ── tool categories decide which narrative to lead with ──
const FINANCE_TOOLS = new Set(["farm-payroll", "farm-loans", "farm-budget", "farm-profit", "farm-finance-roi", "cooperative-calculator", "crop-insurance", "agri-loans", "farm-size-converter"]);
const WATER_TOOLS = new Set(["irrigation", "harvest-date", "crop-planning-yield", "greenhouse", "crop-rotation"]);

function listWords(arr, max) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr.slice(0, max).map((c) => String(c).replace(/_/g, " ")).join(", ");
}

function seasonLabel(monthsArr) {
  if (!Array.isArray(monthsArr) || !monthsArr.length) return "";
  const first = MONTHS[(monthsArr[0] - 1 + 12) % 12];
  const last = MONTHS[(monthsArr[monthsArr.length - 1] - 1 + 12) % 12];
  return `${first} to ${last}`;
}

function escapeHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function factsSection(tool, data) {
  const s = data.agriStats || {};
  const name = data.name;
  const bits = [];

  let lead;
  if (FINANCE_TOOLS.has(tool)) {
    const parts = [];
    if (s.gdpSharePercent) parts.push(`agriculture contributes about ${s.gdpSharePercent}% of GDP`);
    if (s.laborForcePercent) parts.push(`employs roughly ${s.laborForcePercent}% of the labour force`);
    if (s.avgFarmSizeHa) parts.push(`the average farm is around ${s.avgFarmSizeHa} ha`);
    lead = parts.length ? `In ${name}, ${parts.join(", ")} — so plan budgets, wages, and repayments around smallholder cash-flow cycles.` : "";
  } else if (WATER_TOOLS.has(tool)) {
    const rainy = seasonLabel(s.rainySeasonMonths);
    const dry = seasonLabel(s.drySeasonMonths);
    lead = rainy ? `${name}'s main rainy season runs ${rainy}${dry ? `, with a dry season from ${dry}` : ""} — timing plantings and water budgets around these windows matters more than any single input price.` : "";
  } else {
    const food = listWords(s.mainFoodCrops, 4);
    const exp = listWords(s.mainExportCrops, 3);
    lead = food ? `${name}'s staple crops include ${food}${exp ? `, while ${exp} lead exports` : ""}. Regional growing conditions differ sharply, so check your region below before applying national averages.` : "";
  }
  if (lead) bits.push(`<p>${escapeHtml(lead)}</p>`);

  const facts = [];
  if (s.gdpSharePercent) facts.push(`<tr><th scope="row">Agriculture share of GDP</th><td>~${escapeHtml(String(s.gdpSharePercent))}%</td></tr>`);
  if (s.arableLandHectares) facts.push(`<tr><th scope="row">Arable land</th><td>${escapeHtml(Number(s.arableLandHectares).toLocaleString("en-US"))} ha</td></tr>`);
  if (s.irrigatedPercent !== undefined && s.irrigatedPercent !== null) facts.push(`<tr><th scope="row">Irrigated share</th><td>~${escapeHtml(String(s.irrigatedPercent))}%</td></tr>`);
  const rainy = seasonLabel(s.rainySeasonMonths);
  if (rainy) facts.push(`<tr><th scope="row">Main rainy season</th><td>${escapeHtml(rainy)}</td></tr>`);
  const food = listWords(s.mainFoodCrops, 6);
  if (food) facts.push(`<tr><th scope="row">Main food crops</th><td>${escapeHtml(food)}</td></tr>`);
  const exp = listWords(s.mainExportCrops, 5);
  if (exp) facts.push(`<tr><th scope="row">Main export crops</th><td>${escapeHtml(exp)}</td></tr>`);

  let regions = "";
  if (Array.isArray(data.regions) && data.regions.length) {
    const rows = data.regions.slice(0, 8).map((r) =>
      `<tr><td>${escapeHtml(r.name || "")}</td><td>${r.annualRainfall_mm ? escapeHtml(String(r.annualRainfall_mm)) + " mm" : "—"}</td><td>${escapeHtml(listWords(r.majorCrops, 4))}</td></tr>`
    ).join("\n");
    regions = `<h3 style="font-size:.95rem;font-weight:700;margin:1.2rem 0 .4rem;">Growing regions at a glance</h3>
<table style="width:100%;border-collapse:collapse;font-size:.82rem;">
<thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e2e8f0;">Region</th><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e2e8f0;">Annual rainfall</th><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e2e8f0;">Major crops</th></tr></thead>
<tbody>${rows.replace(/<td>/g, '<td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">')}</tbody>
</table>`;
  }

  if (!bits.length && !facts.length && !regions) return "";
  return `
<section class="seo-content ${MARKER}" style="max-width:800px;margin:2rem auto;padding:0 1rem;">
<h2 style="font-size:1.15rem;font-weight:700;color:#1e293b;margin:1.5rem 0 0.5rem;">Farming context: ${escapeHtml(name)}</h2>
${bits.join("\n")}
${facts.length ? `<table style="width:100%;border-collapse:collapse;font-size:.85rem;"><tbody>${facts.map((f) => f.replace("<th scope=\"row\">", '<th scope="row" style="text-align:left;padding:6px 8px;border-bottom:1px solid #eef2f7;font-weight:600;">').replace("<td>", '<td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">')).join("\n")}</tbody></table>` : ""}
${regions}
<p style="font-size:.78rem;color:#64748b;">Country context from the AfroTools agriculture dataset — planning reference, not agronomic advice. Confirm with local extension services.</p>
</section>`;
}

function toolLabel(tool) {
  return tool.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").replace(/\bRoi\b/, "ROI");
}

// ── walk agriculture tool country pages ──
const GENERIC_FAQ = "Use it as a planning step before you pay, submit, publish, travel, or choose a provider.";
let enriched = 0, faqFixed = 0, skippedNoData = new Set(), alreadyDone = 0;

const agDir = path.join(ROOT, "agriculture");
for (const tool of fs.readdirSync(agDir)) {
  const toolDir = path.join(agDir, tool);
  if (!fs.statSync(toolDir).isDirectory()) continue;
  for (const fn of fs.readdirSync(toolDir)) {
    if (!fn.endsWith(".html") || fn === "index.html" || fn.startsWith("_")) continue;
    const slug = fn.replace(/\.html$/, "");
    const fp = path.join(toolDir, fn);
    let src = fs.readFileSync(fp, "utf8");
    let changed = false;

    if (src.includes(GENERIC_FAQ)) {
      const country = countryData.get(slug) ? countryData.get(slug).name : slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      src = src.split(GENERIC_FAQ).join(
        `Use it to sanity-check ${toolLabel(tool).toLowerCase()} assumptions for ${country} before committing money with suppliers, buyers, lenders, or workers.`);
      faqFixed++; changed = true;
    }

    if (!src.includes(MARKER)) {
      const data = countryData.get(slug);
      if (data) {
        const section = factsSection(tool, data);
        if (section) {
          if (src.includes("</main>")) {
            src = src.replace("</main>", `</main>\n${section}`);
            enriched++; changed = true;
          } else if (src.includes("<afro-footer")) {
            src = src.replace("<afro-footer", `${section}\n<afro-footer`);
            enriched++; changed = true;
          }
        }
      } else {
        skippedNoData.add(slug);
      }
    } else {
      alreadyDone++;
    }

    if (changed && !DRY) fs.writeFileSync(fp, src, "utf8");
  }
}

// ── de-duplicate the generic FAQ sentence everywhere else (tools/, crypto/, telecom/ ...) ──
function walkOthers(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", ".claude", "agriculture", "admin"].includes(entry.name)) continue;
      walkOthers(path.join(dir, entry.name));
    } else if (entry.name.endsWith(".html")) {
      const fp = path.join(dir, entry.name);
      let src;
      try { src = fs.readFileSync(fp, "utf8"); } catch { return; }
      if (!src.includes(GENERIC_FAQ)) continue;
      const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
      const parts = rel.split("/");
      const toolSlug = parts.length >= 2 ? parts[parts.length - 2] : "this tool";
      const base = entry.name.replace(/\.html$/, "");
      const country = countryData.get(base) ? countryData.get(base).name : null;
      const scope = country ? `${toolLabel(toolSlug).toLowerCase()} numbers for ${country}` : `${toolLabel(toolSlug === "index" ? base : toolSlug).toLowerCase()} numbers`;
      src = src.split(GENERIC_FAQ).join(`Use it to pressure-test ${scope} before committing money, paperwork, or plans.`);
      faqFixed++;
      if (!DRY) fs.writeFileSync(fp, src, "utf8");
    }
  }
}
walkOthers(ROOT);

console.log(`enriched: ${enriched} pages | FAQ sentence replaced on: ${faqFixed} pages | already enriched: ${alreadyDone}`);
if (skippedNoData.size) console.log("no data for slugs:", [...skippedNoData].sort().join(", "));
