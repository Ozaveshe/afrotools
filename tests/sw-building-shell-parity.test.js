'use strict';

const assert=require('node:assert/strict');const {execFileSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const test=require('node:test');
const root=path.resolve(__dirname,'..');const manifest=require('../data/localization/sw-building-shell-parity-manifest.json');const inventory=require('../reports/swahili-free-app-parity-inventory.json');
const engines={'scaffolding-calc':require('../engines/src/scaffolding-engine.js'),'window-door-sizing':require('../engines/src/window-door-sizing-engine.js')};
function read(relative){return fs.readFileSync(path.join(root,relative),'utf8');}
function close(actual,expected,label){assert.ok(Math.abs(actual-expected)<=Math.max(1e-9,Math.abs(expected)*1e-12),`${label}: expected ${expected}, got ${actual}`);}
function finite(value){if(typeof value==='number')return Number.isFinite(value);if(!value||typeof value!=='object')return true;return Object.values(value).every(finite);}
function schemaTypes(html){return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),match=>JSON.parse(match[1])['@type']);}
function visibleText(html){return html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<code\b[\s\S]*?<\/code>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');}

test('manifest owns exactly the two coordinator-accepted Engineering building-shell rows',()=>{
  assert.equal(manifest.coordinatorBase,'8354e321ff34caf60a33a3393cd0dcddfb00c023');assert.equal(manifest.scopeCount,2);assert.deepEqual(manifest.apps.map(app=>app.id),['scaffolding-calc','window-door-sizing']);
  for(const app of manifest.apps){const row=inventory.rows.find(candidate=>candidate.englishId===app.id);assert.ok(row);assert.equal(row.categoryKey,'engineering');assert.equal(row.state,'native-candidate');assert.equal(row.accepted,true);assert.equal(row.englishRoute+'/',app.englishRoute);}
});

test('maintained source/public engines satisfy exact primary, boundary and invalid oracles without NaN',()=>{
  for(const app of manifest.apps){for(const [owner,engine] of [['source',engines[app.id]],['public',require('../'+app.enginePublic.replace(/^\//,''))]]){for(const oracleName of ['oracle','boundaryOracle']){const oracle=app[oracleName],report=engine.calculate(oracle.inputs);assert.equal(report.ok,true,`${app.id} ${owner} ${oracleName}`);assert.equal(finite(report),true);for(const [key,expected] of Object.entries(oracle.expected)){if(typeof expected==='boolean')assert.equal(report[key],expected);else close(report[key],expected,`${app.id}.${owner}.${oracleName}.${key}`);}}}}
  const windowReport=engines['window-door-sizing'].calculate(manifest.apps[1].oracle.inputs);assert.deepEqual(windowReport.schedule.map(({kind,material,type,qty,size,unitCost,total})=>({kind,material,type,qty,size,unitCost,total})),[
    {kind:'window',material:'aluminium',type:'louvre',qty:12,size:'600×1200mm',unitCost:400000,total:4800000},
    {kind:'external-door',material:'timber_solid',type:undefined,qty:2,size:'900×2100mm',unitCost:740000,total:1480000},
    {kind:'internal-door',material:'panel_timber',type:undefined,qty:5,size:'820×2100mm',unitCost:345000,total:1725000},
    {kind:'hardware',material:undefined,type:undefined,qty:1,size:'Lump sum',unitCost:960600,total:960600}
  ]);
  assert.equal(engines['scaffolding-calc'].calculate({...manifest.apps[0].oracle.inputs,perimeter:0}).ok,false);assert.equal(engines['window-door-sizing'].calculate({...manifest.apps[1].oracle.inputs,rooms:0}).ok,false);
});

test('scaffolding zero owner states are explicitly unavailable rather than free market-price results',()=>{
  const scaffold=manifest.apps[0],engine=engines['scaffolding-calc'],source=read('assets/js/pages/sw-building-shell-parity.js');
  for(const unavailable of scaffold.unavailableOracles){const raw=engine.calculate(unavailable.inputs);assert.equal(raw.ok,true);assert.equal(raw.materialCost,0,`${unavailable.reason} owner hazard fixture`);}
  assert.match(source,/current\.mode === 'buy'[\s\S]*Kiwango cha kununua mianzi hakipatikani/);assert.match(source,/bamboo_rent_wk\) \|\| rate\.bamboo_rent_wk <= 0[\s\S]*Hii si bei ya sifuri/);assert.match(source,/ownerError[\s\S]*setActions\(false\)/);
});

test('source generator is current and native product surfaces retain fields, results and translated schedules',()=>{
  execFileSync(process.execPath,['scripts/generate-sw-building-shell-parity.js','--check'],{cwd:root,stdio:'pipe'});const generator=read('scripts/generate-sw-building-shell-parity.js');assert.doesNotMatch(generator,/RATES\s*=|WINDOW_AREAS\s*=|tube_rent_wk\s*:/);
  for(const app of manifest.apps){const html=read(app.swFile);assert.match(html,new RegExp(`data-shell-tool="${app.id}"`));assert.match(html,new RegExp(`<script src="${app.enginePublic.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:\\?v=[a-f0-9]{8})?"`));assert.doesNotMatch(html,/<iframe\b|fetch\(|XMLHttpRequest/i);assert.match(html,/data-shell-export="copy" disabled/);assert.match(html,/data-shell-export="json" disabled/);assert.match(html,/data-shell-export="txt" disabled/);}
  const scaffold=read(manifest.apps[0].swFile),windows=read(manifest.apps[1].swFile);for(const field of ['country','perimeter','height','type','mode','weeks','includeLabour'])assert.match(scaffold,new RegExp(`(?:id|name)="${field}"`));for(const field of ['country','buildingType','rooms','roomArea','externalDoors','internalDoors','windowMaterial','windowType','externalMaterial','internalMaterial'])assert.match(windows,new RegExp(`(?:id|name)="${field}"`));
  const text=visibleText(scaffold+windows);assert.doesNotMatch(text,/\b(?:scaffolding|tubes?|boards?|couplers?|rent|buy|weeks?|windows?|doors?|casement|louvre|sliding|fixed|fibreglass|steel|timber|hardware|Lump sum)\b/i);assert.match(text,/Jumla ya mkupuo|Ratiba/);
});

test('canonical, OG, artwork, reciprocal hreflang and three schema types are complete',()=>{
  for(const app of manifest.apps){const html=read(app.swFile),canonical=`https://afrotools.com${app.swRoute}`;assert.match(html,new RegExp(`<link rel="canonical" href="${canonical}"`));assert.match(html,new RegExp(`<meta property="og:url" content="${canonical}"`));assert.match(html,new RegExp(`<img class="sw-shell-art"[^>]+width="${app.imageWidth}" height="${app.imageHeight}"`));assert.deepEqual(schemaTypes(html).sort(),['BreadcrumbList','FAQPage','WebApplication']);for(const [language,route] of [['en',app.englishRoute],['fr',app.frenchRoute],['sw',app.swRoute]])assert.match(html,new RegExp(`hreflang="${language}" href="https://afrotools.com${route}"`));for(const owner of [app.englishFile,app.frenchFile])assert.match(read(owner),new RegExp(`hreflang="sw" href="${canonical}"`));}
});

test('shared controller is lifecycle/export-only, local and translation-safe',()=>{
  const source=read('assets/js/pages/sw-building-shell-parity.js');assert.match(source,/latest = null; panel\.hidden = true; breakdown\.innerHTML = ''; setActions\(false\)/);assert.match(source,/form\.addEventListener\('input'.*clear/);assert.match(source,/form\.addEventListener\('change'.*clear/);assert.match(source,/!report\|\|!report\.ok\|\|!finite\(report\)/);assert.match(source,/navigator\.clipboard[\s\S]*fallbackCopy/);assert.match(source,/document\.execCommand\('copy'\)/);assert.match(source,/JSON\.stringify\(latest,null,2\)/);assert.match(source,/restore\(JSON\.parse\(text\)\)/);assert.match(source,/size === 'Lump sum' \? 'Jumla ya mkupuo'/);assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
  for(const app of manifest.apps){const html=read(app.swFile);assert.match(html,new RegExp(`href="/sw/ai/\\?tool=${app.id}"`));assert.match(html,/aria-disabled="true" tabindex="-1"/);assert.match(html,/Dhana tuli za kupanga; hakuna bei hai au dai rasmi/);}
});

test('manifest keeps the immutable coordinator base and every declared physical owner',()=>{
  assert.equal(manifest.coordinatorBase,'8354e321ff34caf60a33a3393cd0dcddfb00c023');
  for(const app of manifest.apps){
    for(const owner of [app.swFile,app.englishFile,app.frenchFile]) assert.equal(fs.existsSync(path.join(root,owner)),true,owner);
  }
});
