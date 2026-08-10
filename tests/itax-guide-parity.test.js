'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const engine=require('../engines/src/itax-guide-engine.js');
const root=path.resolve(__dirname,'..');
function input(overrides){return Object.assign({task:'return',context:'resident-individual',obligation:'income-individual',filingYear:2025,asOfDate:'2026-08-09',factsConfirmed:true,privacyConfirmed:true,receiptPlanConfirmed:true,noIncomeConfirmed:false,currentSourceConfirmed:false},overrides||{});}

test('return preparation uses an official route without claiming filing',()=>{
  const plan=engine.calculate(input());
  assert.equal(plan.decision,'prepare-and-open-official-route');
  assert.equal(plan.checklist.length,4);
  assert.equal(plan.officialUrl,'https://www.kra.go.ke/file-my-returns');
  assert.match(plan.privacy,/No credentials/);
});

test('NIL decisions fail closed for unknown, PWO and unconfirmed income facts',()=>{
  assert.equal(engine.calculate(input({task:'nil',obligation:'unknown'})).decision,'stop-and-confirm');
  assert.match(engine.calculate(input({task:'nil',obligation:'pwo-none'})).stopReasons.join(' '),/no filing obligation/);
  assert.match(engine.calculate(input({task:'nil'})).stopReasons.join(' '),/not been confirmed/);
  assert.equal(engine.calculate(input({task:'nil',noIncomeConfirmed:true})).decision,'prepare-and-open-official-route');
});

test('source review expires after 90 days unless the official pages are reconfirmed',()=>{
  assert.throws(()=>engine.calculate(input({asOfDate:'2026-12-01'})),/older than 90 days/);
  assert.equal(engine.calculate(input({asOfDate:'2026-12-01',currentSourceConfirmed:true})).sourceStatus,'user-reconfirmed-after-review-window');
});

test('English and Swahili owners expose the same private local workflow',()=>{
  const en=fs.readFileSync(path.join(root,'tools/itax-guide/index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw/zana/mwongozo-wa-itax/index.html'),'utf8');
  for(const html of [en,sw]){
    for(const name of ['task','context','obligation','filingYear','asOfDate','factsConfirmed','privacyConfirmed','receiptPlanConfirmed','noIncomeConfirmed','currentSourceConfirmed'])assert.match(html,new RegExp(`name="${name}"`));
    for(const action of ['reset','save','load','import','copy','json','txt','pdf'])assert.match(html,new RegExp(`data-action="${action}"`));
    assert.match(html,/engines\/itax-guide-engine\.js/);
    assert.match(html,/assets\/img\/og-default\.png/);
    assert.doesNotMatch(html,/<iframe|name="(?:pin|password|otp|income|taxRecord)"/i);
  }
  assert.ok(fs.statSync(path.join(root,'assets/img/og-default.png')).size>1000);
});

test('route, source registry and reciprocal hreflang ownership are exact',()=>{
  const en=fs.readFileSync(path.join(root,'tools/itax-guide/index.html'),'utf8');
  const fr=fs.readFileSync(path.join(root,'fr/tools/guide-d-itax-de-la-kra/index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw/zana/mwongozo-wa-itax/index.html'),'utf8');
  const target='https://afrotools.com/sw/zana/mwongozo-wa-itax/';
  assert.ok(en.includes(target)&&fr.includes(target));
  assert.match(sw,/rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/mwongozo-wa-itax\/"/);
  assert.match(sw,/hreflang="en" href="https:\/\/afrotools\.com\/tools\/itax-guide\/"/);
  const registry=JSON.parse(fs.readFileSync(path.join(root,'data/source-registry.json'),'utf8'));
  const source=registry.sources.find(row=>row.id==='kra-itax-guide-source');
  assert.equal(source.lastCheckedAt,'2026-08-09');
  assert.ok(source.routes.includes('/sw/zana/mwongozo-wa-itax'));

  const toolRegistry=fs.readFileSync(path.join(root,'assets/js/components/tool-registry.js'),'utf8');
  const ownerRows=toolRegistry.split(/\r?\n/).filter(line=>line.includes("id: 'itax-guide-sw'"));
  assert.equal(ownerRows.length,1,'Swahili iTax has exactly one registry owner');
  assert.ok(ownerRows[0].includes("href: '/sw/zana/mwongozo-wa-itax/'"));
  assert.ok(ownerRows[0].includes("sourceId: 'itax-guide'"));
  assert.ok(ownerRows[0].includes('image: false'));
  const hub=fs.readFileSync(path.join(root,'sw/biashara-na-uzingatiaji/index.html'),'utf8');
  assert.equal((hub.match(/href="\/sw\/zana\/mwongozo-wa-itax\/"/g)||[]).length,1,'business and compliance hub discovers the route exactly once');
});

test('official-source pack contains the current filing and PIN Without Obligation pages',()=>{
  const verification=JSON.parse(fs.readFileSync(path.join(root,'data/tool-verification.json'),'utf8')).tools['itax-guide'];
  assert.equal(verification.last_verified,'2026-08-09');
  assert.ok(verification.source_urls.includes('https://www.kra.go.ke/file-my-returns'));
  assert.ok(verification.source_urls.includes('https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin'));
  assert.match(verification.law_or_version,/PIN Without Obligation/);
});

test('source owner is current and deterministic',()=>{
  const files=['tools/itax-guide/index.html','fr/tools/guide-d-itax-de-la-kra/index.html','sw/zana/mwongozo-wa-itax/index.html'];
  const before=files.map(file=>fs.readFileSync(path.join(root,file),'utf8'));
  delete require.cache[require.resolve('../scripts/build-sw-itax-guide.js')];
  require('../scripts/build-sw-itax-guide.js');
  files.forEach((file,index)=>assert.equal(fs.readFileSync(path.join(root,file),'utf8'),before[index]));
});
