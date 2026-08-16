const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('tools/import-duty/index.html');
const ui = read('assets/js/pages/import-landed-cost.js');
const redirects = read('_redirects');
const registry = read('assets/js/components/tool-registry.js');
const rules = JSON.parse(read('data/trade/import-rules.json'));
const cohort = JSON.parse(read('data/seo/gsc-demand-capture-cohorts.json')).cohorts.find((item) => item.cohort_id === 'gsc-demand-capture-2026-08-import-landed-cost');
const formula = JSON.parse(read('data/calculation-quality/formula-registry.json')).formulas.find((item) => item.id === 'formula-engines-import-landed-cost-engine');

assert.match(page, /<title>Import &(?:amp;)? Landed Cost Calculator Africa 2026/);
assert.match(page, /<h1>Calculate the real cost of importing<\/h1>/);
assert.match(page, /rel="canonical" href="https:\/\/afrotools\.com\/tools\/import-duty\/"/);
assert.match(page, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/cout-rendu\/"/);
assert.match(page, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/gharama-bidhaa\/"/);
assert.match(page, /WebApplication/);
assert.match(page, /FAQPage/);
assert.match(page, /\/engines\/import-landed-cost-engine\.js/);
assert.match(page, /data-source-meta-id="import-duty-planning-rates"/);
assert.match(page, /Planning estimate/i);
assert.match(page, /\/tools\/car-import-cost\//);
assert.match(redirects, /\/tools\/landed-cost\/\s+\/tools\/import-duty\/\s+301!/);
assert.match(redirects, /\/fr\/tools\/droits-douane\/\s+\/fr\/tools\/cout-rendu\/\s+301!/);
assert.match(redirects, /\/sw\/zana\/ushuru-forodha\/\s+\/sw\/zana\/gharama-bidhaa\/\s+301!/);
assert.match(registry, /id: 'import-duty'.*countries: \['NG','KE','GH','ZA'\]/);
assert.doesNotMatch(registry, /id: 'landed-cost'/);

assert.deepStrictEqual(Object.keys(rules.markets), ['NG', 'KE', 'GH', 'ZA']);
for (const [code, market] of Object.entries(rules.markets)) {
  assert.ok(market.authority, `${code} authority`);
  assert.ok(market.ruleVersion, `${code} rule version`);
  assert.ok(market.effectiveDate, `${code} effective date`);
  assert.strictEqual(market.lastVerified, '2026-08-15', `${code} verification date`);
  assert.ok(market.sources.length >= 3, `${code} sources`);
  assert.ok(Array.isArray(market.limitations) && market.limitations.length, `${code} limitations`);
}

for (const eventName of ['import_destination_selected', 'import_origin_selected', 'import_goods_type_selected', 'import_estimate_completed', 'import_fx_override_used', 'import_optional_cost_added', 'import_scenario_compared', 'import_export_completed', 'import_unsupported_market', 'import_stale_rule_shown']) {
  assert.ok(ui.includes(`'${eventName}'`), `${eventName} analytics event`);
}
assert.doesNotMatch(ui, /itemName|invoiceDescription|hsCode/);

for (const guide of ['blog/import-duty-nigeria-2026/index.html', 'blog/import-duty-calculator-kenya-2026/index.html', 'blog/import-duty-ghana-2026/index.html', 'blog/import-duty-south-africa-2026/index.html']) {
  assert.ok(read(guide).includes('/tools/import-duty/'), `${guide} links to canonical tool`);
}
const kenyaGuide = read('blog/import-duty-calculator-kenya-2026/index.html');
assert.match(kenyaGuide, /general IDF at 2\.5%/);
assert.doesNotMatch(kenyaGuide, /IDF[^<\n]{0,80}3\.5%|3\.5%[^<\n]{0,80}IDF/i);
assert.match(kenyaGuide, /<h1>How Kenya Import Duty Works/);
assert.doesNotMatch(kenyaGuide, /<h1>[^<]*Calculator/i);
assert.match(kenyaGuide, /Vehicle imports need a separate assessment/);
assert.match(read('blog/import-duty-ghana-2026/index.html'), /<h1>How Ghana Import Duty Works/);

assert.ok(cohort, 'dedicated GSC cohort exists');
assert.strictEqual(cohort.baseline_impressions, 8452);
assert.strictEqual(cohort.deployment_date, null);
assert.strictEqual(cohort.review_7_day, null);
assert.ok(cohort.target_query_cluster.includes('Japan car import duty'));
assert.ok(cohort.competing_routes_at_baseline.includes('/blog/import-duty-ghana-2026/'));
assert.ok(cohort.source_freshness_requirement.includes('24-hour maintenance window'));
assert.ok(formula, 'protected calculation-quality formula exists');
assert.deepStrictEqual(formula.jurisdictions, ['NG', 'KE', 'GH', 'ZA']);
assert.deepStrictEqual(formula.sourceJurisdictions, ['NG', 'KE', 'GH', 'ZA']);
assert.strictEqual(formula.riskDomain, 'legal_regulatory');
assert.strictEqual(formula.riskLevel, 'high');
assert.strictEqual(formula.lastVerified, '2026-08-15');
assert.strictEqual(formula.effectiveFrom, '2026-01-01');
assert.ok(formula.sources.some((source) => source.registryId === 'import-duty-planning-rates'));
assert.ok(formula.sources.filter((source) => source.authorityStatus === 'source-reviewed').length >= 5);
console.log('import-landed-cost-route.test.js passed');
