"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),acorn=require('acorn');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const api=require('../engines/src/afrokitchen-engine'),owner=require('../scripts/generate-afrokitchen-static-pages'),indexOwner=require('../scripts/lib/afrokitchen-recipe-index');
const manifest=require('../tools/afrokitchen/seo-manifest.json'),audit=require('../data/afrokitchen/recipe-research-audit.json').recipes;
const IDS={'ibihaza-rw':'d7d7e305-3c5d-40db-9033-36843e102176','kat-kat-banane-sc':'feabebb3-cd55-48c6-be9a-17f118dddfcc'};
const source=slug=>({...structuredClone(manifest.recipes.find(r=>r.slug===slug)),is_published:true,is_verified:true});
const projected=slug=>api.projectAttributedRecipe(source(slug));
function actual(name,file='tools/afrokitchen/recipe-page.js'){
 const raw=read(file),text=file.endsWith('.html')?[...raw.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).find(x=>x.includes('function '+name+'(')):raw;
 const ast=acorn.parse(text,{ecmaVersion:'latest'});let found;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name===name)found=text.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(ast);assert.ok(found,name);return found;
}
function browserEngine(client,index,extra={}){const ctx={window:{AfroAuth:{getSupabase:()=>client},navigator:{onLine:!!client}},console:{warn(){}},fetch:async()=>({ok:true,json:async()=>({version:2,recipes:index})}),Date,setTimeout,clearTimeout,...extra};ctx.AfroAuth=ctx.window.AfroAuth;ctx.window.fetch=ctx.fetch;vm.runInNewContext(read('engines/src/afrokitchen-engine.js'),ctx);return ctx.AfroKitchenEngine;}
for(const slug of Object.keys(IDS)){
 test(slug+': exact public identity gets one attributed method without mutating parent authority',()=>{
  const parent=source(slug),before=structuredClone(parent),r=api.projectAttributedRecipe(parent);assert.ok(api.isAttributedRecipe(r));assert.equal(parent.id,IDS[slug]);assert.deepEqual(parent,before);
  for(const k of ['id','slug','is_published','is_verified','created_at','updated_at','view_count'])assert.deepEqual(r[k],before[k],k);
  assert.deepEqual(owner.applyRecipeResearchPatch(parent,audit),r);assert.equal(r.reviews.length,0);assert.equal(r.avg_rating,null);assert.equal(r.review_count,0);assert.deepEqual(r.diet_tags,[]);
  for(const k of ['calories','protein_g','carbs_g','fat_g','fiber_g'])assert.equal(r[k],null);
  for(const rows of [r.ingredients,r.steps,r.media])assert.ok(rows.every(x=>x.recipe_id===IDS[slug]));
  for(const patch of [{id:'wrong'},{is_published:false},{is_verified:false},{is_verified:null},{is_published:undefined}]){assert.equal(api.projectAttributedRecipe({...parent,...patch}),null);assert.throws(()=>owner.applyRecipeResearchPatch({...parent,...patch},audit),/eligibility/);}
  assert.equal(api.isAttributedRecipe({...r,method_revision:'wrong'}),false);
 });
 test(slug+': actual static owner and TXT render the same measured method and honest illustration',()=>{
  const r=projected(slug);assert.ok(api.isAttributedRecipe(r));const html=owner.buildRecipePageHtml(source(slug),{...manifest,recipes:[source(slug)]},api,{},audit,null);
  assert.match(html,/AI-generated serving illustration/);assert.ok(html.includes(r.steps[0].instruction));assert.ok(html.includes(r.source));assert.ok(html.includes(r.image_alt));
  const ctx={n:r,i:api,s:{servings:r.default_servings||1},e:{location:{href:'http://localhost/fixture'}},f:()=>api.scaleIngredients(r.ingredients,r.default_servings||1,r.default_servings||1)};
  vm.runInNewContext(actual('recipeExportText','tools/afrokitchen/static-recipe-runtime.js')+';result=recipeExportText();',ctx);assert.ok(ctx.result.includes(r.steps[0].instruction));assert.match(ctx.result,/AI-generated serving illustration/);assert.doesNotMatch(ctx.result,/NaN|\bnull\b|0 as needed/);
  if(slug==='ibihaza-rw'){assert.match(html,/Yield<\/div><div class="ak-stat-val">Not recorded/);assert.match(html,/class="ak-servings" hidden/);assert.match(ctx.result,/Yield: Not recorded/);assert.doesNotMatch(ctx.result,/Serves [168]|Prep: 0 min/);}
  else{assert.match(ctx.result,/Servings: 4 servings/);assert.match(ctx.result,/Time: 60 minutes/);}
 });
 test(slug+': actual index and browser online/offline detail agree and suppress old-method price/rating',async()=>{
  const parent=source(slug),r=projected(slug);assert.ok(api.isAttributedRecipe(r));const idx=indexOwner.buildRecipeIndex({...manifest,recipes:[{...parent,generated_in_wave:true}]}).recipes;
  assert.equal(idx[0].method_revision,r.method_revision);assert.deepEqual(idx[0].curated_detail.fields.ingredients,r.ingredients);
  const offline=browserEngine(null,idx);assert.deepEqual(plain((await offline.fetchRecipeBySlug(slug)).ingredients),r.ingredients);
  const client={from(table){const z={select(){return z},eq(){return z},order(){return z},limit(){return z},maybeSingle:async()=>({data:{...parent,avg_rating:5,review_count:7}}),then(done){return Promise.resolve({data:table==='recipe_reviews'?[{rating:5}]:[]}).then(done)}};return z},rpc:()=>Promise.resolve()};
  const online=browserEngine(client,idx),detail=await online.fetchRecipeBySlug(slug);assert.deepEqual(plain(detail.ingredients),r.ingredients);assert.deepEqual(plain(detail.media),r.media);assert.equal(detail.avg_rating,null);assert.deepEqual(plain(await online.fetchIngredientPrices(parent.id,parent.country_code)),[]);
  assert.equal(Object.hasOwn(plain(api.getStructuredData({...r,avg_rating:5,review_count:7},4)),'aggregateRating'),false);
 });
}
test('source quantities and unknowns are not inherited editorial yield or generic mixed-ingredient stew',()=>{
 const i=projected('ibihaza-rw'),k=projected('kat-kat-banane-sc');assert.equal(i.default_servings,null);assert.equal(i.yield_status,'not-recorded');assert.deepEqual(api.getRecipeTiming(i),{prep:null,cook:null,total:null});
 assert.deepEqual(i.ingredients.slice(0,4).map(x=>[x.amount,x.unit,x.name]),[[3,'tbsp','olive oil'],[1,'cup','purple onion'],[5,'cups','pie pumpkin'],[3,'lb','cooked beans']]);
 assert.equal(i.ingredients.find(x=>x.name==='water').amount,3);assert.match(i.ingredients.find(x=>x.name==='water').prep_note,/up to 1 cup/);assert.ok(i.ingredients.filter(x=>/salt|black pepper/.test(x.name)).every(x=>x.amount===null));assert.ok(!i.ingredients.some(x=>/tomato|peanut/.test(x.name)));assert.deepEqual(i.steps.map(x=>x.timer_seconds),[null,null,300,900]);
 assert.equal(k.default_servings,4);assert.deepEqual(api.getRecipeTiming(k),{prep:15,cook:45,total:60});assert.deepEqual(k.ingredients.slice(0,4).map(x=>[x.amount,x.unit,x.name]),[[500,'g','boneless trevally'],[4,'pieces','unripe plantains'],[800,'ml','coconut milk'],[2,'pieces','cinnamon leaves']]);assert.match(k.steps[1].instruction,/unpeeled/);assert.match(k.steps.at(-1).instruction,/Remove cinnamon/);assert.ok(!k.ingredients.some(x=>/tomato|onion/.test(x.name)));
});
test('unknown yield survives index summary, schema and actual captured print without invented portions',()=>{
 const r=projected('ibihaza-rw');assert.equal(r.yield_status,'not-recorded');const idx=indexOwner.buildRecipeIndex({recipes:[{...source('ibihaza-rw'),generated_in_wave:true}]}).recipes[0];assert.equal(idx.yield_status,'not-recorded');assert.equal(idx.default_servings,null);
 const schema=plain(api.getStructuredData(r,8));for(const k of ['recipeYield','prepTime','cookTime','totalTime','nutrition'])assert.equal(Object.hasOwn(schema,k),false,k);
 let html='';const engine=browserEngine(null,[],{window:{open:()=>({document:{write:s=>html=s,close(){}},print(){}})}});engine.printRecipe(r,8);assert.match(html,/Yield not recorded; source quantities/);assert.match(html,/Time not recorded/);assert.match(html,/3 tbsp olive oil/);assert.doesNotMatch(html,/Serves [168]|null min|NaN|Prep: 0/);
});
const pf='tools/afrokitchen/index.html';const guard=()=>actual('hasUnrecordedPlanYield',pf);
test('planner denies stale online Ibihaza and unknown projected detail at admission/detail/output boundaries',async()=>{
 const ctx={};vm.runInNewContext(guard()+['isPlanMeal','matchesPlan','fetchRecipeDetails','buildPlanText','recipeIngredientsByGroup','buildGroupedShoppingList'].map(n=>actual(n,pf)).join('\n'),ctx);
 for(const r of [source('ibihaza-rw'),projected('ibihaza-rw'),{id:IDS['ibihaza-rw'],category:'main'},{slug:'ibihaza-rw',category:'main'}]){assert.equal(ctx.isPlanMeal(r),false);assert.equal(ctx.matchesPlan(r,{}),false);await assert.rejects(ctx.fetchRecipeDetails(r),/person-yield/);assert.match(ctx.buildPlanText([r],{servings:8}),/Plan unavailable/);assert.deepEqual(plain(ctx.recipeIngredientsByGroup(r,8)),[]);assert.deepEqual(plain(ctx.buildGroupedShoppingList([r],8)),{});}
 assert.equal(ctx.isPlanMeal({slug:'oleleh-sl',category:'main',default_servings:6}),true);assert.equal(ctx.isPlanMeal(projected('kat-kat-banane-sc')),true);
});
test('actual saved and locked plan recovery preserves user choices rather than applying fabricated portions',async()=>{
 const saved={slugs:['ibihaza-rw'],inputs:{servings:8},lockedSlugs:['ibihaza-rw']},messages=[];const ctx={readSavedPlan:()=>saved,mealPlannerRecipes:[source('ibihaza-rw')],planGenerationRevision:0,setPlanStatus:x=>messages.push(x)};
 vm.runInNewContext(guard()+actual('restoreSavedPlan',pf)+';operation=restoreSavedPlan();',ctx);await ctx.operation;assert.deepEqual(saved,{slugs:['ibihaza-rw'],inputs:{servings:8},lockedSlugs:['ibihaza-rw']});assert.match(messages[0],/remains saved/);
 const statuses=[],states=[],r=source('ibihaza-rw'),g={planGenerationRevision:0,invalidatePlanCopy(){},validatePlanServings:()=>true,document:{getElementById:()=>({dataset:{state:'idle'}})},getPlanInputs:()=>({days:3,maxTime:999,servings:8}),mealPlannerRecipes:[{slug:'known',category:'main'}],setPlanButtonState:x=>states.push(x),setPlanStatus:x=>statuses.push(x),recipeTotalMinutes:()=>30,readPickedRecipes:()=>[],pickedRecipesStorageIssue:false,isStarchLedPlanMeal:()=>false,planGenerationCount:0,scoreRecipe:()=>1,currentPlanInputs:{days:3,maxTime:999,servings:8},currentPlanRecipes:[r],planLocks:{'ibihaza-rw':true}};
 vm.runInNewContext(guard()+['isPlanMeal','matchesPlan','generateMealPlan'].map(n=>actual(n,pf)).join('\n')+';operation=generateMealPlan();',g);await g.operation;assert.equal(g.currentPlanRecipes[0],r);assert.match(statuses.at(-1),/locked choices remain unchanged/);assert.equal(states.at(-1),'idle');
});
test('actual contribution and community handlers suppress legacy method proof before getters/POST',async()=>{
 for(const slug of Object.keys(IDS)){const r=projected(slug);assert.ok(api.isAttributedRecipe(r));const nodes={},ctx={i:{...r,avg_rating:5,review_count:7},e:api,AfroKitchenEngine:api,d:{averageRating:5,reviewCount:7,reviews:[{}],cooksnaps:[{}]},p:id=>nodes[id]||(nodes[id]={style:{}}),I:(a,b)=>a+':'+b+';'};
 vm.runInNewContext(['communityMethodUnlinked','w','b','K','P','j','U'].map(n=>actual(n)).join('\n')+';operation=K();P();j();U();',ctx);await ctx.operation;assert.equal(ctx.w(),null);assert.equal(ctx.b(),0);assert.equal(nodes['review-submit-btn'].disabled,true);assert.equal(nodes['cook-submit-btn'].disabled,true);assert.match(nodes['community-stats'].innerHTML,/Rating:Not linked/);}
});
test('actual source-aware cook and TXT download retain no invented servings while known yields stay available',()=>{
 const raw=read('tools/afrokitchen/cookbook.js'),ast=acorn.parse(raw,{ecmaVersion:'latest'});let assignment;function walk(n){if(!n||typeof n!=='object')return;if(n.type==='AssignmentExpression'&&raw.slice(n.start,n.end).includes("querySelector('[data-ak-cook-servings]')"))assignment=raw.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}walk(ast);assert.ok(assignment);
 for(const [slug,count]of [['ibihaza-rw',1],['kat-kat-banane-sc',4]]){const r=projected(slug);assert.ok(api.isAttributedRecipe(r));const label={};vm.runInNewContext(assignment,{recipe:r,dialog:{querySelector:()=>label},document:{getElementById:()=>({textContent:String(count)})}});assert.equal(label.textContent,slug==='ibihaza-rw'?'Source quantities; portions not recorded':'Cooking for 4 servings');
 const link={click(){this.clicked=true},remove(){}},ctx={n:r,s:{servings:count},invalidateRecipeCopy(){},recipeExportText:()=> 'fixture',Blob,recipeDownloadUrl:null,recipeDownloadRevokeTimer:null,setTimeout:()=>1,clearTimeout(){},S(){},t:{createElement:()=>link,body:{appendChild(){}}},e:{setTimeout:()=>1,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},document:{createElement:()=>link,body:{appendChild(){}}}}};vm.runInNewContext(actual('downloadRecipeText','tools/afrokitchen/static-recipe-runtime.js')+';downloadRecipeText();',ctx);assert.equal(link.download,slug+(slug==='ibihaza-rw'?'-source-quantities.txt':'-4-servings.txt'));assert.equal(link.clicked,true);}
});
test('timer completion uses an actual source checkpoint, not a new food-doneness assertion',()=>{
 const fn=actual('recipeTimerCompletion');for(const [slug,checkpoints] of [['ibihaza-rw',[[3,'Check beans'],[4,'Check pumpkin']]],['kat-kat-banane-sc',[[1,'check fish'],[2,'check plantains'],[3,'check consistency']]]])for(const [step,wanted]of checkpoints){const ctx={i:projected(slug),e:api};vm.runInNewContext(fn+';result=recipeTimerCompletion('+step+');',ctx);assert.equal(ctx.result,wanted,slug+' step '+step);ctx.i={...ctx.i,method_revision:'wrong'};vm.runInNewContext(fn+';result=recipeTimerCompletion('+step+');',ctx);assert.equal(ctx.result,'Done!');}
});
test('all other408 rows retain identities; accepted methods, exact two holds and provenance stay coherent',()=>{
 assert.equal(manifest.recipes.length,410);const known=Object.keys(IDS),others=manifest.recipes.filter(r=>!known.includes(r.slug));assert.equal(others.length,408);
 for(const row of others){const p=api.projectAttributedRecipe(row);if(['mandazi-tanzania-tz','koba-mg'].includes(row.slug)||({'ndizi-nyama-tz':['63325da8-6678-414f-b431-f88d8d6b2fe1','ndizi-darlene-international-cuisine-20261017-v1'],'latchiri-kossan-gn':['91740809-c813-417e-8af4-c5c7c989c1be','latchiri-gassama-maize-cultured-milk-20261017-v1']}[row.slug]||[])[0]===row.id){const eligible={...row,is_verified:true,is_published:true};assert.ok(api.isAttributedRecipe(api.projectAttributedRecipe(eligible)));if(row.slug==='ndizi-nyama-tz')assert.equal(p.method_revision,'ndizi-darlene-international-cuisine-20261017-v1');if(row.slug==='latchiri-kossan-gn')assert.equal(p.method_revision,'latchiri-gassama-maize-cultured-milk-20261017-v1');}else if((row.id==='8a2bb743-87d9-462e-bc09-335e78f9584a'&&row.slug==='kunu-zaki-ng')||(row.id==='f2850789-0ffd-41b3-bbaf-e3229132c9e6'&&row.slug==='ikivuguto-rw')){assert.equal(p.id,row.id);assert.equal(p.slug,row.slug);assert.equal(p.method_review_status,'pending-source-method');assert.deepEqual(p.steps,[]);assert.equal(p.total_time_minutes,null);}else assert.strictEqual(p,row);}
 const ledger=require('../data/image-generation/kitchen-generated-2026-10-09.json').images;for(const slug of known){const r=projected(slug),record=ledger.filter(x=>x.slug===slug);assert.equal(record.length,1);assert.equal(record[0].target,r.image_url);assert.ok(record[0].prompt.includes('illustration'));for(const v of record[0].variants){const b=fs.readFileSync(path.join(ROOT,v.path.replace(/^\//,'')));assert.equal(b.length,v.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256);assert.equal(v.width,v.path.includes('640')?640:1200);assert.equal(v.height,v.path.includes('640')?427:800);}}
});

test('actual recipes function returns only public projected new methods without write operations',async()=>{
 const text=read('netlify/functions/afrokitchen-recipes.js'),parents=Object.keys(IDS).map(source),calls=[];
 const ctx={exports:{},process:{env:{SUPABASE_AUTH_SERVICE_KEY:'synthetic-local-only'}},require:p=>{assert.equal(p,'../../engines/src/afrokitchen-engine');return api},fetch:async(url,opt)=>{calls.push({url,opt});return{ok:true,json:async()=>url.includes('/recipes?')?structuredClone(parents):[]}}};
 vm.runInNewContext(text,ctx);const result=await ctx.exports.handler({httpMethod:'GET',headers:{origin:'http://localhost'},queryStringParameters:{action:'list'}}),rows=JSON.parse(result.body);assert.equal(result.statusCode,200);assert.equal(rows.length,2);
 for(const r of rows){assert.ok(api.isAttributedRecipe(r));assert.deepEqual(r.ingredients,projected(r.slug).ingredients);assert.equal(r.avg_rating,null);}assert.ok(calls.every(x=>!x.opt.method||x.opt.method==='GET'));
});
