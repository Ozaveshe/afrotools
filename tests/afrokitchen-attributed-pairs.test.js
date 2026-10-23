"use strict";
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const acorn = require('acorn');
const ROOT = path.resolve(__dirname, '..');
const api = require('../engines/src/afrokitchen-engine');
const owner = require('../scripts/generate-afrokitchen-static-pages');
const indexOwner = require('../scripts/lib/afrokitchen-recipe-index');
const manifest = require('../tools/afrokitchen/seo-manifest.json');
const audit = require('../data/afrokitchen/recipe-research-audit.json').recipes;
const IDS = { 'mandazi-tanzania-tz': '7b24d43e-e00f-47fe-8943-0dbf74b81bc0', 'koba-mg': '3b4af630-750d-467f-939c-7befadf44d32' };
const originals = new Map(manifest.recipes.map(row => [row.slug, row]));
const plain = x => JSON.parse(JSON.stringify(x));
const fixture = slug => ({...structuredClone(originals.get(slug)), is_published: true, is_verified: true});
function actualFunction(file, name) {
  const src = fs.readFileSync(path.join(ROOT,file),'utf8');
  const ast = acorn.parse(src,{ecmaVersion:'latest'}); let found;
  function walk(node) { if (!node || typeof node !== 'object') return; if (node.type === 'FunctionDeclaration' && node.id.name === name) found = src.slice(node.start,node.end); for (const v of Object.values(node)) if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') walk(v); }
  walk(ast); assert.ok(found, name); return found;
}
function browserEngine(client, index) {
  const ctx = {window:{AfroAuth:{getSupabase:()=>client}, navigator:{onLine:!!client}}, console:{warn(){}}, fetch:async()=>({ok:true,json:async()=>({version:2,recipes:index})}), Date, setTimeout, clearTimeout};
  ctx.AfroAuth=ctx.window.AfroAuth; ctx.window.fetch=ctx.fetch;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'engines/src/afrokitchen-engine.js'),'utf8'),ctx);
  return ctx.AfroKitchenEngine;
}
for (const slug of Object.keys(IDS)) {
  test(slug+': one shared representation preserves authority, dates and counters',()=>{
    const original=fixture(slug), before=structuredClone(original), projected=api.projectAttributedRecipe(original);
    assert.deepEqual(original,before); assert.ok(api.isAttributedRecipe(projected));
    for(const key of ['id','slug','is_published','is_verified','created_at','updated_at','view_count','country_code']) assert.deepEqual(projected[key],before[key],key);
    assert.deepEqual(owner.applyRecipeResearchPatch(original,audit),projected);
    assert.deepEqual(projected.diet_tags,[]);
    for(const key of ['calories','protein_g','carbs_g','fat_g','fiber_g']) assert.equal(projected[key],null);
    for(const rows of [projected.ingredients,projected.steps,projected.media]) assert.ok(rows.every(row=>row.recipe_id===IDS[slug]));
    assert.equal(projected.reviews.length,0); assert.equal(projected.avg_rating,null);
  });
  test(slug+': explicit false/missing flags or wrong UUID cannot authorize an adaptation',()=>{
    for(const change of [{id:'wrong'},{is_published:false},{is_verified:false},{is_published:undefined},{is_verified:null}]) {
      assert.equal(api.projectAttributedRecipe({...fixture(slug),...change}),null);
      assert.throws(()=>owner.applyRecipeResearchPatch({...fixture(slug),...change},audit),/eligibility/);
      assert.equal(api.isAttributedRecipe({...api.projectAttributedRecipe(fixture(slug)),...change}),false);
    }
  });
  test(slug+': static HTML, source quantities, illustration and TXT are the same method',()=>{
    const base=fixture(slug), recipe=api.projectAttributedRecipe(base), html=owner.buildRecipePageHtml(base,{...manifest,recipes:[base]},api,{},audit,null);
    assert.match(html,/AI-generated serving illustration/); assert.ok(html.includes(recipe.image_alt));
    assert.ok(html.includes(recipe.steps[0].instruction)); assert.ok(html.includes(recipe.ingredients[0].name));
    assert.doesNotMatch(html,/Dairy.free|PTnullM|PTundefinedM|PTNaNM/);
    const ctx={n:recipe,i:api,s:{servings:recipe.default_servings},e:{location:{href:'http://localhost/fixture'}},f:()=>api.scaleIngredients(recipe.ingredients,recipe.default_servings,recipe.default_servings)};
    vm.runInNewContext(actualFunction('tools/afrokitchen/static-recipe-runtime.js','recipeExportText')+';result=recipeExportText();',ctx);
    assert.match(ctx.result,/AI-generated serving illustration/); assert.ok(ctx.result.includes(recipe.steps[0].instruction));
    assert.doesNotMatch(ctx.result,/NaN|\bnull\b|0 as needed/);
    assert.equal(api.getRecipeTiming(recipe).total,null); assert.equal(Object.hasOwn(plain(api.getStructuredData(recipe,recipe.default_servings)),'nutrition'),false);
    assert.equal(Object.hasOwn(plain(api.getStructuredData({...recipe,avg_rating:5,review_count:80},recipe.default_servings)),'aggregateRating'),false);
  });
  test(slug+': index and actual browser-engine source online/offline contracts use the shared method',async()=>{
    const parent=fixture(slug), projected=api.projectAttributedRecipe(parent);
    const idx=indexOwner.buildRecipeIndex({generated_at:'fixture',recipes:[{...parent,generated_in_wave:true}]}).recipes;
    assert.equal(idx[0].method_revision,projected.method_revision); assert.deepEqual(idx[0].curated_detail.fields.ingredients,projected.ingredients);
    const offline=browserEngine(null,idx); assert.deepEqual(plain((await offline.fetchRecipeBySlug(slug)).ingredients),projected.ingredients);
    const requests=[]; const client={from(table){const q={select(){return q},eq(k,v){requests.push([table,k,v]);return q},order(){return q},limit(){return q},maybeSingle:async()=>({data:parent}),then(done){return Promise.resolve({data:table==='recipe_media'?[]:table==='recipe_reviews'?[{rating:5}]:[]}).then(done)}};return q},rpc:()=>Promise.resolve()};
    const online=browserEngine(client,idx); const r=await online.fetchRecipeBySlug(slug);
    assert.deepEqual(plain(r.ingredients),projected.ingredients);assert.equal(r.avg_rating,null);assert.deepEqual(plain(r.media),projected.media);
    assert.ok(requests.some(x=>x[0]==='recipes'&&x[1]==='is_published'&&x[2]===true));
    assert.deepEqual(plain(await online.fetchIngredientPrices(parent.id,'TZ')),[]);
  });
}
test('source arithmetic and unknown-quantity semantics follow the two original sources',()=>{
  const m=api.projectAttributedRecipe(fixture('mandazi-tanzania-tz')),k=api.projectAttributedRecipe(fixture('koba-mg'));
  for(const slug of ['constructor','toString','__proto__','hasOwnProperty']) { assert.equal(api.isAttributedTarget({slug}),false); assert.equal(api.isAttributedRecipe({slug}),false); }
  for(const row of [null,{}, {slug:'koba-mg'}]) assert.equal(api.isAttributedRecipe(row),false);
  assert.equal(m.default_servings,8);assert.deepEqual(api.getRecipeTiming(m),{prep:null,cook:null,total:null});
  assert.equal(m.ingredients.find(x=>x.name==='dry yeast').amount,2.25);assert.equal(m.ingredients.find(x=>x.name==='coconut milk').amount,.75);
  assert.equal(m.ingredients.find(x=>x.name==='egg or flax slurry'),undefined);assert.match(m.steps[2].instruction,/until doubled/);
  assert.match(m.steps[0].instruction,/yeast/i);
  assert.match(m.steps[1].instruction,/into the activated yeast mixture/i);
  assert.match(m.steps[1].instruction,/Mix in the flour/);
  assert.ok(m.steps[1].instruction.indexOf('activated yeast mixture') < m.steps[1].instruction.indexOf('flour'));
  assert.equal(k.default_servings,10);assert.equal(k.serving_unit,'servings');assert.deepEqual(api.getRecipeTiming(k),{prep:15,cook:null,total:null});
  assert.equal(k.ingredients.find(x=>x.name==='peanuts').amount,30);assert.equal(k.ingredients.find(x=>x.name==='rice flour').amount,150);
  assert.equal(k.steps[3].timer_seconds,1200);assert.match(k.steps[3].timer_label,/Start checking/);assert.doesNotMatch(k.steps[3].instruction,/pressure|fry|bake/);
  for(const recipe of [m,k]) {
    const doubled=api.scaleIngredients(recipe.ingredients,recipe.default_servings,recipe.default_servings*2);
    const unknown=doubled.find(x=>x.amount===null);assert.equal(unknown.scaled_amount,'');assert.equal(api.formatAmount(unknown.scaled_amount),'');
  }
});
test('all recipe projections, index summaries and source identities remain coherent',()=>{
  assert.equal(manifest.recipes.length,410);
  const allowed=manifest.recipes.map(row=>({...row,is_published:true,is_verified:true,generated_in_wave:true}));
  const result=indexOwner.buildRecipeIndex({...manifest,recipes:allowed});
  assert.equal(result.recipes.length,410);
  for(const row of allowed.filter(r=>!IDS[r.slug] && !(r.id==='d7d7e305-3c5d-40db-9033-36843e102176' && r.slug==='ibihaza-rw') && !(r.id==='feabebb3-cd55-48c6-be9a-17f118dddfcc' && r.slug==='kat-kat-banane-sc'))) {
    const additional=[['masa-waina-ng','fc876ee7-c116-40eb-836e-54b0de5d94f8','masa-ramatu-allnigerianfoods-20261023-v2'],['ndizi-nyama-tz','63325da8-6678-414f-b431-f88d8d6b2fe1','ndizi-darlene-international-cuisine-20261017-v1'],['latchiri-kossan-gn','91740809-c813-417e-8af4-c5c7c989c1be','latchiri-gassama-maize-cultured-milk-20261017-v1'],['mchemsho-tz','4caf4ed6-13ec-4fbb-8039-ce51a4201cfe','mchemsho-tatedo-indexed-beef-batch-20261018-v1'],['octopus-curry-sc','8c0311ea-c7e3-4286-b535-33a75451becd','octopus-ben-pierce-jones-water-20261018-v1']].find(([slug,id])=>row.slug===slug&&row.id===id);
    if(additional){const projected=api.projectAttributedRecipe(row);assert.ok(api.isAttributedRecipe(projected));assert.equal(projected.method_revision,additional[2]);}
    else if ((row.id==='8a2bb743-87d9-462e-bc09-335e78f9584a'&&row.slug==='kunu-zaki-ng')||(row.id==='f2850789-0ffd-41b3-bbaf-e3229132c9e6'&&row.slug==='ikivuguto-rw')||(row.id==='c0aced74-68d6-437d-b00b-abd1895605f0'&&row.slug==='kisra-south-sudan-ss')||(row.id==='626fd465-87e1-4f93-bca7-747decbf63d0'&&row.slug==='maheu-zm')) {
      const pending=api.projectAttributedRecipe(row);assert.equal(pending.method_review_status,'pending-source-method');assert.deepEqual(pending.steps,[]);assert.equal(pending.total_time_minutes,null);
    } else assert.strictEqual(api.projectAttributedRecipe(row),row);
    const singleton=indexOwner.buildRecipeIndex({...manifest,recipes:[row]}).recipes[0];
    assert.deepEqual(result.recipes.find(r=>r.id===row.id),singleton);
  }
});
test('actual adapted community guard suppresses legacy review and contribution authority only for these revisions',()=>{
  const fn=actualFunction('tools/afrokitchen/recipe-page.js','communityMethodUnlinked');
  for(const slug of Object.keys(IDS)) {
    const ctx={i:api.projectAttributedRecipe(fixture(slug)),e:api};vm.runInNewContext(fn+';result=communityMethodUnlinked();',ctx);assert.equal(ctx.result,true);
    ctx.i={...ctx.i,method_revision:'not-reviewed'};vm.runInNewContext(fn+';result=communityMethodUnlinked();',ctx);assert.equal(ctx.result,false);
  }
  const renderSource=['v','communityMethodUnlinked','w','b','I','U'].map(name=>actualFunction('tools/afrokitchen/recipe-page.js',name)).join(';');
  for(const slug of Object.keys(IDS)) {
    const node={innerHTML:''}, recipe=api.projectAttributedRecipe(fixture(slug));
    const ctx={i:recipe,e:api,AfroKitchenEngine:api,d:{averageRating:4.5,reviewCount:3,cooksnaps:[{},{}]},p:id=>{assert.equal(id,'community-stats');return node}};
    vm.runInNewContext(renderSource+';U()',ctx);
    const values=[...node.innerHTML.matchAll(/ak-community-stat-value">([^<]*)</g)].map(x=>x[1]);
    assert.deepEqual(values.slice(0,3),['Not linked','Not linked','Not linked']);
    ctx.i={...recipe,method_revision:'ordinary-no-adaptation'};vm.runInNewContext(renderSource+';U()',ctx);
    const ordinary=[...node.innerHTML.matchAll(/ak-community-stat-value">([^<]*)</g)].map(x=>x[1]);
    assert.deepEqual(ordinary.slice(0,3),['4.5 / 5','3','2']);
  }
});
test('actual API list/get response projects only public rows without changing request authority or DB records',async()=>{
  const source=fs.readFileSync(path.join(ROOT,'netlify/functions/afrokitchen-recipes.js'),'utf8');
  const parent=fixture('mandazi-tanzania-tz'), before=structuredClone(parent), other=fixture('koba-mg');let requests=[];
  async function run(action,rows) {
    const ctx={exports:{},process:{env:{SUPABASE_AUTH_SERVICE_KEY:'synthetic-local-only'}},require:p=>{assert.equal(p,'../../engines/src/afrokitchen-engine');return api},fetch:async(url,opt)=>{requests.push({url,opt});return {ok:true,json:async()=>url.includes('/recipes?')?structuredClone(rows):[]}}};
    vm.runInNewContext(source,ctx);const response=await ctx.exports.handler({httpMethod:'GET',headers:{origin:'http://localhost'},queryStringParameters:{action,slug:action==='get'?parent.slug:undefined}});return {...response,json:JSON.parse(response.body)};
  }
  const list=await run('list',[parent,other,{...parent,id:'withheld',is_published:false}]);assert.equal(list.statusCode,200);assert.equal(list.json.length,2);assert.equal(list.json[0].method_revision,api.projectAttributedRecipe(parent).method_revision);
  const get=await run('get',[parent]);assert.equal(get.statusCode,200);assert.deepEqual(get.json.ingredients,api.projectAttributedRecipe(parent).ingredients);assert.deepEqual(parent,before);
  assert.ok(requests.every(r=>!r.opt.method||r.opt.method==='GET'));
  assert.equal((await run('get',[{...parent,is_verified:false}])).statusCode,404);
  assert.equal((await run('get',[{...parent,id:'wrong'}])).statusCode,500);
});

test('actual dynamic timer completion marks the Koba checkpoint without declaring the food done',()=>{
  const file='tools/afrokitchen/recipe-page.js', source=fs.readFileSync(path.join(ROOT,file),'utf8');
  const ast=acorn.parse(source,{ecmaVersion:'latest'}), methods={};
  function walk(n){if(!n||typeof n!=='object')return;if(n.type==='Property'&&['toggleTimer','toggleCookingTimer'].includes(n.key.name))methods[n.key.name]=source.slice(n.value.start,n.value.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
  walk(ast);
  const helper=actualFunction(file,'recipeTimerCompletion');
  for(const name of ['toggleTimer','toggleCookingTimer']) for(const slug of ['koba-mg','mandazi-tanzania-tz']) {
    const recipe=api.projectAttributedRecipe(fixture(slug)), elements=new Map();let complete;
    const ctx={i:recipe,r:null,l:{},p:id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{}});return elements.get(id)},e:{...api,createTimer:(seconds,label,tick,done)=>{complete=done;return 'timer'},startTimer(){}}};
    vm.runInNewContext(helper+';invoke='+methods[name],ctx);ctx.invoke(4,1200);assert.equal(typeof complete,'function');complete();
    assert.equal(ctx.p(name==='toggleTimer'?'timer-start-4':'cooking-timer-btn').textContent,slug==='koba-mg'?'Start checking':'Done!');
    ctx.i={...recipe,method_revision:'not-reviewed'};vm.runInNewContext(helper+';label=recipeTimerCompletion(4)',ctx);assert.equal(ctx.label,'Done!');
  }
});


// Four-image recovery source scope: two exact adaptations, two method holds.
const RECOVERY_METHODS = {
 'mchemsho-tz': ['4caf4ed6-13ec-4fbb-8039-ce51a4201cfe','mchemsho-tatedo-indexed-beef-batch-20261018-v1','https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf'],
 'octopus-curry-sc': ['8c0311ea-c7e3-4286-b535-33a75451becd','octopus-ben-pierce-jones-water-20261018-v1','https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles']
};
for(const [slug,[id,revision,source]] of Object.entries(RECOVERY_METHODS)) {
 test(slug+': exact source identity, approval, revision and immutable source facts',()=>{
  const input=fixture(slug),before=structuredClone(input),recipe=api.projectAttributedRecipe(input);
  assert.deepEqual(input,before);assert.equal(recipe.id,id);assert.equal(recipe.method_revision,revision);assert.equal(recipe.source,source);assert.equal(api.isAttributedRecipe(recipe),true);
  for(const k of ['id','slug','is_verified','is_published','view_count','created_at','updated_at'])assert.deepEqual(recipe[k],before[k]);
  for(const mutation of [{id:'wrong'},{is_verified:false},{is_published:false},{is_verified:undefined},{is_published:null}])assert.equal(api.projectAttributedRecipe({...input,...mutation}),null);
  assert.equal(api.isAttributedRecipe({...recipe,method_revision:'stale-method'}),false);
  const wrongSlug={...recipe,slug:'ordinary-dish'};assert.equal(api.isAttributedRecipe(wrongSlug),false);
  assert.equal(audit[slug].expected_recipe_id,id);assert.equal(audit[slug].method_revision,revision);assert.equal(audit[slug].sources[0].url,source);
  assert.deepEqual(recipe.diet_tags,[]);for(const k of ['calories','protein_g','carbs_g','fat_g','fiber_g','nutrition_basis','chef_notes','total_time_minutes'])assert.equal(recipe[k],null,k);
  assert.equal(recipe.avg_rating,null);assert.equal(recipe.review_count,0);assert.deepEqual(recipe.reviews,[]);
  for(const child of [...recipe.ingredients,...recipe.steps,...recipe.media])assert.equal(child.recipe_id,id);
  assert.deepEqual(owner.applyRecipeResearchPatch(input,audit),recipe);
 });
 test(slug+': genuine static/schema/index source owners preserve the projected source',()=>{
  const input=fixture(slug),recipe=api.projectAttributedRecipe(input),html=owner.buildRecipePageHtml(input,{...manifest,recipes:[input]},api,{},audit,null);
  assert.ok(html.includes(recipe.steps[0].instruction));assert.ok(html.includes(recipe.image_alt));assert.match(html,/AI-generated/);assert.doesNotMatch(html,/PTnullM|PTNaNM|PTundefinedM|Dairy.free/);
  const schema=plain(api.getStructuredData(recipe,recipe.default_servings));assert.equal(Object.hasOwn(schema,'totalTime'),false);assert.equal(Object.hasOwn(schema,'nutrition'),false);assert.equal(Object.hasOwn(schema,'aggregateRating'),false);
  const idx=indexOwner.buildRecipeIndex({...manifest,recipes:[{...input,generated_in_wave:true}]}).recipes[0];assert.equal(idx.method_revision,revision);assert.deepEqual(idx.curated_detail.fields.ingredients,recipe.ingredients);
 });
}
test('Mchemsho keeps exact institutional batch quantities, unknown yield/duration and written pressure checkpoints',()=>{
 const r=api.projectAttributedRecipe(fixture('mchemsho-tz'));
 assert.equal(r.default_servings,null);assert.equal(r.serving_unit,null);assert.equal(r.yield_status,'not-recorded');assert.equal(api.hasRecordedRecipeYield(r),false);assert.deepEqual(api.getRecipeTiming(r),{prep:null,cook:null,total:null});
 assert.deepEqual(r.ingredients.map(x=>[x.name,x.amount,x.unit]),[['beef',1,'kg'],['carrot',1,'whole'],['bell pepper',1,'whole'],['onion',1,'large'],['potatoes',5,'whole'],['broccoli',2,'heads'],['water',8,'cups'],['salt',null,'to taste']]);
 assert.ok(r.steps.every(x=>x.timer_seconds===null));assert.match(r.steps[1].instruction,/20-minute phase/);assert.match(r.steps[3].instruction,/7-minute phase/);assert.match(r.story,/not a 27-minute total/);assert.match(r.story,/fill, liquid and release/);assert.match(r.story,/indexed printed pages 38–39/);assert.match(r.story,/full PDF and page images were not inspected/);assert.match(r.story,/spaghetti, beans and peas are omitted/);
 const html=owner.buildRecipePageHtml(fixture('mchemsho-tz'),{...manifest,recipes:[fixture('mchemsho-tz')]},api,{},audit,null);assert.match(html,/Source quantities; portions not recorded/);assert.doesNotMatch(html,/6 servings|6 people|27 minutes total/);
});
test('Octopus retains four author servings and approximate 20/90 estimates without inventing total or ingredients',()=>{
 const r=api.projectAttributedRecipe(fixture('octopus-curry-sc'));
 assert.equal(r.default_servings,4);assert.equal(r.serving_unit,'servings');assert.deepEqual(api.getRecipeTiming(r),{prep:20,cook:90,total:null});
 assert.equal(r.ingredients[0].name,'cleaned raw octopus');assert.match(r.ingredients[0].prep_note,/2–3 lb/);assert.match(r.story,/ingredient list describes boiled octopus/);assert.match(r.story,/includes that preboil/);assert.match(r.story,/cilantro garnish is omitted/);assert.match(r.story,/Water is selected instead of fish stock/);
 assert.equal(r.ingredients.find(x=>x.name==='water').amount,.5);assert.equal(r.ingredients.find(x=>x.name==='coconut milk').prep_note,'13.5 oz source can');assert.equal(r.ingredients.some(x=>/aubergine|eggplant|cilantro|fish stock/.test(x.name)),false);
 assert.deepEqual(r.steps.filter(x=>x.timer_seconds).map(x=>x.timer_seconds),[1800,1200,300]);assert.ok(r.steps.filter(x=>x.timer_seconds).every(x=>/Check/.test(x.timer_label)));
});
test('gap-fill source rows cannot regenerate the four superseded generic methods or manufacture publication',()=>{
 const source=fs.readFileSync(path.join(ROOT,'scripts/build-afrokitchen-gap-fill-wave-1.js'),'utf8');let generated;
 vm.runInNewContext(source,{require:name=>name==='fs'?{mkdirSync(){},writeFileSync(file,text){assert.equal(generated,undefined);generated=JSON.parse(text)}}:name==='path'?path:(()=>{throw new Error('Unexpected dependency '+name)})(),__dirname:path.join(ROOT,'scripts'),console:{log(){}}});
 assert.equal(generated.recipes.length,100);
 for(const slug of Object.keys(RECOVERY_METHODS)) {
  const sourceRow=generated.recipes.find(x=>x.slug===slug),projected=api.projectAttributedRecipe(fixture(slug));
  for(const k of ['name','description','story','source','image_url','image_alt','diet_tags','prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','serving_unit','yield_status','calories','protein_g','carbs_g','fat_g','fiber_g','method_revision'])assert.deepEqual(sourceRow[k],projected[k],slug+':'+k);
  const plainChildren=rows=>rows.map(({id,recipe_id,created_at,...rest})=>rest);for(const k of ['ingredients','steps'])assert.deepEqual(sourceRow[k],plainChildren(projected[k]));
  for(const k of ['id','is_published','is_verified'])assert.equal(Object.hasOwn(sourceRow,k),false);
 }
 for(const slug of ['kisra-south-sudan-ss','maheu-zm']) {const r=generated.recipes.find(x=>x.slug===slug);assert.equal(r.method_review_status,'pending-source-method');assert.deepEqual(r.ingredients,[]);assert.deepEqual(r.steps,[]);assert.deepEqual(r.diet_tags,[]);for(const k of ['prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','serving_unit','calories'])assert.equal(r[k],null);for(const k of ['id','is_published','is_verified'])assert.equal(Object.hasOwn(r,k),false);}
});

test('the actual cuisine-source audit guard rejects missing, wrong-ID or stale method evidence for both recoveries',()=>{
 const source=actualFunction('scripts/lib/afrokitchen-cuisine-intelligence.js','curatedMethodProfile');
 for(const slug of Object.keys(RECOVERY_METHODS)) {
  const recipe=api.projectAttributedRecipe(fixture(slug)),context={recipeMethods:api};vm.runInNewContext(source+';invoke=curatedMethodProfile',context);
  assert.deepEqual(plain(context.invoke(recipe,audit)).chefNotes,{common_mistakes:[],readiness_cues:[],pantry_notes:[],technique_notes:[],serve_with:''});
  for(const bad of [{},{[slug]:{...audit[slug],expected_recipe_id:'wrong'}},{[slug]:{...audit[slug],method_revision:'stale'}},{[slug]:{...audit[slug],curated_method:false}}])assert.throws(()=>context.invoke(recipe,bad),/identity\/revision\/audit mismatch/);
 }
});
