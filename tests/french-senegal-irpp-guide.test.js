"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const FILE = path.join(__dirname, "..", "fr", "blog", "guide-irpp-senegal-2026", "index.html");
const html = fs.readFileSync(FILE, "utf8");

test("Senegal IRPP guide has a focused French search snippet", () => {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || "";
  assert.match(title, /^IRPP Sénégal 2026/i);
  assert.ok(title.length <= 60, `title is ${title.length} characters`);
  assert.ok(description.length >= 120 && description.length <= 165, `description is ${description.length} characters`);
});

test("Senegal IRPP guide cites official tax, parts and IPRES sources", () => {
  [
    "https://www.finances.gouv.sn/app/uploads/A00703-DGID-TRANSMISSION-DU-RAPPORT-DEVALUATION-BUDGETAIRE-DES-DEPENSES-FISCALE.pdf",
    "https://www.dgid.sn/simulateur-part/",
    "https://www.dgid.sn/procedures-fiscales/",
    "https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Publications/Rapports-statistiques/Rapport-annuel-des-statistiques-du-travail-2024.pdf",
  ].forEach((url) => assert.ok(html.includes(url), `missing source ${url}`));
  assert.match(html, /Vérification fiscale : 16 août 2026/);
});

test("Senegal IRPP guide exposes all seven bands and corrects family-part assumptions", () => {
  for (const rate of ["0 %", "20 %", "30 %", "35 %", "37 %", "40 %", "43 %"]) {
    assert.ok(html.includes(`<td>${rate}</td>`), `missing IRPP band ${rate}`);
  }
  assert.match(html, /1,5 part pour une personne mariée sans enfant/i);
  assert.match(html, /ne calcule pas la réduction pour charges de famille/i);
  assert.doesNotMatch(html, /Marié\(e\) sans enfant[\s\S]{0,100}<td>2 parts/i);
  assert.doesNotMatch(html, /P prenons le cas d'Amadou|Prenons le cas d'Amadou|Prenons maintenant Fatou/i);
  assert.doesNotMatch(html, /881 424 FCFA|397 680 FCFA|401 388 FCFA/);
  assert.doesNotMatch(html, /&mdash;|—/);
});

test("Senegal IRPP structured data matches visible guide limits", () => {
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const article = schemas.find((schema) => schema["@type"] === "BlogPosting");
  const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
  assert.equal(article.dateModified, "2026-08-16");
  assert.equal(article.citation.length, 4);
  assert.equal(faq.mainEntity.length, 4);
  assert.match(faq.mainEntity[1].acceptedAnswer.text, /1,5 part/);
  assert.match(faq.mainEntity[2].acceptedAnswer.text, /avant la réduction/);
});
