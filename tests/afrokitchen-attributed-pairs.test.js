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
test('all other406 recipe projections, index summaries and source identities remain coherent',()=>{
  assert.equal(manifest.recipes.length,410);
  const allowed=manifest.recipes.map(row=>({...row,is_published:true,is_verified:true,generated_in_wave:true}));
  const result=indexOwner.buildRecipeIndex({...manifest,recipes:allowed});
  assert.equal(result.recipes.length,410);
  for(const row of allowed.filter(r=>!IDS[r.slug] && !(r.id==='d7d7e305-3c5d-40db-9033-36843e102176' && r.slug==='ibihaza-rw') && !(r.id==='feabebb3-cd55-48c6-be9a-17f118dddfcc' && r.slug==='kat-kat-banane-sc'))) {
    const additional=[['ndizi-nyama-tz','63325da8-6678-414f-b431-f88d8d6b2fe1','ndizi-darlene-international-cuisine-20261017-v1'],['latchiri-kossan-gn','91740809-c813-417e-8af4-c5c7c989c1be','latchiri-gassama-maize-cultured-milk-20261017-v1']].find(([slug,id])=>row.slug===slug&&row.id===id);
    if(additional){const projected=api.projectAttributedRecipe(row);assert.ok(api.isAttributedRecipe(projected));assert.equal(projected.method_revision,additional[2]);}
    else if ((row.id==='8a2bb743-87d9-462e-bc09-335e78f9584a'&&row.slug==='kunu-zaki-ng')||(row.id==='f2850789-0ffd-41b3-bbaf-e3229132c9e6'&&row.slug==='ikivuguto-rw')) {
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
