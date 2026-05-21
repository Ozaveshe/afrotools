const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');

global.window = global;
global.navigator = {};
global.localStorage = {
  getItem() { return null; },
  setItem() {}
};
global.location = {
  origin: 'https://afrotools.com',
  href: 'https://afrotools.com/tools/study-abroad-cost/?budget=5000000&home_country=Nigeria#private',
  pathname: '/tools/study-abroad-cost/'
};
global.document = {
  readyState: 'loading',
  body: {},
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; },
  createElement() {
    return {
      addEventListener() {},
      appendChild() {},
      insertAdjacentElement() {},
      setAttribute() {},
      getAttribute() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      style: {},
      dataset: {},
      set innerHTML(value) { this._html = value; },
      get innerHTML() { return this._html || ''; },
    };
  },
};

require(path.join(root, 'assets/js/components/product-backbone.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-fx-policy.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-cost.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-hero-sources.js'));
require(path.join(root, 'tools/study-abroad-cost/study-abroad-backbone.js'));
const gate = require(path.join(root, 'tools/study-abroad-cost/study-abroad-confidence-gate.js'));
const conversion = require(path.join(root, 'tools/study-abroad-cost/study-abroad-conversion-layer.js'));

const countries = global.AfroStudyAbroadUpgrade.countries;
const uae = countries.find((country) => country.key === 'uae');
const mexico = countries.find((country) => country.key === 'mexico');
const uk = countries.find((country) => country.key === 'uk');

const state = {
  destinationKey: 'uae',
  homeKey: 'ng',
  homeCountry: 'Nigeria',
  homeCurrency: 'NGN',
  availableBudget: 3500000,
  fundingSource: 'scholarship',
  livingStyle: 'standard',
  dependents: 'none',
  intakeYear: 2026,
  level: 'masters',
  field: 'engineering',
  years: 2,
  scholarshipMode: 'partial'
};

const weakScenario = global.AfroStudyAbroadUpgrade.estimateScenario(uae, state);
weakScenario.risk = global.AfroStudyAbroadUpgrade.riskFor(weakScenario);
const weakStatus = gate.classifyDestination(uae);

assert.strictEqual(weakStatus, gate.STATUS.NEEDS, 'UAE should remain a needs-verification destination');
assert.match(
  conversion.amountForStatus(weakScenario.firstYearDest, uae.currency, weakStatus),
  / to /,
  'Weak destinations should show ranges instead of exact-looking totals'
);

const context = conversion.buildScholarshipContext(weakScenario, weakStatus);
assert.strictEqual(context.destination, 'United Arab Emirates', 'Scholarship context should include destination country');
assert.strictEqual(context.homeCountry, 'Nigeria', 'Scholarship context should include home country');
assert.strictEqual(context.level, 'masters', 'Scholarship context should include study level');
assert.strictEqual(context.field, 'engineering', 'Scholarship context should include field');
assert.strictEqual(context.confidenceStatus, gate.STATUS.NEEDS, 'Scholarship context should pass confidence status');
assert(Number.isInteger(context.fundingGapUsd), 'Scholarship context should include integer funding gap');
assert(context.budgetUsd === null || Number.isInteger(context.budgetUsd), 'Scholarship context should include budget when FX is available');

const scholarshipUrl = conversion.scholarshipUrl(context);
assert(scholarshipUrl.includes('/tools/scholarship-finder/?'), 'Scholarship URL should target Scholarship Finder');
assert(scholarshipUrl.includes('confidence_status=needs_verification'), 'Scholarship URL should carry confidence status');
assert(scholarshipUrl.includes('funding_gap='), 'Scholarship URL should carry funding gap context');

const summary = conversion.buildSummary(weakScenario, weakStatus);
assert(summary.includes('First-year estimate'), 'Share summary should include first-year estimate');
assert(summary.includes('Funding gap'), 'Share summary should include funding gap');
assert(summary.includes('Confidence status'), 'Share summary should include confidence status');
assert(summary.includes('Confirm final tuition'), 'Share summary should include final-figure disclaimer');

const safeUrl = conversion.sanitizedShareUrl(global.location.href);
assert.strictEqual(
  safeUrl,
  'https://afrotools.com/tools/study-abroad-cost/',
  'Shared plan links should remove query params and fragments'
);

const interpretation = conversion.buildInterpretation(weakScenario, weakStatus);
assert(interpretation.body.includes('funding gap'), 'Interpretation should explain funding gap when present');
assert(interpretation.body.includes('planning estimate only'), 'Interpretation should preserve weak-data warning');

const sponsorHtml = conversion.sponsorHtml();
assert.strictEqual((sponsorHtml.match(/data-sa-sponsor=/g) || []).length, 6, 'Sponsor zone should expose six partner-ready slots');
assert(sponsorHtml.includes('Partner opportunity'), 'Sponsor zone should label placements clearly');
assert(!/Acme|partner name|official sponsor/i.test(sponsorHtml), 'Sponsor zone should not invent partner names');

const partialScenario = global.AfroStudyAbroadUpgrade.estimateScenario(mexico, Object.assign({}, state, { destinationKey: 'mexico' }));
assert(!conversion.amountForStatus(partialScenario.firstYearDest, mexico.currency, gate.classifyDestination(mexico)).includes(' to '), 'Partial destinations should keep standard display while warning stays visible');

const heroScenario = global.AfroStudyAbroadUpgrade.estimateScenario(uk, Object.assign({}, state, { destinationKey: 'uk', years: 1 }));
assert.strictEqual(gate.classifyDestination(uk), gate.STATUS.HERO, 'UK should remain hero verified');
assert(!conversion.buildSummary(heroScenario, gate.STATUS.HERO).includes('final bill'), 'Hero summaries should not imply a final bill');

console.log('Study Abroad conversion layer verified.');
