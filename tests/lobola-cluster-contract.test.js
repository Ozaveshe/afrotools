const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const countryPages = [
  ['botswana', 'bw', 'BWP'],
  ['eswatini', 'sz', 'SZL'],
  ['lesotho', 'ls', 'LSL'],
  ['south-africa', 'za', 'ZAR'],
  ['zambia', 'zm', 'ZMW'],
  ['zimbabwe', 'zw', 'USD']
];

const root = read('tools/lobola-calculator/index.html');
assert(root.includes('id="lobola-planner"'), 'main calculator must expose the calculation-first planner anchor');
assert(root.includes('Build a respectful family plan'), 'main calculator must lead with the family planning task');
assert(root.includes('Save on this device'), 'main calculator must offer a local-only handoff');
assert(root.includes('/tools/lobola-gift-list/'), 'main calculator must connect to the gift list');
assert(root.includes('/tools/lobola-negotiation-checklist/'), 'main calculator must connect to the meeting checklist');
assert(!/african-workflow|african-focus|rs-upgrade-shell|Deep improvement|Continue from Lobola Calculator/.test(root), 'generic workflow and deep-improvement UI must stay off the Lobola calculator');
assert(!/Education assumption|Income expectation|Country Comparison|Assumption Sensitivity|chartCountry|chartEducation/.test(root), 'person-valuation controls and comparison charts must not return');
assert(!root.includes('<iframe'), 'main calculator must not depend on an iframe');

for (const [slug, code, currency] of countryPages) {
  const relative = `tools/lobola-calculator/${slug}/index.html`;
  const html = read(relative);
  assert(!html.includes('<iframe'), `${relative} must calculate without an iframe`);
  assert(!/embed=1|lc-tool-frame/.test(html), `${relative} must not retain the old embed path`);
  assert(html.includes('data-lobola-quick-planner'), `${relative} must expose the native quick planner`);
  assert(html.includes(`data-country-code="${code}"`), `${relative} must use the correct country preset`);
  assert(html.includes(`data-currency="${currency}"`), `${relative} must use the correct currency preset`);
  assert(html.includes('/assets/js/pages/lobola-country-quick-planner.js'), `${relative} must load the shared native planner`);
  assert(html.includes('/tools/lobola-negotiation-checklist/'), `${relative} must connect to meeting preparation`);
}

for (const relative of ['tools/lobola-negotiation-checklist/index.html', 'tools/lobola-gift-list/index.html']) {
  const html = read(relative);
  assert(html.includes('afrotools_lobola_plan_v1'), `${relative} must accept the local calculator handoff`);
  assert(html.includes('useSavedPlan'), `${relative} must expose the saved-plan action`);
  assert(!html.includes('related-tools.min.js'), `${relative} must not hydrate unrelated category recommendations`);
}

const frenchCalculator = read('fr/tools/calculateur-lobola/index.html');
assert(!frenchCalculator.includes('<iframe'), 'French Lobola calculator must not embed the English route');
assert(frenchCalculator.includes('data-locale="fr"'), 'French Lobola calculator must use the localized native planner');
assert(frenchCalculator.includes('/fr/tools/checklist-negociation-dot/'), 'French calculator must connect to its meeting checklist');
assert(frenchCalculator.includes('/fr/tools/liste-cadeaux-dot/'), 'French calculator must connect to its gift list');

for (const [relative, marker] of [
  ['fr/tools/checklist-negociation-dot/index.html', 'data-lobola-fr-checklist'],
  ['fr/tools/liste-cadeaux-dot/index.html', 'data-lobola-fr-gifts']
]) {
  const html = read(relative);
  assert(!html.includes('<iframe'), `${relative} must be a native French tool, not an iframe wrapper`);
  assert(html.includes(marker), `${relative} must expose its native French workflow`);
  assert(html.includes('afrotools_lobola_plan_v1'), `${relative} must accept the local planner handoff`);
}

const frenchBlog = read('fr/blog/lobola-price-2026/index.html');
assert(!frenchBlog.includes('<iframe'), 'French Lobola guide must contain native article content');
assert(frenchBlog.includes('Que faut-il budgéter séparément ?'), 'French Lobola guide must provide useful planning guidance');

for (const [englishPath, frenchPath, frenchUrl, englishUrl] of [
  ['tools/lobola-calculator/index.html', 'fr/tools/calculateur-lobola/index.html', 'https://afrotools.com/fr/tools/calculateur-lobola/', 'https://afrotools.com/tools/lobola-calculator/'],
  ['tools/lobola-negotiation-checklist/index.html', 'fr/tools/checklist-negociation-dot/index.html', 'https://afrotools.com/fr/tools/checklist-negociation-dot/', 'https://afrotools.com/tools/lobola-negotiation-checklist/'],
  ['tools/lobola-gift-list/index.html', 'fr/tools/liste-cadeaux-dot/index.html', 'https://afrotools.com/fr/tools/liste-cadeaux-dot/', 'https://afrotools.com/tools/lobola-gift-list/'],
  ['blog/lobola-price-2026/index.html', 'fr/blog/lobola-price-2026/index.html', 'https://afrotools.com/fr/blog/lobola-price-2026/', 'https://afrotools.com/blog/lobola-price-2026/']
]) {
  assert(read(englishPath).includes(`hreflang="fr" href="${frenchUrl}"`), `${englishPath} must reference its French counterpart`);
  assert(read(frenchPath).includes(`hreflang="en" href="${englishUrl}"`), `${frenchPath} must reference its English counterpart`);
}

const frenchGenerator = read('scripts/generate-fr-tool-gap-pages.js');
assert(frenchGenerator.includes('lobolaNative: "checklist"'), 'French checklist source data must own the native workflow');
assert(frenchGenerator.includes('lobolaNative: "gift-list"'), 'French gift-list source data must own the native workflow');

console.log('Lobola cluster contract verified: calculation-first root, six native country planners, local handoffs, and native French routes.');
