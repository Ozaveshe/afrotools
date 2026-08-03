"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-sports-travel-parity-manifest.json");
const artworkQueue = require("../reports/swahili-sports-travel-artwork-queue.json");
const builder = require("../scripts/build-sw-sports-travel-parity.js");
const travelPages = require("../scripts/lib/swahili-travel-pages.js");
const sportsSources = require("../data/sports/source-assumption-manifest.json");
const sportsSourceCopy = require("../data/sports/sw-source-assumption-copy.json");

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function registryRows() {
  const code = read("assets/js/components/tool-registry.js");
  globalThis.__swParityRegistry = null;
  // eslint-disable-next-line no-eval
  eval(code + ";globalThis.__swParityRegistry=AFRO_TOOLS;");
  return globalThis.__swParityRegistry.filter((row) => row.lang === "sw" && manifest.rows.some((entry) => entry.toolId === row.sourceId));
}

test("Swahili Sports/Travel scope is exactly 15 + 9 unique registry rows", () => {
  assert.equal(manifest.rows.length, 24);
  assert.equal(manifest.rows.filter((row) => row.category === "sports").length, 15);
  assert.equal(manifest.rows.filter((row) => row.category === "travel-tourism").length, 9);
  assert.equal(new Set(manifest.rows.map((row) => row.toolId)).size, 24);
  const rows = registryRows();
  assert.equal(rows.length, 24);
  assert.deepEqual(new Set(rows.map((row) => row.sourceId)), new Set(manifest.rows.map((row) => row.toolId)));
});

test("all 24 registry rows describe the native workflow truthfully", () => {
  const rows = registryRows();
  for (const row of rows) {
    assert.doesNotMatch(row.desc, /kisha fungua zana kamili/i, row.sourceId);
  }
  const hotel = rows.find((row) => row.sourceId === "hotel-star-guide");
  assert.equal(hotel.name, "Mwongozo wa bei za hoteli kwa nyota");
  assert.match(hotel.desc, /safu tuli za bei kwa mji, kiwango cha nyota, usiku, vyumba na msimu/i);
  assert.doesNotMatch(hotel.desc, /hoteli mbili|nukuu/i);
  const safari = rows.find((row) => row.sourceId === "safari-cost");
  assert.match(safari.desc, /viwango tuli vya modeli/i);
  assert.doesNotMatch(safari.desc, /nukuu|operator/i);
});

test("canonical registry and locale coverage generated artifacts are fresh", () => {
  execFileSync(process.execPath, ["scripts/build-canonical-registry.js", "--check"], { cwd: ROOT, stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/build-localization-platform.js", "--check"], { cwd: ROOT, stdio: "pipe" });
});

test("Sports truthfully exposes browser print rather than a PDF download", () => {
  const runtime = read("assets/js/pages/sw-sports-parity.js");
  assert.match(runtime, />Chapisha kupitia kivinjari<\/button>/);
  assert.doesNotMatch(runtime, /data-sw-print[^>]*>[^<]*PDF/i);
  assert.match(runtime, /data-sw-print[\s\S]+window\.print\(\)/);
});

test("all 24 pages are generator-owned native Swahili apps with complete route-local metadata", () => {
  for (const row of manifest.rows) {
    const relative = row.swahiliRoute.replace(/^\//, "") + "index.html";
    const html = read(relative);
    assert.equal(html, builder.render(row), `${row.toolId} is stale against its owner`);
    assert.match(html, /<html lang="sw"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com${row.swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
    assert.match(html, new RegExp(`<link rel="alternate" hreflang="sw" href="https://afrotools\\.com${row.swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
    assert.match(html, /<link rel="alternate" hreflang="x-default"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:image"/);
    assert.match(html, /"@type":"WebApplication"/);
    assert.match(html, /"inLanguage":"sw"/);
    assert.match(html, /data-ai-consent/);
    assert.match(html, /halitatumwa na ukurasa huu/);
    assert.doesNotMatch(html, /<iframe\b/i);
    assert.doesNotMatch(html, /sw-free-app-parity|generic-workflow|fungua zana kamili/i);
    assert.ok(fs.existsSync(path.join(ROOT, row.artwork)), `${row.toolId} artwork missing`);
  }
});

test("English app reciprocals stay baseline-only under the two-French-hub authorization", () => {
  let existingReciprocals = 0;
  for (const row of manifest.rows) {
    const html = read(row.englishRoute.replace(/^\//, "") + "index.html");
    const reciprocal = new RegExp(`<link rel="alternate" hreflang="sw" href="https://afrotools\\.com${row.swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`);
    const swahili = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    const swEnglish = new RegExp(`<link rel="alternate" hreflang="en" href="https://afrotools\\.com${row.englishRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`);
    if (reciprocal.test(html)) {
      existingReciprocals += 1;
      assert.match(swahili, swEnglish, row.toolId);
    } else {
      assert.doesNotMatch(swahili, swEnglish, row.toolId);
    }
  }
  assert.equal(existingReciprocals, 10);
  assert.doesNotMatch(read("scripts/build-sw-sports-travel-parity.js"), /addReciprocalSwHreflang/);
});

test("French app reciprocals stay baseline-only; this lane writes only the two authorized French hubs", () => {
  let existingReciprocals = 0;
  for (const row of manifest.rows) {
    const english = read(row.englishRoute.replace(/^\//, "") + "index.html");
    const match = english.match(/<link rel="alternate" hreflang="fr" href="https:\/\/afrotools\.com([^"]+)"\s*\/?>/i);
    assert.ok(match, `${row.toolId} French equivalent missing`);
    const french = read(match[1].replace(/^\//, "") + "index.html");
    const swahili = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    const reciprocal = new RegExp(`<link rel="alternate" hreflang="sw" href="https://afrotools\\.com${row.swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`);
    const swFrench = new RegExp(`<link rel="alternate" hreflang="fr" href="https://afrotools\\.com${match[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`);
    if (reciprocal.test(french)) {
      existingReciprocals += 1;
      assert.match(swahili, swFrench, row.toolId);
    } else {
      assert.doesNotMatch(swahili, swFrench, row.toolId);
    }
  }
  assert.equal(existingReciprocals, 10);
  assert.doesNotMatch(read("scripts/build-sw-sports-travel-parity.js"), /addFrenchReciprocalSwHreflang/);
});

test("Sports pages invoke the real 15-model AfroSports engine and preserve default output oracles", () => {
  global.window = global;
  delete require.cache[require.resolve("../assets/js/sports-toolkit.js")];
  require("../assets/js/sports-toolkit.js");
  const expected = {
    "betting-odds":"NGN 7,500", "afcon-predictor":"8.0%", "fantasy-football":"10 pts",
    "betting-tax":"NGN 7,125", "streaming-royalties":"USD 250.74",
    "nollywood-box-office":"NGN 75,870,000", "dj-booking-rate":"NGN 564,750",
    "concert-budget":"NGN -14,200,240", "gym-roi-business":"NGN 6,260,000",
    "event-ticket-revenue":"NGN 13,213,400", "match-tickets":"NGN 30,060",
    "sports-scholarship":"89/100", "athlete-earnings":"NGN 99,676,248",
    "gaming-pc-build":"1080p balanced", "photo-video-pricing":"NGN 1,260,896"
  };
  for (const row of manifest.rows.filter((entry) => entry.category === "sports")) {
    const config = global.AfroSports.tools[row.toolId];
    assert.ok(config, row.toolId);
    const input = Object.fromEntries(config.fields.filter((field) => field.type !== "heading").map((field) => [field.id, field.value]));
    const result = global.AfroSports.calculate(row.toolId, input);
    assert.equal(result.heroValue, expected[row.toolId], row.toolId);
    assert.ok(result.metrics.length > 0 && result.rows.length > 0, row.toolId);
    assert.doesNotMatch(JSON.stringify(result), /(?:NaN|undefined|Infinity)/, row.toolId);
    const html = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    const pageConfig = JSON.parse(html.match(/<script id="sw-tool-config" type="application\/json">([\s\S]+?)<\/script>/)[1]);
    assert.equal(pageConfig.sourceReview.state, sportsSources.tools[row.toolId].state, row.toolId);
    assert.equal(pageConfig.sourceReview.confidence.grade, sportsSources.tools[row.toolId].confidence.grade, row.toolId);
    assert.equal(pageConfig.sourceReview.live, false, row.toolId);
    assert.equal(pageConfig.sourceReview.asOf, sportsSourceCopy.tools[row.toolId].asOf, row.toolId);
    assert.deepEqual(pageConfig.sourceReview.assumptions, sportsSourceCopy.tools[row.toolId].assumptions, row.toolId);
    assert.deepEqual(pageConfig.sourceReview.mutableBaselines, sportsSourceCopy.tools[row.toolId].mutableBaselines, row.toolId);
    assert.deepEqual(
      pageConfig.sourceReview.sources.map((source) => source.url),
      sportsSources.tools[row.toolId].sources.map((source) => source.url),
      row.toolId
    );
    assert.deepEqual(
      pageConfig.sourceReview.sources.map((source) => ({ title: source.title, note: source.note })),
      sportsSourceCopy.tools[row.toolId].sources,
      row.toolId
    );
  }
  const runtime = read("assets/js/pages/sw-sports-parity.js");
  assert.match(runtime, /result\.bars/);
  assert.match(runtime, /INSIGHTS\[page\.toolId\]/);
  assert.match(runtime, /OPTIONAL_FIELDS/);
  assert.match(runtime, /assertFiniteResult/);
  assert.match(runtime, /fixtureDifficulty/);
  assert.match(runtime, /totalStreams/);
  assert.match(runtime, /paidTickets/);
  assert.match(runtime, /clearStaleResult/);
  assert.match(runtime, /localizedResult/);
  assert.match(runtime, /sourceReview\.sources/);
  assert.match(runtime, /sourceReview\.assumptions/);
});

test("Sports hub owns exactly 15 artwork-backed routes and the English hub reciprocates", () => {
  const rows = manifest.rows.filter((row) => row.category === "sports");
  const hub = read("sw/michezo/index.html");
  assert.equal(hub, builder.renderSportsHub());
  assert.match(hub, /"numberOfItems":15/);
  for (const row of rows) {
    assert.equal((hub.match(new RegExp(`href="${row.swahiliRoute}"`, "g")) || []).length, 1, row.toolId);
    assert.match(hub, new RegExp(`src="${row.artwork}"`), row.toolId);
  }
  assert.match(read("sports/index.html"), /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/michezo\/"/);
  assert.match(hub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/sports\/"/);
  assert.match(read("fr/sports/index.html"), /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/michezo\/"/);
  assert.match(hub, /name="afrotools-content-id" content="sw-sports-travel:michezo"/);
});

test("Travel hub owns exactly 9 artwork-backed routes and the English hub reciprocates", () => {
  const rows = manifest.rows.filter((row) => row.category === "travel-tourism");
  const hub = read("sw/usafiri-utalii/index.html");
  assert.equal(hub, builder.renderTravelHub());
  assert.match(hub, /"numberOfItems":9/);
  for (const row of rows) {
    assert.equal((hub.match(new RegExp(`href="${row.swahiliRoute}"`, "g")) || []).length, 1, row.toolId);
    assert.match(hub, new RegExp(`src="${row.artwork}"`), row.toolId);
  }
  assert.match(read("travel/index.html"), /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/usafiri-utalii\/"/);
  assert.match(hub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/travel\/"/);
  assert.match(read("fr/travel/index.html"), /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/usafiri-utalii\/"/);
  assert.match(hub, /name="afrotools-content-id" content="sw-sports-travel:usafiri-utalii"/);
  const surfaceOwner = read("scripts/build-swahili-product-surface.js");
  assert.match(surfaceOwner, /'sw\/michezo\/index\.html'/);
  assert.match(surfaceOwner, /'sw\/usafiri-utalii\/index\.html'/);
  assert.match(surfaceOwner, /data\/audits\/swahili-free-app-acceptance\.json/);
  assert.match(surfaceOwner, /data\/localization\/sw-sports-travel-parity-manifest\.json/);
});

test("the current surface owner preserves all 199 coordinator-accepted routes", () => {
  const acceptance = JSON.parse(read("data/audits/swahili-free-app-acceptance.json"));
  const accepted = acceptance.entries.filter((entry) => entry.status === "accepted");
  assert.equal(accepted.length, 199);
  const acceptedRoutes = new Set(accepted.map((entry) => entry.swahiliRoute));
  assert.equal(manifest.rows.filter((entry) => acceptedRoutes.has(entry.swahiliRoute)).length, 0);
  const surfaceOwner = read("scripts/build-swahili-product-surface.js");
  assert.match(surfaceOwner, /entry\.status === 'accepted'/);
  assert.match(surfaceOwner, /acceptedParityHtml\.has\(rel\)/);
  assert.match(surfaceOwner, /sportsTravelParityHtml\.has\(rel\)/);
});

test("Travel apps extract and pin nine distinct English owner workflows", () => {
  assert.doesNotMatch(read("scripts/build-sw-sports-travel-parity.js"), /TRAVEL_FIELDS|fieldHtml\s*\(/);
  assert.match(read("assets/js/pages/sw-travel-parity.js"), /swTravelGenericWorkflowRetired/);
  const rows = manifest.rows.filter((entry) => entry.category === "travel-tourism");
  const contracts = rows.map((row) => travelPages.ownerContract(row));
  assert.equal(contracts.length, 9);
  const signatures = contracts.map((owner) => owner.fieldIds.join("|"));
  assert.equal(new Set(signatures).size, 9);
  assert.equal(new Set(contracts.map((owner) => owner.ownerHash)).size, 9);
  for (const [index, owner] of contracts.entries()) {
    const row = rows[index];
    const html = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    assert.match(html, new RegExp(`data-english-owner-sha256="${owner.ownerHash}"`), row.toolId);
    assert.ok(owner.fieldIds.length >= 3, row.toolId);
    assert.ok(owner.action && owner.resultId, row.toolId);
    assert.equal(owner.source.live, false, row.toolId);
    assert.equal(owner.source.reviewedAt, "2026-07-31", row.toolId);
    assert.match(owner.source.asOf, /si data ya moja kwa moja/, row.toolId);
    assert.ok(owner.source.assumptions.length > 0, row.toolId);
    assert.ok(owner.source.mutableBaselines.length > 0, row.toolId);
    if (row.toolId === "travel-vaccination-cost") {
      assert.equal(owner.healthBoundary, false);
      assert.equal(owner.safetyMode, "deterministic-cost-schedule");
      assert.match(html, /function calcVacc\s*\(/);
      assert.match(html, /data-sw-english-owner-model=/);
      assert.match(html, /WHO/);
    }
    assert.match(html, new RegExp(`data-sw-english-owner-model="${owner.ownerHash}"`), row.toolId);
    assert.ok(html.includes(owner.ownerScript), `${row.toolId} owner model was not preserved`);
  }
});

test("runtime is local-only, ungated, and supports parseable/reopenable exports", () => {
  for (const file of ["assets/js/pages/sw-sports-parity.js", "assets/js/pages/sw-travel-owner-parity.js"]) {
    const source = read(file);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|capture-lead|lead-gate/i);
    assert.match(source, /application\/json/);
    assert.match(source, /JSON\.parse/);
    assert.match(source, /local/i);
  }
  assert.match(read("assets/js/pages/sw-sports-parity.js"), /schemaVersion/);
  assert.match(read("assets/js/pages/sw-sports-parity.js"), /local-export/);
  assert.match(read("assets/js/pages/sw-travel-owner-parity.js"), /afrotools\.sw\.travel-owner\.v2/);
  assert.match(read("assets/js/pages/sw-travel-owner-parity.js"), /splitTextToSize/);
  assert.match(read("assets/js/pages/sw-travel-owner-parity.js"), /documentPdf\.addPage/);
  assert.match(read("assets/js/pages/sw-travel-owner-parity.js"), /pageHeight - bottom/);
  assert.match(read("assets/js/pages/sw-travel-owner-parity.js"), /ownerHash/);
  assert.match(read("assets/js/pages/sw-sports-parity.js"), /data-sw-import-trigger/);
  assert.match(read("assets/js/pages/sw-sports-parity.js"), /aria-controls="sw-sport-import"/);
  for (const row of manifest.rows.filter((entry) => entry.category === "travel-tourism")) {
    const html = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    assert.match(html, /data-sw-import-trigger/);
    assert.match(html, /aria-controls="sw-travel-import"/);
  }
});

test("all 24 pages expose coordinator-owned AI handoff candidates without a lane route map", () => {
  for (const row of manifest.rows) {
    const html = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    assert.match(html, new RegExp(`/sw/ai/\\?tool=${row.toolId}`), row.toolId);
  }
  assert.doesNotMatch(read("scripts/build-sw-sports-travel-parity.js"), /buildSwahiliAiRouteMap|swahili-sports-travel-route-map/);
  assert.equal(fs.existsSync(path.join(ROOT, "assets/js/ai/swahili-sports-travel-route-map.generated.js")), false);
});

test("Travel copy describes the inherited static models without unsupported quote-input claims", () => {
  const exact = {
    "africa-flight": /safu tuli za bei/,
    "airbnb-vs-hotel": /makisio tuli ya Airbnb na hoteli/,
    "hotel-star-guide": /safu tuli za bei kwa mji/,
    "safari-cost": /viwango tuli vya modeli/
  };
  for (const row of manifest.rows.filter((entry) => exact[entry.toolId])) {
    const html = read(row.swahiliRoute.replace(/^\//, "") + "index.html");
    assert.match(html, exact[row.toolId], row.toolId);
  }
  assert.doesNotMatch(builder.META["africa-flight"][1], /nukuu ulizoingiza/);
  assert.doesNotMatch(builder.META["airbnb-vs-hotel"][1], /nukuu mbili/);
  assert.doesNotMatch(builder.META["hotel-star-guide"][1], /hoteli mbili/);
  assert.doesNotMatch(builder.META["safari-cost"][1], /nukuu ya mwendeshaji/);
});

test("artwork receipt remains scoped and does not promote coordinator-owned acceptance", () => {
  assert.equal(artworkQueue.dedicatedArtworkPresent, 24);
  assert.equal(artworkQueue.missingArtwork, 0);
  assert.deepEqual(artworkQueue.queue, []);
});
