const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const pages = [
  ["en", "tools/business-name-gen/index.html", "https://afrotools.com/tools/business-name-gen/"],
  ["fr", "fr/tools/generateur-nom-entreprise/index.html", "https://afrotools.com/fr/tools/generateur-nom-entreprise/"],
  ["sw", "sw/zana/kitengeneza-jina-la-biashara/index.html", "https://afrotools.com/sw/zana/kitengeneza-jina-la-biashara/"]
];

test("all three native pages use the shared browser-local workshop", () => {
  for (const [locale, file, canonical] of pages) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.match(html, new RegExp(`<html lang="${locale}"`));
    assert.match(html, new RegExp(`data-locale="${locale}"`));
    assert.match(html, /assets\/js\/engines\/business-name-workshop\.js/);
    assert.match(html, /assets\/js\/pages\/business-name-workshop\.js/);
    assert.match(html, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="sw"/);
    assert.match(html, /WebApplication/);
    assert.match(html, /FAQPage/);
    assert.doesNotMatch(html, /Math\.random|localStorage|sessionStorage|availability score|10 African languages/i);
  }
});

test("controller renders safely, keeps state in memory and protects spreadsheet cells", () => {
  const controller = fs.readFileSync(path.join(ROOT, "assets/js/pages/business-name-workshop.js"), "utf8");
  assert.match(controller, /textContent/);
  assert.match(controller, /replaceChildren/);
  assert.doesNotMatch(controller, /innerHTML|localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
  assert.match(controller, /\^\[=\+\\-@\]/);
  assert.match(controller, /application\/json/);
  assert.match(controller, /text\/csv/);
  assert.match(controller, /window\.jspdf\.jsPDF/);
  assert.match(controller, /window\.print/);
});

test("aliases and public metadata make no availability claim", () => {
  const redirects = fs.readFileSync(path.join(ROOT, "_redirects"), "utf8");
  assert.match(redirects, /\/tools\/business-name-generator\/\s+\/tools\/business-name-gen\/\s+301/);
  assert.match(redirects, /\/tools\/business-name-generator\s+\/tools\/business-name-gen\/\s+301/);
  const registry = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
  const row = registry.split(/\r?\n/).find((line) => line.includes("id: 'business-name-gen'"));
  assert.match(row, /African Business Name Shortlist Workshop/);
  assert.doesNotMatch(row, /check CAC|CIPC|RBA|availability/i);
});
