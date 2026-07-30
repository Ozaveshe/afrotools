'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildStaticExportContract } = require('./lib/french-finance-export-contract');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY_PATH = path.join(ROOT, 'reports', 'french-free-app-parity-inventory.json');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'french-finance-tax-market-data.json');
const EVIDENCE_JSON_PATH = path.join(ROOT, 'reports', 'french-finance-tax-market-data-evidence.json');
const EVIDENCE_MD_PATH = path.join(ROOT, 'reports', 'french-finance-tax-market-data-evidence.md');
const ARTWORK_MD_PATH = path.join(ROOT, 'reports', 'french-finance-tax-market-data-missing-artwork.md');
const BROWSER_PATH = path.join(ROOT, 'reports', 'french-finance-tax-market-data-browser-evidence.json');
const AI_EVAL_PATH = path.join(ROOT, 'data', 'ai', 'french-finance-route-eval.json');
const CATEGORY = 'Finance, Tax & Market Data';
const EXCLUDED_CATEGORY = 'VAT & Business Tax';
const EXPECTED_ROWS = 132;
const EXPECTED_VAT_ROWS = 63;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  if (!route || route === '/') return '/';
  return `/${route.replace(/^\/+|\/+$/g, '')}`;
}

function routeWithSlash(value) {
  const route = normalizeRoute(value);
  return route === '/' ? route : `${route}/`;
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
  if (!Array.isArray(sandbox.AFRO_TOOLS)) throw new Error('Tool registry did not expose AFRO_TOOLS');
  return sandbox.AFRO_TOOLS;
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function localFileFromAsset(assetUrl) {
  if (!assetUrl) return null;
  const pathname = String(assetUrl).replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0];
  return pathname.startsWith('/') ? path.join(ROOT, pathname.replace(/^\/+/, '').replace(/\//g, path.sep)) : null;
}

function groupFor(row) {
  const value = `${row.englishId} ${row.englishName} ${row.englishRoute}`.toLowerCase();
  if (/paye|payroll|salary|wage|pension|leave|overtime|social-security|nssf|nhf|uif|gepf/.test(value)) return 'payroll';
  if (/tax|cgt|wht|duty|stamp|fiscal|withholding|tithe|zakat/.test(value)) return 'tax';
  if (/mortgage|property|rent|home|loan|lease|land/.test(value)) return 'property';
  if (/currency|forex|exchange|fx|rate|inflation|market|stock|crypto/.test(value)) return 'market';
  if (/saving|investment|return|retirement|fund|wealth|interest/.test(value)) return 'savings';
  return 'finance';
}

function inspectRow(row, registryByRoute, browserByRoute) {
  const filePath = path.join(ROOT, row.primaryFrenchFile);
  const exists = fs.existsSync(filePath);
  const html = exists ? fs.readFileSync(filePath, 'utf8') : '';
  const frenchRoute = normalizeRoute(row.primaryFrenchRoute);
  const englishRoute = normalizeRoute(row.englishRoute);
  const registryOwner = registryByRoute.get(englishRoute) || null;
  const canonical = normalizeRoute(extract(
    html,
    /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i
  ));
  const ogUrl = normalizeRoute(extract(
    html,
    /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i
  ));
  const ogImage = extract(
    html,
    /<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i
  );
  const artworkFile = localFileFromAsset(ogImage);
  const h1 = stripTags(extract(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i));
  const title = stripTags(extract(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i));
  const description = stripTags(extract(
    html,
    /<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i
  ));
  const schemaBlocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
  const scriptOwners = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1].split(/[?#]/)[0])
    .filter((src) => /\/(?:engines|pages|lib)\//.test(src));
  const browser = browserByRoute.get(frenchRoute) || null;
  const staticExportContract = buildStaticExportContract(ROOT, row, html);
  const browserExportContract = browser && browser.exportContract ? browser.exportContract : null;
  const exportContract = browserExportContract
    ? {
        ...staticExportContract,
        ...browserExportContract,
        classification: staticExportContract.classification,
        englishOwner: staticExportContract.englishOwner,
        frenchOwner: staticExportContract.frenchOwner,
        missingFrenchFormats: staticExportContract.missingFrenchFormats
      }
    : staticExportContract;
  const textForChecks = html
    .replace(/&eacute;|&#233;/gi, 'é').replace(/&egrave;|&#232;/gi, 'è')
    .replace(/&agrave;|&#224;/gi, 'à').replace(/&ocirc;|&#244;/gi, 'ô')
    .replace(/&ucirc;|&#251;/gi, 'û').replace(/&ccedil;|&#231;/gi, 'ç')
    .replace(/&rsquo;|&#8217;/gi, '’');
  const guideWorkflow = /(?:^|-)(?:guide|efiling)(?:-|$)|etims|itax|cnps/.test(row.englishId);
  const freshnessRequired = /paye|minimum-wage|(?:^|-)tax(?:-|$)|cgt|wht|nssf|nhf|uif|gepf|afrorates|interest-rate|crypto\/(?:contract-scanner|prices|stablecoins|exchange-ratings|scam-checker|portfolio)|salary-intelligence|social-security/.test(
    `${row.englishId} ${row.englishRoute}`.toLowerCase()
  );
  const sourceRequired = freshnessRequired || /address-validator/.test(row.englishId);
  const contractRegistry = row.englishId === 'contract-scanner'
    ? readJson(path.join(ROOT, 'data', 'crypto', 'scam-reports.json'))
    : null;
  const dynamicFreshness = Boolean(
    contractRegistry
    && /^\d{4}-\d{2}-\d{2}$/.test(contractRegistry.reviewedAt || '')
    && /contract-address-evidence\.js/i.test(html)
  );
  function hasExportAction(kind) {
    const token = kind === 'txt' ? '(?:txt|texte)' : kind;
    return new RegExp(`<(?:button|a)\\b[^>]*(?:data-${kind}|id=["'][^"']*${kind}[^"']*["'])[^>]*>|<(?:button|a)\\b[^>]*>[^<]*${token}`, 'i').test(html);
  }
  const features = {
    calculate: /<form\b|data-(?:action|calculate)|\b(?:calculer|estimer|comparer|projeter)\b/i.test(html),
    reset: /\b(?:reset|réinitialiser|effacer|clear)\b/i.test(html),
    copy: /\b(?:copy|copier)\b/i.test(html),
    share: /\b(?:share|partager)\b/i.test(html),
    save: /\b(?:save|enregistrer|sauvegarder)\b/i.test(html),
    privacy: /\b(?:confidentialité|privé|localement|navigateur|privacy)\b/i.test(html),
    pdf: hasExportAction('pdf'),
    csv: hasExportAction('csv'),
    json: hasExportAction('json'),
    txt: hasExportAction('txt')
  };
  const checks = {
    fileExists: exists,
    nativeRuntime: row.state === 'native-candidate'
      && !/<iframe\b[^>]*\bsrc=["'][^"']*\/tools\//i.test(html)
      && !/\bfetch\s*\(\s*["']\/tools\//i.test(html)
      && !/\bdata-fr-prep\b|source-launch|prep-panel/i.test(html),
    frenchDocument: /<html\b[^>]*\blang=["']fr(?:-[^"']+)?["']/i.test(html),
    frenchUi: /[àâçéèêëîïôùûüÿœæ]/i.test(`${title} ${h1} ${textForChecks}`)
      || /\b(?:calcul|guide|outil|cette|comparez|préparez|réserve|impôt|salaire|française)\b/i.test(`${title} ${h1}`),
    interactive: guideWorkflow
      ? /<main\b/i.test(html) && /<a\b[^>]*href=["'][^"']+/i.test(html)
      : /<(?:form|input|select|textarea|button)\b/i.test(html),
    selfCanonical: canonical === frenchRoute,
    selfOgUrl: ogUrl === frenchRoute,
    hreflangEn: /<link\b(?=[^>]*\brel=["'][^"']*\balternate\b)(?=[^>]*\bhreflang=["']en["'])/i.test(html),
    hreflangFr: /<link\b(?=[^>]*\brel=["'][^"']*\balternate\b)(?=[^>]*\bhreflang=["']fr["'])/i.test(html),
    hreflangDefault: /<link\b(?=[^>]*\brel=["'][^"']*\balternate\b)(?=[^>]*\bhreflang=["']x-default["'])/i.test(html),
    schemaFrench: schemaBlocks.some((block) => (
      /["']inLanguage["']\s*:\s*["']fr(?:-[^"']+)?["']/i.test(block)
      || /["']inLanguage["']\s*:\s*\[[^\]]*["']fr(?:-[^"']+)?["'][^\]]*\]/i.test(block)
    )),
    frenchInternalLink: /href=["']\/fr\//i.test(html),
    sourceDisclosure: !sourceRequired || /\b(?:source|sources|données|barème|taux vérifié|vérifié le|mise à jour)\b/i.test(textForChecks)
      || /<a\b[^>]*href=["']https?:\/\//i.test(html),
    freshnessDisclosure: !freshnessRequired || dynamicFreshness
      || /\b(?:vérifié|vérification|mise à jour|actualisé|checked|sourceDate|asOf|202[4-9])\b/i.test(textForChecks),
    limitationDisclosure: /\b(?:estimation|indicatif|planification|ne constitue pas|vérifiez|hypothèse|limite|non calculé|aucun|aucune|n['’]est pas|ne [^.!?]{0,60} pas|reste bloqué|volontairement)\b/i.test(textForChecks),
    artworkDeclared: Boolean(ogImage),
    artworkExists: Boolean(artworkFile && fs.existsSync(artworkFile)),
    registryOwner: Boolean(registryOwner),
    browserPassed: Boolean(browser && browser.passed === true && browser.workflowPassed === true),
    exportsParsed: exportContract.finalStatus === 'accepted'
  };
  const requiredChecks = [
    'fileExists', 'nativeRuntime', 'frenchDocument', 'frenchUi', 'interactive',
    'selfCanonical', 'selfOgUrl', 'hreflangEn', 'hreflangFr', 'hreflangDefault',
    'schemaFrench', 'frenchInternalLink', 'sourceDisclosure', 'freshnessDisclosure',
    'limitationDisclosure', 'artworkDeclared', 'artworkExists', 'registryOwner',
    'browserPassed'
  ];
  if (exportContract.classification !== 'notApplicable') requiredChecks.push('exportsParsed');
  const failedChecks = requiredChecks.filter((name) => !checks[name]);
  return {
    englishId: row.englishId,
    englishName: row.englishName,
    englishRoute,
    frenchRoute,
    frenchFile: row.primaryFrenchFile,
    frenchName: h1 || title || row.englishName,
    frenchDescription: description || `Outil financier disponible en français : ${h1 || title || row.englishName}.`,
    categoryGroup: groupFor(row),
    countries: registryOwner && Array.isArray(registryOwner.countries) ? registryOwner.countries : [],
    icon: registryOwner ? registryOwner.icon || '🧮' : '🧮',
    imageId: registryOwner ? registryOwner.imageId || registryOwner.sourceId || registryOwner.id : row.englishId,
    ogImage,
    artworkFile: artworkFile ? path.relative(ROOT, artworkFile).replace(/\\/g, '/') : null,
    registryId: registryOwner ? registryOwner.id : null,
    implementationOwners: scriptOwners,
    sourceMode: freshnessRequired ? 'reviewed-external-data' : sourceRequired ? 'technical-reference' : guideWorkflow ? 'official-guide-links' : 'user-supplied-inputs',
    features,
    exportContract,
    checks,
    failedChecks,
    accepted: failedChecks.length === 0
  };
}

function toManifestRow(row) {
  return {
    englishId: row.englishId,
    englishRoute: normalizeRoute(row.englishRoute),
    frenchRoute: normalizeRoute(row.frenchRoute),
    frenchName: row.frenchName,
    frenchDescription: row.frenchDescription,
    categoryGroup: row.categoryGroup,
    countries: row.countries,
    icon: row.icon,
    imageId: row.imageId,
    imageUrl: row.ogImage,
    implementationOwners: row.implementationOwners,
    exportContract: row.exportContract
  };
}

function renderEvidenceMarkdown(report) {
  const lines = [
    '# French Finance, Tax & Market Data parity receipt',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Scope: ${report.totals.rows}/${EXPECTED_ROWS} English free canonical apps. The separate VAT & Business Tax lane is ${report.totals.vatRows}/${EXPECTED_VAT_ROWS} and has ${report.totals.overlapWithVat} canonical-route overlaps.`,
    '',
    `Acceptance is fail-closed: ${report.totals.accepted} accepted; ${report.totals.failed} remain blocked. Route presence or native-candidate classification alone earns no credit.`,
    '',
    '| # | English owner | French app | Runtime | SEO/schema | Sources | Artwork | Browser/exports | Result |',
    '|---:|---|---|---|---|---|---|---|---|'
  ];
  report.rows.forEach((row, index) => {
    const seo = row.checks.selfCanonical && row.checks.selfOgUrl && row.checks.hreflangEn
      && row.checks.hreflangFr && row.checks.hreflangDefault && row.checks.schemaFrench;
    const sources = row.checks.sourceDisclosure && row.checks.freshnessDisclosure && row.checks.limitationDisclosure;
    const hasExport = row.features.pdf || row.features.csv || row.features.json || row.features.txt;
    const browser = row.checks.browserPassed && (!hasExport || row.checks.exportsParsed);
    lines.push(`| ${index + 1} | \`${row.englishRoute}\` | \`${row.frenchRoute}\` | ${row.checks.nativeRuntime ? 'PASS' : 'FAIL'} | ${seo ? 'PASS' : 'FAIL'} | ${sources ? 'PASS' : 'FAIL'} | ${row.checks.artworkExists ? 'PASS' : 'FAIL'} | ${browser ? 'PASS' : 'FAIL'} | ${row.accepted ? 'ACCEPTED' : `BLOCKED: ${row.failedChecks.join(', ')}`} |`);
  });
  lines.push('', '## Shared implementation owners', '');
  const owners = new Map();
  report.rows.forEach((row) => row.implementationOwners.forEach((owner) => {
    if (!owners.has(owner)) owners.set(owner, []);
    owners.get(owner).push(row.frenchRoute);
  }));
  [...owners.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([owner, routes]) => {
    lines.push(`- \`${owner}\`: ${routes.length} scoped route${routes.length === 1 ? '' : 's'}.`);
  });
  return `${lines.join('\n')}\n`;
}

function renderArtworkMarkdown(report) {
  const missing = report.rows.filter((row) => !row.checks.artworkExists);
  const lines = [
    '# French Finance, Tax & Market Data missing artwork',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `${missing.length} of ${report.rows.length} scoped French apps lack a resolvable declared Open Graph artwork file.`,
    ''
  ];
  if (!missing.length) {
    lines.push('No missing artwork detected.');
  } else {
    lines.push('| French app | Declared artwork | Suggested image id |', '|---|---|---|');
    missing.forEach((row) => lines.push(`| \`${row.frenchRoute}\` | ${row.ogImage ? `\`${row.ogImage}\`` : 'not declared'} | \`${row.imageId}\` |`));
  }
  return `${lines.join('\n')}\n`;
}

function build() {
  const inventory = readJson(INVENTORY_PATH);
  const scopeRows = inventory.rows.filter((row) => row.category === CATEGORY);
  const vatRows = inventory.rows.filter((row) => row.category === EXCLUDED_CATEGORY);
  if (scopeRows.length !== EXPECTED_ROWS) throw new Error(`Expected ${EXPECTED_ROWS} ${CATEGORY} rows; found ${scopeRows.length}`);
  if (vatRows.length !== EXPECTED_VAT_ROWS) throw new Error(`Expected ${EXPECTED_VAT_ROWS} ${EXCLUDED_CATEGORY} rows; found ${vatRows.length}`);
  const scopeRoutes = new Set(scopeRows.map((row) => normalizeRoute(row.englishRoute)));
  const overlaps = vatRows.filter((row) => scopeRoutes.has(normalizeRoute(row.englishRoute)));
  if (overlaps.length) throw new Error(`Finance/VAT route overlap must be explicitly empty; found ${overlaps.map((row) => row.englishRoute).join(', ')}`);

  const registry = loadRegistry();
  const registryByRoute = new Map();
  registry.forEach((tool) => {
    const route = normalizeRoute(tool.href);
    if (!registryByRoute.has(route) || tool.status === 'live') registryByRoute.set(route, tool);
  });
  const browser = fs.existsSync(BROWSER_PATH) ? readJson(BROWSER_PATH) : { rows: [] };
  const browserByRoute = new Map((browser.rows || []).map((row) => [normalizeRoute(row.frenchRoute), row]));
  const rows = scopeRows.map((row) => inspectRow(row, registryByRoute, browserByRoute))
    .sort((a, b) => a.englishRoute.localeCompare(b.englishRoute));
  const accepted = rows.filter((row) => row.accepted).length;
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scope: {
      category: CATEGORY,
      excludedCategory: EXCLUDED_CATEGORY,
      expectedRows: EXPECTED_ROWS,
      acceptanceRule: 'Fail closed. A row requires native French runtime, registry ownership, French UI, interactive workflow, self canonical and OG URL, en/fr/x-default hreflang, French schema, French internal links, source/freshness/limitations, artwork, browser proof, and parsed export proof when the app exposes exports.',
      browserEvidence: fs.existsSync(BROWSER_PATH) ? path.relative(ROOT, BROWSER_PATH).replace(/\\/g, '/') : null
    },
    totals: {
      rows: rows.length,
      vatRows: vatRows.length,
      overlapWithVat: overlaps.length,
      nativeRuntime: rows.filter((row) => row.checks.nativeRuntime).length,
      accepted,
      failed: rows.length - accepted,
      missingArtwork: rows.filter((row) => !row.checks.artworkExists).length
    },
    rows
  };
  return report;
}

function main() {
  const report = build();
  const aiRouteData = require('./lib/french-ai-route-map').buildFrenchAiRouteMap();
  const manifest = {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    category: CATEGORY,
    excludedCategory: EXCLUDED_CATEGORY,
    count: report.rows.length,
    rows: report.rows.map(toManifestRow)
  };
  const aiEval = {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    locale: 'fr',
    category: CATEGORY,
    purpose: 'Exact deterministic French discovery destinations for the 132 canonical English Finance, Tax & Market Data owners. Two documented AI-specific destinations intentionally differ from the inventory primary route.',
    count: report.rows.length,
    cases: report.rows.map((row) => ({
      englishId: row.englishId,
      englishRoute: routeWithSlash(row.englishRoute),
      expectedFrenchRoute: aiRouteData.routes[routeWithSlash(row.englishRoute)] || null,
      inventoryPrimaryFrenchRoute: routeWithSlash(row.frenchRoute),
      intentionalException: aiRouteData.routes[routeWithSlash(row.englishRoute)] !== routeWithSlash(row.frenchRoute)
    }))
  };
  if (process.argv.includes('--write')) {
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(AI_EVAL_PATH, `${JSON.stringify(aiEval, null, 2)}\n`);
    fs.writeFileSync(EVIDENCE_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(EVIDENCE_MD_PATH, renderEvidenceMarkdown(report));
    fs.writeFileSync(ARTWORK_MD_PATH, renderArtworkMarkdown(report));
  }
  console.log(JSON.stringify(report.totals, null, 2));
  if (report.totals.rows !== EXPECTED_ROWS || report.totals.overlapWithVat !== 0) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { build, normalizeRoute };
