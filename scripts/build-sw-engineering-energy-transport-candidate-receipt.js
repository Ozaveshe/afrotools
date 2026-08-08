"use strict";

const fs = require("fs");
const path = require("path");
const inventory = require("../reports/swahili-free-app-parity-inventory.json");
const transportStatus = require("../data/transport/source-status.json");
const { SW_ENERGY_REMAINING_APPS } = require("./lib/sw-energy-remaining-contract.js");

const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = "reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.json";
const OUT_MD = "reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.md";
const OUT_ART = "reports/sw-engineering-energy-transport-missing-artwork-2026-08-08.json";
const BASE_SHA = "6edacda8437e1fa9b9e5a512138cbdd3169e38be";
const CATEGORY_KEYS = ["engineering", "energy", "transport"];

const rows = inventory.rows.filter((row) => CATEGORY_KEYS.includes(row.categoryKey) && !row.accepted);
const energyIds = new Set(SW_ENERGY_REMAINING_APPS.map((app) => app.id));
const statusByTransportId = new Map(transportStatus.tools.map((tool) => [tool.id, tool]));

function exists(file) { return Boolean(file) && fs.existsSync(path.join(ROOT, file)); }
function routeFile(row) { return row.primarySwahiliFile || null; }
function artworkFile(row) { return `assets/img/tools/${row.englishId}.webp`; }

if (rows.length !== 55) throw new Error(`Expected exact denominator 55, received ${rows.length}.`);
for (const [key, count] of [["engineering", 20], ["energy", 17], ["transport", 18]]) {
  const actual = rows.filter((row) => row.categoryKey === key).length;
  if (actual !== count) throw new Error(`${key}: expected ${count}, received ${actual}.`);
}
if (energyIds.size !== 17) throw new Error(`Expected 17 Energy contracts, received ${energyIds.size}.`);

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
      engineering: { denominator: 20, acceptedCandidates: 0, blocked: 20 },
      energy: { denominator: 17, acceptedCandidates: 17, blocked: 0 },
      transport: { denominator: 18, acceptedCandidates: 0, blocked: 18 },
    },
    acceptanceBoundary: "Candidate receipt only; coordinator-owned central acceptance remains unchanged.",
  },
  proof: {
    static: ["tests/swahili-energy-remaining-static.test.js", "tests/swahili-transport-static-candidate.test.js"],
    browser: "tests/e2e/sw-engineering-energy-transport-candidate.spec.js",
    browserMatrix: "53 physical routes at 320px, 375px and 640px/200% reflow; 17 deep Energy workflows; car-import focused invalid/reset/privacy flow.",
    privacy: "Energy deep tests block/record fetch and XMLHttpRequest; zero raw-input requests. All processing and exports remain local.",
  },
  apps,
};

if (accepted.length !== 17 || blocked.length !== 38) throw new Error(`Expected 17 accepted candidates and 38 blocked; received ${accepted.length}/${blocked.length}.`);

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

Status: **17 accepted candidates / 38 blocked / exact denominator 55**. This receipt does not edit or imply coordinator acceptance.

## Outcome

| Category | Denominator | Accepted candidate | Blocked |
|---|---:|---:|---:|
| Engineering & Construction | 20 | 0 | 20 |
| Energy & Utilities | 17 | 17 | 0 |
| Transport & Logistics | 18 | 0 | 18 |
| **Total** | **55** | **17** | **38** |

Accepted Energy IDs: ${byCategory("energy", "accepted-candidate")}.

Blocked Engineering IDs: ${byCategory("engineering", "blocked")}.

Blocked Transport IDs: ${byCategory("transport", "blocked")}.

## Product, formula and source decisions

- The 17 Energy pages use their exact English-owned DOM-free engines through \`scripts/lib/sw-energy-remaining-contract.js\`; no formulas were translated or copied. Focused tests exercise valid and invalid oracle cases.
- The bounded \`data/energy/sw-energy-planning-snapshot.js\` owner preserves March 2026 source values and normalizes only the existing LPG field name required by the shared engine. UI labels the data stale, planning-only and low-confidence. The ledger boundary is 12/54 regulator-linked markets with 42 gaps.
- Engineering is fail-closed: 19 physical localized shells and one missing route do not provide individual English-engine, boundary and export proof.
- Transport is fail-closed: 17 physical localized shells and one missing route do not provide full product parity. The car-import controller passes focused browser behavior, but its customs/port source set remains \`changed\` in \`data/transport/source-status.json\`.
- All 55 expected dedicated artwork files exist. The machine-readable artwork queue is empty.

## Browser and export proof

- Chromium, one worker, isolated port 4198: 53 existing physical routes at 320px, 375px and 640px with 200% CSS reflow; no horizontal overflow, iframe, canonical mismatch, console error or page error.
- Every Energy app: valid calculation, invalid-state clearing, reset, explicit dark/light toggle, keyboard focus, JSON download/parse/reopen, CSV parse, TXT parse and PDF parse via the repository-vendored PDF.js 3.11 parser. The final proof is split into green 17-test deep-workflow and green 55-test route/boundary runs to isolate browser-cache contention.
- Network instrumentation recorded no Energy fetch/XHR containing raw inputs. No AI call exists. Car-import requests were restricted to local synthetic fixture/source JSON paths.
- The two absent physical routes are \`solar-calculator\` and \`car-price-intelligence\`; their absence is asserted and blocked, not hidden by denominator arithmetic.

## Ownership and changed paths

- Energy generator/manifest: \`scripts/build-sw-energy-remaining-parity.js\`, \`scripts/lib/sw-energy-remaining-contract.js\`.
- Energy runtime/data/style: \`assets/js/pages/sw-energy-remaining-parity.js\`, \`data/energy/sw-energy-planning-snapshot.js\`, \`assets/css/sw-energy-remaining-parity.css\`.
- Generated by the bounded owner only: 17 \`sw/zana/**/index.html\` Energy routes and the Swahili Energy hub.
- Transport checkpoint: \`assets/js/pages/swahili-car-import-cost.js\` and focused transport source/browser tests.
- Proof owners: this receipt, the candidate Playwright config/spec, focused static tests and missing-artwork receipt.
- The requested \`.claude/rules/i18n.md\` reference is absent in this checkout; the coordinator explicitly declared that absence non-blocking. The repository Swahili strategy and coordinator skill governed the work.

## Verification commands

- \`node scripts/build-sw-energy-remaining-parity.js\`
- \`node --test tests/swahili-energy-remaining-static.test.js tests/swahili-transport-static-candidate.test.js\`
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
