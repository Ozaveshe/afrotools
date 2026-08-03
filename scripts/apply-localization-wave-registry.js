#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
  unlinkSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const WAVE = require("../data/localization/coverage-wave-2026-07.json");
const SW_ACCEPTANCE = require("../data/audits/swahili-free-app-acceptance.json");
const START = "  // LOCALIZATION_COVERAGE_WAVE_2026_07_START";
const END = "  // LOCALIZATION_COVERAGE_WAVE_2026_07_END";
const WRITE = process.argv.includes("--write");

function atomicWrite(file, value) {
  const temp = `${file}.tmp-${process.pid}`;
  unlinkSyncWithRetry(temp);
  writeFileSyncWithRetry(temp, value, "utf8");
  if (fs.existsSync(file)) unlinkSyncWithRetry(file);
  renameSyncWithRetry(temp, file);
}

function loadTools(source) {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "tool-registry.js" });
  return context.AFRO_TOOLS;
}

function js(value) {
  return JSON.stringify(value == null ? null : value).replace(/<\//g, "<\\/");
}

function stripBlock(source) {
  const pattern = new RegExp(`\\n${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`, "g");
  return source.replace(pattern, "\n");
}

function sourceRecordFor(tools, enSlug) {
  const href = `/tools/${enSlug}/`;
  const direct = tools.find((tool) => (!tool.lang || tool.lang === "en") && tool.href === href);
  if (direct) return direct;
  const family = enSlug.split("/")[0];
  return tools.find((tool) => (!tool.lang || tool.lang === "en") && tool.href === `/tools/${family}/`) || null;
}

function registryRow(entry, locale, tools) {
  const source = sourceRecordFor(tools, entry.enSlug) || {
    id: entry.enSlug.split("/")[0],
    icon: "AT",
    category: entry.category || "other",
    tier: "T3",
    countries: ["ALL"],
    priority: entry.priority || 0,
  };
  const localeSlug = locale === "fr" ? entry.frSlug : entry.swSlug;
  const href = locale === "fr" ? `/fr/tools/${localeSlug}/` : `/sw/zana/${localeSlug}/`;
  const id = `${source.id}-${locale}-coverage-${entry.enSlug.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
  const category = source.category && source.category !== "other"
    ? source.category
    : entry.category || source.category || "other";
  const fields = [
    `id: ${js(id)}`,
    `name: ${js(entry.name)}`,
    `icon: ${js(entry.icon || source.icon || "AT")}`,
    `desc: ${js(entry.description)}`,
    `href: ${js(href)}`,
    `category: ${js(category)}`,
    `tier: ${js(entry.tier || source.tier || "T3")}`,
    `status: "live"`,
    `phase: "LIVE"`,
    `countries: ${js(entry.countries || source.countries || ["ALL"])}`,
    `revenue: ${js(entry.revenue || "Discovery")}`,
    ...(Number.isFinite(entry.estRevenue) ? [`estRevenue: ${Number(entry.estRevenue)}`] : []),
    `priority: ${Number(entry.priority || source.priority || 0)}`,
    `lang: ${js(locale)}`,
    ...(entry.parentSourceId
      ? [`parentSourceId: ${js(entry.parentSourceId)}`]
      : [`sourceId: ${js(entry.sourceId || source.id)}`]),
    ...(entry.image === false
      ? ["image: false"]
      : [`imageId: ${js(entry.imageId || source.imageId || source.id)}`]),
    ...(entry.version ? [`version: ${js(entry.version)}`] : []),
  ];
  return `  { ${fields.join(", ")} },`;
}

function registryRowFromTool(tool) {
  const fields = Object.entries(tool).map(([key, value]) => `${key}: ${js(value)}`);
  return `  { ${fields.join(", ")} },`;
}

const acceptedSwahiliRoutes = new Set(
  SW_ACCEPTANCE.entries
    .filter((entry) => entry.status === "accepted")
    .map((entry) => `${String(entry.swahiliRoute).replace(/\/$/, "")}/`)
);

function build() {
  const original = fs.readFileSync(REGISTRY, "utf8");
  const originalTools = loadTools(original);
  const source = stripBlock(original);
  const tools = loadTools(source);
  const frenchEntries = [...WAVE.french, ...(WAVE.nativeFrench || [])];
  const generatedSwahiliHrefs = new Set();
  const swahiliRows = WAVE.swahili
    .filter((entry) => !tools.some((tool) => tool.lang === "sw" && tool.href === `/sw/zana/${entry.swSlug}/`))
    .map((entry) => {
      const href = `/sw/zana/${entry.swSlug}/`;
      generatedSwahiliHrefs.add(href);
      if (!acceptedSwahiliRoutes.has(href)) return registryRow(entry, "sw", tools);
      const accepted = originalTools.find((tool) => tool.lang === "sw" && tool.href === href);
      if (!accepted) throw new Error(`Accepted Swahili registry row is missing: ${href}`);
      return registryRowFromTool(accepted);
    });
  const acceptedExtraRows = originalTools
    .filter((tool) => tool.lang === "sw" && acceptedSwahiliRoutes.has(tool.href))
    .filter((tool) => !tools.some((sourceTool) => sourceTool.lang === "sw" && sourceTool.href === tool.href))
    .filter((tool) => !generatedSwahiliHrefs.has(tool.href))
    .map(registryRowFromTool);
  const rows = [
    START,
    "  // Generated from data/localization/coverage-wave-2026-07.json. Re-run this script after changing the manifest.",
    ...frenchEntries
      .filter((entry) => entry.registryManaged !== false)
      .map((entry) => registryRow(entry, "fr", tools)),
    ...swahiliRows,
    ...acceptedExtraRows,
    END,
  ].join("\n");

  const arrayStart = source.indexOf("var AFRO_TOOLS = [");
  const arrayEnd = source.indexOf("\n];", arrayStart);
  if (arrayStart < 0 || arrayEnd < 0) throw new Error("Could not locate AFRO_TOOLS array boundary");
  return {
    original,
    next: `${source.slice(0, arrayEnd)}\n${rows}${source.slice(arrayEnd)}`,
  };
}

const outcome = build();
if (WRITE) {
  atomicWrite(REGISTRY, outcome.next);
  console.log(`Applied ${WAVE.french.length + (WAVE.nativeFrench || []).length + WAVE.swahili.length} localization wave registry rows.`);
} else if (outcome.original !== outcome.next) {
  console.error("Localization wave registry is out of date. Run: node scripts/apply-localization-wave-registry.js --write");
  process.exitCode = 1;
} else {
  console.log("Localization wave registry is current.");
}
