#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const REDIRECTS_FILE = path.join(ROOT, "_redirects");
const REPORT_FILE = path.join(ROOT, "reports", "french-english-iframe-retirement.json");
const ROUTE_POLICY = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "registry", "route-policy.json"), "utf8"));
const POLICY_CANONICALS = new Map((ROUTE_POLICY.canonicalDecisions || []).map((decision) => [decision.source, decision.destination]));
const SITE_ORIGIN = "https://afrotools.com";
const START = "# BEGIN FRENCH ENGLISH-IFRAME RETIREMENT";
const END = "# END FRENCH ENGLISH-IFRAME RETIREMENT";
const IGNORED_DIRECTORIES = new Set([
  ".git", ".netlify", ".worktrees", "artifacts", "audit-results", "dist", "node_modules", "reports", "test-results"
]);
const AGRICULTURE_FAMILIES = Object.freeze([
  { slug: "crop-insurance", preserveCountry: true },
  { slug: "export-docs", preserveCountry: true },
  { slug: "harvest-date", preserveCountry: false },
  { slug: "poultry-roi", preserveCountry: true },
  { slug: "vaccination-schedule", preserveCountry: true }
]);
const COUNTRY_ALIAS_FILE = path.join(ROOT, "data/registry/french-agriculture-country-aliases.json");
const COUNTRY_FAMILY_COUNTS = Object.freeze({ "crop-insurance": 15, "export-docs": 54, "poultry-roi": 15, "vaccination-schedule": 54 });

function loadCountryInventory() {
  const context = { window: {} }; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data/agriculture/country-index.js"), "utf8"), context, { timeout: 1000 });
  const countries = JSON.parse(JSON.stringify(context.window.AfroTools.countryIndex));
  assert.equal(countries.length, 54); assert.equal(new Set(countries.map(row => row.code)).size, 54); assert.equal(new Set(countries.map(row => row.slug)).size, 54);
  for (const country of countries) { assert.match(country.code, /^[A-Z]{2}$/); assert.match(country.slug, /^[a-z]+(?:-[a-z]+)*$/); }
  return countries;
}

function validateCountryAliases(manifest, countries) {
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.countryInventory, "data/agriculture/country-index.js");
  assert(Array.isArray(manifest.aliases)); assert.equal(manifest.aliases.length, 138);
  const byCode = new Map(countries.map(row => [row.code, row])), seen = new Set(), counts = {};
  const aliases = manifest.aliases.map(alias => {
    assert.deepEqual(Object.keys(alias).sort(), ["sourceFile", "countryCode", "countrySlug", "canonicalHub"].sort());
    const country = byCode.get(alias.countryCode); assert(country); assert.equal(alias.countrySlug, country.slug);
    const match = alias.sourceFile.match(/^fr\/agriculture\/([a-z-]+)\/([a-z-]+)\.html$/); assert(match);
    const family = match[1]; assert(Object.hasOwn(COUNTRY_FAMILY_COUNTS, family)); assert.equal(match[2], country.slug);
    assert.equal(alias.canonicalHub, `/fr/agriculture/${family}/`); assert(!seen.has(alias.sourceFile)); seen.add(alias.sourceFile);
    counts[family] = (counts[family] || 0) + 1;
    const source = path.join(ROOT, alias.sourceFile); assert.equal(fs.realpathSync(source), path.resolve(source)); assert(fs.lstatSync(source).isFile());
    const html = fs.readFileSync(source, "utf8");
    const countryTag = findTag(html, "meta", tag => attr(tag, "name") === "afrotools-country-id");
    assert.equal(attr(countryTag, "content"), country.code, "Wrapper country must match canonical inventory");
    const englishCountry = `/agriculture/${family}/${country.slug}`;
    assert([englishCountry, `${englishCountry}/`, `${englishCountry}.html`].includes(iframeSource(html)), "Existing wrapper source must own the same country");
    assert.equal(canonicalPath(html), alias.canonicalHub);
    const hub = fs.readFileSync(path.join(ROOT, alias.canonicalHub.slice(1), "index.html"), "utf8");
    assert.equal(canonicalPath(hub), alias.canonicalHub); assert(!iframeSource(hub));
    assert.match(hub, /<select\b[^>]*\bid=["'](?:country|countryCode)["']/i);
    return { ...alias };
  });
  assert.deepEqual(counts, COUNTRY_FAMILY_COUNTS);
  return aliases.sort((a, b) => a.sourceFile < b.sourceFile ? -1 : a.sourceFile > b.sourceFile ? 1 : 0);
}

function loadCountryAliases() {
  return validateCountryAliases(JSON.parse(fs.readFileSync(COUNTRY_ALIAS_FILE, "utf8")), loadCountryInventory());
}

function countryReport(report) {
  const aliases = loadCountryAliases();
  return {
    ...report,
    agricultureRedirectRules: AGRICULTURE_FAMILIES.length * 3 + aliases.length * 3,
    countryPrefillAliases: aliases.map(alias => ({
      ...alias,
      variants: countryAliasVariants(alias).map(variant => ({ ...variant, destination: `${alias.canonicalHub}?country=${alias.countrySlug}` }))
    }))
  };
}

function countryAliasVariants(alias) {
  const clean = `/${alias.sourceFile.replace(/\.html$/, "")}`;
  return [{ variant: "html", sourcePath: `/${alias.sourceFile}` }, { variant: "clean", sourcePath: clean }, { variant: "slash", sourcePath: `${clean}/` }];
}

function parseArgs(argv) {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  if (write === check || argv.some((arg) => !["--write", "--check", "--country-prefill-only"].includes(arg))) {
    throw new Error("Choose exactly one of --write or --check; --country-prefill-only limits generation to the owned redirects/report.");
  }
  return { write, check, countryPrefillOnly: argv.includes("--country-prefill-only") };
}

function walkHtml(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || IGNORED_DIRECTORIES.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(target, files);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(target);
  }
  return files;
}

function attr(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function findTag(html, tagName, predicate) {
  return (html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || []).find(predicate) || "";
}

function iframeSource(html) {
  const tag = findTag(html, "iframe", (candidate) => /^\/(?!fr(?:\/|$))/i.test(attr(candidate, "src")));
  return tag ? attr(tag, "src").split(/[?#]/)[0] : "";
}

function fileRoute(filePath) {
  const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative.slice(0, -".html".length)}`;
}

function tagHrefPath(tag) {
  const href = attr(tag, "href");
  if (!href) return "";
  try { return new URL(href, SITE_ORIGIN).pathname; } catch { return ""; }
}

function canonicalPath(html) {
  const tag = findTag(html, "link", (candidate) => attr(candidate, "rel").toLowerCase() === "canonical");
  return tagHrefPath(tag);
}

function pathVariants(route) {
  const clean = route.replace(/\.html$/i, "");
  return new Set([route, clean, clean.endsWith("/") ? clean.slice(0, -1) : `${clean}/`, `${clean}.html`]);
}

function canonicalFor(filePath, source) {
  const route = fileRoute(filePath);
  if (POLICY_CANONICALS.has(route)) return POLICY_CANONICALS.get(route);
  const agriculture = route.match(/^\/fr\/agriculture\/([^/]+)\//);
  if (agriculture && AGRICULTURE_FAMILIES.some((family) => family.slug === agriculture[1])) {
    return `/fr/agriculture/${agriculture[1]}/`;
  }
  if (route.startsWith("/fr/tools/carte-conflits-afrique/")) return "/fr/tools/carte-conflits-afrique/";
  if (route.startsWith("/fr/tools/afroatlas/")) return "/fr/tools/afroatlas/";
  if (route === "/fr/tools/prelevements-cedeao/") return "/fr/tools/ecowas-levy/";
  if (route === "/fr/widgets/demo/") return "/fr/widgets/";
  const sourcePath = String(source || "").split(/[?#]/)[0];
  const relative = sourcePath.replace(/^\/+/, "");
  const candidates = sourcePath.endsWith("/")
    ? [path.join(ROOT, relative, "index.html")]
    : sourcePath.endsWith(".html")
      ? [path.join(ROOT, relative)]
      : [path.join(ROOT, relative), path.join(ROOT, relative, "index.html")];
  for (const candidate of candidates) {
    if (!candidate.startsWith(ROOT) || !fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;
    const ownerCanonical = canonicalPath(fs.readFileSync(candidate, "utf8"));
    if (ownerCanonical) return ownerCanonical;
  }
  return sourcePath;
}

function replaceOrInsertHeadTag(html, matcher, replacement) {
  const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) || [];
  const current = tags.find(matcher);
  if (current) return html.replace(current, replacement);
  return html.replace(/<\/head>/i, `${replacement}\n</head>`);
}

function retireWrapper(html, canonical) {
  let output = html.replace(/<link\b[^>]*>/gi, (tag) => {
    return attr(tag, "rel").toLowerCase() === "alternate" && attr(tag, "hreflang") ? "" : tag;
  });
  output = replaceOrInsertHeadTag(
    output,
    (tag) => /^<meta/i.test(tag) && attr(tag, "name").toLowerCase() === "robots",
    '<meta name="robots" content="noindex, follow">'
  );
  output = replaceOrInsertHeadTag(
    output,
    (tag) => /^<meta/i.test(tag) && attr(tag, "name").toLowerCase() === "afrotools-localization-state",
    '<meta name="afrotools-localization-state" content="english-fallback-noindex">'
  );
  output = replaceOrInsertHeadTag(
    output,
    (tag) => /^<link/i.test(tag) && attr(tag, "rel").toLowerCase() === "canonical",
    `<link rel="canonical" href="${SITE_ORIGIN}${canonical}">`
  );
  output = replaceOrInsertHeadTag(
    output,
    (tag) => /^<meta/i.test(tag) && attr(tag, "property").toLowerCase() === "og:url",
    `<meta property="og:url" content="${SITE_ORIGIN}${canonical}">`
  );
  return output.replace(/\n{3,}/g, "\n\n");
}

function removeFalseFrenchAlternate(html, retiredPaths) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (attr(tag, "rel").toLowerCase() !== "alternate" || attr(tag, "hreflang").toLowerCase() !== "fr") return tag;
    return retiredPaths.has(tagHrefPath(tag)) ? "" : tag;
  });
}

function redirectBlock() {
  const lines = [START, "# False French country wrappers now consolidate into native French workflows."];
  for (const alias of loadCountryAliases()) {
    for (const variant of countryAliasVariants(alias)) {
      lines.push(`${variant.sourcePath}  ${alias.canonicalHub}?country=${alias.countrySlug}  301!`);
    }
  }
  for (const family of AGRICULTURE_FAMILIES) {
    const destination = `/fr/agriculture/${family.slug}/${family.preserveCountry ? "?country=:country" : ""}`;
    lines.push(`/fr/agriculture/${family.slug}/:country.html  ${destination}  301!`);
    lines.push(`/fr/agriculture/${family.slug}/:country/  ${destination}  301!`);
    lines.push(`/fr/agriculture/${family.slug}/:country  ${destination}  301!`);
  }
  lines.push(END);
  return lines.join("\n");
}

function updateRedirects(current) {
  const block = redirectBlock();
  const pattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (pattern.test(current)) return current.replace(pattern, block);
  const anchor = "# END CANONICAL ROUTE CONTRACT";
  if (!current.includes(anchor)) throw new Error("Cannot find the canonical route contract marker in _redirects.");
  return current.replace(anchor, `${anchor}\n\n${block}`);
}

function buildChanges() {
  const allFiles = walkHtml(ROOT);
  const wrappers = [];
  const retiredPaths = new Set();
  const changes = new Map();

  for (const filePath of allFiles.filter((file) => path.relative(ROOT, file).replace(/\\/g, "/").startsWith("fr/"))) {
    const html = fs.readFileSync(filePath, "utf8");
    const source = iframeSource(html);
    if (!source) continue;
    const route = fileRoute(filePath);
    for (const value of pathVariants(route)) retiredPaths.add(value);
    const canonical = canonicalFor(filePath, source);
    const expected = retireWrapper(html, canonical);
    if (expected !== html) changes.set(filePath, expected);
    wrappers.push({
      route,
      sourceFile: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      iframeSource: source,
      canonical,
      family: route.match(/^\/fr\/([^/]+)(?:\/([^/]+))?/)?.slice(1).filter(Boolean).join("/") || "fr"
    });
  }

  for (const filePath of allFiles.filter((file) => !path.relative(ROOT, file).replace(/\\/g, "/").startsWith("fr/"))) {
    const html = fs.readFileSync(filePath, "utf8");
    const expected = removeFalseFrenchAlternate(html, retiredPaths);
    if (expected !== html) {
      changes.set(filePath, expected);
    }
  }

  const redirects = fs.readFileSync(REDIRECTS_FILE, "utf8");
  const expectedRedirects = updateRedirects(redirects);
  if (expectedRedirects !== redirects) changes.set(REDIRECTS_FILE, expectedRedirects);

  const byFamily = Object.fromEntries(Object.entries(wrappers.reduce((counts, row) => {
    counts[row.family] = (counts[row.family] || 0) + 1;
    return counts;
  }, {})).sort(([left], [right]) => left.localeCompare(right)));
  const report = countryReport({
    schemaVersion: 1,
    policy: "French routes that visibly embed a non-French workflow are fallback compatibility pages, not native locale parity.",
    wrapperPages: wrappers.length,
    reciprocalAlternatesRemaining: 0,
    retiredFrenchPathVariants: retiredPaths.size,
    agricultureRedirectRules: AGRICULTURE_FAMILIES.length * 3,
    byFamily,
    routes: wrappers
  });
  const reportText = `${JSON.stringify(report, null, 2)}\n`;
  if (!fs.existsSync(REPORT_FILE) || fs.readFileSync(REPORT_FILE, "utf8") !== reportText) changes.set(REPORT_FILE, reportText);
  return { changes, report };
}

function buildCountryPrefillChanges() {
  const changes = new Map();
  const redirects = fs.readFileSync(REDIRECTS_FILE, "utf8"), nextRedirects = updateRedirects(redirects);
  if (nextRedirects !== redirects) changes.set(REDIRECTS_FILE, nextRedirects);
  const currentReport = fs.readFileSync(REPORT_FILE, "utf8"), report = countryReport(JSON.parse(currentReport));
  const nextReport = `${JSON.stringify(report, null, 2)}\n`;
  if (nextReport !== currentReport) changes.set(REPORT_FILE, nextReport);
  return { changes, report };
}

function run(options) {
  const { changes, report } = options.countryPrefillOnly ? buildCountryPrefillChanges() : buildChanges();
  if (options.check && changes.size) {
    for (const filePath of changes.keys()) console.error(`STALE ${path.relative(ROOT, filePath).replace(/\\/g, "/")}`);
    process.exitCode = 1;
  } else if (options.write) {
    fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    for (const [filePath, content] of changes) writeFileSyncWithRetry(filePath, content, "utf8");
  }
  console.log(`French English-iframe retirement: ${report.wrapperPages} wrappers; ${report.reciprocalAlternatesRemaining} false reciprocal alternates remain; ${changes.size} stale files.`);
  return { changes, report };
}

if (require.main === module) {
  try { run(parseArgs(process.argv.slice(2))); } catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
}

module.exports = {
  AGRICULTURE_FAMILIES,
  buildChanges,
  buildCountryPrefillChanges,
  canonicalFor,
  iframeSource,
  parseArgs,
  redirectBlock,
  loadCountryAliases,
  loadCountryInventory,
  validateCountryAliases,
  removeFalseFrenchAlternate,
  retireWrapper,
  run,
  updateRedirects
};
