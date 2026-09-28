const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const api = require('../assets/js/lib/afroatlas-research');
const { validate, validValue, DEFINITIONS } = require('../scripts/refresh-afroatlas-research-data');
const root = path.resolve(__dirname, '..');
const snapshot = require('../data/afroatlas/research-indicators.json');
const identities = require('../data/registry/countries.json');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'engines/src/afroatlas-engine.js'), 'utf8'), context);
const model = api.create(snapshot, context.AfroAtlas, identities);

test('nine indicators retain dated, bounded source observations for the full country set', () => {
  assert.equal(Object.keys(model.countries).length, 74);
  assert.equal(model.discover().length, 54);
  assert.equal(Object.keys(validate(snapshot)).length, 9);
  const badYears = structuredClone(snapshot);
  badYears.last_year = 2030;
  assert.throws(() => validate(badYears), /identity/);
  const badSource = structuredClone(snapshot);
  badSource.countries.NG.gdp.source_url = 'https://example.com/unsourced';
  assert.throws(() => validate(badSource), /source/);
});

test('missing dated observations never fall back to legacy country values', () => {
  assert.equal(model.point('ER', 'gdp'), null);
  assert.equal(model.point('NG', 'exportsTotal'), null);
  assert.equal(model.comparison('ER', 'NG', 'gdp', 'common').comparable, false);
  assert.match(model.brief('ER', 'study'), /GDP: N\/A: no observation/);
  assert.ok(model.point('ER', 'population'));
});

test('comparison uses the latest shared observation year and refuses mismatched gaps', () => {
  const synthetic = structuredClone(snapshot);
  synthetic.countries.NG.growth = { year: 2025, value: -2, series: { 2023: 0, 2025: -2 }, source_url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=NG' };
  synthetic.countries.KE.growth = { year: 2024, value: 6, series: { 2023: -1, 2024: 6 }, source_url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=KE' };
  const fixture = api.create(synthetic, context.AfroAtlas, identities);
  const common = fixture.comparison('NG', 'KE', 'growth', 'common');
  assert.deepEqual([common.a.year, common.a.value, common.b.year, common.b.value, common.comparable], [2023, 0, 2023, -1, true]);
  assert.equal(fixture.comparison('NG', 'KE', 'growth', 'latest').comparable, false);
  synthetic.countries.KE.growth.series = { 2024: 6 };
  const noShared = api.create(synthetic, context.AfroAtlas, identities).comparison('NG', 'KE', 'growth', 'common');
  assert.equal(noShared.comparable, false);
  assert.equal(noShared.note, 'No shared observation year');
});

test('growth rankings include contraction and zero without inventing missing values', () => {
  assert.equal(validValue(-4, DEFINITIONS.growth), true);
  assert.equal(validValue(0, DEFINITIONS.electricity), true);
  assert.equal(validValue(101, DEFINITIONS.electricity), false);
  assert.equal(validValue(null, DEFINITIONS.population), false);
  const ranked = model.discover({ sort: 'growth', year: 2020 }).filter(country => model.point(country.code, 'growth', 2020));
  assert.ok(ranked.some(country => model.point(country.code, 'growth', 2020).value < 0));
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(model.point(ranked[i - 1].code, 'growth', 2020).value >= model.point(ranked[i].code, 'growth', 2020).value);
  }
});

test('discovery understands names, codes, aliases, capitals and canonical regions', () => {
  assert.deepEqual(model.compareQuery('Nigeria vs. Kenya'), { a: 'NG', b: 'KE' });
  assert.equal(model.resolve('Ivory Coast', true), 'CI');
  assert.equal(model.resolve('Cabo Verde', true), 'CV');
  assert.equal(model.resolve('United States', true), '');
  assert.equal(model.discover({ query: 'Abuja' })[0].code, 'NG');
  assert.equal(model.countries.CM.region, 'Central Africa');
  assert.equal(model.countries.ZM.region, 'Southern Africa');
  assert.ok(model.discover({ region: 'Central Africa' }).some(country => country.code === 'CM'));
  assert.deepEqual(model.shortlist(['NG', 'NG', 'KE', 'ZZ', 'US', 'GH', 'ZA', 'EG']), ['NG', 'KE', 'GH', 'ZA']);
});

test('exports carry observation dates, gaps, sources and spreadsheet-safe text', () => {
  const csv = model.csv(['NG']);
  assert.equal(csv.split('\r\n').length, 10);
  assert.match(csv, /"observation_year","source_url","retrieved_at"/);
  assert.match(csv, /"Exports of goods and services","","current US\$",""/);
  assert.match(csv, /NY\.GDP\.MKTP\.CD\?locations=NG/);
  const malicious = { ...context.AfroAtlas, COUNTRIES: { ...context.AfroAtlas.COUNTRIES, NG: { ...context.AfroAtlas.COUNTRIES.NG, name: '=HYPERLINK("x")' } } };
  assert.match(api.create(snapshot, malicious, identities).csv(['NG']), /'=HYPERLINK/);
  assert.match(model.brief('NG', 'trade'), /goods-only/);
});

test('all country and world-reference flags are local, pinned, attributed assets', () => {
  const manifest = require('../data/afroatlas/flag-assets.json');
  assert.equal(manifest.license, 'CC-BY-4.0');
  assert.equal(Object.keys(manifest.assets).length, 74);
  for (const code of Object.keys(model.countries)) {
    const asset = manifest.assets[code];
    assert.ok(asset, code + ' flag asset');
    const svg = fs.readFileSync(path.join(root, asset.path.slice(1)));
    assert.equal(crypto.createHash('sha256').update(svg).digest('hex'), asset.sha256);
    assert.doesNotMatch(svg.toString().replace(/xmlns="[^"]+"/g, ''), /<script|<foreignObject|\bon\w+=|https?:\/\//i);
  }
  assert.match(fs.readFileSync(path.join(root, 'tools/afroatlas/sources/index.html'), 'utf8'), /Twemoji.*CC BY 4\.0/s);
});

test('country dataset and FAQ schemas describe the visible dated profile', () => {
  for (const country of model.discover()) {
    const html = fs.readFileSync(path.join(root, 'tools/afroatlas/country', country.slug, 'index.html'), 'utf8');
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const dataset = schemas.find(schema => schema['@type'] === 'Dataset');
    assert.ok(dataset, country.name);
    assert.equal(dataset.temporalCoverage, '2016/2025');
    assert.equal(dataset.dateModified, snapshot.retrieved_at.slice(0, 10));
    assert.match(dataset.description, /Resource/);
    const faq = schemas.find(schema => schema['@type'] === 'FAQPage');
    for (const row of faq.mainEntity) {
      assert.ok(html.includes(api.escapeHtml(row.name)), row.name);
      assert.ok(html.includes(api.escapeHtml(row.acceptedAnswer.text)), row.name + ' visible answer');
    }
    assert.doesNotMatch(html, /chart\.js|cdn\.jsdelivr\.net.*twemoji/i);
  }
});
