'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const engine=require('../engines/src/architectural-fee-engine.js');
const root=path.resolve(__dirname,'..');
function input(overrides){return Object.assign({country:'KE',currency:'KES',projectType:'commercial_medium',area:200,constructionValue:10000000,minRate:5,typicalRate:7,maxRate:9,scope:'concept',scopeShare:50,practice:'small_firm',practiceAdjustment:10,disbursements:100000,taxPct:10,scopeNotes:'Concept options and two revisions',exclusions:'Approval fees and engineering',phaseWeights:{inception:5,concept:15,development:20,technical:25,approval:10,documentation:10,administration:15},assumptionsConfirmed:true,localVerificationConfirmed:true},overrides||{});}

test('transparent user-entered range formula returns exact low, typical and high totals',()=>{
  const result=engine.calculate(input());
  assert.deepEqual(result.effectiveRates,{min:2.75,typical:3.8500000000000005,max:4.95});
  assert.equal(result.range.min.total,412500);
  assert.equal(result.range.typical.total,533500.0000000001);
  assert.equal(result.range.max.total,654500);
  assert.equal(result.phases[0].amount,19250.000000000004);
  assert.equal(result.feePerArea,2667.5000000000005);
  assert.equal(result.basisStatus,'user-entered-low-confidence');
  assert.equal(result.officialStatus,'planning-estimate-not-regulator-scale-or-quote');
});

test('all ten original countries plus Other, eight projects, four scopes, practices and seven stages remain supported',()=>{
  assert.deepEqual(Object.keys(engine.COUNTRIES),['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA','OTHER']);
  assert.equal(engine.PROJECTS.length,8);
  assert.deepEqual(engine.SCOPES,['full','concept','working_drawings','approval']);
  assert.deepEqual(engine.PRACTICES,['sole','small_firm','large_firm','other']);
  assert.equal(engine.STAGES.length,7);
});

test('invalid rate order, stage total and missing confirmation fail closed',()=>{
  assert.throws(()=>engine.calculate(input({minRate:10,typicalRate:7,maxRate:9})),/ordered minimum/);
  assert.throws(()=>engine.calculate(input({phaseWeights:Object.assign({},input().phaseWeights,{inception:6})})),/total 100/);
  assert.throws(()=>engine.calculate(input({assumptionsConfirmed:false})),/Confirm that the rates/);
});

test('country selection supplies no fee, cost-per-area or regulator scale',()=>{
  for(const country of Object.values(engine.COUNTRIES)){
    assert.deepEqual(Object.keys(country).sort(),['currency','name']);
  }
  const source=fs.readFileSync(path.join(root,'engines/src/architectural-fee-engine.js'),'utf8');
  assert.doesNotMatch(source,/cost_per_m2|\bNIA\b|\bSACAP\b|AIA Kenya|fee scale set by|fees:\s*\{/i);
});

test('English and Swahili owners expose the same full local workflow',()=>{
  const en=fs.readFileSync(path.join(root,'tools/architectural-fee/index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw/zana/ada-za-ramani-za-usanifu/index.html'),'utf8');
  for(const html of [en,sw]){
    for(const name of ['country','currency','projectType','area','constructionValue','minRate','typicalRate','maxRate','scope','scopeShare','practice','practiceAdjustment','disbursements','taxPct','scopeNotes','exclusions','assumptionsConfirmed','localVerificationConfirmed'])assert.match(html,new RegExp(`name="${name}"`));
    for(const stage of engine.STAGES)assert.match(html,new RegExp(`name="phase-${stage.id}"`));
    for(const action of ['reset','save','load','import','copy','json','csv','txt','pdf'])assert.match(html,new RegExp(`data-action="${action}"`));
    assert.match(html,/engines\/architectural-fee-engine\.js/);
    assert.match(html,/assets\/img\/tools\/architectural-fee\.webp/);
    assert.doesNotMatch(html,/calcArchFee|cost_per_m2|data-sw-build-form|data-df-upgrade|official fee scales|NIA Scale|AIA Kenya Scale|SACAP Scale/i);
  }
  assert.ok(fs.statSync(path.join(root,'assets/img/tools/architectural-fee.webp')).size>1000);
});

test('canonical, artwork, schema and reciprocal hreflang ownership are exact',()=>{
  const owners={en:fs.readFileSync(path.join(root,'tools/architectural-fee/index.html'),'utf8'),fr:fs.readFileSync(path.join(root,'fr/tools/honoraires-architecte/index.html'),'utf8'),sw:fs.readFileSync(path.join(root,'sw/zana/ada-za-ramani-za-usanifu/index.html'),'utf8')};
  const routes={en:'https://afrotools.com/tools/architectural-fee/',fr:'https://afrotools.com/fr/tools/honoraires-architecte/',sw:'https://afrotools.com/sw/zana/ada-za-ramani-za-usanifu/'};
  for(const [lang,html] of Object.entries(owners)){assert.ok(html.includes(`rel="canonical" href="${routes[lang]}"`));for(const [alternate,route] of Object.entries(routes))assert.ok(html.includes(`hreflang="${alternate}" href="${route}"`));}
  assert.match(owners.en,/"@type":"FAQPage"/);assert.match(owners.sw,/"@type":"FAQPage"/);
});

test('source owner is deterministic',()=>{
  const files=['tools/architectural-fee/index.html','sw/zana/ada-za-ramani-za-usanifu/index.html'];
  const before=files.map(file=>fs.readFileSync(path.join(root,file),'utf8'));
  delete require.cache[require.resolve('../scripts/build-sw-architectural-fee.js')];require('../scripts/build-sw-architectural-fee.js');
  files.forEach((file,index)=>assert.equal(fs.readFileSync(path.join(root,file),'utf8'),before[index]));
});
