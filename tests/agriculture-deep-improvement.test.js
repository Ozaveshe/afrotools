const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const sandbox = { document: undefined, window: {} };
vm.createContext(sandbox);
vm.runInContext(registrySource, sandbox);

const rows = sandbox.AFRO_TOOLS
  .filter((row) => row.category === 'agriculture' && ['live', 'new'].includes(row.status))
  .filter((row) => !/^\/(?:fr|sw|ha|yo)\//.test(row.href));
const directory = fs.readFileSync(path.join(root, 'agriculture/all-tools/index.html'), 'utf8');
const directoryHrefs = Array.from(directory.matchAll(/<a\b[^>]*href="([^"]+)"/g), (match) => match[1]);
const { DATA: fertilizerCountryContent } = require('../scripts/expand-fertilizer');

assert.strictEqual(rows.length, 447, 'current Agriculture live/new English registry count');
for (const row of rows) {
  assert.strictEqual(directoryHrefs.filter((href) => href === row.href).length, 1,
    `${row.href} must have one descriptive static directory link`);
}

const forbiddenPublicLanguage = /\b(?:registry-backed|bucket explorer|bucket hub|bucket tools|bucket summary|sibling hubs|left to sort|thin page|quality checks addressed here|browserOk|decision workspace)\b/i;
const forbiddenHref = /(?:^|\/)(?:admin|internal|debug|backoffice)(?:\/|$)/i;
const hubs = [
  'agriculture/index.html',
  'agriculture/all-tools/index.html',
  'agriculture/crop-planning-yield/index.html',
  'agriculture/livestock-poultry/index.html',
  'agriculture/farm-finance-roi/index.html',
  'agriculture/inputs-feed-operations/index.html',
  'agriculture/irrigation-weather-climate/index.html',
  'agriculture/market-prices-trade-post-harvest/index.html',
  'agriculture/equipment-infrastructure/index.html',
  'agriculture/products-platforms/index.html'
];

for (const relative of hubs) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  assert(!forbiddenPublicLanguage.test(visible), `${relative} contains internal public language`);
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)/gi)) {
    assert(!forbiddenHref.test(match[1]), `${relative} links to an internal/admin route: ${match[1]}`);
  }
}

for (const row of rows) {
  const clean = row.href.replace(/^\/+|\/+$/g, '');
  const file = row.href.endsWith('/')
    ? path.join(root, clean, 'index.html')
    : path.join(root, `${clean}.html`);
  const html = fs.readFileSync(file, 'utf8');
  assert(!html.includes('Quality checks addressed here:'), `${row.href} exposes QA language`);
  assert(!html.includes('move from a thin page'), `${row.href} exposes batch-generation language`);
  assert(!/<a\b[^>]*href=["'][^"']*(?:\/admin\/|\/internal\/|\/debug\/|\/backoffice\/)/i.test(html),
    `${row.href} links to an internal/admin route`);
  assert(!/<section class="df-upgrade"[\s\S]*?Quantity or area[\s\S]*?<\/section>/i.test(html),
    `${row.href} retains the unrelated generic cost panel`);
}

const maintainedEntryIds = [
  'crop-yield-estimator',
  'fertilizer-calculator',
  'irrigation-calculator',
  'farm-profit-calculator',
  'seed-rate-calculator',
  'fish-farming-roi',
  'greenhouse-cost-estimator',
  'cassava-processing-calculator',
  'farm-loans-hub',
  'crop-insurance',
  'farm-payroll-calculator',
  'livestock-feed-calculator',
  'poultry-roi-calculator',
  'vaccination-schedule',
  'harvest-date-estimator',
  'input-prices'
];
for (const id of maintainedEntryIds) {
  const match = rows.find((row) => row.id === id);
  assert(match, `registry row missing for ${id}`);
  const clean = match.href.replace(/^\/+|\/+$/g, '');
  const file = match.href.endsWith('/') ? path.join(root, clean, 'index.html') : path.join(root, `${clean}.html`);
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('data-day6-agriculture-calculator'), `${match.href} must use the maintained calculator engine`);
  assert(html.includes('/assets/js/pages/day6-agriculture-family-calculators.js'), `${match.href} must load the maintained calculator engine`);
}

const fertilizerRows = rows.filter((row) => /^\/agriculture\/fertilizer\/[^/]+$/.test(row.href));
assert.strictEqual(fertilizerRows.length, 54, 'fertilizer country route count');
for (const row of fertilizerRows) {
  const slug = row.href.split('/').filter(Boolean).slice(-1)[0];
  const html = fs.readFileSync(path.join(root, `agriculture/fertilizer/${slug}.html`), 'utf8');
  const content = fertilizerCountryContent[slug];
  assert(content, `country-owned fertilizer content missing for ${slug}`);
  assert(html.includes(content.market), `${row.href} does not contain its country-owned fertilizer market context`);
  assert(html.includes('maintained nutrient-removal method'), `${row.href} must explain the supported-crop boundary`);
  assert(!/Calculate exact NPK/i.test(html), `${row.href} overclaims exact fertilizer output`);
  if (slug !== 'nigeria') {
    assert(!/Dangote Fertilizer|Presidential Fertilizer Initiative|FMARD|Bank Verification Number/i.test(html),
      `${row.href} inherited Nigeria-only fertilizer content`);
  }
}

const countrySandbox = { window: { AfroTools: {} } };
vm.createContext(countrySandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'data/agriculture/country-index.js'), 'utf8'), countrySandbox);
const countriesBySlug = new Map(countrySandbox.window.AfroTools.countryIndex.map((country) => [country.slug, country]));
const canonicalCountryTitleByCode = new Map(
  JSON.parse(fs.readFileSync(path.join(root, 'data/registry/countries.json'), 'utf8'))
    .map((country) => [country.id, country.title])
);
const countryDataByCode = new Map();
for (const file of fs.readdirSync(path.join(root, 'data/agriculture')).filter((name) => /^[a-z]{2}-agri-data\.js$/.test(name))) {
  const dataSandbox = { window: { AfroTools: {} } };
  vm.createContext(dataSandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'data/agriculture', file), 'utf8'), dataSandbox);
  const data = dataSandbox.window.AfroTools.countryData;
  countryDataByCode.set(data.countryCode, data);
}
const countryRows = rows.filter((row) => row.countries.length === 1 && row.countries[0] !== 'ALL');
assert.strictEqual(countryRows.length, 414, 'country-specific Agriculture route count');
for (const row of countryRows) {
  const clean = row.href.replace(/^\/+|\/+$/g, '');
  const file = row.href.endsWith('/') ? path.join(root, clean, 'index.html') : path.join(root, `${clean}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const code = row.countries[0];
  const data = countryDataByCode.get(code);
  assert(data, `${row.href} country data missing for ${code}`);
  const expectedMeta = {
    'afrotools-country-id': code,
    'afrotools-source-jurisdiction': code,
    'afrotools-formula-jurisdiction': code,
    'afrotools-currency': data.currency
  };
  for (const [name, value] of Object.entries(expectedMeta)) {
    const matches = Array.from(html.matchAll(new RegExp(`<meta name="${name}" content="([^"]+)">`, 'g')));
    assert.strictEqual(matches.length, 1, `${row.href} must have exactly one ${name} meta`);
    assert.strictEqual(matches[0][1], value, `${row.href} has wrong ${name}`);
  }
  assert(html.includes(`<link rel="canonical" href="https://afrotools.com${row.href}">`),
    `${row.href} canonical must own its registry route`);
}
const seedRows = rows.filter((row) => /^\/agriculture\/seed-rate\/[^/]+$/.test(row.href));
assert.strictEqual(seedRows.length, 54, 'seed-rate country route count');
for (const row of seedRows) {
  const slug = row.href.split('/').filter(Boolean).slice(-1)[0];
  const country = countriesBySlug.get(slug);
  const html = fs.readFileSync(path.join(root, `agriculture/seed-rate/${slug}.html`), 'utf8');
  assert(country, `country index row missing for ${slug}`);
  assert(html.includes('/data/agriculture/seed-data-extension.js'), `${row.href} must load maintained extended seed methods`);
  assert(!/exact seed quantities/i.test(html), `${row.href} overclaims exact seed output`);
  assert(html.includes(`"position":4,"name":"${country.name}"`), `${row.href} has the wrong country breadcrumb schema`);
}

const identityFamilies = [
  {
    route: 'fertilizer',
    current: (country) => `fertilizer-${country.slug}`,
    displayName: (country) => canonicalCountryTitleByCode.get(country.code)
  },
  { route: 'irrigation', current: (country) => `irrigation-${country.slug}`, displayName: (country) => country.name },
  { route: 'seed-rate', current: (country) => `seed-rate-${country.code.toLowerCase()}`, displayName: (country) => country.name }
];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g,
  (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
for (const family of identityFamilies) {
  const familyRows = rows.filter((row) => new RegExp(`^/agriculture/${family.route}/[^/]+$`).test(row.href));
  assert.strictEqual(familyRows.length, 54, `${family.route} country identity route count`);
  for (const row of familyRows) {
    const slug = row.href.split('/').filter(Boolean).slice(-1)[0];
    const country = countriesBySlug.get(slug);
    const data = country && countryDataByCode.get(country.code);
    const html = fs.readFileSync(path.join(root, `agriculture/${family.route}/${slug}.html`), 'utf8');
    assert(country && data, `${row.href} country data missing`);
    const displayName = family.displayName(country);
    const expectedMeta = {
      'afrotools-country-id': country.code,
      'afrotools-source-jurisdiction': country.code,
      'afrotools-formula-jurisdiction': country.code,
      'afrotools-currency': data.currency
    };
    for (const [name, value] of Object.entries(expectedMeta)) {
      const matches = Array.from(html.matchAll(new RegExp(`<meta name="${name}" content="([^"]+)">`, 'g')));
      assert.strictEqual(matches.length, 1, `${row.href} must have exactly one ${name} meta`);
      assert.strictEqual(matches[0][1], value, `${row.href} has wrong ${name}`);
    }
    assert(html.includes(`Farming context: ${escapeHtml(displayName)}`), `${row.href} has wrong-country farming context`);
    assert(html.includes(`"position":4,"name":"${displayName}"`), `${row.href} has wrong-country breadcrumb schema`);
    assert(html.includes(`current="${family.current(country)}"`), `${row.href} has wrong related-tool identity`);
  }
}

console.log('Agriculture deep-improvement contract passed: 447 static links, 447 route-language checks, 16 maintained entry workflows, 414 country-route identity contracts, 54 country-owned fertilizer pages, 54 seed-rate contracts, 162 country-family identity contracts.');
