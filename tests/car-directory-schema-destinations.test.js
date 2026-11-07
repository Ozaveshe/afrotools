'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load(base) {
  const file = path.join(base, 'scripts/generate-car-price-pages.js');
  const source = fs.readFileSync(file, 'utf8');
  const boundary = source.indexOf('if (process.argv.includes("--catalog-only"))');
  assert.ok(boundary > 0, 'generator execution boundary exists');
  const context = { __dirname: path.dirname(file), console, process: { argv: [] }, require(id) {
    if (id === './apply-source-confidence-hooks') return { addSourceHook() { throw Error('write hook outside renderer test'); }, addHelperScript() { throw Error('write hook outside renderer test'); } };
    return require(id);
  } };
  vm.createContext(context);
  vm.runInContext(source.slice(0, boundary) + '\nthis.api = { html, schema, data, marketObservations };', context, { filename: file });
  return context.api;
}
const api = load(root);
function cases(a) {
  const out = [{ route: 'cars', meta: { title: 'Directory', description: 'Planning', pageType: 'root', includeFaq: true, listVehicles: a.data.vehicles } }];
  for (const slug of ['ghana', 'nigeria']) {
    const country = Object.values(a.data.countries).find(c => c.slug === slug);
    assert.ok(country);
    out.push({ route: 'cars/' + slug, meta: { title: country.name, description: 'Planning', country: country.name, countryObj: country, pageType: 'country', includeFaq: true, listVehicles: a.data.vehicles } });
  }
  const country = out[2].meta.countryObj, vehicle = a.data.vehicles[0];
  for (const pageType of ['make', 'model']) {
    const vehicles = a.data.vehicles.filter(v => v.makeSlug === vehicle.makeSlug && (pageType === 'make' || v.modelSlug === vehicle.modelSlug));
    out.push({ route: 'cars/nigeria/' + vehicle.makeSlug + (pageType === 'model' ? '/' + vehicle.modelSlug : ''), meta: { title: pageType, description: 'Planning', country: country.name, countryObj: country, pageType, make: vehicle.make, makeSlug: vehicle.makeSlug, model: vehicle.model, modelSlug: vehicle.modelSlug, listVehicles: vehicles } });
  }
  return out;
}
const samples = cases(api);
test('actual root, Ghana, Nigeria, make and model lists identify only visible destinations', () => {
  for (const { route, meta } of samples) {
    const html = api.html(route, meta);
    const list = JSON.parse(api.schema(meta, route)).find(b => b['@type'] === 'ItemList');
    const expected = meta.pageType === 'root'
      ? Object.values(api.data.countries).filter(c => api.marketObservations.some(o => o.countryCode === c.code)).map(c => ({ name: c.name, url: 'https://afrotools.com/cars/' + c.slug + '/' }))
      : meta.listVehicles.map(v => ({ name: v.year + ' ' + v.make + ' ' + v.model, url: 'https://afrotools.com/cars/' + meta.countryObj.slug + '/' + v.makeSlug + '/' + v.modelSlug + '/' + v.year + '/' }));
    if (expected.length < 2) { assert.equal(list, undefined); continue; }
    assert.ok(list, route);
    assert.deepEqual(list.itemListElement.map(({ name, url }) => ({ name, url })), JSON.parse(JSON.stringify(expected.slice(0, 12))));
    for (const [i, item] of list.itemListElement.entries()) {
      assert.equal(item.position, i + 1);
      assert.equal(item['@type'], 'ListItem');
      const url = new URL(item.url);
      assert.ok(html.includes('href="' + url.pathname + '"'), route + ': ' + item.url);
    }
  }
});
test('no vehicle-list destinations are invented without country context', () => {
  const meta = { title: 'Compare', description: 'Planning', listVehicles: api.data.vehicles };
  assert.equal(JSON.parse(api.schema(meta, 'cars/compare')).some(b => b['@type'] === 'ItemList'), false);
});
if (process.env.CAR_SCHEMA_BEFORE_ROOT) test('all non-list schema and every visible byte stay unchanged', () => {
  const before = load(process.env.CAR_SCHEMA_BEFORE_ROOT);
  const strip = html => html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  for (const { route, meta } of samples) {
    assert.equal(strip(api.html(route, meta)), strip(before.html(route, meta)));
    const nonList = a => JSON.parse(a.schema(meta, route)).filter(b => b['@type'] !== 'ItemList');
    assert.deepEqual(nonList(api), nonList(before));
  }
});
