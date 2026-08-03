"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const { PAGES, ROUTES, REGISTRY_IDS, render } = require("../scripts/lib/french-security-page.js");
const { normalizeLocalizedGeneratorHtml } = require("../scripts/lib/localized-generator-equivalence");
const { FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL } = require("../scripts/lib/french-tool-route-map.js");

const IDS = Object.keys(PAGES);
const EXTRA_ALTERNATES = {
  "cctv-cost": ["sw", "https://afrotools.com/sw/zana/gharama-za-cctv/"],
  "cybersecurity-assessment": ["sw", "https://afrotools.com/sw/zana/tathmini-ya-usalama-wa-kidijitali/"],
  "data-breach-cost": ["sw", "https://afrotools.com/sw/zana/gharama-ya-uvujaji-wa-data/"],
};
const REQUIRED_SOURCES = {
  "data-breach-cost": ["https://www.ndpc.gov.ng/resources/", "https://www.odpc.go.ke/report-a-data-breach/", "https://inforegulator.org.za/popia/"],
  "cybersecurity-assessment": ["https://www.nist.gov/cyberframework", "https://www.ndpc.gov.ng/", "https://www.odpc.go.ke/"],
  "fire-safety-checklist": ["https://fedfire.gov.ng/about-us/", "https://www.mint.gov.gh/agencies/ghana-national-fire-service/", "https://www.gov.za/documents/occupational-health-and-safety-act"],
  "password-strength": ["https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver"],
  "phishing-quiz": ["https://www.cyber.gov.au/threats/types-threats/phishing", "https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams"],
};

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function loadRuntime() {
  const source = read("assets/js/pages/french-security-tools.js");
  const homeEngineSource = read("assets/js/engines/home-security-cost.js");
  const wordlistSource = read("assets/js/data/french-passphrase-words.js");
  const fireEngine = require("../assets/js/engines/security-fire-safety.js");
  let randomValue = 0;
  const context = {
    window: {
      AfroToolsSecurityFire: fireEngine,
      crypto: {
        getRandomValues(values) {
          values[0] = randomValue;
          randomValue = (randomValue + 104729) >>> 0;
          return values;
        },
      },
    },
    document: null,
    Set,
    RangeError,
    Number,
    Math,
    Uint32Array,
  };
  vm.runInNewContext(homeEngineSource, context, { filename: "home-security-cost.js" });
  vm.runInNewContext(wordlistSource, context, { filename: "french-passphrase-words.js" });
  vm.runInNewContext(source, context, { filename: "french-security-tools.js" });
  return context.window.AfroToolsFrenchSecurity;
}

function loadRegistry() {
  const source = read("assets/js/components/tool-registry.js");
  return new Function(`${source}; return AFRO_TOOLS;`)();
}

function assertNoSensitiveTransport(source, label) {
  [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bsendBeacon\b/,
    /\bWebSocket\b/,
    /\blocalStorage\s*\./,
    /\bsessionStorage\s*\./,
    /\bconsole\.(?:log|info|warn|error)\b/,
  ].forEach((pattern) => assert.ok(!pattern.test(source), `${label} must not use ${pattern}`));
}

const runtimeSource = read("assets/js/pages/french-security-tools.js");
const sharedFire = require("../assets/js/engines/security-fire-safety.js");
const sharedHomeSecurity = require("../assets/js/engines/home-security-cost.js");
const sharedHomeSecuritySource = read("assets/js/engines/home-security-cost.js");
assertNoSensitiveTransport(runtimeSource, "French Security runtime");
assertNoSensitiveTransport(sharedHomeSecuritySource, "shared Home Security engine");
assert.ok(!/\b(?:window|document)\.(?:querySelector|getElementById|addEventListener)\b/.test(sharedHomeSecuritySource), "shared Home Security engine is DOM-free");
assert.ok(runtimeSource.includes("selected.size>1048576"), "local JSON reopen enforces a 1 MB limit");
assert.ok(runtimeSource.includes('parsed.locale!=="fr"'), "local JSON reopen validates the French schema locale");
assert.ok(runtimeSource.includes("Le fichier contient une option inconnue."), "local JSON reopen rejects unknown options");
assert.ok(!runtimeSource.includes("CCTV_PRICES"), "CCTV has no hidden market-price table");
assert.ok(!runtimeSource.includes("HOME_COSTS"), "Home Security has no hidden market-price table");
assert.ok(!runtimeSource.includes("BREACH_FX"), "Data Breach has no hidden exchange-rate table");
assert.ok(!runtimeSource.includes("ITEM_COSTS"), "French Fire runtime does not consume hidden remediation-cost constants");
const homeRendererSource = runtimeSource.slice(runtimeSource.indexOf("function renderHome"), runtimeSource.indexOf("function renderBreach"));
for (const legacyField of ["currencyLabel", "cctvSetup", "alarmSetup", "guardMonthly", "monitoringMonthly", "maintenanceMonthly"]) {
  assert.ok(!homeRendererSource.includes(`"${legacyField}"`), `French Home Security cannot replace the canonical controls with ${legacyField}`);
}
for (const canonicalControl of ["country", "homeType", "riskLevel", "securityLevel"]) {
  assert.ok(homeRendererSource.includes(`"${canonicalControl}"`), `French Home Security renders canonical control ${canonicalControl}`);
}

const registry = loadRegistry();
const frenchSecurityRows = registry.filter((row) => row.lang === "fr" && row.category === "security" && IDS.includes(row.sourceId));
assert.strictEqual(frenchSecurityRows.length, 7, "exactly seven French Security registry rows");
assert.strictEqual(new Set(frenchSecurityRows.map((row) => row.sourceId)).size, 7, "one French row per English source");

for (const id of IDS) {
  const slug = ROUTES[id];
  const route = `/fr/tools/${slug}/`;
  const html = read(`fr/tools/${slug}/index.html`);
  assert.strictEqual(
    normalizeLocalizedGeneratorHtml(html),
    normalizeLocalizedGeneratorHtml(render({ enSlug: id, frSlug: slug })),
    `${slug} exactly matches its dedicated generator owner`
  );
  const row = frenchSecurityRows.find((item) => item.sourceId === id);

  assert.ok(row, `registry row for ${id}`);
  assert.strictEqual(row.id, REGISTRY_IDS[id], `registry id for ${id}`);
  assert.strictEqual(row.href, route, `registry route for ${id}`);
  assert.strictEqual(row.imageId, id, `artwork owner for ${id}`);
  assert.strictEqual(FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL[slug], id, `French route map for ${id}`);

  assert.ok(/<html\b[^>]*\blang="fr"/.test(html), `${slug} declares French`);
  assert.ok(html.includes(`rel="canonical" href="https://afrotools.com${route}"`), `${slug} self-canonical`);
  assert.ok(html.includes(`hreflang="en" href="https://afrotools.com/tools/${id}/"`), `${slug} English alternate`);
  assert.ok(html.includes(`hreflang="fr" href="https://afrotools.com${route}"`), `${slug} French alternate`);
  if (EXTRA_ALTERNATES[id]) {
    const [lang, href] = EXTRA_ALTERNATES[id];
    assert.ok(html.includes(`hreflang="${lang}" href="${href}"`), `${slug} ${lang} alternate`);
  }
  assert.ok(html.includes(`property="og:url" content="https://afrotools.com${route}"`), `${slug} OG URL`);
  assert.ok(html.includes(`property="og:image" content="https://afrotools.com/assets/img/tools/${id}.webp"`), `${slug} canonical artwork`);
  assert.ok(html.includes('"@type":"SoftwareApplication"'), `${slug} application schema`);
  assert.ok(html.includes('"@type":"BreadcrumbList"'), `${slug} breadcrumb schema`);
  assert.ok(html.includes('"@type":"FAQPage"'), `${slug} FAQ schema`);
  assert.ok(html.includes('"areaServed":{"@type":"Place","name":"Afrique"}'), `${slug} African GEO schema`);
  assert.ok(html.includes(`data-fr-security-app="${id}"`), `${slug} native app mount`);
  assert.ok(html.includes("data-authoritative-sources"), `${slug} source-confidence panel`);
  if (["cctv-cost", "home-security-cost", "data-breach-cost", "fire-safety-checklist"].includes(id)) {
    assert.ok(html.includes("saisi"), `${slug} discloses user-entered numerical assumptions`);
  }
  if (id === "home-security-cost") {
    assert.ok(html.includes('/assets/js/engines/home-security-cost.js'), `${slug} loads the shared canonical engine`);
    assert.ok(html.includes("Confiance élevée pour la reproductibilité de la formule"), `${slug} states formula confidence`);
    assert.ok(html.includes("faible pour un prix local actuel"), `${slug} states current-price confidence limit`);
  }
  for (const source of REQUIRED_SOURCES[id] || []) {
    assert.ok(html.includes(source), `${slug} includes authoritative source ${source}`);
  }
  assert.ok(html.includes('/fr/all-tools/?category=security'), `${slug} French Security hub link`);
  assert.ok(html.includes("window.AfroDisableAssistant=true"), `${slug} explicitly disables assistant loading`);
  assert.ok(!html.includes("/assets/js/pages/english-df-app-upgrades.js"), `${slug} has no English upgrade runtime`);
  assert.ok(!html.includes("/assets/js/pages/security-focus.js"), `${slug} has no English injected copy`);
  assertNoSensitiveTransport(html, slug);
  assert.ok(fs.existsSync(path.join(ROOT, "assets", "img", "tools", `${id}.webp`)), `${id} artwork exists`);

  const english = read(`tools/${id}/index.html`);
  assert.ok(english.includes(`https://afrotools.com${route}`), `${id} reciprocates French hreflang`);
}

const api = loadRuntime();
assert.ok(api && api.engines, "runtime exposes pure engines for deterministic tests");
const wordlistSource = read("assets/js/data/french-passphrase-words.js");
assert.ok(wordlistSource.includes("9783d61f1b9c81231581fee026c8e8cb9499d265"), "passphrase vocabulary has a pinned reviewed source");
const wordlistContext = { window: {}, Set, Object, Error };
vm.runInNewContext(wordlistSource, wordlistContext, { filename: "french-passphrase-words.js" });
assert.strictEqual(wordlistContext.window.AfroToolsFrenchPassphraseWords.length, 2048, "passphrase vocabulary has 2,048 entries");
assert.strictEqual(new Set(wordlistContext.window.AfroToolsFrenchPassphraseWords).size, 2048, "passphrase vocabulary entries are unique");

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(api.engines.cctv({
    country: "NG",
    cameras: 4,
    cameraType: "ip",
    recorder: "nvr",
    storage: 2,
    installation: "professional",
    monitoring: "yes",
    currencyLabel: "NGN",
    cameraUnitCost: 40000,
    recorderUnits: 1,
    recorderUnitCost: 60000,
    storageUnits: 2,
    storageUnitCost: 20000,
    installationTotal: 32000,
    monitoringMonthly: 15000,
    cloudMonthly: 0,
  }))),
  {
    setupTotal: 292000,
    monthlyTotal: 15000,
    fiveYear: 1192000,
    totalCameras: 160000,
    recorderCost: 60000,
    hddCost: 40000,
    hddCount: 2,
    installCost: 32000,
    recorderUnits: 1,
    recorderUnitCost: 60000,
    cameraCost: 40000,
    cameras: 4,
    storage: 2,
    currency: "NGN ",
  },
  "CCTV reference scenario preserves English constants and formula"
);
assert.throws(
  () => api.engines.cctv({ country: "NG", cameras: 4, cameraType: "analog", recorder: "nvr", storage: 2, installation: "diy", monitoring: "no" }),
  /DVR/,
  "CCTV rejects incompatible recorder"
);

function selectContract(html, id) {
  const match = html.match(new RegExp(`<select\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/select>`));
  assert.ok(match, `English Home Security owner has select #${id}`);
  const options = Array.from(match[1].matchAll(/<option\b([^>]*)\bvalue="([^"]+)"([^>]*)>/g), (option) => ({
    value: option[2],
    selected: /\bselected\b/.test(`${option[1]} ${option[3]}`),
  }));
  assert.ok(options.length, `English Home Security select #${id} has options`);
  return {
    id,
    defaultValue: (options.find((option) => option.selected) || options[0]).value,
    values: options.map((option) => option.value),
  };
}

const expectedHomeContract = [
  { id: "country", defaultValue: "NG", values: ["NG", "KE", "ZA", "GH", "EG", "TZ"] },
  { id: "homeType", defaultValue: "bungalow", values: ["flat", "bungalow", "duplex", "mansion"] },
  { id: "riskLevel", defaultValue: "medium", values: ["low", "medium", "high"] },
  { id: "securityLevel", defaultValue: "standard", values: ["basic", "standard", "premium"] },
];
const englishHomeSource = read("tools/home-security-cost/index.html");
const englishHomeContract = expectedHomeContract.map(({ id }) => selectContract(englishHomeSource, id));
assert.deepStrictEqual(sharedHomeSecurity.CONTROL_CONTRACT, expectedHomeContract, "shared Home Security engine owns the exact four-control contract");
assert.deepStrictEqual(englishHomeContract, expectedHomeContract, "English Home Security DOM matches the shared four-control contract");
assert.ok(englishHomeSource.includes('/assets/js/engines/home-security-cost.js'), "English Home Security uses the shared engine");
assert.ok(!englishHomeSource.includes("var COSTS="), "English Home Security no longer carries a second inline formula owner");

const homeFixtures = [
  {
    input: { country:"NG", homeType:"bungalow", riskLevel:"medium", securityLevel:"standard" },
    expected: { totalSetup:550000, totalMonthly:20000, annualCost:350000, fiveYear:1750000 },
  },
  {
    input: { country:"NG", homeType:"flat", riskLevel:"low", securityLevel:"basic" },
    expected: { totalSetup:157500, totalMonthly:5000, annualCost:91500, fiveYear:457500 },
  },
  {
    input: { country:"KE", homeType:"mansion", riskLevel:"high", securityLevel:"premium" },
    expected: { totalSetup:405000, totalMonthly:32700, annualCost:473400, fiveYear:2367000 },
  },
];
for (const fixture of homeFixtures) {
  const englishResult = sharedHomeSecurity.calculate(fixture.input);
  const frenchResult = JSON.parse(JSON.stringify(api.engines.homeSecurity(fixture.input)));
  assert.deepStrictEqual(
    { totalSetup:englishResult.totalSetup, totalMonthly:englishResult.totalMonthly, annualCost:englishResult.annualCost, fiveYear:englishResult.fiveYear },
    fixture.expected,
    `English Home Security canonical fixture ${JSON.stringify(fixture.input)}`
  );
  assert.deepStrictEqual(frenchResult, JSON.parse(JSON.stringify(englishResult)), "French Home Security calls the identical shared formula");
}
assert.throws(
  () => api.engines.homeSecurity({ country:"NG", homeType:"bungalow", riskLevel:"medium", securityLevel:"XX" }),
  /niveau de protection/,
  "French Home Security rejects a non-canonical control value"
);

const breach = api.engines.dataBreach({
  country: "NG",
  currencyLabel: "NGN",
  exchangeRate: 1660,
  records: 10000,
  basePerRecord: 165,
  sensitivity: "medium",
  detection: "medium",
  notificationCost: 20000,
  forensicsCost: 37500,
  legalCost: 50000,
  communicationCost: 20000,
  remediationCost: 62500,
  downtimeCost: 80000,
});
assert.strictEqual(breach.totalUSD, 1920000);
assert.strictEqual(breach.totalLocal, 3187200000);
assert.strictEqual(breach.perRecord, 192);
assert.throws(
  () => api.engines.dataBreach({ country: "NG", records: 0, basePerRecord: 165, sensitivity: "medium", detection: "medium" }),
  /enregistrements/,
  "breach calculator rejects zero records"
);

const controlIds = [
  "firewall","vpn","wifi_secure","network_monitor","encryption","backup","data_policy","privacy_policy",
  "mfa","least_priv","pw_policy","access_review","antivirus","os_updates","device_policy","sec_training",
  "phishing_sim","sec_policy","incident_plan","incident_drill",
];
assert.strictEqual(api.engines.cybersecurity({ checks: controlIds, incidents: "none" }).score, 100);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(api.engines.cybersecurity({ checks: controlIds, incidents: "major" }))),
  {
    score: 85,
    baseScore: 100,
    incidentPenalty: 15,
    grade: "B",
    domains: [
      { label: "Sécurité réseau", score: 20, max: 20, missing: [] },
      { label: "Protection des données", score: 20, max: 20, missing: [] },
      { label: "Contrôle d’accès", score: 20, max: 20, missing: [] },
      { label: "Sécurité des terminaux", score: 15, max: 15, missing: [] },
      { label: "Sensibilisation", score: 15, max: 15, missing: [] },
      { label: "Réponse aux incidents", score: 10, max: 10, missing: [] },
    ],
    missing: [],
  }
);

const fireAll = api.engines.fireSafety({ country: "NG", propType: "office", area: 500, floors: 2, occupants: 50, checks: Array.from({ length: 17 }, (_, index) => `c${index + 1}`), currencyLabel:"NGN", remediationBudget:250000, maintenanceBudget:12500 });
assert.strictEqual(fireAll.score, 100);
assert.strictEqual(fireAll.remediation, 250000, "French Fire reports the explicit user-entered remediation budget");
assert.strictEqual(fireAll.maintenance, 12500, "French Fire reports the explicit user-entered maintenance budget");
assert.strictEqual(api.engines.fireSafety({ country: "NG", propType: "office", area: 500, floors: 2, occupants: 50, checks: [], currencyLabel:"NGN", remediationBudget:250000, maintenanceBudget:12500 }).failed.length, 17);
assert.deepStrictEqual(sharedFire.WEIGHTS, [8,10,7,5,8,7,5,8,6,6,5,6,5,4,5,3,2], "shared Fire engine preserves English visible weights");
const englishFire = read("tools/fire-safety-checklist/index.html");
const visibleWeights = Array.from(englishFire.matchAll(/data-pts="(\d+)"/g), (match) => Number(match[1]));
assert.deepStrictEqual(visibleWeights, sharedFire.WEIGHTS, "English visible Fire points are owned by the shared engine contract");
for (const checks of [
  ["c1","c2","c3","c4","c5","c16"],
  ["c1","c4","c8","c12","c17"],
  ["c2","c3","c6","c9","c11","c14","c16"],
  ["c1","c5","c7","c10","c13","c15"],
]) {
  const input = { country: "KE", propType: "restaurant", area: 725, floors: 3, occupants: 81, checks };
  const french = api.engines.fireSafety(Object.assign({}, input, { currencyLabel:"KES", remediationBudget:50000, maintenanceBudget:2500 }));
  const english = sharedFire.calculate(input);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify({ score:french.score, checkedPoints:french.checkedPoints, totalPoints:french.totalPoints, failed:french.failed.map(({ id, points }) => ({ id, points })), domains:french.domains })),
    JSON.parse(JSON.stringify({ score:english.score, checkedPoints:english.checkedPoints, totalPoints:english.totalPoints, failed:english.failed.map(({ id, points }) => ({ id, points })), domains:english.domains })),
    `French and English Fire scoring parity for varied subset ${checks.join(",")}`
  );
}
const fireFixtures = [
  { checks:["c1","c2","c3","c4","c5","c16"], score:41 },
  { checks:["c1","c3","c5","c7","c9","c11","c13","c15","c17"], score:51 },
  { checks:["c2","c6","c8","c10","c12"], score:37 },
];
for (const fixture of fireFixtures) {
  assert.strictEqual(
    sharedFire.calculate({ country:"NG", propType:"office", area:500, floors:2, occupants:50, checks:fixture.checks }).score,
    fixture.score,
    `Fire subset ${fixture.checks.join(",")} has the canonical English score`
  );
}

assert.strictEqual(api.engines.passwordScore("password"), 10);
assert.strictEqual(api.engines.passwordScore(""), 0);
assert.ok(api.engines.passwordScore("Longue-Phrase-Unique-2026!") >= 80);
assert.strictEqual(api.engines.generatePassword(16).length, 16, "French password tool generates a local 16-character credential");
const passphrases = Array.from({ length: 24 }, () => api.engines.generatePassphrase());
assert.ok(passphrases.every((value) => value.split("-").length === 6), "French password tool generates six-word local passphrases");
assert.strictEqual(new Set(passphrases).size, passphrases.length, "French password tool produces varied passphrases");
assert.ok(6 * Math.log2(2048) >= 66, "six uniformly sampled words provide at least 66 bits of selection entropy");

const policy = JSON.parse(read("data/registry/locale-coverage-policy.json"));
const securityRoutes = IDS.map((id) => `/fr/tools/${ROUTES[id]}/`);
for (const route of securityRoutes) {
  const override = policy.overrides.find((item) => item.route === route);
  assert.ok(override, `${route}: exact localization ownership override`);
  assert.strictEqual(override.state, "native", `${route}: native ownership`);
  assert.match(override.sourceOwner, /generator=scripts\/generate-fr-tool-gap-pages\.js -> scripts\/lib\/french-security-page\.js; page=fr\/tools\/.*index\.html; controller=assets\/js\/pages\/french-security-tools\.js.*; engine=/, `${route}: exact generator/page/controller/engine ownership`);
}
assert.match(
  policy.overrides.find((item) => item.route === "/fr/tools/checklist-securite-incendie/").sourceOwner,
  /assets\/js\/engines\/security-fire-safety\.js/,
  "Fire ownership identifies the shared engine"
);
const homeOwner = policy.overrides.find((item) => item.route === "/fr/tools/cout-securite-maison/");
assert.match(homeOwner.sourceOwner, /assets\/js\/engines\/home-security-cost\.js/, "Home Security ownership identifies the shared English/French engine");
assert.strictEqual(homeOwner.engineLocaleNeutral, true, "Home Security engine is truthfully locale-neutral");
const coverageDocument = JSON.parse(read("data/registry/locale-page-coverage.json"));
const coverageRows = Array.isArray(coverageDocument) ? coverageDocument : (coverageDocument.pages || coverageDocument.routes || coverageDocument.records || []);
for (const route of securityRoutes) {
  const expected = policy.overrides.find((item) => item.route === route);
  const record = coverageRows.find((item) => item.route === route);
  assert.ok(record, `${route}: generated coverage record exists`);
  assert.strictEqual(record.state, "native", `${route}: generated coverage is truthful`);
  assert.strictEqual(record.sourceOwner, expected.sourceOwner, `${route}: generated owner matches policy`);
  assert.strictEqual(record.engineLocaleNeutral, expected.engineLocaleNeutral, `${route}: generated engine ownership matches policy`);
}

console.log("French Security parity: 7/7 routes, registry, SEO, artwork, privacy, and deterministic engines verified.");
