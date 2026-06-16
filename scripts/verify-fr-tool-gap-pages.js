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

function main() {
  const registry = loadRegistry();
  const frRegistryRows = registry.filter((tool) => tool.lang === "fr");
  const frHrefs = new Set(frRegistryRows.map((tool) => String(tool.href || "").replace(/\/$/, "")));
  const sourceIdsByHref = new Map(
    frRegistryRows.map((tool) => [String(tool.href || "").replace(/\/$/, ""), tool.sourceId || null])
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

    if (!frHrefs.has(frRoute)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchRegistryHref", href: frRoute });
    } else if (sourceIdsByHref.get(frRoute) !== page.enSlug) {
      issues.push({
        slug: page.frSlug,
        type: "registrySourceMismatch",
        expected: page.enSlug,
        actual: sourceIdsByHref.get(frRoute),
      });
    }

    const enHtml = read(enPath);
    const frHtml = read(frPath);

    if (!enHtml.includes(frUrl)) {
      issues.push({ slug: page.frSlug, type: "missingEnglishHreflang", expected: frUrl });
    }
    if (!frHtml.includes(enUrl)) {
      issues.push({ slug: page.frSlug, type: "missingFrenchHreflang", expected: enUrl });
    }
    if (!frHtml.includes('lang="fr"')) {
      issues.push({ slug: page.frSlug, type: "missingFrenchLang" });
    }
    if (!frHtml.includes("BreadcrumbList")) {
      issues.push({ slug: page.frSlug, type: "missingBreadcrumbSchema" });
    }
    if (!frHtml.includes("FAQPage")) {
      issues.push({ slug: page.frSlug, type: "missingFaqSchema" });
    }
    if (!frHtml.includes('property="og:locale" content="fr_FR"')) {
      issues.push({ slug: page.frSlug, type: "missingFrenchOgLocale" });
    }
    if (!frHtml.includes('name="robots" content="index, follow"')) {
      issues.push({ slug: page.frSlug, type: "missingRobotsIndexFollow" });
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
