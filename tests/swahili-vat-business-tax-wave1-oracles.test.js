"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "swahili-vat-business-tax-wave1.json"),
  "utf8"
));

function routeFile(route) {
  const relative = route.replace(/^\/+/, "").replace(/\/$/, "");
  const candidates = [
    path.join(ROOT, relative, "index.html"),
    path.join(ROOT, `${relative}.html`)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function alternateMap(html) {
  const result = new Map();
  for (const match of html.matchAll(/<link\b[^>]*\brel=["']alternate["'][^>]*>/gi)) {
    const tag = match[0];
    const language = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (language && href) {
      result.set(language[1].toLowerCase(), new URL(href[1], "https://afrotools.com").pathname);
    }
  }
  return result;
}

assert.strictEqual(manifest.schemaVersion, 1);
assert.strictEqual(manifest.routes.length, 14);
assert.strictEqual(manifest.businessRoutes.length, 2);
assert.strictEqual(new Set(
  manifest.routes.concat(manifest.businessRoutes).map((route) => route.id)
).size, 16);

for (const fixture of manifest.routes) {
  const engine = require(path.join(ROOT, fixture.engine));
  const actual = engine.calculate(fixture.input);
  for (const [key, expected] of Object.entries(fixture.expected)) {
    assert.strictEqual(actual[key], expected, `${fixture.id} ${key}`);
  }

  assert.throws(
    () => engine.calculate({ ...fixture.input, amount: "" }),
    /amount is required/,
    `${fixture.id} must reject an empty amount`
  );
  assert.throws(
    () => engine.calculate({ ...fixture.input, amount: -0.01 }),
    /non-negative/,
    `${fixture.id} must reject a negative amount`
  );

  const extracted = engine.calculate({
    ...fixture.input,
    amount: fixture.extractInput,
    mode: "extract"
  });
  assert.strictEqual(
    extracted.net,
    fixture.expected.net,
    `${fixture.id} extract boundary net`
  );
  assert.strictEqual(extracted.gross, fixture.extractInput, `${fixture.id} extract gross`);

  if (fixture.evidenceBoundary) {
    const boundary = fixture.evidenceBoundary;
    assert.throws(
      () => engine.calculate({
        ...boundary.engineInput,
        rateEvidenceConfirmed: false
      }),
      (error) => error && error.code === "RATE_EVIDENCE_REQUIRED",
      `${fixture.id} must reject an unproved special treatment`
    );
    const confirmed = engine.calculate(boundary.engineInput);
    assert.strictEqual(
      confirmed.vat ?? confirmed.gst,
      boundary.expectedTax,
      `${fixture.id} confirmed treatment tax`
    );
  }
}

const businessNameFixture = manifest.businessRoutes.find(
  (route) => route.id === "business-name-gen"
);
const businessNameEngine = require(path.join(ROOT, businessNameFixture.engine));
const names = businessNameEngine.generate(businessNameFixture.input);
assert.strictEqual(names.valid, true);
assert.strictEqual(names.version, businessNameFixture.expected.version);
assert.strictEqual(names.suggestions.length, businessNameFixture.expected.count);
assert.strictEqual(names.suggestions[0].name, businessNameFixture.expected.firstName);
assert.strictEqual(names.suggestions[0].score, businessNameFixture.expected.firstScore);
assert.strictEqual(
  businessNameEngine.generate({ ...businessNameFixture.input, keywords: "" }).valid,
  false
);
assert.strictEqual(
  businessNameEngine.generate({ ...businessNameFixture.input, maxLength: 11 }).valid,
  false
);
assert.strictEqual(
  businessNameEngine.generate({ ...businessNameFixture.input, batch: 20 }).valid,
  true
);

const marketFixture = manifest.businessRoutes.find(
  (route) => route.id === "market-stall-profit"
);
const marketEngine = require(path.join(ROOT, marketFixture.engine));
const market = marketEngine.calculate(marketFixture.input);
assert.strictEqual(market.valid, true);
assert.strictEqual(market.version, marketFixture.expected.version);
for (const key of [
  "revenue",
  "soldStockCost",
  "stockLossCost",
  "operatingExpenses",
  "netDailyProfit",
  "breakEvenRevenue"
]) {
  assert.strictEqual(market.outputs[key], marketFixture.expected[key], `market ${key}`);
}
assert.strictEqual(
  market.outputs.monthlyScenario.netProfit,
  marketFixture.expected.monthlyNetProfit
);
assert.strictEqual(
  marketEngine.calculate({ ...marketFixture.input, marketDays: 0 }).valid,
  false
);
assert.strictEqual(
  marketEngine.calculate({
    ...marketFixture.input,
    items: [{ ...marketFixture.input.items[0], unitsLost: -1 }]
  }).valid,
  false
);
assert.strictEqual(
  marketEngine.calculate({
    ...marketFixture.input,
    items: [{ ...marketFixture.input.items[0], unitPrice: 50 }]
  }).outputs.breakEvenRevenue,
  null
);

for (const fixture of manifest.routes.concat(manifest.businessRoutes)) {
  for (const route of [fixture.englishRoute, fixture.swahiliRoute]) {
    assert.ok(routeFile(route), `${fixture.id} physical route missing: ${route}`);
  }

  const englishAlternates = alternateMap(fs.readFileSync(routeFile(fixture.englishRoute), "utf8"));
  assert.ok(englishAlternates.has("sw"), `${fixture.id} hreflang clique lacks sw`);
  assert.strictEqual(
    englishAlternates.get("sw").replace(/\/$/, ""),
    fixture.swahiliRoute.replace(/\/$/, ""),
    `${fixture.id} English page must identify the exact Swahili peer`
  );
  assert.ok(englishAlternates.has("en"), `${fixture.id} hreflang clique lacks en`);
  assert.ok(englishAlternates.has("x-default"), `${fixture.id} hreflang clique lacks x-default`);

  for (const [language, alternateRoute] of englishAlternates) {
    if (language === "x-default") continue;
    const file = routeFile(alternateRoute);
    assert.ok(file, `${fixture.id} missing ${language} peer ${alternateRoute}`);
    const peerAlternates = alternateMap(fs.readFileSync(file, "utf8"));
    for (const [peerLanguage, peerRoute] of englishAlternates) {
      assert.strictEqual(
        (peerAlternates.get(peerLanguage) || "").replace(/\/$/, ""),
        peerRoute.replace(/\/$/, ""),
        `${fixture.id} ${language} peer lacks reciprocal ${peerLanguage}`
      );
    }
  }
}

console.log("Swahili VAT/Business Tax wave 1 exact oracles passed: 16 routes.");
