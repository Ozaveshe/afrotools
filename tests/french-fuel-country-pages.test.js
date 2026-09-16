"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { sourceDisclosure } = require("../scripts/build-french-fuel-country-pages");

const ROOT = path.resolve(__dirname, "..");
const FUEL_DIR = path.join(ROOT, "fr", "tools", "suivi-carburant");
const pages = fs.readdirSync(FUEL_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(FUEL_DIR, entry.name, "index.html")))
  .map((entry) => ({ slug: entry.name, file: path.join(FUEL_DIR, entry.name, "index.html") }));

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|middot);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function schemas(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test("all French fuel country routes use the native French owner", () => {
  assert.equal(pages.length, 54);
  for (const page of pages) {
    const html = fs.readFileSync(page.file, "utf8");
    assert.match(html, /<html\b[^>]*\blang=["']fr["']/i, page.slug);
    assert.match(html, /afrotools-source-owner["']\s+content=["']scripts\/build-french-fuel-country-pages\.js/i, page.slug);
    assert.doesNotMatch(html, /afrotools-language-fallback|data-language-fallback-notice|data-explicit-language-fallback/i, page.slug);
  }
});

test("French fuel country pages do not expose known English template copy", () => {
  const leaks = /\b(?:Last updated|Fuel prices|Compare .+ with another African country|Open generator calculator|Generator cost estimate|How to use these|Monthly estimate|Fuel used|Price basis|Related African fuel price pages|Frequently asked questions|What is the|When were these|How much is LPG)\b/i;
  for (const page of pages) {
    const text = visibleText(fs.readFileSync(page.file, "utf8"));
    assert.doesNotMatch(text, leaks, page.slug);
  }
});

test("French fuel structured data is localized and self-referential", () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, "utf8");
    const data = schemas(html);
    const canonical = `https://afrotools.com/fr/tools/suivi-carburant/${page.slug}/`;
    const webPage = data.find((item) => item["@type"] === "WebPage");
    const dataset = data.find((item) => item["@type"] === "Dataset");
    const faq = data.find((item) => item["@type"] === "FAQPage");
    assert.equal(webPage.url, canonical, page.slug);
    assert.equal(webPage.about["@id"], canonical, page.slug);
    assert.equal(webPage.inLanguage, "fr", page.slug);
    assert.equal(dataset.url, canonical, page.slug);
    assert.equal(dataset["@id"], canonical, page.slug);
    assert.equal(dataset.inLanguage, "fr", page.slug);
    assert.match(dataset.description, /Dernier relevé disponible/i, page.slug);
    assert.equal(faq.mainEntity.length, 6, page.slug);
    assert.ok(faq.mainEntity.every((item) => /[À-ÿ]|prix|carburant|comparer/i.test(`${item.name} ${item.acceptedAnswer.text}`)), page.slug);
    assert.doesNotMatch(JSON.stringify(data), /Prix de l’diesel|Prix duGPL|moyenne de Afrique|voisins de Afrique/, page.slug);
    assert.doesNotMatch(html, /Verifiez le prix local|litres\/jour de '\+fuelLabel/, page.slug);
  }
});

test("fuel planner declares fuel-specific units and a source-owned runtime", () => {
  for (const page of pages) {
    const html = fs.readFileSync(page.file, "utf8");
    assert.match(html, /data-unit="kg" value="lpg"/, page.slug);
    assert.match(html, /data-unit="L" value="petrol"/, page.slug);
    assert.match(html, /data-unit="L" value="diesel"/, page.slug);
    assert.match(html, /fr-fuel-country-planner\.js/, page.slug);
    assert.doesNotMatch(html, /function n\(el,fallback\)/, "legacy zero-to-ten fallback must be removed");
  }
});

test("priority fuel pages disclose the row date and non-official confidence without changing rates", () => {
  const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, "data/fuel/latest.json"), "utf8"));
  for (const [code, slug] of [["TN", "tunisia"], ["TG", "togo"], ["ML", "mali"], ["NE", "niger"]]) {
    const row = snapshot.countries.find((item) => item.code === code);
    const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${row.last_updated}T00:00:00Z`));
    const html = fs.readFileSync(path.join(FUEL_DIR, slug, "index.html"), "utf8");
    assert.ok(html.includes(`relevé du ${date}`), `${slug}: snippet must disclose the actual row date`);
    if (!row.official_verified) assert.match(html, /Relevé tiers non vérifié par une source officielle/, slug);
    assert.match(html, /Prix à revalider avant utilisation/, slug);
    if (row.source_url) assert.ok(html.includes(`href="${row.source_url}"`), slug);
    else assert.match(html, /Lien de source indisponible pour cette ligne/, slug);
    for (const fuel of ["petrol", "diesel", "lpg"]) {
      assert.ok(html.includes(`data-price="${row[fuel].price}" data-unit="${fuel === "lpg" ? "kg" : "L"}" value="${fuel}"`), `${slug}/${fuel}: snapshot price must remain unchanged`);
    }
  }
  assert.match(sourceDisclosure({ official_verified: true }).label, /non vérifié/, "a verification flag alone cannot establish an official source");
  assert.match(sourceDisclosure({ source_url: "javascript:alert(1)" }).link, /indisponible/, "unusable source links must not be rendered");
});

test("reviewed search snippets preserve dated data, routes and visible FAQ intent", () => {
  const { localizePage } = require("../scripts/build-french-fuel-country-pages");
  const rows = require("../data/fuel/latest.json").countries;
  const registry = new Map(require("../data/registry/countries.json").map(row => [row.id, row]));
  for (const [code, slug] of [["TN", "tunisia"], ["TG", "togo"], ["ML", "mali"]]) {
    const row = rows.find(item => item.code === code), country = registry.get(code);
    country.registryByCode = registry;
    const html = fs.readFileSync(path.join(FUEL_DIR, slug, "index.html"), "utf8");
    assert.match(html, /<title>Prix .*essence et gasoil/i);
    assert.match(html, /<h1[^>]*>Prix .*essence et gasoil/i);
    const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(description.includes(row.currency));
    assert.match(description, /calculateur de budget mensuel/);
    assert.doesNotMatch(description, /prix du jour|temps réel|prix officiel/i);
    const data = schemas(html), faq = data.find(item => item['@type'] === 'FAQPage');
    const answer = faq.mainEntity.find(item => item.name.includes('aujourd’hui')).acceptedAnswer.text;
    assert.match(answer, /ne confirme pas le tarif du jour/);
    assert.ok(visibleText(html).includes(answer));
    assert.equal(data.find(item => item['@type'] === 'Dataset').dateModified, row.last_updated);
    const clean = localizePage(html, row, rows, country);
    assert.equal(localizePage(clean, row, rows, country), clean);
    const stamped = clean.replace('/assets/js/pages/fr-fuel-country-planner.js"', '/assets/js/pages/fr-fuel-country-planner.js?v=synthetic-release-hash"');
    assert.equal(localizePage(stamped, row, rows, country), clean);
    if (code === 'TN') assert.match(answer, /ne distingue pas les différentes qualités commerciales/);
  }
});
