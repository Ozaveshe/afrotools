"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const TARGETS = [
  path.join(ROOT, "tools", "afrokitchen", "index.html"),
  path.join(ROOT, "tools", "afrokitchen", "recipes"),
  path.join(ROOT, "tools", "afrokitchen", "countries"),
  path.join(ROOT, "tools", "afrokitchen", "collections")
];
const MOJIBAKE_PATTERNS = [
  "â€”",
  "â€“",
  "â€˜",
  "â€™",
  "â€œ",
  "â€\u009d",
  "Ã¢",
  "Ã©",
  "Ã¨",
  "Ã±",
  "Ã£",
  "Ã­",
  "Ã³",
  "Ãº",
  "Ã‡",
  "Ã§",
  "Ã ",
  "Â "
];

function walk(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".html") ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(target, entry.name);
    return entry.isDirectory() ? walk(full) : walk(full);
  });
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(head, selector, attrName) {
  const pattern = new RegExp(`<meta\\s+${selector}\\s+content=["']([^"']*)["'][^>]*>`, "i");
  const match = head.match(pattern);
  return match ? decodeHtml(match[1].trim()) : "";
}

function extractHead(html) {
  return html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
}

function readMetadata(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const head = extractHead(html);
  const title = decodeHtml(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "");
  const canonical = head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() || "";
  const robots = attr(head, "name=[\"']robots[\"']", "content") || "index, follow";
  const description = attr(head, "name=[\"']description[\"']", "content");
  const ogTitle = attr(head, "property=[\"']og:title[\"']", "content");
  const ogDescription = attr(head, "property=[\"']og:description[\"']", "content");
  const ogImage = attr(head, "property=[\"']og:image[\"']", "content");
  const ogType = attr(head, "property=[\"']og:type[\"']", "content");
  const twitterCard = attr(head, "name=[\"']twitter:card[\"']", "content");
  const twitterTitle = attr(head, "name=[\"']twitter:title[\"']", "content");
  const twitterDescription = attr(head, "name=[\"']twitter:description[\"']", "content");
  const twitterImage = attr(head, "name=[\"']twitter:image[\"']", "content");
  const type = rel(filePath).includes("/recipes/")
    ? "recipe"
    : rel(filePath).includes("/countries/")
      ? "country"
      : rel(filePath).includes("/collections/")
        ? "collection"
        : "main";

  return {
    file: rel(filePath),
    type,
    title,
    description,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    head
  };
}

function expectedCanonical(page) {
  const routePath = page.file.replace(/index\.html$/, "").replace(/^/, "/");
  return `${SITE_ORIGIN}${routePath}`;
}

function hasMojibake(page) {
  const haystack = [
    page.title,
    page.description,
    page.ogTitle,
    page.ogDescription,
    page.twitterTitle,
    page.twitterDescription
  ].join("\n");
  return MOJIBAKE_PATTERNS.some((pattern) => haystack.includes(pattern));
}

function pushIssue(bucket, page, detail) {
  bucket.push(`${page.file}${detail ? ` — ${detail}` : ""}`);
}

function printBucket(label, rows) {
  console.log(`\n${label}: ${rows.length}`);
  rows.slice(0, 40).forEach((row) => console.log(`  - ${row}`));
  if (rows.length > 40) console.log(`  ...${rows.length - 40} more`);
}

function validateTemplate(page, buckets) {
  if (page.type === "recipe") {
    if (!/.+ Recipe \| .+ \| AfroKitchen$/.test(page.title)) {
      pushIssue(buckets.templateMismatches, page, `title="${page.title}"`);
    }
    if (/Recipe\s*\|\s*Recipe/i.test(page.title)) {
      pushIssue(buckets.genericTitles, page, page.title);
    }
  }

  if (page.type === "country" && !/.+ Recipes \| Traditional Dishes & Food Guide \| AfroKitchen$/.test(page.title)) {
    pushIssue(buckets.templateMismatches, page, `title="${page.title}"`);
  }

  if (page.type === "collection" && !/.+ \| African Recipe Collection \| AfroKitchen$/.test(page.title)) {
    pushIssue(buckets.templateMismatches, page, `title="${page.title}"`);
  }
}

function main() {
  const pages = TARGETS.flatMap(walk).map(readMetadata).sort((left, right) => left.file.localeCompare(right.file));
  const indexable = pages.filter((page) => !/noindex/i.test(page.robots));
  const titleMap = new Map();
  const buckets = {
    duplicateTitles: [],
    missingDescriptions: [],
    longDescriptions: [],
    missingOgImages: [],
    missingCanonicals: [],
    canonicalMismatches: [],
    trailingSlashIssues: [],
    missingOpenGraph: [],
    missingTwitter: [],
    noindexPages: [],
    templateMismatches: [],
    genericTitles: [],
    mojibake: []
  };

  indexable.forEach((page) => {
    const titleKey = page.title.toLowerCase();
    if (!titleMap.has(titleKey)) titleMap.set(titleKey, []);
    titleMap.get(titleKey).push(page.file);

    if (!page.description) pushIssue(buckets.missingDescriptions, page);
    if (page.description && page.description.length > 160) {
      pushIssue(buckets.longDescriptions, page, `${page.description.length} chars`);
    }
    if (!page.ogImage || !/^https?:\/\//i.test(page.ogImage)) pushIssue(buckets.missingOgImages, page);
    if (!page.canonical) {
      pushIssue(buckets.missingCanonicals, page);
    } else {
      if (page.canonical !== expectedCanonical(page)) {
        pushIssue(buckets.canonicalMismatches, page, `expected ${expectedCanonical(page)}, got ${page.canonical}`);
      }
      if (!page.canonical.endsWith("/")) pushIssue(buckets.trailingSlashIssues, page, page.canonical);
    }
    if (!page.ogTitle || !page.ogDescription || !page.ogType) {
      pushIssue(buckets.missingOpenGraph, page);
    }
    if (!page.twitterCard || !page.twitterTitle || !page.twitterDescription || !page.twitterImage) {
      pushIssue(buckets.missingTwitter, page);
    }
    if (hasMojibake(page)) pushIssue(buckets.mojibake, page);
    validateTemplate(page, buckets);
  });

  titleMap.forEach((files, title) => {
    if (files.length > 1) {
      buckets.duplicateTitles.push(`${title} :: ${files.join(", ")}`);
    }
  });

  pages
    .filter((page) => /noindex/i.test(page.robots))
    .forEach((page) => pushIssue(buckets.noindexPages, page, page.robots));

  console.log("AfroKitchen metadata audit");
  console.log(`  Pages scanned: ${pages.length}`);
  console.log(`  Indexable pages: ${indexable.length}`);
  console.log(`  Noindex pages: ${buckets.noindexPages.length}`);

  printBucket("Duplicate titles", buckets.duplicateTitles);
  printBucket("Missing descriptions", buckets.missingDescriptions);
  printBucket("Descriptions over 160 chars", buckets.longDescriptions);
  printBucket("Missing OG images", buckets.missingOgImages);
  printBucket("Missing canonicals", buckets.missingCanonicals);
  printBucket("Canonical mismatches", buckets.canonicalMismatches);
  printBucket("Trailing slash issues", buckets.trailingSlashIssues);
  printBucket("Missing Open Graph fields", buckets.missingOpenGraph);
  printBucket("Missing Twitter card fields", buckets.missingTwitter);
  printBucket("Template mismatches", buckets.templateMismatches);
  printBucket("Generic recipe titles", buckets.genericTitles);
  printBucket("Encoding/mojibake in metadata", buckets.mojibake);
  printBucket("Pages marked noindex", buckets.noindexPages);

  const failureCount =
    buckets.duplicateTitles.length +
    buckets.missingDescriptions.length +
    buckets.longDescriptions.length +
    buckets.missingOgImages.length +
    buckets.missingCanonicals.length +
    buckets.canonicalMismatches.length +
    buckets.trailingSlashIssues.length +
    buckets.missingOpenGraph.length +
    buckets.missingTwitter.length +
    buckets.templateMismatches.length +
    buckets.genericTitles.length +
    buckets.mojibake.length;

  if (failureCount) process.exitCode = 1;
}

main();
