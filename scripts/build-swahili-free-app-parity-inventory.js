'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const COVERAGE_PATH = path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json');
const ACCEPTANCE_PATH = path.join(ROOT, 'data', 'audits', 'swahili-free-app-acceptance.json');
const JSON_OUTPUT_PATH = path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json');
const MARKDOWN_OUTPUT_PATH = path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.md');
// Duplicate canonical entries were retired when landed-cost consolidated into
// import-duty and remittance-v2 consolidated into remittance-compare.
const EXPECTED_FREE_APP_COUNT = 1256;
const EXCLUDED_PAID_ROUTES = new Set(['/pro']);

const STATE_LABELS = Object.freeze({
  'native-candidate': 'Native candidate',
  'localized-shell-candidate': 'Localized shell candidate',
  'english-fallback': 'English fallback',
  'english-iframe': 'English iframe/transplant',
  'bridge-handoff': 'Bridge/handoff',
  'alias-utility': 'Alias/non-indexable utility',
  'unclassified-candidate': 'Unclassified candidate',
  missing: 'Missing'
});

const EVIDENCE_WEIGHTS = Object.freeze({
  'runtime-iframe': 110,
  'runtime-html-fetch': 105,
  'coverage-equivalent-route': 100,
  'registry-source-id': 95,
  'hreflang-en': 85,
  'schema-is-based-on': 80,
  'direct-sw-path': 70
});

const PRIMARY_STATE_RANK = Object.freeze({
  'native-candidate': 0,
  'localized-shell-candidate': 1,
  'unclassified-candidate': 2,
  'bridge-handoff': 3,
  'english-fallback': 4,
  'english-iframe': 5,
  'alias-utility': 6
});

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeRoute(value) {
  let route = String(value || '').trim();
  route = route.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0];
  if (!route.startsWith('/')) route = `/${route}`;
  route = route.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  route = route.replace(/\/+/g, '/');
  return route === '/' ? '/' : route.replace(/\/+$/, '');
}

function publicRouteFromFile(file) {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  if (relative === 'sw/index.html') return '/sw';
  return normalizeRoute(`/${relative.replace(/\/index\.html$/i, '').replace(/\.html$/i, '')}`);
}

function listHtmlFiles(directory) {
  const files = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(full);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function loadRegistry() {
  const sandbox = {
    window: {},
    CustomEvent: function CustomEvent() {},
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '' }),
      head: { appendChild: () => {} },
      addEventListener: () => {},
      dispatchEvent: () => {},
      querySelector: () => null
    }
  };
  vm.runInNewContext(fs.readFileSync(REGISTRY_PATH, 'utf8'), sandbox, {
    filename: path.relative(ROOT, REGISTRY_PATH)
  });
  if (!Array.isArray(sandbox.AFRO_TOOLS)) {
    throw new Error('assets/js/components/tool-registry.js did not expose AFRO_TOOLS');
  }
  return sandbox.AFRO_TOOLS;
}

function extractFirst(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function extractRoutes(html, pattern) {
  const routes = [];
  for (const match of html.matchAll(pattern)) routes.push(normalizeRoute(match[1]));
  return routes;
}

function addEvidence(page, englishRoute, kind, detail) {
  if (!page.ownerEvidence.has(englishRoute)) page.ownerEvidence.set(englishRoute, []);
  const evidence = page.ownerEvidence.get(englishRoute);
  if (!evidence.some((item) => item.kind === kind && item.detail === detail)) {
    evidence.push({ kind, detail });
  }
}

function addHtmlOwnershipEvidence(page, englishByRoute) {
  const addMatches = (pattern, kind) => {
    for (const route of extractRoutes(page.html, pattern)) {
      if (englishByRoute.has(route)) addEvidence(page, route, kind, route);
    }
  };
  addMatches(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi, 'runtime-iframe');
  addMatches(/\bfetch\s*\(\s*["']([^"']+)["']/gi, 'runtime-html-fetch');
  addMatches(
    /<link\b(?=[^>]*\brel=["'][^"']*\balternate\b[^"']*["'])(?=[^>]*\bhreflang=["']en["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
    'hreflang-en'
  );
  addMatches(/["']isBasedOn["']\s*:\s*["']([^"']+)["']/gi, 'schema-is-based-on');

  const directEnglishRoute = normalizeRoute(page.route.replace(/^\/sw(?=\/|$)/, ''));
  if (englishByRoute.has(directEnglishRoute)) {
    addEvidence(page, directEnglishRoute, 'direct-sw-path', directEnglishRoute);
  }
}

function evidenceWeight(items) {
  return items.reduce((best, item) => Math.max(best, EVIDENCE_WEIGHTS[item.kind] || 0), 0);
}

function chooseEnglishOwner(page) {
  const choices = [...page.ownerEvidence.entries()].map(([englishRoute, evidence]) => ({
    englishRoute,
    evidence: evidence.sort((a, b) => (
      (EVIDENCE_WEIGHTS[b.kind] || 0) - (EVIDENCE_WEIGHTS[a.kind] || 0)
      || a.kind.localeCompare(b.kind)
      || a.detail.localeCompare(b.detail)
    )),
    weight: evidenceWeight(evidence)
  })).sort((a, b) => b.weight - a.weight || a.englishRoute.localeCompare(b.englishRoute));
  return {
    selected: choices[0] || null,
    choices,
    conflict: choices.length > 1 && choices[0].englishRoute !== choices[1].englishRoute
  };
}

function hasEnglishRuntime(html, englishRouteSet, pattern) {
  return extractRoutes(html, pattern).some((route) => englishRouteSet.has(route));
}

function classifySwahiliPage(page, englishRouteSet) {
  const html = page.html;
  const canonical = normalizeRoute(extractFirst(
    html,
    /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i
  ) || page.route);
  const noindex = /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
  const redirectLike = /<meta\b[^>]*\bhttp-equiv=["']refresh["']/i.test(html);
  const canonicalMismatch = canonical !== page.route;
  const englishIframe = hasEnglishRuntime(
    html,
    englishRouteSet,
    /<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi
  );
  const englishHtmlFetch = hasEnglishRuntime(
    html,
    englishRouteSet,
    /\bfetch\s*\(\s*["']([^"']+)["']/gi
  );
  const coverageState = page.coverage ? page.coverage.state : null;
  const explicitFallback = coverageState === 'english-fallback'
    || /<meta\b[^>]*\bname=["']afrotools-(?:locale|language)-fallback["'][^>]*\bcontent=["']en["']/i.test(html)
    || /\bdata-explicit-language-fallback\b/i.test(html);
  const generatedBridge = /class=["'][^"']*(?:source-launch|prep-panel)\b/i.test(html)
    || /\bdata-sw-prep\b/i.test(html);

  let state = 'unclassified-candidate';
  if (noindex || redirectLike || canonicalMismatch) state = 'alias-utility';
  else if (englishIframe || englishHtmlFetch) state = 'english-iframe';
  else if (explicitFallback) state = 'english-fallback';
  else if (generatedBridge) state = 'bridge-handoff';
  else if (coverageState === 'localized-shell') state = 'localized-shell-candidate';
  else if (coverageState === 'native') state = 'native-candidate';

  return {
    state,
    canonical,
    flags: {
      noindex,
      redirectLike,
      canonicalMismatch,
      englishIframe,
      englishHtmlFetch,
      explicitFallback,
      generatedBridge
    }
  };
}

function segmentCount(route) {
  return route.split('/').filter(Boolean).length;
}

function primaryCandidateSort(englishRoute) {
  return (a, b) => {
    const weightDelta = b.ownerWeight - a.ownerWeight;
    if (weightDelta) return weightDelta;
    const stateDelta = (PRIMARY_STATE_RANK[a.state] ?? 99) - (PRIMARY_STATE_RANK[b.state] ?? 99);
    if (stateDelta) return stateDelta;
    const directA = normalizeRoute(a.route.replace(/^\/sw(?=\/|$)/, '')) === englishRoute;
    const directB = normalizeRoute(b.route.replace(/^\/sw(?=\/|$)/, '')) === englishRoute;
    if (directA !== directB) return directA ? -1 : 1;
    const depthDelta = segmentCount(a.route) - segmentCount(b.route);
    if (depthDelta) return depthDelta;
    const registryA = a.ownerEvidence.some((item) => item.kind === 'registry-source-id');
    const registryB = b.ownerEvidence.some((item) => item.kind === 'registry-source-id');
    if (registryA !== registryB) return registryA ? -1 : 1;
    return a.route.localeCompare(b.route);
  };
}

function roundPercent(value, total) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function buildReport() {
  const directory = readJson(DIRECTORY_PATH);
  const registry = loadRegistry();
  const acceptanceDocument = readJson(ACCEPTANCE_PATH);
  const acceptanceEntries = acceptanceDocument.entries || [];
  const preservedArchivedAcceptanceEntries = acceptanceDocument.archivedEntries || [];
  let acceptanceById = new Map(acceptanceEntries.map((entry) => [entry.englishId, entry]));
  if (acceptanceById.size !== acceptanceEntries.length) {
    throw new Error('Swahili acceptance evidence contains duplicate englishId values.');
  }
  const coverageDocument = readJson(COVERAGE_PATH);
  const swCoverage = (coverageDocument.records || []).filter((row) => row.locale === 'sw');
  const coverageByRoute = new Map(swCoverage.map((row) => [normalizeRoute(row.route), row]));
  const excluded = directory.filter((row) => EXCLUDED_PAID_ROUTES.has(normalizeRoute(row.url)));
  const englishRows = directory.filter((row) => !EXCLUDED_PAID_ROUTES.has(normalizeRoute(row.url)));
  if (englishRows.length !== EXPECTED_FREE_APP_COUNT) {
    throw new Error(
      `Swahili parity denominator drifted: expected ${EXPECTED_FREE_APP_COUNT}, found ${englishRows.length}. `
      + 'Reconcile data/tool-directory.json before changing this invariant.'
    );
  }

  const englishByRoute = new Map(englishRows.map((row) => [normalizeRoute(row.url), row]));
  const englishById = new Map(englishRows.map((row) => [row.id, row]));
  const archivedAcceptanceEntries = [
    ...preservedArchivedAcceptanceEntries,
    ...acceptanceEntries.filter((entry) => !englishById.has(entry.englishId))
  ].filter((entry, index, entries) => (
    entries.findIndex((candidate) => candidate.englishId === entry.englishId) === index
  ));
  acceptanceById = new Map(
    acceptanceEntries
      .filter((entry) => englishById.has(entry.englishId))
      .map((entry) => [entry.englishId, entry])
  );
  const englishRouteSet = new Set(englishByRoute.keys());
  const pages = listHtmlFiles(path.join(ROOT, 'sw')).map((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const route = publicRouteFromFile(file);
    const page = {
      route,
      file: path.relative(ROOT, file).replace(/\\/g, '/'),
      html,
      coverage: coverageByRoute.get(route) || null,
      ownerEvidence: new Map()
    };
    addHtmlOwnershipEvidence(page, englishByRoute);
    return page;
  });
  const pageByRoute = new Map(pages.map((page) => [page.route, page]));

  for (const coverage of swCoverage) {
    const page = pageByRoute.get(normalizeRoute(coverage.route));
    const englishRoute = normalizeRoute(coverage.equivalentRoute || '');
    if (page && coverage.equivalentRoute && englishByRoute.has(englishRoute)) {
      addEvidence(page, englishRoute, 'coverage-equivalent-route', coverage.id || coverage.route);
    }
  }
  for (const item of registry.filter((row) => row.lang === 'sw' && row.sourceId)) {
    const english = englishById.get(item.sourceId);
    const page = pageByRoute.get(normalizeRoute(item.href));
    if (english && page) addEvidence(page, normalizeRoute(english.url), 'registry-source-id', item.id);
  }

  const routeConflicts = [];
  const candidatesByEnglishRoute = new Map();
  for (const page of pages) {
    const ownership = chooseEnglishOwner(page);
    if (!ownership.selected) continue;
    if (ownership.conflict) {
      routeConflicts.push({
        swahiliRoute: page.route,
        selectedEnglishRoute: ownership.selected.englishRoute,
        choices: ownership.choices
      });
    }
    const classification = classifySwahiliPage(page, englishRouteSet);
    const candidate = {
      route: page.route,
      file: page.file,
      state: classification.state,
      canonical: classification.canonical,
      flags: classification.flags,
      coverageState: page.coverage ? page.coverage.state : null,
      sourceOwner: page.coverage ? page.coverage.sourceOwner : null,
      engineLocaleNeutral: page.coverage ? Boolean(page.coverage.engineLocaleNeutral) : null,
      ownerWeight: ownership.selected.weight,
      ownerEvidence: ownership.selected.evidence
    };
    if (!candidatesByEnglishRoute.has(ownership.selected.englishRoute)) {
      candidatesByEnglishRoute.set(ownership.selected.englishRoute, []);
    }
    candidatesByEnglishRoute.get(ownership.selected.englishRoute).push(candidate);
  }

  const rows = englishRows.map((english) => {
    const englishRoute = normalizeRoute(english.url);
    const candidates = (candidatesByEnglishRoute.get(englishRoute) || [])
      .sort(primaryCandidateSort(englishRoute));
    const primary = candidates[0] || null;
    const liveOwnerCandidates = candidates.filter((candidate) => candidate.state !== 'alias-utility');
    const acceptance = acceptanceById.get(english.id) || null;
    const accepted = Boolean(
      acceptance
      && acceptance.status === 'accepted'
      && primary
      && ['native-candidate', 'localized-shell-candidate'].includes(primary.state)
      && normalizeRoute(acceptance.swahiliRoute) === primary.route
      && acceptance.evidence
      && acceptance.evidence.browserSpec
      && acceptance.evidence.engineTest
    );
    if (acceptance && acceptance.status === 'accepted' && !accepted) {
      throw new Error(
        `Acceptance evidence for ${english.id} does not match its eligible primary Swahili owner. `
        + `Evidence=${acceptance.swahiliRoute}; primary=${primary ? `${primary.route} (${primary.state})` : 'missing'}.`
      );
    }
    return {
      englishId: english.id,
      englishName: english.name,
      englishRoute,
      categoryKey: english.category_key,
      category: english.category,
      state: primary ? primary.state : 'missing',
      accepted,
      acceptanceEvidence: accepted ? acceptance : null,
      primarySwahiliRoute: primary ? primary.route : null,
      primarySwahiliFile: primary ? primary.file : null,
      sourceOwner: primary ? primary.sourceOwner : null,
      coverageState: primary ? primary.coverageState : null,
      candidates,
      ambiguity: liveOwnerCandidates.length > 1
        ? {
          kind: 'multiple-live-owner-candidates',
          routes: liveOwnerCandidates.map((candidate) => candidate.route)
        }
        : null
    };
  });

  const stateCounts = Object.fromEntries(Object.keys(STATE_LABELS).map((state) => [
    state,
    rows.filter((row) => row.state === state).length
  ]));
  const categories = [...new Set(rows.map((row) => row.category))].map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const counts = Object.fromEntries(Object.keys(STATE_LABELS).map((state) => [
      state,
      categoryRows.filter((row) => row.state === state).length
    ]));
    return {
      category,
      categoryKey: categoryRows[0].categoryKey,
      englishFreeApps: categoryRows.length,
      ...counts,
      accepted: categoryRows.filter((row) => row.accepted).length
    };
  }).sort((a, b) => a.category.localeCompare(b.category));

  const ambiguousRows = rows.filter((row) => row.ambiguity).map((row) => ({
    englishId: row.englishId,
    englishRoute: row.englishRoute,
    category: row.category,
    primarySwahiliRoute: row.primarySwahiliRoute,
    routes: row.ambiguity.routes
  }));
  const unresolvedSwahiliRegistrySourceIds = [...new Set(
    registry
      .filter((row) => row.lang === 'sw' && row.sourceId && !englishById.has(row.sourceId))
      .map((row) => row.sourceId)
  )].sort();
  const mappedStates = stateCounts['native-candidate']
    + stateCounts['localized-shell-candidate']
    + stateCounts['unclassified-candidate'];

  return {
    schemaVersion: 1,
    scope: {
      denominatorSource: 'data/tool-directory.json',
      mappingSources: [
        'data/registry/locale-page-coverage.json',
        'assets/js/components/tool-registry.js',
        'sw/**/*.html',
        'data/audits/swahili-free-app-acceptance.json'
      ],
      acceptanceRule: 'Inventory state is not acceptance. Every row remains fail-closed until app-specific language, product, browser, export, privacy, accessibility and SEO evidence is recorded.',
      stateDefinitions: {
        'native-candidate': 'Coverage metadata marks the Swahili owner native and no transplant, fallback, handoff or alias marker was detected. It still earns zero acceptance credit.',
        'localized-shell-candidate': 'A Swahili-owned localized shell exists, but native app-level parity has not been proved. It earns zero acceptance credit.',
        'english-fallback': 'The route explicitly falls back to English UI or runtime.',
        'english-iframe': 'The Swahili route embeds or fetches an English app surface.',
        'bridge-handoff': 'The Swahili route prepares or explains the workflow, then hands the user to another app.',
        'alias-utility': 'Only an alias, noindex, redirect-like or non-self-canonical Swahili route is available.',
        'unclassified-candidate': 'A mapped Swahili route exists but has no authoritative locale-coverage state.',
        missing: 'No Swahili route owner could be mapped with the accepted evidence sources.'
      }
    },
    totals: {
      canonicalPublishedEnglishRows: directory.length,
      excludedPaidRows: excluded.length,
      englishFreeApps: rows.length,
      swahiliPhysicalHtmlPages: pages.length,
      swahiliCoverageRecords: swCoverage.length,
      ...stateCounts,
      mappedCandidateRows: mappedStates,
      unavailableOrFallbackRows: stateCounts.missing
        + stateCounts['english-fallback']
        + stateCounts['english-iframe']
        + stateCounts['bridge-handoff']
        + stateCounts['alias-utility'],
      accepted: rows.filter((row) => row.accepted).length,
      remainingUnaccepted: rows.filter((row) => !row.accepted).length,
      nativeCandidatePercent: roundPercent(stateCounts['native-candidate'], rows.length)
    },
    categories,
    ambiguities: {
      routeMappingConflicts: routeConflicts.sort((a, b) => a.swahiliRoute.localeCompare(b.swahiliRoute)),
      multipleLiveOwnerCandidates: ambiguousRows,
      unresolvedSwahiliRegistrySourceIds,
      archivedAcceptanceEnglishIds: archivedAcceptanceEntries.map((entry) => entry.englishId).sort()
    },
    rows
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Swahili Free App Parity Inventory',
    '',
    'Generated by `scripts/build-swahili-free-app-parity-inventory.js`.',
    '',
    'This inventory is fail-closed. A native or localized-shell candidate is only a mapped page-shape candidate; it is **not accepted** until its app-specific language, product, calculation, browser, export, privacy, accessibility and SEO evidence passes.',
    '',
    '## Totals',
    '',
    '| Measure | Count |',
    '|---|---:|',
    `| Canonical published English rows | ${report.totals.canonicalPublishedEnglishRows} |`,
    `| Excluded paid rows | ${report.totals.excludedPaidRows} |`,
    `| **Free canonical English apps** | **${report.totals.englishFreeApps}** |`,
    `| Swahili physical HTML pages | ${report.totals.swahiliPhysicalHtmlPages} |`,
    `| Swahili coverage records | ${report.totals.swahiliCoverageRecords} |`,
    `| Native candidates | ${report.totals['native-candidate']} |`,
    `| Localized shell candidates | ${report.totals['localized-shell-candidate']} |`,
    `| English fallbacks | ${report.totals['english-fallback']} |`,
    `| English iframe/transplants | ${report.totals['english-iframe']} |`,
    `| Bridge/handoff | ${report.totals['bridge-handoff']} |`,
    `| Alias/non-indexable utility only | ${report.totals['alias-utility']} |`,
    `| Unclassified candidates | ${report.totals['unclassified-candidate']} |`,
    `| Missing | ${report.totals.missing} |`,
    `| **Accepted** | **${report.totals.accepted}** |`,
    '',
    '## Category reconciliation',
    '',
    '| Category | Apps | Native | Shell | English fallback | Iframe | Bridge | Alias | Unclassified | Missing | Accepted |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'
  ];
  for (const category of report.categories) {
    lines.push(
      `| ${category.category} | ${category.englishFreeApps} | ${category['native-candidate']} | `
      + `${category['localized-shell-candidate']} | ${category['english-fallback']} | ${category['english-iframe']} | `
      + `${category['bridge-handoff']} | ${category['alias-utility']} | ${category['unclassified-candidate']} | `
      + `${category.missing} | ${category.accepted} |`
    );
  }
  lines.push(
    '',
    '## Ambiguous ownership',
    '',
    `- Swahili routes with conflicting owner evidence: ${report.ambiguities.routeMappingConflicts.length}`,
    `- English apps with multiple live Swahili owner candidates: ${report.ambiguities.multipleLiveOwnerCandidates.length}`,
    `- Swahili registry source IDs outside the free denominator: ${report.ambiguities.unresolvedSwahiliRegistrySourceIds.length}`,
    `- Archived acceptance entries outside the current denominator: ${report.ambiguities.archivedAcceptanceEnglishIds.length}`,
    '',
    'Conflicts are preserved in the JSON report. Locale coverage outranks registry metadata, which outranks hreflang and direct-path hints. Runtime transplants remain explicit product deficits.',
    '',
    `## Full ${EXPECTED_FREE_APP_COUNT.toLocaleString('en-US')}-row ledger`,
    '',
    '| English app | Category | English route | State | Primary Swahili route | Accepted |',
    '|---|---|---|---|---|---:|'
  );
  for (const row of report.rows) {
    lines.push(
      `| ${row.englishName.replace(/\|/g, '\\|')} | ${row.category} | \`${row.englishRoute}\` | `
      + `${STATE_LABELS[row.state]} | ${row.primarySwahiliRoute ? `\`${row.primarySwahiliRoute}\`` : 'None'} | ${row.accepted ? 'Yes' : 'No'} |`
    );
  }
  return `${lines.join('\n')}\n`;
}

function stableJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function checkOutput(file, expected) {
  if (!fs.existsSync(file)) {
    throw new Error(`${path.relative(ROOT, file)} is missing. Run npm run sw:parity:build.`);
  }
  if (fs.readFileSync(file, 'utf8') !== expected) {
    throw new Error(`${path.relative(ROOT, file)} is stale. Run npm run sw:parity:build.`);
  }
}

function main() {
  const report = buildReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  if (process.argv.includes('--write')) {
    fs.writeFileSync(JSON_OUTPUT_PATH, json, 'utf8');
    fs.writeFileSync(MARKDOWN_OUTPUT_PATH, markdown, 'utf8');
  } else if (process.argv.includes('--check')) {
    checkOutput(JSON_OUTPUT_PATH, json);
    checkOutput(MARKDOWN_OUTPUT_PATH, markdown);
  }
  console.log(
    `Swahili free-app parity: ${report.totals.englishFreeApps} English free apps; `
    + `${report.totals['native-candidate']} native candidates; `
    + `${report.totals['localized-shell-candidate']} localized shells; `
    + `${report.totals['english-fallback']} English fallbacks; `
    + `${report.totals['english-iframe']} English iframe/transplants; `
    + `${report.totals['bridge-handoff']} bridges; `
    + `${report.totals['alias-utility']} aliases; `
    + `${report.totals['unclassified-candidate']} unclassified; `
    + `${report.totals.missing} missing; ${report.totals.accepted} accepted.`
  );
}

if (require.main === module) main();

module.exports = {
  EXPECTED_FREE_APP_COUNT,
  STATE_LABELS,
  buildReport,
  classifySwahiliPage,
  normalizeRoute,
  renderMarkdown
};
