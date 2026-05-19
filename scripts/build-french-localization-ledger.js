#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { fileToPublicRoute, isRedirectLike } = require("./lib/canonical-aliases");
const { frenchToolSlugToEnglishSource } = require("./lib/french-tool-route-map");
const { frenchTelecomSlugToEnglishSource } = require("./lib/french-telecom-route-map");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const TODAY = new Date().toISOString().slice(0, 10);

const BUILD_SKIP_DIRS = new Set([
  "node_modules", ".git", ".claude", "scripts", "netlify", "lang", "assets",
  "dist", "fr", "sw", "yo", "ha", "docs", "tests", ".github", ".vscode",
  "admin", "dashboard", "pro",
]);

const BUILD_SKIP_FILES = new Set([
  "offline.html", "afrotools-mission-control.html", "style-guide.html",
  "logo-system.html", "404.html", "robots.txt", "sitemap.xml", "sitemap-i18n.xml",
]);

const HREFLANG_SKIP_DIRS = new Set([
  "node_modules", ".git", ".claude", ".codex", ".agents", "assets", "scripts",
  "lang", "data", "supabase", "netlify", ".netlify", "docs", "dist",
  "reports", "output", "test-results",
]);

const COUNTRY_FR_TO_EN = {
  algerie: "algeria",
  cameroun: "cameroon",
  maroc: "morocco",
  tunisie: "tunisia",
  guinee: "guinea",
  rdc: "drc",
  "dr-congo": "drc",
  car: "central-african-republic",
  "eq-guinea": "equatorial-guinea",
  "cabo-verde": "cape-verde",
};

const EXTRA_FR_COUNTRY_TO_EN = {
  tchad: "chad",
  centrafrique: "central-african-republic",
  mauritanie: "mauritania",
  comores: "comoros",
  "cap-vert": "cape-verde",
  "cape-verde": "cape-verde",
  guinea: "guinea",
};

const PAYE_SLUG_MAP = {
  algerie: "algeria/dz-paye",
  benin: "benin/bj-paye",
  "burkina-faso": "burkina-faso/bf-paye",
  burundi: "burundi/bi-paye",
  cameroun: "cameroon/cm-paye",
  centrafrique: "car/cf-paye",
  chad: "chad/td-paye",
  comores: "comoros/km-paye",
  congo: "congo/cg-paye",
  "cote-divoire": "cote-divoire/ci-paye",
  djibouti: "djibouti/dj-paye",
  gabon: "gabon/ga-paye",
  guinee: "guinea/gn-paye",
  madagascar: "madagascar/mg-paye",
  mali: "mali/ml-paye",
  maroc: "morocco/ma-paye",
  mauritanie: "mauritania/mr-paye",
  niger: "niger/ne-paye",
  rdc: "drc",
  senegal: "senegal/sn-paye",
  togo: "togo/tg-paye",
  tunisie: "tunisia/tn-paye",
};

const VAT_SLUG_MAP = {
  algerie: "algeria/dz-vat",
  "burkina-faso": "burkina-faso/bf-vat",
  cameroun: "cameroon/cm-vat",
  congo: "congo/cg-vat",
  "cote-divoire": "cote-divoire/ci-vat",
  gabon: "gabon/ga-vat",
  guinee: "guinea/gn-vat",
  mali: "mali/ml-vat",
  maroc: "morocco/ma-vat",
  niger: "niger/ne-vat",
  rdc: "drc",
  senegal: "senegal/sn-vat",
  togo: "togo/tg-vat",
  tunisie: "tunisia/tn-vat",
};

const COUNTRY_SLUGS = new Set([
  "algeria", "angola", "benin", "botswana", "burkina-faso", "burundi",
  "cabo-verde", "cameroon", "cape-verde", "central-african-republic",
  "chad", "comoros", "congo", "cote-divoire", "djibouti", "dr-congo",
  "drc", "egypt", "eq-guinea", "equatorial-guinea", "eritrea", "eswatini",
  "ethiopia", "gabon", "gambia", "ghana", "guinea", "guinea-bissau",
  "kenya", "lesotho", "liberia", "libya", "madagascar", "malawi", "mali",
  "mauritania", "mauritius", "morocco", "mozambique", "namibia", "niger",
  "nigeria", "rwanda", "sao-tome", "senegal", "seychelles", "sierra-leone",
  "somalia", "south-africa", "south-sudan", "sudan", "tanzania", "togo",
  "tunisia", "uganda", "zambia", "zimbabwe", "algerie", "cameroun",
  "maroc", "tunisie", "guinee", "rdc", "tchad", "centrafrique",
  "mauritanie", "comores", "cap-vert",
]);

const SECTION_NAMES = [
  "tools",
  "cars",
  "agriculture",
  "blog",
  "salary-tax",
  "vat-business-tax",
  "document-pdf",
  "widgets",
  "pro",
  "auth",
  "telecom",
  "country hubs",
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function safeRead(filePath) {
  try {
    return read(filePath);
  } catch {
    return "";
  }
}

function walk(dir, options = {}, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (options.skipDirs && options.skipDirs.has(entry.name)) continue;
      walk(full, options, out);
      continue;
    }
    if ((!options.ext || entry.name.endsWith(options.ext)) && !(options.skipFiles && options.skipFiles.has(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function normalizeRoute(value) {
  if (!value) return "/";
  let route = value;
  try {
    if (/^https?:/i.test(route)) route = new URL(route).pathname;
  } catch {
    return value;
  }
  route = route.split("#")[0].split("?")[0];
  if (!route.startsWith("/")) route = `/${route}`;
  route = route.replace(/\/index\/?$/i, "/").replace(/\/index\.html$/i, "/");
  if (route !== "/" && route.endsWith("/")) route = route.slice(0, -1);
  return route || "/";
}

function buildFrenchRedirectSourceRoutes() {
  const redirectsPath = path.join(ROOT, "_redirects");
  const sources = new Set();
  if (!fs.existsSync(redirectsPath)) return sources;

  for (const raw of fs.readFileSync(redirectsPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("[[redirects]]")) continue;
    const [source, target, status] = line.split(/\s+/);
    if (!source || !target || !status) continue;
    if (!source.startsWith("/fr/")) continue;
    if (!/^(?:301|302|307|308)!?$/.test(status)) continue;
    sources.add(normalizeRoute(source));
  }

  return sources;
}

function sourceKey(pagePath) {
  let clean = (pagePath || "").replace(/^\//, "").replace(/\/$/, "");
  if (clean === "index" || clean === "index.html") clean = "";
  return clean;
}

function routeToSource(route) {
  const normalized = normalizeRoute(route);
  if (normalized === "/") return "";
  return normalized.slice(1);
}

function publicRoute(filePath) {
  return normalizeRoute(fileToPublicRoute(filePath));
}

function extractAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? match[1] : "";
}

function extractCanonical(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (/rel=["']canonical["']/i.test(tag)) return extractAttr(tag, "href");
  }
  return "";
}

function extractHreflangs(html) {
  return (html.match(/<link\b[^>]*rel=["']alternate["'][^>]*>/gi) || [])
    .map((tag) => ({ lang: extractAttr(tag, "hreflang"), href: extractAttr(tag, "href") }))
    .filter((item) => item.lang && item.href);
}

function extractHtmlLang(html) {
  const match = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

function hasNoindex(html) {
  const match = html.match(/<meta\s[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  return Boolean(match && /(^|,|\s)noindex($|,|\s)/i.test(match[1]));
}

function textOf(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match
    ? match[1].replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function discoverSourcePages(dir, basePath = "") {
  const pages = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (BUILD_SKIP_DIRS.has(entry.name)) continue;
      pages.push(...discoverSourcePages(path.join(dir, entry.name), `${basePath}${entry.name}/`));
    } else if (entry.name.endsWith(".html") && !BUILD_SKIP_FILES.has(entry.name)) {
      pages.push(entry.name === "index.html" ? basePath || "/" : `${basePath}${entry.name.replace(/\.html$/, "")}`);
    }
  }
  return pages.map(sourceKey);
}

function resolveSourceFile(pagePath) {
  const clean = sourceKey(pagePath);
  if (clean === "") return path.join(ROOT, "index.html");
  const indexPath = path.join(ROOT, clean, "index.html");
  if (fs.existsSync(indexPath)) return indexPath;
  const htmlPath = path.join(ROOT, `${clean}.html`);
  if (fs.existsSync(htmlPath)) return htmlPath;
  const rawPath = path.join(ROOT, clean);
  if (fs.existsSync(rawPath) && fs.statSync(rawPath).isFile()) return rawPath;
  return null;
}

function buildOutputPath(pagePath, lang) {
  const clean = sourceKey(pagePath);
  if (clean === "") return path.join(ROOT, lang, "index.html");
  const dirPath = path.join(ROOT, lang, clean);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isFile()) {
    return path.join(ROOT, lang, clean.replace(/\.html$/, ""), "index.html");
  }
  const sourcePath = resolveSourceFile(clean);
  if (sourcePath && !sourcePath.endsWith("index.html") && sourcePath.endsWith(".html")) {
    return path.join(ROOT, lang, `${clean}.html`);
  }
  return path.join(ROOT, lang, clean, "index.html");
}

function discoverPageTranslations(lang) {
  const output = new Set();
  const base = path.join(ROOT, "lang", "pages");
  if (!fs.existsSync(base)) return output;
  for (const filePath of walk(base, { ext: ".json" })) {
    if (path.basename(filePath) === `${lang}.json`) {
      output.add(path.relative(base, path.dirname(filePath)).replace(/\\/g, "/"));
    }
  }
  return output;
}

function loadRegistry() {
  const code = read(path.join(ROOT, "assets/js/components/tool-registry.js"));
  const context = { console };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.AFRO_TOOLS || [];
}

function addCandidate(candidates, source, evidence) {
  const clean = sourceKey(source);
  candidates.push({ source: clean, evidence, exists: Boolean(resolveSourceFile(clean)) });
}

function hasEnglishSource(source) {
  return source !== null && source !== undefined;
}

function inferFrenchSourceCandidates(filePath) {
  const relative = rel(filePath).replace(/^fr\//, "");
  const html = safeRead(filePath);
  const candidates = [];
  if (relative === "index.html") addCandidate(candidates, "", "fr-root");

  const parts = relative.split("/");
  const first = parts[0] || "";
  const firstEn = COUNTRY_FR_TO_EN[first] || EXTRA_FR_COUNTRY_TO_EN[first] || first;
  const fileBase = parts.length >= 2 ? parts[1].replace(/\.html$/, "") : null;

  if (first === "tools" && fileBase) {
    const mappedToolSource = frenchToolSlugToEnglishSource(fileBase);
    if (mappedToolSource) addCandidate(candidates, mappedToolSource, "fr-tool-slug-map");
  }
  if (first === "telecom" && fileBase) {
    const mappedTelecomSource = frenchTelecomSlugToEnglishSource(fileBase);
    if (mappedTelecomSource) addCandidate(candidates, mappedTelecomSource, "fr-telecom-slug-map");
  }

  if (fileBase === "calculateur-salaire-net" && PAYE_SLUG_MAP[first]) addCandidate(candidates, PAYE_SLUG_MAP[first], "build-i18n-paye-slug-map");
  if (fileBase === "calculateur-tva" && VAT_SLUG_MAP[first]) addCandidate(candidates, VAT_SLUG_MAP[first], "build-i18n-vat-slug-map");
  if (first === "eq-guinea" && fileBase === "gq-paye") addCandidate(candidates, "eq-guinea/gq-paye", "eq-guinea-tax-slug-map");
  if (first === "eq-guinea" && fileBase === "gq-vat") addCandidate(candidates, "eq-guinea/gq-vat", "eq-guinea-tax-slug-map");

  if (COUNTRY_FR_TO_EN[first]) {
    const rest = parts.slice(1).join("/").replace(/\.html$/, "").replace(/\/index$/, "");
    addCandidate(candidates, firstEn + (rest ? `/${rest}` : ""), "build-i18n-country-map");
  } else {
    const direct = relative.replace(/\.html$/, "").replace(/\/index$/, "");
    addCandidate(candidates, direct === "index" ? "" : direct, "build-i18n-direct-match");
  }

  const isEqGuineaTaxRoute = first === "eq-guinea" && (parts[1] === "gq-paye" || parts[1] === "gq-vat");
  if (!isEqGuineaTaxRoute && parts.length === 3 && parts[2] === "index.html") addCandidate(candidates, `${firstEn}/${parts[1]}`, "build-i18n-dir-style-index");

  const enTag = extractHreflangs(html).find((item) => item.lang === "en");
  if (enTag) addCandidate(candidates, routeToSource(enTag.href), "hreflang-en");

  const canonical = extractCanonical(html);
  if (canonical && !normalizeRoute(canonical).startsWith("/fr/")) addCandidate(candidates, routeToSource(canonical), "canonical-en");

  if (fileBase === "calculateur-salaire-net") {
    const mapped = Object.entries(PAYE_SLUG_MAP).find(([country]) => (COUNTRY_FR_TO_EN[country] || EXTRA_FR_COUNTRY_TO_EN[country] || country) === firstEn);
    if (mapped) addCandidate(candidates, mapped[1], "semantic-paye-slug-map");
  }
  if (fileBase === "calculateur-tva") {
    const mapped = Object.entries(VAT_SLUG_MAP).find(([country]) => (COUNTRY_FR_TO_EN[country] || EXTRA_FR_COUNTRY_TO_EN[country] || country) === firstEn);
    if (mapped) addCandidate(candidates, mapped[1], "semantic-vat-slug-map");
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.source}|${candidate.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function englishLeakageSignals(html) {
  const title = textOf(html, "title");
  const h1 = textOf(html, "h1");
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const controlText = [];
  const controlRe = /<(button|label|option|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = controlRe.exec(body)) && controlText.length < 80) {
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) controlText.push(text);
  }
  const attrRe = /(placeholder|aria-label|title)=["']([^"']{3,120})["']/gi;
  while ((match = attrRe.exec(body)) && controlText.length < 120) controlText.push(match[2].trim());

  const englishRe = /\b(Calculator|Tools|Search|Calculate|Upload|Download|Results?|Salary|Tax|Business|Country|Countries|Price|Cost|Loan|Mortgage|Cars?|Blog|Dashboard|Sign in|Login|Email|Password|Continue|Save|Start|Get started|Compare|Learn more|Try|Free|Submit|Reset|Open|Copy|Share|Loading|No results|All categories|More categories|Featured|Popular)\b/i;
  const titleEnglish = englishRe.test(title);
  const h1English = englishRe.test(h1);
  const uiHits = [...new Set(controlText.filter((text) => englishRe.test(text)).slice(0, 8))];
  return { title, h1, titleEnglish, h1English, uiHits };
}

function sectionFlags(route, source) {
  const normalized = normalizeRoute(route);
  const sourceRoute = sourceKey(source || routeToSource(normalized));
  const withoutFr = normalized.replace(/^\/fr\/?/, "/");
  const countryRoute = normalized.replace(/^\/fr\//, "").replace(/^\//, "").replace(/\/$/, "");
  return {
    tools: /^\/fr\/tools(\/|$)/.test(normalized) || /^\/tools(\/|$)/.test(withoutFr) || /^tools\//.test(sourceRoute),
    cars: /^\/fr\/(cars|car)(\/|$)/.test(normalized) || /^(cars|car)(\/|$)/.test(sourceRoute),
    agriculture: /^\/fr\/agriculture(\/|$)/.test(normalized) || /^agriculture(\/|$)/.test(sourceRoute),
    blog: /^\/fr\/blog(\/|$)/.test(normalized) || /^blog(\/|$)/.test(sourceRoute),
    "salary-tax": /^\/fr\/salary-tax(\/|$)/.test(normalized) || /^salary-tax(\/|$)/.test(sourceRoute) || /(^|\/)([a-z]{2}-)?paye($|\/)/i.test(sourceRoute) || /calculateur-salaire-net|salaire/i.test(normalized),
    "vat-business-tax": /^\/fr\/vat-business-tax(\/|$)/.test(normalized) || /^vat-business-tax(\/|$)/.test(sourceRoute) || /(^|\/)([a-z]{2}-)?vat($|\/)/i.test(sourceRoute) || /calculateur-tva|tva/i.test(normalized),
    "document-pdf": /^\/fr\/document-pdf(\/|$)/.test(normalized) || /^document-pdf(\/|$)/.test(sourceRoute),
    widgets: /^\/fr\/widgets(\/|$)/.test(normalized) || /^widgets(\/|$)/.test(sourceRoute),
    pro: /^\/fr\/pro(\/|$)/.test(normalized) || /^pro(\/|$)/.test(sourceRoute),
    auth: /^\/fr\/auth(\/|$)/.test(normalized) || /^auth(\/|$)/.test(sourceRoute),
    telecom: /^\/fr\/telecom(\/|$)/.test(normalized) || /^telecom(\/|$)/.test(sourceRoute),
    "country hubs": COUNTRY_SLUGS.has(countryRoute) || COUNTRY_SLUGS.has(sourceRoute),
  };
}

function sectionsFor(route, source) {
  return Object.entries(sectionFlags(route, source)).filter(([, value]) => value).map(([name]) => name);
}

function isFrenchWidgetParentRoute(route) {
  const normalized = normalizeRoute(route);
  return /^\/fr\/widgets\/[^/]+$/.test(normalized)
    && normalized !== "/fr/widgets/demo"
    && !normalized.startsWith("/fr/widgets/iframe");
}

function isRegistryEligible(routeRecord) {
  if (routeRecord.classification.alias || routeRecord.redirectLike || routeRecord.redirectSource || routeRecord.hasNoindex) {
    return false;
  }

  return routeRecord.route.startsWith("/fr/tools/")
    || routeRecord.classification.sections.includes("salary-tax")
    || routeRecord.classification.sections.includes("vat-business-tax")
    || routeRecord.classification.sections.includes("document-pdf");
}

function percent(numerator, denominator) {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function examples(items, limit = 8) {
  return items.slice(0, limit).map((item) => {
    if (typeof item === "string") return item;
    return item.route || item.href || item.canonical || item.englishSource || JSON.stringify(item);
  });
}

function main() {
  const sourcePages = discoverSourcePages(ROOT);
  const sourceSet = new Set(sourcePages);
  const frTranslations = discoverPageTranslations("fr");

  const htmlFiles = walk(ROOT, { ext: ".html", skipDirs: HREFLANG_SKIP_DIRS });
  const fileByRoute = new Map();
  const htmlByRoute = new Map();
  for (const filePath of htmlFiles) {
    const route = publicRoute(filePath);
    fileByRoute.set(route, filePath);
    htmlByRoute.set(route, safeRead(filePath));
  }

  const registry = loadRegistry();
  const frRegistry = registry.filter((tool) => tool.lang === "fr");
  const registryByHref = new Map();
  for (const tool of frRegistry) {
    const href = normalizeRoute(tool.href || "");
    if (!registryByHref.has(href)) registryByHref.set(href, []);
    registryByHref.get(href).push({ id: tool.id, name: tool.name, category: tool.category, href: tool.href, status: tool.status });
  }
  const registryHrefSet = new Set(registryByHref.keys());

  const routes = [];
  const frenchRoutes = new Set();
  const englishToFrenchRoutes = new Map();
  const canonicalGroups = new Map();
  const redirectSourceRoutes = buildFrenchRedirectSourceRoutes();

  for (const filePath of walk(path.join(ROOT, "fr"), { ext: ".html" })) {
    const route = publicRoute(filePath);
    const html = safeRead(filePath);
    const candidates = inferFrenchSourceCandidates(filePath);
    const backedCandidates = candidates.filter((candidate) => candidate.exists && sourceSet.has(candidate.source));
    let chosen = backedCandidates.find((candidate) => candidate.evidence === "hreflang-en") || backedCandidates[0] || null;
    if (chosen && chosen.source === "" && route !== "/fr") chosen = null;
    const englishSource = chosen ? chosen.source : null;
    const canonicalRoute = extractCanonical(html) ? normalizeRoute(extractCanonical(html)) : null;
    const isAlias = Boolean(canonicalRoute && canonicalRoute !== route);
    const mappedToEnglishSource = hasEnglishSource(englishSource);
    const hasPack = Boolean(mappedToEnglishSource && frTranslations.has(englishSource));
    const standardGenerated = Boolean(mappedToEnglishSource && publicRoute(buildOutputPath(englishSource, "fr")) === route);
    const generatedFrenchWidgetParent = isFrenchWidgetParentRoute(route);
    const redirectLike = isRedirectLike(html);
    const redirectSource = redirectSourceRoutes.has(route);
    const sourceOfTruth = [];
    if (redirectSource) sourceOfTruth.push("redirect alias in _redirects");
    if (redirectLike) sourceOfTruth.push("HTML redirect alias");
    if (hasPack) sourceOfTruth.push("lang/pages fr.json");
    if (registryByHref.has(route)) sourceOfTruth.push("tool-registry.js");
    if (generatedFrenchWidgetParent) sourceOfTruth.push("scripts/generate-fr-widget-parent-pages.js");
    if (!hasPack && mappedToEnglishSource) sourceOfTruth.push("existing /fr/ HTML");
    if (!sourceOfTruth.length) sourceOfTruth.push("unclear source of truth");

    if (canonicalRoute && !hasNoindex(html) && !redirectLike && !redirectSource) {
      if (!canonicalGroups.has(canonicalRoute)) canonicalGroups.set(canonicalRoute, []);
      canonicalGroups.get(canonicalRoute).push(route);
    }

    if (mappedToEnglishSource && !hasNoindex(html) && !redirectLike && !redirectSource) {
      if (!englishToFrenchRoutes.has(englishSource)) englishToFrenchRoutes.set(englishSource, []);
      englishToFrenchRoutes.get(englishSource).push(route);
    }

    const leakage = englishLeakageSignals(html);
    const record = {
      route,
      file: rel(filePath),
      canonical: canonicalRoute,
      title: leakage.title,
      h1: leakage.h1,
      classification: {
        mapping: redirectSource || isAlias ? "duplicate or alias route" : (mappedToEnglishSource ? "English-backed mapped route" : "French-only route"),
        generation: hasPack || standardGenerated || generatedFrenchWidgetParent ? "generated output" : "hand-authored French page",
        alias: redirectSource || isAlias,
        sourceOfTruth,
        sections: sectionsFor(route, englishSource),
      },
      englishSource,
      mappingEvidence: candidates,
      registryEntries: registryByHref.get(route) || [],
      englishLeakage: {
        titleEnglish: leakage.titleEnglish,
        h1English: leakage.h1English,
        uiHits: leakage.uiHits,
      },
      htmlLang: extractHtmlLang(html) || null,
      hasNoindex: hasNoindex(html),
      redirectLike,
      redirectSource,
    };
    frenchRoutes.add(route);
    routes.push(record);
  }

  const routeRecordByRoute = new Map(routes.map((route) => [route.route, route]));

  const duplicateFrenchCanonicals = [...canonicalGroups.entries()]
    .filter(([canonical, groupedRoutes]) => canonical.startsWith("/fr/") && groupedRoutes.length > 1)
    .map(([canonical, groupedRoutes]) => ({ canonical, routes: groupedRoutes.sort(), count: groupedRoutes.length }))
    .sort((a, b) => b.count - a.count || a.canonical.localeCompare(b.canonical));

  const missingReciprocalHreflang = [];
  for (const route of frenchRoutes) {
    const sourceRecord = routeRecordByRoute.get(route);
    if (sourceRecord && sourceRecord.redirectSource) continue;
    const html = htmlByRoute.get(route) || "";
    if (!html || hasNoindex(html)) continue;
    for (const tag of extractHreflangs(html).filter((item) => item.lang !== "x-default")) {
      const targetRoute = normalizeRoute(tag.href);
      if (targetRoute === route) continue;
      const targetHtml = htmlByRoute.get(targetRoute);
      if (!targetHtml || hasNoindex(targetHtml)) continue;
      const hasBackRef = extractHreflangs(targetHtml).some((item) => item.lang === "fr" && normalizeRoute(item.href) === route);
      if (!hasBackRef) {
        missingReciprocalHreflang.push({
          source: route,
          target: targetRoute,
          targetLang: tag.lang,
          targetFile: fileByRoute.has(targetRoute) ? rel(fileByRoute.get(targetRoute)) : null,
        });
      }
    }
  }

  const englishLeakage = routes
    .filter((route) => !route.redirectSource && !(route.hasNoindex && route.redirectLike))
    .filter((route) => route.englishLeakage.titleEnglish || route.englishLeakage.h1English || route.englishLeakage.uiHits.length)
    .map((route) => ({
      route: route.route,
      file: route.file,
      title: route.title,
      h1: route.h1,
      titleEnglish: route.englishLeakage.titleEnglish,
      h1English: route.englishLeakage.h1English,
      uiHits: route.englishLeakage.uiHits,
    }))
    .sort((a, b) => (Number(b.titleEnglish) + Number(b.h1English) + b.uiHits.length) - (Number(a.titleEnglish) + Number(a.h1English) + a.uiHits.length));

  const registryEligible = routes.filter(isRegistryEligible);
  const frenchPagesNotRepresentedInRegistry = registryEligible
    .filter((route) => !registryHrefSet.has(route.route))
    .map((route) => ({ route: route.route, file: route.file, sections: route.classification.sections, englishSource: route.englishSource, title: route.title }))
    .sort((a, b) => a.route.localeCompare(b.route));

  const registryEntriesPointingToMissingFrenchRoutes = [];
  const registryEntriesPointingToNonPreferredFrenchRoutes = [];
  const registryDuplicateHrefs = [];
  for (const [href, entries] of registryByHref) {
    if (entries.length > 1) registryDuplicateHrefs.push({ href, entries });
    const filePath = fileByRoute.get(href);
    if (!filePath) {
      registryEntriesPointingToMissingFrenchRoutes.push({ href, entries });
      continue;
    }
    const html = htmlByRoute.get(href) || safeRead(filePath);
    const canonical = extractCanonical(html);
    const preferred = canonical ? normalizeRoute(canonical) : href;
    if (preferred && preferred !== href) {
      registryEntriesPointingToNonPreferredFrenchRoutes.push({ href, preferred, file: rel(filePath), entries });
    }
  }

  const englishBackedRoutes = routes.filter((route) => hasEnglishSource(route.englishSource));
  const frenchOnlyRoutes = routes.filter((route) => !route.englishSource && route.classification.mapping === "French-only route");
  const generatedOutputRoutes = routes.filter((route) => route.classification.generation === "generated output");
  const handAuthoredFrenchPages = routes.filter((route) => route.classification.generation === "hand-authored French page");
  const unclearSourceRoutes = routes.filter((route) => route.classification.sourceOfTruth.includes("unclear source of truth"));
  const aliasRoutes = routes.filter((route) => route.classification.alias || route.classification.mapping === "duplicate or alias route");
  const mappedEnglishCount = new Set(englishBackedRoutes.map((route) => route.englishSource)).size;

  const duplicateEnglishMappings = [...englishToFrenchRoutes.entries()]
    .filter(([, frRoutes]) => frRoutes.length > 1)
    .map(([englishSource, frRoutes]) => ({ englishSource, frRoutes: frRoutes.sort(), count: frRoutes.length }))
    .sort((a, b) => b.count - a.count || a.englishSource.localeCompare(b.englishSource));

  const englishSourcesWithoutMappedFrenchRoute = sourcePages.filter((source) => !englishToFrenchRoutes.has(source)).sort();

  const sections = {};
  for (const name of SECTION_NAMES) {
    const englishSources = sourcePages.filter((source) => sectionFlags(`/${source}`, source)[name]);
    const frenchSectionRoutes = routes.filter((route) => route.classification.sections.includes(name));
    const mappedSources = new Set(frenchSectionRoutes.filter((route) => hasEnglishSource(route.englishSource)).map((route) => route.englishSource));
    const eligible = frenchSectionRoutes.filter(isRegistryEligible);
    const covered = eligible.filter((route) => registryHrefSet.has(route.route));
    sections[name] = {
      englishSourcePages: englishSources.length,
      frenchPages: frenchSectionRoutes.length,
      englishBackedFrenchPages: frenchSectionRoutes.filter((route) => hasEnglishSource(route.englishSource)).length,
      uniqueEnglishSourcesMapped: mappedSources.size,
      rawCoveragePercent: percent(frenchSectionRoutes.length, englishSources.length),
      mappedCoveragePercent: percent(mappedSources.size, englishSources.length),
      registryEligibleFrenchPages: eligible.length,
      registryCoveredFrenchPages: covered.length,
      registryCoveragePercent: percent(covered.length, eligible.length),
    };
  }

  const sectionBlockers = SECTION_NAMES.map((name) => {
    const section = sections[name];
    if (!section.englishSourcePages && !section.frenchPages) return null;
    if (section.englishSourcePages && section.uniqueEnglishSourcesMapped === 0) {
      return {
        issue: `${name} has no English-backed French route coverage`,
        count: section.englishSourcePages,
        examples: sourcePages.filter((source) => sectionFlags(`/${source}`, source)[name]).slice(0, 8),
        recommendation: `Create a discovery-only ${name} source/route map before translating this section.`,
      };
    }
    if (section.englishSourcePages && section.mappedCoveragePercent !== null && section.mappedCoveragePercent < 30) {
      return {
        issue: `${name} mapped French coverage is below 30%`,
        count: section.englishSourcePages - section.uniqueEnglishSourcesMapped,
        examples: sourcePages.filter((source) => sectionFlags(`/${source}`, source)[name] && !englishToFrenchRoutes.has(source)).slice(0, 8),
        recommendation: `Prioritize canonical route selection and registry wiring for the highest-value ${name} pages before copy translation.`,
      };
    }
    if (section.rawCoveragePercent !== null && section.mappedCoveragePercent !== null && section.rawCoveragePercent - section.mappedCoveragePercent > 20) {
      return {
        issue: `${name} raw French count materially exceeds mapped coverage`,
        count: Math.max(0, section.frenchPages - section.uniqueEnglishSourcesMapped),
        examples: routes.filter((route) => route.classification.sections.includes(name) && !route.englishSource).slice(0, 8).map((route) => route.route),
        recommendation: `Resolve ${name} aliases and French-only routes before using raw page volume as completion evidence.`,
      };
    }
    if (section.registryEligibleFrenchPages && section.registryCoveragePercent !== null && section.registryCoveragePercent < 50) {
      return {
        issue: `${name} French registry discovery is below 50%`,
        count: section.registryEligibleFrenchPages - section.registryCoveredFrenchPages,
        examples: frenchPagesNotRepresentedInRegistry.filter((route) => route.sections.includes(name)).slice(0, 8).map((route) => route.route),
        recommendation: `After route truth is settled, add or repoint ${name} French registry entries so search/cards can find the pages.`,
      };
    }
    return null;
  }).filter(Boolean);

  const blockers = [
    {
      issue: "French pages with no English-backed source mapping",
      count: frenchOnlyRoutes.length,
      examples: examples(frenchOnlyRoutes),
      recommendation: "Decide whether each route is intentional French-only content or should be mapped/canonicalized to an English source before translation work expands.",
    },
    {
      issue: "Unclear source-of-truth French routes",
      count: unclearSourceRoutes.length,
      examples: examples(unclearSourceRoutes),
      recommendation: "Assign each route to lang/pages generation, registry, or a hand-authored canonical owner.",
    },
    {
      issue: "French pages with English title/H1/UI labels",
      count: englishLeakage.length,
      examples: examples(englishLeakage),
      recommendation: "Use this as a QA queue after the ledger, starting with money and discovery surfaces.",
    },
    {
      issue: "French registry-eligible pages missing from tool-registry.js",
      count: frenchPagesNotRepresentedInRegistry.length,
      examples: examples(frenchPagesNotRepresentedInRegistry),
      recommendation: "Add or repoint registry entries only after route/source truth is settled.",
    },
    {
      issue: "French registry entries pointing at missing files",
      count: registryEntriesPointingToMissingFrenchRoutes.length,
      examples: registryEntriesPointingToMissingFrenchRoutes.slice(0, 8).map((item) => item.href),
      recommendation: "Do not promote these entries until the route exists or the href is corrected.",
    },
    {
      issue: "French registry entries pointing at non-preferred canonical routes",
      count: registryEntriesPointingToNonPreferredFrenchRoutes.length,
      examples: registryEntriesPointingToNonPreferredFrenchRoutes.slice(0, 8).map((item) => `${item.href} -> ${item.preferred}`),
      recommendation: "Repoint registry hrefs to the page canonical, or change canonical only when source truth proves the route should win.",
    },
    {
      issue: "Duplicate French canonical targets",
      count: duplicateFrenchCanonicals.length,
      examples: duplicateFrenchCanonicals.slice(0, 8).map((item) => `${item.canonical} (${item.count})`),
      recommendation: "Collapse aliases or mark bridge pages intentionally before adding translations.",
    },
    {
      issue: "English sources mapped to multiple French routes",
      count: duplicateEnglishMappings.length,
      examples: duplicateEnglishMappings.slice(0, 8).map((item) => `${item.englishSource} (${item.count})`),
      recommendation: "Choose one preferred French URL per English source and demote or redirect the rest.",
    },
    {
      issue: "Missing reciprocal hreflang pairs involving French pages",
      count: missingReciprocalHreflang.length,
      examples: missingReciprocalHreflang.slice(0, 8).map((item) => `${item.source} -> ${item.target}`),
      recommendation: "Fix bidirectional alternates in a targeted hreflang pass after canonical decisions.",
    },
    {
      issue: "French aliases or bridge routes",
      count: aliasRoutes.length,
      examples: examples(aliasRoutes),
      recommendation: "Keep aliases out of registry/search promotion unless they are deliberate bridge pages.",
    },
    {
      issue: "English source pages without a mapped French route",
      count: englishSourcesWithoutMappedFrenchRoute.length,
      examples: englishSourcesWithoutMappedFrenchRoute.slice(0, 8),
      recommendation: "Use high-value section counts to choose the next implementation batch instead of translating randomly.",
    },
    {
      issue: "Generated French outputs with weak registry discovery",
      count: generatedOutputRoutes.filter((route) => isRegistryEligible(route) && !registryHrefSet.has(route.route)).length,
      examples: generatedOutputRoutes.filter((route) => isRegistryEligible(route) && !registryHrefSet.has(route.route)).slice(0, 8).map((route) => route.route),
      recommendation: "For generated tool pages, connect generation output to registry discovery in the same small batch.",
    },
    {
      issue: "Hand-authored French pages that need owner confirmation",
      count: handAuthoredFrenchPages.length,
      examples: handAuthoredFrenchPages.slice(0, 8).map((route) => route.route),
      recommendation: "Treat hand-authored pages as source-sensitive and avoid regeneration until ownership is clear.",
    },
    {
      issue: "French registry duplicate hrefs",
      count: registryDuplicateHrefs.length,
      examples: registryDuplicateHrefs.slice(0, 8).map((item) => item.href),
      recommendation: "Deduplicate registry rows so counts and cards do not drift.",
    },
    ...sectionBlockers,
  ].filter((blocker) => blocker.count > 0).slice(0, 20);

  const recommendedNextImplementationBatch = [
    "Discovery-only canonical decision batch for salary/PAYE and VAT French country routes: choose preferred URLs for normalized calculateur-* routes versus historical cc-paye/cc-vat routes, then document aliases before edits.",
    "Registry repair batch for existing French money/tool routes only: fix missing or non-preferred registry hrefs after canonical decisions, with no translation copy edits.",
    "Hreflang reciprocity batch on the same approved route set: repair en/fr self, x-default, and bidirectional links, then rerun validate:hreflang.",
    "French UI leakage QA batch for top money/discovery pages: title, H1, buttons, placeholders, labels, and app result text, after the route ledger is accepted.",
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    scope: {
      repo: ROOT,
      note: "Audit only. No translated pages were edited. English source inventory uses scripts/build-i18n.js skip dirs/files.",
    },
    totals: {
      englishSourcePages: sourcePages.length,
      frenchPages: routes.length,
      englishBackedFrenchRoutes: englishBackedRoutes.length,
      uniqueEnglishSourcesMapped: mappedEnglishCount,
      frenchOnlyRoutes: frenchOnlyRoutes.length,
      duplicateOrAliasRoutes: aliasRoutes.length,
      generatedOutputRoutes: generatedOutputRoutes.length,
      handAuthoredFrenchPages: handAuthoredFrenchPages.length,
      unclearSourceOfTruthRoutes: unclearSourceRoutes.length,
      rawPageCountCompletionPercent: percent(routes.length, sourcePages.length),
      englishBackedRouteMappingCompletionPercent: percent(mappedEnglishCount, sourcePages.length),
      frenchRegistryEntries: frRegistry.length,
      frenchRegistryExistingHrefEntries: frRegistry.length - registryEntriesPointingToMissingFrenchRoutes.length,
      frenchRegistryEligibleRoutes: registryEligible.length,
      frenchRegistryCoveredEligibleRoutes: registryEligible.length - frenchPagesNotRepresentedInRegistry.length,
      frenchRegistryCoveragePercent: percent(registryEligible.length - frenchPagesNotRepresentedInRegistry.length, registryEligible.length),
    },
    sections,
    findings: {
      duplicateFrenchCanonicals,
      duplicateEnglishMappings,
      missingReciprocalHreflang,
      frenchPagesWithEnglishTitleH1OrUILabels: englishLeakage,
      frenchPagesNotRepresentedInRegistry,
      registryEntriesPointingToNonPreferredFrenchRoutes,
      registryEntriesPointingToMissingFrenchRoutes,
      registryDuplicateHrefs,
      englishSourcesWithoutMappedFrenchRoute,
    },
    top20Blockers: blockers,
    recommendedNextImplementationBatch,
    routes: routes.sort((a, b) => a.route.localeCompare(b.route)),
  };

  const reportsDir = path.join(ROOT, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, "french-localization-ledger.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeMarkdown(report, path.join(reportsDir, "french-localization-ledger.md"));

  console.log(JSON.stringify({
    englishSourcePages: report.totals.englishSourcePages,
    frenchPages: report.totals.frenchPages,
    rawCompletion: report.totals.rawPageCountCompletionPercent,
    mappedCompletion: report.totals.englishBackedRouteMappingCompletionPercent,
    registryCoverage: report.totals.frenchRegistryCoveragePercent,
    blockers: blockers.length,
  }, null, 2));
}

function formatPercent(value) {
  return value === null || value === undefined ? "n/a" : `${value}%`;
}

function writeMarkdown(report, outputPath) {
  const lines = [];
  lines.push("# French Localization Ledger");
  lines.push("");
  lines.push(`Generated: ${TODAY}`);
  lines.push("");
  lines.push("This is an audit-only ledger. It does not translate or edit French pages. English source inventory follows the skip logic in `scripts/build-i18n.js`.");
  lines.push("");
  lines.push("## Headline Metrics");
  lines.push("");
  lines.push(`- Total English source pages: ${report.totals.englishSourcePages}`);
  lines.push(`- Total French pages: ${report.totals.frenchPages}`);
  lines.push(`- Raw page-count completion: ${report.totals.rawPageCountCompletionPercent}%`);
  lines.push(`- English-backed route-mapping completion: ${report.totals.englishBackedRouteMappingCompletionPercent}%`);
  lines.push(`- French registry coverage: ${report.totals.frenchRegistryCoveragePercent}% of registry-eligible French tool/money/PDF routes (${report.totals.frenchRegistryCoveredEligibleRoutes}/${report.totals.frenchRegistryEligibleRoutes})`);
  lines.push(`- French registry entries: ${report.totals.frenchRegistryEntries}`);
  lines.push(`- English-backed French routes: ${report.totals.englishBackedFrenchRoutes}`);
  lines.push(`- French-only routes: ${report.totals.frenchOnlyRoutes}`);
  lines.push(`- Generated output routes: ${report.totals.generatedOutputRoutes}`);
  lines.push(`- Hand-authored French pages: ${report.totals.handAuthoredFrenchPages}`);
  lines.push(`- Unclear source-of-truth routes: ${report.totals.unclearSourceOfTruthRoutes}`);
  lines.push("");
  lines.push("## Coverage By Section");
  lines.push("");
  lines.push("| Section | English source pages | French pages | Unique English mapped | Raw coverage | Mapped coverage | Registry coverage |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const name of SECTION_NAMES) {
    const section = report.sections[name];
    lines.push(`| ${name} | ${section.englishSourcePages} | ${section.frenchPages} | ${section.uniqueEnglishSourcesMapped} | ${formatPercent(section.rawCoveragePercent)} | ${formatPercent(section.mappedCoveragePercent)} | ${formatPercent(section.registryCoveragePercent)} |`);
  }
  lines.push("");
  lines.push("## Top 20 Blockers");
  lines.push("");
  report.top20Blockers.forEach((blocker, index) => {
    lines.push(`${index + 1}. ${blocker.issue} (${blocker.count})`);
    lines.push(`   - Recommendation: ${blocker.recommendation}`);
    lines.push(`   - Examples: ${blocker.examples.length ? blocker.examples.join(", ") : "none"}`);
  });
  lines.push("");
  lines.push("## Finding Counts");
  lines.push("");
  lines.push(`- Duplicate French canonicals: ${report.findings.duplicateFrenchCanonicals.length}`);
  lines.push(`- English sources mapped to multiple French routes: ${report.findings.duplicateEnglishMappings.length}`);
  lines.push(`- Missing reciprocal hreflang pairs involving French pages: ${report.findings.missingReciprocalHreflang.length}`);
  lines.push(`- French pages with English title/H1/UI labels: ${report.findings.frenchPagesWithEnglishTitleH1OrUILabels.length}`);
  lines.push(`- Registry-eligible French pages not represented in registry: ${report.findings.frenchPagesNotRepresentedInRegistry.length}`);
  lines.push(`- Registry entries pointing to non-preferred French routes: ${report.findings.registryEntriesPointingToNonPreferredFrenchRoutes.length}`);
  lines.push(`- Registry entries pointing to missing French routes: ${report.findings.registryEntriesPointingToMissingFrenchRoutes.length}`);
  lines.push("");
  lines.push("## Recommended Next Implementation Batch");
  lines.push("");
  report.recommendedNextImplementationBatch.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Raw page count overstates product readiness because it includes French-only, alias, generated, and hand-authored pages together.");
  lines.push("- The safer completion number is the English-backed route mapping percentage plus registry coverage for tool-discovery surfaces.");
  lines.push("- Detailed per-route classification and full finding lists are in `reports/french-localization-ledger.json`.");
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

main();
