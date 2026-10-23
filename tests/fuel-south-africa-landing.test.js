const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/generate-fuel-tracker-country-pages.js'), 'utf8');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/fuel/latest.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(root, 'data/fuel/markets.json'), 'utf8'));
function generate(data) {
 const outputs = new Map();
 const inputs = new Map([[path.join(root,'data/fuel/latest.json'),JSON.stringify(snapshot)],[path.join(root,'data/fuel/markets.json'),JSON.stringify(data)]]);
 const guardedFS = {
  readFileSync(file) { assert.ok(inputs.has(file), `unexpected generator read: ${file}`); return inputs.get(file); },
  existsSync(file) { return fs.existsSync(file); },
  mkdirSync() {},
  writeFileSync(file, html) { assert.match(file.replaceAll('\\','/'), /\/tools\/fuel-tracker\/[a-z-]+\/index\.html$/); assert.equal(outputs.has(file),false); outputs.set(file,html); }
 };
 vm.runInNewContext(source,{__dirname:path.join(root,'scripts'),require(name){if(name==='fs')return guardedFS;if(name==='path')return path;throw Error(`Unexpected generator import ${name}`);},process:{argv:[]},console:{log(){},error(){throw Error('Generator reported error');}}},{filename:'generate-fuel-tracker-country-pages.js',timeout:3000});
 return outputs;
}
const route=path.join(root,'tools/fuel-tracker/south-africa/index.html');
const withoutZA={...markets,markets:markets.markets.filter(m=>m.market_id!=='za-gauteng-9c-petrol95-2026-10')};
test('Gauteng95 regional price and effective date precede the clearly labelled historical national snapshot',()=>{
 const html=generate(markets).get(route), regional=html.indexOf('id="regional-petrol-title"'), historical=html.indexOf('Historical national snapshot:');
 assert.ok(regional>html.indexOf('<h1>')); assert.ok(historical>regional); assert.match(html,/Gauteng zone 9C: 95 RON petrol/); assert.match(html,/ZAR 30\.25\/L/); assert.match(html,/effective Oct 7, 2026/);
 assert.match(html,/not a national price or a live station quote/); assert.match(html,/fuel-country-grid--with-reference/);
});
test('national petrol diesel LPG amounts and old row date remain visible without adopting the regional price',()=>{
 const html=generate(markets).get(route), old=generate(withoutZA).get(route);
 const prices=h=>h.match(/<div class="fuel-price-list">[\s\S]*?<div class="fuel-actions">/)[0]; assert.equal(prices(html),prices(old));
 assert.match(html,/Dataset row date: Mar 1, 2026/); assert.match(html,/ZAR 23\.74\/L/); assert.match(html,/Historical national snapshot below/);
});
test('the maintained card links to the official schedule and existing finder with an honest selection instruction',()=>{
 const html=generate(markets).get(route); assert.match(html,/href="https:\/\/www\.dmpr\.gov\.za\/API\/Evotiva-UserFiles\/FileActionsServices\/DownloadFile\?ItemId=3501&amp;ModuleId=2305&amp;TabId=154"/);
 assert.match(html,/href="\/tools\/fuel-tracker\/#fuel-finder">Calculate a Gauteng 95 RON fill/); assert.match(html,/Choose South Africa, then Gauteng zone 9C/); assert.doesNotMatch(html,/fuel-tracker\/\?country=/);
});
test('all other53 country outputs are byte-identical with and without the new regional reference',()=>{
 const current=generate(markets),old=generate(withoutZA);assert.equal(current.size,54);assert.equal(old.size,54);let unchanged=0;
 for(const [file,html] of current){if(file===route)continue;assert.equal(html,old.get(file),file);unchanged++;}assert.equal(unchanged,53);
});
test('missing or unsafe regional data falls back to the unchanged snapshot and generation is deterministic',()=>{
 const old=generate(withoutZA).get(route);const unsafe=JSON.parse(JSON.stringify(markets));const record=unsafe.markets.find(m=>m.market_id==='za-gauteng-9c-petrol95-2026-10').fuels[0];record.source_url='javascript:alert(1)';assert.equal(generate(unsafe).get(route),old);
 assert.deepEqual([...generate(markets)],[...generate(markets)]);assert.doesNotMatch(old,/id="regional-petrol-title"/);
});
