const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const { PAGES, renderPage, renderHub } = require("../scripts/lib/french-travel-pages");
const routeMap = require("../scripts/lib/french-tool-route-map");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function registry() {
  const context = { document: undefined, window: {} };
  vm.createContext(context);
  vm.runInContext(read("assets/js/components/tool-registry.js"), context);
  return context.AFRO_TOOLS;
}

test("French Travel owns exactly the nine canonical English contracts", () => {
  const expected = [
    "africa-flight", "airbnb-vs-hotel", "airport-transfer", "beach-holiday-budget",
    "festival-travel-budget", "hotel-star-guide", "safari-cost",
    "travel-packing-list", "travel-vaccination-cost",
  ];
  assert.deepEqual(PAGES.map((page) => page.enSlug), expected);
  assert.equal(new Set(PAGES.map((page) => page.frSlug)).size, 9);
});

test("all nine generated apps are native, private, source-labeled and reciprocal", () => {
  for (const page of PAGES) {
    const relative = `fr/tools/${page.frSlug}/index.html`;
    const html = read(relative);
    const english = read(`tools/${page.enSlug}/index.html`);
    const rendered = renderPage(page);
    assert.match(rendered, new RegExp(`afrotools-content-id" content="fr-travel:${page.enSlug}"`));
    assert.match(html, new RegExp(`afrotools-content-id" content="fr-travel:${page.enSlug}"`));
    assert.match(html, /afrotools-source-owner" content="scripts\/lib\/french-travel-pages\.js"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com/fr/tools/${page.frSlug}/">`));
    assert.match(html, new RegExp(`<link rel="alternate" hreflang="en" href="https://afrotools\\.com/tools/${page.enSlug}/">`));
    if (page.swSlug) assert.match(html, new RegExp(`<link rel="alternate" hreflang="sw" href="https://afrotools\\.com/sw/zana/${page.swSlug}/">`));
    assert.match(english, new RegExp(`hreflang="fr" href="https://afrotools\\.com/fr/tools/${page.frSlug}/"`));
    assert.match(html, new RegExp(`og:image" content="https://afrotools\\.com/assets/img/tools/${page.enSlug}\\.webp"`));
    assert.match(html, /"@type"\s*:\s*"WebApplication"/);
    assert.match(html, /data-ai-consent-boundary/);
    assert.match(html, /data-ai-local-fallback="complete"/);
    assert.match(html, /Les saisies restent en mémoire de page/);
    assert.match(html, /data-fr-travel-form/);
    assert.match(html, /data-export-json/);
    assert.match(html, /data-import-json/);
    assert.match(html, /data-export-pdf/);
    assert.ok(fs.existsSync(path.join(ROOT, `assets/img/tools/${page.enSlug}.webp`)), `${page.enSlug} artwork`);
  }
});

test("hub, registry and route map reconcile 9/9 without duplicate owners", () => {
  const hub = read("fr/travel/index.html");
  assert.match(renderHub(), /afrotools-content-id" content="fr-travel:hub"/);
  assert.match(hub, /afrotools-content-id" content="fr-travel:hub"/);
  assert.match(hub, /afrotools-source-owner" content="scripts\/lib\/french-travel-pages\.js"/);
  assert.match(hub, /"numberOfItems":9/);
  const tools = registry();
  for (const page of PAGES) {
    const href = `/fr/tools/${page.frSlug}/`;
    assert.equal((hub.match(new RegExp(`href="${href}"`, "g")) || []).length, 1, `${page.enSlug} hub link`);
    const rows = tools.filter((tool) => tool.lang === "fr" && tool.sourceId === page.enSlug);
    assert.equal(rows.length, 1, `${page.enSlug} French registry owner`);
    assert.equal(rows[0].href, href);
    assert.equal(routeMap.FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL[page.frSlug], page.enSlug);
  }
});

test("shared runtime is local-only and keeps high-stakes boundaries fail-closed", () => {
  const runtime = read("assets/js/pages/french-travel-parity.js");
  assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
  assert.match(runtime, /n’invente aucun tarif/);
  assert.match(runtime, /source organisateur/);
  assert.match(runtime, /autorité du parc/);
  assert.match(runtime, /professionnel de santé/);
  assert.match(runtime, /schemaVersion: 1/);
  assert.match(runtime, /application\/json/);
  assert.match(runtime, /window\.jspdf/);
});

test("coverage-wave source marks the native safari owner as unmanaged by the generated registry block", () => {
  const wave = require("../data/localization/coverage-wave-2026-07.json");
  const safari = wave.french.find((entry) => entry.enSlug === "safari-cost");
  assert.equal(safari.native, true);
  assert.equal(safari.registryManaged, false);
  assert.doesNotMatch(read("assets/js/components/tool-registry.js"), /safari-cost-fr-coverage-safari-cost/);
});
