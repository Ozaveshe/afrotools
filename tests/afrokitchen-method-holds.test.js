'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const policy = require('../engines/src/afrokitchen-engine');
const { applyHeldManifest } = require('../scripts/lib/afrokitchen-method-holds');
const { buildRecipeIndex } = require('../scripts/lib/afrokitchen-recipe-index');
const pages = require('../scripts/generate-afrokitchen-static-pages');
const { inspectRecipeSchemaState } = require('../scripts/audit-afrokitchen-indexability');
const { refreshHeldLinks } = require('../scripts/apply-afrokitchen-method-holds');
const manifest = require('../tools/afrokitchen/seo-manifest.json');
const root = path.resolve(__dirname, '..');
const slugs = ['ikivuguto-bi','malamba-gq','suwa-er','umcombotsi-sz','vinho-caju-gw','thobwa-mw','oshikundu-na','kunu-zaki-ng','ikivuguto-rw','urwagwa-rw','maheu-zm'];
const unsafe = slug => ({ ...manifest.recipes.find(recipe => recipe.slug === slug),
  description:'SYNTHETIC_WITHDRAWN_CONTENT', private_unknown:{ instructions:'SYNTHETIC_WITHDRAWN_CONTENT' },
  ingredients:[{name:'SYNTHETIC_WITHDRAWN_CONTENT',amount:1,unit:'cup'}],
  steps:[{title:'SYNTHETIC_WITHDRAWN_CONTENT',instruction:'SYNTHETIC_WITHDRAWN_CONTENT',timer_seconds:720}],
  media:[{url:'https://example.test/SYNTHETIC_WITHDRAWN_CONTENT'}], is_verified:true });
const clean = value => JSON.parse(JSON.stringify(value));
const engineSource = fs.readFileSync(path.join(root,'engines/src/afrokitchen-engine.js'),'utf8');

test('method holds have exactly the eleven reviewed identities',()=> {
  assert.deepEqual([...policy.METHOD_HOLD_SLUGS].sort(),slugs.slice().sort());
  for (const value of [undefined,null,{},'jollof-rice-ng','constructor','__proto__']) assert.equal(policy.isMethodHeld(value),false);
});
for(const slug of slugs) {
  test(`${slug}: bounded state removes arbitrary, visible and nested old content`,()=> {
    const raw=unsafe(slug), before=clean(raw), held=policy.applyMethodHold(raw);
    assert.deepEqual(raw,before);
    assert(!JSON.stringify(held).includes('SYNTHETIC_WITHDRAWN_CONTENT'));
    assert.equal(held.slug,slug);assert.equal(held.route_url,raw.route_url);assert.equal(held.country_code,raw.country_code);
    assert.equal(held.is_verified,false);assert.equal(held.method_status,'under_review');
    for(const key of ['ingredients','steps','media','reviews','tags','diet_tags','collections']) assert.deepEqual(held[key],[]);
    for(const key of ['prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','calories','image_url','social_image','page_image']) assert.equal(held[key],null);
    assert.deepEqual(policy.applyMethodHold(held),held);
    assert.equal(policy.getStructuredData(raw,4),null);assert.equal(policy.printRecipe(raw,4),false);
  });
  test(`${slug}: canonical status page has no hidden cooking payload`,()=> {
    const held=policy.applyMethodHold(unsafe(slug)), html=pages.buildRecipePageHtml(unsafe(slug));
    assert(!html.includes('SYNTHETIC_WITHDRAWN_CONTENT'));
    assert.deepEqual(inspectRecipeSchemaState(held,html,{}),{state:'method-under-review',errors:[]});
    assert(!/<button\b|<input\b|<textarea\b|__AK_STATIC_RECIPE|"@type":"Recipe"|timer_seconds/i.test(html));
    assert(html.includes(`href="${held.country_route_path}"`));
  });
  test(`${slug}: browser detail returns status before any provider or index access`,async()=> {
    let calls=0;
    const context={window:{fetch(){calls++;throw Error('unexpected index read');},AfroAuth:{getSupabase(){calls++;throw Error('unexpected provider read');}}},console};
    vm.runInNewContext(engineSource,context);
    for(let i=0;i<2;i++) assert.deepEqual(clean(await context.AfroKitchenEngine.fetchRecipeBySlug(slug)),policy.applyMethodHold(slug));
    assert.equal(calls,0);
  });
}

test('held page validator rejects leaked payloads, bad canonical, bad robots and a hidden notice',()=> {
  const held=policy.applyMethodHold(slugs[0]),html=pages.buildRecipePageHtml(held);
  for(const mutate of [
    html=>html.replace('</main>','<script>window.__AK_STATIC_RECIPE={steps:[{timer_seconds:720}]};</script></main>'),
    html=>html.replace('content="noindex, follow"','content="index, follow"'),
    html=>html.replace(/(<link rel="canonical"[^>]*>)/,'$1$1'),
    html=>html.replace('<p>'+policy.METHOD_HOLD_NOTICE+'</p>','<script>'+policy.METHOD_HOLD_NOTICE+'</script>'),
    html=>html.replace('</head>','<script type="application/ld+json">{"@type":"Recipe"}</script></head>')
  ]) assert.equal(inspectRecipeSchemaState(held,mutate(html),{}).state,'invalid');
  assert.equal(inspectRecipeSchemaState({...held,hidden:{steps:['withdrawn']}},html,{}).state,'invalid');
});

test('offline projection is idempotent and preserves every unrelated method and route identity',()=> {
  const input=structuredClone(manifest);input.recipes=input.recipes.map(recipe=>policy.isMethodHeld(recipe)?unsafe(recipe.slug):recipe);
  const before=structuredClone(input),next=applyHeldManifest(input);
  assert.deepEqual(input,before);assert.deepEqual(applyHeldManifest(next),next);
  assert.equal(next.recipes.length,input.recipes.length);assert.deepEqual(next.routes,input.routes);
  const withoutCollectionCounts=recipe=>({...recipe,collections:(recipe.collections||[]).map(({total_recipes,...row})=>row)});
  for(const recipe of input.recipes.filter(recipe=>!policy.isMethodHeld(recipe))) assert.deepEqual(withoutCollectionCounts(next.recipes.find(row=>row.slug===recipe.slug)),withoutCollectionCounts(recipe),recipe.slug);
  for(const group of [...next.countries,...next.collections]) {
    assert(group.recipes.every(recipe=>!policy.isMethodHeld(recipe)),group.name);
    assert.equal(group.total_recipes,group.recipes.length);
  }
  assert.equal(next.source.method_hold_count,11);
  assert.equal(buildRecipeIndex(next).recipes.length,input.recipes.filter(recipe=>!policy.isMethodHeld(recipe)&&recipe.generated_in_wave&&recipe.is_verified).length);
});

test('stale published index is filtered without changing an available recipe',async()=> {
  const neighbor=structuredClone(manifest.recipes.find(recipe=>recipe.slug==='jollof-rice-ng'));
  let fetches=0;const context={window:{fetch:async()=>{fetches++;return{ok:true,json:async()=>({version:1,recipes:[unsafe(slugs[0]),neighbor]})};}},console,Promise,Date};
  vm.runInNewContext(engineSource,context);
  for(let i=0;i<2;i++) assert.deepEqual(clean(await context.AfroKitchenEngine.fetchRecipes({})),[neighbor]);
  assert.equal(fetches,1);
});

test('stale live list is filtered when the static index is unavailable',async()=> {
  const neighbor=manifest.recipes.find(recipe=>recipe.slug==='jollof-rice-ng');let queries=0;
  const query={select(){return this;},eq(){return this;},order(){return this;},then(resolve){return Promise.resolve({data:[unsafe(slugs[1]),neighbor],error:null}).then(resolve);}};
  const auth={getSupabase(){return{from(){queries++;return query;}};}};
  const context={window:{AfroAuth:auth},AfroAuth:auth,console,Promise,Date};vm.runInNewContext(engineSource,context);
  assert.deepEqual(clean(await context.AfroKitchenEngine.fetchRecipes({})),[neighbor]);assert.equal(queries,1);
});

test('API status does not query the provider; list preserves available rows',async()=> {
  const modulePath=require.resolve('../netlify/functions/afrokitchen-recipes');
  const previous=process.env.SUPABASE_AUTH_SERVICE_KEY,oldFetch=global.fetch;
  process.env.SUPABASE_AUTH_SERVICE_KEY='synthetic-test-only';delete require.cache[modulePath];
  let calls=0;const neighbor=manifest.recipes.find(recipe=>recipe.slug==='jollof-rice-ng');
  global.fetch=async()=>{calls++;return{ok:true,json:async()=>[unsafe(slugs[0]),neighbor]};};
  try{
    const {handler}=require(modulePath);
    for(const slug of slugs){const result=await handler({httpMethod:'GET',queryStringParameters:{action:'get',slug}});assert.equal(result.statusCode,200);assert.deepEqual(JSON.parse(result.body),policy.applyMethodHold(slug));}
    assert.equal(calls,0);
    const result=await handler({httpMethod:'GET',queryStringParameters:{action:'list'}});assert.equal(calls,1);assert.deepEqual(JSON.parse(result.body),[neighbor]);
  }finally{global.fetch=oldFetch;delete require.cache[modulePath];if(previous===undefined)delete process.env.SUPABASE_AUTH_SERVICE_KEY;else process.env.SUPABASE_AUTH_SERVICE_KEY=previous;}
});

test('ordinary imports cannot restore any held preparation',()=> {
  const file=path.join(root,'scripts/import-afrokitchen-expansion-batch.js');
  const source=fs.readFileSync(file,'utf8').replace(/main\(\)\.catch\([\s\S]*$/,'');
  const context={require:createRequire(file),__dirname:path.dirname(file),process:{env:{}},console};vm.runInNewContext(source,context);
  for(const slug of slugs) assert(context.validateBatch({recipes:[unsafe(slug)]}).some(error=>error.includes('ordinary imports cannot restore')));
});

test('status link refresh preserves all unrelated HTML and removes card timing/image',()=> {
  const held=policy.applyMethodHold(slugs[0]);
  const input='<p>Unchanged recipe body.</p><a class="ak-static-recipe-card" href="'+held.route_path+'"><img src="old.webp"><b>12 min</b></a><a href="/tools/afrokitchen/recipes/jollof-rice-ng/">Unchanged neighbor</a>';
  const actual=refreshHeldLinks(input),expected='<p>Unchanged recipe body.</p>'+pages.renderStaticRecipeCard(held,{})+'<a href="/tools/afrokitchen/recipes/jollof-rice-ng/">Unchanged neighbor</a>';
  assert.equal(actual,expected);assert.equal(refreshHeldLinks(actual),actual);
});
