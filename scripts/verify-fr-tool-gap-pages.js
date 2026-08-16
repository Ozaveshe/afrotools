"use strict";

const fs = require("fs");
const path = require("path");

const { PAGES } = require("./generate-fr-tool-gap-pages.js");
const { FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL } = require("./lib/french-tool-route-map.js");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function loadRegistry() {
  const content = read("assets/js/components/tool-registry.js");
  return new Function(`${content}; return AFRO_TOOLS;`)();
}

function metaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const keyPattern = new RegExp(`\\b${key}=["']${value}["']`, "i");
  const contentPattern = /\bcontent=["']([^"']*)["']/i;
  const tag = tags.find((candidate) => keyPattern.test(candidate));
  const match = tag && tag.match(contentPattern);
  return match ? match[1] : null;
}

function linkHref(html, rel, hreflang) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const relPattern = new RegExp(`\\brel=["']${rel}["']`, "i");
  const languagePattern = hreflang
    ? new RegExp(`\\bhreflang=["']${hreflang}["']`, "i")
    : null;
  const hrefPattern = /\bhref=["']([^"']*)["']/i;
  const tag = tags.find((candidate) => relPattern.test(candidate) && (!languagePattern || languagePattern.test(candidate)));
  const match = tag && tag.match(hrefPattern);
  return match ? match[1] : null;
}

function isExplicitlyNoindex(html) {
  return /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(metaContent(html, "name", "robots") || "");
}

function hasValidJsonLd(html) {
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  if (!scripts.length) return false;
  return scripts.every((match) => {
    try {
      JSON.parse(match[1]);
      return true;
    } catch (_error) {
      return false;
    }
  });
}

function registryOwnsPage(row, page) {
  if (!row) return false;
  if (row.sourceId === page.enSlug) return true;
  if (row.sourceId && page.enSlug.startsWith(`${row.sourceId}/`)) return true;
  const generatedSuffix = `-fr-coverage-${page.enSlug.replace(/\//g, "-")}`;
  return String(row.id || "").endsWith(generatedSuffix);
}

function main() {
  const registry = loadRegistry();
  const frRegistryRows = registry.filter((tool) => tool.lang === "fr");
  const rowsByHref = new Map(
    frRegistryRows.map((tool) => [String(tool.href || "").replace(/\/$/, ""), tool])
  );
  const sitemapFr = exists("sitemap-fr.xml") ? read("sitemap-fr.xml") : "";

  const issues = [];
  const seenFrSlugs = new Set();
  const seenEnSlugs = new Set();

  for (const page of PAGES) {
    const frRoute = `/fr/tools/${page.frSlug}`;
    const frUrl = `${SITE}${frRoute}/`;
    const enUrl = `${SITE}/tools/${page.enSlug}/`;
    const enPath = `tools/${page.enSlug}/index.html`;
    const frPath = `fr/tools/${page.frSlug}/index.html`;

    if (seenFrSlugs.has(page.frSlug)) {
      issues.push({ slug: page.frSlug, type: "duplicateFrenchSlug" });
    }
    seenFrSlugs.add(page.frSlug);

    if (seenEnSlugs.has(page.enSlug)) {
      issues.push({ slug: page.frSlug, type: "duplicateEnglishSlug", enSlug: page.enSlug });
    }
    seenEnSlugs.add(page.enSlug);

    if (!exists(enPath)) {
      issues.push({ slug: page.frSlug, type: "missingEnglishSource", path: enPath });
      continue;
    }
    if (!exists(frPath)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchPage", path: frPath });
      continue;
    }

    if (FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL[page.frSlug] !== page.enSlug) {
      issues.push({
        slug: page.frSlug,
        type: "routeMapMismatch",
        expected: page.enSlug,
        actual: FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL[page.frSlug],
      });
    }

    const registryRow = rowsByHref.get(frRoute);
    if (!registryRow) {
      issues.push({ slug: page.frSlug, type: "missingFrenchRegistryHref", href: frRoute });
    } else if (!registryOwnsPage(registryRow, page)) {
      issues.push({
        slug: page.frSlug,
        type: "registrySourceMismatch",
        expected: page.enSlug,
        actual: registryRow.sourceId || registryRow.id,
      });
    }

    const enHtml = read(enPath);
    const frHtml = read(frPath);

    if (!isExplicitlyNoindex(enHtml) && linkHref(enHtml, "alternate", "fr") !== frUrl) {
      issues.push({ slug: page.frSlug, type: "missingEnglishHreflang", expected: frUrl });
    }
    if (linkHref(frHtml, "alternate", "en") !== enUrl && !frHtml.includes(enUrl)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchHreflang", expected: enUrl });
    }
    if (!/<html\b[^>]*\blang=["']fr(?:-[A-Za-z0-9-]+)?["']/i.test(frHtml)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchLang" });
    }
    if (linkHref(frHtml, "canonical") !== frUrl) {
      issues.push({ slug: page.frSlug, type: "invalidFrenchCanonical", expected: frUrl });
    }
    if (isExplicitlyNoindex(frHtml)) {
      issues.push({ slug: page.frSlug, type: "frenchPageNoindex" });
    }
    if (!hasValidJsonLd(frHtml)) {
      issues.push({ slug: page.frSlug, type: "missingOrInvalidJsonLd" });
    }
    if (sitemapFr && !sitemapFr.includes(frUrl)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchSitemapUrl", expected: frUrl });
    }
  }

  const summary = {
    generatedFrenchToolGapPages: PAGES.length,
    checkedRegistryRows: frRegistryRows.length,
    issues,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (issues.length) {
    process.exitCode = 1;
  }
}

main();
