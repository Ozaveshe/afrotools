'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const canonical=require('../scripts/lib/canonical-aliases');
const policyApi=require('../scripts/lib/static-owner-policy');
const actualPolicy=JSON.parse(fs.readFileSync(path.join(ROOT,'data/registry/route-policy.json'),'utf8'));
function discover(files,policy){
  const directories=new Map([['',new Map()]]);
  for(const file of Object.keys(files)){
    const parts=file.split('/');
    parts.forEach((name,i)=>{const parent=parts.slice(0,i).join('/'),child=parts.slice(0,i+1).join('/');if(!directories.has(parent))directories.set(parent,new Map());directories.get(parent).set(name,i<parts.length-1);if(i<parts.length-1&&!directories.has(child))directories.set(child,new Map());});
  }
  const relative=file=>path.relative(ROOT,file).replaceAll('\\','/');
  const fakeFs={
    readFileSync:file=>{const value=files[relative(file)];if(value===undefined)throw Error('Unexpected fixture read '+file);return value;},
    existsSync:file=>Object.hasOwn(files,relative(file)),
    readdirSync:file=>{const entries=directories.get(relative(file));if(!entries)throw Error('Absent fixture directory');return [...entries].map(([name,directory])=>({name,isDirectory:()=>directory,isFile:()=>!directory}));}
  };
  const module={exports:{}};
  const requireFixture=id=>{
    if(id==='fs')return fakeFs;
    if(id==='./canonical-aliases')return canonical;
    if(id==='./static-owner-policy')return policyApi;
    if(id==='./safe-write')return {writeFileSyncWithRetry:()=>{throw Error('Read-only discovery must not write');}};
    // Only module initialization needs locale catalog services; discovery uses the real HTML parser.
    if(id==='./localization-platform')return {loadLocaleManifest:()=>({}),loadCoveragePolicy:()=>({}),loadCatalogs:()=>({}),getPublicLocaleIds:()=>['en','fr','sw','ha','yo']};
    return require(id);
  };
  const source=fs.readFileSync(path.join(ROOT,'scripts/lib/route-contract.js'),'utf8');
  // Expose the maintained private discovery function only inside this test VM.
  vm.runInThisContext('(function(require,module,exports,__dirname){'+source+'\nmodule.exports.__discoverPages=discoverPages;})')(
    requireFixture,module,module.exports,path.join(ROOT,'scripts/lib'));
  return module.exports.__discoverPages(policy);
}
const html=(route,title)=>`<!doctype html><html lang="en"><head><title>${title}</title><link rel="canonical" href="https://afrotools.com${route}"></head><body>${title}</body></html>`;
const flat='tools/africa-conflict/conflicts.html',directory='tools/africa-conflict/conflicts/index.html';
const fixtures={
  [flat]:html('/tools/africa-conflict/conflicts','Interactive filters'),
  [directory]:html('/tools/africa-conflict/conflicts/','Shadowed directory'),
  'tools/africa-conflict/conflicts/example/index.html':html('/tools/africa-conflict/conflicts/example/','Dossier'),
  'tools/other.html':html('/tools/other','Ordinary flat'),
  'tools/other/index.html':html('/tools/other/','Ordinary directory')
};
test('explicit delivery owner supplies canonical and sitemap metadata while dossiers remain distinct',()=>{
  const pages=discover(fixtures,actualPolicy),page=pages.find(p=>p.normalizedRoute==='/tools/africa-conflict/conflicts');
  assert.equal(page.source.file,flat);assert.equal(page.route,'/tools/africa-conflict/conflicts');assert.equal(page.canonicalRoute,page.route);
  assert.equal(page.sitemap.sitemapId,'sitemap-tools.xml');assert.equal(page.sitemap.included,true);
  assert.deepEqual(page.source.alternateFiles,[directory]);
  assert.equal(pages.find(p=>p.route.endsWith('/example/')).source.file,'tools/africa-conflict/conflicts/example/index.html');
  assert.equal(pages.filter(p=>p.normalizedRoute===page.normalizedRoute).length,1);
});
test('routes without a declared owner retain ordinary directory preference',()=>{
  const pages=discover(fixtures,actualPolicy);
  assert.equal(pages.find(p=>p.normalizedRoute==='/tools/other').source.file,'tools/other/index.html');
  const without={...actualPolicy,staticOwnerDecisions:[]};
  assert.equal(discover(fixtures,without).find(p=>p.normalizedRoute==='/tools/africa-conflict/conflicts').source.file,directory);
});
test('a declared but absent owner fails instead of silently certifying another page',()=>{
  const missing={...fixtures};delete missing[flat];assert.throws(()=>discover(missing,actualPolicy),/Static owner.*not a discovered page/);
});
test('real conflicts stylesheet resolves from both public hub URL forms',()=>{
  const source=fs.readFileSync(path.join(ROOT,flat),'utf8');
  const stylesheet=[...source.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)].map(m=>m[1]).find(h=>h.includes('style.css?'));
  for(const route of ['/tools/africa-conflict/conflicts','/tools/africa-conflict/conflicts/'])assert.equal(new URL(stylesheet,'https://afrotools.com'+route).pathname,'/tools/africa-conflict/style.css');
  assert.match(source,/acd-list-layout/);assert.match(source,/static-routes\.js/);
});
