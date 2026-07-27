"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { createPreferredPageUrlResolver } = require("../scripts/lib/seo-preferred-url");
const { extractCanonicalHref } = require("../scripts/lib/canonical-aliases");

const ROOT = path.resolve(__dirname, "..");
const resolvePreferredPageUrl = createPreferredPageUrlResolver();
const cases = [
  ["all-tools/index.html", "https://afrotools.com/tools/"],
  ["central-africa/index.html", "https://afrotools.com/central-african-republic/"],
  ["docs/api/changelog.html", "https://afrotools.com/api/docs/"],
  ["docs/api/fuel/prices.html", "https://afrotools.com/api/docs/"],
  ["docs/api/rate-limits.html", "https://afrotools.com/api/docs/"],
  ["docs/pdf-tools-hub.html", "https://afrotools.com/document-pdf/"],
  ["drc/index.html", "https://afrotools.com/dr-congo/"],
  ["fr/burkina-faso/bf-paye.html", "https://afrotools.com/fr/burkina-faso/calculateur-salaire-net"],
  ["fr/cameroon/cm-paye.html", "https://afrotools.com/fr/cameroun/calculateur-salaire-net"],
  ["fr/cote-divoire/ci-paye.html", "https://afrotools.com/fr/cote-divoire/calculateur-salaire-net"],
  ["fr/drc/index.html", "https://afrotools.com/fr/rdc/"],
  ["fr/mali/ml-paye.html", "https://afrotools.com/fr/mali/calculateur-salaire-net"],
  ["fr/morocco/ma-paye.html", "https://afrotools.com/fr/maroc/calculateur-salaire-net"],
  ["fr/privacy-policy/index.html", "https://afrotools.com/fr/privacy/"],
  ["fr/senegal/sn-paye.html", "https://afrotools.com/fr/senegal/calculateur-salaire-net"],
  ["fr/tools/currency-converter/index.html", "https://afrotools.com/fr/tools/convertisseur-devises/"],
  ["fr/tools/prelevements-cedeao/index.html", "https://afrotools.com/fr/tools/ecowas-levy/"],
  ["fr/tunisia/tn-paye.html", "https://afrotools.com/fr/tunisie/calculateur-salaire-net"],
  ["health-insurance/index.html", "https://afrotools.com/health/"],
  ["mortgage/index.html", "https://afrotools.com/mortgage-property/"],
  ["privacy-policy.html", "https://afrotools.com/privacy/"],
  ["sw/salary-tax/index.html", "https://afrotools.com/sw/mshahara-na-kodi/"],
  ["terms-of-use.html", "https://afrotools.com/terms/"],
  ["fr/tools/affacturage/index.html", "https://afrotools.com/fr/tools/affacturage/"],
];

for (const [relativeFile, expectedUrl] of cases) {
  const filePath = path.join(ROOT, ...relativeFile.split("/"));
  const html = fs.readFileSync(filePath, "utf8");
  const ogUrlMatch =
    html.match(/<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i) ||
    html.match(/<meta\b(?=[^>]*\bcontent=["']([^"']+)["'])(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i);

  assert.strictEqual(
    resolvePreferredPageUrl(filePath),
    expectedUrl,
    `${relativeFile} must resolve to its final permanent public route`
  );
  assert.strictEqual(
    extractCanonicalHref(html),
    expectedUrl,
    `${relativeFile} canonical must match its preferred public URL`
  );
  assert.strictEqual(
    ogUrlMatch ? ogUrlMatch[1] : "",
    expectedUrl,
    `${relativeFile} og:url must match its preferred public URL`
  );
}

const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "daily-seo.yml"), "utf8");
assert.ok(workflow.includes("pull-requests: write"), "daily SEO workflow must be allowed to open a review PR");
assert.ok(workflow.includes("gh pr create"), "daily SEO workflow must submit fixes through a pull request");
assert.ok(
  workflow.includes("steps.maintenance.outputs.paused != 'true'"),
  "daily SEO workflow must honor the maintenance pause switch"
);
assert.ok(!workflow.includes("[skip ci]"), "daily SEO fixes must run normal CI");
assert.ok(!workflow.includes("git push origin main"), "daily SEO workflow must not push fixes directly to main");
assert.ok(!workflow.includes("continue-on-error: true"), "daily SEO fixer failures must stop the workflow");

console.log(`SEO preferred URL resolution passed for ${cases.length} routes.`);
