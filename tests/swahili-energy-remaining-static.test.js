"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { SW_ENERGY_REMAINING_APPS, PRESERVED_ACCEPTED } = require("../scripts/lib/sw-energy-remaining-contract");
const { normalizeBuildManagedHtml } = require("../scripts/lib/shared-asset-references");
const routeEntry = require("../assets/js/pages/sw-ai-route-entry");
const routeMap = require("../assets/js/ai/swahili-route-map.generated");
const { assertLifecycle } = require("./support/swahili-acceptance-lifecycle");

const ROOT = path.resolve(__dirname, "..");
const EXPECTED_REMAINING = [
  "electricity-tariff", "solar-roi", "prepaid-meter", "solar-vs-generator", "electricity-bill-verify",
  "water-bill", "gas-lpg-cost", "paygo-solar", "outage-cost", "energy-audit", "appliance-power",
  "diesel-vs-solar-farm", "mini-grid-feasibility", "carbon-footprint-energy", "ev-charging", "biogas-roi", "generator-fuel",
];
const PRESERVED_HASHES = {
  "solar-sizing": "cdb0b6aaebef32de1fca1eadc5d07e04dfbb5815dee284c877806312f7cc780e",
  "battery-sizing": "5876488f1d8a64417845d85afc249c67ac3704a07fe7309fda8c4f139e0fef5b",
  "backup-duration": "5da162c5f60f91cd97c200ba3b38dba70f22d15475dfec1810d6639add8c09ef",
};

function read(relative) { return fs.readFileSync(path.join(ROOT, relative), "utf8"); }
function productSha(relative) {
  return crypto.createHash("sha256")
    .update(normalizeBuildManagedHtml(read(relative)))
    .digest("hex");
}

test("canonical Energy denominator is 19 while the standalone prepaid locale keeps 20 Swahili experiences", () => {
  const inventory = JSON.parse(read("reports/swahili-free-app-parity-inventory.json"));
  const acceptance = JSON.parse(read("data/audits/swahili-free-app-acceptance.json"));
  const energy = inventory.rows.filter((row) => row.categoryKey === "energy");
  assert.equal(energy.length, 19);
  assert.deepEqual(SW_ENERGY_REMAINING_APPS.map((row) => row.id), EXPECTED_REMAINING);
  assert.equal(new Set(SW_ENERGY_REMAINING_APPS.map((row) => row.swRoute)).size, 17);
  assertLifecycle({
    inventory,
    acceptance,
    routeEntry,
    routeMap,
    apps: [
      ...PRESERVED_ACCEPTED.map((app) => ({ id: app.id, swahiliRoute: app.route })),
      ...SW_ENERGY_REMAINING_APPS.filter((app) => app.id !== "prepaid-meter").map((app) => ({ id: app.id, swahiliRoute: app.swRoute })),
    ],
  });
});

test("three previously accepted pages preserve product content across release cache hashes", () => {
  for (const app of PRESERVED_ACCEPTED) assert.equal(productSha(app.file), PRESERVED_HASHES[app.id], app.id);
});

test("source-owned hub links exactly 17 promoted apps plus 3 preserved apps", () => {
  const hub = read("sw/nishati-na-huduma/index.html");
  for (const app of [...PRESERVED_ACCEPTED, ...SW_ENERGY_REMAINING_APPS]) assert.ok(hub.includes(app.route || app.swRoute), app.id);
  assert.equal((hub.match(/class="sw-energy-hub-card"/g) || []).length, 20);
});

test("all 17 pages are native, source-bound, private and export-capable", () => {
  const registry = read("assets/js/components/tool-registry.js");
  const fallbacks = read("data/localization/explicit-language-fallbacks.json");
  for (const app of SW_ENERGY_REMAINING_APPS) {
    const html = read(app.file);
    assert.match(html, /<html\b[^>]*\blang="sw"/i, `${app.id}: native Swahili document`);
    const localeTokens = app.id === "prepaid-meter" ? [] : [
      `hreflang="en" href="https://afrotools.com${app.enRoute}"`,
      `hreflang="fr" href="https://afrotools.com${app.frRoute}"`,
      `hreflang="sw" href="https://afrotools.com${app.swRoute}"`,
    ];
    const sharedTokens = [
      `data-sw-energy-app="${app.id}"`, `https://afrotools.com${app.swRoute}`,
      ...localeTokens, app.image, `/engines/${app.engine}.js`,
    ];
    const productTokens = app.exactTariff ? [
      "/assets/js/pages/electricity-cost-prepaid-units.js", "/assets/js/pages/swahili-electricity-parity.js",
      "Gharama ya Umeme na Unit za Kulipia Kabla", 'id="electricityCustomCurrency"', 'id="electricityCustomTax"',
    ] : [
      "/data/energy/sw-energy-planning-snapshot.js", "/assets/js/pages/sw-energy-remaining-parity.js",
      "Machi 2026", "Uhakika", "si data ya sasa wala bei hai", 'data-export="json"', 'data-export="csv"',
      'data-export="txt"', 'data-export="pdf"', 'id="importJson"', "Hakuna taarifa inayotumwa kwa seva au AI",
      'data-theme-toggle', 'type="reset"',
    ];
    for (const token of [...sharedTokens, ...productTokens]) assert.ok(html.includes(token), `${app.id}: ${token}`);
    if (app.exactTariff) {
      assert.ok(!html.includes("/data/energy/sw-energy-planning-snapshot.js"), `${app.id}: stale snapshot removed`);
      assert.ok(!html.includes("country-energy-index.js"), `${app.id}: no independent tariff dataset`);
    }
    if (app.id === "prepaid-meter") {
      assert.ok(!/hreflang=["'](?:en|fr)["']/i.test(html), `${app.id}: no false equivalence to moved English/French routes`);
      assert.ok(html.includes(`hreflang="sw" href="https://afrotools.com${app.swRoute}"`), `${app.id}: self locale alternate`);
      assert.ok(html.includes(`hreflang="x-default" href="https://afrotools.com${app.swRoute}"`), `${app.id}: self x-default alternate`);
    }
    assert.match(html, /<html\b[^>]*\blang=["']sw["'][^>]*>/i, `${app.id}: native locale`);
    for (const forbidden of ["<iframe", "afrotools-language-fallback", "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage"]) {
      assert.ok(!html.includes(forbidden), `${app.id}: ${forbidden}`);
    }
    assert.ok(fs.existsSync(path.join(ROOT, app.image.slice(1))), `${app.id}: artwork`);
    assert.ok(registry.includes(app.swRoute), `${app.id}: registry`);
    assert.ok(!fallbacks.includes(app.file), `${app.id}: fallback removed`);
  }
});

function loadRuntime(app) {
  const context = { console, setTimeout, clearTimeout };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  if (!app.exactTariff) vm.runInContext(read("data/energy/sw-energy-planning-snapshot.js"), context, { filename: "sw-energy-planning-snapshot.js" });
  vm.runInContext(read(`engines/src/${app.engine}.js`), context, { filename: `${app.engine}.js` });
  return context;
}

const CASES = {
  "electricity-tariff": [{ units: 250, customerType: "residential" }, { units: 0, customerType: "residential" }],
  "solar-roi": [{ systemKW: 3, currentMonthlyBill: 100000 }, { systemKW: 0, currentMonthlyBill: 100000 }],
  "prepaid-meter": [{ tokenAmount: 5000, customerType: "residential" }, { tokenAmount: 0, customerType: "residential" }],
  "solar-vs-generator": [{ dailyHours: 6, genKVA: 5, dailyKWh: 20 }, { dailyHours: 0, genKVA: 5 }],
  "electricity-bill-verify": [{ prevReading: 1200, currReading: 1450, billedAmount: 0, customerType: "residential" }, { prevReading: 1450, currReading: 1200 }],
  "water-bill": [{ monthlyUsage: 15, householdSize: 4, customerType: "residential" }, { monthlyUsage: 0 }],
  "gas-lpg-cost": [{ cylinderSize: 12.5, monthlyRefills: 1, householdSize: 4 }, { monthlyRefills: 0, _country: "XX" }],
  "paygo-solar": [{ dailyWh: 200, currentMonthlySpend: 5000 }, { dailyWh: 0, currentMonthlySpend: 0 }],
  "outage-cost": [{ dailyRevenue: 100000, outageHrsPerDay: 4, businessType: "retail" }, { dailyRevenue: 0, outageHrsPerDay: 4 }],
  "energy-audit": [{ homeSizeSqm: 100, occupants: 4, monthlyBill: 30000, acUnits: 1, lightingType: "mix", waterHeater: "electric", country: "TZ" }, { monthlyBill: 0, country: "TZ" }],
  "appliance-power": [{ country: "TZ", appliances: [{ name: "Kifaa", watts: 100, hoursPerDay: 6, qty: 1, standbyWatts: 0 }] }, { country: "TZ", appliances: [] }],
  "diesel-vs-solar-farm": [{ farmHa: 4, pumpKW: 2, dailyPumpHrs: 5, country: "TZ" }, { farmHa: 0, pumpKW: 0, dailyPumpHrs: 5, country: "TZ" }],
  "mini-grid-feasibility": [{ households: 100, businesses: 10, avgKWhHousehold: 30, avgKWhBusiness: 100, country: "TZ" }, { households: 0, country: "TZ" }],
  "carbon-footprint-energy": [{ gridKWh: 200, genLitres: 0, lpgKg: 0, woodKg: 0, country: "TZ" }, { gridKWh: 0, genLitres: 0, lpgKg: 0, woodKg: 0, country: "TZ" }],
  "ev-charging": [{ batteryKWh: 50, dailyKm: 50, chargingLevel: "home", country: "TZ" }, { batteryKWh: 0, country: "TZ" }],
  "biogas-roi": [{ livestockCount: 10, livestockType: "cattle", cookingHours: 3, country: "TZ" }, { livestockCount: 0, country: "TZ" }],
  "generator-fuel": [{ genKVA: 5, dailyHours: 6, fuelType: "diesel" }, { genKVA: 0, dailyHours: 6 }],
};

test("all 17 shared engines pass a valid oracle and reject an invalid oracle", () => {
  for (const app of SW_ENERGY_REMAINING_APPS) {
    const context = loadRuntime(app);
    if (app.exactTariff) {
      const engine = context.AfroTools.engines.electricityCost;
      const data = JSON.parse(read("data/energy/electricity-tariffs.json"));
      const record = data.records.find((row) => row.tariff_id === "ug-uedcl-domestic-standard-q3-2026");
      assert.equal(engine.calculateBill(record, 10).total, 7794);
      assert.equal(engine.calculateUnits(record, 10000).units, 12.8304);
      assert.equal(engine.calculateBill(record, 0).ok, false);
      continue;
    }
    const engine = context.AfroTools[app.global];
    const [valid, invalid] = CASES[app.id];
    let validResult;
    let invalidResult;
    if (app.mode === "solarQuick") {
      validResult = engine.calculate(valid, "TZ");
      invalidResult = engine.calculate(invalid, invalid._country || "TZ");
    } else if (app.countryInInput) {
      validResult = engine.calculate(valid);
      invalidResult = engine.calculate(invalid);
    } else {
      validResult = engine.calculate(valid, "TZ");
      invalidResult = engine.calculate(invalid, invalid._country || "TZ");
    }
    assert.ok(validResult && !validResult.error, `${app.id}: valid oracle`);
    assert.notEqual(validResult[app.metrics[0][0]], undefined, `${app.id}: primary metric`);
    assert.ok(invalidResult && invalidResult.error, `${app.id}: invalid oracle`);
  }
});

test("shared controller contains local-only export/reopen and stale-result clearing", () => {
  const js = read("assets/js/pages/sw-energy-remaining-parity.js");
  for (const token of ["root.AfroLocalOnly = true", "URL.createObjectURL", "FileReader", "readAsText", "form.checkValidity()", "clearResult()", "application/json", "text/csv", "simplePdfBlob", "%PDF-1.4", 'form.addEventListener("reset"', "dataset.theme"]) assert.ok(js.includes(token), token);
  for (const forbidden of ["fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage"]) assert.ok(!js.includes(forbidden), forbidden);
});
