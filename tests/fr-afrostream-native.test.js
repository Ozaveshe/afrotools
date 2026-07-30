const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

test("AfroStream French route is native, reciprocal, source-led and fail closed", () => {
  const english = read("tools/afrostream/index.html");
  const french = read("fr/tools/afrostream-afrique-s-createur-streaming-hub/index.html");
  const controller = read("assets/js/pages/creative/afrostream-fr-native.js");

  assert.match(english, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/afrostream-afrique-s-createur-streaming-hub\/"/);
  assert.match(french, /<html\b[^>]*\blang="fr"/);
  assert.match(french, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/afrostream-afrique-s-createur-streaming-hub\/">/);
  assert.match(french, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/afrostream\/"/);
  assert.match(french, /<meta name="geo\.region" content="002">/);
  assert.match(french, /assets\/img\/tools\/afrostream\.webp/);
  assert.match(french, /"inLanguage":"fr"/);
  assert.match(french, /engines\/afrostream-engine\.js/);
  assert.match(french, /afrostream-fr-native\.js/);
  assert.doesNotMatch(french, /<iframe\b/i);
  assert.match(french, /aucune donnée fictive n’est affichée/i);
  assert.match(french, /api\/afrostream\/creators/);
  assert.match(controller, /Les données AfroStream sont indisponibles/);
  assert.doesNotMatch(controller, /mock|fallbackCreator|sample creator/i);
  assert.match(read("scripts/lib/french-tool-route-map.js"), /"afrostream-afrique-s-createur-streaming-hub":\s*"afrostream"/);
  assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/afrostream.webp")));
});

test("shared AfroStream engine normalizes public API records for the French controller", async () => {
  const responses = {
    "/api/afrostream/creators": {
      success: true,
      data: [{
        name: "Amina Studio",
        country: "Senegal",
        primary_platform: "youtube",
        categories: "Education",
        subscribers: 12000,
        afro_score: 88,
        slug: "amina-studio",
        updated_at: "2026-07-28T12:00:00Z",
      }],
    },
    "/api/afrostream/streams": { success: true, data: [] },
    "/api/afrostream/news": {
      success: true,
      data: [{
        title: "Creator update",
        category: "News",
        excerpt: "Verified editorial fixture.",
        slug: "creator-update",
        published_at: "2026-07-28T10:00:00Z",
      }],
    },
  };
  const window = {};
  const context = vm.createContext({
    window,
    fetch: async (url) => ({
      ok: true,
      json: async () => responses[url],
    }),
    URL,
    Date,
    Promise,
    console,
  });
  vm.runInContext(read("engines/src/afrostream-engine.js"), context);
  const result = await window.AfroStreamEngine.loadAll();
  assert.equal(result.creators.length, 1);
  assert.equal(result.creators[0].name, "Amina Studio");
  assert.equal(result.creators[0].followers, 12000);
  assert.equal(result.creators[0].score, 88);
  assert.equal(result.news.length, 1);
});
