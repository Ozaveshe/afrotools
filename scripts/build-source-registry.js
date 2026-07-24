'use strict';

const fs = require('fs');
const path = require('path');

const sourceConfidence = require('../assets/js/lib/source-confidence.js');
const canonicalRegistry = require('./lib/canonical-registry');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'data', 'source-registry.json');
const FORMULA_PATH = path.join(ROOT, 'data', 'calculation-quality', 'formula-registry.json');
const TOOL_VERIFICATION_PATH = path.join(ROOT, 'data', 'tool-verification.json');
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

const SOURCE_SCOPE_ALIASES = {
  amortization: 'business',
  banking: 'business',
  cpi: 'business',
  employment: 'salary',
  fees: 'business',
  finance: 'business',
  'financial-planning': 'business',
  goals: 'business',
  government: 'other',
  inflation: 'business',
  investment: 'business',
  legal: 'documents',
  loans: 'business',
  payments: 'business',
  pensions: 'salary',
  'personal-finance': 'business',
  property: 'business',
  'purchasing-power': 'business',
  retirement: 'salary',
  savings: 'business',
  'self-employment': 'business',
  'side-income': 'business',
  statistics: 'business',
  'student-finance': 'education',
  'tax-planning': 'tax',
  transport: 'business',
  'vehicle-finance': 'business',
};

function normalizeAppliesToScopes(values) {
  return unique((values || []).map(function (scope) {
    const normalized = String(scope || '').trim();
    if (sourceConfidence.APPLIES_TO.includes(normalized)) return normalized;
    return SOURCE_SCOPE_ALIASES[normalized] || 'other';
  }));
}

function freshnessStatus(lastCheckedAt, lastReviewedAt, cadenceDays, today) {
  return sourceConfidence.calculateFreshnessStatus({ lastCheckedAt: lastCheckedAt || null, lastReviewedAt: lastReviewedAt || null, reviewCadenceDays: cadenceDays, freshnessStatus: lastCheckedAt || lastReviewedAt ? 'acceptable' : 'unknown', confidence: 'reviewed' }, today);
}

function sourceTypeForFormula(source) {
  const kind = String((source && source.kind) || '').toLowerCase();
  const title = String((source && source.title) || '').toLowerCase();
  if (/central.bank/.test(kind + ' ' + title)) return 'central_bank';
  if (/regulator/.test(kind + ' ' + title)) return 'regulator';
  if (/authority|official|government|revenue|customs|tax/.test(kind + ' ' + title)) return 'official';
  if (/third.party|snapshot/.test(kind + ' ' + title)) return 'third_party_snapshot';
  return 'reviewed_dataset';
}

function sourceTypeForLedger(source) {
  const value = String((source && source.sourceType) || '').toLowerCase();
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
  const source =
    (formula.sources || []).find(function (item) {
      return sourceUrl(item);
    }) ||
    (formula.sources || [])[0] ||
    {};
  const checked = dateOnly(formula.lastVerified);
  const cadenceDays = options.cadenceDays || 90;
  const countryCode = options.countryCode;
  const sourceName = source.title || options.fallbackName;
  const confidence = checked ? 'reviewed' : 'low_confidence';
  const entry = { id: options.id, sourceName, sourceType: sourceTypeForFormula(source), countryCodes: [countryCode || 'ALL'], appliesTo: options.appliesTo, lastCheckedAt: checked, lastReviewedAt: checked, freshnessStatus: freshnessStatus(checked, checked, cadenceDays, today), confidence, reviewCadenceDays: cadenceDays, notes: options.notes + ' Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.', displayDisclaimer: options.disclaimer };
  return withOptional(entry, { sourceUrl: sourceUrl(source), effectiveFrom: dateOnly(formula.effectiveFrom), effectiveTo: dateOnly(formula.effectiveTo), toolIds: unique(options.toolIds), routes: unique(options.routes) });
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
    .concat((source && source.fields) || [])
    .concat(
      (tools || []).map(function (tool) {
        return tool.lane + ' ' + tool.id;
      }),
    )
    .join(' ')
    .toLowerCase();
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
  const toolVerification = readJson(TOOL_VERIFICATION_PATH);
  const meta = readJson(META_PATH);
  const countries = readJson(COUNTRY_PATH);
  const countryNames = new Map(
    countries.map(function (country) {
      return [country.id, country.title];
    }),
  );
  const tools = canonicalRegistry.loadSources().tools;
  const toolsByRoute = new Map();
  tools.forEach(function (tool) {
    const route = normalizedRoute(tool.href);
    if (!toolsByRoute.has(route)) toolsByRoute.set(route, []);
    toolsByRoute.get(route).push(tool.id);
  });

  const generatedId = /^(?:paye-[a-z]{2}-source|vat-[a-z]{2}-source|crypto-cgt-ng-ke-za-gh-2026-source$|nigeria-(?:cit|cgt|wht)-2026-source$|kenya-(?:cgt|wht)-2026-source$|south-africa-(?:cgt-2027|dividends-tax|uif)-source$|transfer-pricing-method-source$|investment-return-method-source$|pension-projection-method-source$|ng-pension-cps-scenario-method$|staff-cost-user-input-method$|employee-cost-user-input-method$|contractor-vs-employee-user-input-method$|domestic-worker-user-input-method$|gratuity-user-input-method$|parental-leave-user-input-method$|retrenchment-user-input-method$|route-fares-user-input-method$|backup-power-costs-user-input-method$|salary-offer-comparison-method$|salary-evidence-notebook-method$|retirement-scenario-user-input-method$|side-income-tax-reserve-user-input-method$|bank-charge-offer-user-input-method$|inflation-scenario-user-input-method$|savings-goal-user-input-method$|car-loan-user-input-method$|student-loan-user-input-method$|social-security-|electricity-tariff-rates$|remittance-fx-planning$|mortgage-planning-method$|loan-comparison-method$|payslip-draft-method$|kra-(?:itax|etims)-guide-source$|sars-efiling-guide-source$|cnps-ci-guide-source$|cbk-manual-rate-guide-source$|ledger-tool-|official-)/;
  const entries = new Map(
    existing.sources
      .filter(function (source) {
        return !generatedId.test(source.id);
      })
      .map(function (source) {
        return [source.id, Object.assign({}, source)];
      }),
  );
  function add(entry) {
    if (entries.has(entry.id)) throw new Error('Duplicate generated source id: ' + entry.id);
    entry.appliesTo = normalizeAppliesToScopes(entry.appliesTo);
    if (entry.confidence === 'authoritative') entry.confidence = 'reviewed';
    if (entry.sourceType === 'multilateral') entry.sourceType = 'reviewed_dataset';
    entries.set(entry.id, entry);
  }

  const forex = entries.get('forex-third-party-snapshot');
  updateLiveMetaEntry(forex, meta.forex, today, {
    cadenceDays: 7,
    confidence: 'estimated',
    sourceName: function () {
      return 'Foreign-exchange third-party API snapshot';
    },
    notes: function () {
      return 'Current committed fallback metadata; FX remains indicative and is not an executable provider quote.';
    },
  });
  mergeCoverage(
    forex,
    ['currency-converter', 'convertisseur-devises-fr', 'zana-kibadilishaji-sarafu-sw', 'forex-profit'],
    ['/tools/currency-converter/', '/fr/tools/convertisseur-devises/', '/sw/zana/kibadilishaji-sarafu/', '/tools/forex-profit/'],
  );

  const fuel = entries.get('afrofuel-static-snapshot');
  updateLiveMetaEntry(fuel, meta.fuel, today, {
    cadenceDays: 30,
    confidence: 'estimated',
    sourceName: function () {
      return 'AfroFuel latest available fuel-price snapshot';
    },
    notes: function (lane) {
      return 'Committed fallback with source_state=' + ((lane && lane.source_state) || 'unknown') + '. Row-level official verification remains separate.';
    },
  });
  mergeCoverage(fuel, ['fuel-tracker'], ['/tools/fuel-tracker/']);

  add({
    id: 'route-fares-user-input-method',
    sourceName: 'Route Fares user-confirmed-fare methodology',
    sourceType: 'reviewed_dataset',
    countryCodes: ['ALL'],
    appliesTo: ['transport', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local planning method. The user confirms every fare and cost input. Optional published community observations are read-only, non-official and never treated as a current quote; planner inputs are not sent with the feed request.',
    displayDisclaimer: 'Planning estimate only. Confirm the current fare, transfers, luggage, booking and peak-time charges with the operator, stage, ticket seller or transport app before travel.',
    toolIds: ['route-fares', 'tarifs-itineraire-fr', 'zana-nauli-za-ruti-sw'],
    routes: ['/tools/route-fares/', '/fr/tools/tarifs-itineraire/', '/sw/zana/nauli-za-ruti/'],
  });

  add({
    id: 'backup-power-costs-user-input-method',
    sourceName: 'Backup Power Costs transparent user-input methodology',
    sourceType: 'reviewed_dataset',
    countryCodes: ['ALL'],
    appliesTo: ['energy', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local planning method. The user supplies load, outage, price, quote, service-life, efficiency and maintenance assumptions. Generator running cost is compared with straight-line battery and solar monthly equivalents. No live tariff, quote, savings, payback, engineering sizing or lifecycle-cost verdict is supplied, and no planner field is transmitted.',
    displayDisclaimer: 'Planning comparison only. Confirm load and surge sizing, usable battery capacity, component life, solar yield, current local prices, written quotes, installation and electrical safety before purchase.',
    toolIds: ['backup-power-costs', 'couts-secours-energie-fr', 'backup-power-costs-sw-coverage-backup-power-costs'],
    routes: ['/tools/backup-power-costs/', '/fr/tools/couts-secours-energie/', '/sw/zana/gharama-ya-nishati-ya-dharura/'],
  });

  add({
    id: 'salary-offer-comparison-method',
    sourceName: 'Salary Offer Comparator user-input methodology with ILOSTAT earnings guidance',
    sourceType: 'official',
    sourceUrl: 'https://ilostat.ilo.org/methods/concepts-and-definitions/description-wages-and-working-time-statistics/',
    countryCodes: ['ALL'],
    appliesTo: ['salary', 'employment', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local same-currency comparison method. The user supplies both written packages and dated evidence labels. Gross earnings include annualised base pay, recurring cash allowances and guaranteed annual bonus; non-cash benefits and employer contributions remain separate. ILOSTAT supports the component boundary only and supplies no market values. No salary band, FX, PPP, tax, net-pay, AI or network result is supplied.',
    displayDisclaimer: 'Planning comparison only. Confirm the written offers, currency, pay period, benefit values, working time, tax treatment and current local rules. This is not market salary evidence, a net-pay result, legal advice or a recommendation.',
    toolIds: ['salary-compare', 'comparateur-salaires-fr', 'zana-kilinganisha-mishahara-sw'],
    routes: ['/tools/salary-compare/', '/fr/tools/comparateur-salaires/', '/sw/zana/kilinganisha-mishahara/'],
  });

  add({
    id: 'salary-evidence-notebook-method',
    sourceName: 'Salary Evidence Notebook user-input methodology with NIST percentiles and ILOSTAT earnings context',
    sourceType: 'official',
    sourceUrl: 'https://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm',
    countryCodes: ['ALL'],
    appliesTo: ['salary', 'employment', 'statistics', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local evidence method. Users supply every observation, same-scope metadata, evidence label and date. Monthly values are annualised by multiplying by 12. At least five fresh rows with the same country, city scope, role, experience, currency and gross/net basis are required. Q1, median and Q3 use the documented NIST p(N+1) interpolation method. ILOSTAT earnings guidance provides gross-pay context only. No market values, representative-population claim, upload, account, AI or automatic storage is supplied.',
    displayDisclaimer: 'Descriptive sample summary only. It is not an official wage schedule, representative market benchmark, job offer, tax or net-pay result, fair-pay conclusion, legal advice or recommendation.',
    toolIds: ['salary-intelligence', 'salary-benchmarks-fr'],
    routes: ['/tools/salary-intelligence/', '/fr/jobs/salary-benchmarks/'],
  });

  add({
    id: 'retirement-scenario-user-input-method',
    sourceName: 'Retirement Scenario Planner user-input methodology with Investor.gov compounding context',
    sourceType: 'official',
    sourceUrl: 'https://www.investor.gov/financial-tools-calculators/calculators/savings-goal-calculator',
    countryCodes: ['ALL'],
    appliesTo: ['retirement', 'savings', 'investment', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local today-money scenario. Users supply every balance, contribution, spending amount, other retirement income, annual real return after inflation/fees/tax, withdrawal assumption and a checked evidence label dated within 365 days. Target fund equals the spending shortfall divided by the user withdrawal assumption. Current balance and end-of-month contributions compound at the equivalent monthly real rate. No country preset, market return, inflation rate, pension benefit, safe-withdrawal claim, forecast, AI or network request is supplied.',
    displayDisclaimer: 'Deterministic planning scenario only. Confirm current pension statements, tax treatment, fees, benefit access, inflation basis and investment assumptions. This is not a forecast, guaranteed outcome, safe withdrawal recommendation, investment advice, tax advice or legal advice.',
    toolIds: ['retirement-planner', 'planificateur-retraite-fr', 'zana-mpango-wa-kustaafu-mapema-sw'],
    routes: ['/tools/retirement-planner/', '/fr/tools/planificateur-retraite/', '/sw/zana/mpango-wa-kustaafu-mapema/'],
  });

  add({
    id: 'side-income-tax-reserve-user-input-method',
    sourceName: 'Side-Income Tax Reserve user-input methodology with ATAF authority-directory context',
    sourceType: 'official',
    sourceUrl: 'https://www.ataftax.org/members',
    countryCodes: ['ALL'],
    appliesTo: ['side-income', 'self-employment', 'tax-planning', 'finance'],
    lastCheckedAt: today,
    lastReviewedAt: today,
    freshnessStatus: 'fresh',
    confidence: 'reviewed',
    reviewCadenceDays: 365,
    notes: 'Local arithmetic worksheet. Users supply every jurisdiction, tax period, amount, reserve rate, credit and evidence label dated within 365 days. Recorded costs reduce planning profit but are never represented as legally deductible. Equal instalments are planning splits only. No country rate, bracket, relief, threshold, tax regime, turnover tax, filing date, platform preset, tax advice, final liability, AI or network request is supplied. Primary guidance examples checked during review: KRA return preparation, SARS provisional tax and GRA personal income tax.',
    displayDisclaimer: 'Planning worksheet only. Confirm taxpayer type, taxable income, deductions, withholding treatment, current rates, reliefs, thresholds, registration and deadlines with the responsible tax authority or a qualified tax adviser.',
    toolIds: ['side-hustle-tax', 'impot-activite-secondaire-fr'],
    routes: ['/tools/side-hustle-tax/', '/fr/tools/impot-activite-secondaire/'],
  });

  add({ id: 'bank-charge-offer-user-input-method', sourceName: 'Bank Charge Offer Comparator user-input methodology with Bank of Ghana consumer-information context', sourceType: 'regulator', sourceUrl: 'https://www.bog.gov.gh/supervision-regulation/consumer-rights-and-responsibilities/', countryCodes: ['ALL'], appliesTo: ['banking', 'payments', 'fees', 'personal-finance'], lastCheckedAt: today, lastReviewedAt: today, freshnessStatus: 'fresh', confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Local comparison using two user-entered provider tariff documents and one shared activity profile. Evidence dates must be within 365 days. Annual total is monthly total multiplied by twelve. No bank price, country fee, free allowance, transaction band, recommendation, service-quality verdict, forecast, AI or network request is supplied. Bank of Ghana consumer guidance provides complete-product-information context; its dated survey demonstrates tariff specificity.', displayDisclaimer: 'User-entered fee comparison only. Confirm product-specific transaction bands, taxes, waivers, limits, exchange rates, third-party charges, eligibility and effective dates with each provider.', toolIds: ['bank-charges', 'frais-bancaires-fr', 'bank-charges-ha', 'zana-ada-za-benki-sw'], routes: ['/tools/bank-charges/', '/fr/tools/frais-bancaires/', '/ha/kayan-aiki/cajin-banki/', '/sw/zana/ada-za-benki/'] });
  add({ id: 'inflation-scenario-user-input-method', sourceName: 'Inflation Scenario Calculator user-input methodology with World Bank CPI indicator metadata context', sourceType: 'multilateral', sourceUrl: 'https://databank.worldbank.org/metadataglossary/gender-statistics/series/FP.CPI.TOTL.ZG', countryCodes: ['ALL'], appliesTo: ['inflation', 'cpi', 'purchasing-power', 'personal-finance'], lastCheckedAt: today, lastReviewedAt: today, freshnessStatus: 'fresh', confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Local constant-rate scenario using a user-entered annual rate, source label and checked date within 365 days. No country rates, live CPI feed, household-basket multiplier, forecast, investment advice, AI or network request is supplied.', displayDisclaimer: 'User-entered constant-rate scenario only. Confirm geography, period, measure, source and publication date. Headline CPI may not match a personal basket.', toolIds: ['inflation-calc', 'calculateur-inflation-fr'], routes: ['/tools/inflation-calc/', '/fr/tools/calculateur-inflation/'] });
  add({ id:'savings-goal-user-input-method', sourceName:'Savings Goal Planner user-input methodology with FSCA consumer financial-goal context', sourceType:'regulator', sourceUrl:'https://www.fsca.co.za/Consumers/', countryCodes:['ALL'], appliesTo:['savings','goals','personal-finance'], lastCheckedAt:today, lastReviewedAt:today, freshnessStatus:'fresh', confidence:'reviewed', reviewCadenceDays:365, notes:'Local constant-return plan using user-entered goal, current savings, month-end contribution, period, effective annual return assumption, source and checked date within 365 days. No product or country rates, presets, guarantee, recommendation, tax claim, AI or network request.', displayDisclaimer:'User-entered constant-return plan only. Confirm interest method, fees, tax, access restrictions, risk and current provider terms.', toolIds:['savings-goal','objectif-epargne-fr','zana-lengo-la-akiba-sw'], routes:['/tools/savings-goal/','/fr/tools/objectif-epargne/','/sw/zana/lengo-la-akiba/'] });
  add({id:'car-loan-user-input-method',sourceName:'Car Loan Cost Planner user-input methodology with Central Bank of Kenya total-cost-of-credit context',sourceType:'regulator',sourceUrl:'https://www.centralbank.go.ke/uploads/press_releases/712400338_Press%20Release-Launch%20of%20Cost%20of%20Credit%20Website-June%202017.pdf',countryCodes:['ALL'],appliesTo:['vehicle-finance','loans','amortization','personal-finance'],lastCheckedAt:'2026-07-22',lastReviewedAt:'2026-07-22',freshnessStatus:freshnessStatus('2026-07-22','2026-07-22',365,today),confidence:'reviewed',reviewCadenceDays:365,notes:'Local fixed-rate vehicle-finance plan using user-entered offer and operating-cost assumptions checked within 365 days. No lender/country rates, approval verdict, ranking, depreciation, insurance rule, deposit advice, AI or network request.',displayDisclaimer:'User-entered loan and operating-cost plan only. Confirm rate basis, APR, fees, tax, balloon, insurance and repayment schedule with the provider.',toolIds:['car-loan','pret-automobile-fr','zana-mkopo-wa-gari-sw'],routes:['/tools/car-loan/','/fr/tools/pret-automobile/','/sw/zana/mkopo-wa-gari/']});
  add({id:'student-loan-user-input-method',sourceName:'Student Loan Repayment Planner user-input methodology with official HELB, NSFAS and TETFund boundary context',sourceType:'official',sourceUrl:'https://www.helb.co.ke/helb-products/helb-loans/undergraduate-loans/',countryCodes:['ALL'],appliesTo:['student-finance','loans','amortization','education'],lastCheckedAt:'2026-07-22',lastReviewedAt:'2026-07-22',freshnessStatus:freshnessStatus('2026-07-22','2026-07-22',365,today),confidence:'reviewed',reviewCadenceDays:365,notes:'Local fixed-rate repayment plan using a user-entered recent statement, rate, fees, grace treatment and term. No NSFAS, HELB, TETFund, SOBA or private-provider preset, eligibility or approval verdict, income-contingent schedule, recommendation, AI or network request.',displayDisclaimer:'User-entered fixed-rate plan only. Confirm the official balance, rate method, fees, interest during study or grace, deductions, penalties, waivers and repayment schedule with the provider.',toolIds:['student-loan','pret-etudiant-fr'],routes:['/tools/student-loan/','/fr/tools/pret-etudiant/']});
  add({id:'ng-pension-cps-scenario-method',sourceName:'Nigeria CPS contribution and RSA scenario methodology with PenCom PRA 2014 context',sourceType:'official',sourceUrl:'https://www.pencom.gov.ng/pra2014/',countryCodes:['NG'],appliesTo:['pensions','retirement','salary','financial-planning'],lastCheckedAt:'2026-07-23',lastReviewedAt:'2026-07-23',freshnessStatus:freshnessStatus('2026-07-23','2026-07-23',365,today),confidence:'reviewed',reviewCadenceDays:365,notes:'PenCom PRA 2014 section 4 supports the 10% employer and 8% employee minimum contribution defaults for covered employment. The local engine uses editable user-entered contribution rates, RSA balance, pensionable emoluments, voluntary contribution, salary growth and a separately sourced net-return assumption checked within 365 days. It does not rank PFAs or calculate lump sums, programmed withdrawals, annuities, gratuity, tax treatment or guaranteed benefits.',displayDisclaimer:'User-entered CPS contribution and RSA planning scenario only. Confirm coverage, pensionable emoluments, rates, balances, fees, returns and benefit options with PenCom, the employer and a licensed provider.',toolIds:['ng-pension','ng-pension-fr','ng-pension-ha'],routes:['/tools/ng-pension/','/fr/tools/ng-pension/','/ha/kayan-aiki/fansho-najeriya/']});

  const rates = entries.get('afrorates-policy-rate-pack');
  updateLiveMetaEntry(rates, meta.rates, today, {
    cadenceDays: 45,
    confidence: 'reviewed',
    sourceName: function (lane) {
      return 'AfroRates policy-rate pack (' + ((lane && lane.source) || 'reviewed sources') + ')';
    },
    notes: function (lane) {
      return 'Committed policy-rate and inflation pack. The interest-rate reference exposes only rows with a numeric policy rate, official central-bank URL, decision date and verification within 45 days; incomplete rows are withheld. Partial verification: ' + Boolean(lane && lane.verification_partial) + '.';
    },
  });
  mergeCoverage(rates, ['afrorates', 'afrotaux-fr', 'zana-viwango-benki-sw', 'interest-rate-ref', 'reference-taux-interet-fr'], ['/tools/afrorates/', '/fr/tools/afrotaux/', '/sw/zana/viwango-benki/', '/tools/interest-rate-ref/', '/fr/tools/reference-taux-interet/']);

  mergeCoverage(entries.get('import-duty-planning-rates'), ['import-duty'], ['/tools/import-duty/']);
  mergeCoverage(entries.get('paye-tax-engine-country-packs'), ['paye-calculator'], ['/tools/paye-calculator/']);
  mergeCoverage(entries.get('vat-country-rate-packs'), ['vat-calc-pan-african'], ['/tools/vat-calculator/']);

  add({ id: 'mortgage-planning-method', sourceName: 'CFPB fixed-rate mortgage comparison and Total Interest Percentage guidance', sourceType: 'regulator', sourceUrl: 'https://www.consumerfinance.gov/owning-a-home/loan-estimate/', countryCodes: ['ALL'], appliesTo: ['business'], lastCheckedAt: '2026-07-22', lastReviewedAt: '2026-07-22', freshnessStatus: freshnessStatus('2026-07-22', '2026-07-22', 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for an assumption-first fixed-rate planning worksheet. The calculator accepts only user-entered rates and costs; it does not provide lender rates, approval decisions, APR, local taxes, or country presets. World Bank housing-sector material supplies non-formula African context on the public page.', displayDisclaimer: 'Planning estimate only. Confirm the lender rate, APR or effective cost, fees, insurance, taxes, adjustable-rate rules and approval terms before acting.', toolIds: ['mortgage-calculator', 'calculateur-hypothecaire-fr', 'zana-kikokotoo-mkopo-wa-nyumba-sw'], routes: ['/tools/mortgage-calculator/', '/fr/tools/calculateur-hypothecaire/', '/sw/zana/kikokotoo-mkopo-wa-nyumba/'] });

  add({ id: 'loan-comparison-method', sourceName: 'CFPB written loan-offer comparison guidance', sourceType: 'regulator', sourceUrl: 'https://www.consumerfinance.gov/owning-a-home/compare/compare-loan-estimates/', countryCodes: ['ALL'], appliesTo: ['business'], lastCheckedAt: '2026-07-22', lastReviewedAt: '2026-07-22', freshnessStatus: freshnessStatus('2026-07-22', '2026-07-22', 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for comparing user-entered written loan offers by rate method, cash received, payment, fees and total borrowing cost. The calculator does not provide lender rates, calculate APR, make approval decisions or recommend a lender.', displayDisclaimer: "Planning comparison only. Confirm each lender's APR or effective cost, fees, repayment schedule, default terms, insurance, taxes and approval conditions before acting.", toolIds: ['loan-compare', 'comparateur-prets-fr', 'zana-kilinganisha-mikopo-sw'], routes: ['/tools/loan-compare/', '/fr/tools/comparateur-prets/', '/sw/zana/kilinganisha-mikopo/'] });

  add({ id: 'payslip-draft-method', sourceName: 'ILO Protection of Wages Convention and South Africa BCEA4 payslip example', sourceType: 'official', sourceUrl: 'https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C095', countryCodes: ['ALL'], appliesTo: ['salary', 'documents'], lastCheckedAt: '2026-07-22', lastReviewedAt: '2026-07-22', freshnessStatus: freshnessStatus('2026-07-22', '2026-07-22', 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method context for a private local draft assembled only from user-confirmed earnings, reimbursements, employer contributions and deductions. ILO Convention C095 supplies high-level wage-protection context; South Africa BCEA4 at https://www.labour.gov.za/DocumentCenter/Pages/Form-BCEA4---Pay-Slip.aspx is one official country example. Neither source is a pan-African field prescription. The tool does not calculate or verify PAYE, statutory contributions, deduction authority, payment, remittance, filing, authenticity, employer approval or legal compliance.', displayDisclaimer: 'Draft only. Confirm employee identity, earnings, deduction authority, statutory treatment, payment, remittance, filing and local payslip requirements with the employer, relevant authority or a qualified payroll professional before issue or reliance.', toolIds: ['payslip-generator', 'generateur-fiche-paie-fr', 'zana-kizalishaji-payslip-sw', 'payslip-generator-ha'], routes: ['/tools/payslip-generator/', '/fr/tools/generateur-fiche-paie/', '/sw/zana/kizalishaji-payslip/', '/ha/kayan-aiki/takardar-albashi/'] });

  const employeeCostVerification = toolVerification.tools && toolVerification.tools['employee-cost'];
  if (employeeCostVerification) {
    add({ id: 'employee-cost-user-input-method', sourceName: 'Employee Cost user-input methodology with ILO wage guidance', sourceType: 'official', sourceUrl: (employeeCostVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'business'], lastCheckedAt: employeeCostVerification.last_verified, lastReviewedAt: employeeCostVerification.last_verified, freshnessStatus: freshnessStatus(employeeCostVerification.last_verified, employeeCostVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local hiring-cost worksheet. The canonical calculator supplies no statutory rate or country preset. Every salary, employer obligation, benefit, allowance, recurring cost, hiring cost and dated source label is entered by the user. AfroTools AI may route to the page but cannot prefill or receive those calculator fields.', displayDisclaimer: 'Hiring-cost planning estimate only. Confirm current rates, ceilings, risk classes, contract terms and filing treatment with the responsible authority or a qualified payroll or legal professional.', toolIds: ['employee-cost'], routes: ['/tools/employee-cost/'] });
  }

  const pensionProjectionVerification = toolVerification.tools && toolVerification.tools['pension-proj'];
  if (pensionProjectionVerification) {
    add({ id: 'pension-projection-method-source', sourceName: 'Pension accumulation user-assumption method with Investor.gov and IOPS disclosure guidance', sourceType: 'official', sourceUrl: (pensionProjectionVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['pensions', 'investment', 'financial-planning'], lastCheckedAt: pensionProjectionVerification.last_verified, lastReviewedAt: pensionProjectionVerification.last_verified, freshnessStatus: freshnessStatus(pensionProjectionVerification.last_verified, pensionProjectionVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Deterministic local accumulation projection using only user-entered balance, contributions, return, fee, inflation, growth and dated scheme evidence. No country rate, forecast, probability, benefit, annuity, drawdown, tax result or AI prefill is supplied.', displayDisclaimer: 'Planning estimate only. Confirm scheme values, fees, guarantees, tax, access, beneficiaries and retirement-income options with the provider, authority or a licensed adviser.', toolIds: ['pension-proj', 'pension-projection', 'projection-pension-simple-fr'], routes: ['/tools/pension-proj/', '/tools/pension-projection/', '/fr/tools/projection-pension-simple/'] });
  }

  const staffCostVerification = toolVerification.tools && toolVerification.tools['staff-cost'];
  if (staffCostVerification) {
    add({ id: 'staff-cost-user-input-method', sourceName: 'Staff Cost user-evidence methodology with IAS 19 and ILO employment-relationship context', sourceType: 'official', sourceUrl: (staffCostVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'business', 'employment', 'legal'], lastCheckedAt: staffCostVerification.last_verified, lastReviewedAt: staffCostVerification.last_verified, freshnessStatus: freshnessStatus(staffCostVerification.last_verified, staffCostVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local staff-budget worksheet. No statutory rate, country preset, worker classification, PAYE, take-home pay or termination treatment is supplied. Every cost and dated source label is entered by the user. AfroTools AI may route to the page but cannot prefill or receive calculator fields, source evidence or personal identifiers.', displayDisclaimer: 'Staff-budget planning estimate only. Confirm current employment status, rates, ceilings, risk classes, contract terms, accounting treatment and filing obligations with the responsible authority or a qualified payroll, accounting or legal professional.', toolIds: ['staff-cost', 'staff-cost-ha', 'cout-employe-fr'], routes: ['/tools/staff-cost/', '/fr/tools/cout-employe/', '/ha/kayan-aiki/kudin-maikaci/'] });
  }

  const contractorComparisonVerification = toolVerification.tools && toolVerification.tools['contractor-vs-employee'];
  if (contractorComparisonVerification) {
    add({ id: 'contractor-vs-employee-user-input-method', sourceName: 'Contractor vs Employee user-input methodology with ILO employment-relationship guidance', sourceType: 'official', sourceUrl: (contractorComparisonVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'business', 'legal'], lastCheckedAt: contractorComparisonVerification.last_verified, lastReviewedAt: contractorComparisonVerification.last_verified, freshnessStatus: freshnessStatus(contractorComparisonVerification.last_verified, contractorComparisonVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local cost comparison using only user-entered employee pay, contributions, benefits, recurring costs, contractor quote and buyer-paid contractor costs. The arithmetic does not decide worker classification. AfroTools AI may route to the page but cannot prefill or receive calculator or contract fields.', displayDisclaimer: 'Cost-planning estimate only. Worker status depends on the real relationship and current local law, not the cheaper path. Confirm classification, withholding, benefits and contract obligations with the relevant authority or a qualified professional.', toolIds: ['contractor-vs-employee'], routes: ['/tools/contractor-vs-employee/'] });
  }

  const domesticWorkerVerification = toolVerification.tools && toolVerification.tools['domestic-worker'];
  if (domesticWorkerVerification) {
    add({ id: 'domestic-worker-user-input-method', sourceName: 'Domestic Worker user-input methodology with ILO Convention No. 189 context', sourceType: 'official', sourceUrl: (domesticWorkerVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'employment', 'legal'], lastCheckedAt: domesticWorkerVerification.last_verified, lastReviewedAt: domesticWorkerVerification.last_verified, freshnessStatus: freshnessStatus(domesticWorkerVerification.last_verified, domesticWorkerVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local domestic-worker pay and employer-cost plan. The calculator supplies no wage floor, contribution rate, overtime multiplier or legal conclusion. Users enter every amount, rate, work pattern and dated source. AfroTools AI may route to the page but cannot prefill or receive calculator, source or contract-readiness fields.', displayDisclaimer: 'Planning estimate only. Confirm current wage floors, hours, overtime, leave, rest days, in-kind treatment, social contributions, records and contract requirements with the relevant authority or a qualified labour or payroll professional.', toolIds: ['domestic-worker'], routes: ['/tools/domestic-worker/'] });
  }

  const gratuityVerification = toolVerification.tools && toolVerification.tools['gratuity-calculator'];
  if (gratuityVerification) {
    add({ id: 'gratuity-user-input-method', sourceName: 'Gratuity user-input methodology with ILO Convention No. 158 context', sourceType: 'official', sourceUrl: (gratuityVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'employment', 'legal'], lastCheckedAt: gratuityVerification.last_verified, lastReviewedAt: gratuityVerification.last_verified, freshnessStatus: freshnessStatus(gratuityVerification.last_verified, gratuityVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local gratuity and final-pay planning estimate. The calculator supplies no statutory gratuity rate, eligibility decision, payroll divisor, eligible-day rule, cap, tax treatment or deduction authority. Users enter every amount and dated rule source. AfroTools AI may route to the page but cannot prefill or receive calculator or rule-source fields.', displayDisclaimer: 'Planning estimate only. Confirm eligibility, exit reason, service definition, pay basis, eligible days, divisor, caps, rounding, notice, leave, pension, tax, deductions and contract terms with the responsible authority or a qualified labour, legal or payroll professional.', toolIds: ['gratuity-calculator'], routes: ['/tools/gratuity-calculator/'] });
  }

  const parentalLeaveVerification = toolVerification.tools && toolVerification.tools['maternity-leave'];
  if (parentalLeaveVerification) {
    add({ id: 'parental-leave-user-input-method', sourceName: 'Parental Leave user-input methodology with ILO NATLEX discovery context', sourceType: 'official', sourceUrl: (parentalLeaveVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'employment', 'legal'], lastCheckedAt: parentalLeaveVerification.last_verified, lastReviewedAt: parentalLeaveVerification.last_verified, freshnessStatus: freshnessStatus(parentalLeaveVerification.last_verified, parentalLeaveVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local parental-leave pay plan. The planner supplies no country leave duration, replacement rate, payer, eligibility decision, cap or social-insurance conclusion. Users enter every salary, date, duration, rate, policy, official-source and HR-note value. AfroTools AI may route to the page but cannot prefill or receive those fields, and the browser does not persist the summary.', displayDisclaimer: 'Planning estimate only. Confirm current leave duration, eligibility, payer, caps, tax, social-insurance claim steps, adoption or birth rules, service requirements, collective agreement and employer policy in the issuing country official source before action.', toolIds: ['maternity-leave'], routes: ['/tools/maternity-leave/'] });
  }

  const retrenchmentVerification = toolVerification.tools && toolVerification.tools['retrenchment-calculator'];
  if (retrenchmentVerification) {
    add({ id: 'retrenchment-user-input-method', sourceName: 'Retrenchment user-input methodology with ILO Convention No. 158 context', sourceType: 'official', sourceUrl: (retrenchmentVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['salary', 'employment', 'legal'], lastCheckedAt: retrenchmentVerification.last_verified, lastReviewedAt: retrenchmentVerification.last_verified, freshnessStatus: freshnessStatus(retrenchmentVerification.last_verified, retrenchmentVerification.last_verified, 365, today), confidence: 'reviewed', reviewCadenceDays: 365, notes: 'Method source for a local retrenchment package estimate. The calculator supplies no severance rule, weeks per service year, notice entitlement, leave divisor, eligibility, consultation conclusion, selection-fairness decision, tax treatment or deduction authority. Users enter every amount and dated rule source. AfroTools AI may route to the page but cannot prefill or receive calculator or rule-source fields, and the browser does not persist the summary.', displayDisclaimer: 'Planning estimate only. Confirm consultation, alternatives, eligibility, selection fairness, severance rules, caps, rounding, notice, leave records, tax, deductions, contract and collective agreement with the responsible authority or a qualified labour, legal or payroll professional.', toolIds: ['retrenchment-calculator'], routes: ['/tools/retrenchment-calculator/'] });
  }

  const payeRoutes = formulas.filter(function (formula) {
    return formula.formulaFamily === 'paye-route';
  });
  const vatRoutes = formulas.filter(function (formula) {
    return formula.formulaFamily === 'vat-route';
  });

  formulas
    .filter(function (formula) {
      return formula.formulaFamily === 'paye-server';
    })
    .forEach(function (formula) {
      const country = formula.jurisdictions[0];
      const routes = payeRoutes
        .filter(function (route) {
          return route.jurisdictions.includes(country);
        })
        .map(function (route) {
          return routeFromArtifact(route.artifactPath);
        });
      const toolIds = routes.flatMap(function (route) {
        return toolsByRoute.get(normalizedRoute(route)) || [];
      });
      const entry = formulaEntry(formula, { id: 'paye-' + country.toLowerCase() + '-source', countryCode: country, fallbackName: (countryNames.get(country) || country) + ' PAYE source pack', appliesTo: ['tax', 'salary'], routes, toolIds, notes: (countryNames.get(country) || country) + ' PAYE engine source audit. Outputs remain planning estimates.', disclaimer: 'PAYE and payroll results are planning estimates. Confirm current rates, reliefs, filing, and remittance treatment with the relevant authority or a qualified payroll professional.' }, today);
      if (country === 'ST') {
        entry.sourceName = 'INSS Decreto-Lei 19/2022';
        entry.routes = ['/fr/sao-tome/st-paye', '/sao-tome/st-paye', '/sw/sao-tome/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-sao-tome-paye.html'];
        entry.notes = 'Sao Tome payroll checker verifies 4% employee and 6% employer INSS. IRS calculation is paused because the current official schedule remains unconfirmed. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'INSS results are planning estimates. IRS and final take-home are intentionally not calculated; confirm current tax and payroll treatment with the authorities.';
      }
      if (country === 'TG') {
        entry.sourceName = 'OTR consolidated CGI/LPF and CNSS Togo';
        entry.sourceUrl = 'https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/file.html';
        entry.routes = ['/fr/togo/calculateur-salaire-net', '/sw/togo/kikokotoo-kodi-mshahara/', '/togo/tg-paye', '/widgets/iframe/financial-togo-paye.html'];
        entry.notes = 'Togo PAYE uses one reviewed engine for OTR CGI Articles 26 and 72-74, 4% employee CNSS and 17.5% employer CNSS. Other personal deductions and special regimes remain excluded. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Togo PAYE results are planning estimates. Confirm benefits, other mandatory insurance, special regimes, filing and remittance treatment with OTR, CNSS or a qualified payroll professional.';
      }
      if (country === 'BJ') {
        entry.sourceName = 'Benin CGI 2026 and CNSS Benin';
        entry.sourceUrl = 'https://api.impots.bj/media/6984ebbbb7bc0_B%C3%A9nin-Code%20G%C3%A9n%C3%A9ral%20des%20Imp%C3%B4ts%202026.pdf';
        entry.routes = ['/benin/bj-paye', '/fr/benin/calculateur-salaire-net/', '/sw/benin/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-benin-paye.html'];
        entry.notes = 'Benin salary estimates use the CGI 2026 monthly ITS bands and ORTB levies. Employee CNSS is 3.6%; employer CNSS is 16.4%-19.4% depending on occupational risk. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Benin ITS and CNSS results are planning estimates. Confirm benefits in kind, exceptional remuneration, exemptions, variable pay and filing treatment with DGI, CNSS or a qualified payroll professional.';
      }
      if (country === 'SO') {
        entry.sourceName = 'Somalia Income Tax Law, Regulations and Manual 2025';
        entry.sourceUrl = 'https://mof.gov.so/sites/default/files/Publications/Somalia%20Income%20Tax%20Manual_English%20Version.pdf';
        entry.routes = ['/fr/somalia/so-paye', '/somalia/so-paye', '/sw/somalia/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-somalia-paye.html'];
        entry.notes = 'Federal Somalia employment-income estimates use the 2025 monthly USD schedule for resident adults and the statutory flat rates for non-residents and residents under 18. Employment deductions and other payroll contributions are not modeled. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Federal income-tax planning estimate only. Confirm residence, federal member-state treatment, benefits, other payroll obligations, filing and remittance with the Revenue Directorate or a qualified professional.';
      }
      if (country === 'DJ') {
        entry.sourceName = 'Djibouti Finance Laws, General Tax Code and CNSS';
        entry.sourceUrl = 'https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022/';
        entry.routes = ['/djibouti/dj-paye', '/fr/djibouti/calculateur-salaire-net/', '/sw/djibouti/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-djibouti-paye.html'];
        entry.notes = 'Djibouti salary estimates use Finance Law 2022 Article 7, the 2016 taxable-remuneration exemption, CGI Articles 6 and 14, and official CNSS rates and contribution floors. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Djibouti ITS and CNSS results are planning estimates. Confirm benefits, exceptional remuneration, exemptions, special regimes, filing and remittance treatment with DGI, CNSS or a qualified payroll professional.';
      }
      if (country === 'ER') {
        entry.sourceName = 'Eritrea income-tax and public-sector pension proclamations';
        entry.sourceUrl = 'https://tile.loc.gov/storage-services/service/ll/lleritrea/eritrean-proc-62-1994/eritrean-proc-62-1994.pdf';
        entry.routes = ['/eritrea/er-paye', '/fr/eritrea/er-paye', '/sw/eritrea/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-eritrea-paye.html'];
        entry.notes = 'Eritrea employment-tax estimates use the last primary eight-band monthly schedule located in Proclamation 62/1994 and Legal Notice 20/1995. No generic private-sector contribution is modeled; the optional 5%/7% pension scenario is limited to Proclamation 146/2005 public-sector scope. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Statutory-reference planning estimate only. Confirm later amendments, exemptions, benefit treatment, withholding and pension coverage with the competent Eritrean authority or a qualified professional.';
      }
      if (country === 'KM') {
        entry.sourceName = 'Union of the Comoros Code general des impots 2023';
        entry.sourceUrl = 'https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf';
        entry.routes = ['/comoros/km-paye', '/fr/comores/calculateur-salaire-net/', '/sw/comoros/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-comoros-paye.html'];
        entry.notes = 'Comoros employment-income estimates use CGI 2023 Articles 47, 55-60, 97 and 104-106: the official annual IRPP schedule, the standard 30% professional-expense deduction, and an optional user-supplied approved employee contribution capped at 6%. Employer contributions are not modeled. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'CGI 2023 statutory-reference planning estimate only. Confirm later amendments, benefits in kind, actual-expense claims, the approved contribution rate on the payslip, withholding and remittance with DGI or a qualified professional.';
      }
      if (country === 'SS') {
        entry.sourceName = 'South Sudan taxation, finance and social-insurance statutes';
        entry.sourceUrl = 'https://cms.nra.gov.ss/uploads/FINANCIAL_Act_FY_2023_2024_MAIL_97b32cab38.pdf';
        entry.routes = ['/south-sudan/ss-paye', '/fr/south-sudan/ss-paye', '/sw/south-sudan/kikokotoo-kodi-mshahara/', '/widgets/iframe/financial-south-sudan-paye.html'];
        entry.notes = 'South Sudan employment-tax estimates use the last primary five-band monthly schedule located in the Financial Act FY 2023/24, the 30% PIT surtax in the Taxation Amendment Act 2012, and the 8% employee/17% employer NSIF scenario in the 2023 framework. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Statutory-reference planning estimate only. Confirm later amendments, national or state administration, taxpayer scope, approved-pension treatment, filing and remittance with the South Sudan Revenue Authority or a qualified professional.';
      }
      add(entry);
    });

  vatRoutes.forEach(function (formula) {
    const country = formula.jurisdictions[0];
    const routes = unique([formula.artifactPath].concat(formula.protectedDuplicates || []).map(routeFromArtifact));
    const toolIds = routes.flatMap(function (route) {
      return toolsByRoute.get(normalizedRoute(route)) || [];
    });
    const isEritreaHistoricalSalesTax = country === 'ER' && formula.parameters && JSON.stringify(formula.parameters).includes('single-stage Eritrean sales-tax');
    const isFailClosedNationalVat = formula.parameters
      && formula.parameters.calculable === false
      && formula.parameters.statusCode === 'NO_VERIFIED_NATIONAL_VAT';
    const entry = formulaEntry(formula, {
      id: 'vat-' + country.toLowerCase() + '-source',
      countryCode: country,
      fallbackName: isEritreaHistoricalSalesTax
        ? 'Eritrea historical sales-tax source'
        : isFailClosedNationalVat
          ? (countryNames.get(country) || country) + ' consumption-tax evidence status'
          : (countryNames.get(country) || country) + ' VAT source pack',
      appliesTo: ['tax', 'business'],
      routes,
      toolIds,
      notes: isEritreaHistoricalSalesTax
        ? 'Historical single-stage sales-tax reference based on a public summary dated December 2002. It does not establish current rates or legal force.'
        : isFailClosedNationalVat
          ? 'Fail-closed federal evidence review: no current nationwide VAT rate is verified. Named sector sales-tax evidence remains separate from the dated turnover-tax publication; no transaction rate or liability is inferred.'
          : (countryNames.get(country) || country) + ' VAT route source audit. Exemptions and filing treatment may require separate review.',
      disclaimer: isEritreaHistoricalSalesTax
        ? 'Historical planning arithmetic only, not a current VAT result. Confirm the current Eritrean tax system, rates, classification, registration, invoicing, filing, and payment duties with a current authority or qualified adviser.'
        : isFailClosedNationalVat
          ? 'Evidence-status reference only. Confirm the current written rule, assessment and invoice requirements with the competent authority for the exact sector and jurisdiction.'
          : 'VAT results are planning estimates. Confirm current rates, exemptions, registration, invoicing, and filing treatment with the relevant authority or a qualified tax professional.'
    }, today);
    if (country === 'EG') {
      const verification = toolVerification.tools && toolVerification.tools['eg-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Egyptian Tax Authority VAT laws and amendments';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = entry.routes.flatMap(function (route) {
          return toolsByRoute.get(normalizedRoute(route)) || [];
        });
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Egypt VAT uses the 14% standard rate and an inclusive EGP 500,000 general prior-12-month registration screen. Table Tax, zero-rating and exemptions require an exact current law, schedule or table entry; no generic reduced band is claimed. Special registration cases, input-tax, invoicing, filing and remittance require separate ETA review. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Egypt VAT planning estimate only. Confirm classification, registration, invoicing, filing and remittance with ETA or a qualified tax professional.';
      }
    }
    if (country === 'CF') {
      const verification = toolVerification.tools && toolVerification.tools['cf-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGID Code general des impots updated 2023';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['cf-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Central African Republic TVA uses the 19% general rate. The 5% path requires an exact Article 257 tariff-list match and the 0% path requires qualifying export or international-transport scope with customs evidence. The XAF 30 million screen is strictly greater-than and does not decide registration. Generic exemptions and withholding percentages are not inferred. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Central African Republic TVA planning estimate only. Confirm tariff or export classification, registration, invoicing, filing frequency, deductions, designated-entity treatment and remittance with DGID or a qualified professional.';
      }
    }
    if (country === 'CG') {
      const verification = toolVerification.tools && toolVerification.tools['cg-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Congo Journal officiel - TVA law';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; })
            .concat(['cg-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Republic of the Congo invoices use 18% VAT plus additional centimes equal to 5% of collected VAT, producing an 18.9% standard invoice burden. The confirmed Annex 5 treatment has a 5.25% burden and Article 22 zero cases have 0%; both paths require exact matching evidence. The annual XAF 100 million screen is review-only, broad exemptions are not inferred, and Article 21 filing-base rounding is disclosed. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Congo TVA planning estimate only. Confirm tariff or zero-rate evidence, exemption, regime, statutory rounding, invoicing, filing, deductions and remittance with DGI or a qualified professional.';
      }
    }
    if (country === 'CI') {
      const verification = toolVerification.tools && toolVerification.tools['ci-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || "DGI Côte d'Ivoire CGI 2026";
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(entry.routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; }).concat(['ci-vat']));
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Côte d’Ivoire uses the 18% common VAT rate. The 9% paths require an exact current CGI Article 359 item or Ordinance 2026-03 item, effective 17 January 2026 for the four named groups. Exempt treatment requires exact Article 355 evidence. Turnover bands provide regime context only and do not decide VAT liability. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Côte d’Ivoire VAT planning estimate only. Confirm classification, regime, invoicing, filing and remittance with DGI or a qualified professional.';
      }
    }
    if (country === 'DJ') {
      const verification = toolVerification.tools && toolVerification.tools['dj-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Djibouti Official Journal VAT law';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(entry.routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; }).concat(['dj-vat']));
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Djibouti uses a current 10% standard VAT rate corroborated by later official finance laws; the original 2008 law page preserves superseded 7% wording. Article 19 zero-rating and Article 8 exemptions require exact evidence. The FDJ 80m and 120m thresholds are review-only, and Article 39 whole-FDJ rounding is modeled. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Djibouti VAT planning estimate only. Confirm the current consolidated CGI, classification, evidence, registration, invoicing, filing and payment with DGI or a qualified professional.';
      }
    }
    if (country === 'CD') {
      const verification = toolVerification.tools && toolVerification.tools['cd-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGI RDC TVA guidance';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(entry.routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; }).concat(['cd-vat']));
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'DR Congo uses the DGI-published 16% general TVA rate. The 8% reduced path requires an exact current legal item and qualifying-export 0% requires declaration and customs evidence. The CDF 80m annual-turnover figure is review-only because liberal professions and other cases have specific rules. Generic mining, exemption, withholding and custom-rate treatment is not inferred. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'DR Congo TVA planning estimate only. Confirm classification, registration, normalized invoicing, filing, deductions, refunds and remittance with DGI or a qualified professional.';
      }
    }
    if (country === 'GQ') {
      const verification = toolVerification.tools && toolVerification.tools['gq-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Equatorial Guinea General Tax Law and 2026 State Budget';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(entry.routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; }).concat(['gq-vat']));
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Equatorial Guinea uses the 15% general IVA rate retained by General Tax Law 1/2024. The 2026 State Budget Article 13 import treatments at 5% and 0% require an exact named-product match and retained tariff/import evidence. Broad product, exemption, export, registration-threshold, withholding and custom-rate treatment is not inferred. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Equatorial Guinea IVA planning estimate only. Confirm product and tariff classification, import evidence, registration, invoicing, filing, deductions and remittance with DGIC or a qualified professional.';
      }
    }
    if (country === 'SZ') {
      const verification = toolVerification.tools && toolVerification.tools['sz-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'ERS Eswatini VAT overview and current legislation';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(entry.routes.flatMap(function (route) { return toolsByRoute.get(normalizedRoute(route)) || []; }).concat(['sz-vat']));
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Eswatini uses the ERS-published 15% standard VAT rate. The 0% path requires an exact current Second Schedule match and retained transaction evidence. Exemptions, registration, withholding, filing and custom rates are not inferred. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Eswatini VAT planning estimate only. Confirm classification, evidence, registration, invoicing, filing and payment with ERS or a qualified professional.';
      }
    }
    if (country === 'KM') {
      const verification = toolVerification.tools && toolVerification.tools['km-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGI Comores Code général des impôts 2023';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['km-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Comoros Taxe sur la Consommation uses the 10% reference rate. Every 3%, 5%, 7.5%, 25% or 0% Article 152 path requires the exact supply, explicit confirmation and matching evidence type. The Article 141 KMF 20 million screen and KMF 15 million confirmed-importer exception remain review-only. The separate KMF 50-per-minute incoming-call termination additional tax is expressly excluded. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Comoros TC planning estimate only. Confirm Article 152 classification and evidence, Article 141 threshold status, invoicing, filing, deductions and remittance with DGI or a qualified professional.';
      }
    }
    if (country === 'TD') {
      const verification = toolVerification.tools && toolVerification.tools['td-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Chad Code general des impots 2025';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['td-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Chad invoices use effective TVA rates of 19.25% and 9.9% after applying 10% provincial and communal centimes to the 17.5% and 9% bases. The 9.9% and 0% paths require exact Article 238 evidence. The annual XAF 50 million screen and confirmed-IGL 2026 single-operation strict greater-than override remain separate; no generic exemption or withholding percentage is inferred. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Chad TVA planning estimate only. Confirm Article 238 classification, Article 230 exemptions, regime and IGL status, invoicing, statutory rounding, filing and remittance with DGI or a qualified professional.';
      }
    }
    if (country === 'TZ') {
      const verification = toolVerification.tools && toolVerification.tools['tz-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Tanzania Value Added Tax Act';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['tz-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Tanzania Mainland VAT uses 18% by default. The Finance Act 2025 16% path requires every statutory condition and current Commissioner-General eligibility. Appointed-agent withholding retains three percentage points from an 18% invoice. Registration screening covers prospective/prior 12-month TZS 200 million and prior-six-month TZS 100 million tests. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Tanzania VAT planning estimate only. Confirm the current public-notice eligibility, classification, registration, invoicing, filing, remittance and Zanzibar treatment with TRA or a qualified tax professional.';
      }
    }
    if (country === 'RW') {
      const verification = toolVerification.tools && toolVerification.tools['rw-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Rwanda VAT Law 049/2023';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['rw-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Rwanda VAT uses the Article 4 standard rate. Article 7 zero-rating and Article 8 exemptions are confirmation-only after Law 009/2025. Registration screening uses strict above-threshold tests for previous-fiscal-year and preceding-quarter turnover. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Rwanda VAT planning estimate only. Confirm classification, registration, input tax, withholding, invoicing, filing and remittance with RRA or a qualified tax professional.';
      }
    }
    if (country === 'UG') {
      const verification = toolVerification.tools && toolVerification.tools['ug-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'URA current VAT guidance';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['ug-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Uganda VAT uses the section 4 standard rate and strict past- or expected-three-month registration tests above UGX 37.5 million. Second Schedule exemptions and Third Schedule zero-rating are confirmation-only. Section 5 designated VAT withholding is 6% of taxable value, not a VAT rate, and is not calculated until designation, supplier or supply eligibility, and current exemption status are confirmed. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Uganda VAT planning estimate only. Confirm classification, registration, VAT-withholding designation and exemption status, input tax, invoicing, filing and remittance with URA or a qualified tax professional.';
      }
    }
    if (country === 'AO') {
      const verification = toolVerification.tools && toolVerification.tools['ao-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'AGT Angola current tax portal';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['ao-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Angola VAT uses the 14% general rate. The 7% simplified and eligible hospitality rates, 5% Annex I/II treatment, and 1% Cabinda treatment require confirmation. The regime screen uses the AOA 25 million and AOA 350 million boundaries; Article 21 imposto cativo is kept separate from the VAT rate. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Angola VAT planning estimate only. Confirm classification, regime, Cabinda or hospitality eligibility, captive-tax status, invoicing, input tax, filing and payment with AGT or a qualified tax professional.';
      }
    }
    if (country === 'BW') {
      const verification = toolVerification.tools && toolVerification.tools['bw-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'BURS VAT brochure';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['bw-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Botswana VAT uses the current 14% standard rate. Registration screening uses the BURS-published BWP 1 million compulsory threshold and BWP 500,000 voluntary floor. Zero-rating, exemption and the 2026 remote-digital-services transition remain confirmation-only. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Botswana VAT planning estimate only. Confirm classification, registration, digital-services treatment, input tax, invoicing, filing and payment with BURS or a qualified tax adviser.';
      }
    }
    if (country === 'CM') {
      const verification = toolVerification.tools && toolVerification.tools['cm-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGI 2026 VAT withholding order';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['cm-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Cameroon VAT uses the 19.25% effective standard rate: 17.5% base VAT plus communal additional tax equal to 10% of the base. The 10% social-housing rate, zero-rating, exemptions and full VAT withholding require explicit current qualification or authorization evidence. The XAF 50 million turnover value is an inclusive regime-review boundary, not an automatic registration decision. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Cameroon VAT planning estimate only. Confirm classification, social-housing qualification, registration, withholding authorization, input tax, invoicing, filing and payment with DGI Cameroon or a qualified tax adviser.';
      }
    }
    if (country === 'BJ') {
      const verification = toolVerification.tools && toolVerification.tools['bj-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGI Benin official General Tax Code and VAT guide';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['bj-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Benin VAT uses the 18% standard rate under CGI Article 241. Export zero-rating, Article 229 exemptions and the current Article 228 registration threshold require confirmation; Article 259 sets monthly declaration and payment by the 10th. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Benin VAT planning estimate only. Confirm classification, export or exemption treatment, the current registration threshold, invoicing, input tax, filing and payment with DGI Benin or a qualified tax professional.';
      }
    }
    if (country === 'DZ') {
      const verification = toolVerification.tools && toolVerification.tools['dz-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'DGI Algeria current VAT guidance';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['dz-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Algeria VAT uses the 19% normal rate. The 9% reduced rate requires confirmation that the operation is listed in article 23 of the TCA Code; exemptions under articles 8-13 are confirmation-only. The regime screen distinguishes real or simplified VAT treatment from IFU taxpayers without inventing a generic registration threshold. Formula status: ' + formula.effectiveDateStatus + '; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Algeria VAT planning estimate only. Confirm the exact TCA treatment, taxpayer regime, invoicing, deduction, filing and payment position with DGI or a qualified tax professional.';
      }
    }
    if (country === 'MU') {
      const verification = toolVerification.tools && toolVerification.tools['mu-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'MRA VAT guidance and Mauritius Value Added Tax Act';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['mu-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Mauritius VAT uses the 15% standard rate. A zero-rated result requires an exact Fifth Schedule supply and an exempt result requires an exact First Schedule item; tourist services are not inferred as a generic zero-rate. The Rs 6 million general registration threshold, Tenth Schedule exceptions, Rs 10 million return-frequency boundary and Section 20 invoice particulars remain review context. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Mauritius VAT planning estimate only. Confirm classification, schedule evidence, registration, invoicing, filing, input tax and payment with MRA or a qualified tax professional.';
      }
    }
    if (country === 'MA') {
      const verification = toolVerification.tools && toolVerification.tools['ma-vat'];
      if (verification) {
        entry.sourceName = (verification.source_titles || [])[0] || 'Morocco CGI 2026 and Finance Law 2026';
        entry.sourceUrl = (verification.source_urls || [])[0];
        entry.routes = (verification.routes || []).slice();
        entry.toolIds = unique(
          entry.routes
            .flatMap(function (route) {
              return toolsByRoute.get(normalizedRoute(route)) || [];
            })
            .concat(['ma-vat']),
        );
        entry.lastCheckedAt = verification.last_verified;
        entry.lastReviewedAt = verification.last_verified;
        entry.freshnessStatus = freshnessStatus(verification.last_verified, verification.last_verified, 90, today);
        entry.notes = 'Morocco CGI 2026 Article 99 uses the 20% standard rate and exact listed 10% treatment; former 14% and 7% bands are retired. Article 92 I.1 qualifying exports are exemptions with deduction and require exact transaction evidence. Article 89 merchant taxable-scope and Article 108 filing thresholds are not universal registration rules. Formula status: reviewed; version: ' + formula.formulaVersion + '.';
        entry.displayDisclaimer = 'Morocco VAT planning estimate only. Confirm the exact CGI classification, taxable scope, export evidence, invoice, deduction, withholding, filing and payment with DGI or a qualified tax professional.';
      }
    }
    add(entry);
  });

  const nigeriaCitVerification = toolVerification.tools && toolVerification.tools['ng-cit'];
  if (nigeriaCitVerification) {
    const routes = (nigeriaCitVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'nigeria-cit-2026-source', sourceName: (nigeriaCitVerification.source_titles || [])[0] || 'Nigeria Tax Act 2025 official Gazette copy', sourceType: 'official', sourceUrl: (nigeriaCitVerification.source_urls || [])[0], countryCodes: ['NG'], appliesTo: ['tax', 'business'], lastCheckedAt: nigeriaCitVerification.last_verified, lastReviewedAt: nigeriaCitVerification.last_verified, effectiveFrom: nigeriaCitVerification.effective_from, freshnessStatus: freshnessStatus(nigeriaCitVerification.last_verified, nigeriaCitVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Nigeria CIT uses the Nigeria Tax Act 2025 from 1 January 2026. Small-company status requires turnover not above NGN 50 million, total fixed assets not above NGN 250 million and no professional-services business. CIT and development levy use separate user-entered statutory profit bases. Section 57 review is flagged but no effective-tax-rate top-up is calculated.', displayDisclaimer: 'Nigeria company-tax planning estimate only. Confirm the company classification, statutory profit bases, incentives, losses, specialised-sector treatment, section 57 position, filing and payment with NRS or a qualified tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['ng-cit']),
          ),
          routes,
        },
      ),
    );
  }

  const nigeriaCgtVerification = toolVerification.tools && toolVerification.tools['ng-cgt'];
  if (nigeriaCgtVerification) {
    const routes = (nigeriaCgtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'nigeria-cgt-2026-source', sourceName: (nigeriaCgtVerification.source_titles || [])[0] || 'Nigeria Tax Act 2025 official Gazette copy', sourceType: 'official', sourceUrl: (nigeriaCgtVerification.source_urls || [])[0], countryCodes: ['NG'], appliesTo: ['tax', 'business'], lastCheckedAt: nigeriaCgtVerification.last_verified, lastReviewedAt: nigeriaCgtVerification.last_verified, effectiveFrom: nigeriaCgtVerification.effective_from, freshnessStatus: freshnessStatus(nigeriaCgtVerification.last_verified, nigeriaCgtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Nigeria disposal tax uses the Nigeria Tax Act 2025 from 1 January 2026. The local engine models the gain step, incremental Fourth Schedule tax for individuals, the reviewed company classification, scoped Nigerian-share relief and user-confirmed principal-residence relief.', displayDisclaimer: 'Nigeria disposal-tax planning estimate only. Confirm classification, deductions, exemptions, filing and payment with NRS, the relevant state tax authority or a qualified tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['ng-cgt']),
          ),
          routes,
        },
      ),
    );
  }

  const cryptoCgtVerification = toolVerification.tools && toolVerification.tools['crypto-cgt'];
  if (cryptoCgtVerification) {
    const routes = (cryptoCgtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'crypto-cgt-ng-ke-za-gh-2026-source', sourceName: 'Official crypto and capital-gains tax sources for Nigeria, Kenya, South Africa and Ghana', sourceType: 'official', sourceUrl: (cryptoCgtVerification.source_urls || [])[0], countryCodes: ['NG', 'KE', 'ZA', 'GH'], appliesTo: ['tax', 'finance'], lastCheckedAt: cryptoCgtVerification.last_verified, lastReviewedAt: cryptoCgtVerification.last_verified, effectiveFrom: cryptoCgtVerification.effective_from, freshnessStatus: freshnessStatus(cryptoCgtVerification.last_verified, cryptoCgtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'The local crypto calculator supports individuals only and fails closed unless capital-account treatment is explicitly confirmed. It models the reviewed in-scope capital calculation for Nigeria, Kenya, South Africa or Ghana and excludes revenue activity, business trading, mining, staking, rewards and uncertain classifications.', displayDisclaimer: 'Crypto capital-gains planning estimate only. Confirm classification, residence, valuation, cost-basis evidence, filing and payment with the relevant tax authority or a qualified tax professional.' },
        { toolIds: unique(routes.flatMap(function (route) { return toolsByRoute.get(route) || []; }).concat(['crypto-cgt'])), routes },
      ),
    );
  }

  const kenyaCgtVerification = toolVerification.tools && toolVerification.tools['ke-cgt'];
  if (kenyaCgtVerification) {
    const routes = (kenyaCgtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'kenya-cgt-2026-source', sourceName: (kenyaCgtVerification.source_titles || [])[0] || 'Kenya Revenue Authority Capital Gains Tax FAQs', sourceType: 'official', sourceUrl: (kenyaCgtVerification.source_urls || [])[0], countryCodes: ['KE'], appliesTo: ['tax', 'property'], lastCheckedAt: kenyaCgtVerification.last_verified, lastReviewedAt: kenyaCgtVerification.last_verified, effectiveFrom: kenyaCgtVerification.effective_from, freshnessStatus: freshnessStatus(kenyaCgtVerification.last_verified, kenyaCgtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Kenya CGT uses the current KRA guidance and the Income Tax Act Eighth Schedule version dated 1 January 2026. The local engine separates net transfer value from adjusted cost and never infers exemption eligibility.', displayDisclaimer: 'Kenya capital-gains-tax planning estimate only. Confirm valuation, adjusted-cost evidence, exemptions, filing and payment with KRA or a qualified tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['ke-cgt']),
          ),
          routes,
        },
      ),
    );
  }

  const southAfricaCgtVerification = toolVerification.tools && toolVerification.tools['za-cgt'];
  if (southAfricaCgtVerification) {
    const routes = (southAfricaCgtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'south-africa-cgt-2027-source', sourceName: (southAfricaCgtVerification.source_titles || [])[0] || 'SARS Capital Gains Tax rates and exclusions', sourceType: 'official', sourceUrl: (southAfricaCgtVerification.source_urls || [])[0], countryCodes: ['ZA'], appliesTo: ['tax', 'property'], lastCheckedAt: southAfricaCgtVerification.last_verified, lastReviewedAt: southAfricaCgtVerification.last_verified, effectiveFrom: southAfricaCgtVerification.effective_from, freshnessStatus: freshnessStatus(southAfricaCgtVerification.last_verified, southAfricaCgtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'South Africa CGT uses SARS 2027 assessment-year rates and exclusions. The local engine models supported base cost, current and carried losses, inclusion rates, incremental individual tax and only user-confirmed apportioned residence relief.', displayDisclaimer: 'South Africa CGT planning estimate only. Confirm classification, valuation, exclusions, losses, filing and payment with SARS or a qualified tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['za-cgt']),
          ),
          routes,
        },
      ),
    );
  }

  const southAfricaDividendVerification = toolVerification.tools && toolVerification.tools['za-dividend-tax'];
  if (southAfricaDividendVerification) {
    const routes = (southAfricaDividendVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'south-africa-dividends-tax-source', sourceName: (southAfricaDividendVerification.source_titles || [])[0] || 'SARS Dividends Tax overview', sourceType: 'official', sourceUrl: (southAfricaDividendVerification.source_urls || [])[0], countryCodes: ['ZA'], appliesTo: ['tax', 'investment'], lastCheckedAt: southAfricaDividendVerification.last_verified, lastReviewedAt: southAfricaDividendVerification.last_verified, effectiveFrom: southAfricaDividendVerification.effective_from, freshnessStatus: freshnessStatus(southAfricaDividendVerification.last_verified, southAfricaDividendVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'South Africa dividends tax uses the SARS-confirmed 20% standard rate. The local engine accepts a reduced DTA rate or exemption only after explicit declaration confirmation and never infers eligibility from a country or recipient label. Ordinary foreign dividends, REIT income-tax treatment, dividends in specie and STC credits are outside the calculation.', displayDisclaimer: 'South Africa dividends-tax planning estimate only. Confirm scope, beneficial ownership, declaration validity, treaty or exemption eligibility, filing and payment with SARS or a qualified tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['za-dividend-tax']),
          ),
          routes,
        },
      ),
    );
  }

  const transferPricingVerification = toolVerification.tools && toolVerification.tools['transfer-pricing'];
  if (transferPricingVerification) {
    const routes = (transferPricingVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'transfer-pricing-method-source', sourceName: (transferPricingVerification.source_titles || [])[0] || 'OECD Transfer Pricing Guidelines 2022', sourceType: 'official', sourceUrl: (transferPricingVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['tax', 'business'], lastCheckedAt: transferPricingVerification.last_verified, lastReviewedAt: transferPricingVerification.last_verified, freshnessStatus: freshnessStatus(transferPricingVerification.last_verified, transferPricingVerification.last_verified, 180, today), confidence: 'reviewed', reviewCadenceDays: 180, notes: 'Transfer-pricing comparability worksheet only. It computes one method-specific indicator and locates it against a range supplied and documented by the user. It does not select comparables, determine arm\'s-length compliance, automate Amount B, produce an audit report, calculate an adjustment or apply jurisdiction-specific law.', displayDisclaimer: 'Planning worksheet only. Confirm the functional analysis, method, comparables, range, adjustments, local law, documentation and filing with the relevant authority or a qualified transfer-pricing professional.' },
        {
          toolIds: unique(routes.flatMap(function (route) { return toolsByRoute.get(route) || []; }).concat(['transfer-pricing'])),
          routes,
        },
      ),
    );
  }

  const kenyaWhtVerification = toolVerification.tools && toolVerification.tools['ke-wht'];
  if (kenyaWhtVerification) {
    const routes = (kenyaWhtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'kenya-wht-2026-source', sourceName: (kenyaWhtVerification.source_titles || [])[0] || 'KRA withholding-income-tax table', sourceType: 'official', sourceUrl: (kenyaWhtVerification.source_urls || [])[0], countryCodes: ['KE'], appliesTo: ['tax', 'business'], lastCheckedAt: kenyaWhtVerification.last_verified, lastReviewedAt: kenyaWhtVerification.last_verified, effectiveFrom: kenyaWhtVerification.effective_from, freshnessStatus: freshnessStatus(kenyaWhtVerification.last_verified, kenyaWhtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Kenya WHT uses reviewed payment and recipient rows, exact resident fee thresholds, and evidence-gated residential MRI, controlling dividend, public-goods, EAC and treaty treatment. The product discloses the official-source conflict on winnings and does not infer unsupported relief.', displayDisclaimer: 'Kenya withholding-tax planning estimate only. Confirm payment classification, residence, thresholds, special-treatment evidence, source conflicts, filing and remittance with KRA before acting.' },
        {
          toolIds: unique(routes.flatMap(function (route) { return toolsByRoute.get(route) || []; }).concat(['ke-wht'])),
          routes,
        },
      ),
    );
  }

  const nigeriaWhtVerification = toolVerification.tools && toolVerification.tools['ng-wht'];
  if (nigeriaWhtVerification) {
    const routes = (nigeriaWhtVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'nigeria-wht-2026-source', sourceName: (nigeriaWhtVerification.source_titles || [])[0] || 'Nigeria Deduction of Tax at Source Regulations', sourceType: 'official', sourceUrl: (nigeriaWhtVerification.source_urls || [])[0], countryCodes: ['NG'], appliesTo: ['tax', 'business'], lastCheckedAt: nigeriaWhtVerification.last_verified, lastReviewedAt: nigeriaWhtVerification.last_verified, effectiveFrom: nigeriaWhtVerification.effective_from, freshnessStatus: freshnessStatus(nigeriaWhtVerification.last_verified, nigeriaWhtVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Nigeria WHT uses the exact official Schedule by transaction, recipient class and residence. Missing Tax ID doubles only eligible non-passive rates. Treaty, exemption, authority and filing treatment remain evidence-gated; unsupported combinations fail closed.', displayDisclaimer: 'Nigeria withholding-tax planning estimate only. Confirm the relevant authority, transaction classification, recipient facts, Tax ID, treaty or exemption evidence, filing and remittance before acting.' },
        {
          toolIds: unique(routes.flatMap(function (route) { return toolsByRoute.get(route) || []; }).concat(['ng-wht'])),
          routes,
        },
      ),
    );
  }

  const itaxVerification = toolVerification.tools && toolVerification.tools['itax-guide'];
  if (itaxVerification) {
    const routes = (itaxVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'kra-itax-guide-source', sourceName: (itaxVerification.source_titles || [])[0] || 'KRA iTax portal and guidance', sourceType: 'official', sourceUrl: (itaxVerification.source_urls || [])[0], countryCodes: ['KE'], appliesTo: ['tax', 'government'], lastCheckedAt: itaxVerification.last_verified, lastReviewedAt: itaxVerification.last_verified, freshnessStatus: freshnessStatus(itaxVerification.last_verified, itaxVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Independent, non-calculative guide to official KRA PIN, account-access and return-help routes. AfroTools never signs in, files, pays or stores credentials.', displayDisclaimer: 'Confirm the registered obligation, filing period and required records in the official KRA portal or with KRA support before submitting a return.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['itax-guide']),
          ),
          routes,
        },
      ),
    );
  }

  const etimsVerification = toolVerification.tools && toolVerification.tools['etims-guide'];
  if (etimsVerification) {
    const routes = (etimsVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'kra-etims-guide-source', sourceName: (etimsVerification.source_titles || [])[0] || 'Official KRA eTIMS portal and guidance', sourceType: 'official', sourceUrl: (etimsVerification.source_urls || [])[0], countryCodes: ['KE'], appliesTo: ['tax', 'business', 'government'], lastCheckedAt: etimsVerification.last_verified, lastReviewedAt: etimsVerification.last_verified, freshnessStatus: freshnessStatus(etimsVerification.last_verified, etimsVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Independent, non-calculative guide to current official KRA eTIMS scope, solution and onboarding routes. AfroTools never collects credentials or documents, creates an invoice, transmits a sale or determines deductibility.', displayDisclaimer: 'Confirm current eTIMS scope, solution eligibility, invoice treatment and expense requirements with KRA or a qualified Kenyan tax professional.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['etims-guide']),
          ),
          routes,
        },
      ),
    );
  }

  const sarsVerification = toolVerification.tools && toolVerification.tools['sars-efiling'];
  if (sarsVerification) {
    const routes = (sarsVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'sars-efiling-guide-source', sourceName: (sarsVerification.source_titles || [])[0] || 'Official SARS eFiling portal and guidance', sourceType: 'official', sourceUrl: (sarsVerification.source_urls || [])[0], countryCodes: ['ZA'], appliesTo: ['tax', 'government'], lastCheckedAt: sarsVerification.last_verified, lastReviewedAt: sarsVerification.last_verified, freshnessStatus: freshnessStatus(sarsVerification.last_verified, sarsVerification.last_verified, 60, today), confidence: 'reviewed', reviewCadenceDays: 60, notes: 'Independent, non-calculative guide to official SARS registration, current filing windows, auto-assessment review and record preparation. AfroTools never collects credentials or documents, connects an account, submits a return, accepts an assessment or takes a payment.', displayDisclaimer: 'Confirm the live filing window, obligation, assessment, amount and action in official SARS systems or with SARS support before submission or payment.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['sars-efiling']),
          ),
          routes,
        },
      ),
    );
  }

  const cnpsVerification = toolVerification.tools && toolVerification.tools['cnps-guide'];
  if (cnpsVerification) {
    const routes = (cnpsVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'cnps-ci-guide-source', sourceName: (cnpsVerification.source_titles || [])[0] || 'CNPS Côte d’Ivoire employer guidance', sourceType: 'official', sourceUrl: (cnpsVerification.source_urls || [])[0], countryCodes: ['CI'], appliesTo: ['salary', 'tax', 'government'], lastCheckedAt: cnpsVerification.last_verified, lastReviewedAt: cnpsVerification.last_verified, freshnessStatus: freshnessStatus(cnpsVerification.last_verified, cnpsVerification.last_verified, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Independent, non-calculative guide to CNPS contribution branches, the specific January 2023 floor and ceilings, declarations, remittance and e-CNPS. AfroTools never collects payroll or identity records, calculates an official contribution, declares or takes a payment.', displayDisclaimer: 'Confirm the assigned risk rate, current floor and ceilings, worker status, declaration schedule and remittance with CNPS before payroll or submission.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['cnps-guide']),
          ),
          routes,
        },
      ),
    );
  }

  const cbkVerification = toolVerification.tools && toolVerification.tools['cbk-rates'];
  if (cbkVerification) {
    const routes = (cbkVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'cbk-manual-rate-guide-source', sourceName: (cbkVerification.source_titles || [])[0] || 'Central Bank of Kenya daily indicative exchange-rate table', sourceType: 'official', sourceUrl: (cbkVerification.source_urls || [])[0], countryCodes: ['KE'], appliesTo: ['fx', 'business'], lastCheckedAt: cbkVerification.last_verified, lastReviewedAt: cbkVerification.last_verified, freshnessStatus: freshnessStatus(cbkVerification.last_verified, cbkVerification.last_verified, 90, today), confidence: 'authoritative', reviewCadenceDays: 90, notes: 'Guidance-only source for a manual local converter. AfroTools does not ingest, cache, bundle or redistribute CBK rate rows. The user supplies the dated Mean rate, quoted unit and currency code; no network rate data or fallback value is used.', displayDisclaimer: 'CBK figures are indicative market-opening averages, not executable quotes. Confirm the dated official row and obtain a bank, bureau, card, wallet or remittance quote before committing funds.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['cbk-rates']),
          ),
          routes,
        },
      ),
    );
  }

  const zaUifVerification = toolVerification.tools && toolVerification.tools['za-uif'];
  if (zaUifVerification) {
    const routes = (zaUifVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'south-africa-uif-source', sourceName: (zaUifVerification.source_titles || [])[0] || 'Department of Employment and Labour UIF benefit calculation guidance', sourceType: 'official', sourceUrl: (zaUifVerification.source_urls || [])[0], countryCodes: ['ZA'], appliesTo: ['salary', 'employment'], lastCheckedAt: zaUifVerification.last_verified, lastReviewedAt: zaUifVerification.last_verified, freshnessStatus: freshnessStatus(zaUifVerification.last_verified, zaUifVerification.last_verified, 90, today), confidence: 'authoritative', reviewCadenceDays: 90, notes: 'South Africa UIF planning uses the SARS ZAR 17,712 contribution ceiling, the Department daily-income and 38%-60% IRR formula for days 1-238, a 20% second tier through day 365, and a separate 66% maternity plan capped at 121 days. Credits, eligibility and approved payment remain UIF decisions.', displayDisclaimer: 'UIF results are planning estimates. Confirm current contribution, credit, eligibility, claim and payment rules with SARS, UIF or the Department of Employment and Labour.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['za-uif']),
          ),
          routes,
        },
      ),
    );
  }

  const investmentReturnVerification = toolVerification.tools && toolVerification.tools['investment-return'];
  if (investmentReturnVerification) {
    const routes = (investmentReturnVerification.routes || []).map(normalizedRoute);
    add(
      withOptional(
        { id: 'investment-return-method-source', sourceName: (investmentReturnVerification.source_titles || [])[0] || 'Investor.gov Compound Interest Calculator', sourceType: 'official', sourceUrl: (investmentReturnVerification.source_urls || [])[0], countryCodes: ['ALL'], appliesTo: ['investment', 'business'], lastCheckedAt: investmentReturnVerification.last_verified, lastReviewedAt: investmentReturnVerification.last_verified, freshnessStatus: freshnessStatus(investmentReturnVerification.last_verified, investmentReturnVerification.last_verified, 180, today), confidence: 'reviewed', reviewCadenceDays: 180, notes: 'User-entered investment projection only. The engine applies the selected compounding frequency and contribution timing, then uses the exact Fisher relationship for real return. It supplies no market rate, forecast, provider comparison, tax result or suitability verdict.', displayDisclaimer: 'Planning estimate only. Entered return and inflation rates are assumptions, not forecasts. Confirm fees, taxes, liquidity, risk and provider terms independently before acting.' },
        {
          toolIds: unique(
            routes
              .flatMap(function (route) {
                return toolsByRoute.get(route) || [];
              })
              .concat(['investment-return']),
          ),
          routes,
        },
      ),
    );
  }

  const socialFormulas = formulas.filter(function (formula) {
    return /engines-(?:gh-ssnit|ke-nssf|ng-pension|za-uif)-engine/.test(formula.formulaFamily);
  });
  const socialChecked =
    socialFormulas
      .map(function (formula) {
        return dateOnly(formula.lastVerified);
      })
      .filter(Boolean)
      .sort()
      .pop() || null;
  add(withOptional({ id: 'social-security-country-packs', sourceName: 'AfroTools reviewed social-security contribution packs', sourceType: 'reviewed_dataset', countryCodes: ['GH', 'KE', 'NG', 'ZA'], appliesTo: ['salary', 'tax'], lastCheckedAt: socialChecked, lastReviewedAt: socialChecked, freshnessStatus: freshnessStatus(socialChecked, socialChecked, 90, today), confidence: 'reviewed', reviewCadenceDays: 90, notes: 'Contribution engines cover selected statutory schemes and remain planning aids; employer and worker circumstances can change treatment.', displayDisclaimer: 'Contribution estimates are for planning. Confirm current caps, rates, eligibility, and remittance rules with the relevant scheme or payroll professional.' }, { toolIds: ['social-security'], routes: ['/tools/social-security/'] }));

  socialFormulas.forEach(function (formula) {
    const key = formula.formulaFamily.replace(/^engines-|-engine$/g, '');
    add(formulaEntry(formula, { id: 'social-security-' + key + '-source', countryCode: (key.match(/^(gh|ke|ng|za)-/) || [null, 'ALL'])[1].toUpperCase(), fallbackName: key + ' contribution source pack', appliesTo: ['salary', 'tax'], notes: 'Reviewed statutory-contribution formula source.', disclaimer: 'Contribution results are planning estimates. Confirm current rates and caps with the relevant statutory scheme.' }, today));
  });

  const electricityFormula = formulas.find(function (formula) {
    return formula.formulaFamily === 'engines-electricity-tariff-engine';
  });
  const electricityEntry = formulaEntry(electricityFormula, { id: 'electricity-tariff-rates', countryCode: 'ALL', fallbackName: 'AfroTools electricity tariff planning dataset', appliesTo: ['energy'], routes: ['/tools/electricity-estimator/'], toolIds: ['electricity-estimator'], notes: 'Tariff model source metadata; live API provenance and local tariff classes remain separate.', disclaimer: 'Electricity tariffs vary by provider, band, taxes, subsidies, and billing period. Confirm your current utility tariff before budgeting.' }, today);
  electricityEntry.sourceName = 'AfroTools reviewed electricity tariff planning dataset';
  electricityEntry.sourceType = 'reviewed_dataset';
  electricityEntry.confidence = 'estimated';
  delete electricityEntry.sourceUrl;
  add(electricityEntry);

  const remittanceFormula = formulas.find(function (formula) {
    return formula.formulaFamily === 'assets-js-engines-remittance-v2';
  });
  const remittanceEntry = formulaEntry(remittanceFormula, { id: 'remittance-fx-planning', countryCode: 'ALL', fallbackName: 'AfroTools remittance and FX planning model', appliesTo: ['fx', 'business'], routes: ['/tools/remittance-compare/'], toolIds: ['remittance-compare'], notes: 'Indicative remittance comparison using the FX snapshot plus modeled provider fees and spreads.', disclaimer: 'Remittance costs and exchange rates are indicative. Obtain a current provider quote before sending money.' }, today);
  remittanceEntry.lastCheckedAt = forex.lastCheckedAt;
  remittanceEntry.lastReviewedAt = forex.lastReviewedAt;
  remittanceEntry.freshnessStatus = forex.freshnessStatus;
  remittanceEntry.confidence = 'estimated';
  remittanceEntry.reviewCadenceDays = 7;
  add(remittanceEntry);

  const ledgerConfigs = [
    {
      lane: 'government',
      toolFilter: function (tool) {
        return tool.lane === 'money-property';
      },
    },
    {
      lane: 'transport',
      toolFilter: function (tool) {
        return /money|cost|fare|fuel|income|customs|fee|toll|loan|depreciation/.test(tool.lane + ' ' + tool.id);
      },
    },
  ];

  ledgerConfigs.forEach(function (config) {
    const manifest = readJson(path.join(ROOT, 'data', config.lane, 'official-sources.json'));
    const status = readJson(path.join(ROOT, 'data', config.lane, 'source-status.json'));
    const statusById = new Map(
      status.sources.map(function (source) {
        return [source.id, source];
      }),
    );
    const selectedTools = status.tools.filter(config.toolFilter);
    const referencedSourceIds = unique(
      selectedTools.flatMap(function (tool) {
        return tool.sourceIds || [];
      }),
    );

    selectedTools.forEach(function (tool) {
      if (tool.id === 'import-duty') return;
      const rows = (tool.sourceIds || [])
        .map(function (id) {
          return statusById.get(id);
        })
        .filter(Boolean);
      const checkedDates = rows
        .map(function (row) {
          return dateOnly(row.checkedAt);
        })
        .filter(Boolean)
        .sort();
      const checked = checkedDates.length ? checkedDates[checkedDates.length - 1] : null;
      const usable = rows.filter(function (row) {
        return row.status === 'ok' && dateOnly(row.checkedAt);
      });
      const entry = withOptional(
        {
          id: 'ledger-tool-' + tool.id,
          sourceName: tool.id.replace(/-/g, ' ') + ' official-source ledger',
          sourceType: 'reviewed_dataset',
          countryCodes: unique(
            rows.map(function (row) {
              return row.country;
            }),
          ).length
            ? unique(
                rows.map(function (row) {
                  return row.country;
                }),
              )
            : ['ALL'],
          appliesTo: unique(
            rows.flatMap(function (row) {
              return ledgerAppliesTo(row, [tool]);
            }),
          ),
          lastCheckedAt: checked,
          lastReviewedAt: null,
          freshnessStatus: tool.status === 'blocked' ? 'unavailable' : freshnessStatus(checked, null, manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30, today),
          confidence: usable.length ? 'reviewed' : 'low_confidence',
          reviewCadenceDays: manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30,
          notes: 'Official-source availability ledger for ' + tool.id + '. Tool status=' + tool.status + '; ' + usable.length + '/' + rows.length + ' referenced sources were reachable and unchanged at the latest check. Availability does not certify a fee, rate, or outcome.',
          displayDisclaimer: 'Official source pages can change. Verify the current fee, rate, notice, or schedule on the linked authority before paying or making a high-stakes decision.',
        },
        { toolIds: [tool.id], routes: [tool.route] },
      );
      add(entry);
    });

    referencedSourceIds.forEach(function (sourceId) {
      const row = statusById.get(sourceId);
      if (!row) return;
      const manifestSource =
        manifest.sources.find(function (source) {
          return source.id === sourceId;
        }) || row;
      const checked = dateOnly(row.checkedAt);
      const officiallyChecked = row.status === 'ok' && checked && Number(row.httpStatus) >= 200 && Number(row.httpStatus) < 300 && row.changedSinceLastRun === false;
      const linkedTools = selectedTools.filter(function (tool) {
        return (tool.sourceIds || []).includes(sourceId);
      });
      add(
        withOptional(
          { id: 'official-' + sourceId, sourceName: row.authority || manifestSource.authority || row.title || sourceId, sourceType: sourceTypeForLedger(manifestSource), countryCodes: [row.country || manifestSource.country || 'ALL'], appliesTo: ledgerAppliesTo(manifestSource, linkedTools), lastCheckedAt: checked, lastReviewedAt: null, freshnessStatus: row.status === 'blocked' || row.status === 'broken' ? 'unavailable' : freshnessStatus(checked, null, manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30, today), confidence: officiallyChecked ? 'official_verified' : checked ? 'reviewed' : 'low_confidence', reviewCadenceDays: manifest.highRiskCadenceDays || manifest.reviewCadenceDays || 30, notes: 'Official endpoint status=' + row.status + '. Official verified means the configured authority endpoint returned an unchanged successful response on the checked date; it does not certify every tool value.', displayDisclaimer: 'This authority source was checked for availability. Confirm the current publication, notice, schedule, and effective date before relying on a fee or rate.' },
          {
            sourceUrl: sourceUrl(row) || sourceUrl(manifestSource),
            toolIds: linkedTools.map(function (tool) {
              return tool.id;
            }),
            routes: linkedTools.map(function (tool) {
              return tool.route;
            }),
          },
        ),
      );
    });
  });

  const sources = Array.from(entries.values())
    .map(function (entry) {
      if (entry.toolIds) entry.toolIds = unique(entry.toolIds);
      if (entry.routes) entry.routes = unique(entry.routes.map(normalizedRoute));
      return entry;
    })
    .sort(function (a, b) {
      return a.id.localeCompare(b.id);
    });
  const allToolIds = unique(
    sources.flatMap(function (source) {
      return source.toolIds || [];
    }),
  );
  const confidenceCounts = {};
  sources.forEach(function (source) {
    confidenceCounts[source.confidence] = (confidenceCounts[source.confidence] || 0) + 1;
  });

  return {
    registry: { schemaVersion: 1, updatedAt: today, sources },
    coverage: {
      schemaVersion: 1,
      generatedAt: today,
      summary: {
        sourceEntries: sources.length,
        registeredTools: allToolIds.length,
        payeCountries: sources.filter(function (source) {
          return /^paye-[a-z]{2}-source$/.test(source.id);
        }).length,
        vatCountries: sources.filter(function (source) {
          return /^vat-[a-z]{2}-source$/.test(source.id);
        }).length,
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
