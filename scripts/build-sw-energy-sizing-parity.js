#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const DATA_SOURCE = path.join(ROOT, "data", "energy", "country-energy-index.js");
const SNAPSHOT = path.join(ROOT, "data", "energy", "sw-energy-sizing-snapshot.js");
const RECEIPT = path.join(ROOT, "reports", "sw-energy-sizing-parity-receipt.json");
const INVENTORY = path.join(ROOT, "reports", "swahili-free-app-parity-inventory.json");
const REGISTRY = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const HUB = path.join(ROOT, "sw", "nishati-na-huduma", "index.html");

const COUNTRY_NAMES_SW = {
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "Afrika Kusini",
  GH: "Ghana",
  EG: "Misri",
  ET: "Ethiopia",
  TZ: "Tanzania",
  UG: "Uganda",
  RW: "Rwanda",
  CI: "Côte d’Ivoire",
  CM: "Kamerun",
  SN: "Senegal",
  MA: "Moroko",
  TN: "Tunisia",
  AO: "Angola",
  ZM: "Zambia",
  ZW: "Zimbabwe",
  MZ: "Msumbiji",
  MW: "Malawi",
  MG: "Madagaska",
  BW: "Botswana",
  NA: "Namibia",
  LS: "Lesotho",
  SZ: "Eswatini",
  MU: "Mauritius",
  SC: "Shelisheli",
  DJ: "Jibuti",
  ER: "Eritrea",
  SO: "Somalia",
  SS: "Sudan Kusini",
  SD: "Sudan",
  LY: "Libya",
  DZ: "Algeria",
  CD: "Jamhuri ya Kidemokrasia ya Kongo",
  CG: "Jamhuri ya Kongo",
  TD: "Chad",
  CF: "Jamhuri ya Afrika ya Kati",
  GA: "Gabon",
  GQ: "Guinea ya Ikweta",
  ST: "São Tomé na Príncipe",
  KM: "Komoro",
  BI: "Burundi",
  BJ: "Benin",
  BF: "Burkina Faso",
  CV: "Cabo Verde",
  GM: "Gambia",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  LR: "Liberia",
  ML: "Mali",
  NE: "Niger",
  SL: "Sierra Leone",
  TG: "Togo",
  MR: "Mauritania"
};

const SNAPSHOT_SOURCES = [
  {
    id: "global-solar-atlas",
    labelSw: "Global Solar Atlas — ramani ya rasilimali ya jua",
    url: "https://globalsolaratlas.info/map",
    verifies: ["peak_sun_hours"]
  },
  {
    id: "world-bank-official-exchange-rate",
    labelSw: "World Bank — Official exchange rate (PA.NUS.FCRF)",
    url: "https://data.worldbank.org/indicator/PA.NUS.FCRF",
    verifies: ["exchange_rate_reference"]
  }
];

const APPS = [
  {
    id: "solar-sizing",
    englishRegistryId: "solar-sizing",
    swahiliRegistryId: "zana-ukubwa-wa-mfumo-wa-solar-sw",
    swahiliRegistrySourceId: null,
    englishRoute: "/tools/solar-sizing/",
    swahiliRoute: "/sw/zana/ukubwa-wa-mfumo-wa-solar/",
    file: "sw/zana/ukubwa-wa-mfumo-wa-solar/index.html",
    engine: "engines/solar-sizing-engine.js",
    artwork: "assets/img/tools/solar-sizing.webp",
    artworkWidth: 800,
    artworkHeight: 450
  },
  {
    id: "battery-sizing",
    englishRegistryId: "battery-sizing",
    swahiliRegistryId: "zana-ukubwa-wa-betri-na-inverter-sw-wave8",
    swahiliRegistrySourceId: "battery-inverter-size",
    englishRoute: "/tools/battery-sizing/",
    swahiliRoute: "/sw/zana/ukubwa-wa-betri-na-inverter/",
    file: "sw/zana/ukubwa-wa-betri-na-inverter/index.html",
    engine: "engines/battery-sizing-engine.js",
    artwork: "assets/img/tools/battery-sizing.webp",
    artworkWidth: 800,
    artworkHeight: 450
  },
  {
    id: "backup-duration",
    englishRegistryId: "backup-duration",
    swahiliRegistryId: "zana-muda-wa-backup-ya-betri-sw",
    swahiliRegistrySourceId: null,
    englishRoute: "/tools/backup-duration/",
    swahiliRoute: "/sw/zana/muda-wa-backup-ya-betri/",
    file: "sw/zana/muda-wa-backup-ya-betri/index.html",
    engine: "engines/backup-duration-engine.js",
    artwork: "assets/img/tools/backup-duration.webp",
    artworkWidth: 800,
    artworkHeight: 450
  }
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function loadEnergyData() {
  const context = {
    fetch() {
      return Promise.reject(new Error("network disabled during snapshot build"));
    },
    console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(DATA_SOURCE, "utf8"), context, { filename: DATA_SOURCE });
  if (!context.ENERGY_DATA || !context.ENERGY_DATA.countries) {
    throw new Error("Unable to read ENERGY_DATA from country-energy-index.js");
  }
  return context.ENERGY_DATA;
}

function buildSnapshot() {
  const source = loadEnergyData();
  const countries = {};
  for (const [code, country] of Object.entries(source.countries)) {
    if (!COUNTRY_NAMES_SW[code]) throw new Error(`Missing Swahili country name for ${code}`);
    countries[code] = {
      name: country.name,
      nameSw: COUNTRY_NAMES_SW[code],
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      usdRate: country.usdRate,
      solar: country.solar ? { avgSunHours: country.solar.avgSunHours } : null
    };
  }
  const payload = {
    schemaVersion: 1,
    locale: "sw",
    lastUpdated: source.lastUpdated,
    sourceFile: "data/energy/country-energy-index.js",
    status: "planning_snapshot",
    confidence: "low_when_stale",
    network: "none",
    sourceUrls: SNAPSHOT_SOURCES,
    countries
  };
  return `(function loadSwEnergySizingSnapshot(root) {
  "use strict";
  root.ENERGY_DATA = ${JSON.stringify(payload)};
})(typeof globalThis !== "undefined" ? globalThis : this);
`;
}

function assertPage(app) {
  const file = path.join(ROOT, app.file);
  const html = fs.readFileSync(file, "utf8");
  const required = [
    'lang="sw"',
    `data-sw-energy-sizing-app=`,
    `https://afrotools.com${app.swahiliRoute}`,
    `hreflang="en" href="https://afrotools.com${app.englishRoute}"`,
    `hreflang="sw" href="https://afrotools.com${app.swahiliRoute}"`,
    `https://afrotools.com/${app.artwork}`,
    `<meta property="og:image:width" content="${app.artworkWidth}">`,
    `<meta property="og:image:height" content="${app.artworkHeight}">`,
    "/data/energy/sw-energy-sizing-snapshot.js",
    `/${app.engine}`,
    "/assets/js/pages/sw-energy-sizing-parity.js",
    'id="formStatus"',
    'role="alert"',
    'id="copyResult"',
    'id="briefOutput"',
    'class="sw-source-links"',
    'href="https://'
  ];
  for (const token of required) {
    if (!html.includes(token)) throw new Error(`${app.file} missing ${token}`);
  }
  if (app.id === "battery-sizing") {
    const batteryDisclosureTokens = [
      'href="/tools/battery-sizing/"',
      "USD 300 kwa kila betri ya mfano ya LiFePO4 ya 12 V/200 Ah",
      "USD 100 kwa kila betri ya mfano ya lead-acid ya 12 V/200 Ah",
      "USD 180 kwa kila kVA",
      "nakala ya Machi 2026",
      "makadirio ya kupanga pekee"
    ];
    for (const token of batteryDisclosureTokens) {
      if (!html.includes(token)) throw new Error(`${app.file} missing battery cost disclosure ${token}`);
    }
  }
  const forbidden = [
    "country-energy-index.js",
    "sw-energy-runtime-localizer",
    "lazy-analytics.js",
    "energy-tool-assistant.js",
    "localStorage",
    "sessionStorage",
    "fetch(",
    "XMLHttpRequest",
    "sendBeacon",
    'alert(',
    'afrotools-language-fallback'
  ];
  for (const token of forbidden) {
    if (html.includes(token)) throw new Error(`${app.file} contains forbidden runtime token ${token}`);
  }
  if (!fs.existsSync(path.join(ROOT, app.artwork))) throw new Error(`Missing artwork: ${app.artwork}`);
}

function assertOwnership(app) {
  const registry = fs.readFileSync(REGISTRY, "utf8");
  const hub = fs.readFileSync(HUB, "utf8");
  const requiredRegistryTokens = [
    `id: '${app.englishRegistryId}'`,
    `href: '${app.englishRoute}'`,
    `id: "${app.swahiliRegistryId}"`,
    `href: "${app.swahiliRoute}"`
  ];
  if (app.swahiliRegistryId.endsWith("-wave8")) {
    requiredRegistryTokens[2] = `id: '${app.swahiliRegistryId}'`;
    requiredRegistryTokens[3] = `href: '${app.swahiliRoute}'`;
  }
  for (const token of requiredRegistryTokens) {
    if (!registry.includes(token)) throw new Error(`Registry ownership missing ${token}`);
  }
  if (!hub.includes(`href="${app.swahiliRoute}"`)) {
    throw new Error(`Swahili Energy hub missing ${app.swahiliRoute}`);
  }
}

function buildReceipt() {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
  const categories = [
    "Engineering & Construction",
    "Energy & Utilities",
    "Climate & Environment",
    "Mining & Extractives"
  ].map((name) => {
    const row = inventory.categories.find((entry) => entry.category === name);
    if (!row) throw new Error(`Missing inventory category: ${name}`);
    return row;
  });
  const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "audits", "swahili-free-app-acceptance.json"), "utf8"));
  const acceptedIds = new Set(acceptance.entries.filter((entry) => entry.status === "accepted").map((entry) => entry.englishId));
  const routeMap = fs.readFileSync(path.join(ROOT, "assets", "js", "ai", "swahili-route-map.generated.js"), "utf8");
  return {
    schemaVersion: 1,
    lane: "Swahili Engineering, Energy, Climate, and Mining parity",
    selectedFamily: "Energy sizing trio",
    sourceOfTruth: {
      pages: "hand-authored Swahili owners",
      formulas: APPS.map((app) => app.engine),
      data: "generated static Swahili snapshot from data/energy/country-energy-index.js",
      controller: "assets/js/pages/sw-energy-sizing-parity.js"
    },
    reconciliation: categories,
    adversarialRepair: {
      coordinatorParent: "8354e321ff34caf60a33a3393cd0dcddfb00c023",
      verifierRepairParent: "65698f498915406178714d0b182f5a1c028e6598",
      repairedRouteCount: APPS.length,
      localizedSnapshotCountryCount: Object.keys(COUNTRY_NAMES_SW).length,
      validation: {
        nativeCheckValidityAndReportValidity: true,
        solarHoursPerDay: { min: 0.5, max: 24, step: 0.5 },
        solarQuantity: { min: 1, max: 1000, step: 1, integerOnly: true },
        correctedErrorClearing: APPS.map((app) => app.id),
        staleResultAndCopyClearing: APPS.map((app) => app.id)
      },
      sourceUrls: SNAPSHOT_SOURCES,
      solarCostAssumptions: {
        panelsUsdPerKw: 300,
        batteriesUsdPerKwh: 200,
        inverterUsdPerKva: 150,
        installationShareOfEquipment: 0.2,
        localCurrencyMethod: "modeled USD total multiplied by the March 2026 snapshot USD rate",
        claimBoundary: "planning estimate; not live pricing or a supplier quote"
      },
      batteryCostAssumptions: {
        modelBattery: "12V 200Ah",
        lithiumUsdPerBattery: 300,
        leadAcidUsdPerBattery: 100,
        inverterUsdPerKva: 180,
        batteryCountMethod: "whole batteries derived from series and parallel configuration for system voltage and required Ah",
        systemCostMethod: "modeled battery cost plus modeled inverter cost",
        localCurrencyMethod: "modeled USD total multiplied by the March 2026 snapshot USD rate",
        provenance: "implicit constants in the shared English battery-sizing engine",
        freshness: "hardware constants are embedded, non-live assumptions; exchange rate is a low-confidence March 2026 snapshot when stale",
        claimBoundary: "planning estimate; not market data, a design, professional advice, live pricing, or a supplier quote"
      },
      focusContrast: {
        minimumRequired: 3,
        lightRing: "#9a3412",
        lightAdjacentColor: "#ffffff",
        lightComputedRatio: 7.31,
        darkRing: "#b45309",
        darkAdjacentColor: "#172033",
        darkComputedRatio: 3.24,
        browserMethod: "sequential Tab focus plus computed outline and adjacent background colors",
        visibleTextMethod: "computed foreground and effective background for every visible direct-text node in source, assumption, error, result, and export regions",
        sourceText: {
          lightForeground: "#334155",
          lightBackground: "#fff7ed",
          lightComputedRatio: 9.75,
          darkForeground: "#cbd5e1",
          darkBackground: "#172033",
          darkComputedRatio: 10.96,
          minimumRequired: "strictly greater than 4.5"
        }
      },
      browserProof: {
        tests: 6,
        viewportWidthsPx: [320, 375],
        textReflowPercent: 200,
        exportReopenAndParse: "clipboard text read again after page reload",
        themes: ["light", "dark"],
        consoleAndResourceErrors: "zero expected",
        calculationAndCopyNetwork: "zero fetch, XHR, API, or external analytics transmissions expected"
      }
    },
    implementedRoutes: APPS.map((app) => ({
      ...app,
      hubRoute: "/sw/nishati-na-huduma/",
      hubLinkStatus: "linked",
      registryOwnershipStatus: "english_and_swahili_rows_present",
      registrySourceIdNote: app.swahiliRegistrySourceId
        ? "legacy Swahili registry sourceId retained; canonical English pairing is reconciled by route inventory and reciprocal hreflang"
        : "Swahili registry row has no sourceId; canonical English pairing is reconciled by route inventory and reciprocal hreflang",
      acceptanceLedgerStatus: acceptedIds.has(app.id) ? "accepted" : "blocked_pending_coordinator",
      aiRouteStatus: routeMap.includes(`"${app.id}":`) ? "mapped" : "blocked_fail_closed",
      engineSha256: sha256(path.join(ROOT, app.engine)),
      artworkSha256: sha256(path.join(ROOT, app.artwork))
    })),
    boundaries: {
      sharedEngineChanged: false,
      crossLocaleRuntimeChanged: false,
      acceptanceLedgerChanged: false,
      generatedAiRouteMapChanged: false,
      masterLedgerChanged: false,
      sitemapChanged: false,
      deployPerformed: false,
      networkDuringCalculationOrCopy: false
    }
  };
}

function checkOrWrite(file, content) {
  if (WRITE) {
    fs.writeFileSync(file, content, "utf8");
    return;
  }
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content) {
    throw new Error(`${path.relative(ROOT, file)} is stale; run node scripts/build-sw-energy-sizing-parity.js --write`);
  }
}

function main() {
  const snapshot = buildSnapshot();
  checkOrWrite(SNAPSHOT, snapshot);
  APPS.forEach(assertPage);
  APPS.forEach(assertOwnership);
  const receipt = `${JSON.stringify(buildReceipt(), null, 2)}\n`;
  checkOrWrite(RECEIPT, receipt);
  console.log(`Swahili energy sizing parity ${WRITE ? "built" : "verified"}: ${APPS.length}/3 routes.`);
}

if (require.main === module) main();

module.exports = {
  APPS,
  COUNTRY_NAMES_SW,
  SNAPSHOT_SOURCES,
  buildSnapshot,
  buildReceipt,
  loadEnergyData
};
