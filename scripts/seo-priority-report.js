#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://afrotools.com";
const DEFAULT_INPUT_DIR = path.join(ROOT, "data", "seo-priority");
const DEFAULT_OUTPUT_PATH = path.join(ROOT, "reports", "seo-priority-report.json");
const DEFAULT_LIMIT = 25;

function parseArgs(argv) {
  const args = {
    inputDir: DEFAULT_INPUT_DIR,
    outputPath: DEFAULT_OUTPUT_PATH,
    limit: DEFAULT_LIMIT,
    fallbackTargetCtr: 0.03,
    recipeScan: true
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--input" && next) {
      args.inputDir = path.resolve(ROOT, next);
      i += 1;
    } else if (arg === "--output" && next) {
      args.outputPath = path.resolve(ROOT, next);
      i += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(1, Number.parseInt(next, 10) || DEFAULT_LIMIT);
      i += 1;
    } else if (arg === "--target-ctr" && next) {
      args.fallbackTargetCtr = normalizeCtr(next) || args.fallbackTargetCtr;
      i += 1;
    } else if (arg === "--no-recipe-scan") {
      args.recipeScan = false;
    }
  }

  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  const header = rows.shift() || [];
  const normalizedHeader = header.map(normalizeHeader);
  return rows
    .filter((cells) => cells.some((cell) => String(cell || "").trim()))
    .map((cells) => {
      const item = { _headers: header, _normalizedHeaders: normalizedHeader };
      for (let i = 0; i < header.length; i += 1) {
        item[normalizedHeader[i]] = cells[i] || "";
      }
      return item;
    });
}

function listCsvFiles(inputDir) {
  if (!fs.existsSync(inputDir)) {
    ensureDir(inputDir);
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(inputDir, { withFileTypes: true })) {
    const fullPath = path.join(inputDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listCsvFiles(fullPath));
    } else if (entry.isFile() && /\.csv$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function getValue(row, candidates) {
  for (const name of candidates) {
    const key = normalizeHeader(name);
    if (Object.prototype.hasOwnProperty.call(row, key) && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value)
    .replace(/[%,$]/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "");
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCtr(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const parsed = parseNumber(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return raw.includes("%") || parsed > 1 ? parsed / 100 : parsed;
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, SITE_ORIGIN);
    parsed.hash = "";
    parsed.search = "";
    let pathname = parsed.pathname || "/";
    pathname = pathname.replace(/\/index\.html$/i, "/");
    pathname = pathname.replace(/\/index$/i, "/");
    if (parsed.origin === SITE_ORIGIN) {
      return pathname;
    }
    return `${parsed.origin}${pathname}`;
  } catch {
    return raw;
  }
}

function urlKey(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";
  return normalized === "/" ? "/" : normalized.replace(/\/$/, "");
}

function publicUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  return `${SITE_ORIGIN}${normalized}`;
}

function ctrTargetForPosition(position, fallbackTargetCtr) {
  if (!position || position <= 0) return fallbackTargetCtr;
  if (position <= 3) return 0.15;
  if (position <= 5) return 0.08;
  if (position <= 10) return 0.05;
  if (position <= 20) return 0.02;
  return 0.01;
}

function addMetric(map, key, fields) {
  if (!key) return;
  const current = map.get(key) || {
    key,
    url: fields.url || "",
    query: fields.query || "",
    clicks: 0,
    impressions: 0,
    citationCount: 0,
    weightedPositionTotal: 0,
    positionWeight: 0,
    sources: new Set(),
    variants: new Set()
  };

  current.clicks += fields.clicks || 0;
  current.impressions += fields.impressions || 0;
  current.citationCount += fields.citationCount || 0;

  if (fields.position > 0 && fields.impressions > 0) {
    current.weightedPositionTotal += fields.position * fields.impressions;
    current.positionWeight += fields.impressions;
  }

  if (fields.source) current.sources.add(fields.source);
  if (fields.variant) current.variants.add(fields.variant);
  if (fields.url && !current.url) current.url = fields.url;
  if (fields.query && !current.query) current.query = fields.query;

  map.set(key, current);
}

function finalizeMetric(item, fallbackTargetCtr) {
  const averagePosition = item.positionWeight ? item.weightedPositionTotal / item.positionWeight : 0;
  const ctr = item.impressions ? item.clicks / item.impressions : 0;
  const targetCtr = ctrTargetForPosition(averagePosition, fallbackTargetCtr);
  const missedClicks = Math.max(0, Math.round(item.impressions * targetCtr - item.clicks));

  return {
    url: item.url ? publicUrl(item.url) : undefined,
    query: item.query || undefined,
    clicks: Math.round(item.clicks),
    impressions: Math.round(item.impressions),
    ctr: Number(ctr.toFixed(4)),
    averagePosition: averagePosition ? Number(averagePosition.toFixed(2)) : undefined,
    targetCtr: Number(targetCtr.toFixed(4)),
    missedClicks,
    citationCount: Math.round(item.citationCount),
    sources: Array.from(item.sources).sort(),
    variants: Array.from(item.variants).sort()
  };
}

function hasHeader(row, candidates) {
  return candidates.some((name) => Object.prototype.hasOwnProperty.call(row, normalizeHeader(name)));
}

function extractRows(csvFiles) {
  const pageMap = new Map();
  const queryMap = new Map();
  const aiPageMap = new Map();
  const aiQueryMap = new Map();
  const variantMap = new Map();
  const fileSummaries = [];

  const pageHeaders = ["page", "url", "landing page", "top pages", "final url", "destination url", "cited url", "citation url"];
  const queryHeaders = ["query", "top queries", "search term", "keyword", "prompt", "ai query", "grounding query"];
  const clickHeaders = ["clicks", "web clicks", "organic clicks"];
  const impressionHeaders = ["impressions", "web impressions", "search impressions"];
  const ctrHeaders = ["ctr", "url ctr", "page ctr", "query ctr"];
  const positionHeaders = ["position", "average position", "avg position", "rank"];
  const citationHeaders = ["citations", "citation count", "ai citations", "bing ai citations", "copilot citations", "ai cited count"];

  for (const filePath of csvFiles) {
    const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
    const source = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const fileLooksAi = /(?:bing|copilot|ai|grounding|citation)/i.test(path.basename(filePath));
    let rowsUsed = 0;

    for (const row of rows) {
      let rowUsed = false;
      const page = getValue(row, pageHeaders);
      const query = getValue(row, queryHeaders);
      const clicks = parseNumber(getValue(row, clickHeaders));
      const impressions = parseNumber(getValue(row, impressionHeaders));
      const ctr = normalizeCtr(getValue(row, ctrHeaders));
      const position = parseNumber(getValue(row, positionHeaders));
      const explicitCitationCount = parseNumber(getValue(row, citationHeaders));
      const hasCitationHeader = hasHeader(row, citationHeaders);
      const citationCount = explicitCitationCount || (fileLooksAi && page ? 1 : 0);

      if (page) {
        const normalizedPage = normalizeUrl(page);
        const key = urlKey(normalizedPage);
        addMetric(pageMap, key, {
          url: normalizedPage,
          clicks,
          impressions,
          position,
          source,
          variant: normalizeUrl(page)
        });

        if (citationCount > 0 || (fileLooksAi && !hasCitationHeader)) {
          addMetric(aiPageMap, key, {
            url: normalizedPage,
            citationCount,
            impressions,
            source,
            variant: normalizeUrl(page)
          });
        }

        const bareKey = key;
        if (bareKey) {
          const variants = variantMap.get(bareKey) || new Set();
          variants.add(normalizeUrl(page));
          variantMap.set(bareKey, variants);
        }
        rowUsed = true;
      }

      if (query) {
        const key = query.toLowerCase();
        addMetric(queryMap, key, {
          query,
          clicks,
          impressions,
          position,
          source
        });

        if (citationCount > 0 || (fileLooksAi && !hasCitationHeader) || /grounding/i.test(source)) {
          addMetric(aiQueryMap, key, {
            query,
            citationCount,
            impressions,
            source
          });
        }
        rowUsed = true;
      }

      if (!page && !query && ctr > 0) {
        rowUsed = true;
      }

      if (rowUsed) {
        rowsUsed += 1;
      }
    }

    fileSummaries.push({
      file: source,
      rows: rows.length,
      rowsUsed
    });
  }

  return { pageMap, queryMap, aiPageMap, aiQueryMap, variantMap, fileSummaries };
}

function sortByNumber(field) {
  return (a, b) => (b[field] || 0) - (a[field] || 0);
}

function detectSlashDuplicates(variantMap) {
  const duplicates = [];
  for (const [key, variants] of variantMap.entries()) {
    const list = Array.from(variants).sort();
    if (list.length < 2) continue;
    const hasSlash = list.some((item) => item !== "/" && /\/$/.test(item));
    const hasNoSlash = list.some((item) => item !== "/" && !/\/$/.test(item));
    if (hasSlash && hasNoSlash) {
      duplicates.push({
        normalizedKey: key,
        variants: list.map(publicUrl)
      });
    }
  }
  return duplicates.sort((a, b) => a.normalizedKey.localeCompare(b.normalizedKey));
}

function extractTag(html, pattern) {
  const match = html.match(pattern);
  return match ? String(match[1] || "").trim() : "";
}

function routeFromRecipeFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  return "/" + rel.replace(/\/index\.html$/i, "/");
}

function hasRecipeJsonLd(html) {
  const blocks = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return blocks.some((block) => /"@type"\s*:\s*(?:"Recipe"|\[[^\]]*"Recipe")/i.test(block));
}

function scanRecipeSeo() {
  const recipesDir = path.join(ROOT, "tools", "afrokitchen", "recipes");
  if (!fs.existsSync(recipesDir)) {
    return {
      scanned: 0,
      pagesMissingRequiredSeoFields: []
    };
  }

  const missing = [];
  const entries = fs.readdirSync(recipesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(recipesDir, entry.name, "index.html");
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, "utf8");
    const fields = {
      title: extractTag(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
      description: extractTag(html, /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      canonical: extractTag(html, /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i),
      robots: extractTag(html, /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      ogTitle: extractTag(html, /<meta\b(?=[^>]*\bproperty=["']og:title["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      ogDescription: extractTag(html, /<meta\b(?=[^>]*\bproperty=["']og:description["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      ogImage: extractTag(html, /<meta\b(?=[^>]*\bproperty=["']og:image["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      ogUrl: extractTag(html, /<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      twitterCard: extractTag(html, /<meta\b(?=[^>]*\bname=["']twitter:card["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      twitterTitle: extractTag(html, /<meta\b(?=[^>]*\bname=["']twitter:title["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      twitterDescription: extractTag(html, /<meta\b(?=[^>]*\bname=["']twitter:description["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      twitterImage: extractTag(html, /<meta\b(?=[^>]*\bname=["']twitter:image["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i),
      recipeJsonLd: hasRecipeJsonLd(html) ? "present" : ""
    };

    const missingFields = Object.keys(fields).filter((key) => !fields[key]);
    if (missingFields.length) {
      missing.push({
        route: routeFromRecipeFile(filePath),
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        missingFields
      });
    }
  }

  return {
    scanned: entries.filter((entry) => entry.isDirectory()).length,
    pagesMissingRequiredSeoFields: missing
  };
}

function buildReport(args) {
  const csvFiles = listCsvFiles(args.inputDir);
  const extracted = extractRows(csvFiles);
  const pages = Array.from(extracted.pageMap.values()).map((item) => finalizeMetric(item, args.fallbackTargetCtr));
  const aiPages = Array.from(extracted.aiPageMap.values()).map((item) => finalizeMetric(item, args.fallbackTargetCtr));
  const aiQueries = Array.from(extracted.aiQueryMap.values()).map((item) => finalizeMetric(item, args.fallbackTargetCtr));
  const recipeSeo = args.recipeScan ? scanRecipeSeo() : { scanned: 0, pagesMissingRequiredSeoFields: [] };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    inputDir: path.relative(ROOT, args.inputDir).replace(/\\/g, "/"),
    outputPath: path.relative(ROOT, args.outputPath).replace(/\\/g, "/"),
    config: {
      limit: args.limit,
      fallbackTargetCtr: args.fallbackTargetCtr,
      recipeScan: args.recipeScan,
      ctrOpportunity: "Missed clicks are estimated against a position-aware CTR target when average position is available, otherwise the fallback target CTR is used."
    },
    inputs: extracted.fileSummaries,
    summary: {
      csvFiles: csvFiles.length,
      pageRows: extracted.pageMap.size,
      aiPageRows: extracted.aiPageMap.size,
      aiQueryRows: extracted.aiQueryMap.size,
      slashDuplicateGroups: detectSlashDuplicates(extracted.variantMap).length,
      recipePagesScanned: recipeSeo.scanned,
      recipePagesMissingRequiredSeoFields: recipeSeo.pagesMissingRequiredSeoFields.length
    },
    topPagesByImpressions: pages
      .filter((item) => item.url && item.impressions > 0)
      .sort(sortByNumber("impressions"))
      .slice(0, args.limit),
    topPagesByMissedClickOpportunity: pages
      .filter((item) => item.url && item.missedClicks > 0)
      .sort(sortByNumber("missedClicks"))
      .slice(0, args.limit),
    pagesWithImpressionsButZeroClicks: pages
      .filter((item) => item.url && item.impressions > 0 && item.clicks === 0)
      .sort(sortByNumber("impressions"))
      .slice(0, args.limit),
    topBingAiCitedPages: aiPages
      .filter((item) => item.url && item.citationCount > 0)
      .sort(sortByNumber("citationCount"))
      .slice(0, args.limit),
    topAiGroundingQueries: aiQueries
      .filter((item) => item.query && (item.citationCount > 0 || item.impressions > 0))
      .sort(sortByNumber("citationCount"))
      .slice(0, args.limit),
    detectedSlashDuplicateUrlVariants: detectSlashDuplicates(extracted.variantMap),
    recipeContentPagesMissingRequiredSeoFields: recipeSeo.pagesMissingRequiredSeoFields
  };
}

function main() {
  const args = parseArgs(process.argv);
  ensureDir(args.inputDir);
  ensureDir(path.dirname(args.outputPath));

  const report = buildReport(args);
  writeFileSyncWithRetry(args.outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`SEO priority report written to ${path.relative(ROOT, args.outputPath).replace(/\\/g, "/")}`);
  console.log(`CSV files read: ${report.summary.csvFiles}`);
  console.log(`Recipe pages scanned: ${report.summary.recipePagesScanned}`);
  console.log(`Recipe pages missing required SEO fields: ${report.summary.recipePagesMissingRequiredSeoFields}`);
}

main();
