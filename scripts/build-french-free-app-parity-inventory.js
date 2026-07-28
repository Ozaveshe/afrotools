'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const LEGACY_LEDGER_PATH = path.join(ROOT, 'reports', 'french-localization-ledger.json');
const JSON_OUTPUT_PATH = path.join(ROOT, 'reports', 'french-free-app-parity-inventory.json');
const MARKDOWN_OUTPUT_PATH = path.join(ROOT, 'reports', 'french-free-app-parity-inventory.md');
const EXPECTED_FREE_APP_COUNT = 1257;
const EXCLUDED_PAID_ROUTES = new Set(['/pro']);

const STATE_LABELS = {
  'native-candidate': 'Native candidate',
  'english-iframe': 'English iframe/transplant',
  'bridge-handoff': 'Bridge/handoff',
  'alias-utility': 'Alias/non-indexable utility',
  missing: 'Missing'
};

const EVIDENCE_WEIGHTS = {
  'runtime-iframe': 100,
  'runtime-html-fetch': 95,
  'registry-source-id': 90,
  'hreflang-en': 80,
  'schema-is-based-on': 75,
  'direct-fr-path': 70,
  'legacy-ledger': 50
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeRoute(value) {
  let route = String(value || '').trim();
  route = route.replace(/^https?:\/\/[^/]+/i, '');
  route = route.split(/[?#]/)[0];
  if (!route.startsWith('/')) route = `/${route}`;
  route = route.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  route = route.replace(/\/+/g, '/');
  return route === '/' ? '/' : route.replace(/\/+$/, '');
}

function publicRouteFromFile(file) {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  if (relative === 'fr/index.html') return '/fr';
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

function hasEnglishIframe(html, englishRouteSet) {
  return extractRoutes(html, /<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi)
    .some((route) => englishRouteSet.has(route));
}

function hasEnglishHtmlFetch(html, englishRouteSet) {
  return extractRoutes(html, /\bfetch\s*\(\s*["']([^"']+)["']/gi)
    .some((route) => englishRouteSet.has(route));
}

function classifyFrenchPage(page, englishRouteSet) {
  const html = page.html;
  const canonical = normalizeRoute(extractFirst(
    html,
    /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i
  ) || page.route);
  const noindex = /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
  const redirectLike = /<meta\b[^>]*\bhttp-equiv=["']refresh["']/i.test(html);
  const canonicalMismatch = canonical !== page.route;

  if (noindex || redirectLike || canonicalMismatch) {
    return {
      state: 'alias-utility',
      flags: {
        noindex,
        redirectLike,
        canonicalMismatch,
        englishIframe: false,
        englishHtmlFetch: false,
        generatedBridge: false
      },
      canonical
    };
  }

  const englishIframe = hasEnglishIframe(html, englishRouteSet);
  const englishHtmlFetch = hasEnglishHtmlFetch(html, englishRouteSet);
  if (englishIframe || englishHtmlFetch) {
    return {
      state: 'english-iframe',
      flags: {
        noindex: false,
        redirectLike: false,
        canonicalMismatch: false,
        englishIframe,
        englishHtmlFetch,
        generatedBridge: false
      },
      canonical
    };
  }

  const generatedBridge = /class=["'][^"']*(?:source-launch|prep-panel)\b/i.test(html)
    || /\bdata-fr-prep\b/i.test(html)
    || /<meta\b[^>]*\bname=["']afrotools-source-owner["'][^>]*\bcontent=["']scripts\/generate-fr-tool-gap-pages\.js["']/i.test(html)
      && !/\blobola-native\b/i.test(html);
  if (generatedBridge) {
    return {
      state: 'bridge-handoff',
      flags: {
        noindex: false,
        redirectLike: false,
        canonicalMismatch: false,
        englishIframe: false,
        englishHtmlFetch: false,
        generatedBridge: true
      },
      canonical
    };
  }

  return {
    state: 'native-candidate',
    flags: {
      noindex: false,
      redirectLike: false,
      canonicalMismatch: false,
      englishIframe: false,
      englishHtmlFetch: false,
      generatedBridge: false
    },
    canonical
  };
}

function addEvidence(page, englishRoute, kind, detail) {
  if (!page.ownerEvidence.has(englishRoute)) page.ownerEvidence.set(englishRoute, []);
  const evidence = page.ownerEvidence.get(englishRoute);
  if (!evidence.some((item) => item.kind === kind && item.detail === detail)) {
    evidence.push({ kind, detail });
  }
}

function addHtmlOwnershipEvidence(page, englishByRoute) {
  const html = page.html;
  const addMatches = (pattern, kind) => {
    for (const route of extractRoutes(html, pattern)) {
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

  const directEnglishRoute = normalizeRoute(page.route.replace(/^\/fr(?=\/|$)/, ''));
  if (englishByRoute.has(directEnglishRoute)) {
    addEvidence(page, directEnglishRoute, 'direct-fr-path', directEnglishRoute);
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

function segmentCount(route) {
  return route.split('/').filter(Boolean).length;
}

function primaryCandidateSort(englishRoute) {
  return (a, b) => {
    const aliasDelta = Number(a.state === 'alias-utility') - Number(b.state === 'alias-utility');
    if (aliasDelta) return aliasDelta;
    const directA = normalizeRoute(a.route.replace(/^\/fr(?=\/|$)/, '')) === englishRoute;
    const directB = normalizeRoute(b.route.replace(/^\/fr(?=\/|$)/, '')) === englishRoute;
    if (directA !== directB) return directA ? -1 : 1;
    const depthDelta = segmentCount(a.route) - segmentCount(b.route);
    if (depthDelta) return depthDelta;
    const registryA = a.ownerEvidence.some((item) => item.kind === 'registry-source-id');
    const registryB = b.ownerEvidence.some((item) => item.kind === 'registry-source-id');
    if (registryA !== registryB) return registryA ? -1 : 1;
    const weightDelta = b.ownerWeight - a.ownerWeight;
    if (weightDelta) return weightDelta;
    return a.route.localeCompare(b.route);
  };
}

function roundPercent(value, total) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function buildReport() {
  const directory = readJson(DIRECTORY_PATH);
  const registry = loadRegistry();
  const excluded = directory.filter((row) => EXCLUDED_PAID_ROUTES.has(normalizeRoute(row.url)));
  const englishRows = directory.filter((row) => !EXCLUDED_PAID_ROUTES.has(normalizeRoute(row.url)));
  if (englishRows.length !== EXPECTED_FREE_APP_COUNT) {
    throw new Error(
      `French parity denominator drifted: expected ${EXPECTED_FREE_APP_COUNT}, found ${englishRows.length}. `
      + 'Reconcile data/tool-directory.json before changing this invariant.'
    );
  }

  const englishByRoute = new Map(englishRows.map((row) => [normalizeRoute(row.url), row]));
  const englishById = new Map(englishRows.map((row) => [row.id, row]));
  const englishRouteSet = new Set(englishByRoute.keys());
  const pages = listHtmlFiles(path.join(ROOT, 'fr')).map((file) => {
    const html = fs.readFileSync(file, 'utf8');
    const route = publicRouteFromFile(file);
    const page = {
      route,
      file: path.relative(ROOT, file).replace(/\\/g, '/'),
      html,
      ownerEvidence: new Map()
    };
    addHtmlOwnershipEvidence(page, englishByRoute);
    return page;
  });
  const pageByRoute = new Map(pages.map((page) => [page.route, page]));

  for (const item of registry.filter((row) => row.lang === 'fr' && row.sourceId)) {
    const english = englishById.get(item.sourceId);
    const page = pageByRoute.get(normalizeRoute(item.href));
    if (english && page) {
      addEvidence(page, normalizeRoute(english.url), 'registry-source-id', item.id);
    }
  }

  if (fs.existsSync(LEGACY_LEDGER_PATH)) {
    const legacy = readJson(LEGACY_LEDGER_PATH);
    for (const item of legacy.routes || []) {
      if (item.englishSource === null || item.englishSource === undefined || item.englishSource === '') continue;
      const englishRoute = normalizeRoute(item.englishSource);
      const page = pageByRoute.get(normalizeRoute(item.route));
      if (page && englishByRoute.has(englishRoute)) {
        addEvidence(page, englishRoute, 'legacy-ledger', item.file || item.route);
      }
    }
  }

  const routeConflicts = [];
  const candidatesByEnglishRoute = new Map();
  for (const page of pages) {
    const ownership = chooseEnglishOwner(page);
    if (!ownership.selected) continue;
    if (ownership.conflict) {
      routeConflicts.push({
        frenchRoute: page.route,
        selectedEnglishRoute: ownership.selected.englishRoute,
        choices: ownership.choices
      });
    }
    const classification = classifyFrenchPage(page, englishRouteSet);
    const candidate = {
      route: page.route,
      file: page.file,
      state: classification.state,
      canonical: classification.canonical,
      flags: classification.flags,
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
    return {
      englishId: english.id,
      englishName: english.name,
      englishRoute,
      categoryKey: english.category_key,
      category: english.category,
      state: primary ? primary.state : 'missing',
      accepted: false,
      primaryFrenchRoute: primary ? primary.route : null,
      primaryFrenchFile: primary ? primary.file : null,
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
      accepted: 0
    };
  }).sort((a, b) => a.category.localeCompare(b.category));

  const ambiguousRows = rows.filter((row) => row.ambiguity).map((row) => ({
    englishId: row.englishId,
    englishRoute: row.englishRoute,
    category: row.category,
    primaryFrenchRoute: row.primaryFrenchRoute,
    routes: row.ambiguity.routes
  }));
  const unresolvedFrenchRegistrySourceIds = [...new Set(
    registry
      .filter((row) => row.lang === 'fr' && row.sourceId && !englishById.has(row.sourceId))
      .map((row) => row.sourceId)
  )].sort();

  return {
    schemaVersion: 1,
    scope: {
      denominatorSource: 'data/tool-directory.json',
      mappingSources: [
        'assets/js/components/tool-registry.js',
        'fr/**/*.html',
        'reports/french-localization-ledger.json'
      ],
      acceptanceRule: 'Inventory state is not acceptance. Every row remains fail-closed until app-specific product, browser, export, privacy, accessibility and SEO evidence is recorded.',
      stateDefinitions: {
        'native-candidate': 'A French route has no detected English iframe/transplant, generated handoff shell or alias marker. It still earns zero acceptance credit.',
        'english-iframe': 'The French route embeds or fetches an English app surface. Dynamic HTML transplants are included in this state.',
        'bridge-handoff': 'The French route prepares inputs or explains the workflow, then hands the user to another app instead of providing native parity.',
        'alias-utility': 'Only an alias, noindex, redirect-like or non-self-canonical French route is available.',
        missing: 'No French route owner could be mapped with the accepted evidence sources.'
      }
    },
    totals: {
      canonicalPublishedEnglishRows: directory.length,
      excludedPaidRows: excluded.length,
      englishFreeApps: rows.length,
      ...stateCounts,
      definiteBuildGaps: rows.length - stateCounts['native-candidate'],
      accepted: 0,
      nativeCandidatePercent: roundPercent(stateCounts['native-candidate'], rows.length)
    },
    categories,
    ambiguities: {
      routeMappingConflicts: routeConflicts.sort((a, b) => a.frenchRoute.localeCompare(b.frenchRoute)),
      multipleLiveOwnerCandidates: ambiguousRows,
      unresolvedFrenchRegistrySourceIds
    },
    rows
  };
}

function renderMarkdown(report) {
  const lines = [
    '# French Free App Parity Inventory',
    '',
    'Generated by `scripts/build-french-free-app-parity-inventory.js`.',
    '',
    'This inventory is fail-closed. A native candidate is only a page-shape candidate; it is **not accepted** until its app-specific product, calculation, browser, export, privacy, accessibility and SEO evidence passes.',
    '',
    '## Totals',
    '',
    '| Measure | Count |',
    '|---|---:|',
    `| Canonical published English rows | ${report.totals.canonicalPublishedEnglishRows} |`,
    `| Excluded paid rows | ${report.totals.excludedPaidRows} |`,
    `| **Free canonical English apps** | **${report.totals.englishFreeApps}** |`,
    `| Native candidates (unaccepted) | ${report.totals['native-candidate']} |`,
    `| English iframe/transplant | ${report.totals['english-iframe']} |`,
    `| Bridge/handoff | ${report.totals['bridge-handoff']} |`,
    `| Alias/non-indexable utility only | ${report.totals['alias-utility']} |`,
    `| Missing | ${report.totals.missing} |`,
    `| Definite product-build gaps | ${report.totals.definiteBuildGaps} |`,
    `| **Accepted** | **${report.totals.accepted}** |`,
    '',
    '## Category reconciliation',
    '',
    '| Category | English free apps | Native candidate | English iframe | Bridge/handoff | Alias/utility | Missing | Accepted |',
    '|---|---:|---:|---:|---:|---:|---:|---:|'
  ];
  for (const category of report.categories) {
    lines.push(
      `| ${category.category} | ${category.englishFreeApps} | ${category['native-candidate']} | `
      + `${category['english-iframe']} | ${category['bridge-handoff']} | ${category['alias-utility']} | `
      + `${category.missing} | ${category.accepted} |`
    );
  }
  lines.push(
    `| **Total** | **${report.totals.englishFreeApps}** | **${report.totals['native-candidate']}** | `
    + `**${report.totals['english-iframe']}** | **${report.totals['bridge-handoff']}** | `
    + `**${report.totals['alias-utility']}** | **${report.totals.missing}** | **${report.totals.accepted}** |`,
    '',
    '## Ambiguous ownership',
    '',
    `- French routes with conflicting owner evidence: ${report.ambiguities.routeMappingConflicts.length}`,
    `- English apps with multiple live French owner candidates: ${report.ambiguities.multipleLiveOwnerCandidates.length}`,
    `- French registry source IDs not found in the free English denominator: ${report.ambiguities.unresolvedFrenchRegistrySourceIds.length}`,
    '',
    'Conflicts are preserved in the JSON report. Runtime iframe/transplant evidence outranks registry metadata, which outranks hreflang and legacy-ledger hints. This prevents a stale mapping from granting parity credit.',
    ''
  );
  if (report.ambiguities.routeMappingConflicts.length) {
    lines.push(
      '### Conflicting route evidence',
      '',
      '| French route | Selected English owner | Other claimed owners |',
      '|---|---|---|'
    );
    for (const conflict of report.ambiguities.routeMappingConflicts) {
      const otherOwners = conflict.choices
        .filter((choice) => choice.englishRoute !== conflict.selectedEnglishRoute)
        .map((choice) => `\`${choice.englishRoute}\` (${choice.evidence.map((item) => item.kind).join(', ')})`)
        .join('<br>');
      lines.push(`| \`${conflict.frenchRoute}\` | \`${conflict.selectedEnglishRoute}\` | ${otherOwners} |`);
    }
    lines.push('');
  }
  if (report.ambiguities.multipleLiveOwnerCandidates.length) {
    lines.push(
      '### Multiple live French candidates',
      '',
      '| English app | Selected French owner | Other live candidates |',
      '|---|---|---|'
    );
    for (const item of report.ambiguities.multipleLiveOwnerCandidates) {
      const others = item.routes
        .filter((route) => route !== item.primaryFrenchRoute)
        .map((route) => `\`${route}\``)
        .join('<br>');
      lines.push(`| \`${item.englishRoute}\` | \`${item.primaryFrenchRoute}\` | ${others} |`);
    }
    lines.push('');
  }
  if (report.ambiguities.unresolvedFrenchRegistrySourceIds.length) {
    lines.push(
      '### Registry source IDs outside the denominator',
      '',
      ...report.ambiguities.unresolvedFrenchRegistrySourceIds.map((sourceId) => `- \`${sourceId}\``),
      ''
    );
  }
  lines.push(
    '## Full 1,257-row ledger',
    '',
    '| English app | Category | English route | State | Primary French route | Accepted |',
    '|---|---|---|---|---|---:|'
  );
  for (const row of report.rows) {
    lines.push(
      `| ${row.englishName.replace(/\|/g, '\\|')} | ${row.category} | \`${row.englishRoute}\` | `
      + `${STATE_LABELS[row.state]} | ${row.primaryFrenchRoute ? `\`${row.primaryFrenchRoute}\`` : 'None'} | No |`
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function stableJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function checkOutput(file, expected) {
  if (!fs.existsSync(file)) {
    throw new Error(`${path.relative(ROOT, file)} is missing. Run npm run fr:parity:build.`);
  }
  const actual = fs.readFileSync(file, 'utf8');
  if (actual !== expected) {
    throw new Error(`${path.relative(ROOT, file)} is stale. Run npm run fr:parity:build.`);
  }
}

function main() {
  const report = buildReport();
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');

  if (write) {
    fs.writeFileSync(JSON_OUTPUT_PATH, json, 'utf8');
    fs.writeFileSync(MARKDOWN_OUTPUT_PATH, markdown, 'utf8');
  } else if (check) {
    checkOutput(JSON_OUTPUT_PATH, json);
    checkOutput(MARKDOWN_OUTPUT_PATH, markdown);
  }

  console.log(
    `French free-app parity: ${report.totals.englishFreeApps} English free apps; `
    + `${report.totals['native-candidate']} native candidates; `
    + `${report.totals['english-iframe']} English iframe/transplants; `
    + `${report.totals['bridge-handoff']} bridges; `
    + `${report.totals['alias-utility']} aliases/utilities; `
    + `${report.totals.missing} missing; ${report.totals.accepted} accepted.`
  );
}

if (require.main === module) main();

module.exports = {
  EXPECTED_FREE_APP_COUNT,
  STATE_LABELS,
  buildReport,
  classifyFrenchPage,
  normalizeRoute,
  renderMarkdown
};
