'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {countryPageRows, productDate, regionalComparison} = require('../scripts/lib/fuel-country-reference');
const snapshot = require('../data/fuel/latest.json');
const markets = require('../data/fuel/markets.json');
const rows = countryPageRows(snapshot, markets, '2026-11-19T12:00:00Z');

test('a newer compatible national product replaces only that fuel', () => {
  const algeria = rows.find(r => r.code === 'DZ');
  assert.equal(algeria.petrol.observed_at,'2026-11-18');
  assert.equal(algeria.references.petrol.date_basis,'observation');
  assert.equal(algeria.petrol.usd,null);
  assert.equal(productDate(algeria,'lpg'),'2026-03-01');
  const original = snapshot.countries.find(r => r.code === 'ZW');
  assert.equal(rows.find(r => r.code === 'ZW').petrol.price,original.petrol.price);
  const national = markets.markets.find(m => m.market_id === 'ng-national');
  const product = {...national.fuels[0], currency:original.currency};
  for (const market of [
    {...national, country_code:'ZW', granularity:'city', fuels:[product]},
    {...national, country_code:'ZW', fuels:[{...product,currency:'USD'}]},
    {...national, country_code:'ZW', fuels:[{...product,unit:'kg'}]}
  ]) assert.deepEqual(countryPageRows({countries:[original]}, {markets:[market]})[0],original);
});

test('regional differentials require the same dated product, unit and USD amount from at least two peers', () => {
  const reference = {code:'A',region:'east',last_updated:'2026-11-16',petrol:{unit:'liter',usd:2,observed_at:'2026-11-16'}};
  const peer = (code, usd) => ({...reference,code,petrol:{unit:'liter',usd,observed_at:'2026-11-16'}});
  const wrongDate = {...reference,code:'E',petrol:{unit:'liter',usd:999,observed_at:'2026-03-01'}};
  const wrongUnit = {...peer('F',999),petrol:{unit:'kg',usd:999}};
  const pool = [reference,peer('B',1),peer('C',3),peer('D',null),wrongDate,wrongUnit];
  assert.deepEqual(regionalComparison(reference,pool,'petrol'),{date:'2026-11-16',count:2,delta:0});
  assert.equal(regionalComparison(reference,[reference,peer('B',1),wrongDate,wrongUnit],'petrol'),null);
});

test('all country pages retain the calculated source and per-product date in both languages', () => {
  const {countrySlug} = require('../scripts/build-french-fuel-country-pages');
  assert.equal(rows.length, 54);
  for (const row of rows) {
    const slug = countrySlug(row);
    for (const dir of ['tools/fuel-tracker','fr/tools/suivi-carburant']) {
      const html = fs.readFileSync(path.join(__dirname,'..',dir,slug,'index.html'),'utf8');
      const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
      assert.equal(schemas.find(s => s['@type'] === 'Dataset').dateModified, row.last_updated, dir + '/' + slug);
      const prices = schemas.find(s => s['@type'] === 'ItemList').itemListElement;
      for (const [i, type] of ['petrol','diesel','lpg'].entries()) {
        const props = prices[i].item.additionalProperty;
        assert.ok(props.some(p => p.value === row[type].price), dir + '/' + slug + ':' + type);
        if (row.references) assert.ok(props.some(p => p.value === productDate(row,type)));
        const ref = row.references?.[type];
        if (ref) assert.ok(props.some(p => p.value === ref.source_url));
      }
    }
  }
});
