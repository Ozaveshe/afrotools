const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-business-roi-parity.json");
const policy = require("../data/registry/locale-coverage-policy.json");
const fallbacks = require("../data/localization/explicit-language-fallbacks.json");

const expected = new Map([
  ["pomodoro", "/sw/zana/pomodoro/"],
  ["unit-converter", "/sw/zana/kubadilisha-vipimo/"],
  ["budget-planner", "/sw/zana/mpango-bajeti/"],
  ["countdown-timer", "/sw/zana/hesabu-siku-za-tukio/"],
  ["time-zone", "/sw/zana/kigeuzi-saa-za-maeneo/"],
  ["public-holidays", "/sw/zana/kalenda-likizo-za-umma/"],
  ["working-days", "/sw/zana/siku-za-kazi/"],
  ["age-calculator", "/sw/zana/kikokotoo-umri/"],
  ["grade-tracker", "/sw/zana/kifuatiliaji-alama/"],
  ["random-picker", "/sw/zana/chaguo-nasibu/"],
  ["meeting-cost", "/sw/zana/gharama-ya-mkutano/"],
  ["tip-calculator", "/sw/zana/kigawanya-bili-na-tip/"]
]);

function routeFile(route) {
  return path.join(root, route.replace(/^\//, ""), "index.html");
}

function esc(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

assert.strictEqual(manifest.categoryKey, "data-productivity");
assert.strictEqual(manifest.denominator, 12);
assert.strictEqual(manifest.routes.length, 12);
assert.strictEqual(new Set(manifest.routes.map((row) => row.id)).size, 12);
assert.strictEqual(new Set(manifest.routes.map((row) => row.swahili)).size, 12);

const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");
const runtime = fs.readFileSync(path.join(root, "assets/js/pages/sw-business-roi-parity.js"), "utf8");
const fallbackPaths = fallbacks.entries.flatMap((entry) => entry.paths || []);

assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/);
assert.match(runtime, /window\.BusinessRoiEngine/);
assert.match(runtime, /locale:\s*"sw"/);

for (const route of manifest.routes) {
  assert.strictEqual(expected.get(route.id), route.swahili, `${route.id}: exact route`);
  assert.ok(Array.isArray(route.aiIntents) && route.aiIntents.length >= 2, `${route.id}: Sw AI intents`);
  assert.ok(fs.existsSync(path.join(root, route.artwork)), `${route.id}: semantic artwork exists`);
  assert.ok(fs.statSync(path.join(root, route.artwork)).size > 0, `${route.id}: semantic artwork non-empty`);

  const file = routeFile(route.swahili);
  const html = fs.readFileSync(file, "utf8");
  const canonical = `https://afrotools.com${route.swahili}`;
  assert.match(html, /^<!doctype html>/i, `${route.id}: HTML document`);
  assert.match(html, /<html lang="sw"/, `${route.id}: language`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${esc(canonical)}">`), `${route.id}: canonical`);
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${esc(route.english)}"`), `${route.id}: English alternate`);
  assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools\\.com${esc(route.french)}"`), `${route.id}: French alternate`);
  assert.match(html, new RegExp(`property="og:image" content="https://afrotools\\.com/${esc(route.artwork)}"`), `${route.id}: artwork OG`);
  assert.match(html, /"inLanguage":"sw"/, `${route.id}: Sw schema`);
  assert.match(html, /window\.AfroLocalOnly=true/, `${route.id}: local-only contract`);
  assert.match(html, /src="\/engines\/business-roi-engine\.js"/, `${route.id}: shared engine`);
  assert.match(html, /src="\/assets\/js\/pages\/sw-business-roi-parity\.js"/, `${route.id}: native runtime`);
  assert.match(html, /data-export="pdf"/, `${route.id}: PDF export`);
  assert.match(html, /data-export="csv"/, `${route.id}: CSV export`);
  assert.match(html, /data-export="json"/, `${route.id}: JSON export`);
  assert.match(html, /data-export="txt"/, `${route.id}: TXT export`);
  if ((route.extraFormats || []).includes("ics")) assert.match(html, /data-export="ics"/, `${route.id}: ICS export`);
  assert.doesNotMatch(html, /<iframe\b|https?:\/\/[^"']+\.js\b|This (?:tool|page) is available in English/i, `${route.id}: no transplant or hidden fallback`);

  const english = fs.readFileSync(routeFile(route.english), "utf8");
  assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools\\.com${esc(route.swahili)}"`), `${route.id}: reciprocal English hreflang`);

  const owners = policy.overrides.filter((row) => row.route === route.swahili);
  assert.strictEqual(owners.length, 1, `${route.id}: one locale owner`);
  assert.strictEqual(owners[0].state, "native", `${route.id}: native locale state`);
  assert.strictEqual(owners[0].equivalentRoute, route.english, `${route.id}: equivalent route`);
  assert.match(owners[0].sourceOwner, /build-sw-business-roi-parity\.js/, `${route.id}: maintained generator owner`);

  assert.ok(!fallbackPaths.includes(route.swahili.replace(/^\//, "") + "index.html"), `${route.id}: no explicit English fallback`);
  const registryMatches = registry.split(/\r?\n/).filter((line) => line.includes(`href: '${route.swahili}'`) || line.includes(`href: "${route.swahili}"`));
  assert.strictEqual(registryMatches.length, 1, `${route.id}: one registry row`);
  assert.match(registryMatches[0], /category: ['"]data-productivity['"]/, `${route.id}: registry category`);
  assert.match(registryMatches[0], new RegExp(`sourceId: ['"]${esc(route.id)}['"]`), `${route.id}: registry English owner`);
  assert.match(registryMatches[0], new RegExp(`imageId: ['"]${esc(route.id)}['"]`), `${route.id}: registry artwork owner`);
}

const hub = fs.readFileSync(routeFile(manifest.hub.route), "utf8");
assert.match(hub, /<html lang="sw"/);
assert.match(hub, /"numberOfItems":12/);
assert.match(hub, /href="\/sw\/ai\/"/);
assert.strictEqual((hub.match(/data-business-card=/g) || []).length, 12);
for (const route of manifest.routes) {
  assert.match(hub, new RegExp(`data-business-card="${esc(route.id)}"[\\s\\S]*?href="${esc(route.swahili)}"`), `${route.id}: exact hub card link`);
}

const hubOwners = policy.overrides.filter((row) => row.route === manifest.hub.route);
assert.strictEqual(hubOwners.length, 1);
assert.strictEqual(hubOwners[0].state, "native");
assert.strictEqual(hubOwners[0].equivalentRoute, manifest.hub.english);

console.log("Swahili Business & ROI static parity: 12/12 apps + 1 hub passed.");
