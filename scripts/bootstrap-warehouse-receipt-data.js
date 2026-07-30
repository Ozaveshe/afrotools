#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'agriculture/warehouse-receipt/index.html');
const JSON_FILE = path.join(ROOT, 'data/agriculture/warehouse-receipt-data.json');
const JS_FILE = path.join(ROOT, 'data/agriculture/warehouse-receipt-data.js');
function extract(source) {
  const countryStart = source.indexOf('var COUNTRIES = {');
  const commodityMarker = source.indexOf('// ── COMMODITY DATA', countryStart);
  const commodityStart = source.indexOf('var COMMODITIES = {', commodityMarker);
  const stateMarker = source.indexOf('// ── STATE', commodityStart);
  if ([countryStart, commodityMarker, commodityStart, stateMarker].some(index => index < 0)) throw new Error('Warehouse Receipt embedded data markers not found.');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source.slice(countryStart, commodityMarker)}\n${source.slice(commodityStart, stateMarker)}`, context);
  return { schemaVersion: 1, countries: JSON.parse(JSON.stringify(context.COUNTRIES)), commodities: JSON.parse(JSON.stringify(context.COMMODITIES)) };
}
function renderBrowser(data) {
  return `(function(root,factory){'use strict';var data=factory();if(typeof module==='object'&&module.exports)module.exports=data;if(root)root.WAREHOUSE_RECEIPT_DATA=data;}(typeof window!=='undefined'?window:globalThis,function(){return ${JSON.stringify(data, null, 2)};}));\n`;
}
function run() {
  const data = fs.existsSync(JSON_FILE) ? JSON.parse(fs.readFileSync(JSON_FILE, 'utf8')) : extract(fs.readFileSync(PAGE, 'utf8'));
  fs.mkdirSync(path.dirname(JSON_FILE), { recursive: true });
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(data, null, 2)}\n`);
  fs.writeFileSync(JS_FILE, renderBrowser(data));
  console.log(`Warehouse Receipt data owner: ${Object.keys(data.countries).length} countries, ${Object.keys(data.commodities).length} commodities`);
}
if (require.main === module) run();
module.exports = { extract, renderBrowser };
