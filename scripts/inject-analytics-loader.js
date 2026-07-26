#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const ANALYTICS_SOURCE = path.join(ROOT, "assets", "js", "lazy-analytics.js");
const PUBLIC_SRC = "/assets/js/lazy-analytics.js";

// Keep this list aligned with the non-public top-level directories in
// scripts/build-dist.js. The source build owns public pages; evidence,
// implementation, and nested agent worktrees must never be rewritten.
const SKIPPED_TOP_LEVEL_DIRECTORIES = new Set([
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".github",
  ".jamb",
  ".jamb-tools",
  ".netlify",
  ".playwright",
  ".playwright-cli",
  ".tmp-validation",
  "admin",
  "afrotools-sentinel",
  "artifacts",
  "audit-results",
  "dist",
  "docs",
  "lang",
  "netlify",
  "node_modules",
  "ops",
  "output",
  "prompts",
  "reports",
  "scripts",
  "supabase",
  "test-results",
  "tests",
]);

const SKIPPED_DIRECTORY_PREFIXES = [
  "fr/widgets/iframe/",
  "matchday-os/",
  "widgets/iframe/",
];

const SKIPPED_FILES = new Set([
  "afrotools-mission-control.html",
  "agriculture/farm-payroll/_template.html",
  "fr/widgets/iframe/template.html",
  "mc-7a2f9x.html",
  "tools/afroatlas/_country-template.html",
  "tools/afrostream/admin.html",
  "widgets/iframe/template.html",
]);

const LOADER_PATTERN = /<script\b[^>]*\bsrc=(["'])\/assets\/js\/lazy-analytics\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>/gi;

function normalizeRelative(filePath, root = ROOT) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function shouldSkipRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (!normalized) return false;

  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return false;
  if (parts.some((part) => part.startsWith("."))) return true;
  if (SKIPPED_TOP_LEVEL_DIRECTORIES.has(parts[0])) return true;
  if (SKIPPED_FILES.has(normalized)) return true;
  if (SKIPPED_DIRECTORY_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;
  return false;
}

function walkHtml(root = ROOT) {
  const files = [];

  function visit(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizeRelative(absolute, root);
      if (shouldSkipRelativePath(relative)) continue;
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        files.push(absolute);
      }
    }
  }

  visit(root);
  return files;
}

function analyticsVersion(sourcePath = ANALYTICS_SOURCE) {
  const source = fs.readFileSync(sourcePath);
  return crypto.createHash("md5").update(source).digest("hex").slice(0, 8);
}

function canonicalLoaderTag(version = analyticsVersion()) {
  return `<script src="${PUBLIC_SRC}?v=${version}" defer></script>`;
}

function loaderMatches(html) {
  return Array.from(html.matchAll(new RegExp(LOADER_PATTERN.source, LOADER_PATTERN.flags)));
}

function loaderSource(tag) {
  const match = tag.match(/\bsrc=(["'])([^"']+)\1/i);
  return match ? match[2] : "";
}

function insertBeforeClosingBody(html, tag) {
  const matches = Array.from(html.matchAll(/<\/body\s*>/gi));
  if (!matches.length) return null;

  const closingBody = matches[matches.length - 1];
  const bodyIndex = closingBody.index;
  const lineStart = html.lastIndexOf("\n", bodyIndex - 1) + 1;
  const beforeBodyOnLine = html.slice(lineStart, bodyIndex);

  if (/^[ \t]*$/.test(beforeBodyOnLine)) {
    return html.slice(0, lineStart)
      + beforeBodyOnLine + tag + "\n"
      + html.slice(lineStart);
  }

  return html.slice(0, bodyIndex) + "\n" + tag + "\n" + html.slice(bodyIndex);
}

function normalizeLoaderInHtml(html, tag) {
  const matches = loaderMatches(html);
  if (matches.length > 1) {
    return { html, duplicate: true, injected: false, normalized: false };
  }
  if (matches.length === 1) {
    const match = matches[0];
    if (loaderSource(match[0]) === loaderSource(tag)) {
      return { html, duplicate: false, injected: false, normalized: false };
    }
    return {
      html: html.slice(0, match.index) + tag + html.slice(match.index + match[0].length),
      duplicate: false,
      injected: false,
      normalized: true,
    };
  }

  const injectedHtml = insertBeforeClosingBody(html, tag);
  return {
    html: injectedHtml === null ? html : injectedHtml,
    duplicate: false,
    injected: injectedHtml !== null,
    normalized: false,
  };
}

function scanCoverage(root = ROOT, version = analyticsVersion(path.join(root, "assets", "js", "lazy-analytics.js"))) {
  const tag = canonicalLoaderTag(version);
  const report = {
    scanned: 0,
    eligible: 0,
    covered: 0,
    missing: [],
    nonCanonical: [],
    duplicates: [],
    malformed: [],
  };

  for (const file of walkHtml(root)) {
    report.scanned += 1;
    const relative = normalizeRelative(file, root);
    const html = fs.readFileSync(file, "utf8");
    if (!/<html(?:\s|>)/i.test(html)) continue;
    if (!/<\/body\s*>/i.test(html)) {
      report.malformed.push(relative);
      continue;
    }

    report.eligible += 1;
    const matches = loaderMatches(html);
    if (!matches.length) {
      report.missing.push(relative);
    } else if (matches.length > 1) {
      report.duplicates.push(relative);
    } else {
      report.covered += 1;
      if (loaderSource(matches[0][0]) !== loaderSource(tag)) report.nonCanonical.push(relative);
    }
  }

  return report;
}

function applyCoverage(root = ROOT) {
  const sourcePath = path.join(root, "assets", "js", "lazy-analytics.js");
  const version = analyticsVersion(sourcePath);
  const tag = canonicalLoaderTag(version);
  const before = scanCoverage(root, version);

  if (before.duplicates.length) {
    throw new Error(`Refusing to rewrite ${before.duplicates.length} page(s) with duplicate analytics loaders.`);
  }

  let injected = 0;
  let normalized = 0;
  for (const file of walkHtml(root)) {
    const html = fs.readFileSync(file, "utf8");
    if (!/<html(?:\s|>)/i.test(html) || !/<\/body\s*>/i.test(html)) continue;

    const result = normalizeLoaderInHtml(html, tag);
    if (result.html === html) continue;
    writeFileSyncWithRetry(file, result.html, "utf8");
    if (result.injected) injected += 1;
    if (result.normalized) normalized += 1;
  }

  const after = scanCoverage(root, version);
  return { before, after, injected, normalized, version };
}

function printReport(report, label) {
  console.log(
    `[analytics] ${label}: ${report.covered}/${report.eligible} eligible page(s) covered; `
    + `${report.missing.length} missing, ${report.nonCanonical.length} stale, `
    + `${report.duplicates.length} duplicate, ${report.malformed.length} malformed.`
  );
}

function printPaths(label, paths) {
  if (!paths.length) return;
  console.error(`[analytics] ${label} (${paths.length}):`);
  for (const file of paths.slice(0, 50)) console.error(`  - ${file}`);
  if (paths.length > 50) console.error(`  ... ${paths.length - 50} more`);
}

function main() {
  const write = process.argv.includes("--write");
  const check = process.argv.includes("--check") || !write;

  if (write) {
    const result = applyCoverage(ROOT);
    console.log(
      `[analytics] Wrote loader v=${result.version}: ${result.injected} injected, `
      + `${result.normalized} normalized.`
    );
    printReport(result.after, "post-write");
    printPaths("malformed documents skipped", result.after.malformed);
    if (
      result.after.missing.length
      || result.after.nonCanonical.length
      || result.after.duplicates.length
    ) {
      process.exitCode = 1;
    }
    return;
  }

  const report = scanCoverage(ROOT);
  printReport(report, "check");
  printPaths("missing loader", report.missing);
  printPaths("stale loader", report.nonCanonical);
  printPaths("duplicate loader", report.duplicates);
  printPaths("malformed documents skipped", report.malformed);
  if (
    check
    && (report.missing.length || report.nonCanonical.length || report.duplicates.length)
  ) {
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  ROOT,
  analyticsVersion,
  applyCoverage,
  canonicalLoaderTag,
  insertBeforeClosingBody,
  loaderMatches,
  loaderSource,
  normalizeLoaderInHtml,
  scanCoverage,
  shouldSkipRelativePath,
  walkHtml,
};
