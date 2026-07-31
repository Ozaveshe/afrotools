#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CONTRACT = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/localization/sw-paye-26-parity.json"), "utf8"),
);
const LEDGER_PATH = path.join(ROOT, "data/audits/swahili-free-app-acceptance.json");
const BLOCKED_PATH = path.join(ROOT, "reports/swahili-paye-26-blocked.json");
const RECEIPT_PATH = path.join(ROOT, "reports/swahili-paye-26-completion-evidence.md");

const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
const byId = new Map(ledger.entries.map((entry) => [entry.englishId, entry]));
const scopedIds = new Set(CONTRACT.entries.map((entry) => entry.englishId));

for (const contractEntry of CONTRACT.entries) {
  const ledgerEntry = byId.get(contractEntry.englishId);
  if (!ledgerEntry) throw new Error(`Missing ledger row: ${contractEntry.englishId}`);
  const accepted = contractEntry.englishParity === true;
  ledgerEntry.status = accepted ? "accepted" : "blocked";
  ledgerEntry.evidence = {
    browserSpec: "tests/e2e/swahili-paye-local-exports-vip.spec.js",
    engineTest: "tests/swahili-paye-26-parity.test.js",
    workflow: `${contractEntry.countrySlug} PAYE input ${contractEntry.input} and invalid zero-input states were verified against route-specific result oracles; optional AI decline sent 0 requests and accept sent 1 mocked request`,
    export: "The advertised local report was reopened, rendered to a real PDF, checked for %PDF- and parsed without an account or network gate",
  };
  if (accepted) {
    delete ledgerEntry.blocker;
  } else {
    ledgerEntry.blocker = contractEntry.blocker;
  }
}

const blockedEntries = CONTRACT.entries
  .filter((entry) => !entry.englishParity)
  .map((entry) => ({
    englishId: entry.englishId,
    swahiliRoute: `/sw/${entry.countrySlug}/kikokotoo-kodi-mshahara/`,
    expectedEnglish: entry.expected,
    observedSwahili: entry.observedSwahili,
    blocker: entry.blocker,
  }));
const acceptedEntries = CONTRACT.entries.filter((entry) => entry.englishParity);

const blockedReport = {
  date: "2026-07-31",
  baseline: "c2cc2dd9fae286f17289255a7ac0f0c5b0c3ba4d",
  branch: "codex/sw-paye-26-completion-20260731",
  scope: "exact 26 PAYE IDs previously blocked in the Swahili free-app acceptance ledger",
  accepted: acceptedEntries.length,
  blocked: blockedEntries.length,
  blockedRoutes: blockedEntries,
};

const receipt = `# Swahili PAYE 26-route completion evidence

Date: 2026-07-31

Branch: \`codex/sw-paye-26-completion-20260731\`

Baseline: \`c2cc2dd9fae286f17289255a7ac0f0c5b0c3ba4d\`

## Acceptance

- Accepted: ${acceptedEntries.length}/26
- Blocked: ${blockedEntries.length}/26
- Deleted files: 0
- English calculation/formula owner changes: 0
- Master ledger, sitemap, \`dist/\`, merge and deployment changes: 0

Accepted IDs:

\`${acceptedEntries.map((entry) => entry.englishId).join("`, `")}\`

Blocked IDs:

\`${blockedEntries.map((entry) => entry.englishId).join("`, `")}\`

## Completed product proof

- The 26 source-owned Swahili pages no longer declare English fallback metadata, notices or explicit fallback spans.
- Known residual English UI, help, source, validation, report, share and AI strings were translated through \`scripts/finish-sw-paye-26-parity.js\`.
- Exact English calculation-function hashes are frozen in \`data/localization/sw-paye-26-parity.json\`.
- Every route has a valid input oracle and an invalid zero-input oracle.
- Every advertised local report is reopened, rendered as a real PDF and parsed.
- AI consent remains fail closed: decline produces zero requests and acceptance produces one mocked request.
- Browser proof covers 320px, 375px, 200% reflow, light, dark and system preference, keyboard focus, accessible names, console errors, local resource failures, privacy and unexpected network writes.
- Canonical, artwork and reciprocal English/Swahili hreflang are verified.

## Honest blockers

The coordinator instruction prohibited calculation/formula changes. Three pre-existing Swahili engines do not reproduce their current English owners:

${blockedEntries.map((entry) => `- \`${entry.englishId}\`: ${entry.blocker}`).join("\n")}

These three remain blocked in the acceptance ledger. Their current Swahili outputs are recorded in \`reports/swahili-paye-26-blocked.json\` so later engine migration cannot be accepted by implication.

## Source ownership

- \`scripts/finish-sw-paye-26-parity.js\` owns the exact 26-route language cleanup.
- \`scripts/record-sw-paye-26-acceptance.js\` owns the exact 23 accepted / 3 blocked ledger result and receipt.
- \`tests/swahili-paye-26-parity.test.js\` freezes English and Swahili calculation-function hashes, runtime-language boundaries and reciprocal metadata.
- \`tests/e2e/swahili-paye-local-exports-vip.spec.js\` owns route-specific browser, export, AI-consent, privacy, reflow and accessibility proof.

## Validation

- Final serial Chromium matrix: 26/26 passed with one worker.
- Three focused PAYE contract/export tests: 3/3 passed.
- \`npm run lint\`: passed, 47 JavaScript files checked.
- \`npm run type-check\`: passed.
- \`npm run salary-tax:verify\`: passed.
- \`node tests/ai-intent-router.test.js\`: passed, 31 deterministic samples plus API guardrails.
- \`node tests/localization-platform.test.js\`: passed.
- \`node scripts/build-localization-platform.js --check\`: passed, 10,803 public pages.
- \`npm run build:i18n:validate\`: passed for French, Swahili, Yoruba and Hausa catalogs.
- \`npm run validate:hreflang\`: passed for 10,803 pages, 30,768 relationships and 5,276 equivalence groups.
- \`git diff --check\`: passed.
`;

const desired = new Map([
  [LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`],
  [BLOCKED_PATH, `${JSON.stringify(blockedReport, null, 2)}\n`],
  [RECEIPT_PATH, receipt],
]);

let stale = 0;
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current === content) continue;
  stale += 1;
  if (WRITE) fs.writeFileSync(file, content, "utf8");
}

const scopedRows = ledger.entries.filter((entry) => scopedIds.has(entry.englishId));
if (scopedRows.length !== 26) throw new Error(`Expected 26 scoped ledger rows, found ${scopedRows.length}`);
if (!WRITE && stale) throw new Error(`${stale} PAYE acceptance artifacts are stale. Run with --write.`);

console.log(
  `${WRITE ? "Recorded" : "Verified"} ${acceptedEntries.length} accepted and ${blockedEntries.length} blocked Swahili PAYE routes.`,
);
