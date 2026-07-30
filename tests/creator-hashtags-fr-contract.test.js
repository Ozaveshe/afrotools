const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("Creator Hashtags keeps registry, French AI routing, directory and artwork ownership", () => {
  const registry = read("assets/js/components/tool-registry.js");
  assert.match(registry, /id: 'creator-hashtags'[\s\S]*?href: '\/tools\/creator-hashtags\/'/);
  assert.match(registry, /id: 'hashtags-createur-fr'[\s\S]*?href: '\/fr\/tools\/hashtags-createur\/'[\s\S]*?sourceId: 'creator-hashtags'/);
  assert.match(read("scripts/lib/french-tool-route-map.js"), /"hashtags-createur": "creator-hashtags"/);
  const aiMap = read("assets/js/ai/french-route-map.generated.js");
  assert.ok(aiMap.includes('"/tools/creator-hashtags/":"/fr/tools/hashtags-createur/"'));
  assert.match(read("fr/all-tools/index.html"), /href="\/fr\/tools\/hashtags-createur\/"[^>]+data-id="hashtags-createur-fr"/);
  assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-hashtags.webp")));
});

test("Creator Hashtags keeps reciprocal launchers and noindex workspaces out of hreflang", () => {
  const en = read("tools/creator-hashtags/index.html");
  const fr = read("fr/tools/hashtags-createur/index.html");
  const enApp = read("tools/creator-hashtags/app.html");
  const frApp = read("fr/tools/hashtags-createur/app.html");
  assert.match(en, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/hashtags-createur\/"/);
  assert.match(fr, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-hashtags\/"/);
  for (const app of [enApp, frApp]) {
    assert.match(app, /<meta name="robots" content="noindex, follow">/);
    assert.doesNotMatch(app, /<link rel="alternate" hreflang=/);
  }
  assert.doesNotMatch(en, /1M\+|100K-1M|5 generations per day|AI-powered hashtag/);
  assert.doesNotMatch(fr, /<iframe|Calculateur complet disponible|Ouvrir le calculateur complet/);
});
