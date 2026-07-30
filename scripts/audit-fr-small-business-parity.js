"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { routes } = require("./lib/fr-small-business-parity-config");
const { FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL } = require("./lib/french-tool-route-map");
const frenchAiRouteMap = require("../assets/js/ai/french-route-map.generated");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/localization/fr-small-business-parity.json"), "utf8"));
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");
const missingArtwork = [];

assert.strictEqual(manifest.denominator, 28);
assert.strictEqual(manifest.routes.length, 28);
assert.strictEqual(routes.length, 28);

for (const route of routes) {
  const frenchPath = `/fr/tools/${route.slug}/`;
  const englishPath = `/tools/${route.id}/`;
  const file = path.join(root, "fr", "tools", route.slug, "index.html");
  const englishFile = path.join(root, "tools", route.id, "index.html");
  assert(fs.existsSync(file), `${frenchPath} is missing`);
  const html = fs.readFileSync(file, "utf8");
  const english = fs.readFileSync(englishFile, "utf8");
  assert(html.includes('<html lang="fr"'));
  assert(html.includes('data-parity-root="fr-small-business-sme-parity"'));
  assert(html.includes(`data-sme-tool="${route.id}"`));
  assert(html.includes(`rel="canonical" href="https://afrotools.com${frenchPath}"`));
  assert(html.includes(`hreflang="en" href="https://afrotools.com${englishPath}"`));
  assert(english.includes(`hreflang="fr" href="https://afrotools.com${frenchPath}"`), `${englishPath} lacks reciprocal French hreflang`);
  assert(!/<iframe\b/i.test(html), `${frenchPath} is still an iframe bridge`);
  assert(!/bridge handoff|open the english|version anglaise ci-dessous/i.test(html), `${frenchPath} retains bridge copy`);
  assert(html.includes('"@type":"SoftwareApplication"'));
  assert.strictEqual(FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL[route.slug], route.id, `${route.slug} route-map ownership is missing`);
  assert.strictEqual(
    frenchAiRouteMap.routes[englishPath],
    frenchPath,
    `${route.id} French AI routing is missing`
  );
  assert(
    new RegExp(`href:\\s*["']${frenchPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^\\n]*sourceId:\\s*["']${route.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(registry),
    `${route.slug} registry ownership is missing`
  );
  const artwork = path.join(root, "assets", "img", "tools", `${route.id}.webp`);
  if (!fs.existsSync(artwork)) missingArtwork.push(`assets/img/tools/${route.id}.webp`);
}

const hub = fs.readFileSync(path.join(root, "fr", "small-business", "index.html"), "utf8");
assert.strictEqual((hub.match(/<li><a href="\/fr\/tools\//g) || []).length, 28);
assert(hub.includes('"numberOfItems":28'));

const reportDir = path.join(root, "reports");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "fr-small-business-missing-artwork.json"), `${JSON.stringify({
  category: "Small Business & SME",
  denominator: 28,
  missingCount: missingArtwork.length,
  missing: missingArtwork
}, null, 2)}\n`);

console.log(`PASS fr-small-business static parity: 28/28 routes; artwork missing ${missingArtwork.length}`);
