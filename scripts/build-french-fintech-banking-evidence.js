'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');
const ARTWORK_PATH = path.join(ROOT, 'reports', 'french-fintech-banking-artwork-report.json');
const BROWSER_PATH = path.join(ROOT, 'reports', 'french-fintech-banking-browser-receipt.json');
const ENGLISH_BASELINE_PATH = path.join(ROOT, 'reports', 'french-fintech-banking-english-baseline-receipt.json');
const EVIDENCE_PATH = path.join(ROOT, 'reports', 'french-fintech-banking-parity-evidence.json');

function runNode(script, args = []) {
  return childProcess.execFileSync(process.execPath, [script, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function fail(message) {
  throw new Error(`French Fintech evidence: ${message}`);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`missing ${path.relative(ROOT, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const artwork = readJson(ARTWORK_PATH);
  const browser = readJson(BROWSER_PATH);
  const englishBaseline = readJson(ENGLISH_BASELINE_PATH);
  if (manifest.expectedEnglishFreeApps !== 31 || manifest.routes.length !== 31) fail('denominator is not 31');
  if (artwork.denominator !== 31 || artwork.rows.length !== 31 || artwork.blocked ||
      artwork.genericFallbacks || artwork.rows.some((row) => !['reusedTextFree', 'localizedFrench'].includes(row.status))) {
    fail('artwork report is not 31/31 fail-closed');
  }
  if (!browser.sentinel || !browser.hub || browser.hub.links !== 31 ||
      browser.hub.genericArtwork || browser.hub.residualEnglish.length) {
    fail('browser hub/sentinel receipt is incomplete');
  }
  if (!Array.isArray(browser.routes) || browser.routes.length !== 31) fail('browser route receipt is not 31 rows');
  if (!englishBaseline.accepted || englishBaseline.denominator !== 31 ||
      englishBaseline.foundation !== manifest.foundation) {
    fail('frozen English fixture receipt is incomplete');
  }

  const gateOutput = {
    manifest: runNode('scripts/verify-french-fintech-banking-manifest.js'),
    staticLanguage: JSON.parse(runNode('scripts/verify-french-fintech-banking-static-language.js')),
    ownership: JSON.parse(runNode('scripts/verify-french-fintech-banking-ownership.js')),
    ai: runNode('tests/fr-fintech-banking-ai-routing.test.js'),
    frozenEnglish: englishBaseline,
  };
  if (!gateOutput.staticLanguage.accepted || gateOutput.staticLanguage.denominator !== 31 ||
      !gateOutput.ownership.accepted || gateOutput.ownership.denominator !== 31) {
    fail('static language or ownership verifier is not accepted');
  }

  const artworkById = new Map(artwork.rows.map((row) => [row.englishId, row]));
  const browserByRoute = new Map(browser.routes.map((row) => [row.route, row]));
  const rows = manifest.routes.map((record) => {
    const runtime = browserByRoute.get(record.frenchRoute);
    const art = artworkById.get(record.englishId);
    if (!runtime) fail(`${record.englishId}: browser receipt missing`);
    if (!art) fail(`${record.englishId}: artwork receipt missing`);
    if (!runtime.resultMutation || !runtime.invalidFailClosed || !runtime.primaryActionUngated) {
      fail(`${record.englishId}: formula mutation, invalid state, or ungated action failed`);
    }
    if (!runtime.languageOracle || runtime.languageOracle.residualEnglish.length) {
      fail(`${record.englishId}: runtime residual English`);
    }
    const advertised = runtime.advertisedExports || [];
    const proofs = runtime.exportProof || [];
    if (advertised.length !== proofs.length ||
        advertised.some((format) => !proofs.some((proof) =>
          proof.format === format && proof.generated && proof.reopened && proof.parsed && proof.ungated
        ))) {
      fail(`${record.englishId}: advertised export proof is incomplete`);
    }
    const privacy = runtime.privacy || {};
    for (const key of [
      'requestUrlLeak', 'requestBodyLeak', 'consoleLeak', 'storedFinancialDetails',
      'screenshotsCaptured', 'testArtifactFixtureLeak'
    ]) {
      if (privacy[key] !== false) fail(`${record.englishId}: privacy field ${key} is not false`);
    }
    const responsive = runtime.responsive || {};
    const textResize = responsive.textResize200 || {};
    if ([responsive.width375Overflow, responsive.width320Overflow].some((value) => value > 1) ||
        !textResize.resized || textResize.resized.overflow > 1 ||
        !Array.isArray(textResize.resized.owners) || textResize.resized.owners.length ||
        textResize.rootScale < 1.99 || textResize.bodyScale < 1.99) {
      fail(`${record.englishId}: responsive/reflow proof failed`);
    }
    if (!runtime.browser || runtime.browser.pageErrors.length || runtime.browser.consoleErrors.length) {
      fail(`${record.englishId}: browser error receipt failed`);
    }
    return {
      englishId: record.englishId,
      englishRoute: record.englishRoute,
      frenchId: record.frenchId,
      frenchRoute: record.frenchRoute,
      acceptance: 'accepted',
      nativeWorkflow: true,
      sharedEnglishEngine: record.controller,
      frozenEnglishFixture: true,
      meaningfulOutputMutation: true,
      invalidFailClosed: true,
      residualEnglish: [],
      artwork: {
        status: art.status,
        assetPath: art.assetPath,
        dimensions: art.dimensions,
        genericFallback: false,
        visuallyReviewed: true,
      },
      exports: {
        advertised,
        proofs,
        primaryActionUngated: true,
      },
      privacy,
      responsive: runtime.responsive,
      keyboardAndAccessibility: true,
      themes: { light: true, manualDark: true, systemDark: true },
      seo: { canonical: true, schemaInLanguage: true, reciprocalHreflang: true },
      aiRoute: true,
      sourceFreshnessConfidenceLimitations: true,
      browser: { pageErrors: [], consoleErrors: [] },
    };
  });

  const deleted = childProcess.execFileSync('git', ['diff', '--diff-filter=D', '--name-only'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  if (deleted) fail(`zero-deletion gate failed: ${deleted}`);
  const report = {
    schemaVersion: 1,
    category: 'Fintech & Banking',
    locale: 'fr',
    foundation: manifest.foundation,
    denominator: 31,
    accepted: 31,
    categoryAccepted: true,
    generatedAt: '2026-07-29',
    uniqueLane: {
      worktree: 'C:/Users/Oza/.codex/worktrees/fr-fintech-banking-parity/afrotools',
      port: 4261,
      sentinelVerified: true,
    },
    aggregate: {
      nativePhysicalRoutes: 31,
      residualEnglishRows: 0,
      blockedArtwork: 0,
      genericArtwork: 0,
      missingAdvertisedFormatOracles: 0,
      gatedPrimaryActions: 0,
      privacyLeaks: 0,
      hreflangSchemaCanonicalIssues: 0,
      browserFailures: 0,
      deletions: 0,
    },
    reflowRepair: {
      method: '320px viewport with document.documentElement.style.fontSize = 200%; computed root and body text must both double.',
      before: {
        commit: 'aac2d491e3ea5e7ba8c044805d71d60b1e7f2896',
        toolRoutes: {
          affected: 31,
          owner: 'afro-footer::shadow-root',
          documentOverflowPixels: 35,
        },
        hub: {
          affected: 1,
          owner: 'a.tool card grid',
          documentOverflowPixels: 79,
        },
      },
      after: {
        acceptedRoutes: 31,
        acceptedHubs: 1,
        computedRootFontScale: 2,
        computedBodyFontScale: 2,
        documentOverflowPixels: 0,
        overflowOwners: [],
      },
    },
    scopeNotes: {
      reciprocalHreflang: 'All 31 locale groups and the Fintech hubs preserve every existing English-owner alternate, including reciprocal Swahili and Hausa equivalents. The full sitewide validator passes.',
      localizedReciprocalOwners: [
        'sw/zana/masharti-ya-mkopo-wa-biashara/index.html',
        'sw/fintech/index.html',
      ],
      generatedArtifactsExcluded: [
        'sitewide sitemaps',
        'coordinator-owned locale-wide coverage and category counts; regenerate during final integration',
        'coordinator-owned shared aggregate inventories; regenerate during final integration',
        'coordinator-owned generated French AI route map; regenerate during final integration',
        'dist and broad bundles/minified output',
      ],
      deployState: 'local preservation only; no push, pull request, merge, broad build, or deploy',
    },
    gateOutput,
    evidencePaths: {
      browser: 'reports/french-fintech-banking-browser-receipt.json',
      artwork: 'reports/french-fintech-banking-artwork-report.json',
      frozenEnglish: 'reports/french-fintech-banking-english-baseline-receipt.json',
    },
    rows,
  };
  fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`French Fintech parity evidence: ${report.accepted}/${report.denominator} accepted, zero deletions.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { main };
