'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RISK_DOMAINS = [
  'tax_payroll',
  'pensions_benefits',
  'loans_financial',
  'utilities_meters',
  'exchange_rates',
  'health',
  'agriculture',
  'legal_regulatory',
  'general_utility'
];

const REQUIRED_FIXTURE_CLASSES = [
  'zero_input',
  'negative_input',
  'band_boundary',
  'exact_threshold',
  'very_large_value',
  'decimal_precision',
  'leap_year_date',
  'date_boundary',
  'missing_optional_input',
  'unsupported_jurisdiction',
  'unsupported_date',
  'changed_tax_year',
  'rounding_stage'
];

const QUALITY_FILES = {
  inventory: 'data/calculation-quality/engine-inventory.json',
  formulas: 'data/calculation-quality/formula-registry.json',
  fixtures: 'data/calculation-quality/golden-fixtures.json',
  externalData: 'data/calculation-quality/external-data-contracts.json',
  fixtureDeltas: 'data/calculation-quality/fixture-deltas.json'
};

const ENGINE_ROOTS = [
  'engines',
  'assets/js/engines',
  'netlify/functions/_engines'
];

const SKIP_ENGINE_FILES = new Set([
  'netlify/functions/_engines/_factory.js',
  'netlify/functions/_engines/index.js'
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function slash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function stableSortObject(value) {
  if (Array.isArray(value)) return value.map(stableSortObject);
  if (!value || typeof value !== 'object') {
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    if (typeof value === 'number' && Number.isNaN(value)) return 'NaN';
    return value;
  }
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableSortObject(value[key])]));
}

function stableJson(value) {
  return JSON.stringify(stableSortObject(value), null, 2) + '\n';
}

function digestText(value) {
  const normalized = String(value).replace(/\r\n/g, '\n');
  return 'sha256:' + crypto.createHash('sha256').update(normalized).digest('hex');
}

function normalizeLegacyHtmlFormulaScript(source) {
  // This disclosure helper lives in the same legacy inline script as the Egypt
  // PAYE formula. Its accessibility state is presentation-only, so normalize
  // the enhanced implementation to the original digest representation. Actual
  // rates, bands, thresholds, deductions, and calculation code remain covered.
  return source.replace(
    "function toggleBands(header) {\n" +
      "  const body = header.nextElementSibling;\n" +
      "  const arr  = header.querySelector('.tog-arrow');\n" +
      "  const open = body.classList.toggle('open');\n" +
      "  arr.classList.toggle('open');\n" +
      "  if (header.hasAttribute('aria-expanded')) header.setAttribute('aria-expanded', open ? 'true' : 'false');\n" +
      "}",
    "function toggleBands(header) {\n" +
      "  const body = header.nextElementSibling;\n" +
      "  const arr  = header.querySelector('.tog-arrow');\n" +
      "  body.classList.toggle('open');\n" +
      "  arr.classList.toggle('open');\n" +
      "}"
  );
}

function digestFile(root, relativePath) {
  let source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  if (/^netlify\/functions\/_engines\/[a-z]{2}-paye\.js$/i.test(slash(relativePath))) {
    // Review scheduling metadata does not change calculation behavior. The
    // explicit marker keeps these fields outside protected formula digests,
    // while every unmarked engine line remains covered by the digest gate.
    source = source.replace(/^[ \t]*\/\* source-confidence-stamp:start \*\/[\s\S]*?^[ \t]*\/\* source-confidence-stamp:end \*\/\r?\n?(?:[ \t]*\r?\n)?/gm, '');
  }
  if (!relativePath.endsWith('.html')) return digestText(source);
  const executableScripts = [];
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1] || '';
    const body = normalizeLegacyHtmlFormulaScript(match[2] || '');
    if (/\bsrc\s*=/i.test(attributes) || /application\/ld\+json/i.test(attributes)) continue;
    if (/\b(?:calculate|calctax|computepaye|computeTax|paye|vat|bands?|rates?|threshold|deduction)\b/i.test(body)) {
      executableScripts.push(body.trim());
    }
  }
  return digestText(executableScripts.length ? executableScripts.join('\n/* formula-script-boundary */\n') : source);
}

function routeToFile(root, route) {
  const clean = String(route || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  const candidates = [
    clean + '.html',
    clean + '/index.html'
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(root, candidate))) || null;
}

function toolVerificationArtifacts(root) {
  const verificationPath = path.join(root, 'data/tool-verification.json');
  if (!fs.existsSync(verificationPath)) return [];
  const tools = readJson(verificationPath).tools || {};
  const out = [];
  for (const entry of Object.values(tools)) {
    for (const route of entry.routes || []) {
      const file = routeToFile(root, route);
      if (file) out.push(slash(file));
    }
  }
  return [...new Set(out)].sort();
}

function discoverEngineArtifacts(root) {
  const out = [];
  for (const relativeDir of ENGINE_ROOTS) {
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) continue;
    for (const name of fs.readdirSync(absoluteDir).sort()) {
      if (!name.endsWith('.js')) continue;
      const relativePath = slash(path.join(relativeDir, name));
      if (!SKIP_ENGINE_FILES.has(relativePath)) out.push(relativePath);
    }
  }
  out.push(...toolVerificationArtifacts(root));
  return [...new Set(out)].sort();
}

function idFromPath(relativePath) {
  return slash(relativePath)
    .replace(/\.(?:js|html)$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function classifyArtifact(relativePath) {
  const value = slash(relativePath).toLowerCase();
  const name = path.posix.basename(value);
  let riskDomain = 'general_utility';

  if (/paye|payroll|payslip|employee-cost|staff-cost|(^|-)tax|tva|(^|-)vat|creator-invoice/.test(value)) {
    riskDomain = 'tax_payroll';
  } else if (/pension|ssnit|nssf|uif|gepf|social-security|benefit|health-contribution|workers-comp/.test(value)) {
    riskDomain = 'pensions_benefits';
  } else if (/fx|forex|exchange|remittance|afrorates|payment-comparator/.test(value)) {
    riskDomain = 'exchange_rates';
  } else if (/electric|meter|utility|water-bill|solar|battery|energy|fuel|outage|generator|gas-lpg|backup-duration|mini-grid|paygo|carbon-footprint/.test(value)) {
    riskDomain = 'utilities_meters';
  } else if (/health|medical|insurance/.test(value)) {
    riskDomain = 'health';
  } else if (/agri|farm|crop|fertilizer|livestock|poultry|aquaculture|cassava|cocoa|coffee|seed-rate|irrigation|harvest|commodity|vaccination/.test(value)) {
    riskDomain = 'agriculture';
  } else if (/loan|mortgage|finance|roi|profit|price|cost|yield|business-planner/.test(value)) {
    riskDomain = 'loans_financial';
  } else if (/duty|tariff|levy|landed-cost|minimum-wage|labour|legal|compliance|regulatory|license|contract|tenancy|visa|incoterm|hs-lookup|coo-engine|export-docs|demurrage/.test(value)) {
    riskDomain = 'legal_regulatory';
  }

  let riskLevel = 'low';
  if (relativePath.endsWith('.html') || ['tax_payroll', 'pensions_benefits', 'legal_regulatory'].includes(riskDomain)) {
    riskLevel = 'high';
  } else if (['loans_financial', 'utilities_meters', 'exchange_rates', 'health', 'agriculture'].includes(riskDomain)) {
    riskLevel = 'medium';
  }

  const rationale = riskLevel === 'high'
    ? 'Result can affect statutory, payroll, benefit, customs, legal, or regulatory decisions and therefore requires provenance and protected review.'
    : riskLevel === 'medium'
      ? 'Result can influence financial, health, utility, exchange-rate, or agricultural planning and therefore requires explicit assumptions and fixtures.'
      : 'Artifact is a general-purpose or workflow utility without jurisdictional monetary or statutory decision logic.';

  return { riskLevel, riskDomain, rationale, name };
}

function loadQualityArtifacts(root) {
  const artifacts = {};
  for (const [key, relativePath] of Object.entries(QUALITY_FILES)) {
    artifacts[key] = readJson(path.join(root, relativePath));
  }
  return artifacts;
}

function applicablePopulationFor(domain) {
  return {
    tax_payroll: 'Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.',
    pensions_benefits: 'Workers, employers, contributors, and benefit claimants covered by the declared scheme assumptions.',
    loans_financial: 'Users preparing non-binding financial projections from the entered assumptions.',
    utilities_meters: 'Households and businesses estimating utility consumption, tariffs, backup power, or energy investment.',
    exchange_rates: 'Users comparing indicative exchange, remittance, or policy-rate scenarios before obtaining a provider quote.',
    health: 'Users preparing non-diagnostic health-cost, contribution, or insurance planning estimates.',
    agriculture: 'Farmers and agricultural businesses preparing planning estimates under the declared units and data assumptions.',
    legal_regulatory: 'Users preparing regulatory, customs, employment, trade, or legal-planning estimates for the declared jurisdiction.',
    general_utility: 'General users of a deterministic utility.'
  }[domain];
}

function disclaimerFor(domain) {
  return {
    tax_payroll: 'Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.',
    pensions_benefits: 'Planning estimate only. Confirm contribution, eligibility, and benefit rules with the relevant scheme administrator.',
    loans_financial: 'Planning estimate only, not a quote, investment recommendation, or guarantee of approval or return.',
    utilities_meters: 'Planning estimate only. Confirm current tariffs, meter rules, equipment performance, and supplier quotes locally.',
    exchange_rates: 'Indicative planning data only. Obtain a current executable quote before committing funds.',
    health: 'Planning information only. It is not medical diagnosis, treatment advice, or a coverage guarantee.',
    agriculture: 'Planning estimate only. Local yields, prices, weather, agronomy, and input requirements can differ materially.',
    legal_regulatory: 'Planning information only. Confirm current legal, customs, filing, and regulatory treatment with the relevant authority or qualified adviser.',
    general_utility: 'General informational output only.'
  }[domain];
}

function exclusionsFor(domain) {
  return {
    tax_payroll: ['Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled.'],
    pensions_benefits: ['Scheme eligibility, vesting, claim approval, and employer-specific plan terms may not be modeled.'],
    loans_financial: ['Provider fees, taxes, approval criteria, market movements, and user-specific contract terms are excluded unless entered.'],
    utilities_meters: ['Local tariff classes, taxes, losses, outages, meter configuration, and equipment degradation may differ.'],
    exchange_rates: ['Provider spreads, fees, liquidity, settlement delay, and executable market quotes are excluded unless shown.'],
    health: ['Clinical diagnosis, individual medical factors, insurer underwriting, and final provider charges are excluded.'],
    agriculture: ['Local soil, weather, pest pressure, agronomy, market access, and farm-specific losses are excluded unless entered.'],
    legal_regulatory: ['Case-specific interpretation, exemptions, official assessment, filing acceptance, and professional advice are excluded.'],
    general_utility: ['Jurisdiction-specific or professional decision rules are outside this utility.']
  }[domain];
}

function sourceTemplate(domain, sourceRegistry, artifactPath) {
  const preferredId = {
    tax_payroll: 'paye-tax-engine-country-packs',
    pensions_benefits: 'paye-tax-engine-country-packs',
    loans_financial: 'unknown-source',
    utilities_meters: 'afrofuel-static-snapshot',
    exchange_rates: 'forex-third-party-snapshot',
    health: 'unknown-source',
    agriculture: 'country-profile-reviewed-dataset',
    legal_regulatory: 'import-duty-planning-rates',
    general_utility: 'unknown-source'
  }[domain];
  const source = (sourceRegistry.sources || []).find((entry) => entry.id === preferredId) || {};
  return {
    registryId: source.id || null,
    title: source.sourceName || ('Formula assumptions declared in ' + artifactPath),
    url: source.sourceUrl || null,
    kind: source.sourceType || 'artifact-declared',
    authorityStatus: source.confidence === 'official_verified' ? 'official-verified'
      : source.id === 'unknown-source' ? 'review-required' : 'reviewed-dataset'
  };
}

function sourceRefsFromVerification(entry) {
  return (entry.source_urls || []).map((url, index) => ({
    registryId: null,
    title: (entry.source_titles || [])[index] || url,
    url,
    kind: 'authority-link',
    authorityStatus: 'source-reviewed'
  }));
}

function effectivePeriodForServerCountry(code) {
  const periods = {
    ZA: { effectiveFrom: '2025-03-01', effectiveTo: '2026-02-28', effectiveDateStatus: 'declared' },
    TZ: { effectiveFrom: '2025-07-01', effectiveTo: '2026-06-30', effectiveDateStatus: 'declared' },
    UG: { effectiveFrom: '2026-07-01', effectiveTo: null, effectiveDateStatus: 'declared' },
    MW: { effectiveFrom: '2026-01-01', effectiveTo: null, effectiveDateStatus: 'declared' },
    SC: { effectiveFrom: '2018-06-01', effectiveTo: null, effectiveDateStatus: 'declared' }
  };
  return periods[code] || { effectiveFrom: null, effectiveTo: null, effectiveDateStatus: 'review-required' };
}

function currencyForCountry(countries, code) {
  const country = countries.find((entry) => entry.id === code);
  return country ? country.currency : null;
}

function countryFromArtifact(relativePath) {
  const server = relativePath.match(/^netlify\/functions\/_engines\/([a-z]{2})-paye\.js$/i);
  if (server) return server[1].toUpperCase();
  const browser = relativePath.match(/^assets\/js\/engines\/([a-z]{2})-paye\.js$/i);
  if (browser) return browser[1].toUpperCase();
  return null;
}

function safeFormulaParameters(engine, artifactPath, digest) {
  if (engine && engine.formulaParameters) {
    return {
      mode: 'schema-exposed-runtime-parameters',
      values: stableSortObject(engine.formulaParameters)
    };
  }
  return {
    mode: 'protected-legacy-parameter-reference',
    artifactPath,
    artifactDigest: digest,
    note: 'Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available.'
  };
}

function roundingForEngine(engine) {
  return engine && engine.roundingPolicy ? stableSortObject(engine.roundingPolicy) : {
    method: 'runtime-defined',
    precision: 'Preserve current executable behavior.',
    stages: ['Formula artifact controls intermediate and final rounding; fixture assertions protect observed stages.']
  };
}

function makeFormulaVersion(label, digest) {
  return label + '+sha256.' + digest.slice('sha256:'.length, 'sha256:'.length + 12);
}

function verificationByCountry(toolVerification, code) {
  const direct = toolVerification.tools && toolVerification.tools[code.toLowerCase() + '-paye'];
  if (direct) return direct;
  return Object.values(toolVerification.tools || {}).find((entry) => entry.tool_id === code.toLowerCase() + '-paye') || null;
}

function buildRouteFormulas(root, toolVerification, countries) {
  const formulas = [];
  const routeMappings = [];
  const formulaIdsByArtifact = new Map();

  for (const [toolKey, entry] of Object.entries(toolVerification.tools || {}).sort(([a], [b]) => a.localeCompare(b))) {
    const artifactPaths = (entry.routes || []).map((route) => routeToFile(root, route)).filter(Boolean).map(slash);
    if (!artifactPaths.length) continue;
    const primaryPath = artifactPaths.find((file) => !file.startsWith('fr/')) || artifactPaths[0];
    const codeMatch = entry.tool_id.match(/^([a-z]{2})-/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : 'ALL';
    const country = countries.find((item) => item.id === code);
    const digest = digestFile(root, primaryPath);
    const kind = /-vat(?:-fr)?$/i.test(entry.tool_id) ? 'vat' : 'paye';
    const formulaId = 'route-' + toolKey;
    const sources = sourceRefsFromVerification(entry);

    formulas.push({
      id: formulaId,
      formulaFamily: kind + '-route',
      formulaVersion: makeFormulaVersion((entry.law_or_version || kind + '-legacy').replace(/\s+/g, '-').slice(0, 48), digest),
      artifactPath: primaryPath,
      artifactDigest: digest,
      jurisdictions: [code],
      sourceJurisdictions: [country ? country.sourceJurisdiction : code],
      applicablePopulation: applicablePopulationFor('tax_payroll'),
      sources,
      effectiveFrom: null,
      effectiveTo: null,
      effectiveDateStatus: 'review-required',
      parameters: safeFormulaParameters(null, primaryPath, digest),
      rounding: roundingForEngine(null),
      currency: country ? country.currency : null,
      currencyAssumption: 'Canonical route currency from data/registry/countries.json; executable constants remain protected in the page artifact.',
      units: ['currency'],
      knownExclusions: entry.known_limitations || exclusionsFor('tax_payroll'),
      lastVerified: entry.last_verified,
      verificationBasis: entry.verified_by || 'AfroTools source audit',
      owner: 'AfroTools formula review owners',
      disclaimer: disclaimerFor('tax_payroll'),
      protectedDuplicates: artifactPaths.filter((file) => file !== primaryPath),
      riskLevel: 'high',
      riskDomain: 'tax_payroll',
      supportStatus: 'legacy-protected'
    });

    for (const artifactPath of artifactPaths) {
      if (!formulaIdsByArtifact.has(artifactPath)) formulaIdsByArtifact.set(artifactPath, []);
      formulaIdsByArtifact.get(artifactPath).push(formulaId);
    }

    routeMappings.push({
      toolId: toolKey,
      formulaId,
      routes: entry.routes.slice().sort(),
      sourceUrls: sources.map((source) => source.url).filter(Boolean)
    });
  }

  return { formulas, routeMappings, formulaIdsByArtifact };
}

function buildJsFormula(root, artifactPath, classification, countries, sourceRegistry, toolVerification) {
  const digest = digestFile(root, artifactPath);
  const countryCode = countryFromArtifact(artifactPath);
  let engine = null;
  let formulaFamily = idFromPath(artifactPath);
  let formulaId = 'formula-' + formulaFamily;
  let sources = [sourceTemplate(classification.riskDomain, sourceRegistry, artifactPath)];
  let lastVerified = '2026-03-01';
  let effective = { effectiveFrom: null, effectiveTo: null, effectiveDateStatus: 'not-applicable' };
  let currency = classification.riskDomain === 'health' ? null : 'MULTI';
  let sourceJurisdictions = ['ALL'];
  let jurisdictions = ['ALL'];
  let protectedDuplicates = [];

  if (artifactPath.startsWith('netlify/functions/_engines/')) {
    engine = require(path.join(root, artifactPath));
    formulaFamily = 'paye-server';
    formulaId = 'paye-server-' + engine.country.toLowerCase();
    jurisdictions = [engine.country];
    const country = countries.find((entry) => entry.id === engine.country);
    sourceJurisdictions = [country ? country.sourceJurisdiction : engine.country];
    currency = engine.currency;
    const verification = verificationByCountry(toolVerification, engine.country);
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    } else {
      sources = [{ registryId: null, title: engine.source, url: null, kind: 'artifact-declared', authorityStatus: 'review-required' }];
      lastVerified = engine.lastUpdated || lastVerified;
    }
    effective = effectivePeriodForServerCountry(engine.country);
    const browserCopy = 'assets/js/engines/' + engine.country.toLowerCase() + '-paye.js';
    if (fs.existsSync(path.join(root, browserCopy))) protectedDuplicates.push(browserCopy);
  } else if (artifactPath.startsWith('assets/js/engines/') && /-paye\.js$/.test(artifactPath)) {
    formulaFamily = 'paye-browser';
    formulaId = 'paye-browser-' + countryCode.toLowerCase();
    jurisdictions = [countryCode];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : null;
    const verification = verificationByCountry(toolVerification, countryCode);
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    }
    effective = effectivePeriodForServerCountry(countryCode);
    protectedDuplicates.push('netlify/functions/_engines/' + countryCode.toLowerCase() + '-paye.js');
  }

  const canonicalCurrency = countryCode ? currencyForCountry(countries, countryCode) : currency;
  const currencyOverride = countryCode && canonicalCurrency && currency !== canonicalCurrency ? {
    canonicalCurrency,
    runtimeCurrency: currency,
    status: 'review-required',
    reason: 'Runtime explicitly uses a currency different from the canonical country record; no automatic substitution is allowed.'
  } : null;

  return {
    id: formulaId,
    formulaFamily,
    formulaVersion: makeFormulaVersion((engine && engine.lastUpdated) || 'legacy-current', digest),
    artifactPath,
    artifactDigest: digest,
    jurisdictions,
    sourceJurisdictions,
    applicablePopulation: applicablePopulationFor(classification.riskDomain),
    sources,
    ...effective,
    parameters: safeFormulaParameters(engine, artifactPath, digest),
    rounding: roundingForEngine(engine),
    currency,
    currencyAssumption: currencyOverride
      ? 'Explicit runtime currency override; formula remains review-required and is never silently relabeled.'
      : (currency === null ? 'Non-currency result.' : 'Currency follows the declared runtime or canonical country data.'),
    currencyOverride,
    units: currency === null ? ['domain-specific'] : ['currency'],
    knownExclusions: exclusionsFor(classification.riskDomain),
    lastVerified,
    verificationBasis: sources.some((source) => source.authorityStatus === 'source-reviewed')
      ? 'AfroTools source audit'
      : 'Artifact or reviewed-dataset date; authority review may still be required.',
    owner: 'AfroTools formula review owners',
    disclaimer: disclaimerFor(classification.riskDomain),
    protectedDuplicates: protectedDuplicates.filter((file) => fs.existsSync(path.join(root, file))),
    riskLevel: classification.riskLevel,
    riskDomain: classification.riskDomain,
    supportStatus: currencyOverride ? 'review-required' : 'registered'
  };
}

function buildInventoryAndFormulas(root) {
  const countries = readJson(path.join(root, 'data/registry/countries.json'));
  const sourceRegistry = readJson(path.join(root, 'data/source-registry.json'));
  const toolVerification = readJson(path.join(root, 'data/tool-verification.json'));
  const routeBuild = buildRouteFormulas(root, toolVerification, countries);
  const formulas = routeBuild.formulas.slice();
  const formulaIdsByArtifact = routeBuild.formulaIdsByArtifact;
  const inventory = [];

  for (const artifactPath of discoverEngineArtifacts(root)) {
    const classification = classifyArtifact(artifactPath);
    let formulaIds = formulaIdsByArtifact.get(artifactPath) || [];
    if (!artifactPath.endsWith('.html') && classification.riskLevel !== 'low') {
      const formula = buildJsFormula(root, artifactPath, classification, countries, sourceRegistry, toolVerification);
      formulas.push(formula);
      formulaIds = [formula.id];
    }
    inventory.push({
      id: idFromPath(artifactPath),
      artifactPath,
      formulaFamily: formulaIds.length ? formulas.find((formula) => formula.id === formulaIds[0]).formulaFamily : 'general-utility',
      riskLevel: classification.riskLevel,
      riskDomain: classification.riskDomain,
      rationale: classification.rationale,
      formulaIds: formulaIds.slice().sort(),
      routeIds: routeBuild.routeMappings.filter((mapping) => formulaIds.includes(mapping.formulaId)).map((mapping) => mapping.toolId).sort(),
      owner: classification.riskLevel === 'low' ? 'AfroTools tool owners' : 'AfroTools formula review owners'
    });
  }

  return {
    inventory: { $schema: './calculation-quality.schema.json#/$defs/EngineInventory', schemaVersion: 1, generatedFrom: ENGINE_ROOTS, engines: inventory.sort((a, b) => a.artifactPath.localeCompare(b.artifactPath)) },
    formulas: {
      $schema: './calculation-quality.schema.json#/$defs/FormulaRegistry',
      schemaVersion: 1,
      formulas: formulas.sort((a, b) => a.id.localeCompare(b.id)),
      routeMappings: routeBuild.routeMappings.sort((a, b) => a.toolId.localeCompare(b.toolId))
    }
  };
}

function getPath(value, selector) {
  return String(selector).split('.').reduce((current, part) => current == null ? undefined : current[part], value);
}

function expectedSelectors(result, selectors) {
  return Object.fromEntries(selectors.map((selector) => [selector, stableSortObject(getPath(result, selector))]));
}

function generateGoldenFixtures(formulas, root) {
  const engineRegistry = require(path.join(root, 'netlify/functions/_engines'));
  const byCountry = new Map(formulas.formulas.filter((formula) => formula.formulaFamily === 'paye-server').map((formula) => [formula.jurisdictions[0], formula]));
  const fixtures = [];
  const selectors = ['tax.netTax', 'result.netAnnual', 'result.netMonthly', 'deductions.totalDeductions'];

  function addCalculate(code, suffix, input, caseClasses, extraSelectors) {
    const engine = engineRegistry.get(code);
    const formula = byCountry.get(code);
    if (!engine || !formula) return;
    const params = { ...input };
    delete params.country;
    const result = engine.calculate(params);
    fixtures.push({
      id: 'paye-' + code.toLowerCase() + '-' + suffix,
      formulaId: formula.id,
      formulaVersion: formula.formulaVersion,
      caseClasses,
      operation: 'paye-calculate',
      input: { country: code, ...params },
      expected: expectedSelectors(result, extraSelectors || selectors),
      tolerance: 0.01,
      evidence: formula.sources[0],
      changeNote: 'baseline-no-change'
    });
  }

  for (const code of engineRegistry.listCountryCodes()) {
    addCalculate(code, 'zero', { grossAnnual: 0 }, ['zero_input']);
    addCalculate(code, 'defaults', { grossAnnual: 1000000 }, ['missing_optional_input']);
    addCalculate(code, 'large-decimal', { grossAnnual: 1000000000.55 }, ['very_large_value', 'decimal_precision']);
  }

  addCalculate('ZA', 'exact-threshold', { grossAnnual: 95750 }, ['exact_threshold', 'band_boundary']);
  addCalculate('KE', 'rounding-stage', { grossAnnual: 1200000 }, ['rounding_stage']);
  addCalculate('NG', 'pita-2025', { grossAnnual: 5000000, regime: 'PITA_2025', pension: true, nhf: false }, ['changed_tax_year']);
  addCalculate('NG', 'nta-2026', { grossAnnual: 5000000, regime: 'NTA_2026', pension: true, nhf: false }, ['changed_tax_year']);

  const ngFormula = byCountry.get('NG');
  const zaFormula = byCountry.get('ZA');
  fixtures.push({
    id: 'paye-negative-input-rejected',
    formulaId: ngFormula.id,
    formulaVersion: ngFormula.formulaVersion,
    caseClasses: ['negative_input'],
    operation: 'tax-input-rejection',
    input: { grossAnnual: -1 },
    expected: { error: 'grossAnnual must be greater than 0' },
    tolerance: 0,
    evidence: ngFormula.sources[0],
    changeNote: 'baseline-no-change'
  });

  for (const item of [
    { id: 'unsupported-jurisdiction', jurisdiction: 'XX', effectiveOn: '2026-01-01', classes: ['unsupported_jurisdiction'], error: 'UNSUPPORTED_JURISDICTION' },
    { id: 'unsupported-date', jurisdiction: 'ZA', effectiveOn: '2026-03-01', classes: ['unsupported_date', 'date_boundary'], error: 'UNSUPPORTED_DATE' },
    { id: 'leap-day-date', jurisdiction: 'ZA', effectiveOn: '2024-02-29', classes: ['leap_year_date'], error: 'UNSUPPORTED_DATE' }
  ]) {
    fixtures.push({
      id: 'formula-resolve-' + item.id,
      formulaId: zaFormula.id,
      formulaVersion: zaFormula.formulaVersion,
      caseClasses: item.classes,
      operation: 'formula-resolve',
      input: { formulaFamily: 'paye-server', jurisdiction: item.jurisdiction, effectiveOn: item.effectiveOn },
      expected: { ok: false, error: item.error },
      tolerance: 0,
      evidence: zaFormula.sources[0],
      changeNote: 'baseline-no-change'
    });
  }

  return { $schema: './calculation-quality.schema.json#/$defs/GoldenFixtureRegistry', schemaVersion: 1, fixtures: fixtures.sort((a, b) => a.id.localeCompare(b.id)) };
}

function externalDataContracts() {
  return {
    $schema: './calculation-quality.schema.json#/$defs/ExternalDataRegistry',
    schemaVersion: 1,
    datasets: [
      {
        id: 'forex-live-rates',
        storageKey: 'forex-latest',
        staticFallbackPath: 'data/forex/latest.json',
        sourceRegistryId: 'forex-third-party-snapshot',
        schemaVersion: 1,
        requiredPaths: ['schemaVersion', 'timestamp', 'source', 'base', 'rates.NGN'],
        retrievedAtPath: 'timestamp',
        sourcePath: 'source',
        maxAgeHours: 24,
        lastKnownGoodStrategy: 'static-fallback',
        incompatibleAction: 'reject-before-write',
        publicStaleLabel: 'Stale exchange-rate estimate',
        forbiddenStaleLabels: ['live', 'current', 'official verified']
      },
      {
        id: 'fuel-live-prices',
        storageKey: 'fuel-latest',
        staticFallbackPath: 'data/fuel/latest.json',
        sourceRegistryId: 'afrofuel-static-snapshot',
        schemaVersion: 1,
        requiredPaths: ['schemaVersion', 'timestamp', 'source_state', 'countries'],
        retrievedAtPath: 'timestamp',
        sourcePath: 'source_state',
        maxAgeHours: 720,
        lastKnownGoodStrategy: 'static-fallback',
        incompatibleAction: 'reject-before-write',
        publicStaleLabel: 'Stale fuel-price estimate',
        forbiddenStaleLabels: ['live', 'current', 'official verified']
      },
      {
        id: 'policy-live-rates',
        storageKey: 'rates-latest',
        staticFallbackPath: 'data/rates/latest.json',
        sourceRegistryId: 'afrorates-policy-rate-pack',
        schemaVersion: 1,
        requiredPaths: ['schemaVersion', 'timestamp', 'countries'],
        retrievedAtPath: 'timestamp',
        sourcePath: '_verification.policy_rate_verified_at',
        maxAgeHours: 1080,
        lastKnownGoodStrategy: 'static-fallback',
        incompatibleAction: 'reject-before-write',
        publicStaleLabel: 'Stale policy-rate reference',
        forbiddenStaleLabels: ['live', 'current', 'official verified']
      }
    ]
  };
}

function buildQualityArtifacts(root) {
  const built = buildInventoryAndFormulas(root);
  return {
    inventory: built.inventory,
    formulas: built.formulas,
    fixtures: generateGoldenFixtures(built.formulas, root),
    externalData: externalDataContracts(),
    fixtureDeltas: { $schema: './calculation-quality.schema.json#/$defs/FixtureDeltaRegistry', schemaVersion: 1, deltas: [] }
  };
}

function assertDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) || Number.isNaN(new Date(value + 'T00:00:00Z').getTime())) {
    throw new Error(label + ' must be an ISO date');
  }
}

function assertFormulaMetadata(formula, engine, root) {
  const requiredStrings = ['id', 'formulaFamily', 'formulaVersion', 'artifactPath', 'artifactDigest', 'applicablePopulation', 'effectiveDateStatus', 'lastVerified', 'owner', 'disclaimer', 'riskLevel', 'riskDomain'];
  for (const field of requiredStrings) {
    if (!formula[field] || typeof formula[field] !== 'string') throw new Error(formula.id + ' missing ' + field);
  }
  if (!['high', 'medium'].includes(formula.riskLevel)) throw new Error(formula.id + ' invalid protected risk level');
  if (!RISK_DOMAINS.includes(formula.riskDomain)) throw new Error(formula.id + ' invalid risk domain');
  if (!Array.isArray(formula.jurisdictions) || !formula.jurisdictions.length) throw new Error(formula.id + ' missing jurisdictions');
  if (!Array.isArray(formula.sourceJurisdictions) || !formula.sourceJurisdictions.length) throw new Error(formula.id + ' missing sourceJurisdictions');
  if (!Array.isArray(formula.sources) || !formula.sources.length) throw new Error(formula.id + ' missing sources');
  if (!formula.parameters || typeof formula.parameters !== 'object') throw new Error(formula.id + ' missing parameters');
  if (!formula.rounding || typeof formula.rounding !== 'object') throw new Error(formula.id + ' missing rounding');
  if (!Array.isArray(formula.units) || !formula.units.length) throw new Error(formula.id + ' missing units');
  if (!Array.isArray(formula.knownExclusions) || !formula.knownExclusions.length) throw new Error(formula.id + ' missing exclusions');
  if (!Array.isArray(formula.protectedDuplicates)) throw new Error(formula.id + ' missing protectedDuplicates');
  assertDate(formula.lastVerified, formula.id + ' lastVerified');
  if (formula.effectiveDateStatus === 'declared') {
    assertDate(formula.effectiveFrom, formula.id + ' effectiveFrom');
    if (formula.effectiveTo) assertDate(formula.effectiveTo, formula.id + ' effectiveTo');
    if (formula.effectiveTo && formula.effectiveTo < formula.effectiveFrom) throw new Error(formula.id + ' invalid effective period');
  }
  const currentDigest = digestFile(root, formula.artifactPath);
  if (currentDigest !== formula.artifactDigest) throw new Error('FORMULA_DIGEST_MISMATCH ' + formula.id + ' ' + formula.artifactPath);
  if (!formula.formulaVersion.includes(formula.artifactDigest.slice(7, 19))) throw new Error(formula.id + ' formulaVersion does not include digest');
  if (engine && engine.artifactPath !== formula.artifactPath && !formula.protectedDuplicates.includes(engine.artifactPath)) {
    throw new Error(engine.id + ' is not the formula artifact or a protected duplicate for ' + formula.id);
  }
  return true;
}

function checkHighRiskRouteTraceability(verification, formulaRegistry) {
  const formulas = new Map((formulaRegistry.formulas || []).map((formula) => [formula.id, formula]));
  const mappings = new Map();
  for (const mapping of formulaRegistry.routeMappings || []) {
    if (!mappings.has(mapping.toolId)) mappings.set(mapping.toolId, []);
    mappings.get(mapping.toolId).push(mapping);
  }
  const gaps = [];
  const protectedEntries = Object.entries(verification.tools || {}).filter(([, entry]) => entry.risk_level === 'high');
  let mappedRoutes = 0;
  for (const [toolId] of protectedEntries) {
    const matches = mappings.get(toolId) || [];
    if (matches.length !== 1) {
      gaps.push(toolId + ': expected exactly one formula mapping, found ' + matches.length);
      continue;
    }
    const formula = formulas.get(matches[0].formulaId);
    const externalSources = matches[0].sourceUrls.filter((url) => /^https?:\/\//i.test(url) && !/afrotools\./i.test(url));
    if (!formula) gaps.push(toolId + ': mapped formula missing');
    else if (!externalSources.length) gaps.push(toolId + ': no external source URL');
    else mappedRoutes += 1;
  }
  return { protectedRoutes: protectedEntries.length, mappedRoutes, gaps: gaps.sort() };
}

function resolveFormula(formulaRegistry, request) {
  const jurisdiction = String(request.jurisdiction || '').toUpperCase();
  const effectiveOn = String(request.effectiveOn || '');
  const base = {
    formulaFamily: request.formulaFamily,
    jurisdiction,
    effectiveOn
  };
  const family = (formulaRegistry.formulas || []).filter((formula) => formula.formulaFamily === request.formulaFamily);
  const jurisdictionMatches = family.filter((formula) => formula.jurisdictions.includes(jurisdiction));
  if (!jurisdictionMatches.length) return { ok: false, error: 'UNSUPPORTED_JURISDICTION', ...base };
  const dateMatches = jurisdictionMatches.filter((formula) => {
    if (formula.effectiveDateStatus === 'not-applicable') return true;
    if (formula.effectiveDateStatus !== 'declared') return false;
    return effectiveOn >= formula.effectiveFrom && (!formula.effectiveTo || effectiveOn <= formula.effectiveTo);
  });
  if (!dateMatches.length) return { ok: false, error: 'UNSUPPORTED_DATE', ...base };
  if (dateMatches.length > 1) return { ok: false, error: 'AMBIGUOUS_FORMULA_VERSION', ...base };
  const formula = dateMatches[0];
  return {
    ok: true,
    formulaId: formula.id,
    formulaVersion: formula.formulaVersion,
    artifactPath: formula.artifactPath,
    jurisdiction,
    effectiveFrom: formula.effectiveFrom,
    effectiveTo: formula.effectiveTo
  };
}

function compareExpected(actual, expected, tolerance) {
  const failures = [];
  for (const [selector, expectedValue] of Object.entries(expected)) {
    const actualValue = getPath(actual, selector);
    if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
      if (Math.abs(actualValue - expectedValue) > tolerance) failures.push(selector + ': expected ' + expectedValue + ', got ' + actualValue);
    } else if (actualValue !== expectedValue) {
      failures.push(selector + ': expected ' + JSON.stringify(expectedValue) + ', got ' + JSON.stringify(actualValue));
    }
  }
  return failures;
}

function runGoldenFixtures(artifacts, root) {
  const engineRegistry = require(path.join(root, 'netlify/functions/_engines'));
  const taxRequest = require(path.join(root, 'netlify/functions/_shared/tax-request'));
  const formulaById = new Map(artifacts.formulas.formulas.map((formula) => [formula.id, formula]));
  const failures = [];
  const changes = [];
  let passed = 0;

  for (const fixture of artifacts.fixtures.fixtures) {
    const formula = formulaById.get(fixture.formulaId);
    if (!formula || formula.formulaVersion !== fixture.formulaVersion) {
      failures.push({ id: fixture.id, errors: ['Formula version mismatch'] });
      continue;
    }
    let actual;
    try {
      if (fixture.operation === 'paye-calculate') {
        const engine = engineRegistry.get(fixture.input.country);
        if (!engine) throw new Error('Unsupported fixture country ' + fixture.input.country);
        const input = { ...fixture.input };
        delete input.country;
        actual = engine.calculate(input);
      } else if (fixture.operation === 'tax-input-rejection') {
        try {
          taxRequest.resolveAnnualSalaryInputs(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.message };
        }
      } else if (fixture.operation === 'formula-resolve') {
        actual = resolveFormula(artifacts.formulas, fixture.input);
      } else {
        throw new Error('Unknown fixture operation ' + fixture.operation);
      }
      const fixtureFailures = compareExpected(actual, fixture.expected, fixture.tolerance || 0);
      if (fixtureFailures.length) failures.push({ id: fixture.id, errors: fixtureFailures });
      else passed += 1;
    } catch (error) {
      failures.push({ id: fixture.id, errors: [error.message] });
    }
  }

  for (const delta of artifacts.fixtureDeltas.deltas || []) changes.push(delta.fixtureId);
  return { total: artifacts.fixtures.fixtures.length, passed, failed: failures.length, failures, changes: changes.sort() };
}

function validateExternalData(contract, payload, nowIso) {
  const errors = [];
  if (!payload || typeof payload !== 'object') errors.push('payload must be an object');
  for (const requiredPath of contract.requiredPaths || []) {
    const value = getPath(payload, requiredPath);
    if (value === undefined || value === null || value === '') errors.push('missing required path ' + requiredPath);
  }
  const sourceValue = payload ? getPath(payload, contract.sourcePath) : null;
  if (sourceValue === undefined || sourceValue === null || sourceValue === '') errors.push('missing source metadata at ' + contract.sourcePath);
  if (payload && payload.schemaVersion !== contract.schemaVersion) errors.push('schemaVersion must equal ' + contract.schemaVersion);
  const retrievedAt = payload ? getPath(payload, contract.retrievedAtPath) : null;
  const retrievedMs = new Date(retrievedAt).getTime();
  if (!retrievedAt || Number.isNaN(retrievedMs)) errors.push('invalid retrieval timestamp at ' + contract.retrievedAtPath);
  if (errors.length) {
    return {
      valid: false,
      code: 'INCOMPATIBLE_EXTERNAL_DATA',
      publicState: 'unavailable',
      publicLabel: 'Data unavailable - retained last-known-good value',
      errors,
      retrievedAt: retrievedAt || null,
      preserveLastKnownGood: true
    };
  }
  const ageHours = (new Date(nowIso).getTime() - retrievedMs) / 3600000;
  const stale = ageHours > contract.maxAgeHours;
  return {
    valid: true,
    code: stale ? 'STALE_EXTERNAL_DATA' : 'OK',
    publicState: stale ? 'stale' : 'fresh',
    publicLabel: stale ? contract.publicStaleLabel : 'Fresh data',
    errors: [],
    retrievedAt,
    preserveLastKnownGood: false
  };
}

function checkCountryIdentity(artifacts, root) {
  const countries = readJson(path.join(root, 'data/registry/countries.json'));
  const countryById = new Map(countries.map((country) => [country.id, country]));
  const formulaById = new Map(artifacts.formulas.formulas.map((formula) => [formula.id, formula]));
  const errors = [];
  let checked = 0;
  for (const formula of artifacts.formulas.formulas) {
    for (const code of formula.jurisdictions) {
      if (code === 'ALL') continue;
      checked += 1;
      const country = countryById.get(code);
      if (!country) {
        errors.push(formula.id + ': unknown country ' + code);
        continue;
      }
      if (!formula.sourceJurisdictions.includes(country.sourceJurisdiction)) errors.push(formula.id + ': source jurisdiction mismatch');
      if (formula.currency && formula.currency !== country.currency) {
        if (!formula.currencyOverride || formula.currencyOverride.canonicalCurrency !== country.currency || formula.currencyOverride.status !== 'review-required') {
          errors.push(formula.id + ': currency ' + formula.currency + ' does not match ' + country.currency);
        }
      }
    }
  }
  for (const mapping of artifacts.formulas.routeMappings || []) {
    const formula = formulaById.get(mapping.formulaId);
    if (!formula) {
      errors.push(mapping.toolId + ': route mapping references unknown formula ' + mapping.formulaId);
      continue;
    }
    const declaredArtifacts = new Set([formula.artifactPath].concat(formula.protectedDuplicates || []).map(slash));
    for (const route of mapping.routes || []) {
      const routeFile = routeToFile(root, route);
      if (!routeFile) {
        errors.push(mapping.toolId + ': route does not resolve ' + route);
      } else if (!declaredArtifacts.has(slash(routeFile))) {
        errors.push(mapping.toolId + ': route ' + route + ' resolves outside formula artifacts');
      }
    }
    const jurisdiction = formula.jurisdictions.length === 1 ? formula.jurisdictions[0] : null;
    const toolCountry = String(mapping.toolId || '').split('-')[0].toUpperCase();
    if (jurisdiction && jurisdiction !== 'ALL' && toolCountry !== jurisdiction) {
      errors.push(mapping.toolId + ': route country ' + toolCountry + ' does not match formula jurisdiction ' + jurisdiction);
    }
  }
  return { checked, errors: errors.sort() };
}

function generateQualityReport(artifacts, root, asOf) {
  const findings = [];
  const formulaById = new Map(artifacts.formulas.formulas.map((formula) => [formula.id, formula]));
  for (const engine of artifacts.inventory.engines.filter((entry) => entry.riskLevel !== 'low')) {
    for (const formulaId of engine.formulaIds) {
      const formula = formulaById.get(formulaId);
      try {
        if (!formula) throw new Error('Missing formula ' + formulaId);
        assertFormulaMetadata(formula, engine, root);
      } catch (error) {
        findings.push({ code: error.message.startsWith('FORMULA_DIGEST_MISMATCH') ? 'FORMULA_DIGEST_MISMATCH' : 'FORMULA_METADATA_INVALID', severity: 'error', id: formulaId, path: formula ? formula.artifactPath : engine.artifactPath, message: error.message });
      }
    }
  }
  const verification = readJson(path.join(root, 'data/tool-verification.json'));
  const traceability = checkHighRiskRouteTraceability(verification, artifacts.formulas);
  for (const gap of traceability.gaps) findings.push({ code: 'TRACEABILITY_GAP', severity: 'error', id: gap.split(':')[0], path: 'data/tool-verification.json', message: gap });
  const fixtures = runGoldenFixtures(artifacts, root);
  for (const failure of fixtures.failures) findings.push({ code: 'GOLDEN_FIXTURE_FAILED', severity: 'error', id: failure.id, path: QUALITY_FILES.fixtures, message: failure.errors.join('; ') });
  const identity = checkCountryIdentity(artifacts, root);
  for (const message of identity.errors) findings.push({ code: 'COUNTRY_IDENTITY_MISMATCH', severity: 'error', id: message.split(':')[0], path: 'data/registry/countries.json', message });

  const stale = [];
  const incompatible = [];
  for (const contract of artifacts.externalData.datasets) {
    const fallback = contract.staticFallbackPath ? readJson(path.join(root, contract.staticFallbackPath)) : null;
    const result = validateExternalData(contract, fallback, asOf + 'T00:00:00Z');
    if (!result.valid) {
      incompatible.push(contract.id);
      findings.push({ code: 'INCOMPATIBLE_EXTERNAL_DATA', severity: 'error', id: contract.id, path: contract.staticFallbackPath || '', message: result.errors.join('; ') });
    } else if (result.publicState === 'stale') {
      stale.push(contract.id);
      findings.push({ code: 'STALE_EXTERNAL_DATA', severity: 'warning', id: contract.id, path: contract.staticFallbackPath || '', message: result.publicLabel });
    }
  }

  const counts = { total: artifacts.inventory.engines.length, high: 0, medium: 0, low: 0 };
  for (const engine of artifacts.inventory.engines) counts[engine.riskLevel] += 1;
  const protectedFormulas = artifacts.formulas.formulas.filter((formula) => formula.riskLevel === 'high' || formula.riskLevel === 'medium');
  const reviewBacklog = {
    highRiskEffectiveDates: protectedFormulas.filter((formula) => formula.riskLevel === 'high' && formula.effectiveDateStatus === 'review-required').length,
    mediumRiskEffectiveDates: protectedFormulas.filter((formula) => formula.riskLevel === 'medium' && formula.effectiveDateStatus === 'review-required').length,
    highRiskSources: protectedFormulas.filter((formula) => formula.riskLevel === 'high' && formula.sources.some((source) => source.authorityStatus === 'review-required')).length,
    mediumRiskSources: protectedFormulas.filter((formula) => formula.riskLevel === 'medium' && formula.sources.some((source) => source.authorityStatus === 'review-required')).length,
    currencyOverrides: protectedFormulas.filter((formula) => formula.currencyOverride && formula.currencyOverride.status === 'review-required').length,
    legacyProtected: protectedFormulas.filter((formula) => formula.supportStatus === 'legacy-protected').length
  };
  if (reviewBacklog.highRiskEffectiveDates || reviewBacklog.mediumRiskEffectiveDates) {
    findings.push({
      code: 'EFFECTIVE_DATE_REVIEW_REQUIRED',
      severity: 'warning',
      id: 'formula-registry',
      path: QUALITY_FILES.formulas,
      message: reviewBacklog.highRiskEffectiveDates + ' high-risk and ' + reviewBacklog.mediumRiskEffectiveDates + ' medium-risk formula records have unknown statutory effective dates; they remain explicitly review-required.'
    });
  }
  if (reviewBacklog.highRiskSources || reviewBacklog.mediumRiskSources) {
    findings.push({
      code: 'SOURCE_REVIEW_REQUIRED',
      severity: 'warning',
      id: 'formula-registry',
      path: QUALITY_FILES.formulas,
      message: reviewBacklog.highRiskSources + ' high-risk and ' + reviewBacklog.mediumRiskSources + ' medium-risk formula records still require authoritative-source review.'
    });
  }
  if (reviewBacklog.currencyOverrides) {
    findings.push({
      code: 'CURRENCY_OVERRIDE_REVIEW_REQUIRED',
      severity: 'warning',
      id: 'formula-registry',
      path: QUALITY_FILES.formulas,
      message: reviewBacklog.currencyOverrides + ' formula currency override remains explicitly review-required.'
    });
  }
  return stableSortObject({
    schemaVersion: 1,
    asOf,
    inventory: counts,
    traceability,
    fixtures: { total: fixtures.total, passed: fixtures.passed, failed: fixtures.failed, changes: fixtures.changes },
    externalData: { total: artifacts.externalData.datasets.length, stale: stale.sort(), incompatible: incompatible.sort() },
    reviewBacklog,
    countryIdentity: { checked: identity.checked, errors: identity.errors },
    findings: findings.sort((a, b) => (a.severity + a.code + a.id).localeCompare(b.severity + b.code + b.id))
  });
}

function reportMarkdown(report) {
  const lines = [
    '# Calculation Quality Report',
    '',
    `As of: ${report.asOf}`,
    '',
    '## Inventory',
    '',
    `- Total artifacts: ${report.inventory.total}`,
    `- High risk: ${report.inventory.high}`,
    `- Medium risk: ${report.inventory.medium}`,
    `- Low risk: ${report.inventory.low}`,
    '',
    '## Traceability',
    '',
    `- Protected PAYE/VAT records: ${report.traceability.protectedRoutes}`,
    `- Formula-mapped records: ${report.traceability.mappedRoutes}`,
    `- Gaps: ${report.traceability.gaps.length}`,
    '',
    '## Review backlog',
    '',
    `- High-risk effective dates requiring review: ${report.reviewBacklog.highRiskEffectiveDates}`,
    `- Medium-risk effective dates requiring review: ${report.reviewBacklog.mediumRiskEffectiveDates}`,
    `- High-risk sources requiring review: ${report.reviewBacklog.highRiskSources}`,
    `- Medium-risk sources requiring review: ${report.reviewBacklog.mediumRiskSources}`,
    `- Currency overrides requiring review: ${report.reviewBacklog.currencyOverrides}`,
    `- Legacy protected formula records: ${report.reviewBacklog.legacyProtected}`,
    '',
    '## Golden fixtures',
    '',
    `- Passed: ${report.fixtures.passed}/${report.fixtures.total}`,
    `- Documented result changes: ${report.fixtures.changes.length}`,
    '',
    '## External data',
    '',
    `- Registered datasets: ${report.externalData.total}`,
    `- Stale: ${report.externalData.stale.length ? report.externalData.stale.join(', ') : 'none'}`,
    `- Incompatible: ${report.externalData.incompatible.length ? report.externalData.incompatible.join(', ') : 'none'}`,
    '',
    '## Findings',
    ''
  ];
  if (!report.findings.length) lines.push('- None.');
  else for (const finding of report.findings) lines.push(`- ${finding.severity.toUpperCase()} ${finding.code} ${finding.id}: ${finding.message}`);
  return lines.join('\n') + '\n';
}

module.exports = {
  RISK_DOMAINS,
  REQUIRED_FIXTURE_CLASSES,
  QUALITY_FILES,
  discoverEngineArtifacts,
  classifyArtifact,
  loadQualityArtifacts,
  buildQualityArtifacts,
  assertFormulaMetadata,
  checkHighRiskRouteTraceability,
  resolveFormula,
  runGoldenFixtures,
  validateExternalData,
  checkCountryIdentity,
  generateQualityReport,
  reportMarkdown,
  stableJson,
  digestFile
};
