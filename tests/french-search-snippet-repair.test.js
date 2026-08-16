"use strict";

const assert = require("assert");
const fs = require("fs");

const repair = require("../scripts/repair-french-search-snippets");
const gapPages = require("../scripts/generate-fr-tool-gap-pages");
const { SPORTS } = require("../scripts/lib/fr-sports-contracts");

assert.ok(
  gapPages.PAGES.every((page) => gapPages.searchTitleFor(page).length <= 65),
  "French gap-page source titles must preserve the task before search truncation"
);
assert.ok(
  SPORTS.every((page) => page.seoTitle.length >= 30 && page.seoTitle.length <= 65),
  "French Sports source titles must stay descriptive and scannable"
);

assert.strictEqual(repair.countryForSlug("algeria").displayNames.fr, "Algérie");
assert.strictEqual(repair.countryForSlug("cabo-verde").displayNames.fr, "Cap-Vert");
assert.strictEqual(repair.countryForSlug("congo-brazzaville").displayNames.fr, "Congo-Brazzaville");

const senegal = repair.countryForSlug("senegal");
assert.strictEqual(
  repair.legalMetadata(fs.readFileSync("fr/tools/contrat-bail/senegal.html", "utf8"), senegal, "contrat-bail").title,
  "Contrat de bail — Sénégal | AfroTools"
);
assert.strictEqual(
  repair.fuelMetadata(fs.readFileSync("fr/tools/suivi-carburant/senegal/index.html", "utf8"), senegal).title,
  "Prix du carburant — Sénégal | AfroFuel"
);
assert.strictEqual(
  repair.insuranceMetadata(fs.readFileSync("fr/tools/assurance-obseques/senegal.html", "utf8"), senegal, "assurance-obseques").title,
  "Assurance obsèques — Sénégal | AfroTools"
);
assert.strictEqual(
  repair.insuranceMetadata(fs.readFileSync("fr/tools/assurance-vie/senegal.html", "utf8"), senegal, "assurance-vie").title,
  "Assurance vie — Sénégal : couverture | AfroTools"
);
assert.strictEqual(
  repair.insuranceMetadata(fs.readFileSync("fr/tools/assurance-auto/senegal.html", "utf8"), senegal, "assurance-auto").title,
  "Assurance auto — Sénégal | AfroTools"
);
assert.strictEqual(
  repair.insuranceMetadata(fs.readFileSync("fr/tools/comparateur-assurance-sante/senegal.html", "utf8"), senegal, "comparateur-assurance-sante").title,
  "Assurance santé — Sénégal | AfroTools"
);

const result = repair.run({ write: false });
assert.strictEqual(result.targets, 261, "the four 54-country and three 15-country French snippet families must stay explicit");
assert.deepStrictEqual(result.stale, [], "French country snippet outputs must match their source-level repair contract");

for (const target of repair.targets()) {
  const html = fs.readFileSync(target.file, "utf8");
  assert.match(html, /<html\b[^>]*lang="fr"/i, `${target.file} must remain French`);
  assert.doesNotMatch(html, /<title>Fuel prices in /i, `${target.file} must not retain an English fuel title`);
  assert.doesNotMatch(html, /<meta\s+name="description"\s+content="Generate /i, `${target.file} must not retain an English legal description`);
  assert.doesNotMatch(html, /<(?:title|h1)>[^<]*(?:\ben|\bau|\baux|\bà)\s+(?:Sénégal|Algérie|Ghana|Kenya)\b/i, `${target.file} must not rely on one country preposition template`);
  if (target.family === "suivi-carburant") {
    assert.doesNotMatch(html, /<p\b[^>]*class="fuel-lede"[^>]*\blang="en"/i, `${target.file} must expose a French fuel introduction`);
    assert.match(html, /<p class="fuel-lede">[^<]*(?:relevé|prix)[^<]*<\/p>/i, `${target.file} must expose a useful French fuel introduction`);
  } else if (target.family === "contrat-bail" || target.family === "contrat-travail") {
    assert.doesNotMatch(html, /<section\b[^>]*class="hero"[^>]*>[\s\S]*?<\/h1>\s*<p>\s*(?:Generate|Create)\b/i, `${target.file} must expose a French legal introduction`);
    assert.match(html, /<section\b[^>]*class="hero"[^>]*>[\s\S]*?<\/h1>\s*<p>[^<]*brouillon[^<]*<\/p>/i, `${target.file} must label the legal output as a draft`);
  } else {
    assert.doesNotMatch(html, /<meta\s+name="description"\s+content="[^"]*(?:Estimate funeral|Calculer your|Factor in dependents)/i, `${target.file} must not retain an English insurance snippet`);
    assert.doesNotMatch(html, /<p\b[^>]*class="ins-tool-hero-sub"[^>]*\blang="en"/i, `${target.file} must expose a French insurance introduction`);
    assert.match(html, /<p class="ins-tool-hero-sub">[^<]*(?:estimez|comparez)[^<]*<\/p>/i, `${target.file} must explain the insurance task in French`);
  }
}

const solarDirectory = "fr/tools/roi-solaire";
const solarPages = fs.readdirSync(solarDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(`${solarDirectory}/${entry.name}/index.html`));
assert.strictEqual(solarPages.length, 54, "all 54 French solar country pages must remain covered");
for (const entry of solarPages) {
  const file = `${solarDirectory}/${entry.name}/index.html`;
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || "";
  const descriptionTag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0] || "";
  const description = descriptionTag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || "";
  assert.ok(title.length <= 65, `${file} title must fit the search review guardrail`);
  assert.ok(description.length >= 70 && description.length <= 180, `${file} description must fit the useful snippet range`);
  assert.match(title, /^ROI solaire — /, `${file} title must lead with the French task`);
  assert.match(description, /estimez le retour solaire/, `${file} description must explain the task in French`);
}

console.log("French search snippet repair tests passed");
