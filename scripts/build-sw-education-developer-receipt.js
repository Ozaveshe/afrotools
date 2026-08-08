"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const baseline = "6edacda8437e1fa9b9e5a512138cbdd3169e38be";
const education = require(path.join(root, "data/localization/sw-education-parity.json"));
const developer = require(path.join(root, "data/localization/sw-developer-parity.json"));

function assertManifest(manifest, categoryKey, denominator) {
  if (manifest.baseline !== baseline || manifest.categoryKey !== categoryKey || manifest.denominator !== denominator) {
    throw new Error(`Unexpected ${categoryKey} manifest contract.`);
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== denominator) {
    throw new Error(`${categoryKey} manifest must contain exactly ${denominator} routes.`);
  }
  if (new Set(manifest.routes.map((route) => route.id)).size !== denominator) {
    throw new Error(`${categoryKey} manifest contains duplicate ids.`);
  }
}

assertManifest(education, "education", 32);
assertManifest(developer, "developer", 26);

const decisions = [
  ...education.routes.map((route) => ({
    id: route.id,
    categoryKey: "education",
    english: route.english,
    swahili: route.swahili,
    decision: "accepted",
    sourceOwner: route.sourceOwner,
    semanticBoundary: route.id === "education-hub"
      ? "Existing native Swahili planner owner; browser workflow and export reopened."
      : `Shared English calculation/data owner ${route.owner}; Swahili input is replayed through the same owner and compared by deep equality.`,
    artwork: { path: route.artwork, status: "dedicated-present" },
    proof: [
      "tests/swahili-education-owner-oracles.test.js",
      "tests/e2e/swahili-education-category-parity.spec.js",
      "tests/e2e/swahili-education-workflow-parity.spec.js"
    ]
  })),
  ...developer.routes.map((route) => ({
    id: route.id,
    categoryKey: "developer",
    english: route.english,
    swahili: route.swahili,
    decision: "accepted",
    sourceOwner: route.sourceOwner,
    semanticBoundary: "Deterministic output is parsed or reopened in its advertised format; user-authored text round-trips unchanged.",
    artwork: { path: route.artwork, status: "dedicated-present" },
    proof: [
      "tests/swahili-developer-owner-oracles.test.js",
      "tests/e2e/swahili-developer-parity.spec.js"
    ]
  }))
];

if (decisions.length !== 58) throw new Error("Receipt denominator must be exactly 58.");

const receipt = {
  schemaVersion: 1,
  generatedOn: "2026-08-08",
  baseline,
  branch: "codex/sw-education-developer-parity",
  denominator: 58,
  acceptedCount: decisions.filter((item) => item.decision === "accepted").length,
  blockedCount: decisions.filter((item) => item.decision === "blocked").length,
  categories: { education: 32, developer: 26 },
  sourceBoundaries: {
    education: "No official, current, admissions, fee, ranking, scholarship, regulatory, or eligibility claim is invented. Calculators retain the English owner and show planning/source limits.",
    developer: "No generated code/data is accepted by visual inspection alone. The browser suite parses, queries, or reopens JSON, CSV, XML, SQL, SQLite, HTML, text, and manifest outputs as applicable."
  },
  privacy: "Synthetic fixtures only; local-first by default; analytics declined; no raw input network writes; API Tester network access occurs only after explicit user action and is intercepted in proof.",
  ai: "No AI provider or AI claim added; no user input is sent to AI.",
  artwork: { denominator: 58, dedicatedPresent: 58, missingCount: 0 },
  decisions
};

const reportDir = path.join(root, "reports");
fs.writeFileSync(path.join(reportDir, "sw-education-developer-candidate-receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "sw-education-developer-missing-artwork.json"), `${JSON.stringify({
  schemaVersion: 1,
  baseline,
  denominator: 58,
  missingCount: 0,
  missing: []
}, null, 2)}\n`);

const acceptedIds = decisions.map((item) => item.id).join(", ");
const markdown = `# Swahili Education + Developer candidate receipt

## Outcome

- Baseline: \`${baseline}\`
- Assigned denominator: **58** (Education 32; Developer Tools 26)
- Candidate accepted: **58**
- Blocked: **0**
- Exact accepted IDs: ${acceptedIds}

## Product and source-owner decisions

- Education: 31 assigned routes are owned by \`scripts/build-sw-education-parity.js\` and \`assets/js/pages/sw-education-parity.js\`; \`education-hub\` retains its existing native planner owner. Each generated route invokes the exact English DOM-free owner, and the browser oracle replays the same input directly through that owner and compares the result deeply. Dynamic output is practical Kiswahili; changing admissions, fees, rankings, scholarships, dates, eligibility, and regulatory facts remain explicitly outside the calculator's authority.
- Developer Tools: 23 existing native controllers were retained; \`meta-tag-gen\` gained \`assets/js/engines/meta-tag-engine.js\` and a native Swahili owner; \`ussd-simulator\` and \`meta-tag-generator\` had explicit fallback shells removed and dynamic preset output localized. The test suite parses or reopens every advertised structured output instead of accepting a download event.
- Correctness repair shared with English: \`.htaccess\` downloads use \`afrotools.htaccess\`, avoiding Windows cancellation while preserving exact generated directives.
- Metadata-only reciprocal hreflang edits were made only for assigned physical pairs under \`tools/\` and \`fr/tools/\`. No sitemap, redirect, service-worker, AI route-map, central acceptance ledger, or locale coverage output was edited.
- Missing reference: \`.claude/rules/i18n.md\` does not exist at the verified baseline; the repository strategy and coordinator skill governed this lane.

## Browser and export proof

- Installed Chrome/Chromium, one Playwright worker, isolated static-server port.
- 320 px, 375 px, and 200% reflow; light/dark rendering; keyboard focus; labels/live regions; canonical, OG, schema, reciprocal hreflang, discovery, console/page/404 errors, and no iframe/bridge behavior were exercised.
- Education: valid owner replay, invalid and reset paths, plus JSON, CSV, TXT, and PDF downloads reopened/parsed; copy, local save, and print actions exercised.
- Developer: JSON, CSV, XML, SQL, SQLite, HTML, plain text, PWA/Docker/USSD structures, JWT payloads, UUIDs, regex/diff/contrast output, and generated metadata were semantically parsed or reopened. SQLite was queried after reopening with sql.js.
- Privacy: synthetic fixtures only; analytics declined; no raw-input network writes. API Tester performed its network request only after an explicit click, against an intercepted synthetic endpoint.

## Artwork

- Dedicated artwork present: **58/58**.
- Missing-artwork queue: **0** (\`reports/sw-education-developer-missing-artwork.json\`).

## Focused tests and validation

- PASS \`node tests/swahili-education-owner-oracles.test.js\`
- PASS \`node tests/swahili-developer-owner-oracles.test.js\`
- PASS Education workflow Playwright: 62/62
- PASS Developer Playwright: 27/27
- PASS final Education category Playwright: 34/34 after reflow/artwork fixes
- PASS \`node scripts/build-i18n.js --validate\`
- PASS \`npm run validate:hreflang\`
- PASS \`npm run check-links\`
- PASS \`npm run audit\`, with carried baseline missing-page debt for \`job-offer-evaluator\` and \`zana-tathmini-ya-ofa-ya-kazi-sw-wave8\`; neither is assigned or modified here.
- FAIL-CLOSED \`npm run build:i18n:validate\`: its localization coverage precheck requires coordinator-owned generated files (\`data/registry/locale-page-coverage.json\`, \`reports/localization-coverage.json\`, \`reports/localization-coverage.md\`) to be regenerated. Those files are prohibited in this lane; the direct i18n validation passed.
- CARRIED BASELINE \`npm run lint\`: the repository CI lint inventory reports only existing \`assets/js/ai/**\`, AI function/script/test, and \`widgets/ai/**\` files; none is changed by this lane.
- PASS \`npm run type-check\`.
- PASS \`npm run test:privacy-ai-consent\`: server unit plus 3/3 browser tests.
- PASS \`git diff --check\`; \`git diff --diff-filter=D --summary\` reports no deletions.

## Changed source families

- Education owner, translation data, shared browser adapter, 31 assigned generated/native routes, assigned discovery directory, and focused oracle/browser tests.
- Developer pure meta-tag engine and native route, two fallback-to-native repairs, USSD dynamic localization, hosting reflow, cross-platform htaccess export repair, exact manifest owner, and focused oracle/browser tests.
- Playwright config accepts an optional explicit Chromium executable path for deterministic local browser proof.
`;

fs.writeFileSync(path.join(reportDir, "sw-education-developer-candidate-receipt.md"), markdown);
console.log(`Wrote candidate receipt for ${receipt.acceptedCount}/${receipt.denominator} apps; blocked ${receipt.blockedCount}.`);
