'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = (href) => fs.existsSync(path.join(ROOT, href.replace(/^\/|\/$/g, ''), 'index.html'));
const englishRoute = (tool) => !/^\/(?:fr|sw|ha|yo)\//.test(tool.href || '');
const live = (tool) => tool.status === 'live' || tool.status === 'new';

const context = {
  window: {},
  document: {
    getElementById: () => ({}),
    dispatchEvent: () => {},
    readyState: 'complete'
  },
  CustomEvent: function CustomEvent() {}
};
vm.createContext(context);
vm.runInContext(read('assets/js/components/tool-registry.js'), context);

const engineeringRoutes = [
  '/engineering/afrodraft/', '/engineering/floor-planner/',
  '/tools/solar-calculator/', '/tools/floor-plan/', '/tools/boq-builder/',
  '/tools/structural-calc/', '/tools/electrical-load/', '/tools/concrete-mix/',
  '/tools/paint-calculator/', '/tools/tiles-calc/', '/tools/water-tank/',
  '/tools/roof-calculator/', '/tools/borehole-cost/', '/tools/rebar-calculator/',
  '/tools/generator-sizing/', '/tools/boq-generator/', '/tools/home-renovation-cost/',
  '/tools/septic-tank/', '/tools/fence-cost/', '/tools/swimming-pool-cost/',
  '/tools/architectural-fee/', '/tools/site-clearing/', '/tools/road-construction-cost/',
  '/tools/scaffolding-calc/', '/tools/window-door-sizing/', '/tools/plumbing-material/'
];

const climateRoutes = [
  '/tools/drought-risk/', '/tools/water-scarcity/', '/tools/rainfall-tracker/',
  '/tools/carbon-credit/', '/tools/flood-risk/', '/tools/air-quality/',
  '/tools/deforestation/', '/tools/waste-management/', '/tools/recycling-revenue/',
  '/tools/charcoal-vs-clean/', '/tools/ewaste-value/', '/tools/tree-planting-roi/',
  '/tools/sustainability-scorecard/'
];

const miningHubRoutes = [
  '/tools/commodity-tracker/', '/tools/diamond-valuation/',
  '/tools/oil-well-production/', '/tools/oil-gas-revenue/',
  '/tools/mining-license-fee/', '/tools/mining-royalty/',
  '/tools/artisanal-mining-income/'
];

function categoryRows(category) {
  return context.AFRO_TOOLS.filter((tool) =>
    englishRoute(tool) && live(tool) && tool.category === category
  );
}

function categoryExperiences(category) {
  return context.getTotalToolCount((tool) =>
    englishRoute(tool) && live(tool) && tool.category === category
  );
}

assert.deepEqual(Array.from(categoryRows('engineering'), (tool) => tool.href), engineeringRoutes);
assert.deepEqual(Array.from(categoryRows('climate'), (tool) => tool.href), climateRoutes);
assert.deepEqual(
  Array.from(categoryRows('mining'), (tool) => tool.href),
  miningHubRoutes.slice(1)
);
assert.equal(categoryRows('energy').length, 20);
assert.equal(categoryExperiences('engineering'), 26);
assert.equal(categoryExperiences('climate'), 16);
assert.equal(categoryExperiences('mining'), 6);
assert.equal(categoryExperiences('energy'), 287);

for (const href of [...engineeringRoutes, ...climateRoutes, ...miningHubRoutes]) {
  assert.ok(exists(href), `missing canonical route ${href}`);
  const html = read(`${href.replace(/^\/|\/$/g, '')}/index.html`);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\//);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+">/);
}

const miningRegistryHrefs = new Set(context.AFRO_TOOLS.map((tool) => tool.href));
assert.ok(miningRegistryHrefs.has('/tools/commodity-tracker/'));
for (const href of miningHubRoutes.slice(1)) {
  assert.ok(miningRegistryHrefs.has(href), `${href} should be discoverable from the approved Mining registry`);
}

const miningHub = read('mining/index.html');
for (const href of miningHubRoutes) assert.match(miningHub, new RegExp(href.replace(/\//g, '\\/')));
assert.match(miningHub, /six Mining-owned registry rows/i);
assert.doesNotMatch(miningHub, /Africa holds 30%|share of world gold|10 million across Africa/i);

const climateRuntime = read('assets/js/climate-tools.js');
assert.doesNotMatch(climateRuntime, /capture-lead|climate-pdf-gate|cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf/);
assert.match(climateRuntime, /\/assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);

const carbonCredit = read('tools/carbon-credit/index.html');
assert.match(carbonCredit, /id="projectSize"[^>]*\bmin="0\.01"[^>]*\brequired/);

for (const href of climateRoutes) {
  const html = read(`${href.replace(/^\/|\/$/g, '')}/index.html`);
  assert.equal((html.match(/climate-vip-guardrails\.css/g) || []).length, 1);
  assert.equal((html.match(/climate-vip-guardrails\.js/g) || []).length, 1);
  assert.equal((html.match(/Reset scenario/gi) || []).length, 1);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Generated in this browser with the bundled PDF engine/);
}

const miningRoyalty = read('tools/mining-royalty/index.html');
assert.match(miningRoyalty, /id="mr-gross"[^>]*\bmin="0\.01"[^>]*\brequired/);
assert.match(miningRoyalty, /id="mr-err" role="alert"/);
assert.match(miningRoyalty, /gEl\.setAttribute\('aria-invalid', 'true'\)/);
assert.match(miningRoyalty, /gEl\.focus\(\)/);
assert.match(miningRoyalty, /gEl\.addEventListener\('input', clearResultForEdit\)/);

const relatedTools = read('assets/js/components/related-tools.js');
assert.match(relatedTools, /Object\.prototype\.hasOwnProperty\.call\(t, 'imageExt'\)/);
assert.match(relatedTools, /return \(resolvedExt === 'svg' \|\| resolvedExt === 'webp'\) \? resolvedKey : '';/);
assert.match(relatedTools, /const match = candidates\.find\(key => extMap\[key\]\);\s*return match \|\| '';/);
const relatedToolsMin = read('assets/js/components/related-tools.min.js');
assert.match(relatedToolsMin, /Object\.prototype\.hasOwnProperty\.call\(\w+,"imageExt"\)/);

const engineeringRuntime = read('assets/js/engineering-toolkit.js');
assert.doesNotMatch(engineeringRuntime, /capture-lead|engineering-pdf-gate/);
assert.match(engineeringRuntime, /function C\(e\)\{e\(\)\}/);

const windowDoor = read('tools/window-door-sizing/index.html');
assert.match(windowDoor, /\/engines\/window-door-sizing-engine\.js/);
assert.match(windowDoor, /WindowDoorSizingEngine\.calculate/);
const windowDoorEngine = read('engines/src/window-door-sizing-engine.js');
assert.match(windowDoorEngine, /aluminium:'alum'/);
assert.match(windowDoorEngine, /steel_security:'steel'/);
assert.match(windowDoorEngine, /unsupported-rate/);
assert.doesNotMatch(windowDoor, />PASS<|>FAIL<|Building Code Compliance Notes/);

console.log('Day 8 category runtime VIP contracts passed.');
