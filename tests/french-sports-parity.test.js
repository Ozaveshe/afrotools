const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const { SPORTS } = require("../scripts/lib/fr-sports-contracts.js");
const sportsEngine = require("../assets/js/sports-toolkit.js");
const frenchRouteMap = require("../assets/js/ai/french-route-map.generated.js");
const sourceManifest = require("../data/sports/source-assumption-manifest.json");

const EXPECTED = {
  "betting-odds": "NGN 7,500",
  "afcon-predictor": "8.0%",
  "fantasy-football": "10 pts",
  "betting-tax": "NGN 7,125",
  "streaming-royalties": "USD 250.74",
  "nollywood-box-office": "NGN 75,870,000",
  "dj-booking-rate": "NGN 564,750",
  "concert-budget": "NGN -14,200,240",
  "gym-roi-business": "NGN 6,260,000",
  "event-ticket-revenue": "NGN 13,213,400",
  "match-tickets": "NGN 30,060",
  "sports-scholarship": "89/100",
  "athlete-earnings": "NGN 99,676,248",
  "gaming-pc-build": "1080p balanced",
  "photo-video-pricing": "NGN 1,260,896"
};

function registryRows() {
  const sandbox = { window: {}, document: undefined };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8"),
    sandbox
  );
  return sandbox.AFRO_TOOLS.filter((tool) => (
    tool.category === "sports" && ["live", "new"].includes(tool.status)
  ));
}

const UNSOURCED_SCENARIO_TOOLS = [
  "athlete-earnings",
  "betting-odds",
  "concert-budget",
  "dj-booking-rate",
  "event-ticket-revenue",
  "gaming-pc-build",
  "gym-roi-business",
  "match-tickets",
  "photo-video-pricing"
];

test("Sports denominator is exactly 15 canonical English apps and 15 French mappings", () => {
  const rows = registryRows();
  const english = rows.filter((tool) => (tool.lang || "en") === "en");
  const french = rows.filter((tool) => tool.lang === "fr");
  assert.equal(english.length, 15);
  assert.equal(french.length, 15);
  assert.equal(SPORTS.length, 15);
  assert.deepEqual(
    [...new Set(french.map((tool) => tool.sourceId))].sort(),
    SPORTS.map((tool) => tool.id).sort()
  );
});

test("source and assumption manifest covers all 15 engines without pretending to be live", () => {
  const ids = SPORTS.map((page) => page.id).sort();
  assert.equal(sourceManifest.schemaVersion, 1);
  assert.equal(sourceManifest.live, false);
  assert.equal(sourceManifest.reviewedAt, "2026-07-29");
  assert.deepEqual(Object.keys(sourceManifest.tools).sort(), ids);

  const unsourced = [];
  for (const page of SPORTS) {
    const entry = sourceManifest.tools[page.id];
    assert.equal(entry.engine, "assets/js/sports-toolkit.js");
    assert.equal(entry.englishRoute, `/tools/${page.id}/`);
    assert.equal(entry.frenchRoute, `/fr/tools/${page.frSlug}/`);
    assert.match(entry.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(`${entry.reviewedAt}T00:00:00Z`)));
    assert.ok(entry.asOf.length > 12);
    assert.ok(entry.cadence.length > 12);
    assert.match(entry.state, /^(?:static-formula|static-reference|static-scenario|archived-snapshot)$/);
    assert.equal(entry.live, false);
    assert.match(entry.sourceMode, /^(?:user-entered|scenario-only|official-archived|official-archived-plus-scenario|official-archived-plus-user-entered|official-methodology-plus-scenario|industry-archive-plus-user-entered|official-reference-plus-scenario)$/);
    assert.match(entry.confidence.grade, /^[ABC]$/);
    assert.ok(entry.confidence.label.length > 10);
    assert.ok(entry.confidence.rationale.length > 30);
    assert.ok(Array.isArray(entry.assumptions) && entry.assumptions.length >= 3);
    assert.ok(Array.isArray(entry.mutableBaselines));
    assert.ok(Array.isArray(entry.sources));
    if (!entry.sources.length) {
      unsourced.push(page.id);
      assert.match(entry.sourceMode, /^(?:user-entered|scenario-only)$/);
      assert.ok(entry.sourceRationale.length > 40);
    } else {
      entry.sources.forEach((source) => {
        assert.match(source.url, /^https:\/\//);
        assert.ok(source.title.length > 8);
        assert.ok(source.note.length > 25);
        assert.ok(source.engineTitle.length > 8);
        assert.ok(source.engineNote.length > 15);
        assert.match(source.state, /^(?:archived|static-reference)$/);
      });
    }
  }
  assert.deepEqual(unsourced.sort(), UNSOURCED_SCENARIO_TOOLS);
});

test("manifest preserves every source note emitted by the English engine", () => {
  for (const page of SPORTS) {
    const config = sportsEngine.tools[page.id];
    const input = {};
    for (const field of config.fields) {
      if (field.type !== "heading") input[field.id] = field.value;
    }
    const engineSources = sportsEngine.calculate(page.id, input).sources || [];
    const manifestSources = sourceManifest.tools[page.id].sources;
    assert.deepEqual(
      manifestSources.map((source) => ({
        title: source.engineTitle,
        url: source.url,
        note: source.engineNote
      })),
      engineSources,
      `${page.id} must not drop or rewrite the English engine source contract`
    );
  }
});

test("dated and mutable baselines are explicitly archival or non-current", () => {
  const fpl = sourceManifest.tools["fantasy-football"];
  assert.equal(fpl.state, "archived-snapshot");
  assert.match(fpl.asOf, /2025\/26.*archive/i);

  const afcon = sourceManifest.tools["afcon-predictor"];
  assert.equal(afcon.state, "archived-snapshot");
  assert.match(afcon.asOf, /archive.*Maroc 2025/i);
  assert.match(afcon.assumptions.join(" "), /Aucun entrant 2027/);

  for (const id of ["dj-booking-rate", "gym-roi-business", "match-tickets", "athlete-earnings", "gaming-pc-build", "photo-video-pricing"]) {
    const entry = sourceManifest.tools[id];
    assert.equal(entry.state, "static-scenario");
    assert.match(entry.asOf, /non actuel|non actuels/i);
    assert.ok(entry.mutableBaselines.length >= 2);
  }
});

for (const page of SPORTS) {
  test(`${page.id} keeps the English calculation oracle and owns a native French route`, () => {
    const config = sportsEngine.tools[page.id];
    const input = {};
    for (const field of config.fields) {
      if (field.type !== "heading") input[field.id] = field.value;
    }
    const result = sportsEngine.calculate(page.id, input);
    assert.equal(result.heroValue, EXPECTED[page.id]);

    const file = path.join(ROOT, "fr", "tools", page.frSlug, "index.html");
    const html = fs.readFileSync(file, "utf8");
    const schemas = Array.from(
      html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
      (match) => JSON.parse(match[1])
    ).flat();
    assert.match(html, /lang="fr"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com/fr/tools/${page.frSlug}/">`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com/tools/${page.id}/"`));
    assert.match(html, /data-fr-sports-tool=/);
    assert.match(html, /assets\/js\/sports-toolkit\.js/);
    assert.match(html, /assets\/js\/pages\/fr-sports-parity\.js/);
    assert.match(html, /route-only-local-calculation/);
    assert.match(html, /Aucune donnée en direct inventée/);
    assert.match(html, /Export JSON et impression/);
    assert.match(html, /"sourceConfidence":\{/);
    assert.match(html, /"reviewedAt":"2026-07-29"/);
    assert.match(html, /"live":false/);
    assert.match(html, /"confidence":\{"grade":"[ABC]"/);
    assert.match(html, /"assumptions":\[/);
    assert.doesNotMatch(html, /source-launch|data-fr-prep|<iframe|Ouvrir le calculateur complet|capture-lead|sports-lead-form/);
    assert.ok(schemas.some((schema) => schema["@type"] === "WebApplication"));
    assert.ok(schemas.some((schema) => schema["@type"] === "FAQPage"));

    const englishHtml = fs.readFileSync(path.join(ROOT, "tools", page.id, "index.html"), "utf8");
    assert.match(englishHtml, new RegExp(`hreflang="fr" href="https://afrotools\\.com/fr/tools/${page.frSlug}/"`));

    assert.equal(
      frenchRouteMap.routes[`/tools/${page.id}/`],
      `/fr/tools/${page.frSlug}/`,
      "French deterministic AI routing must open the native route"
    );
  });
}

test("French Sports hub links every route and declares the exact count", () => {
  const html = fs.readFileSync(path.join(ROOT, "fr/sports/index.html"), "utf8");
  assert.match(html, /15 applications Sports et divertissement/);
  assert.match(html, /"numberOfItems":15/);
  for (const page of SPORTS) {
    assert.match(html, new RegExp(`href="/fr/tools/${page.frSlug}/"`));
  }
  const english = fs.readFileSync(path.join(ROOT, "sports/index.html"), "utf8");
  assert.match(english, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/sports\/"/);
});

test("French Sports runtime is local-only, ungated, and supports useful reopenable exports", () => {
  const source = fs.readFileSync(path.join(ROOT, "assets/js/pages/fr-sports-parity.js"), "utf8");
  assert.match(source, /afrotools\.fr\.sports-scenario\.v1/);
  assert.match(source, /data-fr-download/);
  assert.match(source, /data-fr-import/);
  assert.match(source, /data-fr-print/);
  assert.match(source, /data-fr-copy/);
  assert.match(source, /data-fr-source-confidence/);
  assert.match(source, /âge de la revue/);
  assert.match(source, /source\.sources/);
  assert.match(source, /item\.note/);
  assert.match(source, /sourceReview: contract\.sourceConfidence/);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|capture-lead|supabase/i);
});

test("Sports public claims remain planning-only and harm-aware", () => {
  const text = [
    fs.readFileSync(path.join(ROOT, "fr/sports/index.html"), "utf8"),
    ...SPORTS.map((page) => fs.readFileSync(path.join(ROOT, "fr/tools", page.frSlug, "index.html"), "utf8"))
  ].join("\n");
  assert.match(text, /ne poursuivez jamais vos pertes/i);
  assert.match(text, /Planification financière uniquement/);
  assert.match(text, /Aucun risque de blessure, diagnostic, durée de récupération ou aptitude sportive n’est évalué/);
  assert.doesNotMatch(text, /pari gagnant garanti|gain garanti|prédit le gagnant|admission garantie|blessure certaine/i);
});
