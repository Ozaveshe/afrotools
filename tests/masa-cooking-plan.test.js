"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const acorn=require('acorn');
const api=require('../engines/src/afrokitchen-engine');
const owner=require('../scripts/generate-afrokitchen-static-pages');
const manifest=require('../tools/afrokitchen/seo-manifest.json');
const audit=require('../data/afrokitchen/recipe-research-audit.json').recipes;
const original=manifest.recipes.find(x=>x.slug==='masa-waina-ng');
const fixture=()=>({...structuredClone(original),is_published:true,is_verified:true});
const project=()=>api.projectAttributedRecipe(fixture());
function actualExportFunction(){
 const source=fs.readFileSync(path.join(__dirname,'../tools/afrokitchen/static-recipe-runtime.js'),'utf8');
 const ast=acorn.parse(source,{ecmaVersion:'latest'});let found;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id.name==='recipeExportText')found=source.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(ast);assert.ok(found);return found;
}
test('Masa is a four-person source recipe, not an invented six-cake yield',()=>{
 const before=fixture(),copy=structuredClone(before),r=api.projectAttributedRecipe(before);
 assert.deepEqual(before,copy);assert.equal(r.default_servings,4);assert.equal(r.serving_unit,'servings');assert.equal(r.author,'AfroKitchen adaptation; source recipe by Ramatu, published by All Nigerian Foods');assert.equal(r.source,'https://allnigerianfoods.com/masa-2/');assert.ok(api.isAttributedRecipe(r));
 for(const key of ['id','slug','is_published','is_verified','created_at','updated_at','view_count'])assert.deepEqual(r[key],copy[key],key);
 assert.equal(r.ingredients.filter(x=>x.name==='tuwo rice').reduce((a,x)=>a+x.amount,0),3);
 const doubled=api.scaleIngredients(r.ingredients,4,8);assert.equal(doubled.filter(x=>x.name==='tuwo rice').reduce((a,x)=>a+x.scaled_amount,0),6);
 assert.equal(doubled.find(x=>x.name==='sugar').scaled_amount,4);assert.doesNotMatch(doubled.map(x=>x.prep_note||'').join(' '),/½ cup|50 ml|half the source/);assert.doesNotMatch(r.steps[0].instruction,/half a cup/);assert.equal(doubled.find(x=>x.name==='salt').amount,null);const oils=r.ingredients.filter(x=>/oil/.test(x.name));assert.equal(oils.length,1);assert.equal(oils[0].name,'vegetable oil');assert.equal(oils[0].amount,50);assert.equal(doubled.find(x=>x.name==='vegetable oil').scaled_amount,100);assert.match(oils[0].prep_note,/greasing the masa pan, as needed/);assert.match(r.steps[3].instruction,/vegetable oil to grease the masa pan as needed/);
});
test('Masa approval and UUID cannot be created by a source-method adaptation',()=>{
 for(const change of [{id:'wrong'},{is_published:false},{is_verified:false},{is_published:undefined},{is_verified:null}])assert.equal(api.projectAttributedRecipe({...fixture(),...change}),null);
});
test('Overnight soaking and frothing stay visible without a false65-minute total',()=>{
 const r=project();assert.deepEqual(api.getRecipeTiming(r),{prep:null,cook:null,total:null});assert.match(r.description,/overnight/);assert.match(r.story,/8–10 hours/);assert.match(r.story,/30 minutes/);assert.match(r.steps[0].instruction,/8–10 hours or overnight/);assert.equal(r.steps[2].timer_seconds,1800);assert.equal(r.steps[3].timer_seconds,null);assert.match(r.steps[3].instruction,/other side until golden/);
 for(const rows of [r.ingredients,r.steps,r.media])assert.ok(rows.every(x=>x.recipe_id===r.id));
});
test('Genuine static generator uses coherent quantities, source link and no rice-pot advice',()=>{
 const base=fixture(),r=project(),html=owner.buildRecipePageHtml(base,{...manifest,recipes:[base]},api,{},audit,null);
 assert.ok(html.includes(r.description));assert.ok(html.includes(r.steps[2].instruction));assert.ok(html.includes(r.source));assert.match(html,/AI-generated serving illustration/);assert.doesNotMatch(html,/65 min|65 minutes|Scaled to 6 cakes|grains should be tender but still distinct|stirring too often/i);
 assert.deepEqual(owner.applyRecipeResearchPatch(base,audit),r);const payload=JSON.parse(html.match(/window\.__AK_STATIC_RECIPE = (.*?);<\/script>/s)[1]);assert.equal(payload.ingredients.filter(x=>/oil/.test(x.name)).length,1);assert.doesNotMatch(html,/additional oil quantity|1 tbsp oil/);
});
test('Actual TXT owner keeps scaled measured ingredients, overnight plan and current method',()=>{
 const r=project(),ctx={n:r,i:api,s:{servings:8},e:{location:{href:'https://afrotools.com/tools/afrokitchen/recipes/masa-waina-ng/'}},f:()=>api.scaleIngredients(r.ingredients,4,8)};
 vm.runInNewContext(actualExportFunction()+';output=recipeExportText()',ctx);
 assert.match(ctx.output,/Servings: 8 servings/);assert.match(ctx.output,/3 cups tuwo rice/g);assert.match(ctx.output,/4 tbsp sugar/);assert.match(ctx.output,/8–10 hours/);assert.match(ctx.output,/30 minutes/);assert.match(ctx.output,/Ramatu/);assert.match(ctx.output,/AI-generated serving illustration/);assert.doesNotMatch(ctx.output,/65 minutes|6 cakes|NaN|undefined|0 to taste/);assert.ok(ctx.output.includes(r.steps[3].instruction));const oilLines=ctx.output.split('\n').filter(x=>/^- .*\boil\b/.test(x));assert.equal(oilLines.length,1);assert.equal(oilLines[0],'- 100 ml vegetable oil, for greasing the masa pan, as needed');assert.doesNotMatch(ctx.output,/tbsp oil|additional oil quantity/);
});
test('Nutrition, legacy review counters and generic cooking authority are not inherited',()=>{
 const r=project(),schema=api.getStructuredData(r,4);assert.equal(r.chef_notes,null);assert.deepEqual(r.reviews,[]);assert.equal(r.avg_rating,null);for(const key of ['calories','protein_g','carbs_g','fat_g','fiber_g'])assert.equal(r[key],null);assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(schema)),'nutrition'),false);assert.equal(audit['masa-waina-ng'].curated_method,true);
});

test('Real cuisine-source guard requires matching Masa identity and revision before replacing generic notes',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../scripts/lib/afrokitchen-cuisine-intelligence.js'),'utf8'),ast=acorn.parse(source,{ecmaVersion:'latest'});let fn;
 for(const n of ast.body)if(n.type==='FunctionDeclaration'&&n.id.name==='curatedMethodProfile')fn=source.slice(n.start,n.end);assert.ok(fn);
 const r=project(),ctx={recipeMethods:api};vm.runInNewContext(fn+';invoke=curatedMethodProfile',ctx);
 const notes=JSON.parse(JSON.stringify(ctx.invoke(r,audit))).chefNotes;assert.deepEqual(notes.common_mistakes,[]);assert.equal(notes.serve_with,r.best_served_with);
 for(const bad of [{},{['masa-waina-ng']:{...audit['masa-waina-ng'],expected_recipe_id:'wrong'}},{['masa-waina-ng']:{...audit['masa-waina-ng'],method_revision:'stale'}},{['masa-waina-ng']:{...audit['masa-waina-ng'],curated_method:false}}])assert.throws(()=>ctx.invoke(r,bad),/identity\/revision\/audit mismatch/);
});
