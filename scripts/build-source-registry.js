'use strict';

const fs = require('fs');
const path = require('path');

const sourceConfidence = require('../assets/js/lib/source-confidence.js');
const canonicalRegistry = require('./lib/canonical-registry');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'data', 'source-registry.json');
const FORMULA_PATH = path.join(ROOT, 'data', 'calculation-quality', 'formula-registry.json');
const META_PATH = path.join(ROOT, 'data', '_meta.json');
const COUNTRY_PATH = path.join(ROOT, 'data', 'registry', 'countries.json');
const COVERAGE_REPORT_PATH = path.join(ROOT, 'reports', 'source-registry-coverage.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function atomicWriteJson(targetPath, value) {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = path.join(directory, '.' + path.basename(targetPath) + '.' + process.pid + '.' + Date.now() + '.tmp');
  try {
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + '\n', 'utf8');
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_cleanupError) {
      // Preserve the original write or rename error.
    }
    throw error;
  }
}

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function normalizedRoute(value) {
  return canonicalRegistry.normalizeRoute(value).replace(/\.html$/i, '');
}

function routeFromArtifact(artifactPath) {
  return normalizedRoute('/' + String(artifactPath || '').replace(/\\/g, '/'));
}

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean))).sort();
}

function freshnessStatus(lastCheckedAt, lastReviewedAt, cadenceDays, today) {
  return sourceConfidence.calculateFreshnessStatus({
    lastCheckedAt: lastCheckedAt || null,
    lastReviewedAt: lastReviewedAt || null,
    reviewCadenceDays: cadenceDays,
    freshnessStatus: lastCheckedAt || lastReviewedAt ? 'acceptable' : 'unknown',
    confidence: 'reviewed',
  }, today);
}

function sourceTypeForFormula(source) {
  const kind = String(source && source.kind || '').toLowerCase();
  const title = String(source && source.title || '').toLowerCase();
  if (/central.bank/.test(kind + ' ' + title)) return 'central_bank';
  if (/regulator/.test(kind + ' ' + title)) return 'regulator';
  if (/authority|official|government|revenue|customs|tax/.test(kind + ' ' + title)) return 'official';
  if (/third.party|snapshot/.test(kind + ' ' + title)) return 'third_party_snapshot';
  return 'reviewed_dataset';
}

function sourceTypeForLedger(source) {
  const value = String(source && source.sourceType || '').toLowerCase();
  if (/central.bank/.test(value)) return 'central_bank';
  if (/regulator/.test(value)) return 'regulator';
  return 'official';
}

function sourceUrl(source) {
  const candidate = source && source.url;
  return /^https?:\/\//.test(candidate || '') ? candidate : null;
}

function withOptional(entry, optional) {
  Object.keys(optional).forEach(function (key) {
    const value = optional[key];
    if (value !== undefined && value !== null && (!Array.isArray(value) || value.length)) entry[key] = value;
  });
  return entry;
}

function formulaEntry(formula, options, today) {
  const source = (formula.sources || []).find(function (item) { return sourceUrl(item); }) || (formula.sources || [])[0] || {};
  const checked = dateOnly(formula.lastVerified);
  const cadenceDays = options.cadenceDays || 90;
  const countryCode = options.countryCode;
  const sourceName = source.title || options.fallbackName;
  const confidence = checked ? 'reviewed' : 'low_confidence';
  const entry = {
    id: options.id,
    sourceName,
    sourceType: sourceTypeForFormula(source),
    countryCodes: [countryCode || 'ALL'],
    appliesTo: options.appliesTo,
    lastCheckedAt: checked,
    lastReviewedAt: checked,
    freshnessStatus: freshnessStatus(checked, checked, cadenceDays, today),
    confidence,
    reviewCadenceDays: cadenceDays,
    notes: options.notes + ' Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.',
    displayDisclaimer: options.disclaimer,
  };
  return withOptional(entry, {
    sourceUrl: sourceUrl(source),
    effectiveFrom: dateOnly(formula.effectiveFrom),
    effectiveTo: dateOnly(formula.effectiveTo),
    toolIds: unique(options.toolIds),
    routes: unique(options.routes),
  });
}

function mergeCoverage(entry, toolIds, routes) {
  entry.toolIds = unique((entry.toolIds || []).concat(toolIds || []));
  entry.routes = unique((entry.routes || []).concat(routes || []));
  return entry;
}

function updateLiveMetaEntry(entry, meta, today, options) {
  const checked = dateOnly(meta && (meta.last_fetch || meta.as_of));
  const reviewed = dateOnly(meta && meta.source_reviewed_at) || entry.lastReviewedAt || null;
  entry.sourceName = options.sourceName(meta, entry);
  entry.lastCheckedAt = checked;
  entry.lastReviewedAt = reviewed;
  entry.effectiveFrom = checked;
  entry.reviewCadenceDays = options.cadenceDays;
  entry.freshnessStatus = freshnessStatus(checked, reviewed, options.cadenceDays, today);
  entry.confidence = options.confidence;
  entry.notes = options.notes(meta, entry);
  return entry;
}

function ledgerAppliesTo(source, tools) {
  const text = [source && source.sourceType, source && source.watch]
    .concat(source && source.fields || [])
    .concat((tools || []).map(function (tool) { return tool.lane + ' ' + tool.id; }))
    .join(' ').toLowerCase();
  const scopes = [];
  if (/fuel|petroleum/.test(text)) scopes.push('fuel', 'energy');
  if (/customs|duty|import/.test(text)) scopes.push('import_duty');
  if (/pension|salary|payroll|income/.test(text)) scopes.push('salary');
  if (/tax|vat|levy/.test(text)) scopes.push('tax');
  if (/cost|fee|fare|money|budget|property|loan|depreciation/.test(text)) scopes.push('business');
  return unique(scopes.length ? scopes : ['other']);
}

function buildRegistry() {
  const today = new Date().toISOString().slice(0, 10);
  const existing = readJson(SOURCE_PATH);
  const formulas = readJson(FORMULA_PATH).formulas;
  const meta = readJson(META_PATH);
  const countries = readJson(COUNTRY_PATH);
  const countryNames = new Map(countries.map(function (country) { return [country.id, country.title]; }));
  const tools = canonicalRegistry.loadSources().tools;
  const toolsByRoute = new Map();
  tools.forEach(function (tool) {
    const route = normalizedRoute(tool.href);
    if (!toolsByRoute.has(route)) toolsByRoute.set(route, []);
    toolsByRoute.get(route).push(tool.id);
  });

  const generatedId = /^(?:paye-[a-z]{2}-source|vat-[a-z]{2}-source|social-security-|electricity-tariff-rates$|remittance-fx-planning$|ledger-tool-|official-)/;
  const entries = new Map(existing.sources.filter(function (source) {
    return !generatedId.test(source.id);
  }).map(function (source) {
    return [source.id, Object.assign({}, source)];
  }));
  function add(entry) {
    if (entries.has(entry.id)) throw new Error('Duplicate generated source id: ' + entry.id);
    entries.set(entry.id, entry);
  }

  const forex = entries.get('forex-third-party-snapshot');
  updateLiveMetaEntry(forex, meta.forex, today, {
    cadenceDays: 7,
    confidence: 'estimated',
    sourceName: function () { return 'Foreign-exchange third-party API snapshot'; },
    notes: function () { return 'Current committed fallback metadata; FX remains indicative and is not an executable provider quote.'; },
  });
  mergeCoverage(forex, ['currency-converter', 'forex-profit'], ['/tools/currency-converter/', '/tools/forex-profit/']);

  const fuel = entries.get('afrofuel-static-snapshot');
  updateLiveMetaEntry(fuel, meta.fuel, today, {
    cadenceDays: 30,
    confidence: 'estimated',
    sourceName: function () { return 'AfroFuel latest available fuel-price snapshot'; },
    notes: function (lane) { return 'Committed fallback with source_state=' + ((lane && lane.source_state) || 'unknown') + '. Row-level official verification remains separate.'; },
  });
  mergeCoverage(fuel, ['fuel-tracker'], ['/tools/fuel-tracker/']);

  const rates = entries.get('afrorates-policy-rate-pack');
  updateLiveMetaEntry(rates, meta.rates, today, {
    cadenceDays: 45,
    confidence: 'reviewed',
    sourceName: function (lane) { return 'AfroRates policy-rate pack (' + ((lane && lane.source) || 'reviewed sources') + ')'; },
    notes: function (lane) { return 'Reviewed policy-rate and inflation pack. Partial verification: ' + Boolean(lane && lane.verification_partial) + '.'; },
  });
  mergeCoverage(rates, ['afrorates', 'interest-rate-ref'], ['/tools/afrorates/', '/tools/interest-rate-ref/']);

  mergeCoverage(entries.get('import-duty-planning-rates'), ['import-duty'], ['/tools/import-duty/']);
  mergeCoverage(entries.get('paye-tax-engine-country-packs'), ['paye-calculator'], ['/tools/paye-calculator/']);
  mergeCoverage(entries.get('vat-country-rate-packs'), ['vat-calc-pan-african'], ['/tools/vat-calculator/']);

  const payeRoutes = formulas.filter(function (formula) { return formula.formulaFamily === 'paye-route'; });
  const vatRoutes = formulas.filter(function (formula) { return formula.formulaFamily === 'vat-route'; });

  formulas.filter(function (formula) { return formula.formulaFamily === 'paye-server'; }).forEach(function (formula) {
    const country = formula.jurisdictions[0];
    const routes = payeRoutes.filter(function (route) { return route.jurisdictions.includes(country); })
      .map(function (route) { return routeFromArtifact(route.artifactPath); });
    const toolIds = routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; });
    add(formulaEntry(formula, {
      id: 'paye-' + country.toLowerCase() + '-source',
      countryCode: country,
      fallbackName: (countryNames.get(country) || country) + ' PAYE source pack',
      appliesTo: ['tax', 'salary'],
      routes,
      toolIds,
      notes: (countryNames.get(country) || country) + ' PAYE engine source audit. Outputs remain planning estimates.',
      disclaimer: 'PAYE and payroll results are planning estimates. Confirm current rates, reliefs, filing, and remittance treatment with the relevant authority or a qualified payroll professional.',
    }, today));
  });

  vatRoutes.forEach(function (formula) {
    const country = formula.jurisdictions[0];
    const route = routeFromArtifact(formula.artifactPath);
    const toolIds = toolsByRoute.get(normalizedRoute(route)) || [];
    add(formulaEntry(formula, {
      id: 'vat-' + country.toLowerCase() + '-source',
      countryCode: country,
      fallbackName: (countryNames.get(country) || country) + ' VAT source pack',
      appliesTo: ['tax', 'business'],
      routes: [route],
      toolIds,
      notes: (countryNames.get(country) || country) + ' VAT route source audit. Exemptions and filing treatment may require separate review.',
      disclaimer: 'VAT results are planning estimates. Confirm current rates, exemptions, registration, invoicing, and filing treatment with the relevant authority or a qualified tax professional.',
    }, today));
  });

  const socialFormulas = formulas.filter(function (formula) {
    return /engines-(?:gh-ssnit|ke-nssf|ng-pension|za-uif)-engine/.test(formula.formulaFamily);
  });
  const socialChecked = socialFormulas.map(function (formula) { return dateOnly(formula.lastVerified); }).filter(Boolean).sort().pop() || null;
  add(withOptional({
    id: 'social-security-country-packs',
    sourceName: 'AfroTools reviewed social-security contribution packs',
    sourceType: 'reviewed_dataset',
    countryCodes: ['GH', 'KE', 'NG', 'ZA'],
    appliesTo: ['salary', 'tax'],
    lastCheckedAt: socialChecked,
    lastReviewedAt: socialChecked,
    freshnessStatus: freshnessStatus(socialChecked, socialChecked, 90, today),
    confidence: 'reviewed',
    reviewCadenceDays: 90,
    notes: 'Contribution engines cover selected statutory schemes and remain planning aids; employer and worker circumstances can change treatment.',
    displayDisclaimer: 'Contribution estimates are for planning. Confirm current caps, rates, eligibility, and remittance rules with the relevant scheme or payroll professional.',
  }, { toolIds: ['social-security'], routes: ['/tools/social-security/'] }));

  socialFormulas.forEach(function (formula) {
    const key = formula.formulaFamily.replace(/^engines-|-engine$/g, '');
    add(formulaEntry(formula, {
      id: 'social-security-' + key + '-source',
      countryCode: (key.match(/^(gh|ke|ng|za)-/) || [null, 'ALL'])[1].toUpperCase(),
      fallbackName: key + ' contribution source pack',
      appliesTo: ['salary', 'tax'],
      notes: 'Reviewed statutory-contribution formula source.',
      disclaimer: 'Contribution results are planning estimates. Confirm current rates and caps with the relevant statutory scheme.',
    }, today));
  });

  const electricityFormula = formulas.find(function (formula) { return formula.formulaFamily === 'engines-electricity-tariff-engine'; });
  const electricityEntry = formulaEntry(electricityFormula, {
    id: 'electricity-tariff-rates',
    countryCode: 'ALL',
    fallbackName: 'AfroTools electricity tariff planning dataset',
    appliesTo: ['energy'],
    routes: ['/tools/electricity-estimator/'],
    toolIds: ['electricity-estimator'],
    notes: 'Tariff model source metadata; live API provenance and local tariff classes remain separate.',
    disclaimer: 'Electricity tariffs vary by provider, band, taxes, subsidies, and billing period. Confirm your current utility tariff before budgeting.',
  }, today);
  electricityEntry.sourceName = 'AfroTools reviewed electricity tariff planning dataset';
  electricityEntry.sourceType = 'reviewed_dataset';
  electricityEntry.confidence = 'estimated';
  delete electricityEntry.sourceUrl;
  add(electricityEntry);

  const remittanceFormula = formulas.find(function (formula) { return formula.formulaFamily === 'assets-js-engines-remittance-v2'; });
  const remittanceEntry = formulaEntry(remittanceFormula, {
    id: 'remittance-fx-planning',
    countryCode: 'ALL',
    fallbackName: 'AfroTools remittance and FX planning model',
    appliesTo: ['fx', 'business'],
    routes: ['/tools/remittance-compare/'],
    toolIds: ['remittance-compare'],
    notes: 'Indicative remittance comparison using the FX snapshot plus modeled provider fees and spreads.',
    disclaimer: 'Remittance costs and exchange rates are indicative. Obtain a current provider quote before sending money.',
  }, today);
  remittanceEntry.lastCheckedAt = forex.lastCheckedAt;
  remittanceEntry.lastReviewedAt = forex.lastReviewedAt;
  remittanceEntry.freshnessStatus = forex.freshnessStatus;
  remittanceEntry.confidence = 'estimated';
  remittanceEntry.reviewCadenceDays = 7;
  add(remittanceEntry);

  const ledgerConfigs = [
    { lane: 'government', toolFilter: function (tool) { return tool.lane === 'money-property'; } },
    { lane: 'transport', toolFilter: function (tool) { return /money|cost|fare|fuel|income|customs|fee|toll|loan|depreciation/.test(tool.lane + ' ' + tool.id); } },
  ];

  ledgerConfigs.forEach(function (config) {
    const manifest = readJson(path.join(ROOT, 'data', config.lane, 'official-sources.json'));
    const status = readJson(path.join(ROOT, 'data', config.lane, 'source-status.json'));
    const statusById = new Map(status.sources.map(function (source) { return [source.id, source]; }));
    const selectedTools = status.tools.filter(config.toolFilter);
    const referencedSourceIds = unique(selectedTools.flatMap(function (tool) { return tool.sourceIds || []; }));

    selectedTools.forEach(function (tool) {
      if (tool.id === 'import-duty') return;
      const rows = (tool.sourceIds || []).map(function (id) { return statusById.get(id); }).filter(Boolean);
      const checkedDates = rows.map(function (row) { return dateOnly(row.checkedAt); }).filter(Boolean).sort();
      const checked = checkedDates.length ? checkedDates[checkedDates.length - 1] : null;
      const usable = rows.filter(function (row) { return row.status === 'ok' && dateOnly(row.checkedAt); });
      const entry = withOptional({
        id: 'ledger-tool-' + tool.id,
        sourceName: tool.id.replace(/-/g, ' ') + ' official-source ledger',
        sourceType: 'reviewed_dataset',
        countryCodes: unique(rows.map(function (row) { return row.country; })).length ? unique(rows.map(function (row) { return row.country; })) : ['ALL'],
        appliesTo: unique(rows.flatMap(function (row) { return ledgerAppliesTo(row, [tool]); })),
        lastCheckedAt: checked,
        lastReviewedAt: null,
        freshnessStatus: tool.status === 'blocked' ? 'unavailable' : freshnessStatus(checked, null, manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30, today),
        confidence: usable.length ? 'reviewed' : 'low_confidence',
        reviewCadenceDays: manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30,
        notes: 'Official-source availability ledger for ' + tool.id + '. Tool status=' + tool.status + '; ' + usable.length + '/' + rows.length + ' referenced sources were reachable and unchanged at the latest check. Availability does not certify a fee, rate, or outcome.',
        displayDisclaimer: 'Official source pages can change. Verify the current fee, rate, notice, or schedule on the linked authority before paying or making a high-stakes decision.',
      }, { toolIds: [tool.id], routes: [tool.route] });
      add(entry);
    });

    referencedSourceIds.forEach(function (sourceId) {
      const row = statusById.get(sourceId);
      if (!row) return;
      const manifestSource = manifest.sources.find(function (source) { return source.id === sourceId; }) || row;
      const checked = dateOnly(row.checkedAt);
      const officiallyChecked = row.status === 'ok' && checked && Number(row.httpStatus) >= 200 && Number(row.httpStatus) < 300 && row.changedSinceLastRun === false;
      const linkedTools = selectedTools.filter(function (tool) { return (tool.sourceIds || []).includes(sourceId); });
      add(withOptional({
        id: 'official-' + sourceId,
        sourceName: row.authority || manifestSource.authority || row.title || sourceId,
        sourceType: sourceTypeForLedger(manifestSource),
        countryCodes: [row.country || manifestSource.country || 'ALL'],
        appliesTo: ledgerAppliesTo(manifestSource, linkedTools),
        lastCheckedAt: checked,
        lastReviewedAt: null,
        freshnessStatus: row.status === 'blocked' || row.status === 'broken' ? 'unavailable' : freshnessStatus(checked, null, manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30, today),
        confidence: officiallyChecked ? 'official_verified' : (checked ? 'reviewed' : 'low_confidence'),
        reviewCadenceDays: manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30,
        notes: 'Official endpoint status=' + row.status + '. Official verified means the configured authority endpoint returned an unchanged successful response on the checked date; it does not certify every tool value.',
        displayDisclaimer: 'This authority source was checked for availability. Confirm the current publication, notice, schedule, and effective date before relying on a fee or rate.',
      }, {
        sourceUrl: sourceUrl(row) || sourceUrl(manifestSource),
        toolIds: linkedTools.map(function (tool) { return tool.id; }),
        routes: linkedTools.map(function (tool) { return tool.route; }),
      }));
    });
  });

  const sources = Array.from(entries.values()).map(function (entry) {
    if (entry.toolIds) entry.toolIds = unique(entry.toolIds);
    if (entry.routes) entry.routes = unique(entry.routes.map(normalizedRoute));
    return entry;
  }).sort(function (a, b) { return a.id.localeCompare(b.id); });
  const allToolIds = unique(sources.flatMap(function (source) { return source.toolIds || []; }));
  const confidenceCounts = {};
  sources.forEach(function (source) { confidenceCounts[source.confidence] = (confidenceCounts[source.confidence] || 0) + 1; });

  return {
    registry: { schemaVersion: 1, updatedAt: today, sources },
    coverage: {
      schemaVersion: 1,
      generatedAt: today,
      summary: {
        sourceEntries: sources.length,
        registeredTools: allToolIds.length,
        payeCountries: sources.filter(function (source) { return /^paye-[a-z]{2}-source$/.test(source.id); }).length,
        vatCountries: sources.filter(function (source) { return /^vat-[a-z]{2}-source$/.test(source.id); }).length,
        officialVerifiedEntries: confidenceCounts.official_verified || 0,
        confidenceCounts,
      },
      registeredToolIds: allToolIds,
    },
  };
}

function main() {
  const built = buildRegistry();
  if (built.registry.sources.length < 100) throw new Error('Source registry target not met: ' + built.registry.sources.length + ' entries.');
  if (process.argv.includes('--check')) {
    const current = readJson(SOURCE_PATH);
    if (JSON.stringify(current) !== JSON.stringify(built.registry)) {
      console.error('data/source-registry.json is stale. Run npm run source-registry:build.');
      process.exit(1);
    }
    console.log('Source registry is current: ' + built.registry.sources.length + ' entries.');
    return;
  }
  atomicWriteJson(SOURCE_PATH, built.registry);
  atomicWriteJson(COVERAGE_REPORT_PATH, built.coverage);
  console.log('Built source registry: ' + built.registry.sources.length + ' entries covering ' + built.coverage.summary.registeredTools + ' registry tools.');
}

if (require.main === module) main();

module.exports = { atomicWriteJson, buildRegistry, dateOnly, freshnessStatus, normalizedRoute };
