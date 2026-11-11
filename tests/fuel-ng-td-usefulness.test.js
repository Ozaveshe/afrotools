'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('../data/fuel/markets.json'),observations=require('../assets/js/lib/fuel-market-observations'),engine=require('../assets/js/engines/fuel-tracker-engine'),copy=require('../assets/js/lib/fuel-market-copy');
const now='2026-11-07T12:00:00Z';
test('Nigeria source update supplies weekly national planning values without overwriting outlet scope',()=>{
 const ng=data.markets.find(m=>m.market_id==='ng-national');
 assert.deepEqual(ng.fuels.map(r=>r.price),[1298,1810]);
 for(const r of ng.fuels){assert.equal(r.effective_date,'2026-11-02');assert.equal(r.price_kind,'weekly-national-benchmark');assert.equal(observations.status(r,now).available,true);assert.ok(r.previous_record);}
 const outlet=data.markets.find(m=>m.market_id==='ng-abuja-nnpc-observed');assert.equal(outlet.fuels[0].price,1405);assert.equal(outlet.granularity,'city');
 const stale={countries:[{code:'NG',name:'Nigeria',currency:'NGN',last_updated:'2026-08-10',source_url:'https://www.globalpetrolprices.com/Nigeria/gasoline_prices/',petrol:{price:1202.75,unit:'liter'},diesel:{price:1661,unit:'liter'}}]};
 assert.deepEqual(observations.merge(data.markets,stale,now).find(m=>m.market_id==='ng-national'),ng);
});
test('all eight September INSEED city averages retain their real period, locality and distinct fuels',()=>{
 const expected={"N'Djamena":[700,800],'Abéché':[770,870],Moundou:[740,840],Doba:[755,855],Sarh:[775,875],Mongo:[755,855],'Am-Timan':[1120,1288],Bol:[740,840]};
 const rows=data.markets.filter(m=>m.country_code==='TD');assert.equal(rows.length,8);assert.equal(engine.validateDataset(data).valid,true);
 for(const m of rows){assert.equal(m.granularity,'city');assert.deepEqual(m.fuels.map(r=>r.price),expected[m.locality_name]);assert.equal(typeof m.latitude,'number');assert.equal(typeof m.longitude,'number');assert.match(m.coordinate_source_url,/^https:\/\//);
  for(const r of m.fuels){assert.equal(r.currency,'XAF');assert.equal(r.period_start,'2026-09-01');assert.equal(r.period_end,'2026-09-30');assert.equal(r.effective_date,r.period_end);assert.equal(r.source_published_at,'2026-11-05');assert.equal(r.price_kind,'official-city-survey-average');const s=observations.status(r,now);assert.equal(s.basis,'period-average');assert.equal(s.ageDays,38);const c=observations.priceContext(m,r,s.basis);assert.equal(c.effectiveDate,null);assert.equal(c.observationDate,null);assert.equal(c.periodStart,r.period_start);assert.equal(c.periodEnd,r.period_end);}
 }
});
test('monthly evidence expires from its survey end and invalid periods cannot masquerade as fresh prices',()=>{
 const record=data.markets.find(m=>m.market_id==='td-ndjamena-inseed').fuels[0];
 assert.equal(observations.status({...record,last_verified_at:'2026-12-01'},'2026-12-01').basis,'historical-estimate');
 for(const change of [{period_start:'2026-10-01'},{period_end:'2026-11-05'},{source_published_at:'2026-09-01'},{source_published_at:'2026-11-08'},{period_start:null},{period_end:'2026-09-31'}])assert.equal(observations.status({...record,...change},now).valid,false,JSON.stringify(change));
});
test('a newer Chad national feed remains separate from all eight monthly city surveys',()=>{
 const cities=data.markets.filter(m=>m.country_code==='TD');
 const feed={countries:[{code:'TD',name:'Chad',currency:'XAF',last_updated:'2026-11-07',source_url:'https://example.test/chad-national',petrol:{price:900,unit:'liter',observed_at:'2026-11-06'}}]};
 const merged=observations.merge(cities,feed,now);assert.deepEqual(merged.filter(m=>m.granularity==='city'),cities);assert.equal(merged.filter(m=>m.granularity==='national').length,1);assert.equal(merged.find(m=>m.granularity==='national').fuels[0].price,900);
});

// Exercise the actual shipped controller, with deterministic DOM primitives and no provider/network calls.
async function visitor(locale='en',failLoads=false,asOf=now,search='',beforeLoad=null){
 class Element{constructor(tag='div'){this.tag=tag;this.dataset={};this.children=[];this.options=[];this.listeners={};this._value='';this.hidden=false;this.disabled=false;this.textContent='';}
  get value(){return this._value;}set value(v){this._value=String(v);}addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}fire(name,event={}){for(const fn of this.listeners[name]||[])fn.call(this,{preventDefault(){},...event});}replaceChildren(){this.children=[];this.options=[];if(this.tag==='select')this._value='';}appendChild(child){this.children.push(child);}add(option,at){if(at===undefined)this.options.push(option);else this.options.splice(at,0,option);if(!this._value)this._value=option.value;}focus(){}click(){this.fire('click');}}
 const nodes=new Map(),root=new Element();root.dataset.fuelMarketLocale=locale;root.querySelector=selector=>{const id=selector.slice(1);if(!nodes.has(id)){const e=new Element(['fuel-country','fuel-market'].includes(id)?'select':'div');e.id=id;nodes.set(id,e);}return nodes.get(id);};
 const get=id=>root.querySelector('#'+id);for(const [id,value] of Object.entries({'fuel-type':'petrol','fuel-fill-mode':'quantity','fuel-unit':'litre','fuel-quantity':'20','fuel-tank-size':'40','fuel-current-level':'25'}))get(id).value=value;
 let start,blob;const calls=[];const document={addEventListener(name,fn){if(name==='DOMContentLoaded')start=fn;},querySelector(){return root;},createElement:tag=>new Element(tag)};
 const window={location:{search},AfroTools:{FuelTrackerEngine:engine,FuelMarketCopy:copy,FuelMarketObservations:observations}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[asOf]));}}
 const fetch=async url=>{calls.push(url);if(failLoads)throw Error('offline');return{ok:true,json:async()=>url==='/data/fuel/markets.json'?data:{countries:[]}};};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/pages/fuel-tracker-vip.js'),'utf8'),{document,window,fetch,Date:Clock,Intl,URLSearchParams,Option:class{constructor(text,value){this.text=text;this.value=value;}},navigator:{geolocation:{getCurrentPosition(resolve){resolve({coords:{latitude:-26.2096,longitude:28.0462}});}}},AbortController,setTimeout,clearTimeout,Blob,URL:{createObjectURL(value){blob=value;return'blob:test';},revokeObjectURL(){}}});
 start();if(beforeLoad)beforeLoad({get,root});await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
 return {get,root,calls,report:()=>window.AfroTools.fuelFillReport(),download:async()=>{get('fuel-fill-txt').fire('click');return blob.text();}};
}
test('normal Nigeria visitor gets 20-litre budget and can replace benchmark with a real pump quote',async()=>{
 const v=await visitor();assert.equal(v.get('fuel-market').value,'ng-national');assert.equal(v.get('fuel-price').value,'1298');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,25960);assert.equal(v.report().market.priceKind,'weekly-national-benchmark');
 v.get('fuel-price').value='1350';v.get('fuel-fill-form').fire('input',{target:v.get('fuel-price')});assert.equal(v.report(),null);v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,27000);assert.equal(v.report().priceBasis,'manual');assert.equal(v.report().market,null);
});
test('Chad visitor can select every city, compare petrol and diesel, and keep period in TXT and JSON',async()=>{
 const v=await visitor('fr');v.get('fuel-country').value='TD';v.get('fuel-country').fire('change');assert.equal(v.get('fuel-market').options.length,8);
 for(const m of data.markets.filter(m=>m.country_code==='TD')){v.get('fuel-market').value=m.market_id;v.get('fuel-market').fire('change');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,m.fuels[0].price*20);assert.equal(v.report().market.periodStart,'2026-09-01');assert.equal(v.get('fuel-result-date-label').textContent,'Période de l’enquête');assert.match(v.get('fuel-result-effective').textContent,/2026-09-01.*2026-09-30/);assert.doesNotMatch(v.get('fuel-result-comparison').textContent,/Aucune/);}
 v.get('fuel-market').value='td-ndjamena-inseed';v.get('fuel-market').fire('change');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,14000);const txt=await v.download();assert.match(txt,/Période de l’enquête: 2026-09-01.*2026-09-30/);assert.match(txt,/INSEED/);assert.equal(v.report().market.effectiveDate,null);
 v.get('fuel-type').value='diesel';v.get('fuel-type').fire('change');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,16000);
});
test('missing feeds still leave manual fill planning usable',async()=>{const v=await visitor('sw',true);v.get('fuel-price').value='750';v.get('fuel-currency').value='XAF';v.get('fuel-fill-form').fire('input',{target:v.get('fuel-price')});v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,15000);assert.equal(v.report().priceBasis,'manual');assert.equal(v.report().market,null);assert.ok(v.calls.every(url=>['/api/fuel-prices','/data/fuel/markets.json','/data/fuel/latest.json'].includes(url)));});
test('aged city surveys require explicit planning choice and retain September period in result and exports',async()=>{
 const v=await visitor('fr',false,'2026-11-16T12:00:00Z');v.get('fuel-country').value='TD';v.get('fuel-country').fire('change');v.get('fuel-market').value='td-ndjamena-inseed';v.get('fuel-market').fire('change');
 assert.equal(v.get('fuel-price').value,'');assert.equal(v.get('fuel-use-history').hidden,false);assert.match(v.get('fuel-result-effective').textContent,/2026-09-01.*2026-09-30/);
 v.get('fuel-use-history').fire('click');v.get('fuel-fill-form').fire('submit');const report=v.report();assert.equal(report.calculation.totalCost,14000);assert.equal(report.priceBasis,'historical-estimate');assert.equal(report.market.periodStart,'2026-09-01');assert.equal(report.market.periodEnd,'2026-09-30');assert.equal(report.market.effectiveDate,null);
 const txt=await v.download();assert.match(txt,/Prix historique/);assert.match(txt,/Période de l’enquête: 2026-09-01.*2026-09-30/);assert.match(txt,/INSEED/);
});

test('November Gauteng and reported GOIL options lead to usable editable fill budgets while older rows stay historical',async()=>{
 const v=await visitor();v.get('fuel-country').value='ZA';v.get('fuel-country').fire('change');assert.equal(v.get('fuel-market').value,'za-gauteng-9c-petrol95-2026-11');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,604.8);assert.equal(v.report().market.validTo,'2026-12-01');
 v.get('fuel-country').value='GH';v.get('fuel-country').fire('change');assert.equal(v.get('fuel-market').value,'gh-goil-pumply-observed');v.get('fuel-fill-form').fire('submit');assert.ok(Math.abs(v.report().calculation.totalCost-332.8)<1e-8);assert.equal(v.report().market.sourceUrl,'https://pumply.co/brands/goil/');assert.equal(v.report().market.priceKind,'third-party-brand-observation');v.get('fuel-market').value='gh-goil-published-reference';v.get('fuel-market').fire('change');assert.equal(v.get('fuel-use-history').hidden,false);assert.equal(v.get('fuel-price').value,'');
});

test('explicit local matching picks the newest usable Gauteng reference at shared regional coordinates',async()=>{
 const v=await visitor();v.get('fuel-use-location').fire('click');assert.equal(v.get('fuel-country').value,'ZA');assert.equal(v.get('fuel-market').value,'za-gauteng-9c-petrol95-2026-11');assert.equal(v.get('fuel-price').value,'30.24');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,604.8);
 const later=await visitor('en',false,'2026-12-02T12:00:00Z');later.get('fuel-use-location').fire('click');assert.equal(later.get('fuel-market').value,'za-gauteng-9c-petrol95-2026-11');assert.equal(later.get('fuel-price').value,'');assert.equal(later.get('fuel-use-history').hidden,false);
});

test('a market continuation selects only the known reference once and later visitor choices win',async()=>{
 const v=await visitor('en',false,now,'?market=za-gauteng-9c-petrol95-2026-11');assert.equal(v.get('fuel-country').value,'ZA');assert.equal(v.get('fuel-market').value,'za-gauteng-9c-petrol95-2026-11');assert.equal(v.get('fuel-price').value,'30.24');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,604.8);
 v.get('fuel-country').value='GH';v.get('fuel-country').fire('change');assert.equal(v.get('fuel-market').value,'gh-goil-pumply-observed');v.get('fuel-price').value='17';v.get('fuel-fill-form').fire('input',{target:v.get('fuel-price')});v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,340);assert.equal(v.report().priceBasis,'manual');
});
test('unknown, malformed and ambiguous market identifiers fall back without location requests or price injection',async()=>{
 for(const search of ['?market=not-a-maintained-market','?market=%3Cscript%3E','?market=za-gauteng-9c-petrol95-2026-11&market=ng-national','?latitude=-26.2096&longitude=28.0462&price=1']){const v=await visitor('en',false,now,search);assert.equal(v.get('fuel-market').value,'ng-national');assert.equal(v.get('fuel-price').value,'1298');}
});
test('a manual price entered before loading is never replaced by the linked market',async()=>{
 const v=await visitor('en',false,now,'?market=za-gauteng-9c-petrol95-2026-11',({get,root})=>{get('fuel-price').value='31';get('fuel-currency').value='ZAR';get('fuel-fill-form').fire('input',{target:get('fuel-price')});root.fire('input');});assert.equal(v.get('fuel-price').value,'31');v.get('fuel-fill-form').fire('submit');assert.equal(v.report().calculation.totalCost,620);assert.equal(v.report().priceBasis,'manual');assert.equal(v.report().market,null);
});
