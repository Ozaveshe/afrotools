'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/components/command-palette.js'), 'utf8');
function palette(locale, fetcher) {
  const context = vm.createContext({window: {__AFRO_NAV_ITEMS: [{label:'Energy',tools:[{label:'Generator Fuel Cost',href:'/tools/generator-fuel/'}]}]}, location:{pathname:locale}, fetch:fetcher, Set, Error});
  const start=source.indexOf('var e,t,r,o=null;'), end=source.indexOf('var n=!1,c=-1;');
  assert.ok(start>=0 && end>start, 'Maintained palette search owner exists');
  return vm.runInContext('var n=false;'+source.slice(start,end)+';({load:loadCatalog,search:i,state:()=>catalogState})',context);
}
const rows=[['AfroFuel — Local Fuel Price Finder','/tools/fuel-tracker/',13,95],['Pharmacy Prices','/tools/pharmacy-prices/',1,50],['Bei za Mafuta','/sw/zana/bei-za-mafuta/',13,95],['Unsafe','//outside.example/',0,1],['Unsafe entity','/&#47;outside.example/',0,1],['Unsafe control','/\\outside.example/',0,1]];
test('A visitor asking for fuel prices finds the actual finder, not unrelated prices',async()=>{let calls=0;const app=palette('/',async()=>{calls++;return {ok:true,json:async()=>rows}});await Promise.all([app.load(),app.load()]);assert.equal(calls,1);assert.deepEqual(Array.from(app.search('fuel prices',12),r=>r.href),['/tools/fuel-tracker/']);assert.equal(app.search('generator fuel',12)[0].href,'/tools/generator-fuel/');assert.equal(app.search('Unsafe',12).length,0)});
test('Catalogue discovery respects the page language',async()=>{const app=palette('/sw/zana/example/',async()=>({ok:true,json:async()=>rows}));await app.load();assert.equal(app.search('mafuta',12)[0].href,'/sw/zana/bei-za-mafuta/');assert.equal(app.search('AfroFuel',12).length,0)});
test('A failed catalogue remains usable and can recover on the next open',async()=>{let calls=0;const app=palette('/',async()=>++calls===1?{ok:false}:{ok:true,json:async()=>rows});await app.load();assert.equal(app.state(),'failed');assert.equal(app.search('generator',12)[0].href,'/tools/generator-fuel/');await app.load();assert.equal(app.state(),'ready');assert.equal(app.search('fuel prices',12)[0].href,'/tools/fuel-tracker/')});
