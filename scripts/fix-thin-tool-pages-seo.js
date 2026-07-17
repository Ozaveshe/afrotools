#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TOOLS_DIR = path.join(ROOT, "tools");
const SITE_ORIGIN = "https://afrotools.com";
const DRY_RUN = process.argv.includes("--dry-run");
const EXPLICIT_TARGETS = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith("--"))
  .map((target) => path.resolve(ROOT, target));

const THIN_TOOL_FILE_NAMES = new Set([
  "app.html",
  "create.html",
  "edit.html",
  "view.html",
  "quote.html",
  "project.html",
  "plan.html",
  "clients.html",
  "activity.html",
  "history.html",
  "voice.html",
  "reports.html",
  "rate-card.html",
]);

const EXPLICIT_THIN_PAGES = new Set([
  "tools/afrokitchen/recipe.html",
  "tools/afrokitchen/collection.html",
  "tools/afrokitchen/country.html",
  "tools/afrokitchen/submit.html",
  "fr/tools/afrokitchen/recipe.html",
  "fr/tools/afrokitchen/collection.html",
  "fr/tools/afrokitchen/country.html",
  "fr/tools/afrokitchen/submit.html",
  "tools/africa-conflict/detail.html",
]);

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function isTargetFile(filePath) {
  const rel = normalizeRel(filePath);
  if (EXPLICIT_THIN_PAGES.has(rel)) return true;

  const parts = rel.split("/");
  const isRootToolPage = parts.length === 3 && parts[0] === "tools";
  const isLocalizedToolPage = parts.length === 4 && parts[1] === "tools";

  if (!isRootToolPage && !isLocalizedToolPage) return false;

  return THIN_TOOL_FILE_NAMES.has(parts[parts.length - 1]);
}

function parentToolCanonical(filePath) {
  const rel = normalizeRel(filePath);
  const parts = rel.split("/");

  if (parts.length >= 3 && parts[0] === "tools") {
    return `${SITE_ORIGIN}/tools/${parts[1]}/`;
  }

  if (parts.length >= 4 && parts[1] === "tools") {
    return `${SITE_ORIGIN}/${parts[0]}/tools/${parts[2]}/`;
  }

  return null;
}

function insertBeforeHeadEnd(html, lines) {
  if (!/<\/head>/i.test(html)) return html;
  return html.replace(/<\/head>/i, `${lines.join("\n")}\n</head>`);
}

function upsertCanonical(html, href) {
  const line = `<link rel="canonical" href="${href}">`;
  const pattern = /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>/i;

  if (pattern.test(html)) {
    return html.replace(pattern, line);
  }

  return insertBeforeHeadEnd(html, [line]);
}

function upsertRobots(html, content) {
  const line = `<meta name="robots" content="${content}">`;
  const pattern = /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/i;

  if (pattern.test(html)) {
    return html.replace(pattern, line);
  }

  return insertBeforeHeadEnd(html, [line]);
}

function main() {
  const files = (EXPLICIT_TARGETS.length ? EXPLICIT_TARGETS : walkHtmlFiles(TOOLS_DIR))
    .filter((filePath, index, all) => all.indexOf(filePath) === index)
    .filter((filePath) => fs.existsSync(filePath))
    .filter(isTargetFile)
    .sort();
  let patched = 0;
  let unchanged = 0;

  for (const filePath of files) {
    const canonicalHref = parentToolCanonical(filePath);
    if (!canonicalHref) {
      unchanged++;
      continue;
    }

    const original = fs.readFileSync(filePath, "utf8");
    let next = original;

    next = upsertCanonical(next, canonicalHref);
    next = upsertRobots(next, "noindex, follow");

    if (next === original) {
      unchanged++;
      continue;
    }

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, next, "utf8");
    }
    patched++;
  }

  console.log(`Thin tool pages checked: ${files.length}`);
  console.log(`Thin tool pages patched: ${patched}`);
  console.log(`Thin tool pages unchanged: ${unchanged}`);
  if (EXPLICIT_TARGETS.length) {
    console.log("Scope: explicit targets");
  }
  if (DRY_RUN) {
    console.log("Mode: dry-run");
  }
}

main();
