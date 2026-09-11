const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const acorn = require('acorn');

const source = fs.readFileSync(path.join(__dirname,'../scripts/generate-sitemaps.js'),'utf8');
// Execute the actual generator functions with a synthetic in-memory manifest
// and HTML file. Never run the generator's top-level filesystem writers.
const declarations = acorn.parse(source,{ecmaVersion:'latest'}).body
  .filter(node => node.type === 'FunctionDeclaration')
  .map(node => source.slice(node.start,node.end)).join('\n');
const BASE_URL = 'https://afrotools.com';
const route = '/tools/afrokitchen/recipes/synthetic-stew/';
const url = BASE_URL+route;
function fixture(updated='2026-08-01') {
  return {generated_at:'2026-08-02',recipes:[{slug:'synthetic-stew',name:'Synthetic stew',country_name:'Synthetic country',route_url:url,generated_in_wave:true,created_at:'2026-07-01',updated_at:updated}],countries:[{country_name:'Synthetic country',route_url:BASE_URL+'/tools/afrokitchen/countries/synthetic/',generated_recipe_slugs:['synthetic-stew']}],collections:[{name:'Synthetic collection',route_url:BASE_URL+'/tools/afrokitchen/collections/synthetic/',generated_recipe_slugs:['synthetic-stew']}]};
}
function harness({today='2026-09-11',manifest=fixture(),refresh=false,existing='2026-09-10',override=''}={}) {
  const RealDate=Date;
  class Clock extends RealDate { constructor(...args){super(...(args.length?args:[today+'T12:00:00Z']));}static now(){return RealDate.parse(today+'T12:00:00Z');} }
  const root=path.resolve('/synthetic');const file=path.join(root,'index.html');
  const context=vm.createContext({Date:Clock,URL,Map,Set,console,path,ROOT:root,BASE_URL,TODAY:today,REFRESH_LASTMOD:refresh,
    AFROKITCHEN_MANIFEST_PATH:'manifest.json',EXISTING_URL_LASTMODS:new Map([[url,existing]]),
    LASTMOD_OVERRIDES:{exact:new Map(override?[[url,override]]:[]),prefixes:[]},
    ROUTE_BY_FILE:new Map([['index.html',{route,state:'page',indexability:'indexable',sitemap:{included:true,sitemapId:'tools'}}]]),
    ROUTE_GRAPH:{},routeContract:{getRouteRecord:()=>null},fileToPublicRoute:()=>route,
    fs:{existsSync:()=>true,readFileSync:p=>p==='manifest.json'?JSON.stringify(manifest):'<html><head></head><body>Fixture</body></html>',statSync:()=>({mtime:new RealDate(today+'T06:00:00Z')})}
  });
  vm.runInContext(declarations,context);
  context.isExplicitRedirectRoute=()=>false;
  context.AFROKITCHEN_SITEMAP_METADATA=context.loadAfroKitchenSitemapMetadata();
  return {context,page:()=>context.inspectHtmlFile(file)};
}

test('unchanged old source dates survive daily rebuilds and refreshed checkout mtimes',()=>{
  for(const today of ['2026-09-10','2026-09-11','2026-10-20'])for(const refresh of [false,true]) {
    const {context,page}=harness({today,refresh});
    assert.equal(context.normalizeSitemapLastmod('2026-08-01'),'2026-08-01');
    assert.equal(page().lastmod,'2026-08-01');
    for(const [loc,metadata] of context.AFROKITCHEN_SITEMAP_METADATA) {
      assert.equal(metadata.lastmod,loc===BASE_URL+'/tools/afrokitchen/'?'2026-08-02':'2026-08-01');
    }
  }
});
test('actual recipe changes update recipe and collection dates without a blanket restamp',()=>{
  const {context,page}=harness({manifest:fixture('2026-09-09'),existing:'2026-08-01'});
  assert.equal(page().lastmod,'2026-09-09');
  assert.equal(context.AFROKITCHEN_SITEMAP_METADATA.get(BASE_URL+'/tools/afrokitchen/collections/synthetic/').lastmod,'2026-09-09');
  assert.equal(context.AFROKITCHEN_SITEMAP_METADATA.get(BASE_URL+'/tools/afrokitchen/countries/synthetic/').lastmod,'2026-09-09');
  assert.equal(context.AFROKITCHEN_SITEMAP_METADATA.get(BASE_URL+'/tools/afrokitchen/').lastmod,'2026-08-02');
});
test('reviewed override applies to manifest routes in normal and refresh modes',()=>{
  for(const refresh of [false,true])assert.equal(harness({refresh,override:'2026-09-05'}).page().lastmod,'2026-09-05');
});
test('ordinary historical stamps stay stable; explicit refresh uses supplied date, never today',()=>{
  const normal=harness().context;
  assert.equal(normal.stableSitemapLastmod(url,'2026-07-15'),'2026-09-10');
  assert.equal(normal.stableSitemapLastmod(BASE_URL+'/new/','2026-07-15'),'2026-07-15');
  const refreshed=harness({refresh:true}).context;
  assert.equal(refreshed.stableSitemapLastmod(url,'2026-07-15'),'2026-07-15');
});
