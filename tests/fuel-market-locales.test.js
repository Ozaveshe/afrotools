'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const owner=require('../scripts/build-fuel-market-locales'),copy=require('../assets/js/lib/fuel-market-copy');
const normalize=require('../scripts/lib/shared-asset-references').normalizeBuildManagedHtml;
function comparable(html){return normalize(html).replace(/<script src="\/assets\/js\/engines\/fuel-tracker-engine\.js" defer><\/script>\s*/g,'').replace(/<link rel="stylesheet" href="\/assets\/css\/fuel-tracker-vip\.css">\s*/g,'');}
const engine=require('../assets/js/engines/fuel-tracker-engine');
test('three route owner is repeatable and preserves manual tools, SEO and machine keys',()=>{
 for(const [locale,file]of Object.entries(owner.routes)){
  const html=fs.readFileSync(file,'utf8'),built=owner.build(html,locale);assert.equal(comparable(built),comparable(html));assert.equal(owner.build(built,locale),built);
  for(const input of [html,built]){assert.equal((input.match(/<script src="\/assets\/js\/engines\/fuel-tracker-engine\.js(?:\?[^"]*)?" defer><\/script>/g)||[]).length,1);assert.equal((input.match(/<link rel="stylesheet" href="\/assets\/css\/fuel-tracker-vip\.css(?:\?[^"]*)?">/g)||[]).length,1);}
  const processed=html.replace(/\/assets\/js\/pages\/fuel-tracker-vip\.js(?:\?[^"]*)?"/g,'/assets/js/pages/fuel-tracker-vip.js?v=test"').replace(/\/assets\/css\/fuel-tracker-vip\.css(?:\?[^"]*)?"/g,'/assets/css/fuel-tracker-vip.css?v=test"');assert.equal(comparable(owner.build(processed,locale)),comparable(html));
  assert.equal((html.match(/id="fuel-country"/g)||[]).length,1);assert.match(html,/value="petrol"/);assert.match(html,/value="gallon"/);assert.match(html,/rel="canonical"/);assert.match(html,/hreflang="x-default"/);
  if(locale==='sw'){assert.match(html,/id="sw-fuel-form"/);assert.match(html,/value="LPG"/);assert.ok(html.indexOf('/assets/js/engines/fuel-tracker-engine.js')<html.indexOf('/assets/js/pages/sw-fuel-tracker.js'));}
  if(locale==='fr')assert.match(html,/\/engines\/fuel-engine.js/);
  for(const key of copy.keys)assert.ok(copy.get(locale,key).length);
 }
});
test('independent fill fixtures retain common EN arithmetic',()=>{
 assert.equal(engine.calculateFillCost({pricePerLitre:2,quantity:10}).totalCost,20);
 assert.ok(Math.abs(engine.calculateFillCost({pricePerLitre:2,quantity:2,unit:'gallon'}).totalCost-15.141647136)<1e-10);
 assert.equal(engine.calculateFillCost({pricePerLitre:2,mode:'tank',tankSize:40,currentLevelPct:25}).totalCost,60);
 assert.equal(engine.calculateFillCost({pricePerLitre:2,mode:'tank',tankSize:40,currentLevelPct:100}).totalCost,0);
});
