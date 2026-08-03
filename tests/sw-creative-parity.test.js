"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-creative-parity-manifest.json");
const receipt = require("../reports/sw-creative-parity-receipt.json");
const artwork = require("../reports/sw-creative-parity-artwork.json");

assert.equal(manifest.scope.categoryKey, "creative");
assert.equal(manifest.scope.exactRows, 46);
assert.equal(manifest.rows.length, 46);
assert.equal(new Set(manifest.rows.map((row) => row.englishId)).size, 46);
assert.equal(new Set(manifest.rows.map((row) => row.swahiliRoute)).size, 46);
assert.equal(manifest.totals.acceptedCandidate, 12);
assert.equal(manifest.totals.blocked, 34);
assert.equal(manifest.totals.artworkCovered, 46);
assert.equal(receipt.acceptedCandidateIds.length, 12);
assert.equal(receipt.blocked.length, 34);
assert.deepEqual(artwork, { scoped: 46, covered: 46, missing: [] });

const accepted = manifest.rows.filter((row) => row.status === "accepted-candidate");
const blocked = manifest.rows.filter((row) => row.status === "blocked");
const mediaBlocked = new Set(["creator-clip", "creator-record", "creator-voice"]);
const expectedProductBlocked = new Set(manifest.rows
  .filter((row) => row.status === "blocked" && !mediaBlocked.has(row.englishId))
  .map((row) => row.englishId));

assert.deepEqual(new Set(blocked.filter((row) => /codec|capture/i.test(row.blocker)).map((row) => row.englishId)), mediaBlocked);
assert.deepEqual(new Set(blocked.filter((row) => !mediaBlocked.has(row.englishId)).map((row) => row.englishId)), expectedProductBlocked);

function htmlFor(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function quoted(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const row of manifest.rows) {
  assert.ok(fs.existsSync(path.join(ROOT, row.swahiliFile)), `${row.englishId}: Swahili file missing`);
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.replace(/^\//, ""))), `${row.englishId}: artwork missing`);
  const sw = htmlFor(row.swahiliFile);
  assert.match(sw, /<html\b[^>]*\blang=["']sw["']/i, `${row.englishId}: lang`);
  assert.match(sw, new RegExp(`<link\\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']https://afrotools\\.com${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: canonical`);
  assert.match(sw, new RegExp(`<link\\b(?=[^>]*hreflang=["']en["'])[^>]*href=["']https://afrotools\\.com${quoted(row.englishRoute)}["']`, "i"), `${row.englishId}: en alternate`);
  assert.match(sw, new RegExp(`<link\\b(?=[^>]*hreflang=["']sw["'])[^>]*href=["']https://afrotools\\.com${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: sw alternate`);
  const en = htmlFor(`${row.englishRoute.replace(/^\//, "").replace(/\/$/, "")}/index.html`);
  assert.match(en, new RegExp(`hreflang=["']sw["'][^>]*href=["']https://afrotools\\.com${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: English reciprocal`);
  if (row.frenchRoute) {
    const fr = htmlFor(`${row.frenchRoute.replace(/^\//, "").replace(/\/$/, "")}/index.html`);
    assert.match(fr, new RegExp(`hreflang=["']sw["'][^>]*href=["']https://afrotools\\.com${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: French reciprocal`);
  }

  if (row.status === "accepted-candidate") {
    assert.match(sw, /sw-creative-parity\.css/i, `${row.englishId}: scoped CSS`);
    assert.match(sw, new RegExp(`name=["']afrotools-sw-native-owner["'][^>]*content=["']${quoted(row.englishId)}["']`, "i"), `${row.englishId}: native owner`);
    assert.match(sw, /name=["']afrotools-sw-source-owner["'][^>]*content=["']scripts\/build-sw-creative-parity\.js["']/i, `${row.englishId}: source owner`);
    assert.doesNotMatch(sw, /<iframe\b/i, `${row.englishId}: accepted route cannot be iframe`);
    assert.doesNotMatch(sw, /Fungua zana kamili ya Kiingereza/i, `${row.englishId}: accepted route cannot hand off to English`);
    assert.doesNotMatch(sw, /files never leave your (?:browser|kivinjari)/i, `${row.englishId}: visible English privacy leak`);
  } else {
    assert.ok(row.blocker, `${row.englishId}: blocked row requires reason`);
  }
}

const exact = accepted.filter((row) => /\/engines\//.test(row.engineOwner));
assert.equal(exact.length, 12);

const creativeHub = htmlFor("sw/ubunifu-na-watayarishi/index.html");
const imageHub = htmlFor("sw/picha-na-design/index.html");
assert.match(creativeHub, /name=["']afrotools-sw-creative-parity-hub-owner["'][^>]*content=["']scripts\/build-sw-creative-parity\.js["']/i);
assert.match(imageHub, /name=["']afrotools-sw-creative-parity-hub-owner["'][^>]*content=["']scripts\/build-sw-creative-parity\.js["']/i);
for (const row of accepted) {
  assert.match(creativeHub, new RegExp(`href=["']${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: creator hub discovery`);
}
for (const row of accepted.filter((row) => ["african-palette", "photography-pricing", "wedding-photo-package"].includes(row.englishId))) {
  assert.match(imageHub, new RegExp(`href=["']${quoted(row.swahiliRoute)}["']`, "i"), `${row.englishId}: image hub discovery`);
}

function loadEngine(file, globalPath) {
  const context = { console, Intl, Date, Math, Number, Object, Array, String, JSON, Set, Map };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, file.replace(/^\//, "")), "utf8"), context, { filename: file });
  let cursor = context;
  for (const part of globalPath.split(".")) cursor = cursor && cursor[part];
  assert.ok(cursor, `${file}: engine global ${globalPath}`);
  return cursor;
}

function configFor(row) {
  const html = htmlFor(row.swahiliFile);
  const match = html.match(/<script id="swCreativeConfig" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, `${row.englishId}: runtime config`);
  return JSON.parse(match[1]);
}

function defaults(config) {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.type === "checkboxes" ? field.options.filter((option) => option.checked).map((option) => option.value) : field.value]));
}

const expectedEngines = {
  "african-palette": ["AfroTools.AfricanPaletteEngine", (api, input) => api.getPalette(input.paletteId), (value) => value && value.colors.length === 5],
  "art-commission": ["AfroTools.ArtCommissionEngine", (api, input) => api.calculate(input), (value) => value.price > 0 && value.hourlyRate > 0],
  "book-publishing-cost": ["AfroTools.BookPublishingCostEngine", (api, input) => api.calculate(input), (value) => value.totalUSD > 0 && value.breakEven > 0],
  "engagement-rate": ["AfroTools.EngagementRateEngine", (api, input) => api.calculate(input), (value) => value.interactions === 1260 && value.rate > 5],
  "music-royalty-splitter": ["AfroTools.MusicRoyaltySplitterEngine", (api, input) => api.calculate({ title: input.title, country: input.country, totalRoyalties: input.totalRoyalties, period: input.period, collaborators: [{ id: 1, name: input.nameOne, role: input.roleOne, pct: input.shareOne }, { id: 2, name: input.nameTwo, role: input.roleTwo, pct: input.shareTwo }, { id: 3, name: input.nameThree, role: input.roleThree, pct: input.shareThree }] }), (value) => value.ok && value.splitTotal === 100 && value.shares.length === 3],
  "photography-pricing": ["AfroTools.PhotographyPricingEngine", (api, input) => api.calculate(input), (value) => value.sessionPrice > 0 && value.hourlyRate > 0],
  "podcast-monetization": ["AfroTools.PodcastMonetizationEngine", (api, input) => api.calculate(input), (value) => value.total > 0 && value.streams.length === 6],
  "self-publishing-royalty": ["AfroTools.SelfPublishingRoyaltyEngine", (api, input) => api.calculate(input), (value) => value.best && value.platforms.length >= 3],
  "wedding-photo-package": ["AfroTools.WeddingPhotoPackageEngine", (api, input) => api.calculate(input), (value) => value.total > 0 && value.items.length >= 2],
  "creator-club": ["AfroTools.creatorFinalWave", (api, input) => api.calculate("creator-club", input), (value) => value.grossMonthly === 1000 && value.netMonthly === 800],
  "creator-course": ["AfroTools.creatorFinalWave", (api, input) => api.calculate("creator-course", input), (value) => value.modules.length === 3 && value.netRevenue === 700],
  "creator-research": ["AfroTools.creatorFinalWave", (api, input) => api.calculate("creator-research", input), (value) => value.questions.length === 3 && value.sources.length === 2],
};

for (const row of exact) {
  const config = configFor(row);
  const [globalPath, calculate, verify] = expectedEngines[row.englishId];
  assert.ok(globalPath, `${row.englishId}: oracle defined`);
  const api = loadEngine(row.engineOwner, globalPath);
  const first = calculate(api, defaults(config));
  const second = calculate(api, defaults(config));
  assert.ok(verify(first), `${row.englishId}: expected oracle`);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)), `${row.englishId}: deterministic`);
}

console.log("Swahili Creative parity static contract passed: 46 scoped, 12 accepted candidates, 34 fail-closed blocked, 12 shared-engine oracles.");
