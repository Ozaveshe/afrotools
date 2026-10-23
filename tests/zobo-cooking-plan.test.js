'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const acorn=require('acorn');
const api=require('../engines/src/afrokitchen-engine');
const owner=require('../scripts/generate-afrokitchen-static-pages');
const indexOwner=require('../scripts/lib/afrokitchen-recipe-index');
const manifest=require('../tools/afrokitchen/seo-manifest.json');
const audit=require('../data/afrokitchen/recipe-research-audit.json').recipes;
const base=manifest.recipes.find(r=>r.slug==='zobo-ng');
const fixture=()=>({...structuredClone(base),is_published:true,is_verified:true});
const project=()=>api.projectAttributedRecipe(fixture());
function actualExportFunction(){
 const source=fs.readFileSync(path.join(__dirname,'../tools/afrokitchen/static-recipe-runtime.js'),'utf8');
 const ast=acorn.parse(source,{ecmaVersion:'latest'});let found;
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id.name==='recipeExportText')found=source.slice(n.start,n.end);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 walk(ast);assert.ok(found);return found;
}
test('Zobo source adaptation preserves publication identity and cannot authorize itself',()=>{
 const input=fixture(),copy=structuredClone(input),r=api.projectAttributedRecipe(input);
 assert.deepEqual(input,copy);assert.ok(api.isAttributedRecipe(r));
 for(const k of ['id','slug','is_published','is_verified','created_at','updated_at','view_count'])assert.deepEqual(r[k],copy[k]);
 for(const change of [{id:'wrong'},{is_published:false},{is_verified:false},{is_published:undefined},{is_verified:null}])assert.equal(api.projectAttributedRecipe({...fixture(),...change}),null);
 assert.equal(r.source,'https://www.nigerianfoodtv.com/zobo-drink-how-to-make-zobo-zoborodo/');
 assert.match(r.author,/Nky Lily Lete/);
});
test('The executable drink includes the promised pineapple and assigns every ingredient',()=>{
 const r=project();assert.equal(r.ingredients.find(x=>x.name==='small pineapple').amount,.5);
 assert.equal(r.ingredients.find(x=>x.name==='water').amount,6);
 assert.equal(r.ingredients.find(x=>x.name==='dried hibiscus').amount,1);
 assert.match(r.steps[0].instruction,/wash the pineapple/);assert.match(r.steps[1].instruction,/pineapple chunks and peel/);
 assert.match(r.steps[1].instruction,/ginger and cloves if using/);assert.match(r.steps[3].instruction,/sweetener to taste/);
 assert.equal(r.ingredients.find(x=>x.name==='sugar or honey').amount,null);
 assert.doesNotMatch(JSON.stringify(r.steps),/add citrus|\bstarch\b|\bsalt\b|\boil\b/i);
});
test('Only the documented boil is timed, with approximate glasses and unknown total elapsed time',()=>{
 const r=project();assert.equal(r.default_servings,5);assert.match(r.serving_unit,/approx/);assert.match(r.description,/Base recipe: about five small 150 ml glasses/);
 assert.match(r.story,/6 cups water.*5–6 cup range/);assert.equal(api.getRecipeTiming(r).total,null);
 assert.equal(r.steps[1].timer_seconds,2100);
 assert.ok(r.steps.filter((_,i)=>i!==1).every(x=>x.timer_seconds===null));
 assert.match(r.steps[2].instruction,/completely cool/);assert.match(r.story,/servings controls to scale the ingredients/);assert.match(r.story,/cool completely before straining/);
});
test('Scaling is a useful batch multiplier while optional sweetener stays to taste',()=>{
 const r=project(),rows=api.scaleIngredients(r.ingredients,5,10);
 assert.equal(rows.find(x=>x.name==='dried hibiscus').scaled_amount,2);
 assert.equal(rows.find(x=>x.name==='small pineapple').scaled_amount,1);
 assert.equal(rows.find(x=>x.name==='water').scaled_amount,12);
 assert.equal(rows.find(x=>x.name==='fresh ginger').scaled_amount,2);
 assert.equal(rows.find(x=>x.name==='sugar or honey').scaled_amount,'');
});
test('The genuine static owner renders source, pineapple, illustrative image and drink-specific notes',()=>{
 const input=fixture(),r=project(),html=owner.buildRecipePageHtml(input,{...manifest,recipes:[input]},api,{},audit,null);
 assert.deepEqual(owner.applyRecipeResearchPatch(input,audit),r);
 assert.ok(html.includes(r.source));assert.ok(html.includes(r.description));assert.ok(html.includes(r.steps[1].instruction));
 assert.equal(r.image_alt,'Zobo drink illustration');assert.equal(r.media[0].caption,'Zobo drink illustration');assert.equal(r.media[0].source_type,'existing_illustrative_image');
 assert.doesNotMatch(html,/palm oil|crayfish|Oil, sauce, broth|PTnullM|PTNaNM|35 min<|35 minutes total/i);
 const payload=JSON.parse(html.match(/window\.__AK_STATIC_RECIPE = (.*?);<\/script>/s)[1]);
 assert.equal(payload.method_revision,r.method_revision);assert.equal(payload.ingredients.find(x=>x.name==='small pineapple').amount,.5);
 assert.equal(audit['zobo-ng'].curated_method,true);
 const idx=indexOwner.buildRecipeIndex({...manifest,recipes:[input]}).recipes[0];assert.equal(idx.method_revision,r.method_revision);
});
test('Actual TXT owner exports current scaled quantities and the same source and untimed cooling',()=>{
 const r=project(),ctx={n:r,i:api,s:{servings:10},e:{location:{href:'https://afrotools.com/tools/afrokitchen/recipes/zobo-ng/'}},f:()=>api.scaleIngredients(r.ingredients,5,10)};
 vm.runInNewContext(actualExportFunction()+';output=recipeExportText()',ctx);
 assert.match(ctx.output,/Servings: 10 small glasses \(approx\.\)/);assert.match(ctx.output,/12 cups water/);assert.match(ctx.output,/1 whole small pineapple/);
 assert.match(ctx.output,/Timer: 35:00/);assert.match(ctx.output,/completely cool/);assert.ok(ctx.output.includes(r.source));
 assert.doesNotMatch(ctx.output,/Timer: 30:00|Time: 35 minutes|NaN|undefined|0 to taste|palm oil|crayfish/);
 assert.match(ctx.output,/servings controls to scale the ingredients/);assert.match(ctx.output,/allow the drink to cool completely before straining/);assert.doesNotMatch(ctx.output,/not guaranteed|not a guaranteed|not kitchen-tested|provenance has not been verified|durations are unrecorded/);assert.doesNotMatch(ctx.output,/AI-generated/);
});
test('The recipe does not inherit made-up nutrition or legacy review authority',()=>{
 const r=project();assert.equal(r.chef_notes,null);assert.deepEqual(r.reviews,[]);assert.equal(r.avg_rating,null);
 for(const key of ['calories','protein_g','carbs_g','fat_g','fiber_g'])assert.equal(r[key],null);
 assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(api.getStructuredData(r,5))),'nutrition'),false);
});
