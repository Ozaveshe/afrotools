#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const YO_ROOT = path.join(ROOT, "yo");
const REPORT_JSON = path.join(ROOT, "reports", "yoruba-visible-copy-ledger.json");
const REPORT_MD = path.join(ROOT, "reports", "yoruba-visible-copy-ledger.md");
const GENERATED_AT = new Date().toISOString();

const ACCEPTED_TECH_TERMS = [
  "PDF", "API", "JSON", "USSD", "JAMB", "WAEC", "NECO", "NYSC", "VAT", "PAYE",
  "BVN", "NIN", "FIRS", "HTML", "CSV", "ZIP",
];

const ACCEPTED_CONTEXT_TERMS = [
  "AfroTools", "Yoruba", "Yorùbá", "Hausa", "Swahili", "Igbo", "Amharic", "Pidgin",
  "Nigeria", "Naijiria", "Naira", "WhatsApp", "MTN", "Airtel", "Glo", "9mobile",
  "Paystack", "Flutterwave", "OPay", "M-Pesa", "Kenya", "Ghana", "Tanzania",
  "Rwanda", "South Africa", "Africa", "Afrika", "Áfíríkà",
];

const IGNORED_ELEMENTS = new Set([
  "head",
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "pre",
  "code",
  "kbd",
  "samp",
]);

const VISIBLE_ATTRS = new Set(["placeholder", "aria-label", "alt", "title", "value"]);

const FALSE_POSITIVE_PATTERNS = [
  { label: "intentional English fallback marker", re: /\bEnglish fallback\b/i },
  { label: "English route label marked as fallback", re: /\bojú ìwé Gẹẹsi\b/i },
  { label: "English route label marked as fallback", re: /\boju iwe geesi\b/i },
  { label: "language name in adjacent-language card", re: /\b(?:Hausa|Swahili|Igbo|Amharic|Pidgin) Translator\b/i },
  { label: "brand or platform name", re: /\b(?:WhatsApp|Paystack|Flutterwave|OPay|M-Pesa|MTN|Airtel|Glo|9mobile)\b/i },
];

const STRONG_BLOCKER_PATTERNS = [
  { label: "English UI label", re: /\b(?:Search|Filter|Reset|Calculate|Calculator|Copy|Download|Save|Share|Print|Open|Close|Submit|Start|Continue|Next|Back|Cancel|Import|Export)\b/i },
  { label: "English result label", re: /\b(?:Result|Results|Summary|Estimated cost|Estimated total|Comparison|Outcome percentages|Key metrics|Profit and loss summary|Daily targets|Shopping list)\b/i },
  { label: "English form label", re: /\b(?:Male|Female|Age|Weight|Height|Activity|Goal|Parent \/ partner|Country|Currency|Category|Brand|Generic|Description|Quantity|Subtotal|Discount|Shipping|Balance|Status)\b/i },
  { label: "English workflow/status copy", re: /\b(?:Ready|Review|Draft|Loading|No results|No saved|Template|Profile|Preview|Workspace|Batch mode|Custom range|Clean rewrite)\b/i },
  { label: "English advisory phrase", re: /\b(?:Official Context|Medical Disclaimer|Disclaimer|Informational only|qualified health professional|not diagnosis|not treatment|Verify|Confirm)\b/i },
  { label: "English paragraph phrase", re: /\b(?:Government payment vouchers|Writing amounts in words|Banks will reject|The converter supports|Enter amounts|professional PDF invoice|built-in engine)\b/i },
];

const ENGLISH_WORDS = new Set([
  "about", "accepted", "activity", "age", "amount", "amounts", "and", "aria",
  "available", "back", "balance", "balanced", "bank", "banks", "batch", "brand",
  "browser", "built", "business", "button", "calculator", "calculate",
  "calculated", "calories", "cancel", "card", "category", "clean", "close",
  "compact", "comparison", "confirm", "context", "continue", "copy", "cost",
  "costs", "country", "countries", "currency", "custom", "customer", "daily",
  "data", "description", "diagnosis", "disclaimer", "discount", "doctor",
  "download", "draft", "drop", "emergency", "engine", "enter", "estimated",
  "estimate", "export", "fallback", "female", "file", "files", "filter",
  "generic", "goal", "government", "height", "high", "home", "hospital",
  "import", "informational", "item", "items", "key", "label", "line", "list",
  "loading", "loss", "male", "medical", "medicine", "metrics", "mode",
  "modern", "muscle", "next", "official", "only", "open", "outcome",
  "paid", "parent", "partner", "payment", "percentages", "placeholder",
  "preview", "print", "private", "professional", "profile", "public",
  "quantity", "range", "rate", "ready", "reference", "reset", "result",
  "results", "review", "rewrite", "safety", "save", "saved", "score",
  "search", "select", "service", "share", "shipping", "shopping", "start",
  "status", "strong", "submit", "subtotal", "summary", "target", "targets",
  "teaching", "template", "terms", "thermal", "total", "treatment", "unit",
  "verify", "vouchers", "weight", "words", "workflow", "workspace",
]);

const HIGH_SIGNAL_SINGLE_WORDS = new Set([
  "activity", "age", "calculator", "calculate", "category", "copy", "download",
  "estimated", "female", "filter", "goal", "height", "male", "print",
  "results", "search", "share", "summary", "weight",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function routeFor(filePath) {
  let route = `/${rel(filePath).replace(/index\.html$/i, "").replace(/\.html$/i, "")}`;
  route = route.replace(/\/+/g, "/");
  return route === "/yo" ? "/yo/" : route;
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, "/")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCharCode(n) : " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const n = parseInt(code, 16);
      return Number.isFinite(n) ? String.fromCharCode(n) : " ";
    });
}

function removeIgnoredSegments(line, state) {
  let rest = line;
  let visible = "";
  while (rest) {
    if (state.ignoredTag) {
      const closeRe = new RegExp(`</\\s*${state.ignoredTag}\\s*>`, "i");
      const close = rest.search(closeRe);
      if (close === -1) return visible;
      rest = rest.slice(close).replace(closeRe, "");
      state.ignoredTag = "";
      continue;
    }

    const open = rest.match(/<\s*(head|script|style|noscript|template|svg|pre|code|kbd|samp)\b[^>]*>/i);
    if (!open) {
      visible += rest;
      break;
    }

    visible += rest.slice(0, open.index);
    const tag = open[1].toLowerCase();
    const afterOpen = rest.slice(open.index + open[0].length);
    const closeRe = new RegExp(`</\\s*${tag}\\s*>`, "i");
    const close = afterOpen.search(closeRe);
    if (close === -1) {
      state.ignoredTag = tag;
      break;
    }
    rest = afterOpen.slice(close).replace(closeRe, "");
  }
  return visible;
}

function extractVisibleAttributeText(line) {
  const values = [];
  const tagRe = /<([a-z0-9-]+)\b([^>]*)>/gi;
  let match;
  while ((match = tagRe.exec(line))) {
    const tag = match[1].toLowerCase();
    if (IGNORED_ELEMENTS.has(tag) || tag === "meta" || tag === "link") continue;
    const attrs = match[2] || "";
    const attrRe = /([a-z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;
    let attrMatch;
    while ((attrMatch = attrRe.exec(attrs))) {
      const name = attrMatch[1].toLowerCase();
      if (!VISIBLE_ATTRS.has(name)) continue;
      if (name === "value" && !/\b(?:button|submit|reset)\b/i.test(attrs) && tag !== "button") continue;
      const value = attrMatch[3] || attrMatch[4] || "";
      if (value) values.push(value);
    }
  }
  return values.join(" ");
}

function visibleLines(html) {
  const state = { ignoredTag: "" };
  return html.split(/\r?\n/).map((line, index) => {
    let visible = removeIgnoredSegments(line.replace(/<!--[\s\S]*?-->/g, " "), state);
    const attrText = state.ignoredTag ? "" : extractVisibleAttributeText(visible);
    visible = `${visible} ${attrText}`
      .replace(/https?:\/\/[^\s"'<>]+/gi, " ")
      .replace(/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g, " ")
      .replace(/<[^>]+>/g, " ");
    visible = decodeEntities(visible)
      .replace(/\{[\s\S]*?\}/g, " ")
      .replace(/\[[\s\S]*?\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { line: index + 1, text: visible };
  }).filter((item) => item.text);
}

function findTerms(text, terms) {
  const found = [];
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
    if (re.test(text)) found.push(term);
  }
  return found;
}

function stripKnownTerms(text) {
  let out = ` ${text} `;
  for (const term of ACCEPTED_TECH_TERMS.concat(ACCEPTED_CONTEXT_TERMS)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

function englishSignals(text) {
  const cleaned = stripKnownTerms(text);
  const strong = STRONG_BLOCKER_PATTERNS
    .filter((item) => item.re.test(cleaned))
    .map((item) => item.label);
  const tokens = (cleaned.match(/[A-Za-z][A-Za-z-]*/g) || [])
    .map((token) => token.toLowerCase().replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  const words = tokens.filter((token) => ENGLISH_WORDS.has(token));
  const highSignal = words.filter((token) => HIGH_SIGNAL_SINGLE_WORDS.has(token));
  return {
    strong,
    words,
    highSignal,
    score: words.length + strong.length * 3 + highSignal.length,
  };
}

function ownerBatch(route) {
  if (route === "/yo/" || route === "/yo/awon-ise/" || route === "/yo/naijiria/") return "Batch 1 - Yoruba shell hubs";
  if (route.includes("owo-osu") || route.includes("owo-ori") || route.includes("vat")) return "Batch 1 - Salary, PAYE, and VAT shell";
  if (route.includes("eko") || route.includes("jamb") || route.includes("waec") || route.includes("neco") || route.includes("nysc")) return "Batch 1 - Education and exam shell";
  if (route.includes("iwe") || route.includes("pdf") || route.includes("invoice") || route.includes("risiti") || route.includes("naira")) return "Batch 1 - Document, PDF, invoice, and Naira shell";
  if (route.includes("ibaraenisoro") || route.includes("ussd") || route.includes("whatsapp")) return "Batch 1 - Telecom, USSD, and WhatsApp shell";
  if (route.includes("ede") || route.includes("itumo")) return "Batch 1 - Language and translation shell";
  if (route.includes("ogbin") || route.includes("oko") || route.includes("ajile") || route.includes("irugbin")) return "Batch 1 - Agriculture shell";
  if (route.includes("ilera") || route.includes("iwosan") || route.includes("oogun") || route.includes("genotype") || route.includes("sickle")) return "Batch 1 - Health and family shell";
  return "Batch 1 - General Yoruba shell";
}

function snippet(text) {
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function classifyLine(route, file, item) {
  const text = item.text;
  if (!/[A-Za-z]/.test(text)) return [];

  const acceptedTerms = findTerms(text, ACCEPTED_TECH_TERMS);
  const falsePositive = FALSE_POSITIVE_PATTERNS.find((pattern) => pattern.re.test(text));
  const signals = englishSignals(text);
  const owner = ownerBatch(route);
  const base = {
    route,
    file: rel(file),
    line: item.line,
    snippet: snippet(text),
    suggestedOwnerBatch: owner,
  };

  if (falsePositive) {
    return [{
      ...base,
      group: "POSSIBLE_FALSE_POSITIVE",
      reason: falsePositive.label,
      acceptedTerms,
    }];
  }

  if (signals.strong.length || signals.words.length >= 2 || signals.highSignal.length) {
    return [{
      ...base,
      group: "BLOCKER_VISIBLE_ENGLISH",
      reason: signals.strong.length
        ? signals.strong.join("; ")
        : `English UI word signal: ${Array.from(new Set(signals.words)).slice(0, 8).join(", ")}`,
      signals: Array.from(new Set(signals.words)).slice(0, 12),
      acceptedTerms,
    }];
  }

  if (acceptedTerms.length) {
    return [{
      ...base,
      group: "ACCEPTED_TECH_TERM",
      reason: `Accepted technical term(s): ${acceptedTerms.join(", ")}`,
      acceptedTerms,
    }];
  }

  return [];
}

function escapeMd(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildMarkdown(report) {
  const lines = [];
  const counts = report.counts;
  const topRoutes = report.topBlockerRoutes;
  lines.push("# Yoruba Visible Copy Leakage Ledger");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt.slice(0, 10)}`);
  lines.push("");
  lines.push("This audit scans `yo/**/*.html` for visible English leakage only. It ignores scripts, styles, head metadata, JSON blobs, URLs, code/pre blocks, and accepted technical acronyms.");
  lines.push("");
  if (!report.routeTreeExists) {
    lines.push("> No `yo/` route tree exists yet, so this foundation audit wrote an empty ledger.");
    lines.push("");
  }
  lines.push("## Headline Metrics");
  lines.push("");
  lines.push(`- Yoruba route tree exists: ${report.routeTreeExists ? "yes" : "no"}`);
  lines.push(`- Yoruba routes scanned: ${counts.routesScanned}`);
  lines.push(`- Clean routes: ${counts.cleanRoutes}`);
  lines.push(`- Routes with blockers: ${counts.routesWithBlockers}`);
  lines.push(`- BLOCKER_VISIBLE_ENGLISH findings: ${counts.blockers}`);
  lines.push(`- POSSIBLE_FALSE_POSITIVE findings: ${counts.possibleFalsePositives}`);
  lines.push(`- ACCEPTED_TECH_TERM findings: ${counts.acceptedTechTerms}`);
  lines.push("");
  lines.push("## Top 20 Blocker Routes");
  lines.push("");
  lines.push("| Rank | Route | Blockers | Suggested owner batch |");
  lines.push("|---:|---|---:|---|");
  topRoutes.slice(0, 20).forEach((row, index) => {
    lines.push(`| ${index + 1} | \`${row.route}\` | ${row.blockers} | ${row.suggestedOwnerBatch} |`);
  });
  if (!topRoutes.length) lines.push("| - | No blocker routes found | 0 | - |");
  lines.push("");
  lines.push("## BLOCKER_VISIBLE_ENGLISH");
  lines.push("");
  lines.push("| Route | Line | Reason | Snippet | Owner batch |");
  lines.push("|---|---:|---|---|---|");
  report.groups.BLOCKER_VISIBLE_ENGLISH.slice(0, 200).forEach((finding) => {
    lines.push(`| \`${finding.route}\` | ${finding.line} | ${escapeMd(finding.reason)} | ${escapeMd(finding.snippet)} | ${escapeMd(finding.suggestedOwnerBatch)} |`);
  });
  if (report.groups.BLOCKER_VISIBLE_ENGLISH.length > 200) {
    lines.push(`| ... | ... | ... | ${report.groups.BLOCKER_VISIBLE_ENGLISH.length - 200} more blocker findings in JSON ledger | ... |`);
  }
  if (!report.groups.BLOCKER_VISIBLE_ENGLISH.length) lines.push("| - | - | No blocker findings | - | - |");
  lines.push("");
  lines.push("## POSSIBLE_FALSE_POSITIVE");
  lines.push("");
  lines.push("| Route | Line | Reason | Snippet | Owner batch |");
  lines.push("|---|---:|---|---|---|");
  report.groups.POSSIBLE_FALSE_POSITIVE.slice(0, 120).forEach((finding) => {
    lines.push(`| \`${finding.route}\` | ${finding.line} | ${escapeMd(finding.reason)} | ${escapeMd(finding.snippet)} | ${escapeMd(finding.suggestedOwnerBatch)} |`);
  });
  if (!report.groups.POSSIBLE_FALSE_POSITIVE.length) lines.push("| - | - | No possible false positives | - | - |");
  lines.push("");
  lines.push("## ACCEPTED_TECH_TERM");
  lines.push("");
  lines.push(`Accepted terms: ${ACCEPTED_TECH_TERMS.map((term) => `\`${term}\``).join(", ")}.`);
  lines.push("");
  lines.push("The JSON ledger contains line-level accepted-term examples. These are tracked so future cleanup prompts do not waste time translating normal acronyms.");
  lines.push("");
  lines.push("## CLEAN");
  lines.push("");
  report.groups.CLEAN.forEach((row) => {
    lines.push(`- \`${row.route}\``);
  });
  if (!report.groups.CLEAN.length) lines.push("- No fully clean routes in this pass.");
  lines.push("");
  lines.push("## Recommended Cleanup Order");
  lines.push("");
  report.recommendedCleanupOrder.forEach((row, index) => {
    lines.push(`${index + 1}. ${row}`);
  });
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- `ojú ìwé Gẹẹsi` labels are treated as possible false positives because Yoruba shell links can intentionally disclose English fallback routes.");
  lines.push("- Proper nouns, country names, brand names, and accepted technical acronyms are not blockers by themselves.");
  lines.push("- This report does not edit Yoruba page copy.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildReport() {
  const files = walk(YO_ROOT).sort();
  const groups = {
    BLOCKER_VISIBLE_ENGLISH: [],
    ACCEPTED_TECH_TERM: [],
    POSSIBLE_FALSE_POSITIVE: [],
    CLEAN: [],
  };
  const routeSummaries = [];

  for (const file of files) {
    const route = routeFor(file);
    const html = fs.readFileSync(file, "utf8");
    const findings = [];
    for (const item of visibleLines(html)) {
      findings.push(...classifyLine(route, file, item));
    }
    for (const finding of findings) {
      groups[finding.group].push(finding);
    }
    const blockerCount = findings.filter((finding) => finding.group === "BLOCKER_VISIBLE_ENGLISH").length;
    const possibleCount = findings.filter((finding) => finding.group === "POSSIBLE_FALSE_POSITIVE").length;
    const acceptedCount = findings.filter((finding) => finding.group === "ACCEPTED_TECH_TERM").length;
    const status = blockerCount ? "BLOCKER_VISIBLE_ENGLISH" : possibleCount ? "POSSIBLE_FALSE_POSITIVE" : "CLEAN";
    const summary = {
      route,
      file: rel(file),
      status,
      blockerCount,
      possibleFalsePositiveCount: possibleCount,
      acceptedTechTermCount: acceptedCount,
      suggestedOwnerBatch: ownerBatch(route),
    };
    routeSummaries.push(summary);
    if (status === "CLEAN") groups.CLEAN.push({ route, file: rel(file), suggestedOwnerBatch: ownerBatch(route) });
  }

  const topBlockerRoutes = routeSummaries
    .filter((row) => row.blockerCount)
    .sort((a, b) => b.blockerCount - a.blockerCount || a.route.localeCompare(b.route))
    .map((row) => ({
      route: row.route,
      blockers: row.blockerCount,
      suggestedOwnerBatch: row.suggestedOwnerBatch,
    }));

  const recommendedCleanupOrder = Array.from(new Set(topBlockerRoutes.map((row) => row.suggestedOwnerBatch)))
    .slice(0, 10);

  if (!recommendedCleanupOrder.length) {
    recommendedCleanupOrder.push(files.length
      ? "No blocker cleanup needed from this audit."
      : "Create the first Yoruba route shell batch before visible-copy cleanup.");
  }

  return {
    generatedAt: GENERATED_AT,
    scope: "yo/**/*.html",
    routeTreeExists: fs.existsSync(YO_ROOT),
    exclusions: [
      "script/style/noscript/template/svg/head blocks",
      "JSON-LD and inline data inside ignored blocks",
      "URLs and asset paths",
      "pre/code/kbd/samp code examples",
      "accepted technical acronyms when they appear without other English UI copy",
    ],
    acceptedTechnicalTerms: ACCEPTED_TECH_TERMS,
    counts: {
      routesScanned: files.length,
      cleanRoutes: groups.CLEAN.length,
      routesWithBlockers: routeSummaries.filter((row) => row.blockerCount).length,
      blockers: groups.BLOCKER_VISIBLE_ENGLISH.length,
      possibleFalsePositives: groups.POSSIBLE_FALSE_POSITIVE.length,
      acceptedTechTerms: groups.ACCEPTED_TECH_TERM.length,
    },
    topBlockerRoutes,
    routeSummaries,
    groups,
    recommendedCleanupOrder,
  };
}

function main() {
  const report = buildReport();
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, buildMarkdown(report), "utf8");
  console.log(`Yoruba visible-copy audit scanned ${report.counts.routesScanned} route(s).`);
  console.log(`Yoruba route tree exists: ${report.routeTreeExists ? "yes" : "no"}`);
  console.log(`BLOCKER_VISIBLE_ENGLISH: ${report.counts.blockers}`);
  console.log(`POSSIBLE_FALSE_POSITIVE: ${report.counts.possibleFalsePositives}`);
  console.log(`ACCEPTED_TECH_TERM: ${report.counts.acceptedTechTerms}`);
  console.log(`CLEAN routes: ${report.counts.cleanRoutes}`);
  console.log(`Wrote ${rel(REPORT_JSON)} and ${rel(REPORT_MD)}`);
}

main();
