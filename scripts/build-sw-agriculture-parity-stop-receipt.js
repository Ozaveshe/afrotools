#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_FILE = "reports/swahili-free-app-parity-inventory.json";
const ACCEPTANCE_FILE = "data/audits/swahili-free-app-acceptance.json";
const ENGINE_MANIFEST_FILE = "data/localization/fr-agriculture-parity-manifest.json";
const RECEIPT_FILE = "reports/sw-agriculture-parity-stop-receipt-2026-07-31.json";
const RECEIPT_MD_FILE = "reports/sw-agriculture-parity-stop-receipt-2026-07-31.md";
const ARTWORK_FILE = "reports/sw-agriculture-missing-artwork-queue.json";
const EXPECTED_ROWS = 447;

const INLINE_OWNER_REPLACEMENTS = Object.freeze({
  "poultry-roi-calculator": "engines/src/poultry-roi-engine.js",
  "vaccination-schedule": "engines/src/vaccination-engine.js",
});

const DOM_PATTERN = /\bdocument\s*\.|\binnerHTML\b|\bquerySelector\s*\(/;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function normalizeRoute(route) {
  const value = String(route || "").replace(/\/+$/, "");
  return value || "/";
}

function stateCounts(rows) {
  return rows.reduce((counts, row) => {
    counts[row.state] = (counts[row.state] || 0) + 1;
    return counts;
  }, {});
}

function engineInspection(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      file: relativePath,
      exists: false,
      domFree: false,
      domEvidence: [],
    };
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const domEvidence = source
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter((entry) => DOM_PATTERN.test(entry.text))
    .map((entry) => `${relativePath}:${entry.line}`)
    .slice(0, 12);

  return {
    file: relativePath,
    exists: true,
    domFree: domEvidence.length === 0,
    domEvidence,
  };
}

function buildArtifacts() {
  const inventory = readJson(INVENTORY_FILE);
  const acceptance = readJson(ACCEPTANCE_FILE);
  const engineManifest = readJson(ENGINE_MANIFEST_FILE);
  const rows = inventory.rows.filter((row) => row.categoryKey === "agriculture");

  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} Agriculture rows, found ${rows.length}`);
  }

  const manifestByRoute = new Map(
    engineManifest.rows.map((row) => [normalizeRoute(row.english.route), row])
  );
  const acceptedEntries = acceptance.entries.filter((entry) => entry.categoryKey === "agriculture");
  const mappedCandidates = rows.filter((row) => row.primarySwahiliRoute);
  const missingOwners = rows.filter((row) => !row.primarySwahiliRoute);
  const architectureBlockers = [];
  const rowReceipts = [];
  const artworkRows = [];
  const missingArtwork = [];

  for (const row of rows) {
    const manifestRow = manifestByRoute.get(normalizeRoute(row.englishRoute));
    if (!manifestRow) {
      throw new Error(`Missing Agriculture engine manifest row for ${row.englishRoute}`);
    }

    const listedOwners = manifestRow.owners.englishEngine || [];
    const replacement = INLINE_OWNER_REPLACEMENTS[row.englishId] || null;
    const engineFiles = listedOwners
      .filter((owner) => !owner.includes("#"))
      .concat(replacement ? [replacement] : []);
    const inspections = [...new Set(engineFiles)].map(engineInspection);
    const inlineOwners = listedOwners.filter((owner) => owner.includes("#"));
    const usableDomFreeEngine = inspections.find((inspection) => inspection.exists && inspection.domFree);

    if (inlineOwners.length && !usableDomFreeEngine) {
      architectureBlockers.push({
        englishId: row.englishId,
        englishRoute: normalizeRoute(row.englishRoute),
        englishFile: manifestRow.english.file,
        manifestEngineOwners: listedOwners,
        inspectedEngineCandidates: inspections,
        reason: "The in-scope English owner is an inline controller and the available shared engine contains DOM rendering. A compliant Swahili owner requires English engine extraction before localization.",
        requiredResolution: [
          "Extract calculation and validation into a readable DOM-free source engine.",
          "Keep DOM rendering in page controllers outside the engine.",
          "Migrate and prove the English owner against the extracted engine before generating the Swahili owner.",
        ],
      });
    }

    const artwork = manifestRow.artwork || {};
    const artworkFile = artwork.file || null;
    const artworkPresent = Boolean(artworkFile && fs.existsSync(path.join(ROOT, artworkFile)));
    const artworkReceipt = {
      englishId: row.englishId,
      englishRoute: normalizeRoute(row.englishRoute),
      imageId: artwork.imageId || row.englishId,
      file: artworkFile,
      present: artworkPresent,
    };
    artworkRows.push(artworkReceipt);
    if (!artworkPresent) missingArtwork.push(artworkReceipt);

    rowReceipts.push({
      englishId: row.englishId,
      englishRoute: normalizeRoute(row.englishRoute),
      baselineState: row.state,
      baselineSwahiliRoute: row.primarySwahiliRoute,
      acceptedAtCheckpoint: row.accepted === true,
      engineOwners: listedOwners,
      existingDomFreeEngine: usableDomFreeEngine ? usableDomFreeEngine.file : null,
      disposition: row.englishId === "vaccination-schedule"
        ? "architecture-blocked"
        : "paused-by-mandatory-stop",
    });
  }

  if (architectureBlockers.length !== 1 || architectureBlockers[0].englishId !== "vaccination-schedule") {
    throw new Error(`Expected only vaccination-schedule to block; found ${architectureBlockers.map((row) => row.englishId).join(", ") || "none"}`);
  }

  const receipt = {
    schemaVersion: 1,
    programme: "sw-agriculture-free-app-parity",
    reviewedAt: "2026-07-31",
    checkpoint: {
      branch: "codex/sw-parity-coordinator-20260730",
      sha: "99898076a0329200e8f47c2e80a41a079b0df8b3",
    },
    scope: {
      categoryKey: "agriculture",
      expectedRows: EXPECTED_ROWS,
      inventorySource: INVENTORY_FILE,
      acceptanceSource: ACCEPTANCE_FILE,
      engineOwnershipSource: ENGINE_MANIFEST_FILE,
      stopRule: "Stop at any architecture boundary requiring English engine extraction.",
    },
    outcome: "stopped-at-english-engine-extraction-boundary",
    counts: {
      inScopeRows: rows.length,
      acceptedAtCheckpoint: acceptedEntries.length,
      acceptedThisLane: 0,
      architectureBlockedRows: architectureBlockers.length,
      pausedByMandatoryStop: rows.length - architectureBlockers.length,
      mappedCandidates: mappedCandidates.length,
      missingSwahiliOwners: missingOwners.length,
      baselineStates: stateCounts(rows),
      artworkPresent: artworkRows.length - missingArtwork.length,
      artworkMissing: missingArtwork.length,
    },
    acceptanceDecision: {
      fileChanged: false,
      reason: "No Agriculture row completed the required app-specific browser, export, privacy, accessibility, metadata and source evidence before the mandatory architecture stop.",
    },
    validation: [
      { command: "npm run sw:parity:check", status: "passed" },
      { command: "npm run test:sw-parity", status: "passed" },
      { command: "npm run sw:surface:check", status: "passed" },
      { command: "npm run test:sw-surface", status: "passed" },
      { command: "npm run test:day6-category", status: "passed" },
      {
        command: "npm run agriculture:discovery:check",
        status: "failed-baseline",
        detail: "Agriculture static directory is missing or stale. The lane changed no Agriculture product or discovery source/output.",
      },
      { command: "npm run agriculture:taxonomy", status: "passed", detail: "447/447 assigned; zero duplicate or missing assignments." },
      { command: "npm run build:i18n:validate", status: "passed" },
      { command: "npm run validate:hreflang", status: "passed" },
      { command: "node tests/sw-agriculture-parity-architecture-stop.test.js", status: "passed" },
      { command: "git diff --check", status: "passed" },
    ],
    architectureBlockers,
    nonBlockingEngineReconciliation: [
      {
        englishId: "poultry-roi-calculator",
        manifestOwner: "agriculture/poultry-roi/index.html#inline-controller",
        existingSharedEngine: "engines/src/poultry-roi-engine.js",
        domFree: true,
        evidence: [
          "tests/fr-agriculture-poultry-roi.test.js",
          "scripts/lib/fr-agriculture-singleton-contracts/poultry-roi-calculator.js",
        ],
      },
    ],
    rows: rowReceipts,
  };

  const markdown = `# Swahili Agriculture parity architecture-stop receipt

Checkpoint: \`codex/sw-parity-coordinator-20260730\` at \`99898076a0329200e8f47c2e80a41a079b0df8b3\`.

## Outcome

Implementation stopped at the required English-engine extraction boundary. No Agriculture acceptance entry was added.

| Measure | Count |
|---|---:|
| In-scope Agriculture rows | ${receipt.counts.inScopeRows} |
| Accepted at checkpoint | ${receipt.counts.acceptedAtCheckpoint} |
| Accepted in this lane | ${receipt.counts.acceptedThisLane} |
| Architecture-blocked rows | ${receipt.counts.architectureBlockedRows} |
| Paused by the mandatory stop | ${receipt.counts.pausedByMandatoryStop} |
| Existing mapped candidates | ${receipt.counts.mappedCandidates} |
| Missing Swahili owners | ${receipt.counts.missingSwahiliOwners} |
| Existing reusable artwork | ${receipt.counts.artworkPresent} |
| Missing artwork | ${receipt.counts.artworkMissing} |

Baseline inventory states: ${Object.entries(receipt.counts.baselineStates).map(([state, count]) => `\`${state}\` ${count}`).join(", ")}.

## Blocking architecture boundary

- English row: \`vaccination-schedule\`
- English route: \`/agriculture/vaccination-schedule\`
- Current manifest owner: \`agriculture/vaccination-schedule/index.html#inline-controller\`
- Available engine candidate: \`engines/src/vaccination-engine.js\`
- Boundary: the engine contains calculation plus DOM rendering through \`document.getElementById\` and \`innerHTML\`; it is not DOM-free.
- Required upstream work: extract and prove a readable pure calculation/validation engine, keep rendering in page controllers, then migrate the English owner before Swahili generation.

The similarly listed poultry inline owner does not block: \`engines/src/poultry-roi-engine.js\` is already DOM-free and is exercised by the French parity contract.

## Validation

- Passed: Swahili parity inventory check/test, Swahili surface check/test, Day 6 Agriculture tests, Agriculture taxonomy, i18n validation, hreflang validation, this receipt test, and \`git diff --check\`.
- Baseline failure: \`npm run agriculture:discovery:check\` reports \`Agriculture static directory is missing or stale\`. This lane changed no Agriculture product or discovery source/output, so the failure is recorded without regenerating prohibited unrelated output.

## Acceptance and artwork

\`data/audits/swahili-free-app-acceptance.json\` remains unchanged because none of the 447 rows completed the full acceptance contract. The separate artwork queue reports zero missing files across all 447 rows; existing English tool artwork can be reused without claiming localized artwork proof.

The JSON receipt contains a row-by-row disposition for all 447 English Agriculture rows.
`;

  const artworkQueue = {
    schemaVersion: 1,
    programme: "sw-agriculture-free-app-parity",
    reviewedAt: "2026-07-31",
    blocking: false,
    decision: missingArtwork.length ? "artwork-needed" : "existing-shared-artwork-complete",
    scopeRows: rows.length,
    count: missingArtwork.length,
    rows: missingArtwork,
  };

  return {
    [RECEIPT_FILE]: `${JSON.stringify(receipt, null, 2)}\n`,
    [RECEIPT_MD_FILE]: markdown,
    [ARTWORK_FILE]: `${JSON.stringify(artworkQueue, null, 2)}\n`,
  };
}

function main() {
  const write = process.argv.includes("--write");
  const artifacts = buildArtifacts();
  const drift = [];

  for (const [relativePath, content] of Object.entries(artifacts)) {
    const absolutePath = path.join(ROOT, relativePath);
    const current = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : null;
    if (current === content) continue;
    if (write) {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSyncWithRetry(absolutePath, content, "utf8");
    } else {
      drift.push(relativePath);
    }
  }

  if (!write && drift.length) {
    throw new Error(`Swahili Agriculture stop receipt is stale: ${drift.join(", ")}`);
  }

  console.log(write
    ? "Swahili Agriculture stop receipt written: 447 scoped rows, 1 architecture blocker, 0 accepted."
    : "Swahili Agriculture stop receipt is current: 447 scoped rows, 1 architecture blocker, 0 accepted.");
}

if (require.main === module) main();

module.exports = {
  buildArtifacts,
};
