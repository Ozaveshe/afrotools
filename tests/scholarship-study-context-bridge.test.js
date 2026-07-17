const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');

global.window = global;
global.location = {
  search: '',
  pathname: '/tools/scholarship-finder/'
};
global.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {}
};
global.document = null;

const bridge = require(path.join(root, 'tools/scholarship-finder/scholarship-study-context-bridge.js'));

const ukContext = bridge.normalizeContext({
  country: 'United Kingdom',
  destination: 'uk',
  level: 'masters',
  field: 'engineering',
  funding_gap: '18500',
  budget: '12000',
  home_country: 'Nigeria',
  funding_source: 'scholarship',
  confidence_status: 'hero_verified'
}, 'url');

assert.strictEqual(ukContext.destinationFilter, 'uk', 'UK Study Abroad context should map to the UK scholarship filter');
assert.strictEqual(ukContext.levelFilter, 'masters', 'Masters context should prefill masters');
assert.strictEqual(ukContext.fieldFilter, 'stem', 'Engineering context should prefill STEM');
assert.strictEqual(ukContext.fundingGapUsd, 18500, 'Funding gap should be parsed as a number');
assert.strictEqual(ukContext.budgetUsd, 12000, 'Budget should be parsed as a number');
assert.strictEqual(ukContext.destinationFilterExact, true, 'UK should be an exact destination filter');

const mexicoContext = bridge.normalizeContext({
  destination: 'Mexico',
  destinationKey: 'mexico',
  studyLevel: 'Bachelors',
  studyField: 'business management',
  fundingGapUsd: 9200,
  homeCountry: 'Ghana',
  confidenceStatus: 'partial_source_coverage'
}, 'localStorage');

assert.strictEqual(mexicoContext.destinationFilter, 'global', 'Mexico should broaden to Global / Multiple because no Mexico option exists');
assert.strictEqual(mexicoContext.destinationFilterExact, false, 'Broadened destinations should be flagged');
assert.strictEqual(mexicoContext.levelFilter, 'undergrad', 'Bachelors should map to undergraduate');
assert.strictEqual(mexicoContext.fieldFilter, 'business', 'Business context should map to business');

const uaeContext = bridge.normalizeContext({
  country: 'United Arab Emirates',
  destination: 'uae',
  level: 'PhD',
  field: 'health sciences',
  funding_gap: '23000',
  confidence_status: 'needs_verification'
}, 'url');

assert.strictEqual(uaeContext.destinationFilter, 'global', 'UAE should broaden to global opportunities');
assert.strictEqual(uaeContext.levelFilter, 'phd', 'PhD context should map to PhD');
assert.strictEqual(uaeContext.fieldFilter, 'health', 'Health sciences should map to health');

const germany = bridge.destinationFilter('germany', 'Germany');
assert.strictEqual(germany.value, 'eu', 'Germany should map to the Europe scholarship filter');
assert.strictEqual(germany.exact, false, 'Regional mappings should not be treated as exact country filters');

const guidance = bridge.fundingGapGuidance(ukContext);
assert(guidance.includes('estimated funding gap'), 'Funding gap guidance should explain the gap');
assert(guidance.includes('fully funded'), 'Funding gap guidance should prioritize fully funded opportunities');
assert(guidance.includes('living-cost support'), 'Funding gap guidance should include living-cost support');

const banner = bridge.buildBannerHtml(mexicoContext, 'No exact matches found. Showing related opportunities.');
assert(banner.includes('Showing scholarships related to your study abroad plan.'), 'Banner should explain the Study Abroad context');
assert(banner.includes('Clear context'), 'Banner should expose a clear-context action');
assert(banner.includes('No exact matches found. Showing related opportunities.'), 'Banner should show no-exact-match behavior');
assert(banner.includes('provider research queue'), 'Banner should preserve deadline research queue language');
assert(!/verified deadline|guaranteed|official deadline/i.test(banner), 'Banner should not invent deadline certainty');

const checklist = bridge.buildChecklistHtml(ukContext);
bridge.CHECKLIST_ITEMS.forEach(function (item) {
  assert(checklist.includes(item[1]), 'Context checklist should include "' + item[1] + '"');
});
assert(checklist.includes('Prepare SOP/personal statement'), 'Checklist should include SOP preparation');

global.localStorage = {
  getItem(key) {
    if (key !== bridge.STUDY_CONTEXT_KEY) return null;
    return JSON.stringify({
      destination: 'Canada',
      destinationKey: 'canada',
      level: 'masters',
      field: 'finance',
      fundingGapUsd: 14000,
      homeCountry: 'Kenya',
      confidenceStatus: 'hero_verified'
    });
  },
  setItem() {},
  removeItem() {}
};
global.location = { search: '', pathname: '/tools/scholarship-finder/' };
const storedContext = bridge.readContext();
assert.strictEqual(storedContext.source, 'localStorage', 'Bridge should read Study Abroad context from localStorage when URL params are absent');
assert.strictEqual(storedContext.destinationFilter, 'canada', 'LocalStorage fallback should still prefill destination');
assert.strictEqual(storedContext.fieldFilter, 'business', 'Finance field should map to business funding opportunities');

console.log('Scholarship Study Abroad context bridge verified.');
