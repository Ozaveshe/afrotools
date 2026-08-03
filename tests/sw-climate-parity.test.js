'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const manifest = JSON.parse(read('data/localization/sw-climate-parity-manifest.json'));

assert.equal(manifest.categoryKey, 'climate');
assert.equal(manifest.canonicalEnglishApps, 13);
assert.equal(manifest.nativeSwahiliCandidates, 13);
assert.equal(manifest.acceptanceState, 'browser-pending');
assert.equal(manifest.routes.length, 13);
assert.equal(new Set(manifest.routes.map((row) => row.toolId)).size, 13);
assert.equal(new Set(manifest.routes.map((row) => row.english)).size, 13);
assert.equal(new Set(manifest.routes.map((row) => row.swahili)).size, 13);

const registryContext = {
  window: {},
  document: { getElementById: () => ({}), dispatchEvent: () => {}, readyState: 'complete' },
  CustomEvent: function CustomEvent() {}
};
vm.createContext(registryContext);
vm.runInContext(read('assets/js/components/tool-registry.js'), registryContext);

for (const row of manifest.routes) {
  const englishFile = `${row.english.replace(/^\//, '')}index.html`;
  const swahiliFile = `${row.swahili.replace(/^\//, '')}index.html`;
  const english = read(englishFile);
  const swahili = read(swahiliFile);
  assert.match(english, /window\.AfroClimateToolConfig=/, `${row.toolId}: English owner config missing`);
  assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili}"`), `${row.toolId}: English reciprocal missing`);
  assert.match(swahili, /<html\b[^>]*\blang="sw"[^>]*>/);
  assert.match(swahili, new RegExp(`data-sw-climate-tool="${row.toolId}"`));
  assert.match(swahili, /\/assets\/js\/climate-tools\.js/);
  assert.match(swahili, /\/assets\/js\/pages\/sw-climate-tools\.js/);
  assert.doesNotMatch(swahili, /<iframe|Continue in English|Open the full English|createTreeWalker|var pairs\s*=|var partial\s*=/i);
  assert.match(swahili, new RegExp(`<link rel="canonical" href="https://afrotools.com${row.swahili}">`));
  assert.match(swahili, new RegExp(`hreflang="en" href="https://afrotools.com${row.english}"`));
  assert.match(swahili, new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili}"`));
  assert.match(swahili, /"inLanguage"\s*:\s*"sw"/);
  assert.match(swahili, /Makadirio ya kupanga yenye uhakika mdogo/);
  assert.match(swahili, /Modeli ilikaguliwa 28 Aprili 2026/);
  assert.match(swahili, /hazitumwi kwa AI, analytics au kuwekwa kwenye anwani/);
  assert.equal((swahili.match(/Rejea ya mbinu;/g) || []).length, 3, `${row.toolId}: source boundary count`);
  assert.match(swahili, /data-json/);
  assert.match(swahili, /data-import-file/);
  assert.match(swahili, /data-pdf/);
  assert.match(swahili, /role="status" aria-live="polite"/);
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.replace(/^\//, ''))), `${row.toolId}: artwork missing`);
  assert.match(swahili, new RegExp(`og:image" content="https://afrotools.com${row.artwork.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  const rows = registryContext.AFRO_TOOLS.filter((tool) => tool.href === row.swahili);
  assert.equal(rows.length, 1, `${row.toolId}: expected one Swahili registry owner`);
  assert.equal(rows[0].lang, 'sw');
  assert.ok(rows[0].status === 'live' || rows[0].status === 'new');
}

const hub = read('sw/hali-ya-hewa-na-mazingira/index.html');
assert.match(hub, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/hali-ya-hewa-na-mazingira\/">/);
assert.equal((hub.match(/class="sw-climate-hub-link"/g) || []).length, 13);
assert.match(hub, /"numberOfItems":13/);
for (const row of manifest.routes) assert.match(hub, new RegExp(`href="${row.swahili}"`));
assert.match(read('climate/index.html'), /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/hali-ya-hewa-na-mazingira\/"/);

const engineContext = {
  console,
  location: { hostname: 'example.test' },
  fetch: () => Promise.reject(new Error('offline fixture')),
  document: { readyState: 'loading', addEventListener() {}, querySelectorAll: () => [], getElementById: () => null },
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  CustomEvent: function CustomEvent() {}
};
engineContext.window = engineContext;
vm.createContext(engineContext);
vm.runInContext(read('assets/js/climate-tools.js'), engineContext);

const oracles = {
  'drought-risk': [{ country: 'NG', crop: 'maize', season: 'early', rainfallAnomaly: -25, soil: 'loam', area: 2, cropValue: 1200 }, ['48', 'Medium', '$634']],
  'water-scarcity': [{ country: 'NG', useType: 'household', people: 4, dailyDemand: 70, supplyDays: 4, storage: 500, reusePct: 10 }, ['75', 'High', '252']],
  'rainfall-tracker': [{ country: 'NG', month: '1', crop: 'maize', stage: 'planting', receivedRain: 55, expectedRain: 80, area: 1.5 }, ['Below normal', 'Below normal', '55']],
  'carbon-credit': [{ country: 'NG', projectType: 'redd', projectSize: 100, price: 0, bufferPct: 15, validationCost: 35000 }, ['$31,326', 'Commercially plausible', '867']],
  'flood-risk': [{ country: 'NG', site: 'urban', distance: 'under100', elevation: 'under5', drainage: 'blocked', building: 'mud', propertyValue: 50000 }, ['91', 'Extreme', '$7,631']],
  'air-quality': [{ country: 'NG', location: 'capital', source: 'mixed', health: 'general', exposureHours: 6, pm25: 0 }, ['132', 'Unhealthy for sensitive groups', '48.1']],
  deforestation: [{ country: 'NG', forestType: 'tropical', hectares: 10, soilCarbon: 'low', restoration: 'natural' }, ['7,531', 'Extreme impact', '850']],
  'waste-management': [{ country: 'NG', kgDay: 50, pickups: 8 }, ['31', 'Needs sorting', '1,500']],
  'recycling-revenue': [{ country: 'NG', plastic: 80, aluminum: 15, steel: 30, paper: 60, glass: 40, organic: 100, contaminationPct: 12, transportCost: 12 }, ['$21', 'Worth collecting', '325']],
  'charcoal-vs-clean': [{ country: 'NG', charcoalKgWeek: 8, stoveCost: 65, years: 5 }, ['$-196', 'Needs subsidy or finance', '$874']],
  'ewaste-value': [{ country: 'NG', device: 'smartphone', condition: 'working', quantity: 5, recycler: 'certified' }, ['NGN 238,043', 'Lower handling risk', '0.9']],
  'tree-planting-roi': [{ country: 'NG', species: 'fruit', trees: 500 }, ['$119,003', 'Positive ROI', '375']],
  'sustainability-scorecard': [{ sector: 'retail', renewablePct: 20, recyclingPct: 25, hazardPlan: 'no', waterMeter: 'no', waterReusePct: 10, localSourcingPct: 50, ppe: 'no', training: 'no', reporting: 'no' }, ['F', 'Needs a 90-day plan', '5']]
};

assert.equal(Object.keys(oracles).length, 13);
for (const [toolId, [input, expected]] of Object.entries(oracles)) {
  const first = engineContext.AfroClimateTools.calculate(toolId, input);
  const second = engineContext.AfroClimateTools.calculate(toolId, input);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)), `${toolId}: engine is not deterministic`);
  assert.equal(first.value, expected[0], `${toolId}: result oracle drift`);
  assert.equal(first.level, expected[1], `${toolId}: level oracle drift`);
  assert.equal(first.metrics[0].value, expected[2], `${toolId}: metric oracle drift`);
}

const controller = read('assets/js/pages/sw-climate-tools.js');
assert.match(controller, /schemaVersion:\s*1/);
assert.match(controller, /locale:\s*'sw'/);
assert.match(controller, /URL\.createObjectURL/);
assert.match(controller, /file\.text\(\)/);
assert.match(controller, /payload\.tool !== tool/);
assert.match(controller, /\/assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(controller, /form\.addEventListener\('input', clearForEdit\)/);
assert.match(controller, /setAttribute\('aria-invalid', 'true'\)/);
assert.doesNotMatch(controller, /fetch\(|XMLHttpRequest|sendBeacon|\/\.netlify\/functions|\/api\//);

console.log('Swahili Climate static parity: 13/13 browser-pending candidates passed.');
