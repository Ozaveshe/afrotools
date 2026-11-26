'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ownerPath = path.resolve(__dirname, '../netlify/functions/scheduled-fetch-fuel-prices.js');
const copy = value => JSON.parse(JSON.stringify(value));
const url = (slug, fuel) => 'https://www.globalpetrolprices.com/' + slug + '/' + fuel + '_prices/';
const saved = (price, date, source) => ({ price, unit: 'liter', usd: 1,
  change: 'stable', change_pct: 0, observed_at: date, source_url: source });

function load(options = {}) {
  const calls = [];
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports,
    require(id) {
      if (id === './_shared/scraper-base') return {
        runScraper: async config => config,
        fetchWithRetry: async requested => {
          calls.push(requested);
          if (!options.html) throw new Error('No synthetic response configured');
          return { text: async () => options.html(requested) };
        }
      };
      if (id === './_shared/data-store') return { getData: async key => {
        if (key !== 'fuel-latest') throw new Error('Unexpected data key ' + key);
        return options.previous || null;
      } };
      throw new Error('Unexpected import: ' + id);
    }
  });
  vm.runInContext(fs.readFileSync(ownerPath, 'utf8'), context, { filename: ownerPath });
  return { context, calls, api: module.exports };
}

test('fresh local product keeps its own date and exact source URL', () => {
  const { context } = load();
  const item = context.buildFuelValue({ local: 14, usd: 1.2, observed_at: '2026-10-19',
    source_url: url('Ghana', 'diesel') }, null, null);
  assert.equal(item.fuel.price, 14);
  assert.equal(item.fuel.usd, 1.2);
  assert.equal(item.fuel.observed_at, '2026-10-19');
  assert.equal(item.fuel.source_url, url('Ghana', 'diesel'));
  assert.equal(item.observedAt, '2026-10-19');
});

for (const local of [null, undefined, 0, -1, NaN, Infinity]) {
  test('invalid local amount ' + String(local) + ' cannot relabel USD or overwrite saved provenance', () => {
    const { context } = load();
    const previous = saved(12, '2026-10-05', url('Ghana', 'diesel'));
    const before = copy(previous);
    const result = context.buildFuelValue({ local, usd: 1.3, observed_at: '2026-10-19' }, previous, '2026-10-19');
    assert.equal(result.fuel, previous);
    assert.deepEqual(previous, before);
    assert.equal(result.observedAt, '2026-10-05');
    assert.equal(result.reusedExisting, true);
  });
}

test('USD-only scrape without a saved local price stays missing for normal validation', () => {
  const result = load().context.buildFuelValue({ local: null, usd: 1.2 }, null, null);
  assert.equal(result.fuel, null);
});

test('older incoming product cannot refresh its saved date or source', () => {
  const previous = saved(12, '2026-10-19', url('Ghana', 'diesel'));
  const result = load().context.buildFuelValue({ local: 10, observed_at: '2026-10-12' }, previous, '2026-10-20');
  assert.equal(result.fuel, previous);
  assert.equal(result.observedAt, '2026-10-19');
});

test('newer diesel is compared with diesel observation rather than newer petrol snapshot', () => {
  const previous = saved(12, '2026-10-05', url('Ghana', 'diesel'));
  const result = load().context.buildFuelValue({ local: 14, observed_at: '2026-10-12',
    source_url: url('Ghana', 'diesel') }, previous, '2026-10-19');
  assert.equal(result.fuel.price, 14);
  assert.equal(result.fuel.observed_at, '2026-10-12');
});

test('legacy reuse remains useful without inventing an individual observation date', () => {
  const previous = { price: 12, unit: 'liter' };
  const result = load().context.buildFuelValue(null, previous, '2026-10-19');
  assert.equal(result.fuel, previous);
  assert.equal(Object.hasOwn(result.fuel, 'observed_at'), false);
  assert.equal(result.observedAt, null);
  const older = load().context.buildFuelValue({ local: 10, observed_at: '2026-10-12' }, previous, '2026-10-19');
  assert.equal(older.fuel, previous);
});

test('undated successful local scrape explicitly has no individual date', () => {
  const result = load().context.buildFuelValue({ local: 14, usd: 1.2,
    source_url: url('Ghana', 'gasoline') }, null, null);
  assert.equal(result.fuel.observed_at, null);
  assert.equal(result.observedAt, null);
});

test('real collector maps each fetched URL and preserves reused diesel beside fresh petrol', async () => {
  const countries = copy(load().context.COUNTRIES);
  const previous = { countries: countries.map(c => ({ ...c,
    petrol: saved(11, '2026-10-05', url(c.slug, 'gasoline')),
    diesel: saved(12, '2026-10-05', url(c.slug, 'diesel')),
    lpg: { price: 3 }, regulated: true, last_updated: '2026-10-05' })) };
  const before = copy(previous);
  // The stub returns the same objects; mutation of saved rows is observable.
  // getData closure sees this object without invoking SDK/storage operations.
  const runner = load({ previous, html: requested => {
    if (requested.endsWith('/diesel_prices/')) {
      if (requested === url('Ghana', 'diesel')) return '<h1>19-Oct-2026</h1><table><tr><td>USD</td><td>1.3</td></tr></table>';
      throw new Error('Synthetic diesel unavailable');
    }
    const country = countries.find(c => requested === url(c.slug, 'gasoline'));
    if (!country) throw new Error('Unexpected source URL');
    return '<h1>' + country.name + ' Gasoline prices, liter, 19-Oct-2026</h1><table><tr><th>' + country.name + ' Gasoline prices</th><th>Liter</th><th>Gallon</th></tr><tr><td>' + country.currency + '</td><td>14</td><td>53</td></tr><tr><td>USD</td><td>1.2</td><td>4.54</td></tr></table>';
  } });
  const rows = await runner.context.fetchFromGlobalPetrolPrices();
  assert.equal(rows.length, countries.length);
  assert.equal(runner.calls.length, countries.length * 2);
  for (const row of rows) {
    const old = previous.countries.find(c => c.code === row.code);
    assert.equal(row.petrol.price, 14);
    assert.equal(row.petrol.observed_at, '2026-10-19');
    assert.equal(row.petrol.source_url, url(old.slug, 'gasoline'));
    assert.equal(row.diesel, old.diesel);
    assert.equal(row.diesel.observed_at, '2026-10-05');
    assert.equal(row.diesel.source_url, url(old.slug, 'diesel'));
    assert.equal(row.last_updated, '2026-10-19');
    assert.equal(row.lpg, old.lpg);
    assert.equal(row.regulated, true);
  }
  assert.deepEqual(previous, before);
  assert.equal(runner.context.validateFuelData(runner.context.transformFuelData(rows)).valid, true);
});

test('current local and USD quotes require matching country, fuel, unit, currency and real date', () => {
  const parse=load().context.parseCountryFuelQuote;
  const country={name:'Nigeria',slug:'Nigeria',currency:'NGN'};
  const html='<h1>Nigeria Gasoline prices, 23-Nov-2026</h1><p>The current gasoline price in Nigeria is NGN 1,057.75 per liter or USD 0.78 per liter and was updated on 23-Nov-2026.</p>';
  assert.deepEqual(copy(parse(html,country,'gasoline')), {local:1057.75,usd:0.78,observed_at:'2026-11-23'});
  for(const input of [html.replace('in Nigeria','in Kenya'),html.replace('NGN','KES'),html.replace('per liter','per gallon'),html.replace('on 23-Nov','on 22-Nov'),html.replaceAll('23-Nov','31-Nov'),html.replace('1,057','10,57')]) assert.equal(parse(input,country,'gasoline'),null);
  assert.equal(parse(html,country,'diesel'),null);
  const diesel=html.replaceAll('Gasoline','Diesel').replace('gasoline price','price of diesel fuel').replace('and was updated on','based on the latest update from');
  assert.equal(parse(diesel,country,'diesel').local,1057.75);
});
test('wholly unavailable source cannot count saved rows as a new source collection', async () => {
  const countries=copy(load().context.COUNTRIES);
  const runner=load({previous:{countries},html:()=>'<h1>World prices</h1>'});
  await assert.rejects(runner.context.fetchFromGlobalPetrolPrices(),/no usable dated local prices/);
});

test('legacy table identifies the actual litre column even when gallon is first', () => {
  const parse=load().context.parseCountryFuelQuote, country={name:'Angola',slug:'Angola',currency:'AOA'};
  const html='<h1>Angola Diesel prices, liter, 23-Nov-2026</h1><table><tr><th>Angola Diesel prices</th><th>Gallon</th><th>Liter</th></tr><tr><td>AOA</td><td>1135.5</td><td>300</td></tr><tr><td>USD</td><td>1.23</td><td>0.327</td></tr></table>';
  assert.equal(parse(html,country,'diesel').local,300);
  for(const input of [html.replace('>Liter<','>Gallon<'),html.replace('>AOA<','>KES<'),html.replace('>Angola Diesel prices</th>','>Kenya Diesel prices</th>')]) assert.equal(parse(input,country,'diesel'),null);
});
