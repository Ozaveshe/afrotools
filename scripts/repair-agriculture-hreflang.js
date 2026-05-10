#!/usr/bin/env node
"use strict";

/**
 * Repair French agriculture reciprocal hreflang debt.
 *
 * This intentionally uses the French localization ledger as its queue and only
 * updates English agriculture pages that are already referenced by French
 * agriculture pages. It does not edit agriculture copy or create translations.
 */

const fs = require("fs");
const path = require("path");

const {
  ROOT,
  SITE_ORIGIN,
  fileToPublicRoute,
  relativeHtmlPath,
} = require("./lib/canonical-aliases");

const ledgerPath = path.join(ROOT, "reports", "french-localization-ledger.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function publicUrlForFile(filePath) {
  return `${SITE_ORIGIN}${fileToPublicRoute(filePath)}`;
}

function routeToExistingFile(route) {
  const cleaned = String(route || "").replace(/^\/+|\/+$/g, "");
  if (!cleaned) return "";

  const htmlPath = path.join(ROOT, `${cleaned}.html`);
  if (fs.existsSync(htmlPath)) return htmlPath;

  const indexPath = path.join(ROOT, cleaned, "index.html");
  if (fs.existsSync(indexPath)) return indexPath;

  return "";
}

function extractAlternates(html) {
  const tags = [];
  const re = /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']([^"']+)["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>\s*/gi;
  let match;

  while ((match = re.exec(html)) !== null) {
    tags.push({
      lang: match[1],
      href: match[2],
    });
  }

  return tags;
}

function replaceAlternates(html, tags) {
  const block = tags
    .map(({ lang, href }) => `<link rel="alternate" hreflang="${lang}" href="${href}" />`)
    .join("\n");

  const withoutAlternates = html.replace(
    /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["'][^"']+["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>\s*/gi,
    ""
  );

  const canonicalMatch = withoutAlternates.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/i);
  if (canonicalMatch) {
    return withoutAlternates.replace(canonicalMatch[0], `${canonicalMatch[0]}${block}\n`);
  }

  return withoutAlternates.replace(/<\/head>/i, `${block}\n</head>`);
}

function buildTagSet(enFile, frFile, html) {
  const enUrl = publicUrlForFile(enFile);
  const frUrl = publicUrlForFile(frFile);
  const seen = new Set(["en", "fr", "x-default"]);
  const preserved = [];

  for (const tag of extractAlternates(html)) {
    const lang = tag.lang.toLowerCase();
    if (seen.has(lang)) continue;
    seen.add(lang);
    preserved.push({ lang: tag.lang, href: tag.href });
  }

  return [
    { lang: "en", href: enUrl },
    ...preserved,
    { lang: "fr", href: frUrl },
    { lang: "x-default", href: enUrl },
  ];
}

function main() {
  if (!fs.existsSync(ledgerPath)) {
    throw new Error(`Missing ledger: ${relativeHtmlPath(ledgerPath)}`);
  }

  const ledger = readJson(ledgerPath);
  const gaps = ledger.findings?.missingReciprocalHreflang || [];
  const targets = new Map();
  const skipped = [];

  for (const gap of gaps) {
    if (!String(gap.source || "").startsWith("/fr/agriculture")) continue;
    if (!String(gap.target || "").startsWith("/agriculture")) continue;
    if (!String(gap.targetFile || "").startsWith("agriculture/")) continue;

    const enFile = path.join(ROOT, gap.targetFile);
    const frFile = routeToExistingFile(gap.source);

    if (!fs.existsSync(enFile) || !frFile) {
      skipped.push(gap);
      continue;
    }

    targets.set(enFile, frFile);
  }

  let changed = 0;

  for (const [enFile, frFile] of targets) {
    const before = fs.readFileSync(enFile, "utf8");
    const next = replaceAlternates(before, buildTagSet(enFile, frFile, before));

    if (next !== before) {
      fs.writeFileSync(enFile, next, "utf8");
      changed++;
    }
  }

  console.log(
    JSON.stringify(
      {
        ledgerMissingReciprocalBefore: gaps.length,
        agricultureTargets: targets.size,
        agricultureFilesChanged: changed,
        skipped: skipped.length,
      },
      null,
      2
    )
  );
}

main();
