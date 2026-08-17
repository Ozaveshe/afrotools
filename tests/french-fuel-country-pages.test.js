"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

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
