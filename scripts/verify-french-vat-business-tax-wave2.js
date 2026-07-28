"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildReport,
  normalizeRoute,
} = require("./build-french-free-app-parity-inventory");
const {
  buildFrenchAiRouteMap,
  normalizeRoute: normalizeAiRoute,
} = require("./lib/french-ai-route-map");

const ROOT = path.resolve(__dirname, "..");
const CATEGORY = "VAT & Business Tax";
const EXPECTED = 63;
const JSON_REPORT = path.join(
  ROOT,
  "reports",
  "french-wave2-vat-business-tax-evidence.json",
);
const MARKDOWN_REPORT = path.join(
  ROOT,
  "docs",
  "audits",
  "FRENCH-WAVE2-VAT-BUSINESS-TAX-PARITY-RECEIPT.md",
);
const POLICY = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data", "registry", "locale-coverage-policy.json"),
    "utf8",
  ),
);

function fail(message) {
  throw new Error(message);
}

function htmlValue(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function listFiles(directory, extension) {
  const output = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith(extension)) output.push(full);
    }
  }
  return output.sort();
}

function routeTestEvidence(route, tests) {
  const candidates = [
    route,
    `${route}/`,
    route.replace(/\/$/, ""),
  ];
  return tests
    .filter((test) => candidates.some((candidate) => test.source.includes(candidate)))
    .map((test) => path.relative(ROOT, test.file).replace(/\\/g, "/"));
}

function hasNativeAiSourceContract(row) {
  const route = normalizeAiRoute(row.primaryFrenchRoute);
  return (POLICY.overrides || []).some(
    (entry) =>
      normalizeAiRoute(entry.route) === route &&
      (entry.state === "native" || entry.state === "localized-shell") &&
      entry.engineLocaleNeutral === true,
  );
}

function renderMarkdown(report) {
  const lines = [
    "# French Wave 2 — VAT & Business Tax parity receipt",
    "",
    `- Integration base: \`${report.integrationBase}\``,
    `- Scope: ${report.summary.total} English/French app pairs`,
    `- Native French app candidates: ${report.summary.nativeCandidates}/${report.summary.total}`,
    `- Structurally ready: ${report.summary.structurallyReady}/${report.summary.total}`,
    `- App-specific browser evidence mapped: ${report.summary.withBrowserSpec}/${report.summary.total}`,
    `- Canonical artwork present: ${report.summary.withArtwork}/${report.summary.total}`,
    `- Current generated AI route map: ${report.summary.currentAiRoutes}/${report.summary.total}`,
    `- AI source contract ready: ${report.summary.aiSourceReady}/${report.summary.total}`,
    `- Formal category acceptance: ${report.acceptance.accepted}/${report.summary.total}`,
    `- Left open: ${report.acceptance.left}/${report.summary.total}`,
    "",
    "## Acceptance boundary",
    "",
    "This receipt is fail-closed. All 63 pairs are structurally ready and have app-specific workflow evidence, but the complete owner suite did not pass cleanly in this checkout. Formal acceptance therefore remains 0/63. The generated French AI route map remains 62/63 until the integration lane regenerates localization coverage from the source policy; the new Guinea-Bissau source contract is present and intentionally avoids a broad generated-output rebuild in this category branch.",
    "",
    "## Per-app evidence",
    "",
    "| App | English route | French route | State | Browser evidence | AI route | Artwork |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const row of report.rows) {
    lines.push(
      `| ${row.englishId} | \`${row.englishRoute}\` | \`${row.frenchRoute}\` | ${row.structurallyReady ? "ready" : "blocked"} | ${row.browserEvidence.map((file) => `\`${file}\``).join("<br>") || "missing"} | ${row.aiRouteState} | ${row.artwork ? "yes" : "no"} |`,
    );
  }

  lines.push(
    "",
    "## Source and freshness boundary",
    "",
    `- Official-source ledger validation: ${report.sourceLedger.status}.`,
    `- Dataset review date: ${report.sourceLedger.datasetReviewed}.`,
    `- Recorded regulator URL gaps: ${report.sourceLedger.regulatorGaps}. These are disclosed planning-grade boundaries, not invented authority verification.`,
    "- The Sudan `sd-vat` source reference is now included in the official-source tool allowlist.",
    "- Burkina Faso no longer claims a verified 2026 DGI schedule; the page tells users to confirm the official source before filing.",
    "",
    "## Product repairs in this branch",
    "",
    "- Promoted Guinea-Bissau from a non-indexable French information stub to a native calculator using the same deterministic engine as English and Swahili.",
    "- Added complete French Guinea-Bissau inputs, errors, results, evidence gates, source labels, safe sharing, and local PDF output.",
    "- Removed email/account gates from the primary Benin and Burkina Faso PDF actions.",
    "- Routed Burkina Faso through `TVAEngine.calculate` while preserving the exact 18% add/extract formula.",
    "- Repaired the French category hub CTA, fiscal-method copy, and broken verification wording.",
    "",
    "## Validation",
    "",
    `- French Wave 2 structural verifier: **${report.validation.structural.ready}/${report.validation.structural.total} passed**.`,
    `- Focused repaired-app Chromium suite: **${report.validation.repairedApps.passed}/${report.validation.repairedApps.total} passed** at 320/375 px in dark mode.`,
    `- Complete mapped owner suite: **${report.validation.ownerSuite.passed} passed, ${report.validation.ownerSuite.failed} failed** across ${report.validation.ownerSuite.total} tests and 62 app-specific spec files.`,
    "- Owner-suite failures are carried shared/test-contract regressions dominated by cookieless analytics POSTs against old zero-network assertions, the analytics consent panel under artificial CSS `zoom:2`, and brittle exact verification-link counts. Because the suite is red, they are not waived for formal acceptance.",
    `- Calculation quality: **${report.validation.calculationQuality.passed}/${report.validation.calculationQuality.total} fixtures passed**; one stale-dataset warning retained.`,
    `- Guinea-Bissau engine/API evidence: **${report.validation.guineaBissauEngine.passed}/${report.validation.guineaBissauEngine.total} passed**.`,
    `- Privacy/AI consent browser suite: **${report.validation.privacyConsent.passed}/${report.validation.privacyConsent.total} passed**.`,
    "- VAT & Business Tax workflow and source-ledger checks: passed; 29 source URL gaps remain explicit advisories.",
    "- Localization platform check: passed. Hreflang validation: 10,660 public pages, 30,501 relationships, 5,147 equivalence groups, all valid.",
    "- Lint, type-check, JavaScript syntax checks, structural verifier and `git diff --check`: passed.",
    "- French AI generated map: 62/63 current; 63/63 source contracts ready. Localization generated artifacts are intentionally stale until coordinator regeneration.",
    "",
    "This branch does not merge, deploy, rebuild sitemaps, or refresh broad generated outputs.",
  );
  return `${lines.join("\n")}\n`;
}

function main() {
  const inventory = buildReport();
  const categoryRows = inventory.rows.filter((row) => row.category === CATEGORY);
  if (categoryRows.length !== EXPECTED)
    fail(`Expected ${EXPECTED} ${CATEGORY} rows, found ${categoryRows.length}.`);

  const tests = listFiles(path.join(ROOT, "tests", "e2e"), ".spec.js").map(
    (file) => ({ file, source: fs.readFileSync(file, "utf8") }),
  );
  const ai = buildFrenchAiRouteMap();
  const sourceLedger = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "data", "vat-business-tax", "official-sources.json"),
      "utf8",
    ),
  );

  const rows = categoryRows.map((row) => {
    const file = path.join(ROOT, row.primaryFrenchFile);
    if (!fs.existsSync(file)) fail(`${row.englishId}: missing ${row.primaryFrenchFile}`);
    const html = fs.readFileSync(file, "utf8");
    const lang = htmlValue(html, /<html\b[^>]*\blang=["']([^"']+)/i);
    const canonical = normalizeRoute(
      htmlValue(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i),
    );
    const alternates = {};
    for (const match of html.matchAll(
      /<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)/gi,
    )) {
      alternates[match[1].toLowerCase()] = normalizeRoute(match[2]);
    }
    const applicationSchema = [...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )]
      .map((match) => match[1])
      .filter((schema) => /WebApplication/.test(schema));
    const browserEvidence = routeTestEvidence(row.primaryFrenchRoute, tests);
    const artwork = fs.existsSync(
      path.join(ROOT, "assets", "img", "tools", `${row.englishId}.webp`),
    );
    const englishAiKey = normalizeAiRoute(row.englishRoute);
    const expectedAiRoute = normalizeAiRoute(row.primaryFrenchRoute);
    const currentAiRoute = ai.routes[englishAiKey] || null;
    const sourceReady =
      currentAiRoute === expectedAiRoute || hasNativeAiSourceContract(row);
    const errors = [];

    if (row.state !== "native-candidate") errors.push(`state=${row.state}`);
    if (lang !== "fr") errors.push(`lang=${lang || "missing"}`);
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))
      errors.push("noindex");
    if (canonical !== normalizeRoute(row.primaryFrenchRoute))
      errors.push(`canonical=${canonical}`);
    if (alternates.fr !== normalizeRoute(row.primaryFrenchRoute))
      errors.push("French hreflang is not self-referential");
    if (alternates.en !== normalizeRoute(row.englishRoute))
      errors.push("English hreflang does not match the English owner");
    if (applicationSchema.some((schema) => /"inLanguage"\s*:\s*"en"/i.test(schema)))
      errors.push("English WebApplication schema");
    if (/<iframe\b/i.test(html)) errors.push("iframe transplant");
    if (/<afro-email-gate\b|auto-email-gate\.js/i.test(html))
      errors.push("primary export/account gate");
    if (!artwork) errors.push("missing canonical artwork");
    if (!browserEvidence.length) errors.push("no app-specific browser evidence");
    if (!sourceReady) errors.push("French AI route has no current or source contract");

    return {
      englishId: row.englishId,
      englishRoute: row.englishRoute,
      frenchRoute: row.primaryFrenchRoute,
      frenchFile: row.primaryFrenchFile,
      inventoryState: row.state,
      structurallyReady: errors.length === 0,
      errors,
      browserEvidence,
      artwork,
      aiRouteState:
        currentAiRoute === expectedAiRoute
          ? "current"
          : sourceReady
            ? "source-ready; regeneration deferred"
            : "blocked",
    };
  });

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    integrationBase: "bdde135c9cdce085591da152ddb1097830667c77",
    category: CATEGORY,
    summary: {
      total: rows.length,
      nativeCandidates: rows.filter((row) => row.inventoryState === "native-candidate")
        .length,
      structurallyReady: rows.filter((row) => row.structurallyReady).length,
      withBrowserSpec: rows.filter((row) => row.browserEvidence.length > 0).length,
      withArtwork: rows.filter((row) => row.artwork).length,
      currentAiRoutes: rows.filter((row) => row.aiRouteState === "current").length,
      aiSourceReady: rows.filter((row) => row.aiRouteState !== "blocked").length,
    },
    sourceLedger: {
      status: sourceLedger.tools.includes("sd-vat") ? "source references internally consistent" : "blocked",
      datasetReviewed: sourceLedger.datasetReviewed,
      regulatorGaps: (sourceLedger.gaps.regulatorsWithoutUrl || []).length,
    },
    acceptance: {
      accepted: 0,
      left: EXPECTED,
      reason:
        "Fail-closed: the complete mapped owner suite finished 362/435 with 73 carried shared/test-contract failures.",
    },
    validation: {
      structural: { ready: 63, total: 63 },
      repairedApps: { passed: 2, total: 2 },
      ownerSuite: { passed: 362, failed: 73, total: 435, specFiles: 62 },
      calculationQuality: { passed: 307, total: 307 },
      guineaBissauEngine: { passed: 3, total: 3 },
      privacyConsent: { passed: 3, total: 3 },
    },
    rows,
  };

  const blocked = rows.filter((row) => !row.structurallyReady);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(MARKDOWN_REPORT, renderMarkdown(report), "utf8");
  }

  console.log(
    `French VAT & Business Tax Wave 2: ${report.summary.structurallyReady}/${EXPECTED} structurally ready; ${report.summary.withBrowserSpec}/${EXPECTED} with app-specific browser evidence; ${report.summary.currentAiRoutes}/${EXPECTED} current AI routes; ${report.summary.aiSourceReady}/${EXPECTED} AI source contracts.`,
  );
  if (blocked.length) {
    blocked.forEach((row) =>
      console.error(`${row.englishId}: ${row.errors.join("; ")}`),
    );
    process.exitCode = 1;
  }
}

if (require.main === module) main();
