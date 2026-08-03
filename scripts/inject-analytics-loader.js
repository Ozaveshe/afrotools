#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const ANALYTICS_SOURCE = path.join(ROOT, "assets", "js", "lazy-analytics.js");
const BOOTSTRAP_SOURCE = path.join(ROOT, "assets", "js", "analytics-bootstrap.js");
const PUBLIC_SRC = "/assets/js/lazy-analytics.js";
const BOOTSTRAP_PUBLIC_SRC = "/assets/js/analytics-bootstrap.js";
const ACTIVE_LOCALIZATION_PREFIXES = new Set(["ha", "sw", "yo"]);

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

const LOADER_PATTERN = /<script\b[^>]*\ssrc=(["'])\/assets\/js\/lazy-analytics\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>/gi;
const BOOTSTRAP_PATTERN = /<script\b[^>]*\ssrc=(["'])\/assets\/js\/analytics-bootstrap\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>/gi;

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

function bootstrapVersion(sourcePath = BOOTSTRAP_SOURCE) {
  const source = fs.readFileSync(sourcePath);
  return crypto.createHash("md5").update(source).digest("hex").slice(0, 8);
}

function canonicalLoaderTag(version = analyticsVersion()) {
  return `<script src="${PUBLIC_SRC}?v=${version}" defer></script>`;
}

function earlyBootstrapTag(
  version = bootstrapVersion(),
  loaderVersion = analyticsVersion(),
) {
  return `<script src="${BOOTSTRAP_PUBLIC_SRC}?v=${version}" data-loader-version="${loaderVersion}" async></script>`;
}

function shouldUseEarlyBootstrap(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/").replace(/^\.\/+/, "");
  const topLevel = normalized.split("/").filter(Boolean)[0] || "";
  return !ACTIVE_LOCALIZATION_PREFIXES.has(topLevel);
}

function bootstrapMatches(html) {
  return Array.from(html.matchAll(new RegExp(BOOTSTRAP_PATTERN.source, BOOTSTRAP_PATTERN.flags)));
}

function loaderMatches(html) {
  return Array.from(html.matchAll(new RegExp(LOADER_PATTERN.source, LOADER_PATTERN.flags)));
}

function loaderSource(tag) {
  const match = tag.match(/\bsrc=(["'])([^"']+)\1/i);
  return match ? match[2] : "";
}

function loaderIsInHead(html, match) {
  const openingHead = /<head\b[^>]*>/i.exec(html);
  const closingHead = /<\/head\s*>/i.exec(html);
  if (!openingHead || !closingHead) return false;
  const headStart = openingHead.index + openingHead[0].length;
  return match.index >= headStart && match.index < closingHead.index;
}

function loaderIsCanonical(html, match, tag, placement) {
  if (loaderSource(match[0]) !== loaderSource(tag)) return false;
  if (placement !== "head") return true;
  return loaderIsInHead(html, match)
    && /\sasync(?:\s|=|>)/i.test(match[0])
    && !/\sdefer(?:\s|=|>)/i.test(match[0]);
}

function insertAfterOpeningHead(html, tag) {
  const openingHead = /<head\b[^>]*>/i.exec(html);
  if (!openingHead) return null;
  const insertAt = openingHead.index + openingHead[0].length;
  const rest = html.slice(insertAt);
  const existingLineBreak = /^(\r?\n)/.exec(rest);
  return html.slice(0, insertAt)
    + (existingLineBreak ? existingLineBreak[1] : "")
    + tag
    + (existingLineBreak ? "" : "\n")
    + rest;
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

function removeLoaderMatch(html, match) {
  const lineStart = html.lastIndexOf("\n", match.index - 1) + 1;
  const lineEndMatch = /\r?\n/.exec(html.slice(match.index + match[0].length));
  const lineEnd = lineEndMatch
    ? match.index + match[0].length + lineEndMatch.index + lineEndMatch[0].length
    : html.length;
  const beforeOnLine = html.slice(lineStart, match.index);
  const afterOnLine = html.slice(match.index + match[0].length, lineEnd);
  if (/^[ \t]*$/.test(beforeOnLine) && /^[ \t]*(?:\r?\n)?$/.test(afterOnLine)) {
    return html.slice(0, lineStart) + html.slice(lineEnd);
  }
  return html.slice(0, match.index) + html.slice(match.index + match[0].length);
}

function normalizeLoaderInHtml(html, tag, options = {}) {
  const placement = options.placement === "head" ? "head" : "body";
  const matches = loaderMatches(html);
  if (matches.length > 1) {
    return { html, duplicate: true, injected: false, normalized: false };
  }
  if (matches.length === 1) {
    const match = matches[0];
    if (loaderIsCanonical(html, match, tag, placement)) {
      return { html, duplicate: false, injected: false, normalized: false };
    }
    const withoutLoader = removeLoaderMatch(html, match);
    const movedHtml = placement === "head"
      ? insertAfterOpeningHead(withoutLoader, tag)
      : insertBeforeClosingBody(withoutLoader, tag);
    return {
      html: movedHtml === null ? html : movedHtml,
      duplicate: false,
      injected: false,
      normalized: movedHtml !== null,
    };
  }

  const injectedHtml = placement === "head"
    ? insertAfterOpeningHead(html, tag)
    : insertBeforeClosingBody(html, tag);
  return {
    html: injectedHtml === null ? html : injectedHtml,
    duplicate: false,
    injected: injectedHtml !== null,
    normalized: false,
  };
}

function normalizeBootstrapInHtml(html, tag, required) {
  const matches = bootstrapMatches(html);
  if (!required) {
    if (!matches.length) return { html, duplicate: false, injected: false, normalized: false };
    let output = html;
    for (const match of matches.slice().reverse()) output = removeLoaderMatch(output, match);
    return { html: output, duplicate: matches.length > 1, injected: false, normalized: true };
  }
  if (matches.length > 1) return { html, duplicate: true, injected: false, normalized: false };
  if (matches.length === 1 && loaderIsCanonical(html, matches[0], tag, "head")) {
    return { html, duplicate: false, injected: false, normalized: false };
  }
  const withoutBootstrap = matches.length ? removeLoaderMatch(html, matches[0]) : html;
  const output = insertAfterOpeningHead(withoutBootstrap, tag);
  return {
    html: output === null ? html : output,
    duplicate: false,
    injected: !matches.length && output !== null,
    normalized: Boolean(matches.length && output !== null),
  };
}

function scanCoverage(
  root = ROOT,
  version = analyticsVersion(path.join(root, "assets", "js", "lazy-analytics.js")),
  earlyVersion = bootstrapVersion(path.join(root, "assets", "js", "analytics-bootstrap.js")),
) {
  const loaderTag = canonicalLoaderTag(version);
  const bootstrapTag = earlyBootstrapTag(earlyVersion, version);
  const report = {
    scanned: 0,
    eligible: 0,
    covered: 0,
    missing: [],
    nonCanonical: [],
    duplicates: [],
    missingBootstrap: [],
    nonCanonicalBootstrap: [],
    duplicateBootstrap: [],
    malformed: [],
  };

  for (const file of walkHtml(root)) {
    report.scanned += 1;
    const relative = normalizeRelative(file, root);
    const early = shouldUseEarlyBootstrap(relative);
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
      if (loaderSource(matches[0][0]) !== loaderSource(loaderTag)) {
        report.nonCanonical.push(relative);
      }
    }
    const bootstraps = bootstrapMatches(html);
    if (early && !bootstraps.length) report.missingBootstrap.push(relative);
    else if (bootstraps.length > 1) report.duplicateBootstrap.push(relative);
    else if (early && !loaderIsCanonical(html, bootstraps[0], bootstrapTag, "head")) {
      report.nonCanonicalBootstrap.push(relative);
    } else if (!early && bootstraps.length) {
      report.nonCanonicalBootstrap.push(relative);
    }
  }

  return report;
}

function applyCoverage(root = ROOT) {
  const sourcePath = path.join(root, "assets", "js", "lazy-analytics.js");
  const version = analyticsVersion(sourcePath);
  const earlyVersion = bootstrapVersion(path.join(root, "assets", "js", "analytics-bootstrap.js"));
  const loaderTag = canonicalLoaderTag(version);
  const bootstrapTag = earlyBootstrapTag(earlyVersion, version);
  const before = scanCoverage(root, version, earlyVersion);

  if (before.duplicates.length) {
    throw new Error(`Refusing to rewrite ${before.duplicates.length} page(s) with duplicate analytics loaders.`);
  }

  let injected = 0;
  let normalized = 0;
  for (const file of walkHtml(root)) {
    const relative = normalizeRelative(file, root);
    const html = fs.readFileSync(file, "utf8");
    if (!/<html(?:\s|>)/i.test(html) || !/<\/body\s*>/i.test(html)) continue;

    const loaderResult = normalizeLoaderInHtml(html, loaderTag);
    const bootstrapResult = normalizeBootstrapInHtml(
      loaderResult.html,
      bootstrapTag,
      shouldUseEarlyBootstrap(relative),
    );
    if (bootstrapResult.html === html) continue;
    writeFileSyncWithRetry(file, bootstrapResult.html, "utf8");
    if (loaderResult.injected || bootstrapResult.injected) injected += 1;
    if (loaderResult.normalized || bootstrapResult.normalized) normalized += 1;
  }

  const after = scanCoverage(root, version, earlyVersion);
  return { before, after, injected, normalized, version };
}

function printReport(report, label) {
  console.log(
    `[analytics] ${label}: ${report.covered}/${report.eligible} eligible page(s) covered; `
      + `${report.missing.length} missing, ${report.nonCanonical.length} stale, `
      + `${report.duplicates.length} duplicate, ${report.missingBootstrap.length} missing early bootstrap, `
      + `${report.nonCanonicalBootstrap.length} stale early bootstrap, `
      + `${report.duplicateBootstrap.length} duplicate early bootstrap, ${report.malformed.length} malformed.`
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
      || result.after.missingBootstrap.length
      || result.after.nonCanonicalBootstrap.length
      || result.after.duplicateBootstrap.length
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
  printPaths("missing early bootstrap", report.missingBootstrap);
  printPaths("stale early bootstrap", report.nonCanonicalBootstrap);
  printPaths("duplicate early bootstrap", report.duplicateBootstrap);
  printPaths("malformed documents skipped", report.malformed);
  if (
    check
    && (report.missing.length || report.nonCanonical.length || report.duplicates.length
      || report.missingBootstrap.length || report.nonCanonicalBootstrap.length
      || report.duplicateBootstrap.length)
  ) {
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  ROOT,
  analyticsVersion,
  bootstrapVersion,
  applyCoverage,
  canonicalLoaderTag,
  earlyBootstrapTag,
  insertBeforeClosingBody,
  insertAfterOpeningHead,
  loaderMatches,
  loaderSource,
  normalizeLoaderInHtml,
  normalizeBootstrapInHtml,
  scanCoverage,
  shouldSkipRelativePath,
  shouldUseEarlyBootstrap,
  walkHtml,
};
