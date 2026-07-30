const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function loadEngine(file, globalName) {
  const context = {
    console,
    Date,
    Math,
    Number,
    JSON,
    Intl,
    localStorage: { getItem: () => null, setItem: () => {} },
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return context[globalName];
}

const pricing = loadEngine("engines/src/creator-pricing-engine.js", "CreatorPricingEngine");
const money = loadEngine("engines/src/creator-money-engine.js", "CreatorMoneyEngine");

assert(pricing && typeof pricing.calculateRate === "function");
const rate = pricing.calculateRate({
  craft: "design",
  specialty: "Brand Identity",
  country: "SN",
  city: "Dakar",
  experience: "established",
  currency: "XOF"
});
assert.strictEqual(rate.currency, "XOF");
assert(rate.daily.min > 0 && rate.daily.max > rate.daily.min);
assert(rate.hourly.min > 0 && rate.project.max > rate.daily.max);
assert.strictEqual(pricing.getBreakdown("design", rate).length, 5);

assert(money && typeof money.calculatePlan === "function");
const plan = money.calculatePlan({
  currency: "XOF",
  income: 500000,
  expenses: 180000,
  monthlyHours: 120,
  taxRate: 10,
  ownerPayRate: 50,
  reinvestmentRate: 20
});
assert.strictEqual(plan.valid, true);
assert.strictEqual(plan.operatingProfit, 320000);
assert.strictEqual(plan.taxReserve, 32000);
assert.strictEqual(plan.ownerPay, 144000);
assert.strictEqual(plan.reinvestment, 57600);
assert.strictEqual(plan.cashBuffer, 86400);
assert(Math.abs(plan.effectiveHourly - 2666.6666666666665) < 0.001);
assert.strictEqual(money.calculatePlan({
  currency: "XOF",
  income: 100,
  expenses: 10,
  monthlyHours: 10,
  taxRate: 0,
  ownerPayRate: 80,
  reinvestmentRate: 30
}).valid, false);

const files = {
  pricingEn: "tools/creator-pricing/index.html",
  pricingEnApp: "tools/creator-pricing/app.html",
  pricingFr: "fr/tools/tarification-pour-createur/index.html",
  pricingFrApp: "fr/tools/tarification-pour-createur/app.html",
  moneyEn: "tools/creator-money/index.html",
  moneyEnApp: "tools/creator-money/app.html",
  moneyFr: "fr/tools/revenus-du-createur/index.html",
  moneyFrApp: "fr/tools/revenus-du-createur/app.html"
};

for (const [key, rel] of Object.entries(files)) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  assert(!/[�]|Ã.|Â.|â€|ðŸ/.test(html), `${key} contains mojibake`);
  assert(/<link rel="canonical"/.test(html), `${key} lacks canonical`);
  assert(/property="og:image"/.test(html), `${key} lacks OG artwork`);
  assert(/application\/ld\+json/.test(html), `${key} lacks schema`);
  assert(/name="geo.region" content="002"/.test(html), `${key} lacks Africa GEO metadata`);
}

for (const rel of [files.pricingFr, files.pricingFrApp, files.moneyFr, files.moneyFrApp]) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  assert(/<html\b[^>]*\blang="fr"/.test(html), `${rel} is not native French`);
  assert(!/Ouvrir le calculateur complet|Continue in the full calculator|AI-powered|AI POWERED/.test(html), `${rel} retains bridge or unsupported claims`);
}

for (const [enRel, frRel, enBase, frBase] of [
  [files.pricingEn, files.pricingFr, "/tools/creator-pricing/", "/fr/tools/tarification-pour-createur/"],
  [files.moneyEn, files.moneyFr, "/tools/creator-money/", "/fr/tools/revenus-du-createur/"],
]) {
  const enHtml = fs.readFileSync(path.join(root, enRel), "utf8");
  const frHtml = fs.readFileSync(path.join(root, frRel), "utf8");
  for (const html of [enHtml, frHtml]) {
    assert(html.includes(`hreflang="en" href="https://afrotools.com${enBase}"`), `${enRel}/${frRel} lacks English launcher alternate`);
    assert(html.includes(`hreflang="fr" href="https://afrotools.com${frBase}"`), `${enRel}/${frRel} lacks French launcher alternate`);
  }
}

for (const rel of [files.pricingEnApp, files.pricingFrApp, files.moneyEnApp, files.moneyFrApp]) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  assert(/<meta name="robots" content="noindex, follow">/.test(html), `${rel} is not noindex`);
  assert(!/<link rel="alternate" hreflang=/.test(html), `${rel} must not publish hreflang`);
}

const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");
assert(registry.includes('href: "/fr/tools/tarification-pour-createur/"'));
assert(registry.includes('href: "/fr/tools/revenus-du-createur/"'));
const frRouteMap = fs.readFileSync(path.join(root, "assets/js/ai/french-route-map.generated.js"), "utf8");
assert(frRouteMap.includes('"/tools/creator-pricing/":"/fr/tools/tarification-pour-createur/"'));
assert(frRouteMap.includes('"/tools/creator-money/":"/fr/tools/revenus-du-createur/"'));
const aiCatalog = fs.readFileSync(path.join(root, "data/ai/tool-catalog-pack.json"), "utf8");
assert(aiCatalog.includes('"/tools/creator-pricing/"'));
assert(aiCatalog.includes('"/tools/creator-money/"'));
assert(fs.statSync(path.join(root, "assets/img/tools/creator-pricing.webp")).size > 1000);
assert(fs.statSync(path.join(root, "assets/img/tools/creator-money.webp")).size > 1000);

console.log("French creator pricing and money native contracts passed");
