#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { renameSyncWithRetry, writeFileSyncWithRetry } = require("./lib/safe-write");
const { rewriteSharedAssetReferences } = require("./lib/shared-asset-references");

const ROOT = path.resolve(__dirname, "..");
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_DIRS = new Set([
  ".git",
  ".netlify",
  ".playwright",
  "artifacts",
  "dist",
  "node_modules",
  "output",
  "reports",
  "test-results",
]);

function walkHtml(directory, results = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(absolutePath, results);
    else if (entry.name.endsWith(".html")) results.push(absolutePath);
  }
  return results;
}

function writeAtomically(filePath, content) {
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );
  try {
    writeFileSyncWithRetry(tempPath, content, "utf8");
    renameSyncWithRetry(tempPath, filePath);
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

let changedFiles = 0;
let replacementCount = 0;
const samples = [];

for (const htmlPath of walkHtml(ROOT)) {
  const original = fs.readFileSync(htmlPath, "utf8");
  const result = rewriteSharedAssetReferences(original);
  if (result.html === original) continue;

  changedFiles += 1;
  replacementCount += result.replacements;
  if (samples.length < 10) samples.push(path.relative(ROOT, htmlPath).replace(/\\/g, "/"));
  if (!CHECK_ONLY) writeAtomically(htmlPath, result.html);
}

if (CHECK_ONLY && changedFiles > 0) {
  console.error(`  SHARED  FAIL ${replacementCount} stale shared-asset references in ${changedFiles} HTML files`);
  for (const sample of samples) console.error(`          ${sample}`);
  process.exit(1);
}

if (CHECK_ONLY) {
  console.log("  SHARED  PASS all HTML references use current minified shared assets");
} else {
  console.log(`  SHARED  ${changedFiles} HTML files updated, ${replacementCount} references rewritten`);
}
