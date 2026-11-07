'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module');
const ROOT=process.env.NAV_SCHEMA_ROOT||path.resolve(__dirname,'..');
function schemas(html){return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{const n=JSON.parse(m[1]);return Array.isArray(n)?n:n['@graph']||[n];});}
function creative(root){const file=path.join(root,'scripts/build-fr-creative-hub.js');const source=fs.readFileSync(file,'utf8').replace(/try \{\s*main\(\);[\s\S]*$/,'module.exports={render};');const module={exports:{}};vm.runInNewContext(source,{require:createRequire(file),module,__dirname:path.dirname(file),process:{argv:[]},console});return module.exports.render();}
function hubs(root){const fr=require(path.join(root,'scripts/build-fr-sports-parity.js'));const sw=require(path.join(root,'scripts/build-sw-sports-travel-parity.js'));return [creative(root),fr.renderHub(),sw.renderSportsHub(),sw.renderTravelHub()];}
test('native Swahili breadcrumbs preserve useful destinations without invalid list language',()=>{
 for(const file of ['sw/benin/kikokotoo-vat/index.html','sw/zana/mzigo-wa-masomo/index.html','sw/zana/uwiano-wa-kiuno-na-nyonga/index.html']){
 const html=fs.readFileSync(path.join(ROOT,file),'utf8'),nodes=schemas(html),crumb=nodes.find(n=>n['@type']==='BreadcrumbList');
 assert.ok(crumb);assert.equal(Object.hasOwn(crumb,'inLanguage'),false);
 assert.deepEqual(crumb.itemListElement.map(x=>x.position),[1,2,3]);
 assert.ok(crumb.itemListElement.every(x=>x.name&&x.item.startsWith('https://afrotools.com/sw/')));
 assert.ok(nodes.some(n=>n['@type']==='WebApplication'&&n.inLanguage==='sw'));
 if(process.env.NAV_SCHEMA_BEFORE_ROOT){const before=fs.readFileSync(path.join(process.env.NAV_SCHEMA_BEFORE_ROOT,file),'utf8');const prior=schemas(before);delete prior.find(n=>n['@type']==='BreadcrumbList').inLanguage;assert.deepEqual(nodes,prior);const strip=s=>s.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');assert.equal(strip(html),strip(before));}
 }
});
test('actual four hub renderers preserve named destinations and visible navigation',()=>{
 const output=hubs(ROOT);const counts=[46,15,15,9];
 for(let i=0;i<output.length;i++){const html=output[i],list=schemas(html).find(n=>n['@type']==='ItemList');
 assert.ok(list);assert.equal(Object.hasOwn(list,'inLanguage'),false);assert.equal(list.itemListElement.length,counts[i]);
 list.itemListElement.forEach((item,index)=>{assert.equal(item.position,index+1);assert.ok(item.name);assert.ok(item.url);assert.equal(Object.hasOwn(item,'item'),false);const route=new URL(item.url).pathname;assert.ok(html.includes('href="'+route+'"')||html.includes("href='"+route+"'"),route);});
 assert.match(html,/<html lang=["'](?:fr|sw)["']/);
 }
 if(process.env.NAV_SCHEMA_BEFORE_ROOT){const prior=hubs(process.env.NAV_SCHEMA_BEFORE_ROOT);for(let i=0;i<output.length;i++){const strip=html=>html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');assert.equal(strip(output[i]),strip(prior[i]));const expected=schemas(prior[i]);delete expected.find(n=>n['@type']==='ItemList').inLanguage;assert.deepEqual(schemas(output[i]),expected);}}
});
