const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const Price = require('../assets/js/lib/car-price-intelligence.js');
const Import = require('../assets/js/lib/car-import-cost-engine.js');
const runtime = fs.readFileSync(path.join(root, 'assets/js/cars-directory.js'), 'utf8');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

async function render(route, options = {}) {
  const app = { innerHTML: '' }, requests = [];
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  const location = new URL(route, 'http://localhost');
  const window = {
    AfroCarPriceIntelligence: Price, AfroCarImportCost: Import,
    AfroTools: { analytics: { track(name) { finish(name); } } }
  };
  const context = {
    window, location, URLSearchParams, console,
    localStorage: { getItem() { return null; } },
    document: {
      readyState: 'complete',
      querySelector(selector) { return selector === '#carsApp' ? app : null; },
      querySelectorAll() { return []; }
    },
    async fetch(url) {
      requests.push(url);
      assert.ok(url.startsWith('/data/'), 'only mocked committed public datasets are requested');
      if (options.missingSource && url.endsWith('/source-market-observations.json')) throw new Error('Synthetic optional dataset failure');
      let data = read(url.slice(1));
      if (options.transform) data = options.transform(url, data);
      return { ok: true, json: async () => data };
    }
  };
  vm.runInNewContext(runtime, context, { filename: 'actual-cars-directory.js', timeout: 1000 });
  await Promise.race([done, new Promise((_, reject) => setTimeout(() => reject(new Error('Actual loader did not finish')), 2000).unref())]);
  assert.doesNotMatch(app.innerHTML, /Car data could not load/);
  return { html: app.innerHTML, requests };
}

const buyer = '/cars/nigeria/toyota/camry/2018/';
const compare = '/cars/compare/?country=nigeria&make=toyota&model=camry&year=2018';

test('hydrated buyer view retains both exact Camry price sources, dates and sample methods', async () => {
  const { html } = await render(buyer);
  assert.match(html, /href="https:\/\/jiji.ng\/lagos\/cars\/toyota-camry-2018"/);
  assert.match(html, /href="https:\/\/uae.yallamotor.com\/used-cars\/toyota\/camry\/yr_2018_2018"/);
  assert.match(html, /12 asking prices; reviewed 2026-09-27/);
  assert.match(html, /8 asking prices; reviewed 2026-09-27; source page updated 2026-09-16/);
  assert.match(html, /First 20 visible results reviewed/);
  assert.match(html, /Excluded hybrid, unspecified engines/);
  assert.match(html, /not a live feed or completed sales/);
  assert.match(html, /Central Bank of the UAE exchange rates, 25 September 2026/);
  assert.match(html, /carsExportCsv/);
  assert.match(html, /25,300,000/);
});

test('actual compare route exposes the evidence for its local and UAE prices', async () => {
  const { html } = await render(compare);
  assert.match(html, /2018 Toyota Camry into Nigeria/);
  assert.match(html, /Check Jiji Lagos Toyota Camry 2018 results/);
  assert.match(html, /Check YallaMotor UAE Toyota Camry 2018 results/);
  assert.match(html, /How this price sample was selected/);
});

test('a Nigeria local observation is not displayed as a Kenya local quote', async () => {
  const { html } = await render('/cars/kenya/toyota/camry/2018/');
  assert.doesNotMatch(html, /Check Jiji Lagos/);
  assert.match(html, /Check YallaMotor UAE/);
});

test('optional source-evidence fetch failure preserves the buyer result and local evidence', async () => {
  const { html } = await render(buyer, { missingSource: true });
  assert.match(html, /2018 Toyota Camry in Nigeria/);
  assert.match(html, /25,300,000/);
  assert.match(html, /Check Jiji Lagos/);
  assert.doesNotMatch(html, /Check YallaMotor/);
});

test('malformed observation collections and unsafe source URLs do not add fabricated links', async () => {
  const { html } = await render(buyer, { transform(url, data) {
    if (url.endsWith('/source-market-observations.json')) return { observations: 'not an array' };
    if (url.endsWith('/market-observations.json')) data.observations.forEach(row => { row.sourceUrl = 'javascript:alert(1)'; });
    return data;
  } });
  assert.match(html, /2018 Toyota Camry in Nigeria/);
  assert.doesNotMatch(html, /cars-price-evidence/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('evidence copy is HTML escaped and unrelated vehicle samples remain absent', async () => {
  const { html } = await render(buyer, { transform(url, data) {
    if (url.endsWith('/market-observations.json')) data.observations.find(row => row.vehicleId === 'toyota-camry-2018').method = '<img src=x onerror=alert(1)>';
    return data;
  } });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /Check.*(?:Corolla|RAV4)/);
});
