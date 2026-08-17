"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const FILE = path.join(__dirname, "..", "fr", "blog", "wave-vs-orange-money-senegal-2026", "index.html");
const html = fs.readFileSync(FILE, "utf8");

test("Wave and Orange guide has a query-aligned French snippet", () => {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || "";
  assert.match(title, /Wave vs Orange Money Sénégal 2026/i);
  assert.ok(title.length <= 60, `title is ${title.length} characters`);
  assert.ok(description.length >= 120 && description.length <= 165, `description is ${description.length} characters`);
  assert.match(html, /twitter:description" content="[^"]{80,}"/i);
});

test("Wave and Orange guide cites first-party tariff and regulatory sources", () => {
  [
    "https://www.wave.com/fr/",
    "https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0",
    "https://www.orange.sn/assistance/search",
    "https://www.bceao.int/sites/default/files/2026-03/",
  ].forEach((url) => assert.ok(html.includes(url), `missing source ${url}`));
  assert.match(html, /Vérification tarifaire : 16 août 2026/);
  assert.match(html, /coût total affiché/i);
});

test("Wave and Orange guide removes reversed and unsupported legacy claims", () => {
  assert.doesNotMatch(html, /transferts entre comptes Wave sont entièrement gratuits/i);
  assert.doesNotMatch(html, /Wave facture 1 % du montant retiré/i);
  assert.doesNotMatch(html, /Orange Money utilise un système de tranches/i);
  assert.doesNotMatch(html, /les deux plateformes ne sont pas interopérables/i);
  assert.doesNotMatch(html, /plus grand réseau d'agents|la plupart des gens utilisent les deux/i);
  assert.doesNotMatch(html, /&mdash;|—/);
});

test("Wave and Orange structured data matches the visible correction", () => {
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const article = schemas.find((schema) => schema["@type"] === "BlogPosting");
  const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
  assert.equal(article.dateModified, "2026-08-16");
  assert.match(article.headline, /quels frais/i);
  assert.equal(article.citation.length, 4);
  assert.equal(faq.mainEntity.length, 4);
  assert.match(faq.mainEntity[0].acceptedAnswer.text, /retraits comme gratuits/i);
});
