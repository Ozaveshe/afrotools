"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE_ORIGIN = "https://afrotools.com";
const IGNORE_DIRS = new Set([
  ".agents",
  ".claude",
  ".git",
  ".github",
  ".netlify",
  "admin",
  "afrotools-sentinel",
  "artifacts",
  "dist",
  "docs",
  "netlify",
  "node_modules",
  "playwright-report",
  "prompts",
  "reports",
  "scripts",
  "supabase",
  "test-results",
  "tests",
]);

const INTERNAL_HTML_FILES = new Set([
  "afrotools-mission-control.html",
  "fr/widgets/iframe/template.html",
  "mc-7a2f9x.html",
  "tools/afrostream/admin.html",
  "widgets/iframe/template.html",
]);

function walkHtmlFiles(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walkHtmlFiles(fullPath, out);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(fullPath);
    }
  }

  return out;
}

function readHtml(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function relativeHtmlPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function fileToPublicRoute(filePath) {
  const rel = relativeHtmlPath(filePath);

  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) {
    return `/${rel.slice(0, -"index.html".length)}`;
  }
  if (rel.endsWith(".html")) {
    return `/${rel.slice(0, -".html".length)}`;
  }

  return `/${rel}`;
}

function fileToSourceHtmlRoute(filePath) {
  const rel = relativeHtmlPath(filePath);

  if (rel === "index.html" || rel.endsWith("/index.html")) return "";
  if (!rel.endsWith(".html")) return "";

  return `/${rel}`;
}

function extractCanonicalHref(html) {
  const match =
    html.match(
      /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i
    ) ||
    html.match(
      /<link\b(?=[^>]*\bhref=["']([^"']+)["'])(?=[^>]*\brel=["']canonical["'])[^>]*>/i
    );

  return match ? match[1] : "";
}

function extractCanonicalPath(html) {
  const href = extractCanonicalHref(html);
  if (!href) return "";

  try {
    const canonical = new URL(href, SITE_ORIGIN);
    if (canonical.origin !== SITE_ORIGIN) return "";
    return canonical.pathname;
  } catch {
    return "";
  }
}

function isRedirectLike(html) {
  const headEnd = html.search(/<\/head>/i);
  const snippet = headEnd === -1 ? html.slice(0, 2500) : html.slice(0, headEnd + 7);

  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /window\.location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /window\.location(?:\.href)?\s*=\s*['"][^'"]+['"]/i.test(snippet) ||
    /location\.href\s*=\s*['"][^'"]+['"]/i.test(snippet)
  );
}

function preferredRouteForFile(filePath) {
  const html = readHtml(filePath);
  const servedRoute = fileToPublicRoute(filePath);
  const canonicalRoute = extractCanonicalPath(html);

  if (isRedirectLike(html) && canonicalRoute && canonicalRoute !== servedRoute) {
    return canonicalRoute;
  }

  return servedRoute;
}

function buildCanonicalAliasMap() {
  const aliases = [];

  for (const filePath of walkHtmlFiles(ROOT)) {
    if (INTERNAL_HTML_FILES.has(relativeHtmlPath(filePath))) continue;

    const source = fileToSourceHtmlRoute(filePath);
    if (!source) continue;

    const html = readHtml(filePath);
    const redirectLike = isRedirectLike(html);
    const servedTarget = fileToPublicRoute(filePath);
    const canonicalTarget = extractCanonicalPath(html);
    const target =
      redirectLike && canonicalTarget && canonicalTarget !== servedTarget
        ? canonicalTarget
        : servedTarget;

    if (!target || target === source) continue;

    aliases.push({
      filePath,
      relPath: relativeHtmlPath(filePath),
      source,
      target,
      redirectLike,
      simple: target === servedTarget,
    });
  }

  return aliases.sort((a, b) => a.source.localeCompare(b.source));
}

module.exports = {
  ROOT,
  SITE_ORIGIN,
  buildCanonicalAliasMap,
  extractCanonicalHref,
  extractCanonicalPath,
  fileToPublicRoute,
  fileToSourceHtmlRoute,
  isRedirectLike,
  preferredRouteForFile,
  readHtml,
  relativeHtmlPath,
  walkHtmlFiles,
};
