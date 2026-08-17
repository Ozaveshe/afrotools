"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const FILE = path.join(__dirname, "..", "fr", "blog", "frais-orange-money-guide-2026", "index.html");
const html = fs.readFileSync(FILE, "utf8");

test("Orange Money guide targets the observed withdrawal intent with a usable snippet", () => {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || "";
  assert.match(title, /Frais Orange Money 2026.*retrait au Cameroun/i);
  assert.ok(title.length <= 60, `title is ${title.length} characters`);
  assert.ok(description.length >= 120 && description.length <= 160, `description is ${description.length} characters`);
  assert.doesNotMatch(html, /twitter:description" content="[^"]*$|C&ocirc;te d"/im);
});

test("Orange Money guide cites each official country tariff owner", () => {
  [
    "https://orangemoney.orange.cm/fr/tarification-orange-money.html",
    "https://www.orange.sn/assistance/tutoriels/lancement-du-nouveau-modele-orange-money-0",
    "https://www.orangemali.com/fr/gestion-de-compte/le-retrait-dargent.html",
    "https://www.orange.ci/fr/tarifs-orange-money.html",
  ].forEach((url) => assert.match(html, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  assert.match(html, /16 août 2026/);
  assert.match(html, /vérifiez toujours le récapitulatif/i);
});

test("Orange Money guide no longer publishes the unsupported legacy claims", () => {
  assert.doesNotMatch(html, /plus de 30 millions d'utilisateurs|service de mobile money le plus utilisé/i);
  assert.doesNotMatch(html, /Western Union.*(?:2 500|3 500)|Tous les frais Orange Money/i);
  assert.doesNotMatch(html, /500 &mdash; 1 500[\s\S]*?<td>50<\/td>/i);
});

test("Orange Money structured data matches the refreshed article", () => {
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const article = schemas.find((schema) => schema["@type"] === "BlogPosting");
  const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
  assert.equal(article.dateModified, "2026-08-16");
  assert.match(article.headline, /Frais de retrait Orange Money 2026/);
  assert.equal(faq.mainEntity.length, 4);
  assert.match(faq.mainEntity[0].name, /Cameroun/);
});
