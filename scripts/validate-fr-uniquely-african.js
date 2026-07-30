#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "localization",
  "fr-uniquely-african-parity-manifest.json"
);
const INVENTORY_PATH = path.join(ROOT, "reports", "french-free-app-parity-inventory.json");
const REGISTRY_PATH = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const AI_MAP_PATH = path.join(ROOT, "assets", "js", "ai", "french-route-map.generated.js");
const RECEIPT_PATH = path.join(ROOT, "reports", "fr-uniquely-african-parity", "acceptance-receipt.json");
const { generate: generateFrenchAiMap } = require("./build-ai-french-route-map");

function normalizeRoute(value) {
  const raw = String(value || "").split(/[?#]/)[0];
  if (!raw.startsWith("/")) return raw;
  return raw === "/" ? "/" : `${raw.replace(/\/+$/, "")}/`;
}

function absoluteUrl(route) {
  return `https://afrotools.com${normalizeRoute(route)}`;
}

function alternateLinks(source) {
  const links = new Map();
  const tags = String(source || "").match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const rel = tag.match(/\brel=["']([^"']+)["']/i);
    const lang = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (!rel || !lang || !href || rel[1].toLowerCase() !== "alternate") continue;
    links.set(lang[1].toLowerCase(), href[1]);
  }
  return links;
}

function routeFile(route) {
  const clean = normalizeRoute(route).replace(/^\/|\/$/g, "");
  const candidates = [
    path.join(ROOT, `${clean}.html`),
    path.join(ROOT, clean, "index.html"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[1];
}

function loadRegistry() {
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(REGISTRY_PATH, "utf8"), sandbox, {
    filename: REGISTRY_PATH,
  });
  return sandbox.AFRO_TOOLS;
}

function hrefs(html) {
  return Array.from(
    html.matchAll(/<a\b[^>]*href=["']([^"']+)/gi),
    (match) => normalizeRoute(match[1])
  );
}

function assertUnique(values, label, errors) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function ownerStatus(owner) {
  const [relativePath, symbol] = String(owner || "").split("#");
  const absolutePath = path.join(ROOT, relativePath || "");
  if (!relativePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return { owner, valid: false, reason: `missing owner file ${relativePath || "(empty)"}` };
  }
  if (!symbol) return { owner, valid: true, reason: null };

  const source = fs.readFileSync(absolutePath, "utf8");
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declarations = [
    new RegExp(`\\bfunction\\s+${escaped}\\s*\\(`),
    new RegExp(`\\b(?:window|root|exports)\\s*\\.\\s*${escaped}\\s*=`),
    new RegExp(`(?:^|[,{;]\\s*)${escaped}\\s*[:=]`, "m"),
    new RegExp(`["']${escaped}["']\\s*:`),
  ];
  if (!declarations.some((pattern) => pattern.test(source))) {
    return { owner, valid: false, reason: `missing owner symbol ${symbol} in ${relativePath}` };
  }
  return { owner, valid: true, reason: null };
}

function htmlSignals(html) {
  return {
    iframe: /<iframe\b/i.test(html),
    englishHtmlFetch: /fetch\s*\(\s*["'`]\/tools\/[^"'`]+/i.test(html),
    englishRuntimeTransplant:
      /querySelectorAll\(\s*["']script:not\(\[src\]\)/i.test(html) ||
      /appendChild\(\s*(?:ns|script|sc)\s*\)/i.test(html),
    runtimeTextLocalizer:
      /\bdata-fr-utility-localizer\b/i.test(html) ||
      /createTreeWalker\([^)]*NodeFilter\.SHOW_TEXT/i.test(html),
    bridgeHandoff:
      /(?:continuer|ouvrir|utiliser)[^<]{0,80}(?:calculateur|outil)[^<]{0,40}(?:complet|anglais)|source-launch|generated-bridge/i.test(
        html
      ),
  };
}

function reconcile(options = {}) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
  const registry = loadRegistry();
  const baseAiMap = require(AI_MAP_PATH).routes;
  const aiMap = baseAiMap;
  const rows = manifest.rows;
  const inventoryRows = inventory.rows.filter((row) => row.categoryKey === "african");
  const errors = [];

  if (manifest.denominator !== 34) errors.push(`manifest denominator ${manifest.denominator}, expected 34`);
  if (rows.length !== 34) errors.push(`manifest rows ${rows.length}, expected 34`);
  if (inventoryRows.length !== 34) errors.push(`coordinator inventory rows ${inventoryRows.length}, expected 34`);
  if (manifest.acceptance.accepted !== 0 && manifest.acceptance.accepted !== 34) {
    errors.push("programme acceptance must remain 0 or flip atomically to 34");
  }
  if (options.acceptance) {
    try {
      generateFrenchAiMap({ check: true });
    } catch (error) {
      errors.push(error.message);
    }
  }

  assertUnique(rows.map((row) => row.index), "index", errors);
  assertUnique(rows.map((row) => row.english.id), "English id", errors);
  assertUnique(rows.map((row) => normalizeRoute(row.english.route)), "English route", errors);
  assertUnique(rows.map((row) => normalizeRoute(row.french.route)), "French route", errors);

  const inventoryIds = new Set(inventoryRows.map((row) => row.englishId));
  const manifestIds = new Set(rows.map((row) => row.english.id));
  for (const id of inventoryIds) {
    if (!manifestIds.has(id)) errors.push(`inventory id absent from manifest: ${id}`);
  }
  for (const id of manifestIds) {
    if (!inventoryIds.has(id)) errors.push(`manifest id absent from inventory: ${id}`);
  }

  const enHubHtml = fs.readFileSync(path.join(ROOT, "uniquely-african", "index.html"), "utf8");
  const frHubHtml = fs.readFileSync(path.join(ROOT, "fr", "uniquely-african", "index.html"), "utf8");
  const enHubLinks = hrefs(enHubHtml);
  const frHubLinks = hrefs(frHubHtml);

  const details = rows.map((row) => {
    const enRoute = normalizeRoute(row.english.route);
    const frRoute = normalizeRoute(row.french.route);
    const enFile = routeFile(enRoute);
    const frFile = routeFile(frRoute);
    const enExists = fs.existsSync(enFile);
    const frExists = fs.existsSync(frFile);
    const enHtml = enExists ? fs.readFileSync(enFile, "utf8") : "";
    const frHtml = frExists ? fs.readFileSync(frFile, "utf8") : "";
    const enRegistry = registry.filter(
      (entry) =>
        (!entry.lang || entry.lang === "en") &&
        (entry.id === row.english.id || normalizeRoute(entry.href) === enRoute)
    );
    const frRegistry = registry.filter(
      (entry) =>
        entry.lang === "fr" &&
        normalizeRoute(entry.href) === frRoute &&
        entry.sourceId === row.english.id
    );
    const signals = htmlSignals(frHtml);
    const aiRoute = normalizeRoute(aiMap[enRoute] || "");
    const owner = ownerStatus(row.engineOwner);
    const receipt = fs.existsSync(RECEIPT_PATH)
      ? JSON.parse(fs.readFileSync(RECEIPT_PATH, "utf8")).routes.find(
          (item) => normalizeRoute(item.frenchRoute) === frRoute
        )
      : null;

    if (!enExists) errors.push(`${row.english.id}: missing English file ${path.relative(ROOT, enFile)}`);
    if (!frExists) errors.push(`${row.english.id}: missing French file ${path.relative(ROOT, frFile)}`);
    if (enRegistry.length !== 1) errors.push(`${row.english.id}: English registry owners ${enRegistry.length}, expected 1`);
    if (frRegistry.length !== 1) errors.push(`${row.english.id}: French registry owners ${frRegistry.length}, expected 1`);
    if (enHubLinks.filter((route) => route === enRoute).length !== 1) {
      errors.push(`${row.english.id}: English hub must link exactly once to ${enRoute}`);
    }
    if (options.acceptance && frHubLinks.filter((route) => route === frRoute).length !== 1) {
      errors.push(`${row.english.id}: French hub must link exactly once to ${frRoute}`);
    }
    if (options.acceptance && signals.iframe) errors.push(`${row.english.id}: French iframe remains`);
    if (options.acceptance && signals.englishHtmlFetch) errors.push(`${row.english.id}: French page fetches English HTML`);
    if (options.acceptance && signals.englishRuntimeTransplant) errors.push(`${row.english.id}: French page transplants English runtime`);
    if (options.acceptance && signals.runtimeTextLocalizer) errors.push(`${row.english.id}: French runtime text localizer remains`);
    if (options.acceptance && signals.bridgeHandoff) errors.push(`${row.english.id}: French bridge handoff remains`);
    if (options.acceptance && aiRoute !== frRoute) {
      errors.push(`${row.english.id}: AI ${aiRoute || "missing"} != ${frRoute}`);
    }
    if (!owner.valid) errors.push(`${row.english.id}: ${owner.reason}`);
    if (options.acceptance && frHtml) {
      if (!/<html\b[^>]*\blang=["']fr["']/i.test(frHtml)) errors.push(`${row.english.id}: html lang is not fr`);
      if (!frHtml.includes(`<link rel="canonical" href="${absoluteUrl(frRoute)}"`)) {
        errors.push(`${row.english.id}: French self-canonical missing`);
      }
      if (!frHtml.includes(`property="og:url" content="${absoluteUrl(frRoute)}"`)) {
        errors.push(`${row.english.id}: French og:url missing`);
      }
      if (!/"inLanguage"\s*:\s*"fr"/i.test(frHtml)) errors.push(`${row.english.id}: schema inLanguage fr missing`);
      if (!frHtml.includes(`hreflang="en" href="${absoluteUrl(enRoute)}"`)) {
        errors.push(`${row.english.id}: French hreflang en mismatch`);
      }
      if (!enHtml.includes(`hreflang="fr" href="${absoluteUrl(frRoute)}"`)) {
        errors.push(`${row.english.id}: English reciprocal hreflang fr mismatch`);
      }
      const englishAlternates = alternateLinks(enHtml);
      const frenchAlternates = alternateLinks(frHtml);
      for (const [lang, href] of englishAlternates) {
        if (lang === "fr") continue;
        if (frenchAlternates.get(lang) !== href) {
          errors.push(`${row.english.id}: French hreflang ${lang} mismatch`);
        }
        if (["en", "x-default"].includes(lang)) continue;
        let alternateUrl;
        try {
          alternateUrl = new URL(href);
        } catch (error) {
          errors.push(`${row.english.id}: invalid ${lang} hreflang URL ${href}`);
          continue;
        }
        if (alternateUrl.hostname !== "afrotools.com") continue;
        const alternateFile = routeFile(alternateUrl.pathname);
        const alternateHtml = fs.existsSync(alternateFile) ? fs.readFileSync(alternateFile, "utf8") : "";
        if (!alternateHtml.includes(`hreflang="fr" href="${absoluteUrl(frRoute)}"`)) {
          errors.push(`${row.english.id}: ${lang} reciprocal hreflang fr mismatch`);
        }
      }
      if (!frHtml.includes("data-fr-ua-app")) errors.push(`${row.english.id}: maintained French app owner marker missing`);
    }
    if (!fs.existsSync(path.join(ROOT, row.artwork.path))) {
      errors.push(`${row.english.id}: artwork missing ${row.artwork.path}`);
    }
    if (options.acceptance && (!receipt || receipt.status !== "accepted")) {
      errors.push(`${row.english.id}: accepted route receipt missing`);
    }

    return {
      index: row.index,
      englishId: row.english.id,
      englishRoute: enRoute,
      frenchRoute: frRoute,
      englishFile: path.relative(ROOT, enFile).replace(/\\/g, "/"),
      frenchFile: path.relative(ROOT, frFile).replace(/\\/g, "/"),
      englishRegistryOwners: enRegistry.length,
      frenchRegistryOwners: frRegistry.length,
      englishHubLinks: enHubLinks.filter((route) => route === enRoute).length,
      frenchHubLinks: frHubLinks.filter((route) => route === frRoute).length,
      aiRoute: aiRoute || null,
      engineOwner: owner,
      signals,
      artwork: fs.existsSync(path.join(ROOT, row.artwork.path)) ? "present" : "missing",
      receipt: receipt ? receipt.status : "missing",
    };
  });

  const summary = {
    rows: rows.length,
    coordinatorRows: inventoryRows.length,
    englishFiles: details.filter((row) => fs.existsSync(path.join(ROOT, row.englishFile))).length,
    frenchFiles: details.filter((row) => fs.existsSync(path.join(ROOT, row.frenchFile))).length,
    exactEnglishRegistryOwners: details.filter((row) => row.englishRegistryOwners === 1).length,
    exactFrenchRegistryOwners: details.filter((row) => row.frenchRegistryOwners === 1).length,
    exactEnglishHubLinks: details.filter((row) => row.englishHubLinks === 1).length,
    exactFrenchHubLinks: details.filter((row) => row.frenchHubLinks === 1).length,
    exactAiRoutes: details.filter((row) => row.aiRoute === row.frenchRoute).length,
    exactEngineOwners: details.filter((row) => row.engineOwner.valid).length,
    nativeRuntime: details.filter(
      (row) =>
        !row.signals.iframe &&
        !row.signals.englishHtmlFetch &&
        !row.signals.englishRuntimeTransplant &&
        !row.signals.runtimeTextLocalizer &&
        !row.signals.bridgeHandoff
    ).length,
    artworkPresent: details.filter((row) => row.artwork === "present").length,
    acceptedReceipts: details.filter((row) => row.receipt === "accepted").length,
    errors: errors.length,
  };

  return { manifest, summary, details, errors };
}

function main() {
  const acceptance = process.argv.includes("--acceptance");
  const json = process.argv.includes("--json");
  const result = reconcile({ acceptance });
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    console.log(JSON.stringify(result.summary, null, 2));
    if (result.errors.length) {
      console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    }
  }
  if (result.errors.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  MANIFEST_PATH,
  normalizeRoute,
  ownerStatus,
  reconcile,
  routeFile,
};
