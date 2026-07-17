#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
  unlinkSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const WAVE = require("../data/localization/coverage-wave-2026-07.json");
const DISPLACED_ROUTE_OWNERS = [
  "health/bmi-calculator",
  "health/pregnancy-due-date",
  "tools/tip-calculator",
];

function atomicWrite(file, value) {
  const temp = `${file}.tmp-${process.pid}`;
  unlinkSyncWithRetry(temp);
  writeFileSyncWithRetry(temp, value.normalize("NFC").replace(/\r\n/g, "\n"), "utf8");
  if (fs.existsSync(file)) unlinkSyncWithRetry(file);
  renameSyncWithRetry(temp, file);
}

function routeFile(href) {
  const pathname = new URL(href, SITE).pathname.replace(/^\/+/, "");
  if (!pathname) return path.join(ROOT, "index.html");
  const candidates = pathname.endsWith("/")
    ? [path.join(ROOT, pathname, "index.html")]
    : [path.join(ROOT, `${pathname}.html`), path.join(ROOT, pathname, "index.html")];
  return candidates.find((file) => fs.existsSync(file)) || null;
}

function alternateMap(html) {
  const out = new Map();
  for (const match of html.matchAll(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']([^"']+)["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi)) {
    if (match[1].toLowerCase() !== "x-default") out.set(match[1], new URL(match[2], SITE).href);
  }
  return out;
}

function upsertAlternate(html, lang, href) {
  const tag = `<link rel="alternate" hreflang="${lang}" href="${href}">`;
  const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${lang}["'])[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/i);
  if (canonical) return html.replace(canonical[0], `${canonical[0]}${tag}\n`);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function syncSource(sourcePath) {
  const source = path.join(ROOT, sourcePath, "index.html");
  if (!fs.existsSync(source)) throw new Error(`Missing English source ${sourcePath}/index.html`);
  let sourceHtml = fs.readFileSync(source, "utf8");
  const alternates = alternateMap(sourceHtml);
  const enHref = alternates.get("en") || `${SITE}/${sourcePath}/`;
  alternates.set("en", enHref);

  for (const [locale, href] of [...alternates]) {
    if (locale === "en") continue;
    if (!routeFile(href)) alternates.delete(locale);
  }

  for (const [locale, href] of alternates) sourceHtml = upsertAlternate(sourceHtml, locale, href);
  sourceHtml = upsertAlternate(sourceHtml, "x-default", enHref);
  atomicWrite(source, sourceHtml);

  let localizedUpdated = 0;
  for (const [locale, href] of alternates) {
    if (locale === "en") continue;
    if (!href) continue;
    const file = routeFile(href);
    if (!file) continue;
    let html = fs.readFileSync(file, "utf8");
    const before = html;
    for (const [clusterLocale, clusterHref] of alternates) html = upsertAlternate(html, clusterLocale, clusterHref);
    html = upsertAlternate(html, "x-default", enHref);
    if (html !== before) {
      atomicWrite(file, html);
      localizedUpdated += 1;
    }
  }
  return localizedUpdated;
}

const sources = [...new Set([
  ...WAVE.french.map((entry) => `tools/${entry.enSlug}`),
  ...WAVE.swahili.map((entry) => `tools/${entry.enSlug}`),
  ...DISPLACED_ROUTE_OWNERS,
])];
let localizedUpdated = 0;
for (const source of sources) localizedUpdated += syncSource(source);
console.log(`Synced hreflang clusters for ${sources.length} English sources; ${localizedUpdated} localized pages updated.`);
