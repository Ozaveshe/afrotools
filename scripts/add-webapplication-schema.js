#!/usr/bin/env node
"use strict";

/**
 * Keep structured data complete and idempotent on nested English tool indexes.
 *
 * The script deliberately does not traverse fr/, sw/, ha/, or yo/. Those
 * surfaces inherit schema through their locale generators.
 *
 * Usage:
 *   node scripts/add-webapplication-schema.js
 *   node scripts/add-webapplication-schema.js --fix
 *   node scripts/add-webapplication-schema.js --fix --files=tools/a/index.html,tools/b/index.html
 */

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
  unlinkSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const FIX = process.argv.includes("--fix");
const FILES_ARG = process.argv.find((arg) => arg.startsWith("--files="));
const GENERATED_MARKER = "tool-structured-data:auto";
const REMOVE = Symbol("remove");
const JSON_LD_RE = /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;

function normalizeRel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function walkToolIndexes(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walkToolIndexes(file, output);
    else if (entry.name === "index.html" && normalizeRel(file) !== "tools/index.html") output.push(file);
  }
  return output;
}

function selectedFiles(allFiles) {
  if (!FILES_ARG) return allFiles;
  const requested = new Set(
    FILES_ARG.slice("--files=".length)
      .split(",")
      .map((value) => value.trim().replace(/\\/g, "/").replace(/^\.\//, ""))
      .filter(Boolean)
  );
  const selected = allFiles.filter((file) => requested.has(normalizeRel(file)));
  if (selected.length !== requested.size) {
    const found = new Set(selected.map(normalizeRel));
    const missing = [...requested].filter((file) => !found.has(file));
    throw new Error(`Unknown English tool page(s): ${missing.join(", ")}`);
  }
  return selected;
}

function atomicWrite(file, value) {
  const temp = `${file}.tmp-${process.pid}`;
  unlinkSyncWithRetry(temp);
  writeFileSyncWithRetry(temp, value.replace(/\r\n/g, "\n"), "utf8");
  if (fs.existsSync(file)) unlinkSyncWithRetry(file);
  renameSyncWithRetry(temp, file);
}

function decodeEntities(value) {
  const named = {
    amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">",
    mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  };
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function plainText(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

function visibleHtml(html) {
  return html
    .replace(JSON_LD_RE, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[\s\S]*?<\/template>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ");
}

function parseJsonLd(html) {
  const blocks = [];
  for (const match of html.matchAll(JSON_LD_RE)) {
    const text = match[2].trim();
    try {
      blocks.push({ match: match[0], attrs: match[1], text, value: JSON.parse(text), error: null });
    } catch (error) {
      blocks.push({ match: match[0], attrs: match[1], text, value: null, error: error.message });
    }
  }
  return blocks;
}

function ownTypes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return [value["@type"]].flat().filter(Boolean).map(String);
}

function collectTypes(value, output = new Set()) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectTypes(item, output));
    return output;
  }
  ownTypes(value).forEach((type) => output.add(type));
  Object.values(value).forEach((item) => collectTypes(item, output));
  return output;
}

function hasType(blocks, type) {
  return blocks.some((block) => block.value && collectTypes(block.value).has(type));
}

function sanitizeOrphanSteps(value, ancestors, stats) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => sanitizeOrphanSteps(item, ancestors, stats))
      .filter((item) => item !== REMOVE);
    return items;
  }

  const types = ownTypes(value);
  if (types.includes("HowToStep") && !ancestors.some((type) => type === "HowTo" || type === "Recipe")) {
    stats.orphanStepsRemoved += 1;
    return REMOVE;
  }

  const nextAncestors = [...ancestors, ...types];
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    const cleaned = sanitizeOrphanSteps(item, nextAncestors, stats);
    if (cleaned !== REMOVE) output[key] = cleaned;
  }
  return output;
}

function normalizeJsonLd(html, stats) {
  const seen = new Set();
  return html.replace(JSON_LD_RE, (match, attrs, jsonText) => {
    const trimmed = jsonText.trim();
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      stats.invalidJsonLd += 1;
      return match;
    }

    const before = JSON.stringify(parsed);
    const cleaned = sanitizeOrphanSteps(parsed, [], stats);
    if (cleaned === REMOVE || (Array.isArray(cleaned) && cleaned.length === 0)) return "";
    const canonical = JSON.stringify(cleaned);
    if (seen.has(canonical)) {
      stats.duplicateBlocksRemoved += 1;
      return "";
    }
    seen.add(canonical);
    if (canonical === before) return match;
    return `<script${attrs}>\n${canonical}\n</script>`;
  });
}

function findTagAttribute(html, tagName, attributeName, attributeValue, resultAttribute) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
  for (const tag of tags) {
    const selector = tag.match(new RegExp(`\\b${attributeName}=["']([^"']*)["']`, "i"));
    if (!selector || selector[1].toLowerCase() !== attributeValue.toLowerCase()) continue;
    const result = tag.match(new RegExp(`\\b${resultAttribute}=["']([^"']*)["']`, "i"));
    if (result) return decodeEntities(result[1]).trim();
  }
  return "";
}

function pageTitle(html) {
  const title = plainText((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  return title.replace(/\s*(?:\||—|-)\s*AfroTools\s*$/i, "").trim();
}

function pageDescription(html) {
  return findTagAttribute(html, "meta", "name", "description", "content");
}

function routeForFile(file) {
  const rel = normalizeRel(file).replace(/index\.html$/i, "");
  return `/${rel}`.replace(/\/+/g, "/");
}

function absoluteUrl(value, fallbackRoute) {
  try {
    return new URL(value || fallbackRoute, SITE).href;
  } catch (error) {
    return new URL(fallbackRoute, SITE).href;
  }
}

function pageUrl(file, html) {
  const canonical = findTagAttribute(html, "link", "rel", "canonical", "href");
  return absoluteUrl(canonical, routeForFile(file));
}

function inferCategory(relPath) {
  const rel = relPath.toLowerCase().replace(/\/index\.html$/, "");
  if (/(?:tax|paye|vat|salary|pension|wht|cgt|uif|nhf|finance|mortgage|loan|budget|profit|invoice|receipt|currency|forex|remittance|bank)/.test(rel)) return "FinanceApplication";
  if (/(?:bmi|calorie|health|blood|pregnancy|drug|vaccine|malaria|sickle|hospital|dental)/.test(rel)) return "HealthApplication";
  if (/(?:gpa|waec|jamb|school|study|ielts|degree|flashcard|matric|algebra)/.test(rel)) return "EducationalApplication";
  if (/(?:pdf|json|csv|regex|sql|api|hash|base64|uuid|jwt|diff|cron|robots|sitemap|markdown|developer)/.test(rel)) return "DeveloperApplication";
  if (/(?:image|photo|logo|flyer|thumbnail|meme|color|colour|favicon|watermark|palette|design)/.test(rel)) return "DesignApplication";
  if (rel.includes("afrokitchen")) return "LifestyleApplication";
  return "UtilitiesApplication";
}

function webApplicationSchema(file, html) {
  const name = pageTitle(html);
  const description = pageDescription(html);
  if (!name || !description) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: pageUrl(file, html),
    inLanguage: "en",
    applicationCategory: inferCategory(normalizeRel(file)),
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Organization", name: "AfroTools", url: `${SITE}/` },
  };
}

function looksLikeQuestion(value) {
  const text = plainText(value);
  return /\?$/.test(text) || /^(?:what|why|how|when|where|who|which|can|could|do|does|did|is|are|was|were|should|would|will|may|must|has|have)\b/i.test(text);
}

function extractVisibleFaq(html) {
  const source = visibleHtml(html);
  const pairs = [];
  const seen = new Set();
  const add = (question, answer) => {
    const name = plainText(question);
    const text = plainText(answer);
    const key = name.toLowerCase();
    if (!looksLikeQuestion(name) || text.length < 10 || seen.has(key)) return;
    seen.add(key);
    pairs.push({ question: name, answer: text });
  };

  for (const match of source.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)) {
    const summary = match[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
    if (summary) add(summary[1], match[1].replace(summary[0], ""));
  }

  const classPair = /<([a-z0-9]+)\b[^>]*class=["'][^"']*(?:faq-q|faq-question|__question)[^"']*["'][^>]*>([\s\S]*?)<\/\1>\s*<([a-z0-9]+)\b[^>]*class=["'][^"']*(?:faq-a|faq-answer|faq-body|__answer)[^"']*["'][^>]*>([\s\S]*?)<\/\3>/gi;
  for (const match of source.matchAll(classPair)) add(match[2], match[4]);

  const itemStarts = [...source.matchAll(/<([a-z0-9]+)\b[^>]*class=["'][^"']*faq-(?:item|card)[^"']*["'][^>]*>/gi)];
  for (let index = 0; index < itemStarts.length; index += 1) {
    const start = itemStarts[index].index + itemStarts[index][0].length;
    const end = Math.min(itemStarts[index + 1]?.index ?? source.length, start + 6000);
    const chunk = source.slice(start, end);
    const question = chunk.match(/<(?:summary|h3|h4|button)\b[^>]*>([\s\S]*?)<\/(?:summary|h3|h4|button)>/i);
    const answer = chunk.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) ||
      chunk.match(/<([a-z0-9]+)\b[^>]*class=["'][^"']*(?:faq-a|faq-answer|faq-body|__answer)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/i);
    if (question && answer) add(question[1], answer[2] || answer[1]);
  }

  for (const match of source.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)) {
    add(match[1], match[2]);
  }

  const faqSections = source.matchAll(
    /<(?:section|div)\b(?=[^>]*(?:class=["'][^"']*faq[^"']*["']|aria-label=["'][^"']*(?:faq|frequently asked questions)[^"']*["']))[^>]*>([\s\S]*?)<\/(?:section|div)>/gi
  );
  for (const section of faqSections) {
    for (const item of section[1].matchAll(/<h[3-4]\b[^>]*>([\s\S]*?)<\/h[3-4]>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      add(item[1], item[2]);
    }
  }

  const faqLists = source.matchAll(/<h[2-4]\b[^>]*>\s*(?:Frequently Asked Questions|FAQs?)\s*<\/h[2-4]>([\s\S]{0,12000}?)(?=<h[2-4]\b|<\/section>|<\/article>|<\/main>)/gi);
  for (const section of faqLists) {
    for (const item of section[1].matchAll(/<li\b[^>]*>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/li>/gi)) {
      add(item[1], item[2]);
    }
  }

  return pairs;
}

function faqSchema(pairs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function hasClientRenderedFaq(html) {
  const afroAtlas = html.includes('class="aa-faq-list"') &&
    html.includes('class="aa-faq-item"') &&
    html.includes("faqs.push(");
  const afroStream = html.includes('id="faqList"') &&
    html.includes('class="as-faq-item"') &&
    html.includes("toggleFaq(");
  return afroAtlas || afroStream;
}

function removeStandaloneSchemaByType(html, type, stats) {
  return html.replace(JSON_LD_RE, (match, attrs, jsonText) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch (error) {
      return match;
    }
    if (!ownTypes(parsed).includes(type)) return match;
    stats.faqPagesRemoved += 1;
    return "";
  });
}

function syncStandaloneFaqSchema(html, schema, stats) {
  const expected = JSON.stringify(schema);
  let found = false;
  return html.replace(JSON_LD_RE, (match, attrs, jsonText) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch (error) {
      return match;
    }
    if (!ownTypes(parsed).includes("FAQPage")) return match;
    if (found) {
      stats.duplicateBlocksRemoved += 1;
      return "";
    }
    found = true;
    if (JSON.stringify(parsed) === expected) return match;
    stats.faqPagesSynchronized += 1;
    return `<script${attrs}>\n${expected}\n</script>`;
  });
}

function titleFromFile(file) {
  if (!fs.existsSync(file)) return "";
  return pageTitle(fs.readFileSync(file, "utf8"));
}

function breadcrumbSchema(file, html) {
  const route = new URL(pageUrl(file, html)).pathname;
  const segments = route.split("/").filter(Boolean);
  const items = [
    { "@type": "ListItem", position: 1, name: "AfroTools", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "All Tools", item: `${SITE}/tools/` },
  ];

  let position = 3;
  let current = path.join(ROOT, "tools");
  let currentRoute = "/tools/";
  for (const segment of segments.slice(1, -1)) {
    current = path.join(current, segment);
    currentRoute += `${segment}/`;
    const indexFile = path.join(current, "index.html");
    if (!fs.existsSync(indexFile)) continue;
    const name = titleFromFile(indexFile) || segment.replace(/-/g, " ");
    items.push({ "@type": "ListItem", position: position++, name, item: absoluteUrl(currentRoute, currentRoute) });
  }

  items.push({
    "@type": "ListItem",
    position,
    name: pageTitle(html),
    item: pageUrl(file, html),
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function injectSchema(html, schema) {
  const block = `<!-- ${GENERATED_MARKER} -->\n<script type="application/ld+json">\n${JSON.stringify(schema)}\n</script>`;
  return html.replace(/<\/head>/i, `${block}\n</head>`);
}

function processFile(file, stats) {
  const original = fs.readFileSync(file, "utf8");
  let html = normalizeJsonLd(original, stats);
  let blocks = parseJsonLd(html);

  if (hasType(blocks, "CollectionPage") && hasType(blocks, "WebApplication")) {
    html = removeStandaloneSchemaByType(html, "WebApplication", stats);
    blocks = parseJsonLd(html);
  }

  if (!hasType(blocks, "WebApplication") && !hasType(blocks, "CollectionPage")) {
    const schema = webApplicationSchema(file, html);
    if (schema) {
      html = injectSchema(html, schema);
      stats.webApplicationsAdded += 1;
    } else {
      stats.webApplicationsSkippedMissingMetadata.push(normalizeRel(file));
    }
  }

  blocks = parseJsonLd(html);
  const visibleFaq = extractVisibleFaq(html);
  const clientRenderedFaq = hasClientRenderedFaq(html);
  if (hasType(blocks, "FAQPage") && !visibleFaq.length && !clientRenderedFaq) {
    html = removeStandaloneSchemaByType(html, "FAQPage", stats);
  } else if (hasType(blocks, "FAQPage") && visibleFaq.length) {
    html = syncStandaloneFaqSchema(html, faqSchema(visibleFaq), stats);
  } else if (!hasType(blocks, "FAQPage") && visibleFaq.length) {
    html = injectSchema(html, faqSchema(visibleFaq));
    stats.faqPagesAdded += 1;
    stats.faqQuestionsAdded += visibleFaq.length;
  }

  blocks = parseJsonLd(html);
  if (!hasType(blocks, "BreadcrumbList")) {
    html = injectSchema(html, breadcrumbSchema(file, html));
    stats.breadcrumbsAdded += 1;
  }

  if (html !== original) {
    stats.filesChanged += 1;
    if (FIX) atomicWrite(file, html);
  }
}

function inspectCoverage(files) {
  const report = {
    pages: files.length,
    webApplication: 0,
    faqPage: 0,
    breadcrumbList: 0,
    genuineVisibleFaq: 0,
    staticVisibleFaq: 0,
    clientRenderedFaq: 0,
    visibleFaqMissingSchema: 0,
    faqSchemaWithoutVisibleFaq: 0,
    howTo: 0,
    recipe: 0,
    howToStepPages: 0,
    howToStepNodes: 0,
    orphanHowToSteps: 0,
    duplicateJsonLdBlocks: 0,
    duplicateJsonLdPages: 0,
    invalidJsonLdBlocks: 0,
  };

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const blocks = parseJsonLd(html);
    const types = new Set();
    const seen = new Set();
    let pageHasDuplicate = false;
    let stepNodes = 0;
    let orphanSteps = 0;

    function inspect(value, ancestors = []) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((item) => inspect(item, ancestors));
        return;
      }
      const own = ownTypes(value);
      own.forEach((type) => types.add(type));
      if (own.includes("HowToStep")) {
        stepNodes += 1;
        if (!ancestors.some((type) => type === "HowTo" || type === "Recipe")) orphanSteps += 1;
      }
      const next = [...ancestors, ...own];
      Object.values(value).forEach((item) => inspect(item, next));
    }

    for (const block of blocks) {
      if (block.error) {
        report.invalidJsonLdBlocks += 1;
        continue;
      }
      const canonical = JSON.stringify(block.value);
      if (seen.has(canonical)) {
        report.duplicateJsonLdBlocks += 1;
        pageHasDuplicate = true;
      } else seen.add(canonical);
      inspect(block.value);
    }

    if (types.has("WebApplication")) report.webApplication += 1;
    const hasFaqSchema = types.has("FAQPage");
    const staticFaq = extractVisibleFaq(html).length > 0;
    const clientFaq = hasClientRenderedFaq(html);
    const hasGenuineFaq = staticFaq || clientFaq;
    if (hasFaqSchema) report.faqPage += 1;
    if (types.has("BreadcrumbList")) report.breadcrumbList += 1;
    if (types.has("HowTo")) report.howTo += 1;
    if (types.has("Recipe")) report.recipe += 1;
    if (stepNodes) report.howToStepPages += 1;
    report.howToStepNodes += stepNodes;
    report.orphanHowToSteps += orphanSteps;
    if (pageHasDuplicate) report.duplicateJsonLdPages += 1;
    if (staticFaq) report.staticVisibleFaq += 1;
    if (clientFaq) report.clientRenderedFaq += 1;
    if (hasGenuineFaq) report.genuineVisibleFaq += 1;
    if (hasGenuineFaq && !hasFaqSchema) report.visibleFaqMissingSchema += 1;
    if (hasFaqSchema && !hasGenuineFaq) report.faqSchemaWithoutVisibleFaq += 1;
  }
  return report;
}

function main() {
  const allFiles = walkToolIndexes(path.join(ROOT, "tools")).sort();
  const targets = selectedFiles(allFiles);
  const stats = {
    filesChanged: 0,
    webApplicationsAdded: 0,
    faqPagesAdded: 0,
    faqPagesRemoved: 0,
    faqPagesSynchronized: 0,
    faqQuestionsAdded: 0,
    breadcrumbsAdded: 0,
    duplicateBlocksRemoved: 0,
    orphanStepsRemoved: 0,
    invalidJsonLd: 0,
    webApplicationsSkippedMissingMetadata: [],
  };

  targets.forEach((file) => processFile(file, stats));
  const coverage = inspectCoverage(allFiles);
  console.log(JSON.stringify({ mode: FIX ? "fix" : "audit", targets: targets.length, changes: stats, coverage }, null, 2));

  if (coverage.invalidJsonLdBlocks || coverage.duplicateJsonLdBlocks || coverage.orphanHowToSteps) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  collectTypes,
  extractVisibleFaq,
  normalizeJsonLd,
  parseJsonLd,
  plainText,
};
