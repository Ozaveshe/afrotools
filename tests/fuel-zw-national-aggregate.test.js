'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { zimbabweAggregateRow, countryPageRows } = require('../scripts/lib/fuel-country-reference');
const { enrichFuelSourceMetadata } = require('../scripts/refresh-static-fallbacks');
const markets = require('../data/fuel/markets.json');
const legacy = {code:'ZW', name:'Zimbabwe', currency:'ZWL', last_updated:'2026-03-05',
  petrol:{price:10200,usd:1.5,unit:'liter'},diesel:{price:9800,usd:1.44,unit:'liter'},lpg:{price:13500,usd:1.99,unit:'kg'}};
const now = '2026-11-27T12:00:00Z';

test('keeps ZERA effective dates, quoted currencies, units and distinct RBZ weekly market', () => {
  const row = zimbabweAggregateRow(legacy, markets, now);
  assert.equal(row.currency,'ZWG'); assert.equal(row.official_verified,true);
  assert.deepEqual([row.petrol.price*20,row.diesel.price*20],[1094,1091]);
  assert.deepEqual([row.petrol.usd,row.diesel.usd,row.lpg.usd,row.lpg.price],[2.05,2.04,1.87,49.61]);
  assert.deepEqual([row.petrol.observed_at,row.diesel.observed_at,row.lpg.observed_at],['2026-10-08','2026-10-08','2026-11-10']);
  assert.equal(row.petrol.historical,true); assert.equal(row.lpg.valid_to,'2026-11-30');
  assert.equal(row.lpg.unit,'kg'); assert.ok(row.petrol.source_url.startsWith('https://')); assert.equal(row.petrol.change_pct,undefined);
  assert.deepEqual(zimbabweAggregateRow(row,markets,now),row);
  const page = countryPageRows({countries:[row]},markets,now)[0];
  assert.equal(page.weeklyMarketId,'zw-national-rbz-weekly'); assert.equal(page.references.petrol.date_basis,'effective');
});

test('preserves separate countries, newer existing data and legacy row when the local source is incomplete', () => {
  const newer = {...legacy,last_updated:'2026-11-25'};
  assert.equal(zimbabweAggregateRow(newer,markets,now),newer);
  const incomplete = {markets:markets.markets.map(m=>({...m,lpg_notice:null}))};
  assert.equal(zimbabweAggregateRow(legacy,incomplete,now),legacy);
  const other = {...legacy,code:'NG'}; assert.equal(zimbabweAggregateRow(other,markets,now),other);
});

test('scheduled primary and fallback, plus static enrichment, project the actual reviewed source', async () => {
  const file = require.resolve('../netlify/functions/scheduled-fetch-fuel-prices');
  const nativeRequire = createRequire(file);
  const seed = require('../data/fuel/latest.json');
  const previous = {countries:seed.countries.map(c => {
    if (c.code === 'ZW') return legacy;
    if (!['SL','GM'].includes(c.code)) return c;
    const fuel = {price:c.code === 'SL' ? 30 : 80, usd:1.13, unit:'liter'};
    return {...c, last_updated:'2026-03-08', petrol:{...fuel}, diesel:{...fuel}};
  })};
  const api = {};
  const calls = [];
  const context = vm.createContext({exports:api, require(id) {
    if (id === './_shared/data-store') return {getData:async key=>key==='fuel-latest'?previous:{rates:{ZWG:10, GMD:80, SLE:24}}};
    if (id === './_shared/scraper-base') return {runScraper:async conf=>conf, fetchWithRetry:async url=>{
      calls.push(url);
      if (!url.endsWith('/Ghana/gasoline_prices/')) throw Error('Test source unavailable');
      return {text:async()=>'<h1>Ghana Gasoline prices, liter, 26-Nov-2026</h1><table><tr><th>Ghana gasoline prices</th><th>Liter</th></tr><tr><td>GHS</td><td>14</td></tr><tr><td>USD</td><td>1.2</td></tr></table>'};
    }};
    return nativeRequire(id);
  }});
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
  const primary = await context.fetchFromGlobalPetrolPrices();
  const fallback = await context.fetchFromSeedWithForexUpdate();
  const stat = enrichFuelSourceMetadata(structuredClone(previous));
  for (const rows of [primary,fallback,stat.countries]) {
    const row = rows.find(c=>c.code==='ZW');assert.equal(row.petrol.price,54.7);assert.equal(row.diesel.usd,2.04);assert.equal(row.lpg.price,49.61);
  }
  for (const rows of [primary,fallback,stat.countries]) {
    for (const [code,petrol,diesel] of [['SL',40,45],['GM',109.8,120]]) {
      const row = rows.find(c => c.code === code);
      assert.deepEqual([row.petrol.price,row.diesel.price],[petrol,diesel]);
      assert.equal(row.petrol.usd,null);
      assert.equal(row.diesel.usd,null);
      assert.equal(row.diesel.date_basis,'effective');
      assert.deepEqual(row.lpg,previous.countries.find(c=>c.code===code).lpg);
    }
  }
  assert.equal(calls.some(url=>url.includes('/Zimbabwe/')),false);
  assert.equal(legacy.currency,'ZWL'); assert.ok(stat.official_verified_count>0); assert.equal(stat.source,'mixed');
});
