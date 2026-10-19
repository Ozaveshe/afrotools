'use strict';
// Real maintained native inventory callback, genuine policy/auditor and genuine
// page/reference owner. No browser, source writes, provider or network is used.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),SPEC=path.join(ROOT,'tests/e2e/afrokitchen-visual-recipe.spec.js');
const generator=require('../scripts/generate-afrokitchen-static-pages');
const policy=require('../engines/src/afrokitchen-engine');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/afrokitchen/seo-manifest.json'),'utf8'));
const packageJson=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
function nativeContract() {
  const registered=[],test=(name,callback)=>registered.push({name,callback});
  test.use=test.beforeEach=test.afterEach=test.beforeAll=()=>{};
  test.describe=(name,callback)=>callback();
  const expect=value=>({toContain:expected=>assert(value.includes(expected)),toBe:expected=>assert.equal(value,expected),not:{toContain:expected=>assert(!value.includes(expected))}});
  const module={exports:{}},load=name=>name==='@playwright/test'?{test,expect}:name.startsWith('.')?require(path.resolve(path.dirname(SPEC),name)):require(name);
  vm.runInThisContext('(function(exports,require,module,__filename,__dirname){'+fs.readFileSync(SPEC,'utf8')+'\n})',{filename:SPEC})(module.exports,load,module,SPEC,path.dirname(SPEC));
  return {registered,inventory:module.exports.assertPublishedRecipeInventory};
}
const native=nativeContract(),cases=[],readCache=new Map();
function test(name,callback){cases.push({name,callback});}
function readHtml(slug){if(!readCache.has(slug))readCache.set(slug,fs.readFileSync(path.join(ROOT,'tools/afrokitchen/recipes',slug,'index.html'),'utf8'));return readCache.get(slug);}
function payloadOf(html){return JSON.parse(html.match(/window\.__AK_STATIC_RECIPE\s*=\s*([\s\S]*?);\s*<\/script>/)[1]);}
function withPayload(html,change){const payload=payloadOf(html);change(payload);return html.replace(/(window\.__AK_STATIC_RECIPE\s*=\s*)([\s\S]*?)(;\s*<\/script>)/,(_,start,json,end)=>start+JSON.stringify(payload).replace(/</g,'\\u003c')+end);}
function single(recipe){return {recipes:[recipe],routes:{generated_recipe_slugs:[recipe.slug]}};}
function inventory(recipe,html,aliases=[]){return native.inventory(single(recipe),()=>html,aliases);}
function rejectsInventory(callback){assert.equal(typeof native.inventory,'function','actual classified inventory implementation required');assert.throws(callback);}
const pending=manifest.recipes.find(recipe=>policy.isPendingRecipeMethod(recipe)),pendingHtml=readHtml(pending.slug);
const normal=manifest.recipes.find(recipe=>!policy.isPendingRecipeMethod(recipe)),normalHtml=readHtml(normal.slug);
const attributed=manifest.recipes.filter(recipe=>policy.isAttributedRecipe(recipe));
// The narrow owner can run before or after this suite. Build a reference-free
// fixture from each actual page through the genuine owned insertion and its
// exact inverse; never assume the repository is at one generation stage.
function referenceFreeHtml(recipe) {
  const reference=generator.renderRecipeSourceReference(recipe);
  const current=generator.refreshRecipeSourceReference(readHtml(recipe.slug),recipe);
  const anchor=current.match(/\n([ \t]*)<div class="ak-static-facts">/);
  assert(anchor,'actual recipe requires its facts anchor');
  const insertion='\n'+anchor[1]+reference;
  assert.equal(current.split(insertion).length-1,1,'exactly one genuine owned insertion');
  assert(current.includes(insertion+'\n'+anchor[1]+'<div class="ak-static-facts">'));
  const free=current.replace(insertion,'');
  assert(!free.includes('data-ak-method-source'));
  assert.equal(generator.refreshRecipeSourceReference(free,recipe),current);
  return free;
}
function referenceFixtureGenerator(htmlBySlug) {
  const filename=path.join(ROOT,'scripts/generate-afrokitchen-static-pages.js');
  const expected=attributed.map(row=>row.slug).sort();
  assert.deepEqual([...htmlBySlug.keys()].sort(),expected,'fixture covers only exact attributed source owners');
  const fixtures=new Map(expected.map(slug=>[path.resolve(ROOT,'tools/afrokitchen/recipes',slug,'index.html'),htmlBySlug.get(slug)]));
  for(const value of fixtures.values())assert.equal(typeof value,'string');
  const localFS={...fs,readFileSync(file,encoding){
    const resolved=typeof file==='string'||Buffer.isBuffer(file)?path.resolve(String(file)):null;
    if(!fixtures.has(resolved))return fs.readFileSync(file,encoding);
    const value=Buffer.from(fixtures.get(resolved),'utf8');
    const codec=typeof encoding==='string'?encoding:encoding&&encoding.encoding;
    return codec?value.toString(codec):value;
  }};
  const module={exports:{}};
  const load=name=>name==='fs'||name==='node:fs'?localFS:name.startsWith('.')?require(path.resolve(path.dirname(filename),name)):require(name);
  load.main=null;
  // Complete unchanged maintained CJS source, normal relative dependencies and
  // filename/dirname. Only the eight explicit recipe reads are adapted locally.
  vm.runInThisContext('(function(exports,require,module,__filename,__dirname){'+fs.readFileSync(filename,'utf8').replace(/^#![^\n]*\n/,'')+'\n})',{filename})(module.exports,load,module,filename,path.dirname(filename));
  return module.exports;
}
test('all nine original native cases remain registered and no browser callback is launched',()=>{assert.equal(native.registered.length,9);assert.equal(native.registered.filter(row=>row.name.startsWith('FINAL4 ')).length,3)});
test('actual full native inventory callback accepts all classified pages',async()=>{await native.registered[1].callback();assert.equal(typeof native.inventory,'function');const result=native.inventory(manifest,readHtml);assert.equal(result.total,manifest.routes.generated_recipe_slugs.length);assert.equal(result.total,410);assert.equal(result.canvas,406);assert.equal(result.pending,4);assert.equal(result.aliases,7)});
test('unknown yield with a maintained preparation method remains a canvas',()=>{const rows=manifest.recipes.filter(recipe=>!policy.isPendingRecipeMethod(recipe)&&recipe.yield_status==='not-recorded');assert.equal(rows.length,3);for(const row of rows)assert.equal(inventory(row,readHtml(row.slug)).canvas,1)});
test('all actual pending pages pass the genuine maintained auditor',()=>{for(const row of manifest.recipes.filter(recipe=>policy.isPendingRecipeMethod(recipe)))assert.equal(inventory(row,readHtml(row.slug)).pending,1)});
for(const [name,change]of [
 ['robots noindex removed',html=>html.replace('noindex, follow','index, follow')],
 ['canonical substituted',html=>html.replace('<link rel="canonical" href="'+pending.route_url+'">','<link rel="canonical" href="https://afrotools.com/wrong/">')],
 ['Recipe schema added',html=>html.replace('</head>','<script type="application/ld+json">{"@type":"Recipe"}</script></head>')],
 ['HowTo graph added',html=>html.replace('</head>','<script type="application/ld+json">{"@graph":[{"@type":["HowTo"]}]}</script></head>')],
 ['cooking button added',html=>html.replace('</main>','<button data-ak-cook-mode>Cook</button></main>')],
 ['print action added',html=>html.replace('</main>','<button data-ak-print-recipe>Print</button></main>')],
 ['planner action added',html=>html.replace('</main>','<button data-ak-add-meal-plan>Plan</button></main>')],
 ['copy export added',html=>html.replace('</main>','<button data-ak-copy-recipe>Copy</button></main>')],
 ['ingredients manufactured',html=>withPayload(html,p=>p.ingredients=[{name:'invented'}])],
 ['steps manufactured',html=>withPayload(html,p=>p.steps=[{instruction:'invented'}])],
 ['yield manufactured',html=>withPayload(html,p=>p.default_servings=4)],
 ['nutrition manufactured',html=>withPayload(html,p=>p.calories=100)],
 ['method timing manufactured',html=>withPayload(html,p=>p.cook_time_minutes=30)],
 ['identity substituted',html=>withPayload(html,p=>p.id='00000000-0000-0000-0000-000000000000')]
])test('pending inventory rejects '+name,()=>rejectsInventory(()=>inventory(pending,change(pendingHtml))));
test('nonpending missing ingredients/method cannot become a pending exemption',()=>{for(const field of ['ingredients','steps']){const bad=structuredClone(normal);bad[field]=[];rejectsInventory(()=>inventory(bad,normalHtml));}});
test('unverified page and wrong canonical identity fail closed',()=>{rejectsInventory(()=>inventory({...normal,is_verified:false},normalHtml));rejectsInventory(()=>inventory(normal,normalHtml.replace('<link rel="canonical" href="'+normal.route_url+'">','<link rel="canonical" href="https://afrotools.com/wrong/">')))});
test('missing row, duplicate route and duplicate UUID never collapse coverage',()=>{const duplicate={recipes:[normal,structuredClone(normal)],routes:{generated_recipe_slugs:[normal.slug,normal.slug]}};rejectsInventory(()=>native.inventory(duplicate,()=>normalHtml,[]));const missing=single(normal);missing.routes.generated_recipe_slugs.push('missing');rejectsInventory(()=>native.inventory(missing,()=>normalHtml,[]));const other=structuredClone(normal);other.slug='different';other.route_url='https://afrotools.com/tools/afrokitchen/recipes/different/';rejectsInventory(()=>native.inventory({recipes:[normal,other],routes:{generated_recipe_slugs:[normal.slug,other.slug]}},slug=>slug===normal.slug?normalHtml:normalHtml.replaceAll(normal.slug,other.slug),[]));});
test('nonpending missing canvas or artwork/step cards cannot pass',()=>{for(const html of [normalHtml.replaceAll('ak-visual-recipe','removed'),normalHtml.replaceAll('ak-ing-art','removed'),normalHtml.replaceAll('class="ak-step"','class="removed"')])rejectsInventory(()=>inventory(normal,html))});
test('legacy aliases require their exact classified target/noindex/refresh and cannot shadow a canonical slug',()=>{const alias=generator.LEGACY_RECIPE_ALIASES[0],target=manifest.recipes.find(r=>r.slug===alias.targetRecipeSlug),html=readHtml(alias.legacySlug);for(const corrupted of [html.replace('noindex, follow','index, follow'),html.replace('content="0;url=','content="1;url='),html.replace('rel="canonical"','rel="wrong"')])rejectsInventory(()=>native.inventory(single(target),slug=>slug===target.slug?readHtml(target.slug):corrupted,[alias]));rejectsInventory(()=>native.inventory(single(target),readHtml,[{...alias,legacySlug:target.slug}]))});
test('all current attributed source bindings are rendered and refresh changes no other current HTML bytes',()=>{assert(attributed.length>0);for(const row of attributed){const ref=generator.renderRecipeSourceReference(row),before=referenceFreeHtml(row),after=generator.refreshRecipeSourceReference(before,row);assert(ref.includes('href="'+row.source+'"'));assert(ref.includes('target="_blank" rel="noopener noreferrer"'));assert(ref.includes('Source reference (opens in a new tab)'));assert.equal(after.split('data-ak-method-source').length-1,1);const indent=before.match(/\n([ \t]*)<div class="ak-static-facts">/)[1];assert.equal(after.replace('\n'+indent+ref,''),before);assert.equal(generator.refreshRecipeSourceReference(after,row),after);assert.deepEqual([...after.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])),[...before.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])));assert(after.indexOf(ref)<after.indexOf('<div class="ak-static-facts">'));}});
test('stale owned source reference updates once and unrelated existing references remain unchanged',()=>{for(const row of attributed){const before=referenceFreeHtml(row),ref=generator.renderRecipeSourceReference(row),current=generator.refreshRecipeSourceReference(before,row),stale=current.replace(row.source,'https://example.test/stale-source'),next=generator.refreshRecipeSourceReference(stale,row);assert.equal(next,current);const background={...normal,source:'https://en.wikipedia.org/wiki/Africa'};assert.equal(generator.renderRecipeSourceReference(background),'');assert.equal(generator.refreshRecipeSourceReference(next,background),next.replace(ref,''));assert.equal(generator.refreshRecipeSourceReference(before,background),before);assert.throws(()=>generator.refreshRecipeSourceReference(current.replace(ref,ref+ref),row),/Duplicate/);assert.throws(()=>generator.refreshRecipeSourceReference(before.replace('<div class="ak-static-facts">','<div class="missing-anchor">'),row),/anchor/);}});
for(const source of [undefined,null,'','javascript:alert(1)','data:text/html,x','http://example.test/','/relative','https://user:pass@example.test/',' https://example.test/','https://example.test/space here','https://example.test/\\path'])test('unsafe or missing attributed source refuses '+String(source),()=>{assert.throws(()=>generator.renderRecipeSourceReference({...attributed[0],source}),/safe saved HTTPS|saved method owner/);const old=generator.refreshRecipeSourceReference(readHtml(attributed[0].slug),attributed[0]);assert.throws(()=>generator.refreshRecipeSourceReference(old,{...attributed[0],source}),/safe saved HTTPS|saved method owner/);});
test('safe HTTPS source text is escaped without introducing elements or event attributes',()=>{const ref=generator.sourceReferenceLinkHtml('https://example.test/?a=1&b="\'><img/src=x/onerror=1>');assert(ref.includes('&amp;')&&ref.includes('&quot;')&&ref.includes('&#39;')&&ref.includes('&lt;img'));assert(!ref.includes('<img'));assert(!/\sonerror=/.test(ref));});
test('genuine planner updates every eligible source and refuses duplicate or invalid identities',()=>{const fixtures=new Map(attributed.map(row=>[row.slug,referenceFreeHtml(row)])),subject=referenceFixtureGenerator(fixtures);const plans=subject.planRecipeSourceReferences(manifest);assert.deepEqual(plans.map(p=>p.slug).sort(),attributed.map(r=>r.slug).sort());assert(plans.every(p=>p.content.includes('data-ak-method-source')));assert.throws(()=>subject.planRecipeSourceReferences({...manifest,recipes:[...manifest.recipes,attributed[0]]}),/Duplicate/);const bad=structuredClone(manifest);bad.recipes.find(r=>r.slug===attributed[0].slug).id='wrong';assert.throws(()=>subject.planRecipeSourceReferences(bad),/not publicly eligible/);});
for(const [name,change] of [
 ['data-rel alias',tag=>tag.replace('rel="canonical"','data-rel="canonical"')],
 ['data-href alias',tag=>tag.replace('href="','data-href="')],
 ['quoted title aliases',tag=>'<link title=\'rel="canonical" href="'+normal.route_url+'"\'>'],
 ['duplicate href',tag=>tag.replace('>',' href="'+normal.route_url+'">')]
])test('canonical identity rejects '+name,()=>{const tag='<link rel="canonical" href="'+normal.route_url+'">';assert(normalHtml.includes(tag));rejectsInventory(()=>inventory(normal,normalHtml.replace(tag,change(tag))));});
test('duplicate canonical tags and unsafe source paths are rejected',()=>{rejectsInventory(()=>inventory(normal,normalHtml.replace('</head>','<link rel="canonical" href="'+normal.route_url+'"></head>')));rejectsInventory(()=>inventory({...normal,slug:'../outside'},normalHtml));});
test('an unrelated HTTPS reference cannot replace an owned method source',()=>{assert.throws(()=>generator.renderRecipeSourceReference({...attributed[0],source:'https://en.wikipedia.org/wiki/Africa'}),/saved method owner/)});
test('genuine reference planner is complete and idempotent before, after and during a partial refresh',()=>{
  const raw=new Map(attributed.map(row=>[row.slug,readHtml(row.slug)]));
  const free=new Map(attributed.map(row=>[row.slug,referenceFreeHtml(row)]));
  const complete=new Map(attributed.map(row=>[row.slug,generator.refreshRecipeSourceReference(free.get(row.slug),row)]));
  const partial=new Map(attributed.map((row,index)=>[row.slug,index%2?complete.get(row.slug):free.get(row.slug)]));
  const originalFree=[...free],originalComplete=[...complete],originalPartial=[...partial];
  for(const [fixtures,expected]of [[free,attributed.map(row=>row.slug)],[complete,[]],[partial,attributed.filter((row,index)=>index%2===0).map(row=>row.slug)]]){
    const subject=referenceFixtureGenerator(fixtures),plans=subject.planRecipeSourceReferences(manifest);
    assert.deepEqual(plans.map(plan=>plan.slug).sort(),expected.sort());
    const applied=new Map(fixtures);
    for(const plan of plans){assert.equal(plan.content,complete.get(plan.slug));applied.set(plan.slug,plan.content);}
    assert.deepEqual([...applied],[...complete]);
    assert.deepEqual(referenceFixtureGenerator(applied).planRecipeSourceReferences(manifest),[]);
  }
  // Current raw inputs may be at any stage; the same real planner must reach
  // the fixed canonical target without mutating any supplied/read page buffer.
  const currentPlans=referenceFixtureGenerator(raw).planRecipeSourceReferences(manifest),currentApplied=new Map(raw);
  for(const plan of currentPlans)currentApplied.set(plan.slug,plan.content);
  assert.deepEqual([...currentApplied],[...complete]);
  assert.deepEqual(referenceFixtureGenerator(currentApplied).planRecipeSourceReferences(manifest),[]);
  assert.deepEqual([...free],originalFree);assert.deepEqual([...complete],originalComplete);assert.deepEqual([...partial],originalPartial);
  for(const row of attributed)assert.equal(readHtml(row.slug),raw.get(row.slug));
});

test('permanent build owner is enrolled exactly once before remaining surfaces while preserving its narrow CLI',()=>{assert.equal(packageJson.scripts['afrokitchen:references:build'],'node scripts/generate-afrokitchen-static-pages.js --refresh-attributed-source-references');const commands=packageJson.scripts['build:surfaces'].split(' && ');assert.equal(commands.filter(c=>c==='npm run afrokitchen:references:build').length,1);assert.equal(commands[0],'npm run afroatlas:build');assert.equal(commands[1],'npm run afrokitchen:references:build');assert.equal(commands[2],'node scripts/build-reviewed-solar-inputs.js');});
(async function run(){const results=[];for(const row of cases){try{await row.callback();results.push({name:row.name,pass:true});}catch(error){results.push({name:row.name,pass:false,error:error.message});}}const failed=results.filter(row=>!row.pass);console.log(JSON.stringify({suite:'Kitchen complete publication inventory and exact attributed source owner',total:results.length,passed:results.length-failed.length,failed:failed.length,cases:results}));if(failed.length)process.exitCode=1;})().catch(error=>{console.error(error);process.exitCode=1;});
