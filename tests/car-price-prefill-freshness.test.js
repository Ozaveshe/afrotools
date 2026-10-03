const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Price = require('../assets/js/lib/car-price-intelligence');
const Import = require('../assets/js/lib/car-import-cost-engine');
const root = path.join(__dirname, '..');
const now = new Date('2026-10-03T00:00:00Z');
const fixture = () => ({
  country: { import_enabled: true, code: 'NG', slug: 'nigeria' },
  sourceMarket: 'uae', priceFreshnessDays: 14,
  vehicle: { make: 'Toyota', model: 'Corolla', year: 2018, cc: [1800, 1800] },
  sourcePrice: { median: 8400, lastUpdated: '2026-09-27' }
});
const url = (context, clock = now) => new URL(Price.buildCalculatorUrl(context, clock), 'https://afrotools.com');

test('a fresh source price can prefill while vehicle choices remain intact', () => {
  const params = url(fixture()).searchParams;
  assert.equal(params.get('price'), '8400');
  assert.equal(params.get('newQuote'), '1');
  for (const [field, value] of Object.entries({ country: 'NG', source: 'uae', make: 'Toyota', model: 'Corolla', year: '2018', engineCc: '1800' })) {
    assert.equal(params.get(field), value);
  }
});

test('the source date expires at the exact configured boundary without resetting history', () => {
  const context = fixture(); context.sourcePrice.lastUpdated = '2026-09-19';
  assert.equal(url(context).searchParams.get('price'), '8400');
  assert.equal(url(context, new Date(now.getTime() + 1)).searchParams.has('price'), false);
  assert.equal(context.sourcePrice.lastUpdated, '2026-09-19');
});

test('future, impossible, missing and ambiguous source dates cannot prefill', () => {
  for (const date of [undefined, '', 'yesterday', '2026-09-31', '2026-02-30', '2026-10-04', '09/27/2026']) {
    const context = fixture(); context.sourcePrice.lastUpdated = date;
    assert.equal(url(context).searchParams.has('price'), false, String(date));
    assert.equal(url(context).searchParams.get('year'), '2018');
  }
});

test('unknown or malformed freshness windows and non-positive prices cannot prefill', () => {
  for (const days of [undefined, 0, -1, '14', 1.5, 366]) {
    const context = fixture(); context.priceFreshnessDays = days;
    assert.equal(url(context).searchParams.has('price'), false, String(days));
  }
  for (const median of [undefined, NaN, 0, -1]) {
    const context = fixture(); context.sourcePrice.median = median;
    assert.equal(url(context).searchParams.has('price'), false);
  }
});

test('invalid clocks cannot qualify a price and unsupported countries keep no calculator link', () => {
  assert.equal(url(fixture(), new Date('invalid')).searchParams.has('price'), false);
  const context = fixture(); context.country.import_enabled = false;
  assert.equal(Price.buildCalculatorUrl(context, now), '');
});

test('the actual Camry and RAV4 source samples stay dated and lose expired price prefills', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/cars/price-intelligence.json'), 'utf8'));
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const importData = Import.mergeData(read('data/trade/car-import-cost-core.json'),
    ['ng', 'ke', 'gh', 'ug', 'zm', 'tz'].map(code => read('data/trade/car-import-cost-' + code + '.json')),
    read('data/forex/latest.json').rates);
  for (const model of ['Camry', 'RAV4']) {
    const vehicle = data.vehicles.find(row => row.make === 'Toyota' && row.model === model && row.year === 2018);
    const sourcePrice = Price.getSourcePrice(data, vehicle, 'uae');
    const context = Price.buildVehicleContext(data, importData, { country: 'nigeria', vehicle, sourceMarket: 'uae' });
    assert.equal(context.priceFreshnessDays, data.staleAfterDays, 'the real context carries the source window');
    assert.equal(sourcePrice.lastUpdated, '2026-09-16');
    assert.equal(url(context).searchParams.has('price'), false);
    assert.equal(url(context).searchParams.get('source'), 'uae');
    assert.ok(sourcePrice.sampleSize >= 3);
    assert.match(sourcePrice.sourceUrl, /yallamotor\.com/);
  }
});

test('all generated evidence links require a quote while historical dates stay visible', () => {
  const pages = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) pages.push(file);
    }
  }
  walk(path.join(root, 'cars'));
  let calculatorLinks = 0;
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/href="([^"]*\/tools\/car-import-cost\/[^\"]*)"/g)) {
      const link = new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com');
      assert.equal(link.searchParams.has('price'), false, path.relative(root, file));
      if (link.searchParams.has('make')) assert.equal(link.searchParams.get('newQuote'), '1', path.relative(root, file));
      calculatorLinks += 1;
    }
  }
  assert.ok(pages.length >= 1000, 'all supported generated car routes are inspected');
  assert.ok(calculatorLinks >= 10, 'real evidence calculator links were inspected');
  for (const model of ['camry', 'rav4']) {
    const html = fs.readFileSync(path.join(root, 'cars/nigeria/toyota/' + model + '/2018/index.html'), 'utf8');
    assert.ok(html.includes('2026-09-16'));
    assert.ok(html.includes('Enter a current source quote'));
  }
});

test('the release build regenerates English evidence before French reciprocal links', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const steps = pkg.scripts['build:surfaces'].split(' && ');
  const english = steps.indexOf('node scripts/generate-car-price-pages.js');
  const french = steps.indexOf('npm run fr:surface:build');
  assert.ok(english >= 0 && english < french, 'release artifacts cannot retain old static price prefills');
});
