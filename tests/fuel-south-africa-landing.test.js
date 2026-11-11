const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/generate-fuel-tracker-country-pages.js'), 'utf8');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/fuel/latest.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(root, 'data/fuel/markets.json'), 'utf8'));
function generate(data, now='2026-11-07T12:00:00Z') {
 const Clock=class extends Date { constructor(...args){super(...(args.length?args:[now]));} };
 const outputs = new Map();
 const inputs = new Map([[path.join(root,'data/fuel/latest.json'),JSON.stringify(snapshot)],[path.join(root,'data/fuel/markets.json'),JSON.stringify(data)]]);
 const guardedFS = {
  readFileSync(file) { assert.ok(inputs.has(file), `unexpected generator read: ${file}`); return inputs.get(file); },
  existsSync(file) { return fs.existsSync(file); },
  mkdirSync() {},
  writeFileSync(file, html) { assert.match(file.replaceAll('\\','/'), /\/tools\/fuel-tracker\/[a-z-]+\/index\.html$/); assert.equal(outputs.has(file),false); outputs.set(file,html); }
 };
 vm.runInNewContext(source,{Date:Clock,__dirname:path.join(root,'scripts'),require(name){if(name==='fs')return guardedFS;if(name==='path')return path;throw Error(`Unexpected generator import ${name}`);},process:{argv:[]},console:{log(){},error(){throw Error('Generator reported error');}}},{filename:'generate-fuel-tracker-country-pages.js',timeout:3000});
 return outputs;
}
const route=path.join(root,'tools/fuel-tracker/south-africa/index.html');
const withoutZA={...markets,markets:markets.markets.filter(m=>!m.market_id.startsWith('za-gauteng-9c-petrol95-'))};
test('Gauteng95 regional price and effective date precede the clearly labelled historical national snapshot',()=>{
 const html=generate(markets).get(route), regional=html.indexOf('id="regional-petrol-title"'), historical=html.indexOf('Historical national snapshot:');
 assert.ok(regional>html.indexOf('<h1>')); assert.ok(historical>regional); assert.match(html,/Gauteng zone 9C: 95 RON petrol/); assert.match(html,/ZAR 30\.24\/L/); assert.match(html,/effective Nov 4, 2026/);
 assert.match(html,/not a national price or a live station quote/); assert.match(html,/fuel-country-grid--with-reference/);
});
test('national petrol diesel LPG amounts and old row date remain visible without adopting the regional price',()=>{
 const html=generate(markets).get(route), old=generate(withoutZA).get(route);
 const prices=h=>h.match(/<div class="fuel-price-list">[\s\S]*?<div class="fuel-actions">/)[0]; assert.equal(prices(html),prices(old));
 assert.match(html,/Dataset row date: Mar 1, 2026/); assert.match(html,/ZAR 23\.74\/L/); assert.match(html,/Historical national snapshot below/);
});
test('the maintained card links to the official schedule and existing finder with an honest selection instruction',()=>{
 const html=generate(markets).get(route); assert.match(html,/href="https:\/\/cefgroup\.co\.za\/wp-content\/uploads\/2026\/11\/Press-Release-30-October-2026-Change-04-November-2026\.pdf"/);
 assert.match(html,/href="\/tools\/fuel-tracker\/\?market=za-gauteng-9c-petrol95-2026-11#fuel-finder">Calculate a Gauteng 95 RON fill/); assert.match(html,/Choose South Africa, then Gauteng zone 9C/); assert.doesNotMatch(html,/fuel-tracker\/\?country=/);
});
test('all other53 country outputs are byte-identical with and without the new regional reference',()=>{
 const current=generate(markets),old=generate(withoutZA);assert.equal(current.size,54);assert.equal(old.size,54);let unchanged=0;
 for(const [file,html] of current){if(file===route)continue;assert.equal(html,old.get(file),file);unchanged++;}assert.equal(unchanged,53);
});
test('missing or unsafe regional data falls back to the unchanged snapshot and generation is deterministic',()=>{
 const old=generate(withoutZA).get(route);const unsafe=JSON.parse(JSON.stringify(markets));for(const m of unsafe.markets.filter(m=>m.market_id.startsWith('za-gauteng-9c-petrol95-')))m.fuels[0].source_url='javascript:alert(1)';assert.equal(generate(unsafe).get(route),old);
 assert.deepEqual([...generate(markets)],[...generate(markets)]);assert.doesNotMatch(old,/id="regional-petrol-title"/);
});

test('November landing uses the published period while expired October remains an editable historical fallback',()=>{
 const current=generate(markets).get(route);assert.match(current,/ZAR 30\.24\/L/);assert.match(current,/period ends Dec 1, 2026/);assert.doesNotMatch(current,/Historical regional reference/);assert.match(current,/enter the price available at your pump/);
 const octoberOnly={...markets,markets:markets.markets.filter(m=>m.market_id!=='za-gauteng-9c-petrol95-2026-11')};const old=generate(octoberOnly).get(route);assert.match(old,/Historical regional reference — planning only/);assert.match(old,/ZAR 30\.25\/L/);assert.match(old,/period ends Nov 3, 2026/);assert.match(old,/explicitly choose this historical price for planning/);
 const expired=generate(markets,'2026-12-02T00:00:00Z').get(route);assert.match(expired,/Historical regional reference — planning only/);assert.match(expired,/ZAR 30\.24\/L/);
});

test('Gauteng continuations preserve the exact market and clearly separate the old national generator example',()=>{
 const html=generate(markets).get(route);assert.match(html,/<h2 id="generator-estimate">Historical national generator estimate<\/h2>/);assert.match(html,/national snapshot dated Mar 1, 2026 at ZAR 23\.74\/L, not the Gauteng regional price above/);assert.match(html,/Historical monthly estimate/);assert.match(html,/Historical national price basis/);assert.match(html,/Assumes 1\.5 litres per hour/);assert.match(html,/href="\/tools\/fuel-tracker\/\?market=za-gauteng-9c-petrol95-2026-11#fuel-finder">Calculate a Gauteng fill with an editable price/);
 const old=generate({...markets,markets:markets.markets.filter(m=>m.market_id!=='za-gauteng-9c-petrol95-2026-11')}).get(route);assert.match(old,/\?market=za-gauteng-9c-petrol95-2026-10#fuel-finder/);
});
