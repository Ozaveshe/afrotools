"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY = JSON.parse(fs.readFileSync(path.join(ROOT, "reports", "french-free-app-parity-inventory.json"), "utf8"));
const HEALTH = INVENTORY.rows.filter((row) => row.categoryKey === "health");

function loadRegistry() {
  const source = fs.readFileSync(path.join(ROOT, "assets", "js", "components", "tool-registry.js"), "utf8");
  const document = {
    addEventListener() {},
    dispatchEvent() {},
    getElementById() { return null; },
    createElement() { return { style: {}, setAttribute() {}, appendChild() {} }; },
    head: { appendChild() {} }
  };
  const context = { window: {}, document, CustomEvent: function CustomEvent() {}, console };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.AFRO_TOOLS || [];
}

function normalizeRoute(route) {
  const value = String(route || "").split(/[?#]/)[0].replace(/\/+/g, "/");
  return value === "/" ? "/" : "/" + value.replace(/^\/+|\/+$/g, "");
}

function routeFile(route) {
  const clean = normalizeRoute(route).replace(/^\//, "");
  const index = path.join(ROOT, clean, "index.html");
  return fs.existsSync(index) ? index : path.join(ROOT, clean + ".html");
}

function appScripts(html, englishRoute) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1].split("?")[0])
    .filter((src) => !/^(?:https?:)?\/\//.test(src))
    .filter((src) => !src.startsWith("/assets/") && !src.startsWith("/widgets/"))
    .map((src) => {
      if (src.startsWith("/")) return src;
      return normalizeRoute(englishRoute) + "/" + src.replace(/^\.\//, "");
    });
}

function textContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!-- RELATED_TOOLS_SSR_START -->[\s\S]*?<!-- RELATED_TOOLS_SSR_END -->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : "";
}

function metaContent(html, attribute, value) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${value}["'])[^>]*>`, "i"));
  if (!tag) return "";
  const content = tag[0].match(/\bcontent=("([^"]*)"|'([^']*)')/i);
  return content ? String(content[2] == null ? content[3] : content[2]).trim() : "";
}

function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test("French Health parity denominator and registry ownership are exactly 42", () => {
  assert.equal(HEALTH.length, 42);
  const registryRows = loadRegistry().filter((row) => row.lang === "fr" && row.category === "health" && row.sourceId);
  assert.equal(registryRows.length, 42);
  assert.equal(new Set(registryRows.map((row) => row.sourceId)).size, 42);
  assert.equal(new Set(registryRows.map((row) => normalizeRoute(row.href))).size, 42);
  for (const row of HEALTH) {
    const owner = registryRows.find((item) => item.sourceId === row.englishId);
    assert.ok(owner, `${row.englishId}: missing French registry owner`);
    assert.equal(normalizeRoute(owner.href), normalizeRoute(row.primaryFrenchRoute), `${row.englishId}: owner route drift`);
  }
});

test("French Health hub lists every application once with French SEO ownership", () => {
  const html = fs.readFileSync(path.join(ROOT, "fr", "health", "index.html"), "utf8");
  const sourceHtml = require("../scripts/lib/shared-asset-references").normalizeBuildManagedHtml(html);
  assert.match(html, /<html\b[^>]*lang="fr"/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/health\/">/i);
  assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/health\/"/i);
  const graph = jsonLd(html).flatMap((schema) => (
    Array.isArray(schema) ? schema : (schema['@graph'] || [schema])
  ));
  const collection = graph.find((schema) => schema['@type'] === 'CollectionPage');
  assert.ok(collection, 'French Health CollectionPage schema');
  assert.equal(collection.mainEntity.numberOfItems, 42);
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i);
  for (const row of HEALTH) {
    const href = normalizeRoute(row.primaryFrenchRoute) + "/";
    assert.equal(sourceHtml.split(`href="${href}"`).length - 1, 1, `${row.englishId}: hub link count`);
  }
});

test("all 42 French Health pages are native, French, source-owned and engine-identical", () => {
  const residualEnglish = /\b(?:Download|Calculate|Clear|Privacy|Official sources|Related tools|Frequently Asked Questions|This tool|No diagnosis|No upload|Runs in this browser)\b/i;
  for (const row of HEALTH) {
    const frenchFile = path.join(ROOT, row.primaryFrenchFile);
    const englishFile = routeFile(row.englishRoute);
    assert.ok(fs.existsSync(frenchFile), `${row.englishId}: French file missing`);
    assert.ok(fs.existsSync(englishFile), `${row.englishId}: English source missing`);
    const html = fs.readFileSync(frenchFile, "utf8");
    const english = fs.readFileSync(englishFile, "utf8");
    const canonical = "https://afrotools.com" + normalizeRoute(row.primaryFrenchRoute) + "/";
    const englishUrl = "https://afrotools.com" + normalizeRoute(row.englishRoute) + "/";
    const title = attr(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i).replace(/<[^>]+>/g, "").trim();
    const description = metaContent(html, "name", "description");
    assert.match(html, /<html\b[^>]*lang="fr"/i, `${row.englishId}: lang`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`, "i"), `${row.englishId}: canonical`);
    assert.ok(html.includes(`hreflang="en" href="${englishUrl}"`), `${row.englishId}: English hreflang`);
    assert.ok(html.includes(`hreflang="fr" href="${canonical}"`), `${row.englishId}: French hreflang`);
    assert.ok(title.length >= 10 && title.length <= 65, `${row.englishId}: title length ${title.length}`);
    assert.ok(description.length >= 50 && description.length <= 170, `${row.englishId}: description length ${description.length}`);
    assert.match(html, /"inLanguage"\s*:\s*"fr"/, `${row.englishId}: French schema`);
    if (row.englishId === "malaria-risk") {
      assert.match(html, /malaria-urgency-engine\.js/, `${row.englishId}: shared urgency engine`);
      assert.match(html, /malaria-urgency-fr\.js/, `${row.englishId}: dedicated French controller`);
      assert.match(html, /Hiérarchie d’escalade uniquement|ne sont ni stockées, ni envoyées/i, `${row.englishId}: dedicated medical boundary`);
    } else {
      assert.match(html, /data-fr-health-safety/, `${row.englishId}: medical boundary`);
      assert.match(html, /id="fr-health-translations"/, `${row.englishId}: result translation map`);
      assert.match(html, /french-health-parity-runtime\.js/, `${row.englishId}: result translation runtime`);
    }
    assert.doesNotMatch(html, /<iframe\b/i, `${row.englishId}: iframe`);
    assert.doesNotMatch(html, /\bfetch\s*\(\s*["']\/(?:tools|health)\//i, `${row.englishId}: English HTML fetch`);
    assert.doesNotMatch(html, /\bdata-fr-prep\b|class=["'][^"']*(?:source-launch|prep-panel)\b/i, `${row.englishId}: handoff bridge`);
    assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i, `${row.englishId}: remote font`);
    assert.doesNotMatch(html, /\bAfroOutils\b/i, `${row.englishId}: translated brand drift`);
    assert.doesNotMatch(textContent(html), residualEnglish, `${row.englishId}: visible English UI`);
    assert.equal((html.match(/<main\b/gi) || []).length, 1, `${row.englishId}: main landmark`);
    assert.ok((html.match(/<(?:input|select|textarea|button)\b/gi) || []).length >= 1, `${row.englishId}: app controls`);
    const expectedScripts = appScripts(english, row.englishRoute);
    assert.ok(expectedScripts.length >= 1, `${row.englishId}: English engine/controller missing`);
    for (const src of expectedScripts) {
      assert.ok(html.includes(`src="${src}`) || html.includes(`src='${src}`), `${row.englishId}: shared engine missing ${src}`);
      assert.ok(fs.existsSync(path.join(ROOT, src.replace(/^\//, ""))), `${row.englishId}: shared engine file missing ${src}`);
    }
    const ogImage = metaContent(html, "property", "og:image");
    assert.match(ogImage, /^https:\/\/afrotools\.com\//, `${row.englishId}: OG image`);
    const ogFile = ogImage.replace(/^https:\/\/afrotools\.com\//, "");
    assert.ok(fs.existsSync(path.join(ROOT, ogFile)), `${row.englishId}: artwork missing ${ogFile}`);
  }
});
