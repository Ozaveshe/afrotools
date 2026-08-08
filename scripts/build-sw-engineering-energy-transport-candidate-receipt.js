"use strict";

const fs = require("fs");
const path = require("path");
const inventory = require("../reports/swahili-free-app-parity-inventory.json");
const transportStatus = require("../data/transport/source-status.json");
const { SW_ENERGY_REMAINING_APPS } = require("./lib/sw-energy-remaining-contract.js");
const { SW_ENGINEERING_MATERIALS_APPS } = require("./lib/sw-engineering-materials-contract.js");
const { SW_TRANSPORT_COST_APPS } = require("./lib/sw-transport-cost-contract.js");
const SW_SOLAR_CALCULATOR = require("./lib/sw-solar-calculator-contract.js");
const SW_BUILDING_COST = require("./lib/sw-building-cost-contract.js");
const SW_BOQ_BUILDER = require("./lib/sw-boq-builder-contract.js");
const SW_STRUCTURAL_SCREENING = require("./lib/sw-structural-screening-contract.js");
const SW_ELECTRICAL_LOAD = require("./lib/sw-electrical-load-contract.js");
const SW_PAINT = require("./lib/sw-paint-contract.js");
const SW_ROOF = require("./lib/sw-roof-contract.js");

const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = "reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.json";
const OUT_MD = "reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.md";
const OUT_ART = "reports/sw-engineering-energy-transport-missing-artwork-2026-08-08.json";
const BASE_SHA = "6edacda8437e1fa9b9e5a512138cbdd3169e38be";
const CATEGORY_KEYS = ["engineering", "energy", "transport"];

// This lane was partitioned against BASE_SHA. Central acceptance grows after
// integration, so deriving today's rows from `!accepted` silently shrinks and
// reassigns the 55-app programme. Resolve the frozen IDs from the owned receipt.
const pinnedReceipt = JSON.parse(fs.readFileSync(path.join(ROOT, OUT_JSON), "utf8"));
const inventoryById = new Map(inventory.rows.map((row) => [row.englishId, row]));
const rows = pinnedReceipt.apps.map((app) => inventoryById.get(app.englishId));
const energyIds = new Set(SW_ENERGY_REMAINING_APPS.map((app) => app.id));
const engineeringIds = new Set(SW_ENGINEERING_MATERIALS_APPS.map((app) => app.id));
const transportCostIds = new Set(SW_TRANSPORT_COST_APPS.map((app) => app.id));
const statusByTransportId = new Map(transportStatus.tools.map((tool) => [tool.id, tool]));
const transportProofById = Object.freeze({
  "fleet-fuel": Object.freeze({
    sourceOwner: "scripts/lib/sw-transport-cost-contract.js -> assets/js/engines/transport-cost-engine.js -> assets/js/pages/sw-transport-cost-parity.js",
    formulaDecision: "Exact English fleet fuel engine: km x L/100km x user-entered price x vehicle count; six-day week, entered operating-day month and 12-month year preserved.",
    sourceDecision: "Fuel price and consumption are user-entered; no live/current pump-price claim. UI requires verification before budgeting or dispatch.",
    exportProof: "English advertises copy only; Swahili copy remains local and no unavailable download format is advertised.",
  }),
  "vehicle-operating-cost": Object.freeze({
    sourceOwner: "scripts/build-sw-vehicle-operating-cost-parity.js -> scripts/lib/sw-transport-cost-contract.js -> assets/js/engines/transport-cost-engine.js -> assets/js/pages/sw-vehicle-operating-cost-parity.js",
    formulaDecision: "Exact English operating-cost engine: fuel units and annualization plus fixed 4/6% maintenance, 1.5% registration and 20/22% depreciation planning assumptions are preserved and visibly disclosed.",
    sourceDecision: "All changing prices and costs are user-entered. Fixed percentage assumptions are labelled low-to-medium-confidence planning inputs, not official rates or live market data.",
    exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js 3.11 parser.",
  }),
  "truck-load": Object.freeze({
    sourceOwner: "scripts/build-sw-truck-load-parity.js -> scripts/lib/sw-transport-cost-contract.js -> assets/js/engines/transport-cost-engine.js -> assets/js/pages/sw-truck-load-parity.js",
    formulaDecision: "Exact English load engine: utilization = load/capacity, tonne-km = load x km, unit costs divide the user-entered trip cost, and unused-capacity cost is the proportional share. English and Swahili fail closed when load exceeds entered capacity.",
    sourceDecision: "Capacity, load, distance, currency label and total trip cost are user-entered planning assumptions. The UI supplies no fare, tariff, market benchmark or legal axle/load approval and requires vehicle/route verification.",
    exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js 3.11 parser.",
  }),
});

function exists(file) { return Boolean(file) && fs.existsSync(path.join(ROOT, file)); }
function routeFile(row) { return row.primarySwahiliFile || null; }
function artworkFile(row) { return `assets/img/tools/${row.englishId}.webp`; }

if (rows.some((row) => !row)) throw new Error("Pinned 55-app assignment no longer resolves against the authoritative inventory.");
if (rows.length !== 55) throw new Error(`Expected exact denominator 55, received ${rows.length}.`);
for (const [key, count] of [["engineering", 20], ["energy", 17], ["transport", 18]]) {
  const actual = rows.filter((row) => row.categoryKey === key).length;
  if (actual !== count) throw new Error(`${key}: expected ${count}, received ${actual}.`);
}
if (energyIds.size !== 17) throw new Error(`Expected 17 Energy contracts, received ${energyIds.size}.`);
if (engineeringIds.size !== 4) throw new Error(`Expected 4 Engineering contracts, received ${engineeringIds.size}.`);

const apps = rows.map((row) => {
  const routePresent = exists(routeFile(row));
  const artFile = artworkFile(row);
  const artwork = { file: artFile, status: exists(artFile) ? "present" : "missing" };
  if (row.categoryKey === "energy") {
    if (!energyIds.has(row.englishId) || !routePresent) throw new Error(`Energy owner missing for ${row.englishId}.`);
    const contract = SW_ENERGY_REMAINING_APPS.find((app) => app.id === row.englishId);
    return {
      englishId: row.englishId,
      categoryKey: row.categoryKey,
      englishRoute: row.englishRoute,
      swahiliRoute: contract.swRoute,
      swahiliFile: contract.file,
      status: "accepted-candidate",
      sourceOwner: `scripts/lib/sw-energy-remaining-contract.js -> assets/js/engines/${contract.engine}.js -> assets/js/pages/sw-energy-remaining-parity.js`,
      formulaDecision: "Exact English-owned DOM-free engine; valid and invalid oracle fixtures passed without formula duplication.",
      sourceDecision: "Offline March 2026 planning snapshot; visibly stale/low-confidence; 12/54 regulator coverage and 42 gaps are disclosed; no live or official-result claim.",
      browserProof: "Chromium: 320px, 375px, 200% reflow; light/dark; keyboard/focus; valid/invalid/reset; no console/page errors or raw-input network requests.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js 3.11 parser.",
      artwork,
      blocker: null,
    };
  }

  if (row.englishId === SW_SOLAR_CALCULATOR.id) {
    if (!exists(SW_SOLAR_CALCULATOR.file)) throw new Error("Solar calculator owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_SOLAR_CALCULATOR.swRoute, swahiliFile: SW_SOLAR_CALCULATOR.file, status: "accepted-candidate",
      sourceOwner: "scripts/build-sw-solar-calculator-parity.js -> data/energy/sw-energy-planning-snapshot.js -> assets/js/engines/solar-calculator-engine.js -> assets/js/pages/sw-solar-calculator-parity.js",
      formulaDecision: "Engineering owns this catalog app; one shared DOM-free engine preserves the English load, loss, panel, battery, inverter, MPPT, roof and cost calculations. Energy supplies the maintained country planning snapshot without receiving duplicate acceptance credit.",
      sourceDecision: "Country irradiance, currency and FX come from the offline March 2026 Energy snapshot and are visibly stale/low-confidence. Appliance load and site losses are user-entered; no live price, official design, grid approval or installer quote is claimed.",
      browserProof: "Chromium: 320px, 375px and 200% reflow; light/dark; keyboard/focus; valid/invalid/reset/stale state; reciprocal metadata; no console/page errors or raw-input network requests; English regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.",
      artwork, blocker: null,
    };
  }
  if (row.englishId === SW_BUILDING_COST.id) {
    if (!exists(SW_BUILDING_COST.file)) throw new Error("Building cost owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_BUILDING_COST.swRoute, swahiliFile: SW_BUILDING_COST.file, status: "accepted-candidate",
      sourceOwner: "scripts/build-sw-building-cost-parity.js -> assets/js/engines/building-cost-engine.js -> assets/js/pages/sw-building-cost-parity.js",
      formulaDecision: "Exact floor-plan Building Cost Estimator semantics: measured area gross-up, city/finish/type/site rate, preliminaries, external works, professional fees, contingency, escalation, confidence range and timeline. English and Swahili consume one DOM-free engine.",
      sourceDecision: "Exact route ownership is proved by inventory, locale coverage and route graph. City rates are a stale 2024 planning snapshot; RICS cost-prediction methodology is linked, while quantities, current prices, approvals and contract scope require local professional verification.",
      browserProof: "Chromium: 320px, 375px and 200% reflow; themes, keyboard/focus, valid/invalid/reset/stale state, reciprocal metadata, no console/page errors or raw-input network requests; English regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.englishId === SW_BOQ_BUILDER.id) {
    if (!exists(SW_BOQ_BUILDER.file)) throw new Error("BOQ builder owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_BOQ_BUILDER.swRoute, swahiliFile: SW_BOQ_BUILDER.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-boq-builder-contract.js -> assets/js/engines/boq-builder-engine.js -> sw/zana/orodha-vifaa/index.html",
      formulaDecision: "Exact BOQ Builder ordering: line quantity x rate, contingency on subtotal, VAT on subtotal plus contingency, then contractor markup. English and Swahili consume one DOM-free engine.",
      sourceDecision: "Exact route ownership is proved by inventory and locale coverage and is distinct from boq-gen. Quantities, current supplier rates, VAT and scope are user-entered; results are low-confidence planning estimates until a qualified quantity surveyor verifies them.",
      browserProof: "Chromium: 320px, 375px and 200% reflow; themes, keyboard/focus, valid/invalid/reset, reciprocal metadata, no console/page errors or raw-input network requests; English shared-engine regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.englishId === SW_STRUCTURAL_SCREENING.id) {
    if (!exists(SW_STRUCTURAL_SCREENING.file)) throw new Error("Structural screening owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_STRUCTURAL_SCREENING.swRoute, swahiliFile: SW_STRUCTURAL_SCREENING.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-structural-screening-contract.js -> assets/js/engines/structural-screening-engine.js -> assets/js/pages/sw-structural-screening-parity.js",
      formulaDecision: "Exact English legacy beam, column, slab and footing screens were extracted into one DOM-free engine and consumed by both routes. These outputs remain preliminary prompts, never structural design or code approval.",
      sourceDecision: "Exact route ownership is proved by inventory, registry sourceId, locale coverage and route graph. The BS 8110-style formula set and embedded material prices are undated, stale and low-confidence; a registered structural engineer must select current rules, loads and details.",
      browserProof: "Chromium: all four mode oracles, invalid/stale clearing, reset, 320px, 375px and 200% reflow, themes, keyboard/focus, reciprocal metadata, no console/page errors or raw-input egress; four English shared-engine regressions passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.englishId === SW_ELECTRICAL_LOAD.id) {
    if (!exists(SW_ELECTRICAL_LOAD.file)) throw new Error("Electrical load owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_ELECTRICAL_LOAD.swRoute, swahiliFile: SW_ELECTRICAL_LOAD.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-electrical-load-contract.js -> assets/js/engines/electrical-load-engine.js -> assets/js/pages/sw-electrical-load-parity.js",
      formulaDecision: "Exact English connected-load, diversity, phase-current, illustrative breaker/cable, generator and monthly-use calculations were extracted into one DOM-free engine consumed by both routes.",
      sourceDecision: "Exact Engineering ownership is proved by inventory, registry sourceId, locale coverage and route graph. Country voltages, tariff assumptions and sizing tables are undated static planning inputs with low confidence; a licensed electrician and current utility rules control final selection.",
      browserProof: "Chromium: deterministic home and three-phase oracles, invalid/stale clearing, reset, 320px, 375px and 200% reflow, themes, keyboard/focus, reciprocal metadata, no console/page errors or raw-input egress; English shared-engine regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.englishId === SW_PAINT.id) {
    if (!exists(SW_PAINT.file)) throw new Error("Paint calculator owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_PAINT.swRoute, swahiliFile: SW_PAINT.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-paint-contract.js -> assets/js/engines/engineering-materials-engine.js -> assets/js/pages/sw-paint-parity.js",
      formulaDecision: "Exact English rectangle, L-shape and custom room geometry, openings, ceiling, surface factor, coats, waste, primer, tin and cost formulas are shared through the maintained DOM-free Engineering Materials engine.",
      sourceDecision: "Exact route ownership is proved by inventory, registry sourceId, locale coverage and route graph. Swahili requires user-entered current label coverage and price; no undated brand table is presented as live or authoritative. Product-label and surface verification remain explicit.",
      browserProof: "Chromium: rectangle, L-shape and custom oracles, multiple rooms, invalid/stale clearing, reset, 320px, 375px and 200% reflow, themes, keyboard/focus, reciprocal metadata, no console/page errors or raw-input egress; English shared-engine regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.englishId === SW_ROOF.id) {
    if (!exists(SW_ROOF.file)) throw new Error("Roof calculator owner missing.");
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: SW_ROOF.swRoute, swahiliFile: SW_ROOF.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-roof-contract.js -> assets/js/engines/engineering-materials-engine.js -> assets/js/pages/sw-roof-parity.js",
      formulaDecision: "Exact English gable, hip and mono-pitch geometry, overhang, pitch, effective coverage, waste, ridge, nail, fascia, truss-timber and purlin planning formulas are shared through the maintained DOM-free Engineering Materials engine; the undefined English sections runtime defect is repaired.",
      sourceDecision: "Exact route ownership is proved by inventory, registry sourceId, locale coverage and route graph. Product coverage is user-checked; no stale brand price or live-width claim is made. Truss, purlin and fixing outputs are low-confidence planning allowances until a licensed roof professional verifies wind, loads, spans, details and local rules.",
      browserProof: "Chromium: gable, hip and mono-pitch oracles, invalid/stale clearing, reset, 320px, 375px and 200% reflow, themes, keyboard/focus, reciprocal metadata, no console/page errors or raw-input egress; English shared-engine regression passed.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js parser.", artwork, blocker: null,
    };
  }

  if (row.categoryKey === "engineering" && engineeringIds.has(row.englishId)) {
    const contract = SW_ENGINEERING_MATERIALS_APPS.find((app) => app.id === row.englishId);
    if (!routePresent) throw new Error(`Engineering owner missing for ${row.englishId}.`);
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: contract.swRoute, swahiliFile: contract.file, status: "accepted-candidate",
      sourceOwner: "scripts/lib/sw-engineering-materials-contract.js -> assets/js/engines/engineering-materials-engine.js -> assets/js/pages/sw-engineering-materials-parity.js",
      formulaDecision: "Exact English semantics extracted to one DOM-free engine and consumed by both English and Swahili controllers; oracle and English browser regressions passed.",
      sourceDecision: "User-entered dimensions, waste, prices and material assumptions only; no changing official/live rate is claimed. Planning-estimate and professional-review boundaries are visible.",
      browserProof: "Chromium: 320px, 375px and 200% reflow; light/dark; keyboard/focus; valid/invalid/reset; no console/page errors or raw-input network requests.",
      exportProof: "JSON downloaded, parsed and reopened; CSV and TXT parsed; PDF downloaded and reopened through the repository-vendored PDF.js 3.11 parser.",
      artwork, blocker: null,
    };
  }
  if (row.categoryKey === "transport" && transportCostIds.has(row.englishId)) {
    const contract = SW_TRANSPORT_COST_APPS.find((app) => app.id === row.englishId);
    if (!routePresent) throw new Error(`Transport cost owner missing for ${row.englishId}.`);
    const proof = transportProofById[row.englishId];
    if (!proof) throw new Error(`Transport proof missing for ${row.englishId}.`);
    return {
      englishId: row.englishId, categoryKey: row.categoryKey, englishRoute: row.englishRoute,
      swahiliRoute: contract.swRoute, swahiliFile: contract.file, status: "accepted-candidate",
      sourceOwner: proof.sourceOwner,
      formulaDecision: proof.formulaDecision,
      sourceDecision: proof.sourceDecision,
      browserProof: "Chromium at 320px, 375px and 200% reflow; valid/invalid/reset, theme, keyboard/focus, no overflow, console/page errors or raw-input network requests; English regression passed.",
      exportProof: proof.exportProof,
      artwork, blocker: null,
    };
  }

  const missingRoute = !routePresent;
  const transport = row.categoryKey === "transport" ? statusByTransportId.get(row.englishId) : null;
  const sourceState = transport ? `${transport.status}: ${(transport.sourceIds || []).join(", ")}` : "No bounded app-specific official-source ledger was proved in this lane.";
  let blocker = missingRoute
    ? "No physical native Swahili route/source owner exists."
    : "The present localized shell does not prove the exact English engine, calculation boundary, invalid/reset behavior and every advertised export for this English ID.";
  if (row.englishId === "car-import-cost") {
    blocker = "Native controller/browser behavior is improved, but the official transport ledger marks the customs/port source set changed; accepting current duty/data semantics without source review would be unsafe.";
  }
  return {
    englishId: row.englishId,
    categoryKey: row.categoryKey,
    englishRoute: row.englishRoute,
    swahiliRoute: row.primarySwahiliRoute,
    swahiliFile: routeFile(row),
    status: "blocked",
    sourceOwner: row.sourceOwner || "unreconciled",
    formulaDecision: "Fail closed: exact per-English-ID engine/formula parity not proved.",
    sourceDecision: sourceState,
    browserProof: routePresent ? "Physical route shell passed 320px, 375px and 200% reflow smoke; this is not product acceptance." : "Not runnable because the physical Swahili route is missing.",
    exportProof: "Not accepted: every English-advertised export was not downloaded and parsed/reopened for this app.",
    artwork,
    blocker,
  };
});

const accepted = apps.filter((app) => app.status === "accepted-candidate");
const blocked = apps.filter((app) => app.status === "blocked");
const missingArtwork = apps.filter((app) => app.artwork.status === "missing").map((app) => ({ englishId: app.englishId, expectedFile: app.artwork.file }));
const receipt = {
  schemaVersion: 1,
  generatedAt: "2026-08-08",
  baseline: { originMain: BASE_SHA, branch: "codex/sw-engineering-energy-transport-parity" },
  scope: { denominator: 55, categories: { engineering: 20, energy: 17, transport: 18 } },
  outcome: {
    acceptedCandidates: accepted.length,
    blocked: blocked.length,
    byCategory: {
      engineering: { denominator: 20, acceptedCandidates: 11, blocked: 9 },
      energy: { denominator: 17, acceptedCandidates: 17, blocked: 0 },
      transport: { denominator: 18, acceptedCandidates: 3, blocked: 15 },
    },
    acceptanceBoundary: "Candidate receipt only; coordinator-owned central acceptance remains unchanged.",
  },
  proof: {
    static: ["tests/swahili-energy-remaining-static.test.js", "tests/swahili-engineering-materials-parity.test.js", "tests/swahili-boq-builder-parity.test.js", "tests/swahili-structural-screening-parity.test.js", "tests/swahili-electrical-load-parity.test.js", "tests/swahili-paint-parity.test.js", "tests/swahili-roof-parity.test.js", "tests/swahili-transport-static-candidate.test.js", "tests/swahili-transport-cost-parity.test.js"],
    browser: ["tests/e2e/sw-engineering-energy-transport-candidate.spec.js", "tests/e2e/sw-engineering-materials-parity.spec.js", "tests/e2e/sw-boq-builder-parity.spec.js", "tests/e2e/sw-structural-screening-parity.spec.js", "tests/e2e/sw-electrical-load-parity.spec.js", "tests/e2e/sw-paint-parity.spec.js", "tests/e2e/sw-roof-parity.spec.js", "tests/e2e/sw-transport-cost-parity.spec.js"],
    browserMatrix: "54 physical routes at 320px, 375px and 640px/200% reflow; 17 deep Energy workflows; 11 deep Engineering workflows plus English regressions; fleet-fuel, vehicle-operating-cost and truck-load deep Swahili and English regressions; car-import focused invalid/reset/privacy flow.",
    privacy: "Deep tests instrument fetch, XMLHttpRequest and beacon boundaries; zero raw-input requests. All accepted calculations and exports remain local and no AI call exists.",
  },
  apps,
};

if (accepted.length !== 31 || blocked.length !== 24) throw new Error(`Expected 31 accepted candidates and 24 blocked; received ${accepted.length}/${blocked.length}.`);

const artworkReceipt = {
  schemaVersion: 1,
  generatedAt: "2026-08-08",
  scope: "Exact 55 assigned Engineering, Energy and Transport English IDs",
  denominator: 55,
  present: 55 - missingArtwork.length,
  missing: missingArtwork,
};

const byCategory = (key, status) => apps.filter((app) => app.categoryKey === key && app.status === status).map((app) => `\`${app.englishId}\``).join(", ");
const md = `# Swahili Engineering, Energy and Transport candidate receipt

Status: **31 accepted candidates / 24 blocked / exact denominator 55**. This receipt does not edit or imply coordinator acceptance.

## Outcome

| Category | Denominator | Accepted candidate | Blocked |
|---|---:|---:|---:|
| Engineering & Construction | 20 | 11 | 9 |
| Energy & Utilities | 17 | 17 | 0 |
| Transport & Logistics | 18 | 3 | 15 |
| **Total** | **55** | **31** | **24** |

Accepted Energy IDs: ${byCategory("energy", "accepted-candidate")}.

Accepted Engineering IDs: ${byCategory("engineering", "accepted-candidate")}.

Blocked Engineering IDs: ${byCategory("engineering", "blocked")}.

Blocked Transport IDs: ${byCategory("transport", "blocked")}.

Accepted Transport IDs: ${byCategory("transport", "accepted-candidate")}.

## Product, formula and source decisions

- The 17 Energy pages use their exact English-owned DOM-free engines through \`scripts/lib/sw-energy-remaining-contract.js\`; no formulas were translated or copied. Focused tests exercise valid and invalid oracle cases.
- The bounded \`data/energy/sw-energy-planning-snapshot.js\` owner preserves March 2026 source values and normalizes only the existing LPG field name required by the shared engine. UI labels the data stale, planning-only and low-confidence. The ledger boundary is 12/54 regulator-linked markets with 42 gaps.
- Concrete, tiles, water-tank, rebar, paint and roof now share \`assets/js/engines/engineering-materials-engine.js\` with their English routes. Exact constants, geometry, unit conversions and calculation boundaries have oracle fixtures; after the solar, building-cost, BOQ Builder, structural-screening and electrical-load additions, the remaining 9 Engineering IDs stay fail-closed.
- \`solar-calculator\` remains Engineering-owned but reuses the maintained March 2026 Energy snapshot and one shared DOM-free sizing engine with the English route. It receives one Engineering acceptance credit and no duplicate Energy credit. The UI marks the country data stale/low-confidence and the output as planning-only, never an installer design or grid approval.
- \`floor-plan\` owns exactly \`/sw/zana/kikokotoo-gharama-za-ujenzi/\` through inventory, locale-coverage and route-graph evidence. It is distinct from Legal \`construction-budget\`, AfroPlan and road-construction routes. Its 2024 city-rate snapshot is visibly stale, RICS methodology is linked, and one shared engine owns the full allowance stack.
- \`boq-generator\` owns exactly \`/sw/zana/orodha-vifaa/\` and English \`/tools/boq-builder/\`. It is distinct from \`boq-gen\` at \`/tools/boq-generator/\` and \`/sw/zana/kizalishaji-orodha-ya-kiasi/\`. The shared engine preserves contingency, VAT and markup ordering; all price and scope inputs remain user-provided planning assumptions.
- \`structural-calc\` owns exactly \`/sw/zana/kikokotoo-miundo-ya-ujenzi/\`. Its four legacy screens are shared with English, but both the formula basis and embedded material rates are visibly undated, stale and low-confidence. No structural design, code compliance or approval is claimed.
- \`electrical-load\` owns exactly \`/sw/zana/kikokotoo-mzigo-wa-umeme/\` under Engineering. Generator-sizing and electricity-tariff remain separate apps. Both routes share one DOM-free engine; voltage, tariff and size tables are visibly undated, static and low-confidence, with licensed-electrician verification required.
- \`paint-calc\` owns exactly \`/sw/zana/kikokotoo-rangi/\`. Color and palette utilities, building-material costs and renovation costs remain distinct. Swahili uses user-entered product-label coverage and current price rather than presenting the English legacy brand table as live data.
- \`roofing-calc\` owns exactly \`/sw/zana/vifaa-vya-paa/\`. Structural design, building cost, BOQ and other material calculators remain distinct. Swahili uses user-checked current product coverage and labels truss, purlin and fixing quantities as low-confidence planning allowances pending licensed professional review.
- Fleet fuel, vehicle operating cost and truck load now use the exact English DOM-free Transport cost engine. Truck load uses only user-entered capacity, load, distance, currency label and trip cost; it supplies no fare, tariff, market benchmark or legal load approval. The remaining 15 Transport IDs stay fail-closed, and car-import customs/port sources remain \`changed\` in \`data/transport/source-status.json\`.
- All 55 expected dedicated artwork files exist. The machine-readable artwork queue is empty.

## Browser and export proof

- Chromium, one worker, isolated lane ports: 54 existing physical routes at 320px, 375px and 640px with 200% CSS reflow; no horizontal overflow, iframe, canonical mismatch, console error or page error.
- Every Energy app: valid calculation, invalid-state clearing, reset, explicit dark/light toggle, keyboard focus, JSON download/parse/reopen, CSV parse, TXT parse and PDF parse via the repository-vendored PDF.js 3.11 parser. The final proof is split into green 17-test deep-workflow and green 55-test route/boundary runs to isolate browser-cache contention.
- Every accepted Engineering app: the same interaction/export matrix at 320px and 375px, plus a green English-route regression through the shared engine.
- Solar calculator: 320px, 375px and 200% reflow; stale state; invalid/reset; themes and keyboard focus; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and reciprocal English/French/Swahili metadata passed.
- BOQ Builder: exact allowance-order oracle, invalid/stale clearing, reset, themes and keyboard focus; JSON parsed/reopened, RFC-escaped CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and exact route disambiguation passed.
- Structural screening: beam, column, slab and footing oracles; invalid/stale clearing, reset, themes and keyboard focus; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; four English shared-engine regressions and exact ownership passed.
- Electrical load: connected/demand load, phase current, breaker/cable, generator and monthly-use oracles; invalid/stale clearing, reset, themes and keyboard focus; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and exact ownership passed.
- Paint: rectangle, L-shape and custom geometry, openings, ceiling, surface, coats, primer, tins and cost oracles; multi-room and invalid/reset paths; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and exact ownership passed.
- Roof: gable, hip and mono-pitch geometry, pitch, overhang, coverage, waste, ridge, nails, truss timber and purlin oracles; invalid/reset paths; JSON parsed/reopened, CSV/TXT parsed and PDF reopened through PDF.js; English shared-engine regression and exact ownership passed.
- Truck load: exact oracle plus overload boundary; invalid/reset; light/dark; keyboard/focus; reciprocal metadata; JSON parsed and reopened, CSV/TXT parsed, and PDF reopened with PDF.js. The English route passed through the same engine after removal of its unused fuel-consumption field.
- Network instrumentation recorded no fetch/XHR/beacon carrying raw inputs on the accepted deep flows. No AI call exists. Car-import requests were restricted to local synthetic fixture/source JSON paths.
- The remaining absent physical route is \`car-price-intelligence\`; its absence is asserted and blocked, not hidden by denominator arithmetic.

## Ownership and changed paths

- Energy generator/manifest: \`scripts/build-sw-energy-remaining-parity.js\`, \`scripts/lib/sw-energy-remaining-contract.js\`.
- Energy runtime/data/style: \`assets/js/pages/sw-energy-remaining-parity.js\`, \`data/energy/sw-energy-planning-snapshot.js\`, \`assets/css/sw-energy-remaining-parity.css\`.
- Generated by the bounded owner only: 17 \`sw/zana/**/index.html\` Energy routes and the Swahili Energy hub.
- Transport checkpoint: \`assets/js/pages/swahili-car-import-cost.js\` and focused transport source/browser tests.
- Engineering generator/manifest/engine: \`scripts/build-sw-engineering-materials-parity.js\`, \`scripts/lib/sw-engineering-materials-contract.js\`, and \`assets/js/engines/engineering-materials-engine.js\`.
- Engineering runtime/style: \`assets/js/pages/sw-engineering-materials-parity.js\` and \`assets/css/sw-engineering-materials-parity.css\`; four bounded generated Swahili routes are owned by that generator.
- Solar calculator owner/runtime/style: \`scripts/build-sw-solar-calculator-parity.js\`, \`scripts/lib/sw-solar-calculator-contract.js\`, \`assets/js/engines/solar-calculator-engine.js\`, \`assets/js/pages/sw-solar-calculator-parity.js\`, and \`assets/css/sw-solar-calculator-parity.css\`.
- Building-cost owner/runtime/style: \`scripts/build-sw-building-cost-parity.js\`, \`scripts/lib/sw-building-cost-contract.js\`, \`assets/js/engines/building-cost-engine.js\`, \`assets/js/pages/sw-building-cost-parity.js\`, and \`assets/css/sw-building-cost-parity.css\`.
- BOQ Builder owner/engine/routes: \`scripts/build-sw-boq-builder-parity.js\`, \`scripts/lib/sw-boq-builder-contract.js\`, \`assets/js/engines/boq-builder-engine.js\`, \`tools/boq-builder/app.html\`, and \`sw/zana/orodha-vifaa/index.html\`.
- Structural screening owner/engine/routes: \`scripts/build-sw-structural-screening-parity.js\`, \`scripts/lib/sw-structural-screening-contract.js\`, \`assets/js/engines/structural-screening-engine.js\`, \`assets/js/pages/sw-structural-screening-parity.js\`, \`tools/structural-calc/index.html\`, and \`sw/zana/kikokotoo-miundo-ya-ujenzi/index.html\`.
- Electrical load owner/engine/routes: \`scripts/build-sw-electrical-load-parity.js\`, \`scripts/lib/sw-electrical-load-contract.js\`, \`assets/js/engines/electrical-load-engine.js\`, \`assets/js/pages/sw-electrical-load-parity.js\`, \`tools/electrical-load/index.html\`, and \`sw/zana/kikokotoo-mzigo-wa-umeme/index.html\`.
- Paint owner/engine/routes: \`scripts/build-sw-paint-parity.js\`, \`scripts/lib/sw-paint-contract.js\`, \`assets/js/engines/engineering-materials-engine.js\`, \`assets/js/pages/sw-paint-parity.js\`, \`tools/paint-calculator/index.html\`, and \`sw/zana/kikokotoo-rangi/index.html\`.
- Roof owner/engine/routes: \`scripts/build-sw-roof-parity.js\`, \`scripts/lib/sw-roof-contract.js\`, \`assets/js/engines/engineering-materials-engine.js\`, \`assets/js/pages/sw-roof-parity.js\`, \`tools/roof-calculator/index.html\`, and \`sw/zana/vifaa-vya-paa/index.html\`.
- Transport cost engine/manifest/runtimes: \`assets/js/engines/transport-cost-engine.js\`, \`scripts/lib/sw-transport-cost-contract.js\`, \`assets/js/pages/sw-transport-cost-parity.js\`, \`assets/js/pages/sw-vehicle-operating-cost-parity.js\`, and \`assets/js/pages/sw-truck-load-parity.js\`.
- Truck-load generator/style/routes: \`scripts/build-sw-truck-load-parity.js\`, \`assets/css/sw-truck-load-parity.css\`, \`sw/zana/kupakia-lori/index.html\`, and the English source route \`tools/truck-load/index.html\`.
- Proof owners: this receipt, the candidate Playwright config/spec, focused static tests and missing-artwork receipt.
- The requested \`.claude/rules/i18n.md\` reference is absent in this checkout; the coordinator explicitly declared that absence non-blocking. The repository Swahili strategy and coordinator skill governed the work.

## Verification commands

- \`node scripts/build-sw-energy-remaining-parity.js\`
- \`node --test tests/swahili-energy-remaining-static.test.js tests/swahili-transport-static-candidate.test.js\`
- \`node --test tests/swahili-engineering-materials-parity.test.js\`
- \`npx playwright test -c playwright.sw-engineering-materials.config.js --workers=1\`
- \`node --test tests/swahili-solar-calculator-parity.test.js\`
- \`npx playwright test -c playwright.sw-solar-calculator.config.js --workers=1\`
- \`node --test tests/swahili-building-cost-parity.test.js\`
- \`npx playwright test -c playwright.sw-building-cost.config.js --workers=1\`
- \`node --test tests/swahili-boq-builder-parity.test.js\`
- \`npx playwright test -c playwright.sw-boq-builder.config.js --workers=1\`
- \`node --test tests/swahili-structural-screening-parity.test.js\`
- \`npx playwright test -c playwright.sw-structural-screening.config.js --workers=1\`
- \`node --test tests/swahili-electrical-load-parity.test.js\`
- \`npx playwright test -c playwright.sw-electrical-load.config.js --workers=1\`
- \`node --test tests/swahili-paint-parity.test.js\`
- \`npx playwright test -c playwright.sw-paint.config.js --workers=1\`
- \`node --test tests/swahili-roof-parity.test.js\`
- \`npx playwright test -c playwright.sw-roof.config.js --workers=1\`
- \`node scripts/build-sw-vehicle-operating-cost-parity.js\`
- \`node scripts/build-sw-truck-load-parity.js\`
- \`node --test tests/swahili-transport-cost-parity.test.js\`
- \`npx playwright test -c playwright.sw-transport-cost.config.js --workers=1\`
- \`npx playwright test -c playwright.sw-engineering-energy-transport.config.js --workers=1\`
- \`npm run build:i18n:validate\`
- \`npm run validate:hreflang\`
- \`npm run check-links\`
- \`npm run audit\`
- \`npm run lint\`
- \`npm run type-check\`
- \`npm run test:privacy-ai-consent\`
- \`npm run solar-roi:data:check\`
- \`npm run fuel:sources:check\`
- \`npm run transport:sources:check\`
- \`git diff --check\`
- \`git diff --diff-filter=D --summary\`

## Carried baseline debt

- \`npm run build:i18n:validate\` exits 1 because coordinator-owned generated localization artifacts are already stale: \`data/registry/locale-page-coverage.json\`, \`reports/localization-coverage.json\`, and \`reports/localization-coverage.md\`. This lane did not regenerate or edit them. The underlying localization checks pass, and standalone \`npm run validate:hreflang\` passes 33,412 relationships across 5,351 groups.
- \`npm run audit\` exits 0 and reports two carried missing registry pages outside this lane: \`job-offer-evaluator\` and \`zana-tathmini-ya-ofa-ya-kazi-sw-wave8\`.
- \`npm ci\` reports 14 dependency advisories (6 moderate, 8 high); no dependency manifest or lockfile was changed.

No PR, merge, deployment, live service mutation, sitemap generation, redirect generation or coordinator-owned acceptance/AI/coverage edit is part of this lane.
`;

function writeOrCheck(file, content) {
  const full = path.join(ROOT, file);
  if (process.argv.includes("--write")) fs.writeFileSync(full, content);
  else if (!fs.existsSync(full) || fs.readFileSync(full, "utf8") !== content) throw new Error(`${file} is stale; run with --write.`);
}

writeOrCheck(OUT_JSON, `${JSON.stringify(receipt, null, 2)}\n`);
writeOrCheck(OUT_ART, `${JSON.stringify(artworkReceipt, null, 2)}\n`);
writeOrCheck(OUT_MD, md);
console.log(`checked exact 55 rows: ${accepted.length} accepted candidates, ${blocked.length} blocked, ${missingArtwork.length} missing artwork`);
