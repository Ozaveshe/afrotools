'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const EXPORTER = '/assets/js/pages/french-finance-export-contract.js';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const NATIVE_BYPASS_IDS = ['leave-calculator', 'crypto-remittance', 'job-offer-evaluator', 'startup-valuation', 'crypto-dca', 'currency-converter'];
const EXCLUDED_ALIASES = new Map([
  ['fr/cape-verde/cv-paye.html', '/fr/cape-verde/cv-paye/'],
  ['fr/eq-guinea/gq-paye.html', '/fr/eq-guinea/gq-paye/']
]);

function readCurrentFinanceScope(root) {
  const { buildStaticExportContract, normalizeRoute, resolveRouteFile } = require(path.join(root, 'scripts/lib/french-finance-export-contract'));
  const manifestBytes = fs.readFileSync(path.join(root, 'data/registry/french-finance-tax-market-data.json'));
  const historical = JSON.parse(manifestBytes);
  if (historical.count !== 132 || historical.rows.length !== 132) throw new Error('Historical French finance denominator changed; review coverage explicitly.');
  const byFrench = new Map(historical.rows.map(row => [normalizeRoute(row.frenchRoute), row]));
  const rows = [], nativeReferences = [], disabledOwners = [], excludedAliases = [];
  const controller = fs.readFileSync(path.join(root, EXPORTER), 'utf8');
  const bypass = controller.match(/if \((config\.englishId[^\n]+)\) return;/);
  if (!bypass || JSON.stringify([...bypass[1].matchAll(/config\.englishId === '([^']+)'/g)].map(match => match[1]).sort()) !== JSON.stringify([...NATIVE_BYPASS_IDS].sort())) throw new Error('Review native export bypass ownership.');
  const distBuilder = fs.readFileSync(path.join(root, 'scripts/build-dist.js'), 'utf8');
  const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/);
  let rawSharedScriptReferences = 0;
  for (const entry of fs.readdirSync(path.join(root, 'fr'), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(entry.parentPath, entry.name);
    const html = fs.readFileSync(file, 'utf8');
    if (!/<script\b[^>]*\bsrc=["']\/assets\/js\/pages\/french-finance-export-contract\.js(?:[?][^"']*)?["']/i.test(html)) continue;
    rawSharedScriptReferences += 1;
    const matches = [...html.matchAll(/<script\b[^>]*\bid=["']afrotools-fr-finance-export-contract["'][^>]*>([\s\S]*?)<\/script>/gi)];
    if (matches.length !== 1) throw new Error('Expected one export configuration: ' + file);
    const config = JSON.parse(matches[0][1]);
    const prior = byFrench.get(normalizeRoute(config.frenchRoute));
    if (!prior || normalizeRoute(prior.englishRoute) !== normalizeRoute(config.englishRoute)) throw new Error('Unreviewed shared export owner: ' + file);
    const primaryFrenchFile = path.relative(root, file).replace(/\\/g, '/');
    const physicalRoute = '/' + primaryFrenchFile;
    const owner = { englishId: prior.englishId, englishRoute: prior.englishRoute, frenchRoute: prior.frenchRoute, file: primaryFrenchFile, sha256: hash(html) };
    if (EXCLUDED_ALIASES.has(primaryFrenchFile)) {
      const destination = EXCLUDED_ALIASES.get(primaryFrenchFile);
      if (!distBuilder.includes("  '" + primaryFrenchFile + "',") || !redirects.some(line => line.trim().split(/\s+/).join(' ') === physicalRoute + ' ' + destination + ' 301!')) throw new Error('Excluded alias no longer has its publish/redirect guard: ' + primaryFrenchFile);
      excludedAliases.push({ ...owner, destination, status: 'excluded-from-publish-artifact-with-forced-canonical-redirect' });
      continue;
    }
    if (primaryFrenchFile === 'fr/burkina-faso/calculateur-salaire-net.html') {
      const exporterTag = html.match(/<script\b[^>]*src="\/assets\/js\/pages\/french-finance-export-contract\.js[^>]*>/);
      if (!exporterTag || !exporterTag[0].includes('type="application/x-bf-review-required"') || !html.includes('data-formula-status="review-required"')) throw new Error('Burkina Faso output review guard changed.');
      disabledOwners.push({ ...owner, status: 'calculation-and-exports-unavailable-pending-source-review', test: 'tests/e2e/bf-payroll-review.spec.js' });
      continue;
    }
    if (NATIVE_BYPASS_IDS.includes(config.englishId)) {
      if (config.englishId === 'currency-converter') {
        const runtime = 'assets/js/pages/currency-converter-locales-vip.js';
        const test = 'tests/e2e/currency-observation-exports.spec.js';
        if (primaryFrenchFile !== 'fr/tools/convertisseur-devises/index.html' || !html.includes('/' + runtime) || !html.includes('id="fxCsv"')) throw new Error('Currency native export owner is missing.');
        Object.assign(owner, { runtime, runtimeSha256: hash(fs.readFileSync(path.join(root, runtime))), test, testSha256: hash(fs.readFileSync(path.join(root, test))) });
      }
      nativeReferences.push({ ...owner, status: 'native-export-owner-shared-controller-returns-before-init' });
      continue;
    }
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
    if (!canonical) throw new Error('Missing canonical route: ' + primaryFrenchFile);
    // Use the current owner's public route. A canonical pointing at another tool
    // is recorded as a separate SEO gap, never followed into a different owner.
    const declaredCanonicalRoute = new URL(canonical[1]).pathname;
    const canonicalRoute = physicalRoute.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    const routePath = canonicalRoute.replace(/^\/+/, '');
    const servedCandidates = canonicalRoute.endsWith('/') ? [path.join(root, routePath, 'index.html')]
      : path.extname(routePath) ? [path.join(root, routePath)]
        : [path.join(root, routePath, 'index.html'), path.join(root, routePath + '.html')];
    const servedFile = servedCandidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (normalizeRoute(canonicalRoute) !== normalizeRoute(prior.frenchRoute) || path.resolve(servedFile || '') !== path.resolve(file)) throw new Error('Canonical route resolves to a different physical owner: ' + primaryFrenchFile);
    const formats = [...new Set(config.formats || [])].sort();
    if (!formats.length || formats.length !== config.formats.length) throw new Error('Missing or duplicate declared formats: ' + file);
    const current = buildStaticExportContract(root, { ...prior, primaryFrenchFile, primaryFrenchRoute: canonicalRoute }, html);
    const actions = current.frenchOwner.actions.filter(action => action.implementation === EXPORTER);
    if (JSON.stringify([...new Set(actions.map(action => action.format))].sort()) !== JSON.stringify(formats)) throw new Error('Unsupported declared export format: ' + file);
    // Navigate the calculator's canonical route and still verify exact physical HTML bytes.
    // English/French parity gaps remain separately reported; they are never counted as accepted parity.
    rows.push({
      englishId: prior.englishId, englishRoute: prior.englishRoute,
      frenchRoute: canonicalRoute, canonicalFrenchRoute: prior.frenchRoute,
      declaredCanonicalRoute,
      primaryFrenchFile, sourceSha256: hash(html), declaredFormats: formats,
      currentEnglishParity: { classification: current.classification, missingFrenchFormats: current.missingFrenchFormats },
      exportContract: {
        ...current, classification: 'required',
        frenchOwner: { ...current.frenchOwner, formats, actions },
        missingFrenchFormats: [], finalStatus: 'pending'
      }
    });
  }
  rows.sort((left, right) => left.primaryFrenchFile.localeCompare(right.primaryFrenchFile, 'en'));
  if (rawSharedScriptReferences !== 124 || rows.length !== 115 || new Set(rows.map(row => row.englishRoute)).size !== 115 || nativeReferences.length !== 6 || disabledOwners.length !== 1 || excludedAliases.length !== 2) throw new Error('Current owner inventory changed; review every physical and logical owner.');
  const currentRoutes = new Set([...rows.map(row => normalizeRoute(row.canonicalFrenchRoute)), ...nativeReferences.map(row => normalizeRoute(row.frenchRoute)), ...disabledOwners.map(row => normalizeRoute(row.frenchRoute))]);
  const removedSharedReferences = historical.rows.filter(row => row.exportContract.classification === 'required' && !currentRoutes.has(normalizeRoute(row.frenchRoute))).map(row => {
    const file = resolveRouteFile(root, row.frenchRoute);
    if (!file) throw new Error('Native French owner is missing: ' + row.frenchRoute);
    const html = fs.readFileSync(file, 'utf8');
    return { englishId: row.englishId, englishRoute: row.englishRoute, frenchRoute: row.frenchRoute, file: path.relative(root, file).replace(/\\/g, '/'), sha256: hash(html), status: 'native-export-owner-without-shared-script' };
  });
  const notApplicable = historical.rows.filter(row => row.exportContract.classification === 'notApplicable').map(row => ({ englishRoute: row.englishRoute, frenchRoute: row.frenchRoute, status: 'historical-not-applicable-not-reverified-by-this-cohort' }));
  const expectedNative = ['/fr/maroc/calculateur-salaire-net', '/fr/tools/couts-secours-energie', '/fr/tools/tarifs-itineraire', '/fr/tunisie/calculateur-salaire-net'];
  if (JSON.stringify(removedSharedReferences.map(row => row.frenchRoute).sort()) !== JSON.stringify(expectedNative) || notApplicable.length !== 6) throw new Error('Historical reconciliation changed; do not silently omit owners.');
  const nativeOwners = [...nativeReferences, ...removedSharedReferences].sort((a, b) => a.frenchRoute.localeCompare(b.frenchRoute, 'en'));
  const coverage = {
    historicalRows: 132, historicalRequired: 126, historicalNotApplicable: 6,
    historicalManifestSha256: hash(manifestBytes), rawSharedScriptReferences, physicalConsumers: rows.length, logicalConsumers: rows.length,
    nativeOwners, disabledOwners, excludedAliases, notApplicable,
    canonicalMetadataGaps: rows.filter(row => normalizeRoute(row.declaredCanonicalRoute) !== normalizeRoute(row.frenchRoute)).map(row => ({ file: row.primaryFrenchFile, servedRoute: row.frenchRoute, declaredCanonicalRoute: row.declaredCanonicalRoute })),
    parityGaps: rows.filter(row => row.currentEnglishParity.classification === 'productGap').map(row => ({ file: row.primaryFrenchFile, ...row.currentEnglishParity })),
    qualification: '132 historical logical routes reconcile to115 active shared-export owners,10 native owners,1 source-review-blocked payroll owner and6 historical not-applicable rows.124 physical script references include6 native bypasses,1 disabled script and2 excluded aliases. Only the115 active shared owners receive workflow/export acceptance from this cohort; currency observation/CSV exports are checked by their named native test. All other current proof is reported separately. No full English/French parity claim.'
  };
  return { schemaVersion: 2, count: rows.length, rows, coverage, coverageSha256: hash(JSON.stringify(coverage)) };
}

module.exports = { readCurrentFinanceScope };
