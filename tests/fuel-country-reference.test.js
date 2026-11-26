'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {countryPageRows, productDate, regionalComparison} = require('../scripts/lib/fuel-country-reference');
const snapshot = require('../data/fuel/latest.json');
const markets = require('../data/fuel/markets.json');
const rows = countryPageRows(snapshot, markets);

test('a newer compatible national product replaces only that fuel', () => {
  const algeria = countryPageRows({countries: [{"lpg": {"usd": 0.11, "unit": "kg", "price": 15}, "code": "DZ", "name": "Algeria", "diesel": {"usd": 0.24, "unit": "liter", "price": 33, "change": "stable", "change_pct": 0}, "petrol": {"usd": 0.34, "unit": "liter", "price": 46, "change": "stable", "change_pct": 0}, "region": "north", "source": "globalpetrolprices", "currency": "DZD", "regulated": true, "last_updated": "2026-03-01"}]}, {markets: [{"market_id": "dz-national-arh", "country_code": "DZ", "country_name": "Algeria", "locality_name": "Algeria", "latitude": null, "longitude": null, "granularity": "national", "coverage_note": "National reference for Algeria. ARH lists uniform consumer prices across Algeria, including taxes.", "fuels": [{"fuel_type": "petrol", "price": 47, "currency": "DZD", "unit": "litre", "effective_date": "2026-11-18", "date_basis": "observation", "last_verified_at": "2026-11-18", "source_name": "Autorit\u00e9 de r\u00e9gulation des hydrocarbures (ARH)", "source_url": "https://www.arh.gov.dz/53/produits-petroliers", "confidence": "high", "price_kind": "official-national-retail", "notes": "Unleaded petrol consumer price observed on the regulator\u2019s table on 18 November. The table gives no effective date."}, {"fuel_type": "diesel", "price": 31, "currency": "DZD", "unit": "litre", "effective_date": "2026-11-18", "date_basis": "observation", "last_verified_at": "2026-11-18", "source_name": "Autorit\u00e9 de r\u00e9gulation des hydrocarbures (ARH)", "source_url": "https://www.arh.gov.dz/53/produits-petroliers", "confidence": "high", "price_kind": "official-national-retail", "notes": "Road diesel consumer price observed on the regulator\u2019s table on 18 November. The table gives no effective date."}], "manual_selection_only": true}]}, '2026-11-19T12:00:00Z')[0];
  assert.equal(algeria.petrol.observed_at,'2026-11-18');
  assert.equal(algeria.references.petrol.date_basis,'observation');
  assert.equal(algeria.petrol.usd,null);
  assert.equal(productDate(algeria,'lpg'),'2026-03-01');
  const original = snapshot.countries.find(r => r.code === 'ZW');
  const zw = rows.find(r => r.code === 'ZW');
  assert.equal(original.currency, 'ZWL');
  assert.equal(zw.currency, 'ZWG');
  for (const [type, price, usd, unit, observed] of [
    ['petrol',54.70,2.05,'liter','2026-10-08'],
    ['diesel',54.55,2.04,'liter','2026-10-08'],
    ['lpg',49.61,1.87,'kg','2026-11-10']
  ]) assert.deepEqual(zw[type], {price, usd, unit, observed_at:observed});
  assert.equal(zw.references.lpg.valid_to, '2026-11-30');
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
        if (dir === 'tools/fuel-tracker' && type === 'lpg' && ['KE','ZA'].includes(row.code)) {
          const reference = require('../data/fuel/household-lpg-references.json')[row.code];
          assert.ok(props.some(p => p.url === reference.url && p.description.includes(reference.period)));
          continue;
        }
        assert.ok(props.some(p => p.value === row[type].price), dir + '/' + slug + ':' + type);
        if (row.references) assert.ok(props.some(p => p.value === productDate(row,type)));
        const ref = row.references?.[type];
        if (ref) assert.ok(props.some(p => p.value === ref.source_url));
      }
    }
  }
});
