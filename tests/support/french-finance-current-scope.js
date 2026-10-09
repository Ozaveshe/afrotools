'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const EXPORTER = '/assets/js/pages/french-finance-export-contract.js';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

function readCurrentFinanceScope(root) {
  const { buildStaticExportContract, normalizeRoute, resolveRouteFile } = require(path.join(root, 'scripts/lib/french-finance-export-contract'));
  const manifestBytes = fs.readFileSync(path.join(root, 'data/registry/french-finance-tax-market-data.json'));
  const historical = JSON.parse(manifestBytes);
  if (historical.count !== 132 || historical.rows.length !== 132) throw new Error('Historical French finance denominator changed; review coverage explicitly.');
  const byFrench = new Map(historical.rows.map(row => [normalizeRoute(row.frenchRoute), row]));
  const rows = [];
  for (const entry of fs.readdirSync(path.join(root, 'fr'), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(entry.parentPath, entry.name);
    const html = fs.readFileSync(file, 'utf8');
    if (!/<script\b[^>]*\bsrc=["']\/assets\/js\/pages\/french-finance-export-contract\.js(?:[?][^"']*)?["']/i.test(html)) continue;
    const matches = [...html.matchAll(/<script\b[^>]*\bid=["']afrotools-fr-finance-export-contract["'][^>]*>([\s\S]*?)<\/script>/gi)];
    if (matches.length !== 1) throw new Error('Expected one export configuration: ' + file);
    const config = JSON.parse(matches[0][1]);
    const prior = byFrench.get(normalizeRoute(config.frenchRoute));
    if (!prior || normalizeRoute(prior.englishRoute) !== normalizeRoute(config.englishRoute)) throw new Error('Unreviewed shared export owner: ' + file);
    const primaryFrenchFile = path.relative(root, file).replace(/\\/g, '/');
    const physicalRoute = '/' + primaryFrenchFile;
    const formats = [...new Set(config.formats || [])].sort();
    if (!formats.length || formats.length !== config.formats.length) throw new Error('Missing or duplicate declared formats: ' + file);
    const current = buildStaticExportContract(root, { ...prior, primaryFrenchFile, primaryFrenchRoute: physicalRoute }, html);
    const actions = current.frenchOwner.actions.filter(action => action.implementation === EXPORTER);
    if (JSON.stringify([...new Set(actions.map(action => action.format))].sort()) !== JSON.stringify(formats)) throw new Error('Unsupported declared export format: ' + file);
    // This cohort proves every declared shared-controller format on each physical page.
    // English/French parity gaps remain separately reported; they are never counted as accepted parity.
    rows.push({
      englishId: prior.englishId, englishRoute: prior.englishRoute,
      frenchRoute: physicalRoute, canonicalFrenchRoute: prior.frenchRoute,
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
  if (rows.length !== 124 || new Set(rows.map(row => row.englishRoute)).size !== 122) throw new Error('Current shared-controller inventory changed; review physical and logical coverage.');
  const currentRoutes = new Set(rows.map(row => normalizeRoute(row.canonicalFrenchRoute)));
  const nativeOwners = historical.rows.filter(row => row.exportContract.classification === 'required' && !currentRoutes.has(normalizeRoute(row.frenchRoute))).map(row => {
    const file = resolveRouteFile(root, row.frenchRoute);
    if (!file) throw new Error('Native French owner is missing: ' + row.frenchRoute);
    const html = fs.readFileSync(file, 'utf8');
    return { englishRoute: row.englishRoute, frenchRoute: row.frenchRoute, file: path.relative(root, file).replace(/\\/g, '/'), sha256: hash(html), status: 'separate-native-owner-not-accepted-by-this-cohort' };
  });
  const notApplicable = historical.rows.filter(row => row.exportContract.classification === 'notApplicable').map(row => ({ englishRoute: row.englishRoute, frenchRoute: row.frenchRoute, status: 'historical-not-applicable-not-reverified-by-this-cohort' }));
  const expectedNative = ['/fr/maroc/calculateur-salaire-net', '/fr/tools/couts-secours-energie', '/fr/tools/tarifs-itineraire', '/fr/tunisie/calculateur-salaire-net'];
  if (JSON.stringify(nativeOwners.map(row => row.frenchRoute).sort()) !== JSON.stringify(expectedNative) || notApplicable.length !== 6) throw new Error('Historical reconciliation changed; do not silently omit owners.');
  const coverage = {
    historicalRows: 132, historicalRequired: 126, historicalNotApplicable: 6,
    historicalManifestSha256: hash(manifestBytes), physicalConsumers: rows.length, logicalConsumers: 122,
    nativeOwners, notApplicable,
    alternatePhysicalConsumers: rows.filter(row => row.primaryFrenchFile !== byFrench.get(normalizeRoute(row.canonicalFrenchRoute)).exportContract.frenchOwner.file).map(row => ({ file: row.primaryFrenchFile, englishRoute: row.englishRoute, declaredFormats: row.declaredFormats })),
    parityGaps: rows.filter(row => row.currentEnglishParity.classification === 'productGap').map(row => ({ file: row.primaryFrenchFile, ...row.currentEnglishParity })),
    qualification: '124 physical shared-controller consumers spanning122 logical historical routes. Four native owners and six historical not-applicable rows remain separate; this scope does not relabel their historic proof or claim full English/French export parity.'
  };
  return { schemaVersion: 2, count: rows.length, rows, coverage, coverageSha256: hash(JSON.stringify(coverage)) };
}

module.exports = { readCurrentFinanceScope };
