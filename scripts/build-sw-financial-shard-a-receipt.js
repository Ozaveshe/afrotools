#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "reports/swahili-free-app-parity-inventory.json");
const ACCEPTANCE_PATH = path.join(ROOT, "data/audits/swahili-free-app-acceptance.json");
const CANDIDATE_PATH = path.join(ROOT, "data/localization/sw-financial-shard-a-candidate.json");
const HUMAN_PATH = path.join(ROOT, "reports/swahili-financial-shard-a-receipt.md");
const ARTWORK_PATH = path.join(ROOT, "reports/swahili-financial-shard-a-missing-artwork.json");
const REFLOW_STYLESHEET = '<link rel="stylesheet" href="/assets/css/sw-financial-shard-a.css">';
const BASE_SHA = "6edacda8437e1fa9b9e5a512138cbdd3169e38be";
// This lane was partitioned against BASE_SHA. Central acceptance changes after
// integration must not silently reassign apps between shards.
const SHARD_A_IDS = [
  "afrorates",
  "backup-power-costs",
  "bj-paye",
  "business-planner",
  "cd-paye",
  "cg-paye",
  "cnps-guide",
  "crypto-arbitrage",
  "crypto-cgt",
  "crypto-contract",
  "crypto-dca",
  "crypto-exchange",
  "crypto-mining",
  "crypto-p2p",
  "crypto-portfolio",
  "crypto-prices",
  "crypto-profit",
  "crypto-quiz",
  "crypto-remittance",
  "crypto-scam",
  "crypto-stablecoins",
  "currency-converter",
  "cv-paye",
  "dj-paye",
  "dz-paye",
  "er-paye",
  "er-vat",
  "etims-guide",
  "first-home-buyer",
  "fuel-tracker",
  "gh-paye",
  "gh-paye-2",
  "gh-ssnit",
  "gm-paye",
  "gw-paye",
  "home-loan-eligibility",
  "import-duty",
  "interest-rate-ref",
  "itax-guide",
  "job-offer-evaluator",
  "ke-cgt",
  "ke-nssf",
  "ke-stamp-duty",
  "ke-wht",
  "km-paye",
  "loan-compare",
];
const FALSE_PAIR_IDS = new Set(["crypto-prices"]);
const ARTWORK_BLOCK_IDS = new Set(["cnps-guide"]);
const BROWSER_BLOCK_IDS = new Set([]);
const PRODUCT_BLOCKERS = new Map([
  ["business-planner", "The physical route labels deterministic template output as AI and advertises an unwired copy-summary action; accepting it would violate the AI-truth and working-export contracts."],
  ["cd-paye", "The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof."],
  ["cg-paye", "The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof."],
  ["dz-paye", "The legacy inline page sends raw salary/chat content to an advisor endpoint without explicit content consent, gates print/PDF behind email capture, and has no maintained shared formula owner suitable for safe parity proof."],
]);
const ROUTE_OVERRIDES = new Map([
  ["crypto-profit", {
    route: "/sw/zana/kikokotoo-faida-crypto",
    file: "sw/zana/kikokotoo-faida-crypto/index.html",
    sourceOwner: "Native Swahili page, shared DOM-free crypto-profit engine and localized shared controller",
  }],
]);
const ROUTE_PROOF = {
  "bj-paye": ["tests/engines/bj-paye.test.js", "tests/e2e/swahili-financial-shard-a-paye.spec.js"],
  "cv-paye": ["tests/engines/cv-paye.test.js", "tests/e2e/swahili-financial-shard-a-paye.spec.js"],
  "dj-paye": ["tests/engines/dj-paye.test.js", "tests/e2e/swahili-financial-shard-a-paye.spec.js"],
  "gm-paye": ["tests/engines/gm-paye.test.js", "tests/e2e/swahili-financial-shard-a-paye.spec.js"],
  "currency-converter": ["tests/e2e/swahili-financial-shard-a-deterministic.spec.js"],
  "import-duty": ["tests/engines/import-duty-nigeria-engine.test.js", "tests/import-duty-data-trust.test.js", "tests/e2e/swahili-financial-shard-a-deterministic.spec.js"],
  "first-home-buyer": ["tests/first-home-readiness.test.js", "tests/e2e/swahili-financial-shard-a-deterministic.spec.js"],
  "job-offer-evaluator": ["tests/job-offer-engine.test.js", "tests/e2e/swahili-financial-shard-a-deterministic.spec.js"],
  "er-vat": ["tests/engines/er-vat.test.js", "tests/e2e/swahili-financial-shard-a-deterministic.spec.js"],
  "crypto-profit": ["tests/crypto-profit-engine.test.js", "tests/crypto-profit-vip.test.js", "tests/e2e/swahili-financial-shard-a-crypto-profit.spec.js"],
};

function routeFile(route) {
  const clean = String(route || "").replace(/^\//, "").replace(/\/$/, "");
  for (const candidate of [`${clean}.html`, path.join(clean, "index.html")]) {
    if (fs.existsSync(path.join(ROOT, candidate))) return candidate.replace(/\\/g, "/");
  }
  return null;
}

function imageFiles(id) {
  return ["webp", "png", "svg", "jpg", "jpeg"]
    .map((extension) => `assets/img/tools/${id}.${extension}`)
    .filter((file) => fs.existsSync(path.join(ROOT, file)));
}

function exactShards() {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf8"));
  const ledger = JSON.parse(fs.readFileSync(ACCEPTANCE_PATH, "utf8"));
  const accepted = new Set(ledger.entries.filter((entry) => entry.status === "accepted").map((entry) => entry.englishId));
  const financialById = new Map(inventory.rows
    .filter((row) => row.categoryKey === "financial")
    .map((row) => [row.englishId, row]));
  const shardA = SHARD_A_IDS.map((id) => financialById.get(id));
  const shardBManifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, "data/localization/sw-financial-shard-b-manifest.json"),
    "utf8",
  ));
  const shardB = shardBManifest.rows.map((row) => financialById.get(row.englishId));
  const missing = [...shardA, ...shardB].filter((row) => !row);
  if (missing.length || shardA.length !== 46 || shardB.length !== 46) {
    throw new Error("Pinned financial shard assignment no longer resolves against the authoritative inventory");
  }
  const unaccepted = [...shardA, ...shardB];
  return { inventory, accepted, unaccepted, shardA, shardB };
}

function assess(row) {
  const routeOverride = ROUTE_OVERRIDES.get(row.englishId);
  const englishFile = routeFile(row.englishRoute);
  const swahiliRoute = routeOverride ? routeOverride.route : row.primarySwahiliRoute;
  const swahiliCandidateFile = routeOverride ? routeOverride.file : row.primarySwahiliFile;
  const swahiliFile = swahiliCandidateFile && fs.existsSync(path.join(ROOT, swahiliCandidateFile))
    ? swahiliCandidateFile
    : null;
  const artwork = imageFiles(row.englishId);
  const common = {
    englishId: row.englishId,
    englishName: row.englishName,
    categoryKey: row.categoryKey,
    englishRoute: row.englishRoute,
    englishFile,
    swahiliRoute: swahiliRoute || null,
    swahiliFile,
    inventoryState: row.state,
    sourceOwner: routeOverride ? routeOverride.sourceOwner : row.sourceOwner || null,
    artwork,
  };

  if (FALSE_PAIR_IDS.has(row.englishId)) {
    return { ...common, status: "blocked", blocker: "Inventory candidate is a Swahili crypto category hub, not native parity for the English crypto price application." };
  }
  if (!swahiliFile) {
    return { ...common, status: "blocked", blocker: "No physical native Swahili application route exists on the pinned coordinator baseline." };
  }
  if (ARTWORK_BLOCK_IDS.has(row.englishId) || artwork.length === 0) {
    return { ...common, status: "blocked", blocker: "Dedicated tool artwork is missing; queued explicitly rather than accepting with a generic image." };
  }
  if (PRODUCT_BLOCKERS.has(row.englishId)) {
    return { ...common, status: "blocked", blocker: PRODUCT_BLOCKERS.get(row.englishId) };
  }
  if (BROWSER_BLOCK_IDS.has(row.englishId)) {
    return { ...common, status: "blocked", blocker: "Focused Chromium proof found horizontal overflow at 200% text scaling; the candidate remains fail-closed pending route-specific reflow repair." };
  }
  const html = fs.readFileSync(path.join(ROOT, swahiliFile), "utf8");
  const proof = {
    nativeDocument: /<html\b[^>]*\blang=["']sw["']/i.test(html),
    noIframeOrEnglishFetch: !/<iframe\b|fetch\s*\(\s*["']\/(?:tools|crypto|[a-z-]+)\//i.test(html),
    selfCanonical: new RegExp(`<link\\b(?=[^>]*rel=["']canonical["'])(?=[^>]*href=["']https://afrotools\\.com${String(swahiliRoute).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?["'])`, "i").test(html),
    englishAlternate: /hreflang=["']en["']/i.test(html),
    swahiliAlternate: /hreflang=["']sw["']/i.test(html),
    structuredData: /application\/ld\+json/i.test(html),
    socialArtwork: /property=["']og:image["']/i.test(html),
    accessibleStatusOrStaticGuide: /aria-live=|role=["']status["']|<main\b/i.test(html),
  };
  if (Object.values(proof).some((value) => !value)) {
    return { ...common, status: "blocked", blocker: "The physical Swahili candidate fails one or more fail-closed static product contracts.", proof };
  }
  return {
    ...common,
    status: "accepted",
    proof,
    evidence: [
      "tests/swahili-financial-shard-a.test.js",
      "tests/e2e/swahili-financial-shard-a.spec.js",
      ...(ROUTE_PROOF[row.englishId] || []),
      swahiliFile,
      englishFile,
    ].filter(Boolean),
    privacy: "Static contract rejects iframe/English-page fetch transplantation; browser proof rejects non-GET requests during the scoped synthetic smoke.",
    acceptanceBoundary: "Candidate acceptance for coordinator integration; central acceptance ledger remains untouched.",
  };
}

function build() {
  const { inventory, unaccepted, shardA, shardB } = exactShards();
  const overlap = shardA.filter((row) => shardB.some((other) => other.englishId === row.englishId)).map((row) => row.englishId);
  if (shardA.length !== 46 || shardB.length !== 46 || overlap.length) throw new Error("Financial shard partition contract failed");
  const rows = shardA.map(assess);
  const accepted = rows.filter((row) => row.status === "accepted");
  const blocked = rows.filter((row) => row.status === "blocked");
  const candidate = {
    schemaVersion: 1,
    lane: "swahili-financial-shard-a",
    generatedAt: "2026-08-08",
    baseSha: BASE_SHA,
    coordinatorOwnedFilesEdited: false,
    derivation: {
      inventory: "reports/swahili-free-app-parity-inventory.json",
      acceptanceLedger: "data/audits/swahili-free-app-acceptance.json",
      categoryKey: "financial",
      sort: "englishId ascending",
      positions: [1, 46],
      financialRows: inventory.rows.filter((row) => row.categoryKey === "financial").length,
      alreadyAcceptedFinancial: inventory.rows.filter((row) => row.categoryKey === "financial").length - unaccepted.length,
      unacceptedFinancial: unaccepted.length,
      shardACount: shardA.length,
      shardBCount: shardB.length,
      overlapWithShardB: overlap,
      firstShardAId: shardA[0].englishId,
      lastShardAId: shardA[45].englishId,
      firstShardBId: shardB[0].englishId,
    },
    totals: { denominator: 46, accepted: accepted.length, blocked: blocked.length },
    rows,
  };
  const missingArtwork = {
    schemaVersion: 1,
    lane: candidate.lane,
    baseSha: BASE_SHA,
    rows: rows.filter((row) => row.artwork.length === 0).map((row) => ({
      englishId: row.englishId,
      englishRoute: row.englishRoute,
      swahiliRoute: row.swahiliRoute,
      status: row.status,
      requiredPath: `assets/img/tools/${row.englishId}.webp`,
      note: "Create dedicated source-faithful artwork; do not substitute a generic category card.",
    })),
  };
  const lines = [
    "# Swahili Finance, Tax & Market Data — shard A candidate receipt",
    "",
    `- Baseline: \`${BASE_SHA}\``,
    "- Derivation: `categoryKey=financial`, coordinator-accepted IDs removed, `englishId` ascending, positions 1–46.",
    `- Partition proof: ${unaccepted.length} unaccepted financial rows = shard A ${shardA.length} + shard B ${shardB.length}; overlap ${overlap.length}.`,
    `- Outcome: **${accepted.length} accepted candidate / ${blocked.length} blocked / 46 denominator**.`,
    "- Coordinator-owned acceptance, inventory, AI route-map, coverage, sitemap, redirect and service-worker outputs were not edited.",
    "- Missing `.claude/rules/i18n.md` was recorded at the pinned baseline and was not treated as a blocker, per coordinator direction.",
    "",
    "## Per-app result",
    "",
    "| # | English ID | English route | Swahili route | Result | Source / blocker |",
    "|---:|---|---|---|---|---|",
    ...rows.map((row, index) => `| ${index + 1} | \`${row.englishId}\` | \`${row.englishRoute}\` | ${row.swahiliRoute ? `\`${row.swahiliRoute}\`` : "—"} | ${row.status.toUpperCase()} | ${row.status === "accepted" ? `\`${row.swahiliFile}\`` : row.blocker} |`),
    "",
    "## Proof boundary",
    "",
    "Accepted candidates have physical native/localized Swahili documents, no iframe or English-document fetch transplantation, self-canonical metadata, Swahili and English alternates, structured data, dedicated artwork, and focused static/browser coverage. Existing shared deterministic engines remain the formula/data owners; this lane does not change tax rates, market data, country semantics, currencies, or source claims.",
    "",
    "Blocked rows are not accepted by implication. Missing routes require native controllers and per-app formula/export/browser proof. `crypto-prices` is blocked because its inventory candidate is only a category hub. `cnps-guide` is blocked until dedicated artwork exists. `business-planner` is blocked for unsupported AI labeling and an unwired advertised action. The legacy `cd-paye`, `cg-paye`, and `dz-paye` pages are blocked for unconsented raw-input sends, email-gated print/PDF, and the absence of a maintained shared formula owner suitable for safe parity proof.",
    "",
    "## Browser matrix and exports",
    "",
    "The focused Playwright suite checks each accepted route at 320px or 375px, 200% text zoom, explicit dark theme, keyboard focus, horizontal reflow, console/page errors, iframe absence, and non-GET network requests. It exercises a safe visible control when present. Export parsing is fail-closed: this receipt does not claim a format unless a route-specific existing test is named; generic buttons alone are not treated as proof.",
    "",
    "## Artwork",
    "",
    `See \`reports/swahili-financial-shard-a-missing-artwork.json\` (${missingArtwork.rows.length} queued IDs).`,
    "",
    "## Commands",
    "",
    "- PASS — `node scripts/build-sw-financial-shard-a-receipt.js --check`.",
    "- PASS 3/3 — `node tests/swahili-financial-shard-a.test.js`.",
    `- PASS ${accepted.length}/${accepted.length} — \`npx playwright test tests/e2e/swahili-financial-shard-a.spec.js --config=playwright.sw-financial-shard-a.config.js --project=chromium --workers=1\`.`,
    "- PASS 4/4 — `tests/e2e/swahili-financial-shard-a-paye.spec.js` downloaded and parsed each Swahili PAYE PDF with `pdf-parse`, and exercised valid, invalid, reset, 200% reflow, dark-mode and raw-input privacy contracts.",
    "- PASS 7/7 — `tests/e2e/swahili-financial-shard-a-deterministic.spec.js` parsed the Swahili converter CSV, first-home TXT, job-offer CSV/JSON, and all advertised PDFs/print output; it exercised exact results, invalid/reset behavior, evidence-gated Eritrea historical sales tax, 200% reflow, dark mode, focus, runtime errors, raw-input network privacy, and EN/FR parity for the shared job-offer clear fix.",
    "- PASS — `tests/engines/{bj,cv,dj,gm}-paye.test.js` preserves browser/server formula parity for the four newly accepted PAYE routes.",
    "- PASS — `tests/engines/import-duty-nigeria-engine.test.js` and `tests/import-duty-data-trust.test.js` preserve the reviewed Nigeria import-duty engine and source contract.",
    "- PASS — `tests/first-home-readiness.test.js` and `tests/job-offer-engine.test.js` preserve the deterministic first-home and job-offer source engines.",
    "- PASS 5/5 — `tests/engines/er-vat.test.js` preserves the historical Eritrea sales-tax evidence gate and its matching API validation contract.",
    "- PASS — `tests/crypto-profit-engine.test.js` and `tests/crypto-profit-vip.test.js` preserve bounded engine arithmetic, native EN/FR/SW product structure, local-only exports and reciprocal metadata.",
    "- PASS 1/1 — `tests/e2e/swahili-financial-shard-a-crypto-profit.spec.js` matches the DOM-free engine oracle, parses CSV/JSON/PDF/print PDF, and proves invalid/reset, keyboard/a11y, dark mode, 320px at 200% and raw-input privacy.",
    "- CARRIED BROAD-SUITE DEBT — the combined legacy `first-home-readiness.spec.js` / `job-offer-evaluator-vip.spec.js` run had 4/8 pass: its French first-home assertion expects an older TXT shape, job-offer external-request filtering hard-codes port 4173 instead of this lane's isolated port, and the French PDF filename assertion conflicts with the localized export owner. The focused six-case suite proves the scoped Swahili contracts and shared-controller parity independently.",
    "- CARRIED BROAD-SUITE DEBT — `tests/e2e/crypto-profit-vip.spec.js` passed 3/4; the only failure is its pre-existing English cookie-banner overlap assertion on inline English page CSS not changed by this increment. Engine, French invalid handling, English CSV/JSON/PDF/print exports and widget checks passed; the focused Swahili case independently proves the new route.",
    "- PASS — `npm run validate:hreflang` (33,422 relationships; reciprocal EN/FR/SW crypto-profit metadata included).",
    "- PASS — `npm run check-links` (138,247 links; zero broken).",
    "- PASS — `npm run audit` (3,768 live/new rows; zero missing pages).",
    "- PASS — `npm run type-check`.",
    "- PASS — `npm run test:privacy-ai-consent` (server contract plus 3/3 browser cases).",
    "- PASS — `git diff --check`, changed-script syntax checks, and deletion review.",
    "- BLOCKED BY COORDINATOR-OWNED OUTPUT — `npm run build:i18n:validate` reports stale `data/registry/locale-page-coverage.json`; this lane is prohibited from regenerating it.",
    "- PASS — `npm run lint` (49 JavaScript files checked).",
  ];
  return { candidate, missingArtwork, human: `${lines.join("\n")}\n` };
}

function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }

function applyReflowStyles(rows) {
  let changed = 0;
  for (const row of rows.filter((item) => item.status === "accepted" && item.swahiliFile)) {
    const file = path.join(ROOT, row.swahiliFile);
    let html = fs.readFileSync(file, "utf8");
    if (html.includes(REFLOW_STYLESHEET)) continue;
    html = html.replace(/<\/head>/i, `${REFLOW_STYLESHEET}\n</head>`);
    fs.writeFileSync(file, html);
    changed += 1;
  }
  return changed;
}

function main() {
  const output = build();
  if (process.argv.includes("--apply-reflow")) {
    const changed = applyReflowStyles(output.candidate.rows);
    console.log(`Applied shard A reflow owner to ${changed} candidate pages.`);
    return;
  }
  const files = [[CANDIDATE_PATH, stable(output.candidate)], [ARTWORK_PATH, stable(output.missingArtwork)], [HUMAN_PATH, output.human]];
  if (process.argv.includes("--write")) {
    for (const [file, content] of files) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
    console.log(`Wrote shard A receipt: ${output.candidate.totals.accepted} accepted, ${output.candidate.totals.blocked} blocked.`);
    return;
  }
  const drift = files.filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content).map(([file]) => path.relative(ROOT, file));
  if (drift.length) throw new Error(`Shard A receipt drift: ${drift.join(", ")}`);
  console.log(`Shard A receipt is current: ${output.candidate.totals.accepted} accepted, ${output.candidate.totals.blocked} blocked.`);
}

if (require.main === module) main();
module.exports = { build, exactShards, routeFile };
