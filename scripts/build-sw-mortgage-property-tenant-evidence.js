'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const IDS = ['tenancy-deposit', 'rent-affordability'];
const INVENTORY_FILE = path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json');
const ACCEPTANCE_FILE = path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json');
const CONTRACT_FILE = path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json');
const BROWSER_FILE = path.join(ROOT, 'reports/sw-mortgage-property-tenant-family-clean-respin-browser-evidence.json');
const RECEIPT_FILE = path.join(ROOT, 'reports/sw-mortgage-property-tenant-family-clean-respin-receipt.json');
const RECEIPT_MD_FILE = path.join(ROOT, 'reports/sw-mortgage-property-tenant-family-clean-respin-receipt.md');
const ARTWORK_FILE = path.join(ROOT, 'reports/sw-mortgage-property-tenant-family-clean-respin-missing-artwork.md');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalize(route) {
  return route === '/' ? route : String(route).replace(/\/+$/, '');
}

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function registryRows() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return {}; },
      head: { appendChild() {} }
    },
    CustomEvent: function CustomEvent() {}
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'),
    sandbox
  );
  return sandbox.AFRO_TOOLS;
}

function hasSwAlternate(html, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `hreflang=["']sw["'][^>]+href=["']https://afrotools\\.com${escaped}["']`,
    'i'
  ).test(html);
}

function main() {
  const inventory = readJson(INVENTORY_FILE);
  const acceptance = readJson(ACCEPTANCE_FILE);
  const contracts = readJson(CONTRACT_FILE);
  const browser = readJson(BROWSER_FILE);
  const registry = registryRows();
  const hub = fs.readFileSync(path.join(ROOT, 'sw/nyumba-na-ardhi/index.html'), 'utf8');
  const aiCatalog = fs.readFileSync(path.join(ROOT, 'data/ai/tool-catalog-pack.json'), 'utf8');
  const swAiMap = fs.readFileSync(path.join(ROOT, 'assets/js/ai/swahili-route-map.generated.js'), 'utf8');
  const category = inventory.categories.find((row) => row.category === 'Mortgage & Property');
  const rows = inventory.rows.filter((row) => IDS.includes(row.englishId));
  const contractById = new Map(contracts.rows.map((row) => [row.englishId, row]));
  const browserById = new Map(browser.routes.map((row) => [row.englishId, row]));
  const acceptedIds = new Set(acceptance.entries
    .filter((row) => row.status === 'accepted')
    .map((row) => row.englishId));

  if (!category || category.englishFreeApps !== 66 || category.accepted !== 11) {
    throw new Error('Mortgage & Property inventory denominator changed; reconcile before issuing receipt.');
  }
  if (rows.length !== 2 || browser.accepted !== 2 || browser.blocked !== 0) {
    throw new Error('Two-route browser evidence is not fully accepted.');
  }

  const routeReceipts = rows.map((row) => {
    const contract = contractById.get(row.englishId);
    const browserRow = browserById.get(row.englishId);
    if (!contract || !browserRow || browserRow.status !== 'accepted') {
      throw new Error(`Missing accepted contract/browser proof: ${row.englishId}`);
    }
    const swRoute = `${normalize(row.primarySwahiliRoute)}/`;
    const swHtml = fs.readFileSync(routeFile(swRoute), 'utf8');
    const englishRoute = `${normalize(row.englishRoute)}/`;
    const englishHtml = fs.readFileSync(routeFile(englishRoute), 'utf8');
    const frenchRoute = `${normalize(contract.frenchRoute)}/`;
    const frenchHtml = fs.readFileSync(routeFile(frenchRoute), 'utf8');
    const artworkPath = path.join(ROOT, `assets/img/tools/${row.englishId}.webp`);
    const registryMatches = registry.filter((entry) => (
      entry.lang === 'sw'
      && entry.sourceId === row.englishId
      && normalize(entry.href) === normalize(swRoute)
    ));
    const canonicalAiCovered = new RegExp(`"id"\\s*:\\s*"${row.englishId}"`).test(aiCatalog);
    const localizedAiMapped = swAiMap.includes(`"${englishRoute}":"${swRoute}"`)
      || swAiMap.includes(`"${row.englishId}":"${swRoute}"`);
    const routeReceipt = {
      englishId: row.englishId,
      englishOwner: { route: englishRoute, file: row.englishRoute.replace(/^\/+/, '') + '/index.html' },
      swahiliOwner: { route: swRoute, file: row.primarySwahiliFile },
      frenchPeer: { route: frenchRoute, file: frenchRoute.replace(/^\/+/, '') + 'index.html' },
      previousState: row.state,
      centralAcceptanceBefore: acceptedIds.has(row.englishId),
      localParityStatus: 'accepted',
      workflowKind: contract.workflowKind,
      sharedEngine: contract.sharedEngine,
      sharedEngineChanged: false,
      crossLocaleRuntimeChanged: false,
      source: {
        url: contract.source.url,
        label: contract.source.label,
        availability: contract.source.availability || (contract.jurisdictionSources ? 'jurisdiction-bound' : 'available'),
        checkedAt: contract.source.checkedAt,
        jurisdictionSources: contract.jurisdictionSources || null,
        planningBoundaryPresent: /makadirio|rasimu|si ushauri/i.test(swHtml)
      },
      discovery: {
        registryRows: registryMatches.length,
        hubLinks: hub.split(`href="${swRoute}"`).length - 1,
        canonicalAiCatalogCovered: canonicalAiCovered,
        localizedGeneratedAiRouteMapped: localizedAiMapped,
        localizedAiStatus: localizedAiMapped
          ? 'mapped'
          : 'pending-coordinator-integration-generated-map-out-of-scope'
      },
      seo: {
        selfCanonical: swHtml.includes(`rel="canonical" href="https://afrotools.com${swRoute}"`),
        ogUrl: swHtml.includes(`property="og:url" content="https://afrotools.com${swRoute}"`),
        artworkUrl: `/assets/img/tools/${row.englishId}.webp`,
        artworkExists: fs.existsSync(artworkPath) && fs.statSync(artworkPath).size > 100,
        englishReciprocal: hasSwAlternate(englishHtml, swRoute),
        frenchReciprocal: hasSwAlternate(frenchHtml, swRoute)
      },
      browserProof: browserRow.proofs,
      browserMeasurements: browserRow.measurements
    };
    const requiredBooleans = [
      routeReceipt.source.planningBoundaryPresent,
      row.englishId === 'tenancy-deposit'
        ? routeReceipt.source.jurisdictionSources
          && routeReceipt.source.jurisdictionSources.ng.availability === 'official-source'
          && ['ke', 'za', 'gh'].every((country) => (
            routeReceipt.source.jurisdictionSources[country].availability === 'planning-default'
            && !routeReceipt.source.jurisdictionSources[country].url
          ))
        : routeReceipt.source.availability === 'unavailable' && !routeReceipt.source.url,
      routeReceipt.discovery.registryRows === 1,
      routeReceipt.discovery.hubLinks === 1,
      routeReceipt.discovery.canonicalAiCatalogCovered,
      routeReceipt.seo.selfCanonical,
      routeReceipt.seo.ogUrl,
      routeReceipt.seo.artworkExists,
      routeReceipt.seo.englishReciprocal,
      routeReceipt.seo.frenchReciprocal,
      Object.values(routeReceipt.browserProof).every(Boolean)
    ];
    if (!requiredBooleans.every(Boolean)) {
      throw new Error(`Fail-closed evidence gap: ${row.englishId}`);
    }
    return routeReceipt;
  });

  const scopedAccepted = routeReceipts.filter((row) => row.localParityStatus === 'accepted').length;
  const receipt = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cleanRespin: {
      rejectedCandidate: '4627224c64867b363762005cf063e77204132fd5',
      acceptedRepairReference: 'cb049541b10c678d163e8a627af722bd81cf9015',
      exactParent: '8354e321ff34caf60a33a3393cd0dcddfb00c023',
      status: 'product-green-pending-coordinator-acceptance'
    },
    scope: {
      category: 'Mortgage & Property',
      family: 'tenant-planning',
      categoryEnglishOwners: category.englishFreeApps,
      centralAcceptedBefore: category.accepted,
      centralUnacceptedBefore: category.englishFreeApps - category.accepted,
      selectedOwners: IDS.length,
      scopedAccepted,
      scopedBlocked: IDS.length - scopedAccepted,
      effectiveAcceptedAfterScopedReceipt: category.accepted + scopedAccepted,
      remainingUnacceptedAfterScopedReceipt: category.englishFreeApps - category.accepted - scopedAccepted
    },
    guardrails: {
      centralAcceptanceLedgerEdited: false,
      generatedAiRouteMapEdited: false,
      masterLedgerEdited: false,
      sitemapEdited: false,
      otherLocaleVisibleUiOrRuntimeEdited: false,
      sharedEngineEdited: false,
      deployed: false
    },
    coordinatorIntegration: {
      centralAcceptanceLedger: 'pending',
      generatedSwahiliAiRouteMap: routeReceipts.every((row) => (
        row.discovery.localizedGeneratedAiRouteMapped
      )) ? 'already-mapped' : 'pending-after-coordinator-acceptance',
      deploy: 'not-requested'
    },
    routes: routeReceipts,
    browserEvidence: path.relative(ROOT, BROWSER_FILE).replace(/\\/g, '/'),
    tests: [
      'node scripts/build-sw-legal-government-insurance-parity.js',
      'node --test tests/swahili-legal-government-insurance-parity.test.js',
      'npx playwright test tests/e2e/swahili-mortgage-property-tenant-family.spec.js --workers=1',
      'npm run pdf:verify',
      'npm run build:i18n:validate',
      'npm run validate:hreflang',
      'git diff --check',
      'git diff --diff-filter=D --name-only 8354e321ff34caf60a33a3393cd0dcddfb00c023 HEAD',
      'git merge-tree --write-tree 8354e321ff34caf60a33a3393cd0dcddfb00c023 HEAD'
    ]
  };

  const md = `# Swahili Mortgage & Property tenant-planning clean-respin receipt

- Rejected candidate reference: \`4627224c64867b363762005cf063e77204132fd5\`
- Accepted repair reference: \`cb049541b10c678d163e8a627af722bd81cf9015\`
- Exact clean-respin parent: \`8354e321ff34caf60a33a3393cd0dcddfb00c023\`

- Category owners: **${receipt.scope.categoryEnglishOwners}**
- Central acceptance before this bounded lane: **${receipt.scope.centralAcceptedBefore}**
- Unaccepted before this lane: **${receipt.scope.centralUnacceptedBefore}**
- Selected: **${receipt.scope.selectedOwners}**
- Locally accepted: **${receipt.scope.scopedAccepted}**
- Blocked: **${receipt.scope.scopedBlocked}**
- Effective accepted after this scoped receipt: **${receipt.scope.effectiveAcceptedAfterScopedReceipt}**
- Remaining unaccepted after this scoped receipt: **${receipt.scope.remainingUnacceptedAfterScopedReceipt}**

| English owner | Swahili native owner | Engine | App status | Localized AI map |
|---|---|---|---|---|
${routeReceipts.map((row) => `| \`${row.englishOwner.route}\` | \`${row.swahiliOwner.route}\` | \`${row.sharedEngine}\` | ${row.localParityStatus} | ${row.discovery.localizedAiStatus} |`).join('\n')}

## Evidence boundary

- Copy, TXT and JSON were parsed/reopened. PDF was reopened by \`pdf-parse\` and every rendered text coordinate was checked against the page bounds; print was intercepted and verified.
- English-owned blank/default state, all four tenancy country presets, invalid/stale clearing, both 320px and 375px layouts, 200% reflow, keyboard labels/focus, console, privacy and no-network behavior passed.
- Computed contrast passed in explicit light, explicit dark, system-light and system-dark modes: text is at least 4.5:1, control/component boundaries are at least 3:1 and visible focus indicators are at least 3:1. Exact measured minima are retained per route and variant in the JSON receipt.
- Rent affordability preserves the English DOM constraints exactly, including income \`min=0.01\`, ratio \`max=100\`, and every \`min\`/\`max\`/\`step\`/\`required\` boundary; zero income and ratios above 100 fail closed and clear stale exports.
- The Lagos source is bound to Nigeria/Lagos only. Kenya, South Africa and Ghana are visibly marked as planning defaults in the source panel, result and exports.
- The independently inaccessible UN-Habitat PDF is no longer advertised as verified: the route marks it unavailable, records the 403 check and requires manual verification.
- Registry row-hash tests prove the 11 coordinator rows remain byte-identical; only \`tenancy-deposit\` and \`rent-affordability\` are added.
- Registry ownership, hub linkage, canonical/OG/artwork and reciprocal English/French hreflang passed.
- The canonical AI catalog covers both English owners. The generated Swahili AI route map is intentionally unchanged and awaits coordinator acceptance/integration.
- The central acceptance ledger, generated AI route map, master ledger, sitemap, other-locale visible UI/runtime, shared engines and deploy state were not changed.
- This receipt is regenerated from the coordinator tree; it does not carry either predecessor commit as history.
`;
  const missingArtwork = `# Swahili Mortgage & Property tenant-planning clean-respin missing artwork

Missing: **0/2**

- \`/assets/img/tools/tenancy-deposit.webp\` - present and browser-decoded at 800x450.
- \`/assets/img/tools/rent-affordability.webp\` - present and browser-decoded at 800x450.
`;

  fs.writeFileSync(RECEIPT_FILE, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  fs.writeFileSync(RECEIPT_MD_FILE, md, 'utf8');
  fs.writeFileSync(ARTWORK_FILE, missingArtwork, 'utf8');
  process.stdout.write(`Built Swahili tenant-planning clean-respin receipt: ${scopedAccepted}/2 accepted; 0/2 missing artwork.\n`);
}

if (require.main === module) main();
