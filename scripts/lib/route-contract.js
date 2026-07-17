"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { fileToPublicRoute } = require("./canonical-aliases");
const { writeFileSyncWithRetry } = require("./safe-write");
const localizationApi = require("./localization-platform");

const ROOT = path.resolve(__dirname, "..", "..");
const POLICY_PATH = path.join(ROOT, "data", "registry", "route-policy.json");
const REDIRECTS_PATH = path.join(ROOT, "_redirects");
const NETLIFY_PATH = path.join(ROOT, "netlify.toml");
const SITE_ORIGIN = "https://afrotools.com";
const MANAGED_START = "# BEGIN CANONICAL ROUTE CONTRACT";
const MANAGED_END = "# END CANONICAL ROUTE CONTRACT";
const PERMANENT_CODES = new Set([301, 308]);
const REDIRECT_CODES = new Set([301, 302, 307, 308]);
const LOCALE_MANIFEST = localizationApi.loadLocaleManifest();
const LOCALE_COVERAGE_POLICY = localizationApi.loadCoveragePolicy();
const LOCALE_CATALOGS = localizationApi.loadCatalogs(LOCALE_MANIFEST);
const LOCALE_ORDER = localizationApi.getPublicLocaleIds(LOCALE_MANIFEST);
const VALID_LOCALES = new Set(LOCALE_ORDER);
const GRAPH_INDEX_CACHE = new WeakMap();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadPolicy() {
  return readJson(POLICY_PATH);
}

function cleanPath(value, options = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  let pathname = raw;
  try {
    const parsed = new URL(raw, SITE_ORIGIN);
    if (parsed.origin !== SITE_ORIGIN && /^https?:/i.test(raw)) return raw;
    pathname = parsed.pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0];
  }
  pathname = pathname.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (options.lowercase) pathname = pathname.toLowerCase();
  return pathname || "/";
}

function normalizeRoute(value) {
  let pathname = cleanPath(value, { lowercase: true });
  if (pathname.endsWith("/index.html")) pathname = pathname.slice(0, -"index.html".length);
  else if (pathname.endsWith(".html")) pathname = pathname.slice(0, -".html".length);
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function redirectMatchKey(value) {
  let pathname = cleanPath(value);
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function absoluteRoute(route) {
  return `${SITE_ORIGIN}${route === "/" ? "/" : route}`;
}

function routeId(state, route, suffix = "") {
  const digest = crypto.createHash("sha1").update(`${state}\0${route}\0${suffix}`).digest("hex").slice(0, 12);
  return `${state}:${digest}`;
}

function walkHtmlFiles(dir = ROOT, out = [], policy = loadPolicy()) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  const excludedDirs = new Set(policy.excludedDirectories || []);
  const excludedFiles = new Set(policy.excludedHtmlFiles || []);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const relDir = path.relative(ROOT, fullPath).replace(/\\/g, "/");
      const rootSegment = relDir.split("/")[0];
      if (!excludedDirs.has(rootSegment)) walkHtmlFiles(fullPath, out, policy);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const rel = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    if (!excludedFiles.has(rel)) out.push(fullPath);
  }
  return out;
}

function walkJavaScriptSourceFiles(dir = path.join(ROOT, "assets", "js"), out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "bundles") walkJavaScriptSourceFiles(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".min.js")) {
      out.push(fullPath);
    }
  }
  return out;
}

function extractTagAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function extractCanonicalTags(html) {
  const tags = [];
  const re = /<link\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const rel = extractTagAttribute(match[0], "rel");
    if (!/(^|\s)canonical(\s|$)/i.test(rel)) continue;
    const href = extractTagAttribute(match[0], "href");
    if (href) tags.push(href);
  }
  return tags;
}

function extractHreflangEntries(html) {
  const entries = [];
  const re = /<link\b[^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const rel = extractTagAttribute(match[0], "rel");
    if (!/(^|\s)alternate(\s|$)/i.test(rel)) continue;
    const lang = extractTagAttribute(match[0], "hreflang");
    const href = extractTagAttribute(match[0], "href");
    if (lang && href) entries.push({ lang: lang.toLowerCase(), href, raw: match[0] });
  }
  return entries;
}

function entriesToHreflangMap(entries) {
  const out = {};
  for (const entry of entries) {
    if (!Object.prototype.hasOwnProperty.call(out, entry.lang)) out[entry.lang] = cleanPath(entry.href);
  }
  return out;
}

function extractHtmlLang(html) {
  const match = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i);
  return match ? match[1].toLowerCase().split("-")[0] : "";
}

function hasNoindex(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return tags.some((tag) => (
    extractTagAttribute(tag, "name").toLowerCase() === "robots" &&
    /\bnoindex\b/i.test(extractTagAttribute(tag, "content"))
  ));
}

function inferLocale(route, html) {
  const htmlLang = extractHtmlLang(html);
  if (VALID_LOCALES.has(htmlLang)) return htmlLang;
  const prefix = cleanPath(route).match(/^\/(fr|sw|yo|ha)(?:\/|$)/i);
  return prefix ? prefix[1].toLowerCase() : "en";
}

function classifyPageType(route, policy) {
  for (const rule of policy.pageTypeRules || []) {
    if (new RegExp(rule.pattern, "i").test(route)) return rule.pageType;
  }
  return "page";
}

function loadCountryRouteRoots() {
  const filePath = path.join(ROOT, "data", "registry", "countries.json");
  if (!fs.existsSync(filePath)) return new Set();
  return new Set(readJson(filePath).map((country) => cleanPath(country.route || `/${country.id}/`).split("/")[1]).filter(Boolean));
}

function sitemapIdForRoute(route, locale, pageType, countryRoots) {
  if (locale === "fr") return "sitemap-fr.xml";
  if (locale === "sw") return "sitemap-sw.xml";
  if (locale === "yo") return "sitemap-yo.xml";
  if (locale === "ha") return "sitemap-ha.xml";
  if (/^\/cars(?:\/|$)/.test(route)) return "sitemap-cars.xml";
  if (/^\/jamb(?:\/|$)/.test(route)) return "jamb/sitemap.xml";
  if (/^\/agriculture(?:\/|$)/.test(route)) return "sitemap-agriculture.xml";
  if (/^\/blog(?:\/|$)/.test(route)) return "sitemap-blog.xml";
  if (/^\/tools(?:\/|$)/.test(route) || pageType === "tool") return "sitemap-tools.xml";
  const first = cleanPath(route).split("/")[1];
  if (pageType === "country-tool" || countryRoots.has(first) || /^(?:car|eq-guinea|countries|african|central-africa|east-africa|north-africa|southern-africa|west-africa)$/.test(first)) {
    return "sitemap-countries.xml";
  }
  return "sitemap-misc.xml";
}

function parseRedirectsFile(filePath = REDIRECTS_PATH) {
  if (!fs.existsSync(filePath)) return [];
  const rules = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const tokens = line.split(/\s+/);
    const statusIndex = tokens.findIndex((token) => /^\d{3}!?$/.test(token));
    if (tokens.length < 2 || statusIndex < 0) return;
    const statusToken = tokens[statusIndex];
    const statusCode = Number.parseInt(statusToken, 10);
    const targetIndex = statusIndex - 1;
    if (targetIndex < 1) return;
    const conditions = {};
    tokens.slice(statusIndex + 1).forEach((token) => {
      const match = token.match(/^([A-Za-z]+)=(.+)$/);
      if (match) conditions[match[1]] = match[2].split(",");
    });
    rules.push({
      id: `redirects:${index + 1}`,
      route: tokens[0],
      target: tokens[targetIndex],
      statusCode,
      force: statusToken.endsWith("!"),
      conditions,
      owner: "_redirects",
      line: index + 1,
      order: index,
      raw
    });
  });
  return rules;
}

function parseTomlObject(line) {
  const out = {};
  const objectMatch = line.match(/\{([\s\S]*)\}/);
  if (!objectMatch) return out;
  const pairRe = /([A-Za-z]+)\s*=\s*\[([^\]]*)\]/g;
  let pair;
  while ((pair = pairRe.exec(objectMatch[1])) !== null) {
    out[pair[1]] = [...pair[2].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
  }
  return out;
}

function parseNetlifyRedirects(filePath = NETLIFY_PATH) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const rules = [];
  let current = null;
  function flush() {
    if (current && current.route && current.target) rules.push(current);
    current = null;
  }
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (line === "[[redirects]]") {
      flush();
      current = {
        id: `netlify:${index + 1}`,
        route: "",
        target: "",
        statusCode: 301,
        force: false,
        conditions: {},
        query: {},
        owner: "netlify.toml",
        line: index + 1,
        order: index,
        raw: []
      };
      return;
    }
    if (!current) return;
    current.raw.push(raw);
    let match = line.match(/^from\s*=\s*["']([^"']+)["']/);
    if (match) current.route = match[1];
    match = line.match(/^to\s*=\s*["']([^"']+)["']/);
    if (match) current.target = match[1];
    match = line.match(/^status\s*=\s*(\d+)/);
    if (match) current.statusCode = Number.parseInt(match[1], 10);
    match = line.match(/^force\s*=\s*(true|false)/i);
    if (match) current.force = match[1].toLowerCase() === "true";
    if (/^conditions\s*=/.test(line)) current.conditions = parseTomlObject(line);
    if (/^query\s*=/.test(line)) current.query = parseTomlObject(line);
  });
  flush();
  return rules;
}

function isPatternRoute(route) {
  return /[*:]/.test(String(route || ""));
}

function ruleState(rule) {
  if (Object.keys(rule.conditions || {}).length || Object.keys(rule.query || {}).length) return "conditional-redirect";
  if (rule.statusCode === 200) return isPatternRoute(rule.route) ? "pattern" : "rewrite";
  if (REDIRECT_CODES.has(rule.statusCode)) return isPatternRoute(rule.route) ? "pattern" : "redirect";
  if (rule.statusCode === 404 || rule.statusCode === 410) return isPatternRoute(rule.route) ? "pattern" : "gone";
  return isPatternRoute(rule.route) ? "pattern" : "rewrite";
}

function policyRules(policy) {
  return (policy.canonicalDecisions || []).map((decision, index) => ({
    id: `policy:${decision.id}`,
    route: decision.source,
    target: decision.destination,
    statusCode: decision.statusCode || 301,
    force: decision.force !== false,
    conditions: {},
    query: {},
    owner: "data/registry/route-policy.json",
    line: index + 1,
    order: index,
    preserveEquity: Boolean(decision.preserveEquity),
    deprecated: true,
    rationale: decision.rationale
  }));
}

function discoverPages(policy) {
  const countryRoots = loadCountryRouteRoots();
  const pages = walkHtmlFiles(ROOT, [], policy).map((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const route = fileToPublicRoute(filePath);
    const locale = inferLocale(route, html);
    const pageType = classifyPageType(route, policy);
    const canonicalTags = extractCanonicalTags(html);
    const canonicalRoute = canonicalTags.length === 1 ? cleanPath(canonicalTags[0], { lowercase: true }) : route;
    const noindex = hasNoindex(html);
    const declaredEntries = extractHreflangEntries(html);
    return {
      id: routeId("page", route),
      route,
      normalizedRoute: normalizeRoute(route),
      state: "page",
      canonicalRoute,
      redirectTarget: null,
      statusCode: 200,
      force: false,
      conditions: {},
      locale,
      pageType,
      indexability: noindex ? "noindex" : "indexable",
      sitemap: {
        included: !noindex,
        sitemapId: !noindex ? sitemapIdForRoute(route, locale, pageType, countryRoots) : null,
        reasons: noindex ? ["noindex"] : []
      },
      equivalenceGroup: null,
      equivalents: {},
      hreflangs: {},
      localeCoverage: null,
      declaredHreflangs: entriesToHreflangMap(declaredEntries),
      declaredHreflangEntries: declaredEntries.map((entry) => ({ lang: entry.lang, href: cleanPath(entry.href) })),
      fallback: null,
      deprecated: false,
      canonicalTags: canonicalTags.map((href) => cleanPath(href, { lowercase: true })),
      source: { owner: rel, file: rel, kind: "html" }
    };
  });
  const byNormalized = new Map();
  for (const page of pages) {
    const list = byNormalized.get(page.normalizedRoute) || [];
    list.push(page);
    byNormalized.set(page.normalizedRoute, list);
  }
  const owned = [];
  for (const group of byNormalized.values()) {
    group.sort((left, right) => {
      const leftDirectory = left.route.endsWith("/") ? 0 : 1;
      const rightDirectory = right.route.endsWith("/") ? 0 : 1;
      return leftDirectory - rightDirectory || left.source.file.localeCompare(right.source.file);
    });
    const owner = group[0];
    if (group.length > 1) owner.source.alternateFiles = group.slice(1).map((page) => page.source.file);
    owned.push(owner);
  }
  return owned;
}

function canonicalAliasRules(pages) {
  return pages
    .filter((page) => (
      page.indexability === "indexable" &&
      page.canonicalTags.length === 1 &&
      normalizeRoute(page.canonicalRoute) !== normalizeRoute(page.route)
    ))
    .map((page, index) => ({
      id: `canonical:${page.id}`,
      route: page.route,
      target: page.canonicalRoute,
      statusCode: 301,
      force: true,
      conditions: {},
      query: {},
      owner: "html-canonical",
      line: index + 1,
      order: index,
      preserveEquity: true,
      deprecated: true,
      sourceFile: page.source.file
    }));
}

function loadRouteSources() {
  const policy = loadPolicy();
  const pages = discoverPages(policy);
  return {
    policy,
    localePolicy: LOCALE_MANIFEST.locales.filter((locale) => VALID_LOCALES.has(locale.id)),
    pages,
    rules: [
      ...policyRules(policy),
      ...canonicalAliasRules(pages),
      ...parseRedirectsFile(),
      ...parseNetlifyRedirects()
    ]
  };
}

function chooseEffectiveRules(rules, pageByMatchKey) {
  const exact = new Map();
  const patterns = [];
  const conditional = [];
  const shadowed = [];
  const conflicts = [];

  for (const rule of rules) {
    const state = ruleState(rule);
    if (state === "conditional-redirect") {
      conditional.push(rule);
      continue;
    }
    if (isPatternRoute(rule.route)) {
      patterns.push(rule);
      continue;
    }
    const key = redirectMatchKey(rule.route);
    const existing = exact.get(key);
    if (existing) {
      if (cleanPath(existing.target) !== cleanPath(rule.target) || existing.statusCode !== rule.statusCode) {
        conflicts.push({ key, effective: existing, shadowed: rule });
      }
      shadowed.push(rule);
      continue;
    }
    const page = pageByMatchKey.get(key);
    if (page && REDIRECT_CODES.has(rule.statusCode) && !rule.force && rule.owner !== "data/registry/route-policy.json" && rule.owner !== "html-canonical") {
      shadowed.push({ ...rule, shadowedByFile: page.source.file });
      continue;
    }
    exact.set(key, rule);
  }

  return { exact, patterns, conditional, shadowed, conflicts };
}

function makeRuleRecord(rule, stateOverride) {
  const state = stateOverride || ruleState(rule);
  const route = cleanPath(rule.route);
  const redirect = state === "redirect" || (state === "pattern" && REDIRECT_CODES.has(rule.statusCode));
  return {
    id: routeId(state, route, `${rule.owner}:${rule.line}`),
    route,
    normalizedRoute: normalizeRoute(route),
    state,
    canonicalRoute: redirect ? cleanPath(rule.target, { lowercase: true }) : null,
    redirectTarget: redirect ? cleanPath(rule.target) : null,
    rewriteTarget: state === "rewrite" || (state === "pattern" && rule.statusCode === 200) ? rule.target : null,
    statusCode: rule.statusCode,
    force: Boolean(rule.force),
    conditions: rule.conditions || {},
    query: rule.query || {},
    locale: inferLocale(route, ""),
    pageType: /^\/api(?:\/|$)|^\/\.netlify\/functions\//.test(route) ? "api" : "route",
    indexability: state === "redirect" ? "redirect" : state === "gone" ? "gone" : state === "conditional-redirect" ? "conditional" : "rewrite",
    sitemap: { included: false, sitemapId: null, reasons: [state] },
    equivalenceGroup: null,
    equivalents: {},
    hreflangs: {},
    declaredHreflangs: {},
    fallback: null,
    deprecated: Boolean(rule.deprecated || state === "redirect" || state === "gone"),
    canonicalTags: [],
    preserveEquity: Boolean(rule.preserveEquity),
    source: { owner: rule.owner, line: rule.line, kind: "routing-rule", rationale: rule.rationale || null }
  };
}

function assignEquivalenceGroups(graph, policy) {
  const pages = graph.routes.filter((record) => record.state === "page" && record.indexability === "indexable");
  const byExact = new Map(pages.map((page) => [cleanPath(page.route), page]));
  const byNormalized = new Map(pages.map((page) => [normalizeRoute(page.route), page]));
  const parent = new Map(pages.map((page) => [page.route, page.route]));
  const explicitByRoute = new Map();

  function find(value) {
    let current = value;
    while (parent.get(current) && parent.get(current) !== current) current = parent.get(current);
    let cursor = value;
    while (parent.get(cursor) && parent.get(cursor) !== current) {
      const next = parent.get(cursor);
      parent.set(cursor, current);
      cursor = next;
    }
    return current;
  }

  function union(left, right) {
    if (!parent.has(left) || !parent.has(right)) return;
    const a = find(left);
    const b = find(right);
    if (a !== b) parent.set(b, a < b ? a : b), parent.set(a, a < b ? a : b);
  }

  function finalPage(route) {
    const resolution = resolveFinalRoute(graph, route);
    return byExact.get(cleanPath(resolution.finalRoute)) || byNormalized.get(normalizeRoute(resolution.finalRoute));
  }

  for (const page of pages) {
    for (const [lang, targetRoute] of Object.entries(page.declaredHreflangs || {})) {
      if (lang === "x-default" || !VALID_LOCALES.has(lang)) continue;
      const target = finalPage(targetRoute);
      if (!target || target.locale !== lang) continue;
      union(page.route, target.route);
    }
  }

  for (const explicit of policy.equivalenceGroups || []) {
    const routes = Object.values(explicit.routes || {}).map((route) => finalPage(route)).filter(Boolean);
    for (let index = 1; index < routes.length; index += 1) union(routes[0].route, routes[index].route);
    for (const route of routes) explicitByRoute.set(route.route, explicit);
  }

  const components = new Map();
  for (const page of pages) {
    const root = find(page.route);
    const list = components.get(root) || [];
    list.push(page);
    components.set(root, list);
  }

  const groups = [];
  for (const component of components.values()) {
    const routes = {};
    for (const page of component.sort((a, b) => a.route.localeCompare(b.route))) {
      if (!routes[page.locale]) routes[page.locale] = page.route;
    }
    const explicit = component.map((page) => explicitByRoute.get(page.route)).find(Boolean);
    if (explicit) {
      for (const [locale, requestedRoute] of Object.entries(explicit.routes || {})) {
        const target = finalPage(requestedRoute);
        if (target && target.locale === locale) routes[locale] = target.route;
      }
    }
    const routeValues = Object.values(routes);
    if (!routeValues.length) continue;
    const xDefault = explicit && explicit.xDefault
      ? (finalPage(explicit.xDefault) || {}).route
      : routes.en || routeValues[0];
    const id = explicit ? explicit.id : `equivalence:${crypto.createHash("sha1").update(routeValues.slice().sort().join("\0")).digest("hex").slice(0, 12)}`;
    const group = { id, routes, xDefault: xDefault || routes.en || routeValues[0] };
    groups.push(group);
    for (const page of component) {
      page.equivalenceGroup = id;
      page.equivalents = { ...routes };
      page.hreflangs = { ...routes, "x-default": group.xDefault };
    }
  }

  graph.equivalenceGroups = groups.sort((a, b) => a.id.localeCompare(b.id));
}

function assignFallbacks(graph, policy) {
  const groupById = new Map(graph.equivalenceGroups.map((group) => [group.id, group]));
  for (const record of graph.routes) {
    const group = groupById.get(record.equivalenceGroup);
    const coverageFallback = record.localeCoverage && record.localeCoverage.fallbackRoute;
    const englishRoute = coverageFallback || (group && group.routes.en
      ? group.routes.en
      : record.locale === "en" && record.state === "page"
        ? record.route
        : (group && group.xDefault) || policy.localeHomes.en || "/");
    record.fallback = {
      type: "english-fallback",
      route: englishRoute,
      labels: { ...(policy.fallbackLabels || {}) },
      advertisedAsEquivalent: false
    };
  }
}

function buildRouteGraph(sourceOverride) {
  const sources = sourceOverride || loadRouteSources();
  const pages = sources.pages.map((page) => JSON.parse(JSON.stringify(page)));
  const pageByMatchKey = new Map(pages.map((page) => [redirectMatchKey(page.route), page]));
  const effective = chooseEffectiveRules(sources.rules, pageByMatchKey);
  const routes = [];

  for (const page of pages) {
    const rule = effective.exact.get(redirectMatchKey(page.route));
    if (rule && REDIRECT_CODES.has(rule.statusCode)) {
      const record = makeRuleRecord(rule, "redirect");
      record.route = page.route;
      record.normalizedRoute = normalizeRoute(page.route);
      record.id = routeId("redirect", page.route, `${rule.owner}:${rule.line}`);
      record.source.file = page.source.file;
      routes.push(record);
      continue;
    }
    if (rule && rule.statusCode === 200) {
      page.deliveryRewrite = { target: rule.target, owner: rule.owner, line: rule.line };
    }
    routes.push(page);
  }

  for (const [key, rule] of effective.exact) {
    if (pageByMatchKey.has(key)) continue;
    routes.push(makeRuleRecord(rule));
  }
  effective.patterns.forEach((rule) => routes.push(makeRuleRecord(rule, "pattern")));
  effective.conditional.forEach((rule) => routes.push(makeRuleRecord(rule, "conditional-redirect")));

  const graph = {
    schemaVersion: sources.policy.schemaVersion,
    siteOrigin: sources.policy.siteOrigin || SITE_ORIGIN,
    routes: routes.sort((a, b) => a.route.localeCompare(b.route) || a.state.localeCompare(b.state) || a.id.localeCompare(b.id)),
    equivalenceGroups: [],
    shadowedRules: effective.shadowed.map((rule) => ({
      route: rule.route,
      target: rule.target,
      statusCode: rule.statusCode,
      owner: rule.owner,
      line: rule.line,
      shadowedByFile: rule.shadowedByFile || null
    })),
    ruleConflicts: effective.conflicts.map((conflict) => ({
      route: conflict.effective.route,
      effectiveTarget: conflict.effective.target,
      effectiveOwner: conflict.effective.owner,
      shadowedTarget: conflict.shadowed.target,
      shadowedOwner: conflict.shadowed.owner
    })),
    policy: {
      localeHomes: sources.policy.localeHomes,
      fallbackLabels: sources.policy.fallbackLabels,
      routeNormalization: sources.policy.routeNormalization
    }
  };

  for (const record of graph.routes) {
    if (record.state !== "page") continue;
    record.localeCoverage = localizationApi.classifyPage(record, LOCALE_COVERAGE_POLICY, LOCALE_MANIFEST, LOCALE_CATALOGS);
    if (record.indexability === "indexable" && !record.localeCoverage.indexableEligible) {
      record.indexability = "noindex";
      record.sitemap = {
        included: false,
        sitemapId: null,
        reasons: [`locale-coverage:${record.localeCoverage.state}`]
      };
    }
  }

  assignEquivalenceGroups(graph, sources.policy);
  assignFallbacks(graph, sources.policy);
  graph.summary = buildRouteReport(graph).summary;
  return graph;
}

function getRouteRecord(graph, route) {
  const exact = cleanPath(route);
  const normalized = normalizeRoute(route);
  let indexes = GRAPH_INDEX_CACHE.get(graph);
  if (!indexes) {
    const byExact = new Map();
    const byNormalized = new Map();
    for (const record of graph.routes) {
      if (isPatternRoute(record.route)) continue;
      const exactKey = cleanPath(record.route);
      const normalizedKey = record.normalizedRoute || normalizeRoute(record.route);
      const exactList = byExact.get(exactKey) || [];
      exactList.push(record);
      byExact.set(exactKey, exactList);
      const normalizedList = byNormalized.get(normalizedKey) || [];
      normalizedList.push(record);
      byNormalized.set(normalizedKey, normalizedList);
    }
    indexes = { byExact, byNormalized };
    GRAPH_INDEX_CACHE.set(graph, indexes);
  }
  const candidates = indexes.byExact.get(exact) || [];
  const preferred = candidates.find((record) => record.state === "page") || candidates.find((record) => record.state !== "conditional-redirect") || candidates[0];
  if (preferred) return preferred;
  const normalizedCandidates = indexes.byNormalized.get(normalized) || [];
  return normalizedCandidates.find((record) => record.state === "page") || normalizedCandidates.find((record) => record.state !== "conditional-redirect") || normalizedCandidates[0] || null;
}

function resolveFinalRoute(graph, route) {
  let current = cleanPath(route);
  const seen = new Set();
  let hops = 0;
  let firstStatus = null;
  let deprecated = false;
  while (hops < 50) {
    const record = getRouteRecord(graph, current);
    if (!record || record.state !== "redirect" || !record.redirectTarget) break;
    if (seen.has(record.normalizedRoute)) break;
    seen.add(record.normalizedRoute);
    if (firstStatus == null) firstStatus = record.statusCode;
    deprecated = deprecated || record.deprecated;
    current = cleanPath(record.redirectTarget);
    hops += 1;
  }
  return { requestedRoute: cleanPath(route), finalRoute: current, hops, statusCode: firstStatus, deprecated };
}

function issue(code, record, field, message) {
  const source = record && record.source ? record.source : {};
  return {
    code,
    routeId: record && record.id ? record.id : String(record && record.route || "unknown"),
    field,
    owner: source.owner || record.owner || "fixture",
    message
  };
}

function formatIssue(item) {
  return `[${item.code}] route:${item.routeId} field=${item.field} owner=${item.owner} - ${item.message}`;
}

function validateRedirectGraph(records) {
  const errors = [];
  const permanent = records.filter((record) => record.state === "redirect" && PERMANENT_CODES.has(Number(record.statusCode)) && !Object.keys(record.conditions || {}).length);
  const byMatch = new Map();
  permanent.forEach((record) => {
    if (!byMatch.has(redirectMatchKey(record.route))) byMatch.set(redirectMatchKey(record.route), record);
    if (redirectMatchKey(record.route) === redirectMatchKey(record.redirectTarget)) {
      errors.push(issue("REDIRECT_NORMALIZED_SELF", record, "redirectTarget", `${record.route} and ${record.redirectTarget} normalize to the same route`));
    }
  });

  for (const record of permanent) {
    const target = byMatch.get(redirectMatchKey(record.redirectTarget));
    if (target) errors.push(issue("REDIRECT_CHAIN", record, "redirectTarget", `${record.route} redirects through ${record.redirectTarget} to ${target.redirectTarget}`));
    const seen = new Set([redirectMatchKey(record.route)]);
    let cursor = record;
    for (let depth = 0; depth < 50; depth += 1) {
      const next = byMatch.get(redirectMatchKey(cursor.redirectTarget));
      if (!next) break;
      const nextKey = redirectMatchKey(next.route);
      if (seen.has(nextKey)) {
        errors.push(issue("REDIRECT_LOOP", record, "redirectTarget", `redirect loop returns to ${next.route}`));
        break;
      }
      seen.add(nextKey);
      cursor = next;
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

function validatePageRecords(records) {
  const errors = [];
  const canonicalClaims = new Map();
  for (const record of records.filter((candidate) => candidate.state === "page")) {
    if (!record.localeCoverage || !record.localeCoverage.state) {
      errors.push(issue("LOCALE_COVERAGE_MISSING", record, "localeCoverage", `${record.route} has no page-level locale coverage record`));
      continue;
    }
    if (!record.localeCoverage.indexableEligible && record.indexability === "indexable") {
      errors.push(issue("LOCALE_COVERAGE_NOT_INDEXABLE", record, "localeCoverage.indexableEligible", `${record.route} is ${record.localeCoverage.state} and cannot be indexable`));
    }
    if (["english-fallback", "unavailable", "deprecated"].includes(record.localeCoverage.state) && record.equivalenceGroup) {
      errors.push(issue("LOCALE_COVERAGE_FALSE_EQUIVALENT", record, "equivalenceGroup", `${record.route} is ${record.localeCoverage.state} and cannot be a hreflang equivalent`));
    }
  }
  for (const record of records.filter((candidate) => candidate.state === "page" && candidate.indexability === "indexable")) {
    if (!Array.isArray(record.canonicalTags) || record.canonicalTags.length === 0) {
      errors.push(issue("CANONICAL_MISSING", record, "canonicalTags", `${record.route} has no canonical tag`));
    } else if (record.canonicalTags.length > 1) {
      errors.push(issue("CANONICAL_MULTIPLE", record, "canonicalTags", `${record.route} has ${record.canonicalTags.length} canonical tags`));
    }
    if (cleanPath(record.canonicalRoute) !== cleanPath(record.route)) {
      errors.push(issue("CANONICAL_NOT_SELF", record, "canonicalRoute", `${record.route} claims ${record.canonicalRoute}`));
    }
    if (/[?#]/.test(String(record.canonicalRoute || ""))) {
      errors.push(issue("CANONICAL_QUERY_OR_FRAGMENT", record, "canonicalRoute", `${record.canonicalRoute} contains a query or fragment`));
    }
    if (String(record.canonicalRoute || "") !== String(record.canonicalRoute || "").toLowerCase()) {
      errors.push(issue("CANONICAL_CASE", record, "canonicalRoute", `${record.canonicalRoute} is not lowercase`));
    }
    const key = normalizeRoute(record.canonicalRoute);
    const claims = canonicalClaims.get(key) || [];
    claims.push(record);
    canonicalClaims.set(key, claims);
  }
  for (const claims of canonicalClaims.values()) {
    const uniqueRoutes = new Set(claims.map((record) => cleanPath(record.route)));
    if (uniqueRoutes.size > 1) {
      claims.forEach((record) => errors.push(issue("CANONICAL_DUPLICATE_CLAIM", record, "canonicalRoute", `${[...uniqueRoutes].join(", ")} claim ${record.canonicalRoute}`)));
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

function validateEquivalenceGroups(groups, records) {
  const errors = [];
  const byExact = new Map(records.map((record) => [cleanPath(record.route), record]));
  const byNormalized = new Map(records.map((record) => [normalizeRoute(record.route), record]));
  const get = (route) => byExact.get(cleanPath(route)) || byNormalized.get(normalizeRoute(route));
  for (const group of groups) {
    const members = Object.entries(group.routes || {});
    if (!group.xDefault) errors.push(issue("HREFLANG_XDEFAULT_MISSING", { id: group.id, route: group.id }, "xDefault", `${group.id} has no x-default`));
    for (const [locale, route] of members) {
      const record = get(route);
      if (!record || record.state !== "page" || record.indexability !== "indexable") {
        errors.push(issue("HREFLANG_TARGET_NOT_INDEXABLE", record || { id: group.id, route, owner: "equivalence-group" }, "routes", `${locale} target ${route} is not an indexable page`));
        continue;
      }
      if (record.locale !== locale) errors.push(issue("HREFLANG_LOCALE_MISMATCH", record, "locale", `${route} is ${record.locale}, not ${locale}`));
      if (cleanPath(record.canonicalRoute) !== cleanPath(record.route)) errors.push(issue("HREFLANG_TARGET_NOT_SELF_CANONICAL", record, "canonicalRoute", `${route} is not self-canonical`));
      const declared = record.declaredHreflangs || record.hreflangs || {};
      for (const [otherLocale, otherRoute] of members) {
        if (cleanPath(declared[otherLocale]) !== cleanPath(otherRoute)) {
          errors.push(issue("HREFLANG_RECIPROCAL_MISSING", record, "hreflangs", `${route} does not reference ${otherLocale} ${otherRoute}`));
        }
      }
      if (cleanPath(declared["x-default"]) !== cleanPath(group.xDefault)) {
        errors.push(issue("HREFLANG_XDEFAULT_MISMATCH", record, "hreflangs", `${route} x-default does not point to ${group.xDefault}`));
      }
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

function loadSitemapEntries(root = ROOT) {
  const entries = [];
  const files = fs.readdirSync(root)
    .filter((name) => /^sitemap.*\.xml$/i.test(name) && !["sitemap.xml", "sitemap-index.xml"].includes(name))
    .map((name) => path.join(root, name));
  const jamb = path.join(root, "jamb", "sitemap.xml");
  if (fs.existsSync(jamb)) files.push(jamb);
  for (const filePath of files) {
    const sitemapId = path.relative(root, filePath).replace(/\\/g, "/");
    const xml = fs.readFileSync(filePath, "utf8");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (!match[1].startsWith(SITE_ORIGIN)) continue;
      entries.push({ sitemapId, route: cleanPath(match[1]) });
    }
  }
  return entries;
}

function validateSitemapEntries(entries, records) {
  const errors = [];
  const graph = { routes: records };
  for (const entry of entries) {
    const record = getRouteRecord(graph, entry.route);
    if (!record) {
      errors.push(issue("SITEMAP_ROUTE_UNKNOWN", { id: entry.route, route: entry.route, owner: entry.sitemapId }, "route", `${entry.route} is not in the route graph`));
      continue;
    }
    if (record.state === "redirect") errors.push(issue("SITEMAP_REDIRECT", record, "sitemap", `${entry.route} in ${entry.sitemapId} redirects to ${record.redirectTarget}`));
    else if (record.state !== "page" || record.indexability !== "indexable") errors.push(issue("SITEMAP_NON_INDEXABLE", record, "sitemap", `${entry.route} in ${entry.sitemapId} is ${record.indexability}`));
    else if (entry.sitemapId !== "sitemap-i18n.xml" && record.sitemap && record.sitemap.sitemapId && record.sitemap.sitemapId !== entry.sitemapId) {
      errors.push(issue("SITEMAP_LOCALE_OR_GROUP_MISMATCH", record, "sitemap.sitemapId", `${entry.route} is in ${entry.sitemapId}, expected ${record.sitemap.sitemapId}`));
    }
    if (/[?#]/.test(entry.route)) errors.push(issue("SITEMAP_QUERY_OR_FRAGMENT", record, "sitemap", `${entry.route} contains a query or fragment`));
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

function loadInternalLinks(graph) {
  const links = [];
  for (const record of graph.routes) {
    if (record.state !== "page" || !record.source || !record.source.file) continue;
    const filePath = path.join(ROOT, record.source.file);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, "utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const re = /<(?:a|area)\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = re.exec(html)) !== null) {
      const href = match[1];
      if (href.startsWith("/") || href.startsWith(SITE_ORIGIN)) links.push({ sourceRoute: record.route, href, sourceFile: record.source.file });
    }
  }
  for (const filePath of walkJavaScriptSourceFiles()) {
    const sourceFile = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const source = fs.readFileSync(filePath, "utf8");
    const re = /\bhref(?:Fr|Sw|Ha|Yo)?\s*(?:=|:)\s*(["'])([^"']+)\1/gi;
    let match;
    while ((match = re.exec(source)) !== null) {
      const href = match[2];
      if (href.startsWith("/") || href.startsWith(SITE_ORIGIN)) links.push({ sourceRoute: `asset:${sourceFile}`, href, sourceFile });
    }
  }
  return links;
}

function validateInternalLinks(links, graph) {
  const errors = [];
  for (const link of links) {
    const href = String(link.href || "");
    let route = href;
    try {
      const parsed = new URL(href, SITE_ORIGIN);
      if (parsed.origin !== SITE_ORIGIN) continue;
      route = parsed.pathname;
    } catch {
      route = href.split(/[?#]/)[0];
    }
    const record = getRouteRecord(graph, route);
    if (record && record.state === "redirect" && PERMANENT_CODES.has(Number(record.statusCode))) {
      errors.push(issue("INTERNAL_LINK_ALIAS", record, "href", `${link.sourceRoute} links to ${route}; use ${resolveFinalRoute(graph, route).finalRoute}`));
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

function validateRouteGraph(graph, options = {}) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  for (const record of graph.routes) {
    if (!record.id || ids.has(record.id)) errors.push(issue("ROUTE_ID_DUPLICATE", record, "id", `${record.id || "missing"} is not unique`));
    ids.add(record.id);
  }
  errors.push(...validateRedirectGraph(graph.routes).errors);
  errors.push(...validatePageRecords(graph.routes).errors);
  errors.push(...validateEquivalenceGroups(graph.equivalenceGroups, graph.routes).errors);
  for (const conflict of graph.ruleConflicts || []) {
    warnings.push(issue("ROUTE_RULE_SHADOWED", { id: conflict.route, route: conflict.route, owner: conflict.shadowedOwner }, "target", `${conflict.shadowedTarget} is shadowed by ${conflict.effectiveTarget}`));
  }
  for (const rule of graph.shadowedRules || []) {
    if (rule.shadowedByFile && REDIRECT_CODES.has(Number(rule.statusCode))) {
      warnings.push(issue("REDIRECT_SHADOWED_BY_FILE", { id: rule.route, route: rule.route, owner: rule.owner }, "force", `${rule.route} -> ${rule.target} is shadowed by ${rule.shadowedByFile}`));
    }
  }
  if (options.checkArtifacts) {
    errors.push(...validateSitemapEntries(loadSitemapEntries(), graph.routes).errors);
    errors.push(...validateInternalLinks(loadInternalLinks(graph), graph).errors);
  }
  return { ok: errors.length === 0, errors, warnings };
}

function rewriteInternalHref(graph, href) {
  const input = String(href || "");
  if (!input || input.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(input)) return input;
  const absolute = input.startsWith(SITE_ORIGIN);
  let parsed;
  try {
    parsed = new URL(input, SITE_ORIGIN);
  } catch {
    return input;
  }
  if (parsed.origin !== SITE_ORIGIN) return input;
  const record = getRouteRecord(graph, parsed.pathname);
  if (!record || record.state !== "redirect" || !PERMANENT_CODES.has(Number(record.statusCode))) return input;
  const finalRoute = resolveFinalRoute(graph, parsed.pathname).finalRoute;
  const suffix = `${parsed.search || ""}${parsed.hash || ""}`;
  return `${absolute ? SITE_ORIGIN : ""}${finalRoute}${suffix}`;
}

function getLocaleDestination(graph, route, locale) {
  const record = getRouteRecord(graph, route);
  const policy = graph.policy || {};
  const labels = { en: "English", fr: "Français", sw: "Kiswahili", yo: "Yorùbá", ha: "Hausa" };
  if (!record) {
    return { requestedLocale: locale, route: (policy.localeHomes || {})[locale] || "/", relationship: "locale-home", label: `${labels[locale] || locale} home`, advertisedAsEquivalent: false };
  }
  const group = graph.equivalenceGroups.find((candidate) => candidate.id === record.equivalenceGroup);
  if (group && group.routes[locale]) {
    return { requestedLocale: locale, route: group.routes[locale], relationship: "equivalent", label: labels[locale] || locale, advertisedAsEquivalent: true };
  }
  const englishRoute = group && group.routes.en
    ? group.routes.en
    : record.locale === "en" && record.state === "page"
      ? record.route
      : record.fallback && record.fallback.route;
  if (englishRoute) {
    return { requestedLocale: locale, route: englishRoute, relationship: "english-fallback", label: (policy.fallbackLabels || {})[locale] || "English fallback", advertisedAsEquivalent: false };
  }
  return { requestedLocale: locale, route: (policy.localeHomes || {})[locale] || "/", relationship: "locale-home", label: `${labels[locale] || locale} home`, advertisedAsEquivalent: false };
}

function buildRouteReport(graph) {
  const summary = {
    pages: graph.routes.filter((record) => record.state === "page").length,
    redirects: graph.routes.filter((record) => record.state === "redirect").length,
    rewrites: graph.routes.filter((record) => record.state === "rewrite").length,
    conditionalRedirects: graph.routes.filter((record) => record.state === "conditional-redirect").length,
    gone: graph.routes.filter((record) => record.state === "gone").length,
    patterns: graph.routes.filter((record) => record.state === "pattern").length,
    equivalenceGroups: graph.equivalenceGroups.length,
    fallbacks: graph.routes.filter((record) => record.fallback && !record.fallback.advertisedAsEquivalent).length,
    indexable: graph.routes.filter((record) => record.state === "page" && record.indexability === "indexable").length,
    sitemapEntries: graph.routes.filter((record) => record.sitemap && record.sitemap.included).length
  };
  const byLocale = {};
  const byPageType = {};
  for (const record of graph.routes.filter((route) => route.state === "page")) {
    byLocale[record.locale] = (byLocale[record.locale] || 0) + 1;
    byPageType[record.pageType] = (byPageType[record.pageType] || 0) + 1;
  }
  return {
    schemaVersion: graph.schemaVersion,
    summary,
    byLocale,
    byPageType,
    shadowedRules: graph.shadowedRules,
    ruleConflicts: graph.ruleConflicts,
    canonicalMigrations: graph.routes.filter((record) => record.state === "redirect" && record.deprecated).map((record) => ({
      route: record.route,
      target: record.redirectTarget,
      finalTarget: resolveFinalRoute(graph, record.route).finalRoute,
      statusCode: record.statusCode,
      owner: record.source.owner
    })),
    equivalenceGroups: graph.equivalenceGroups
  };
}

function managedRedirectContent(graph, policy) {
  const candidates = [];
  for (const decision of policy.canonicalDecisions || []) {
    candidates.push({ source: cleanPath(decision.source), target: cleanPath(decision.destination), reason: decision.id });
  }
  for (const record of graph.routes.filter((route) => route.state === "redirect" && PERMANENT_CODES.has(Number(route.statusCode)))) {
    const resolution = resolveFinalRoute(graph, record.route);
    if (resolution.hops > 1 || record.source.owner === "html-canonical") {
      candidates.push({ source: cleanPath(record.route), target: cleanPath(resolution.finalRoute), reason: record.source.owner });
    }
  }
  const configuredPermanent = [...parseRedirectsFile(), ...parseNetlifyRedirects()]
    .filter((rule) => PERMANENT_CODES.has(Number(rule.statusCode)) && !isPatternRoute(rule.route) && !Object.keys(rule.conditions || {}).length);
  const configuredByKey = new Map();
  for (const rule of configuredPermanent) {
    const key = redirectMatchKey(rule.route);
    if (!configuredByKey.has(key)) configuredByKey.set(key, rule);
  }
  for (const rule of configuredPermanent) {
    let target = cleanPath(rule.target);
    const seen = new Set([redirectMatchKey(rule.route)]);
    let hops = 1;
    while (hops < 50) {
      const next = configuredByKey.get(redirectMatchKey(target));
      if (!next || seen.has(redirectMatchKey(next.route))) break;
      seen.add(redirectMatchKey(next.route));
      target = cleanPath(next.target);
      hops += 1;
    }
    if (hops > 1 && normalizeRoute(rule.route) !== normalizeRoute(target)) {
      candidates.push({ source: cleanPath(rule.route), target, reason: "flattened-config-chain" });
    }
  }
  const byKey = new Map();
  for (const candidate of candidates) {
    if (normalizeRoute(candidate.source) === normalizeRoute(candidate.target)) continue;
    const key = redirectMatchKey(candidate.source);
    if (!byKey.has(key)) byKey.set(key, candidate);
  }
  const lines = [
    MANAGED_START,
    "# Generated from data/registry/route-policy.json and existing canonical/redirect ownership.",
    "# Forced direct redirects preserve legacy equity and prevent static-file shadowing."
  ];
  [...byKey.values()].sort((a, b) => a.source.localeCompare(b.source)).forEach((item) => {
    lines.push(`${item.source}  ${item.target}  301!`);
  });
  lines.push(MANAGED_END);
  return lines.join("\n");
}

function stripManagedRedirectBlock(content) {
  return content.replace(new RegExp(`${MANAGED_START}[\\s\\S]*?${MANAGED_END}\\r?\\n?`, "m"), "").replace(/^\s+/, "");
}

function removeNormalizedSelfRedirects(content) {
  return content.split(/\r?\n/).filter((raw) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return true;
    const tokens = line.split(/\s+/);
    const status = tokens.find((token) => /^(?:301|308)!?$/.test(token));
    if (!status || tokens.length < 3 || isPatternRoute(tokens[0])) return true;
    const statusIndex = tokens.indexOf(status);
    const target = tokens[statusIndex - 1];
    return redirectMatchKey(tokens[0]) !== redirectMatchKey(target);
  }).join("\n");
}

function removeRulesOwnedByManagedBlock(content, managedContent) {
  const managedKeys = new Set(
    managedContent.split(/\r?\n/)
      .map((raw) => raw.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => redirectMatchKey(line.split(/\s+/)[0]))
  );
  return content.split(/\r?\n/).filter((raw) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return true;
    const tokens = line.split(/\s+/);
    if (tokens.length < 3 || isPatternRoute(tokens[0])) return true;
    const status = tokens.find((token) => /^(?:301|308)!?$/.test(token));
    if (!status) return true;
    return !managedKeys.has(redirectMatchKey(tokens[0]));
  }).join("\n");
}

function syncRedirectContract(graph, options = {}) {
  const policy = loadPolicy();
  const original = fs.readFileSync(REDIRECTS_PATH, "utf8").replace(/\r\n/g, "\n");
  const managed = managedRedirectContent(graph, policy);
  const unowned = removeRulesOwnedByManagedBlock(stripManagedRedirectBlock(original), managed);
  const remainder = removeNormalizedSelfRedirects(unowned).trimStart();
  const next = `${managed}\n\n${remainder.replace(/\s+$/, "")}\n`;
  if (options.write && next !== original) writeFileSyncWithRetry(REDIRECTS_PATH, next, "utf8");
  return { changed: next !== original, content: next };
}

function replaceHeadLinks(html, canonicalRoute, hreflangs, localeCoverage) {
  let next = html;
  next = next.replace(/<link\b[^>]*\brel=["'][^"']*canonical[^"']*["'][^>]*>\s*/gi, "");
  next = next.replace(/<link\b[^>]*\brel=["'][^"']*alternate[^"']*["'][^>]*\bhreflang=["'][^"']+["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\b[^>]*\bname=["']afrotools-locale-(?:coverage|fallback)["'][^>]*>\s*/gi, "");
  const lines = [`<link rel="canonical" href="${absoluteRoute(canonicalRoute)}">`];
  if (localeCoverage && ["english-fallback", "unavailable", "deprecated"].includes(localeCoverage.state)) {
    const robotsTag = /<meta\b[^>]*\bname=["']robots["'][^>]*>/i;
    if (robotsTag.test(next)) {
      next = next.replace(robotsTag, (tag) => {
        const contentAttribute = /\bcontent=["']([^"']*)["']/i;
        const match = tag.match(contentAttribute);
        if (!match) return tag.replace(/>$/, ' content="noindex, follow">');
        const directives = new Set(match[1].split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
        directives.delete('index');
        directives.add('noindex');
        directives.add('follow');
        return tag.replace(contentAttribute, `content="${[...directives].join(', ')}"`);
      });
    } else {
      lines.push('<meta name="robots" content="noindex, follow">');
    }
  }
  for (const locale of LOCALE_ORDER) {
    if (hreflangs[locale]) lines.push(`<link rel="alternate" hreflang="${locale}" href="${absoluteRoute(hreflangs[locale])}">`);
  }
  if (hreflangs["x-default"]) lines.push(`<link rel="alternate" hreflang="x-default" href="${absoluteRoute(hreflangs["x-default"])}">`);
  if (localeCoverage && localeCoverage.fallbackRoute) {
    lines.push(`<meta name="afrotools-locale-coverage" content="${localeCoverage.state}">`);
    lines.push(`<meta name="afrotools-locale-fallback" content="${localeCoverage.fallbackRoute}">`);
  }
  return next.replace(/<\/head>/i, `${lines.join("\n")}\n</head>`);
}

function syncRouteMetadata(graph, options = {}) {
  const changedFiles = [];
  for (const record of graph.routes) {
    if (record.state !== "page" || !record.source.file) continue;
    const filePath = path.join(ROOT, record.source.file);
    if (!fs.existsSync(filePath)) continue;
    const original = fs.readFileSync(filePath, "utf8");
    const hreflangs = record.indexability === "indexable" && Object.keys(record.hreflangs || {}).length
      ? record.hreflangs
      : record.indexability === "indexable"
        ? { [record.locale]: record.route, "x-default": record.locale === "en" ? record.route : (record.fallback && record.fallback.route) || record.route }
        : {};
    const next = replaceHeadLinks(original, record.route, hreflangs, record.localeCoverage);
    if (next === original) continue;
    if (options.write) writeFileSyncWithRetry(filePath, next, "utf8");
    changedFiles.push(record.source.file);
  }
  return { changedFiles, changed: changedFiles.length > 0 };
}

function syncInternalLinks(graph, options = {}) {
  const changedFiles = [];
  let replacements = 0;
  const filePaths = new Set(
    graph.routes
      .filter((record) => record.state === "page" && record.source.file)
      .map((record) => path.join(ROOT, record.source.file))
  );
  walkJavaScriptSourceFiles().forEach((filePath) => filePaths.add(filePath));
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;
    const original = fs.readFileSync(filePath, "utf8");
    let fileReplacements = 0;
    const next = original.replace(/(\bhref(?:Fr|Sw|Ha|Yo)?\s*(?:=|:)\s*)(["'])([^"']+)\2/gi, (match, prefix, quote, href) => {
      const rewritten = rewriteInternalHref(graph, href);
      if (rewritten === href) return match;
      fileReplacements += 1;
      return `${prefix}${quote}${rewritten}${quote}`;
    });
    if (!fileReplacements) continue;
    if (options.write) writeFileSyncWithRetry(filePath, next, "utf8");
    changedFiles.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
    replacements += fileReplacements;
  }
  return { changedFiles, replacements, changed: changedFiles.length > 0 };
}

module.exports = {
  ROOT,
  SITE_ORIGIN,
  absoluteRoute,
  buildRouteGraph,
  buildRouteReport,
  cleanPath,
  extractCanonicalTags,
  extractHreflangEntries,
  formatIssue,
  getLocaleDestination,
  getRouteRecord,
  loadInternalLinks,
  loadPolicy,
  loadRouteSources,
  loadSitemapEntries,
  normalizeRoute,
  parseNetlifyRedirects,
  parseRedirectsFile,
  replaceHeadLinks,
  resolveFinalRoute,
  rewriteInternalHref,
  syncInternalLinks,
  syncRedirectContract,
  syncRouteMetadata,
  validateEquivalenceGroups,
  validateInternalLinks,
  validatePageRecords,
  validateRedirectGraph,
  validateRouteGraph,
  validateSitemapEntries,
  walkHtmlFiles,
  walkJavaScriptSourceFiles
};
