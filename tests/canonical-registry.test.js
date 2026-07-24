const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const registryApi = require('../scripts/lib/canonical-registry');

const REQUIRED_TOOL_FIELDS = [
  'id', 'route', 'canonicalRoute', 'title', 'description', 'categoryId',
  'applicability', 'currencies', 'units', 'publicationStatus',
  'localeCoverage', 'calculatorVersion', 'sourceVersion', 'dataFreshness',
  'widgetEligibility', 'availability', 'deprecated', 'redirectTarget',
  'indexable', 'source'
];

function issueCodes(result) {
  return result.errors.map((issue) => issue.code);
}

const canonical = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(canonical);
assert.strictEqual(validation.ok, true, validation.errors.map(registryApi.formatIssue).join('\n'));

assert.ok(canonical.tools.length > 3000, 'canonical registry should normalize the complete tool registry');
canonical.tools.forEach((tool) => {
  REQUIRED_TOOL_FIELDS.forEach((field) => {
    assert.ok(Object.prototype.hasOwnProperty.call(tool, field), `${tool.id} missing explicit field ${field}`);
  });
});

['widgets', 'categories', 'countries', 'locales', 'apiPlans', 'productPlans', 'proApps', 'featureCollections'].forEach((key) => {
  assert.ok(Array.isArray(canonical[key]), `${key} should be a normalized record array`);
  canonical[key].forEach((record) => assert.ok(record.id, `${key} contains a record without a stable id`));
});

const aliasExpectations = {
  'minimum-wage-legal': 'minimum-wage',
  'vat-calculator': 'vat-calc-pan-african',
  'generator-fuel-african': 'generator-fuel',
  'salary-tax-sw': 'mshahara-na-kodi-sw'
};
Object.entries(aliasExpectations).forEach(([aliasId, targetId]) => {
  const alias = canonical.tools.find((tool) => tool.id === aliasId);
  assert.ok(alias, `missing alias ${aliasId}`);
  assert.strictEqual(alias.publicationStatus, 'redirect');
  assert.strictEqual(alias.deprecated, true);
  assert.strictEqual(alias.redirectTarget.toolId, targetId);
});

const canonicalRoutes = canonical.tools
  .filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated)
  .map((tool) => tool.canonicalRoute);
assert.strictEqual(new Set(canonicalRoutes).size, canonicalRoutes.length, 'published canonical routes must be unique');

const expectedSelectorIds = [
  'tools.raw_rows',
  'tools.canonical_published',
  'tools.english_canonical_published',
  'tools.live_experiences',
  'tools.localized_records',
  'tools.indexable_destinations',
  'widgets.published',
  'widgets.categories',
  'widgets.country_paye',
  'widgets.country_tax',
  'categories.published',
  'countries.published',
  'languages.site_published',
  'plans.api',
  'plans.product_options',
  'pro.apps'
];
expectedSelectorIds.forEach((id) => {
  const selector = registryApi.getSelector(canonical, id);
  assert.ok(selector, `missing named selector ${id}`);
  assert.ok(selector.label && selector.definition, `${id} requires a label and exact definition`);
  assert.ok(Number.isInteger(selector.value) && selector.value >= 0, `${id} requires a non-negative integer value`);
});

const labels = new Map();
canonical.selectors.forEach((selector) => {
  if (!labels.has(selector.label)) labels.set(selector.label, selector.definition);
  assert.strictEqual(labels.get(selector.label), selector.definition, `selector label ${selector.label} has conflicting definitions`);
});

const unknownCategory = registryApi.cloneCanonicalRegistry(canonical);
unknownCategory.tools[0].categoryId = 'not-a-category';
let invalid = registryApi.validateCanonicalRegistry(unknownCategory);
assert.ok(issueCodes(invalid).includes('TOOL_CATEGORY_UNKNOWN'));
assert.ok(invalid.errors.some((issue) => issue.recordId === unknownCategory.tools[0].id && issue.field === 'categoryId'));

const unknownCountry = registryApi.cloneCanonicalRegistry(canonical);
unknownCountry.tools[0].applicability = { scope: 'countries', countryIds: ['XX'], regionIds: [] };
invalid = registryApi.validateCanonicalRegistry(unknownCountry);
assert.ok(issueCodes(invalid).includes('TOOL_COUNTRY_UNKNOWN'));

const unknownLocale = registryApi.cloneCanonicalRegistry(canonical);
unknownLocale.tools[0].localeCoverage = ['zz'];
invalid = registryApi.validateCanonicalRegistry(unknownLocale);
assert.ok(issueCodes(invalid).includes('TOOL_LOCALE_UNKNOWN'));

const routeCollision = registryApi.cloneCanonicalRegistry(canonical);
const published = routeCollision.tools.filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated);
published[1].route = published[0].route.toUpperCase() + '/index.html?x=1#frag';
published[1].canonicalRoute = published[1].route;
invalid = registryApi.validateCanonicalRegistry(routeCollision);
assert.ok(issueCodes(invalid).includes('TOOL_CANONICAL_ROUTE_DUPLICATE'));

assert.strictEqual(registryApi.normalizeRoute('/Tools/Example/index.html/?x=1#part'), '/tools/example');
assert.strictEqual(registryApi.normalizeRoute('//tools///example//'), '/tools/example');

const allTool = canonical.tools.find((tool) => tool.source && Array.isArray(tool.source.countries) && tool.source.countries.includes('ALL'));
assert.ok(allTool);
assert.strictEqual(allTool.applicability.scope, 'pan-african');
assert.deepStrictEqual(allTool.applicability.countryIds, []);
assert.ok(!canonical.countries.some((country) => country.id === 'ALL'), 'ALL must not become a 55th country');

const unlimited = canonical.apiPlans.find((plan) => plan.limits && plan.limits.daily === -1);
assert.ok(unlimited && unlimited.unlimited, 'unlimited API plan quota must remain explicit');

const requiredPages = [
  ['widgets/index.html', ['widgets.published', 'widgets.categories', 'widgets.country_tax']],
  ['widgets/demo/index.html', ['widgets.published', 'widgets.categories', 'widgets.country_paye']],
  ['categories/index.html', ['tools.live_experiences', 'categories.published', 'countries.published']],
  ['developer-tools/index.html', ['tools.category.developer.published', 'features.developer_flagship']]
];
requiredPages.forEach(([file, selectorIds]) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  selectorIds.forEach((selectorId) => {
    assert.ok(html.includes(`data-registry-count="${selectorId}"`), `${file} missing ${selectorId} initial-count marker`);
    const selector = registryApi.getSelector(canonical, selectorId);
    const re = new RegExp(`data-registry-count="${selectorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>${selector.value}<`);
    assert.ok(re.test(html), `${file} initial ${selectorId} value should be ${selector.value}`);
  });
  assert.ok(!/data-registry-count="[^"]+"[^>]*>(?:0|--)<[/\w]/.test(html), `${file} contains a fake initial registry count`);
});

const footerSource = fs.readFileSync(path.join(ROOT, 'assets/js/components/footer.js'), 'utf8');
['categories.published', 'countries.published', 'widgets.country_paye'].forEach((selectorId) => {
  assert.ok(footerSource.includes(`counts['${selectorId}']`), `shared footer must consume ${selectorId}`);
});
assert.ok(!/var\s+(?:categories|countries|payeCountries)\s*=\s*\d+/.test(footerSource), 'shared footer must not own numeric catalog totals');

const report = registryApi.buildRegistryReport(canonical);
['rawToolRows', 'redirectAliases', 'canonicalPublishedTools', 'localizedTools', 'expandedLiveToolExperiences', 'indexableToolDestinations', 'widgetEnabledTools'].forEach((key) => {
  assert.ok(Number.isInteger(report.summary[key]), `report missing ${key}`);
});
assert.strictEqual(
  report.aliases.map((alias) => alias.id).join(','),
  'crypto-tax,generator-fuel-african,minimum-wage-legal,salary-tax-sw,vat-calculator',
  'canonical redirect aliases must stay explicit and stable'
);

const browserCountries = fs.readFileSync(path.join(ROOT, 'assets/js/data/african-countries.js'), 'utf8');
assert.ok(browserCountries.includes('root.AFRICAN_COUNTRIES='));
assert.strictEqual((browserCountries.match(/"code":"[A-Z]{2}"/g) || []).length, 54, 'browser country projection must contain 54 canonical countries');
['displayNames', 'slug', 'region', 'sourceJurisdiction', 'supportedToolTypes', 'localeCoverage'].forEach((field) => {
  assert.ok(browserCountries.includes(`"${field}"`), `browser country projection missing ${field}`);
});
const countrySelector = fs.readFileSync(path.join(ROOT, 'assets/js/components/country-selector.js'), 'utf8');
assert.ok(countrySelector.includes('AFRICAN_COUNTRIES'), 'country selector must consume canonical browser projection');
assert.ok(!countrySelector.includes('name:"Algeria",slug:"algeria"'), 'country selector must not maintain a second 54-country array');
const apiCountries = fs.readFileSync(path.join(ROOT, 'netlify/functions/api-countries.js'), 'utf8');
assert.ok(apiCountries.includes("require('../../data/registry/countries.json')"), 'country API membership must derive from canonical country JSON');

const builder = require('../scripts/build-canonical-registry');
const markerFixture = '<strong data-registry-count="widgets.published">0</strong>';
assert.strictEqual(builder.replaceCountMarkers(markerFixture, 'fixture.html', canonical).content, '<strong data-registry-count="widgets.published">223</strong>');

const directory = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-directory.json'), 'utf8'));
const searchIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/search-index.json'), 'utf8'));
const salaryTaxIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/salary-tax-index.json'), 'utf8'));
const canonicalEnglish = canonical.tools.filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated && tool.localeCoverage.includes('en'));
assert.strictEqual(directory.length, canonicalEnglish.length, 'crawlable directory must contain canonical published English records');
assert.strictEqual(searchIndex.length, registryApi.getSelector(canonical, 'tools.canonical_published').value, 'search index must exclude redirect aliases');
assert.strictEqual(salaryTaxIndex.length, registryApi.getSelector(canonical, 'tools.category.financial.published').value, 'salary-tax feed must use canonical financial records');
Object.keys(aliasExpectations).forEach((aliasId) => {
  assert.ok(!directory.some((record) => record.id === aliasId), `${aliasId} must not appear in the canonical directory`);
  assert.ok(!searchIndex.some((record) => record[0] === aliasId), `${aliasId} must not appear in the search index`);
  assert.ok(!salaryTaxIndex.some((record) => record[0] === aliasId), `${aliasId} must not appear in the salary-tax index`);
});

console.log('Canonical registry contract tests passed');
