"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BASE = "0f6990118d9ac8b9dcde446a6ede10a017b9a2db";
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-health-parity-manifest.json"), "utf8"));
const ROWS = MANIFEST.rows;

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
    .map((src) => src.startsWith("/") ? src : normalizeRoute(englishRoute) + "/" + src.replace(/^\.\//, ""));
}

function textContent(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!-- RELATED_TOOLS_SSR_START -->[\s\S]*?<!-- RELATED_TOOLS_SSR_END -->/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function metaContent(html, attribute, value) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${value}["'])[^>]*>`, "i"));
  if (!tag) return "";
  const content = tag[0].match(/\bcontent=("([^"]*)"|'([^']*)')/i);
  return content ? String(content[2] == null ? content[3] : content[2]).trim() : "";
}

test("Health manifest reconciles exactly 42 apps, preserving the accepted app byte-for-byte", () => {
  assert.equal(MANIFEST.programmeBase, BASE);
  assert.equal(MANIFEST.denominator, 42);
  assert.equal(MANIFEST.candidateApps, 41);
  assert.equal(ROWS.length, 42);
  assert.equal(new Set(ROWS.map((row) => row.id)).size, 42);
  assert.equal(new Set(ROWS.map((row) => row.swahiliRoute)).size, 42);
  assert.equal(ROWS.filter((row) => row.generation === "generated-native-owner").length, 41);
  assert.deepEqual(MANIFEST.previouslyAccepted, ["waist-hip-ratio"]);
  const accepted = ROWS.find((row) => row.id === "waist-hip-ratio");
  const current = fs.readFileSync(path.join(ROOT, accepted.swahiliFile));
  const baseline = childProcess.execFileSync("git", ["show", `${BASE}:${accepted.swahiliFile}`], { cwd: ROOT });
  assert.deepEqual(current, baseline, "accepted waist-to-hip owner changed");
});

test("Swahili Health hub lists every application once with correct SEO ownership", () => {
  const html = fs.readFileSync(path.join(ROOT, "sw/afya/index.html"), "utf8");
  assert.match(html, /<html\b[^>]*lang="sw"/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/afya\/">/i);
  assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/afya\/"/i);
  assert.match(html, /"numberOfItems":42/);
  assert.equal((html.match(/class="swh-card"/g) || []).length, 42);
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i);
  for (const row of ROWS) {
    const href = normalizeRoute(row.swahiliRoute) + "/";
    assert.equal(html.split(`href="${href}"`).length - 1, 1, `${row.id}: hub link count`);
  }
});

test("all 41 candidate pages are native, engine-identical, private and search-owned", () => {
  const residualEnglish = /\b(?:Download PDF|Download TXT|Calculate|Clear|Privacy|Official sources|Related tools|Frequently Asked Questions|This tool does not diagnose|No diagnosis|No upload|Runs in this browser)\b/i;
  for (const row of ROWS.filter((item) => item.generation === "generated-native-owner")) {
    const swahiliFile = path.join(ROOT, row.swahiliFile);
    const englishFile = routeFile(row.englishRoute);
    assert.ok(fs.existsSync(swahiliFile), `${row.id}: Swahili owner missing`);
    assert.ok(fs.existsSync(englishFile), `${row.id}: English owner missing`);
    const html = fs.readFileSync(swahiliFile, "utf8");
    const english = fs.readFileSync(englishFile, "utf8");
    const canonical = "https://afrotools.com" + normalizeRoute(row.swahiliRoute) + "/";
    const englishUrl = "https://afrotools.com" + normalizeRoute(row.englishRoute) + "/";
    assert.match(html, /<html\b[^>]*lang="sw"/i, `${row.id}: lang`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${row.id}: canonical`);
    assert.ok(html.includes(`hreflang="en" href="${englishUrl}"`), `${row.id}: English hreflang`);
    assert.ok(html.includes(`hreflang="sw" href="${canonical}"`), `${row.id}: Swahili hreflang`);
    assert.match(html, /"inLanguage":"sw"/, `${row.id}: schema language`);
    assert.match(html, /data-sw-health-source=/, `${row.id}: source owner marker`);
    assert.match(html, /data-sw-health-safety/, `${row.id}: medical boundary`);
    assert.match(html, /id="sw-health-translations"/, `${row.id}: runtime dictionary`);
    assert.match(html, /swahili-health-parity-runtime\.js/, `${row.id}: localized runtime`);
    assert.doesNotMatch(html, /<iframe\b/i, `${row.id}: iframe`);
    assert.doesNotMatch(html, /\bfetch\s*\(\s*["']\/(?:tools|health)\//i, `${row.id}: English HTML fetch`);
    assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i, `${row.id}: remote font`);
    assert.doesNotMatch(textContent(html), residualEnglish, `${row.id}: visible English UI`);
    assert.match(textContent(html), /Haitambui ugonjwa|haitambui ugonjwa/i, `${row.id}: non-diagnostic boundary`);
    assert.equal((html.match(/<main\b/gi) || []).length, 1, `${row.id}: main landmark`);
    assert.ok((html.match(/<(?:input|select|textarea|button)\b/gi) || []).length >= 1, `${row.id}: app controls`);
    const expectedScripts = appScripts(english, row.englishRoute);
    assert.ok(expectedScripts.length >= 1, `${row.id}: English engine/controller missing`);
    for (const src of expectedScripts) {
      assert.ok(html.includes(`src="${src}`) || html.includes(`src='${src}`), `${row.id}: shared engine missing ${src}`);
      assert.ok(fs.existsSync(path.join(ROOT, src.replace(/^\//, ""))), `${row.id}: engine file missing ${src}`);
    }
    const ogImage = metaContent(html, "property", "og:image");
    assert.match(ogImage, /^https:\/\/afrotools\.com\//, `${row.id}: OG image URL`);
    assert.ok(fs.existsSync(path.join(ROOT, ogImage.replace(/^https:\/\/afrotools\.com\//, ""))), `${row.id}: OG image file`);
    assert.ok(english.includes(`hreflang="sw" href="${canonical}"`), `${row.id}: reciprocal English hreflang`);
  }
});

test("translation cache, artwork and safety contracts are complete", () => {
  const cache = JSON.parse(fs.readFileSync(path.join(ROOT, "data/i18n/sw-health-parity-translations.json"), "utf8"));
  assert.ok(Object.keys(cache).length >= 2900);
  assert.equal(cache.Calculate, "Kokotoa");
  assert.equal(cache.Privacy, "Faragha");
  const artwork = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/sw-health-parity-missing-artwork.json"), "utf8"));
  assert.equal(artwork.denominator, 42);
  assert.equal(artwork.missingCount, 0);
  assert.deepEqual(artwork.missing, []);
});
