#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const FRENCH_ROOT = path.join(ROOT, "fr");
const WRITE = process.argv.includes("--write");

// Deliberately limited to navigation, support, legal and locale entry points.
// Tool-to-tool links are not rewritten here because a French information page
// may honestly hand off to a fuller English workflow.
const SAFE_FRENCH_DESTINATIONS = new Map(Object.entries({
  "/": "/fr/",
  "/ai/": "/fr/ai/",
  "/api/": "/fr/api/",
  "/blog/": "/fr/blog/",
  "/business-enquiry/": "/fr/demande-entreprise/",
  "/cape-verde/": "/fr/cabo-verde/",
  "/contact/": "/fr/contact/",
  "/custom-calculators/": "/fr/calculateurs-sur-mesure/",
  "/developer-tools/": "/fr/developer-tools/",
  "/education/": "/fr/education/",
  "/engineering/": "/fr/ingenierie/",
  "/health/": "/fr/health/",
  "/insurance/": "/fr/insurance/",
  "/legal/": "/fr/legal/",
  "/privacy/": "/fr/privacy/",
  "/south-africa/": "/fr/south-africa/",
  "/terms/": "/fr/terms-of-use/",
  "/tools/": "/fr/all-tools/",
  "/transport/": "/fr/transport/",
  "/uniquely-african/": "/fr/uniquely-african/"
}));

function htmlFiles(dir = FRENCH_ROOT, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(fullPath, files);
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

function visibleAnchorText(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isExplicitEnglishHandoff(tag, text) {
  return /\b(?:anglais(?:e|es)?|english)\b/i.test(`${tag} ${visibleAnchorText(text)}`);
}

function repairHtml(html) {
  let replacements = 0;
  const next = html.replace(/<a\b[^>]*\bhref=(['"])([^'"]+)\1[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
    const hrefMatch = anchor.match(/\bhref=(['"])([^'"]+)\1/i);
    if (!hrefMatch || isExplicitEnglishHandoff(anchor, anchor.replace(/^[\s\S]*?>/, "").replace(/<\/a>\s*$/i, ""))) return anchor;

    const href = hrefMatch[2];
    const absolutePrefix = href.startsWith("https://afrotools.com") ? "https://afrotools.com" : "";
    const internalHref = absolutePrefix ? href.slice(absolutePrefix.length) : href;
    if (!internalHref.startsWith("/")) return anchor;

    const boundary = internalHref.search(/[?#]/);
    const route = boundary === -1 ? internalHref : internalHref.slice(0, boundary);
    const suffix = boundary === -1 ? "" : internalHref.slice(boundary);
    const destination = SAFE_FRENCH_DESTINATIONS.get(route);
    if (!destination) return anchor;

    const replacement = `${absolutePrefix}${destination}${suffix}`;
    if (replacement === href) return anchor;
    replacements += 1;
    return anchor.replace(hrefMatch[0], `href=${hrefMatch[1]}${replacement}${hrefMatch[1]}`);
  });
  return { next, replacements };
}

function run(options = {}) {
  const write = options.write === undefined ? WRITE : Boolean(options.write);
  const changedFiles = [];
  let replacements = 0;

  for (const filePath of htmlFiles()) {
    const current = fs.readFileSync(filePath, "utf8");
    const repaired = repairHtml(current);
    if (!repaired.replacements) continue;
    changedFiles.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    replacements += repaired.replacements;
    if (write) writeFileSyncWithRetry(filePath, repaired.next, "utf8");
  }

  return { changedFiles, replacements };
}

function main() {
  const result = run();
  if (!WRITE && result.changedFiles.length) {
    result.changedFiles.slice(0, 50).forEach((file) => console.error(`STALE ${file}`));
    if (result.changedFiles.length > 50) console.error(`STALE ... ${result.changedFiles.length - 50} more file(s)`);
    process.exitCode = 1;
  }
  console.log(`${WRITE ? "Repaired" : "Checked"} French navigation links: ${result.replacements} replacement(s) across ${result.changedFiles.length} file(s).`);
}

if (require.main === module) main();

module.exports = { SAFE_FRENCH_DESTINATIONS, isExplicitEnglishHandoff, repairHtml, run };
