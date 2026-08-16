#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const routeApi = require("./lib/route-contract");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "search-snippet-quality.json");
const REPORT_MD = path.join(ROOT, "reports", "search-snippet-quality.md");
const REPORT_CSV = path.join(ROOT, "reports", "search-snippet-quality.csv");
const GSC_WAVES = path.join(ROOT, "data", "seo", "gsc-recovery-waves.json");
const LOCALES = ["en", "fr", "sw"];

const ENGLISH_MARKERS = {
  fr: /\b(?:calculator|checker|download|find|free online|generator|how to|salary|tax tool)\b/i,
  sw: /\b(?:calculator|checker|download|find|free online|generator|how to|salary|tax tool)\b/i
};

function decodeHtml(value) {
  const named = {
    amp: "&", apos: "'", copy: "©", gt: ">", hellip: "…", laquo: "«",
    lt: "<", mdash: "—", nbsp: " ", ndash: "–", quot: '"', raquo: "»", reg: "®"
  };
  return String(value || "")
    .replace(/&#(\d+);/g, (_, raw) => String.fromCodePoint(Number(raw)))
    .replace(/&#x([0-9a-f]+);/gi, (_, raw) => String.fromCodePoint(Number.parseInt(raw, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] || match)
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "));
}

function attribute(tag, name) {
  const match = String(tag || "").match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? decodeHtml(match[2]) : "";
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (attribute(tag, "name").toLowerCase() === name.toLowerCase()) return attribute(tag, "content");
  }
  return "";
}

function extractMetadata(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const iframeMatch = html.match(/<iframe\b[^>]*\bsrc\s*=\s*(["'])([^"']+)\1/i);
  return {
    title: titleMatch ? stripTags(titleMatch[1]) : "",
    description: metaContent(html, "description"),
    h1: h1Match ? stripTags(h1Match[1]) : "",
    iframeSrc: iframeMatch ? decodeHtml(iframeMatch[2]) : ""
  };
}

function normalized(value) {
  return decodeHtml(value)
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupCounts(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.locale}\0${normalized(row[field])}`;
    if (!row[field]) continue;
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }
  return groups;
}

function addSignal(row, code, severity, detail) {
  row.signals.push({ code, severity, detail });
}

function buildRows(graph = routeApi.buildRouteGraph()) {
  const pages = graph.routes
    .filter((record) => record.state === "page" && record.indexability === "indexable" && LOCALES.includes(record.locale))
    .sort((left, right) => left.route.localeCompare(right.route));

  const rows = pages.map((record) => {
    const filePath = path.join(ROOT, record.source.file);
    const html = fs.readFileSync(filePath, "utf8");
    return {
      route: record.route,
      locale: record.locale,
      pageType: record.pageType,
      coverageState: record.localeCoverage?.state || "unknown",
      sourceFile: record.source.file,
      englishEquivalent: record.equivalents?.en || "",
      ...extractMetadata(html),
      signals: []
    };
  });

  const byRoute = new Map(rows.map((row) => [row.route, row]));
  const titleGroups = groupCounts(rows, "title");
  const descriptionGroups = groupCounts(rows, "description");

  for (const row of rows) {
    if (!row.title) addSignal(row, "TITLE_MISSING", "error", "The indexable page has no title element.");
    if (!row.description) addSignal(row, "DESCRIPTION_MISSING", "error", "The indexable page has no meta description.");
    if (!row.h1) addSignal(row, "H1_MISSING", "review", "The indexable page has no static H1; inspect wrappers and dynamic workspaces manually.");

    const titleGroup = titleGroups.get(`${row.locale}\0${normalized(row.title)}`) || [];
    const descriptionGroup = descriptionGroups.get(`${row.locale}\0${normalized(row.description)}`) || [];
    row.titleDuplicateCount = titleGroup.length;
    row.descriptionDuplicateCount = descriptionGroup.length;
    if (titleGroup.length > 1) addSignal(row, "TITLE_DUPLICATE_LOCALE", "review", `${titleGroup.length} ${row.locale} pages share this exact title.`);
    if (descriptionGroup.length > 1) addSignal(row, "DESCRIPTION_DUPLICATE_LOCALE", "review", `${descriptionGroup.length} ${row.locale} pages share this exact description.`);

    if (row.title && row.title.length < 25) addSignal(row, "TITLE_SHORT", "review", `${row.title.length} characters.`);
    if (row.title && row.title.length > 65) addSignal(row, "TITLE_LONG", "review", `${row.title.length} characters.`);
    if (row.description && row.description.length < 70) addSignal(row, "DESCRIPTION_SHORT", "review", `${row.description.length} characters.`);
    if (row.description && row.description.length > 180) addSignal(row, "DESCRIPTION_LONG", "review", `${row.description.length} characters.`);
    if (/^afrotools\b\s*(?:[-|:–—]|$)/i.test(row.title)) addSignal(row, "TITLE_BRAND_FIRST", "review", "The brand appears before the page job.");

    if (row.locale !== "en") {
      if (row.iframeSrc && !row.iframeSrc.startsWith(`/${row.locale}/`)) {
        addSignal(row, "INDEXABLE_ENGLISH_IFRAME", "review", `Localized route embeds ${row.iframeSrc}; native metadata does not make the visible workflow native.`);
      }
      const english = byRoute.get(row.englishEquivalent);
      if (english && normalized(row.title) && normalized(row.title) === normalized(english.title)) {
        addSignal(row, "TITLE_IDENTICAL_TO_ENGLISH", "error", `Identical to ${english.route}.`);
      }
      if (english && normalized(row.description) && normalized(row.description) === normalized(english.description)) {
        addSignal(row, "DESCRIPTION_IDENTICAL_TO_ENGLISH", "error", `Identical to ${english.route}.`);
      }
      if (english && normalized(row.h1) && normalized(row.h1) === normalized(english.h1)) {
        addSignal(row, "H1_IDENTICAL_TO_ENGLISH", "error", `Identical to ${english.route}.`);
      }
      const marker = ENGLISH_MARKERS[row.locale];
      if (marker && marker.test(row.title)) addSignal(row, "TITLE_ENGLISH_SEARCH_TERMS", "review", "Contains English task wording on a localized route.");
      if (marker && marker.test(row.description)) addSignal(row, "DESCRIPTION_ENGLISH_SEARCH_TERMS", "review", "Contains English task wording on a localized route.");
      if (marker && marker.test(row.h1)) addSignal(row, "H1_ENGLISH_SEARCH_TERMS", "review", "Contains English task wording in the primary visible heading.");
    }

    row.signalCodes = row.signals.map((signal) => signal.code).sort();
    row.errorCount = row.signals.filter((signal) => signal.severity === "error").length;
    row.reviewCount = row.signals.filter((signal) => signal.severity === "review").length;
  }

  return rows;
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const key = selector(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function duplicateGroups(rows, field) {
  return [...groupCounts(rows, field).entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      locale: key.split("\0")[0],
      value: group[0][field],
      count: group.length,
      routes: group.map((row) => row.route).slice(0, 12)
    }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function readGscBaseline() {
  if (!fs.existsSync(GSC_WAVES)) return null;
  const data = JSON.parse(fs.readFileSync(GSC_WAVES, "utf8"));
  const wave = data.waves?.find((item) => item.status === "production" && item.baseline?.totals);
  if (!wave) return null;
  const { clicks, impressions } = wave.baseline.totals;
  return {
    waveId: wave.id,
    source: wave.baseline.source,
    measurementWindowDays: wave.measurementWindowDays,
    clicks,
    impressions,
    ctr: impressions ? Number((clicks / impressions).toFixed(4)) : 0,
    routes: wave.routes
  };
}

function buildReport(rows) {
  const signals = rows.flatMap((row) => row.signals.map((signal) => ({ ...signal, locale: row.locale })));
  const byLocale = {};
  for (const locale of LOCALES) {
    const localRows = rows.filter((row) => row.locale === locale);
    byLocale[locale] = {
      pages: localRows.length,
      native: localRows.filter((row) => row.coverageState === "native").length,
      localizedShell: localRows.filter((row) => row.coverageState === "localized-shell").length,
      pagesWithErrors: localRows.filter((row) => row.errorCount > 0).length,
      pagesWithReviewSignals: localRows.filter((row) => row.reviewCount > 0).length,
      signals: countBy(
        localRows.flatMap((row) => row.signals.map((signal) => ({ code: signal.code }))),
        (signal) => signal.code
      )
    };
  }

  return {
    schemaVersion: 1,
    scope: {
      locales: LOCALES,
      state: "indexable canonical HTML pages from the route contract",
      pages: rows.length
    },
    evidenceBoundary: {
      staticAudit: "All current indexable English, French and Swahili route owners were inspected.",
      searchPerformance: "The repository contains a seven-route English GSC baseline, but no granular French or Swahili query/page export. Static signals cannot prove what Google displayed or why a particular impression did not click."
    },
    gscBaseline: readGscBaseline(),
    byLocale,
    pagesWithErrors: rows.filter((row) => row.errorCount > 0).length,
    pagesWithReviewSignals: rows.filter((row) => row.reviewCount > 0).length,
    signalCounts: countBy(signals, (signal) => signal.code),
    signalCountsByLocale: countBy(signals, (signal) => `${signal.locale}:${signal.code}`),
    topDuplicateTitles: duplicateGroups(rows, "title").slice(0, 30),
    topDuplicateDescriptions: duplicateGroups(rows, "description").slice(0, 30),
    errorSamples: rows
      .filter((row) => row.errorCount > 0)
      .slice(0, 100)
      .map(({ route, locale, sourceFile, englishEquivalent, title, description, signalCodes }) => ({
        route, locale, sourceFile, englishEquivalent, title, description, signalCodes
      }))
  };
}

function markdown(report) {
  const baseline = report.gscBaseline;
  const baselineLine = baseline
    ? `The checked-in ${baseline.measurementWindowDays}-day baseline covers ${baseline.impressions.toLocaleString("en-US")} impressions and ${baseline.clicks.toLocaleString("en-US")} clicks (${(baseline.ctr * 100).toFixed(2)}% CTR) across seven English routes.`
    : "No checked-in GSC baseline was available.";
  const lines = [
    "# Search Snippet Quality: English, French and Swahili",
    "",
    "## Evidence boundary",
    "",
    `- ${report.evidenceBoundary.staticAudit}`,
    `- ${baselineLine}`,
    `- ${report.evidenceBoundary.searchPerformance}`,
    "- Length, duplication, brand order and language-marker findings are review signals. Search engines may rewrite snippets, so these are not ranking or CTR guarantees.",
    "",
    "## Exact denominator",
    "",
    "| Locale | Indexable pages | Native | Localized shell | Pages with errors | Pages with review signals |",
    "|---|---:|---:|---:|---:|---:|"
  ];
  for (const locale of LOCALES) {
    const row = report.byLocale[locale];
    lines.push(`| ${locale} | ${row.pages} | ${row.native} | ${row.localizedShell} | ${row.pagesWithErrors} | ${row.pagesWithReviewSignals} |`);
  }
  lines.push("", "## Signal counts", "", "| Signal | Pages |", "|---|---:|");
  for (const [code, count] of Object.entries(report.signalCounts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))) {
    lines.push(`| ${code} | ${count} |`);
  }
  lines.push("", "## Ranked interpretation", "",
    "1. Page-volume parity is not native-content parity. Localized shells are valid only where the neutral engine and surrounding task copy are genuinely useful; they need separate CTR review from native pages.",
    "2. Exact same-locale title or description families weaken page differentiation. Repeated country templates should put the country and user job early in the snippet.",
    "3. Localized routes that retain an English equivalent's entire title or description are the clearest snippet defects and should be fixed at the owning generator or manifest.",
    "4. Brand-first and vague/length signals are secondary opportunities, not automatic failures. Actual GSC query/page rows should decide which high-impression pages move first.",
    "", "## Largest exact-title families", "",
    "| Locale | Pages | Title | Example routes |", "|---|---:|---|---|");
  for (const group of report.topDuplicateTitles.slice(0, 15)) {
    lines.push(`| ${group.locale} | ${group.count} | ${group.value.replace(/\|/g, "\\|")} | ${group.routes.slice(0, 3).map((route) => `\`${route}\``).join("<br>")} |`);
  }
  lines.push("", "The row-level CSV is `reports/search-snippet-quality.csv`.", "");
  return lines.join("\n");
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(rows) {
  const fields = [
    "route", "locale", "pageType", "coverageState", "sourceFile", "englishEquivalent",
    "title", "description", "h1", "titleDuplicateCount", "descriptionDuplicateCount",
    "errorCount", "reviewCount", "signalCodes"
  ];
  return `${[fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n")}\n`;
}

function expectedArtifacts() {
  const rows = buildRows();
  const report = buildReport(rows);
  return {
    rows,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: markdown(report),
    csv: csv(rows)
  };
}

function main(argv = process.argv.slice(2)) {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  if (write === check) throw new Error("Choose exactly one of --write or --check.");
  const artifacts = expectedArtifacts();
  const outputs = [[REPORT_JSON, artifacts.json], [REPORT_MD, artifacts.markdown], [REPORT_CSV, artifacts.csv]];

  if (write) {
    fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
    outputs.forEach(([filePath, content]) => writeFileSyncWithRetry(filePath, content, "utf8"));
  } else {
    const stale = outputs
      .filter(([filePath, content]) => !fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== content)
      .map(([filePath]) => path.relative(ROOT, filePath).replace(/\\/g, "/"));
    if (stale.length) {
      stale.forEach((filePath) => console.error(`STALE ${filePath}`));
      process.exitCode = 1;
    }
  }

  const counts = LOCALES.map((locale) => `${locale}=${artifacts.report.byLocale[locale].pages}`).join(", ");
  console.log(`Search snippet audit: ${artifacts.report.scope.pages} indexable pages (${counts}); ${artifacts.report.pagesWithErrors} error pages and ${artifacts.report.pagesWithReviewSignals} review candidates.`);
}

if (require.main === module) main();

module.exports = {
  buildReport,
  buildRows,
  csv,
  decodeHtml,
  duplicateGroups,
  expectedArtifacts,
  extractMetadata,
  markdown,
  normalized
};
