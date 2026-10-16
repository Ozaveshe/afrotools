"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const acorn = require('acorn');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const { classifyRecipeDuration, normalizeRecipe, resolveRecipeMedia } = require('../scripts/lib/afrokitchen-static');
const owner = require('../scripts/generate-afrokitchen-static-pages');
const audit = JSON.parse(read('data/afrokitchen/recipe-research-audit.json')).recipes;
const manifest = JSON.parse(read('tools/afrokitchen/seo-manifest.json'));
const original = manifest.recipes.find(row => row.slug === 'oleleh-sl');
function engine(file = 'engines/src/afrokitchen-engine.js') {
  const context = { window: { navigator: { onLine: false } }, console, setInterval, clearInterval };
  vm.runInNewContext(read(file), context);
  return context.AfroKitchenEngine;
}
const api = engine();
const recipe = () => owner.applyRecipeResearchPatch(structuredClone(original), audit);
function runtimeFunction(name, file = 'tools/afrokitchen/static-recipe-runtime.js') {
  const source=read(file);
  const ast=acorn.parse(source,{ecmaVersion:'latest'});
  let found;
  function visit(node) {
    if(!node||typeof node!=='object') return;
    if(node.type==='FunctionDeclaration'&&node.id?.name===name) found=source.slice(node.start,node.end);
    for(const value of Object.values(node)) if(Array.isArray(value)) value.forEach(visit); else if(value&&typeof value==='object') visit(value);
  }
  visit(ast);assert.ok(found,name);return found;
}

test('source and served engine classify real measurements without coercing unknown or invalid values', () => {
  const cases = [[null,'unknown'],[undefined,'unknown'],['','unknown'],['  ','unknown'],[0,'known'],['0','known'],[40,'known'],[' 40 ','known'],[false,'invalid'],[true,'invalid'],[-1,'invalid'],[Infinity,'invalid'],[NaN,'invalid'],[{},'invalid'],[[],'invalid'],['no','invalid']];
  for (const file of ['engines/src/afrokitchen-engine.js','engines/afrokitchen-engine.js']) {
    const served = engine(file);
    for (const [value, kind] of cases) {
      assert.equal(served.classifyRecipeDuration(value).kind, kind, file);
      assert.equal(classifyRecipeDuration(value).kind, kind);
    }
    assert.deepEqual(plain(served.getRecipeTiming({prep_time_minutes:null,cook_time_minutes:40,total_time_minutes:null})), {prep:null,cook:40,total:null});
    assert.deepEqual(plain(served.getRecipeTiming({prep_time_minutes:30,cook_time_minutes:65,total_time_minutes:95})), {prep:30,cook:65,total:95});
    assert.equal(served.getRecipeTiming({prep_time_minutes:30,cook_time_minutes:65}).total, null);
  }
});

test('optional schema times are a measured pair or an independent total, never cook alone', () => {
  const base = recipe();
  const unknown = api.getStructuredData(base, 6);
  for (const field of ['prepTime','cookTime','totalTime']) assert.equal(Object.hasOwn(unknown, field), false);
  const totalOnly = api.getStructuredData({...base,total_time_minutes:65}, 6);
  assert.equal(totalOnly.totalTime,'PT65M');
  assert.equal(Object.hasOwn(totalOnly,'cookTime'),false);
  const known = api.getStructuredData({...base,prep_time_minutes:30,cook_time_minutes:65,total_time_minutes:95},6);
  assert.deepEqual([known.prepTime,known.cookTime,known.totalTime],['PT30M','PT65M','PT95M']);
  const zero = api.getStructuredData({...base,prep_time_minutes:0,cook_time_minutes:0,total_time_minutes:0},6);
  assert.deepEqual([zero.prepTime,zero.cookTime,zero.totalTime],['PT0M','PT0M','PT0M']);
  for (const value of [false,true,-1,Infinity,NaN]) assert.equal(api.getStructuredData({...base,prep_time_minutes:value},6),null);
});

test('one curated identity is protected, eligible flags stay unchanged and inputs are not mutated', () => {
  const before = structuredClone(original);
  const target = recipe();
  assert.deepEqual(original,before);
  assert.equal(target.id,'ee3d60da-f4cd-4955-955f-987c0912dc34');
  assert.equal(target.is_published,true);
  assert.equal(target.is_verified,true);
  assert.throws(() => owner.applyRecipeResearchPatch({...original,id:'wrong'},audit),/identity/);
  const forbidden = structuredClone(audit);
  forbidden['oleleh-sl'].static_recipe_patch.recipe.is_verified = false;
  assert.throws(() => owner.applyRecipeResearchPatch(original,forbidden),/protected/);
  const other = {id:'other',slug:'unrelated',prep_time_minutes:30,cook_time_minutes:65,total_time_minutes:95};
  assert.deepEqual(owner.applyRecipeResearchPatch(other,audit),other);
  assert.equal(normalizeRecipe({...before,prep_time_minutes:null,cook_time_minutes:40,total_time_minutes:null}).total_time_minutes,null);
  assert.equal(normalizeRecipe({...before,prep_time_minutes:0,cook_time_minutes:0,total_time_minutes:0}).total_time_minutes,0);
});

test('the native method has nine independently structured ingredients, six steps and one approximate check', () => {
  const target = recipe();
  assert.deepEqual(target.ingredients.map(row=>[row.amount,row.unit,row.name]),[[1,'cup','dried black-eyed beans'],[1,'whole','red onion'],[3,'cloves','garlic'],[1,'whole','green pepper'],[1,'whole','red pepper'],[1,'whole','carrot'],[2,'tablespoons','olive oil'],[1,'teaspoon','salt'],[0.5,'cup','blending water']]);
  assert.deepEqual(target.steps.map(row=>row.timer_seconds),[null,null,null,null,null,2400]);
  assert.match(target.steps[1].instruction,/200°C/);
  assert.match(target.steps[5].instruction,/about 40 minutes/);
  assert.match(target.steps[5].instruction,/firm.*knife/);
  assert.doesNotMatch(target.steps.map(row=>row.instruction).join(' '),/fry|shallow-fry/);
  assert.equal(target.prep_time_minutes,null);
  assert.equal(target.total_time_minutes,null);
  assert.deepEqual(target.diet_tags,[]);
  for (const field of ['calories','protein_g','carbs_g','fat_g','fiber_g']) assert.equal(target[field],null);
  assert.equal(api.scaleNutrition(target,6),null);
});

test('local image winner and gallery keep the same honest AI caption', () => {
  const target = recipe(), media = resolveRecipeMedia(target,{});
  assert.equal(media.pageImage,target.image_url);
  assert.equal(media.illustrationCaption,target.media[0].caption);
  assert.equal(api.getRecipeIllustrationCaption(target),target.media[0].caption);
  assert.equal(api.getRecipeIllustrationCaption({...target,image_url:'/wrong.webp'}),'');
  const gallery = owner.collectRecipeGalleryImages(target,media,{});
  const hero = gallery.find(row=>row.src===target.image_url);
  assert.match(hero.caption,/AI-generated serving illustration/);
  assert.equal(gallery.filter(row=>row.src===target.image_url).length,1);
  for (const [file,expected] of [['assets/img/kitchen/oleleh-sl.webp','92bc589db268610ca9e96e61b17cdf528ca22cb787911c40d194a6db4539bafb'],['assets/img/kitchen/responsive/oleleh-sl-640.webp','ce5022eed5223bf1c97fd16280815391eb1002899e5b5430f02fdb04384a5df5']]) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),expected);
});

test('actual page owner emits honest optional timing, visible attribution and escaped hero disclosure', () => {
  const target=recipe();
  const html=owner.buildRecipePageHtml(original,manifest,api,{},audit,null);
  assert.match(html,/About 40 min cook/);
  assert.match(html,/Not recorded prep/);
  assert.match(html,/AI-generated serving illustration/);
  assert.match(html,/credited to Isata by Healthy Living Platform/);
  assert.doesNotMatch(html,/PTnullM|PTundefinedM|0 min prep/);
  assert.doesNotMatch(html,/Best for everyday meals|Every household has small variations/);
  assert.match(html,/An occasion has not been documented/);
  assert.match(html,/Regional variations have not been documented/);
  const nodes=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(row=>JSON.parse(row[1]));
  const schema=nodes.find(row=>row['@type']==='Recipe');
  assert.ok(schema);
  for (const field of ['prepTime','cookTime','totalTime','nutrition']) assert.equal(Object.hasOwn(schema,field),false);
  assert.match(html,/<meta name="robots" content="index, follow">/);
  const malicious=structuredClone(audit);
  malicious['oleleh-sl'].static_recipe_patch.recipe.media[0].caption='<img src=x onerror=alert(1)>';
  const escaped=owner.buildRecipePageHtml(original,manifest,api,{},malicious,null);
  assert.match(escaped,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(escaped,/<img src=x onerror=alert\(1\)>/);
});

test('dynamic detail loads media only for the eligible returned UUID and refuses wrong-owner media', async () => {
  for (const wrongOwner of [false,true]) {
    const target=recipe(), filters=[];
    const client={from(table) {
      const query={select(){return this},eq(key,value){filters.push([table,key,value]);return this},order(){return this},limit(){return this},maybeSingle(){return Promise.resolve({data:target,error:null})},then(resolve){
        const data=table==='recipe_ingredients'?target.ingredients:table==='recipe_steps'?target.steps:table==='recipe_media'?target.media.map(row=>({...row,recipe_id:wrongOwner?'wrong':target.id})):[];
        return Promise.resolve({data,error:null}).then(resolve);
      }};return query;
    },rpc(){return Promise.resolve()}};
    const auth={getSupabase:()=>client};
    const context={AfroAuth:auth,window:{AfroAuth:auth,navigator:{onLine:true},fetch:async()=>({ok:true,json:async()=>({version:2,recipes:[target]})})},console:{warn(){}},Promise,Date,setTimeout,clearTimeout,AbortController};
    vm.runInNewContext(read('engines/src/afrokitchen-engine.js'),context);
    const detail=await context.AfroKitchenEngine.fetchRecipeBySlug(target.slug);
    assert.ok(filters.some(row=>row[0]==='recipe_media'&&row[1]==='recipe_id'&&row[2]===target.id));
    assert.ok(filters.some(row=>row[0]==='recipes'&&row[1]==='is_published'&&row[2]===true));
    assert.ok(filters.some(row=>row[0]==='recipes'&&row[1]==='is_verified'&&row[2]===true));
    if(wrongOwner) assert.equal(detail.publicationUnavailable,true);
    else assert.equal(context.AfroKitchenEngine.getRecipeIllustrationCaption(detail),target.media[0].caption);
  }
});

test('API detail media is UUID-scoped and never masks a transport or owner failure', async () => {
  for(const wrongOwner of [false,true]) {
    const target=recipe(), urls=[];
    const context={exports:{},require:specifier=>{assert.equal(specifier,'../../engines/src/afrokitchen-engine');return require('../engines/src/afrokitchen-engine');},process:{env:{SUPABASE_AUTH_SERVICE_KEY:'synthetic-local-test-only'}},fetch:async url=>{
      urls.push(url);
      const table=new URL(url).pathname.split('/').at(-1);
      const body=table==='recipes'?[target]:table==='recipe_media'?target.media.map(row=>({...row,recipe_id:wrongOwner?'wrong':target.id})):table==='recipe_ingredients'?target.ingredients:table==='recipe_steps'?target.steps:[];
      return {ok:true,json:async()=>body};
    }};
    vm.runInNewContext(read('netlify/functions/afrokitchen-recipes.js'),context);
    const result=await context.exports.handler({httpMethod:'GET',headers:{},queryStringParameters:{action:'get',slug:target.slug}});
    assert.equal(result.statusCode,wrongOwner?500:200);
    assert.ok(urls.some(url=>url.includes('/recipe_media?recipe_id=eq.'+target.id)));
    assert.ok(urls[0].includes('is_published=eq.true')&&urls[0].includes('is_verified=eq.true'));
    if(!wrongOwner) assert.equal(JSON.parse(result.body).media[0].caption,target.media[0].caption);
  }
});

test('old frying timer and checked state never attach to the revised method; portions and old records survive', () => {
  const target=recipe(), base='ak_static_recipe_oleleh-sl_v2';
  const old={servings:9,checked:{'old-paste-row':true},timers:{'3':{total:840,remaining:600,running:true}}};
  const store=new Map([[base,JSON.stringify(old)],['saved-favourites','preserve'],['notes','preserve']]);
  const before=[...store];
  const context={n:target,e:{localStorage:{getItem:key=>store.get(key)||null}},E:(value,min,max)=>Math.max(min,Math.min(max,value))};
  vm.runInNewContext(runtimeFunction('recipeRuntimeStateKey')+';'+runtimeFunction('loadRecipeRuntimeState')+';result=loadRecipeRuntimeState();key=recipeRuntimeStateKey();',context);
  assert.notEqual(context.key,base);
  assert.deepEqual(plain(context.result),{servings:9,checked:{},timers:{}});
  assert.deepEqual([...store],before);
  const valid={total:2400,remaining:2300,running:true};
  store.set(context.key,JSON.stringify({servings:8,checked:{'new-bean-row':true},timers:{'3':old.timers['3'],'6':valid}}));
  vm.runInNewContext('result=loadRecipeRuntimeState();',context);
  assert.deepEqual(plain(context.result.timers),{'6':valid});
  assert.equal(context.result.checked['new-bean-row'],true);
  const legacyContext={...context,n:{...target,method_revision:undefined}};
  vm.runInNewContext(runtimeFunction('recipeRuntimeStateKey')+';'+runtimeFunction('loadRecipeRuntimeState')+';result=loadRecipeRuntimeState();',legacyContext);
  assert.deepEqual(plain(legacyContext.result),old);
});

test('the actual local export function keeps attribution, complete method and unknown times', () => {
  const target=recipe();
  const context={n:target,i:api,s:{servings:6},e:{location:{href:'http://127.0.0.1/recipe-test'}},f:()=>api.scaleIngredients(target.ingredients,6,6)};
  vm.runInNewContext(runtimeFunction('recipeExportText')+';result=recipeExportText();',context);
  assert.match(context.result,/Time: Not recorded/);
  assert.match(context.result,/Prep: Not recorded/);
  assert.match(context.result,/Cook: About 40 min/);
  assert.match(context.result,/credited to Isata by Healthy Living Platform/);
  assert.match(context.result,/AI-generated serving illustration/);
  for(const step of target.steps) assert.ok(context.result.includes(step.instruction));
  assert.doesNotMatch(context.result,/Time: 40|Time: 0|25 minutes|fry/i);
});


test('standalone JSON-LD validator uses strict source-matched optional durations', () => {
  const {validateDurationSchema} = require('../scripts/validate-afrokitchen-recipe-jsonld');
  const target = recipe();
  assert.deepEqual(validateDurationSchema(target,{}),[]);
  for (const field of ['prepTime','cookTime','totalTime']) {
    for (const value of [null,'',false,'PT0M','PT40M','PTNaNM']) assert.ok(validateDurationSchema(target,{[field]:value}).length,field+':'+value);
  }
  const known={...target,prep_time_minutes:30,cook_time_minutes:65,total_time_minutes:95};
  const schema={prepTime:'PT30M',cookTime:'PT65M',totalTime:'PT95M'};
  assert.deepEqual(validateDurationSchema(known,schema),[]);
  for(const field of Object.keys(schema)) {
    const missing={...schema};delete missing[field];assert.ok(validateDurationSchema(known,missing).length);
    assert.ok(validateDurationSchema(known,{...schema,[field]:'PT1M'}).length);
  }
  assert.deepEqual(validateDurationSchema({...target,total_time_minutes:95},{totalTime:'PT95M'}),[]);
  assert.deepEqual(validateDurationSchema({...target,prep_time_minutes:0,cook_time_minutes:0,total_time_minutes:0},{prepTime:'PT0M',cookTime:'PT0M',totalTime:'PT0M'}),[]);
  for(const value of [false,true,-1,Infinity,NaN,'bad']) assert.ok(validateDurationSchema({...target,prep_time_minutes:value},{}).length);
  for(const field of ['best_served_with','occasion','regional_variations']) assert.equal(target[field],null);
});


test('curated intelligence is source-specific while ordinary recipe advice stays unchanged', () => {
  const {buildCuisineIntelligence} = require('../scripts/lib/afrokitchen-cuisine-intelligence');
  const target=recipe();
  const subset={recipes:[target],countries:[],collections:[]};
  const current=buildCuisineIntelligence(subset,{researchAudit:audit}).recipes[target.slug];
  assert.deepEqual(current.chef_notes.common_mistakes,[]);
  assert.deepEqual(current.chef_notes.pantry_notes,[]);
  assert.deepEqual(current.chef_notes.technique_notes,[]);
  assert.equal(current.chef_notes.serve_with,'');
  assert.match(current.chef_notes.readiness_cues[0],/firm.*knife.*clean/);
  assert.deepEqual(current.menu_tags,['black-eyed-beans','oven-water-bath','snack','sierra-leone']);
  assert.throws(()=>buildCuisineIntelligence({recipes:[{...target,id:'wrong'}]},{researchAudit:audit}),/identity/);
  assert.throws(()=>buildCuisineIntelligence({recipes:[{...target,method_revision:'wrong'}]},{researchAudit:audit}),/revision/);
  const ordinary=manifest.recipes.find(row=>row.slug!=='oleleh-sl');
  const input={recipes:[ordinary],countries:[],collections:[]};
  const a=buildCuisineIntelligence(input,{researchAudit:audit}).recipes[ordinary.slug];
  const clean=structuredClone(audit);delete clean['oleleh-sl'];
  const b=buildCuisineIntelligence(input,{researchAudit:clean}).recipes[ordinary.slug];
  assert.deepEqual(a,b);
});


test('dynamic cooking timers are fresh memory and never restore legacy static frying state', () => {
  const source=read('tools/afrokitchen/recipe-page.js');
  const ast=acorn.parse(source,{ecmaVersion:'latest'}), forbidden=new Set(['localStorage','sessionStorage','getItem','setItem']);
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='MemberExpression')assert.equal(forbidden.has(node.property.name||node.property.value),false);for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
  visit(ast);
  const previous=engine(), old=previous.createTimer(840,'Old frying step');
  assert.equal(previous.getTimer(old).totalSeconds,840);
  const fresh=engine();assert.equal(fresh.getTimer(old),null);
  const current=fresh.createTimer(recipe().steps[5].timer_seconds,'Current bake check');
  assert.equal(fresh.getTimer(current).totalSeconds,2400);
  assert.equal(fresh.getTimer(current).running,false);
});


test('actual dynamic schema assignment clears invalid-source null and preserves valid object JSON', () => {
  const source=read('tools/afrokitchen/recipe-page.js'),ast=acorn.parse(source,{ecmaVersion:'latest'});
  let assignment;
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&node.left.property.name==='textContent'&&node.left.object.type==='CallExpression'&&node.left.object.arguments[0]?.value==='recipe-schema'){assert.equal(assignment,undefined);assignment=source.slice(node.start,node.end);}for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
  visit(ast);assert.ok(assignment);
  const box={textContent:'stale previous schema'};
  const context={p:id=>{assert.equal(id,'recipe-schema');return box},h:api.getStructuredData({...recipe(),prep_time_minutes:false},6)};
  assert.equal(context.h,null);vm.runInNewContext(assignment,context);assert.equal(box.textContent,'');
  context.h=api.getStructuredData({...recipe(),prep_time_minutes:0,cook_time_minutes:0,total_time_minutes:0},6);
  vm.runInNewContext(assignment,context);assert.equal(box.textContent,JSON.stringify(context.h));assert.equal(JSON.parse(box.textContent).totalTime,'PT0M');
});


test('actual dynamic community stats initializes with an ordinary DOM node for unknown, known and zero times', () => {
  for(const [times,expected] of [[{prep_time_minutes:null,cook_time_minutes:40,total_time_minutes:null},'Not recorded'],[{prep_time_minutes:30,cook_time_minutes:65,total_time_minutes:95},'95 min'],[{prep_time_minutes:0,cook_time_minutes:0,total_time_minutes:0},'0 min']]) {
    const box={innerHTML:''},target={...recipe(),...times};
    const context={AfroKitchenEngine:api,p:id=>{assert.equal(id,'community-stats');return box},w:()=>null,b:()=>0,d:{cooksnaps:[]},i:target,I:(label,value)=>label+':'+value+';'};
    vm.runInNewContext(runtimeFunction('communityMethodUnlinked','tools/afrokitchen/recipe-page.js')+';'+runtimeFunction('U','tools/afrokitchen/recipe-page.js')+';U();',context);
    assert.ok(box.innerHTML.includes('Total cook time:'+expected));
    assert.ok(box.innerHTML.includes('Timed steps:1'));
  }
});

test('selected hero credit, link, alt and caption match the approved native content exactly', () => {
  const hero=recipe().media[0];
  assert.equal(hero.credit_text,'AfroTools — AI-generated illustration');
  assert.equal(hero.credit_url,null);
  assert.equal(hero.alt_text,'AI illustration of two moulded Oleleh puddings, one cut open, with coloured vegetable pieces.');
  assert.equal(hero.caption,'AI-generated serving illustration for this proposed adaptation; not a cooking photograph or kitchen-tested result.');
});
