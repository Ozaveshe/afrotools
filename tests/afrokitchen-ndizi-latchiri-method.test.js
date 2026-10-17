'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const acorn = require('acorn');
const { imageSize } = require('../scripts/lib/image-size');
const api = require('../engines/src/afrokitchen-engine');
const owner = require('../scripts/generate-afrokitchen-static-pages');
const indexOwner = require('../scripts/lib/afrokitchen-recipe-index');
const manifest = require('../tools/afrokitchen/seo-manifest.json');
const audit = require('../data/afrokitchen/recipe-research-audit.json').recipes;
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const plain = x => JSON.parse(JSON.stringify(x));
const IDS = { 'ndizi-nyama-tz': '63325da8-6678-414f-b431-f88d8d6b2fe1', 'latchiri-kossan-gn': '91740809-c813-417e-8af4-c5c7c989c1be' };
const source = slug => structuredClone(manifest.recipes.find(r => r.slug === slug));
const projected = slug => api.projectAttributedRecipe(source(slug));
function actual(name, file = 'tools/afrokitchen/recipe-page.js') {
  const text = read(file), ast = acorn.parse(text, { ecmaVersion: 'latest' }); let found;
  function walk(n) { if (!n || typeof n !== 'object') return; if (n.type === 'FunctionDeclaration' && n.id?.name === name) found = text.slice(n.start, n.end); for (const v of Object.values(n)) if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') walk(v); }
  walk(ast); assert.ok(found, name); return found;
}
function browserEngine(client, index) {
  const ctx = { window: { AfroAuth: { getSupabase: () => client }, navigator: { onLine: !!client } }, console: { warn() {} }, fetch: async () => ({ ok: true, json: async () => ({ version: 2, recipes: index }) }), Date, setTimeout, clearTimeout };
  ctx.AfroAuth = ctx.window.AfroAuth; ctx.window.fetch = ctx.fetch;
  vm.runInNewContext(read('engines/src/afrokitchen-engine.js'), ctx); return ctx.AfroKitchenEngine;
}
for (const slug of Object.keys(IDS)) {
  test(slug + ': exact public identity and revision with no mutation of authority or old method proof', () => {
    const parent = source(slug), before = structuredClone(parent), r = projected(slug);
    assert.ok(api.isAttributedRecipe(r)); assert.equal(r.id, IDS[slug]); assert.deepEqual(parent, before);
    for (const key of ['id', 'slug', 'is_published', 'is_verified', 'created_at', 'updated_at', 'view_count']) assert.deepEqual(r[key], parent[key], key);
    assert.deepEqual(owner.applyRecipeResearchPatch(parent, audit), r);
    assert.deepEqual(r.diet_tags, []); assert.deepEqual(r.reviews, []); assert.equal(r.avg_rating, null); assert.equal(r.review_count, 0);
    for (const key of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g']) assert.equal(r[key], null);
    for (const rows of [r.ingredients, r.steps, r.media]) assert.ok(rows.every(row => row.recipe_id === IDS[slug]));
    for (const patch of [{ id: 'wrong' }, { is_published: false }, { is_verified: false }, { is_verified: null }, { is_published: undefined }]) {
      assert.equal(api.projectAttributedRecipe({ ...parent, ...patch }), null); assert.throws(() => owner.applyRecipeResearchPatch({ ...parent, ...patch }, audit), /eligibility/);
    }
    assert.equal(api.isAttributedRecipe({ ...r, method_revision: 'wrong' }), false);
    assert.equal(api.isAttributedRecipe({ slug: 'constructor', is_published: true, is_verified: true }), false);
  });
  test(slug + ': actual static owner, schema and TXT use the same attributed method', () => {
    const r = projected(slug); assert.ok(api.isAttributedRecipe(r));
    const html = owner.buildRecipePageHtml(source(slug), { ...manifest, recipes: [source(slug)] }, api, {}, audit, null);
    for (const text of [r.steps[0].instruction, r.source, r.image_alt]) assert.ok(html.includes(text), text);
    assert.match(html, /AI-generated serving illustration/);
    const ctx = { n: r, i: api, s: { servings: r.default_servings }, e: { location: { href: 'http://localhost/fixture' } }, f: () => api.scaleIngredients(r.ingredients, r.default_servings, r.default_servings) };
    vm.runInNewContext(actual('recipeExportText', 'tools/afrokitchen/static-recipe-runtime.js') + ';result=recipeExportText();', ctx);
    assert.ok(ctx.result.includes(r.steps[0].instruction)); assert.match(ctx.result, /AI-generated serving illustration/); assert.doesNotMatch(ctx.result, /NaN|\bnull\b|0 as needed/);
    const schema = plain(api.getStructuredData(r, r.default_servings)); assert.equal(Object.hasOwn(schema, 'aggregateRating'), false); assert.equal(Object.hasOwn(schema, 'nutrition'), false);
    if (slug === 'ndizi-nyama-tz') { assert.match(ctx.result, /Servings: 4 servings/); assert.equal(schema.prepTime, 'PT10M'); assert.equal(schema.cookTime, 'PT45M'); assert.equal(schema.totalTime, 'PT55M'); }
    else { assert.match(ctx.result, /Servings: 12 servings/); assert.match(ctx.result, /Time: Not recorded/); for (const key of ['prepTime', 'cookTime', 'totalTime']) assert.equal(Object.hasOwn(schema, key), false); assert.doesNotMatch(html, /dairy-free/); }
  });
  test(slug + ': actual public index and online/offline detail agree while old prices are unavailable', async () => {
    const parent = source(slug), r = projected(slug); assert.ok(api.isAttributedRecipe(r));
    const idx = indexOwner.buildRecipeIndex({ ...manifest, recipes: [{ ...parent, generated_in_wave: true }] }).recipes;
    assert.equal(idx[0].method_revision, r.method_revision); assert.deepEqual(idx[0].curated_detail.fields.ingredients, r.ingredients); assert.deepEqual(idx[0].tags, r.tags);
    const offline = browserEngine(null, idx); assert.deepEqual(plain((await offline.fetchRecipeBySlug(slug)).ingredients), r.ingredients);
    const client = { from(table) { const z = { select() { return z; }, eq() { return z; }, order() { return z; }, limit() { return z; }, maybeSingle: async () => ({ data: { ...parent, avg_rating: 5, review_count: 7 } }), then(done) { return Promise.resolve({ data: table === 'recipe_reviews' ? [{ rating: 5 }] : [] }).then(done); } }; return z; }, rpc: () => Promise.resolve() };
    const online = browserEngine(client, idx), detail = await online.fetchRecipeBySlug(slug);
    assert.deepEqual(plain(detail.ingredients), r.ingredients); assert.deepEqual(plain(detail.media), r.media); assert.equal(detail.avg_rating, null); assert.deepEqual(plain(await online.fetchIngredientPrices(parent.id, parent.country_code)), []);
  });
}
test('named primary-source quantities and timing stay separate from unsupported nutrition and estimates', () => {
  const n = projected('ndizi-nyama-tz'), l = projected('latchiri-kossan-gn'); assert.ok(api.isAttributedRecipe(n)); assert.ok(api.isAttributedRecipe(l));
  assert.equal(n.default_servings, 4); assert.deepEqual(api.getRecipeTiming(n), { prep: 10, cook: 45, total: 55 });
  assert.deepEqual(n.ingredients.slice(0,4).map(x => [x.amount,x.unit,x.name]), [[2,'tbsp','vegetable oil'],[1,'lb','beef fillet'],[4,'whole','green plantains'],[1,'medium','onion']]);
  assert.equal(n.ingredients.find(x => x.name === 'water').amount, 2); assert.match(n.ingredients.find(x => x.name === 'water').prep_note, /about|approximate/i);
  assert.equal(n.ingredients.find(x => x.name === 'salt and pepper').amount, null); assert.deepEqual(n.steps.map(x => x.timer_seconds), [null,null,600,300]);
  assert.equal(l.default_servings, 12); assert.deepEqual(api.getRecipeTiming(l), { prep: null, cook: null, total: null });
  assert.equal(l.ingredients[0].amount, 1); assert.equal(l.ingredients[0].unit, 'kg'); assert.equal(l.ingredients[0].name, 'maize flour');
  assert.deepEqual(l.ingredients.slice(1).map(x => x.amount), [null,null,null,null]); assert.deepEqual(l.steps.map(x => x.timer_seconds), [null,1800,600,1800,null]);
  assert.match(l.ingredients.find(x => /cultured milk/.test(x.name)).prep_note, /contains dairy/); assert.doesNotMatch(l.steps.map(x => x.instruction).join(' '), /ferment|yogh?urt starter|powdered milk/i);
  assert.match(l.steps[3].instruction, /15 minutes/); assert.match(l.steps[3].instruction, /repeat the moistening, ten-minute rest and loosening/); assert.match(l.story, /ready-made cultured milk/);
});
test('known person yield scales measured quantities without inventing unmeasured milk, water or seasoning', () => {
  const l = projected('latchiri-kossan-gn'); assert.ok(api.isAttributedRecipe(l)); const doubled = api.scaleIngredients(l.ingredients, 12, 24);
  assert.equal(doubled[0].amount, 1); assert.equal(doubled[0].scaled_amount, 2);
  assert.deepEqual(plain(doubled.slice(1).map(x => x.amount)), [null,null,null,null]); assert.deepEqual(plain(doubled.slice(1).map(x => x.scaled_amount)), ['','','','']);
});
test('actual dynamic timer completion keeps all selected cooking checkpoints as checks, with exact revision guards', () => {
  const raw = actual('recipeTimerCompletion');
  for (const slug of Object.keys(IDS)) { const r = projected(slug); assert.ok(api.isAttributedRecipe(r));
    for (const step of r.steps.filter(x => /^check\b/i.test(x.timer_label || ''))) {
      const ctx = { i: r, e: api }; vm.runInNewContext(raw + ';result=recipeTimerCompletion(' + step.step_number + ');', ctx); assert.equal(ctx.result, step.timer_label); assert.notEqual(ctx.result, 'Done!');
      ctx.i = { ...r, method_revision: 'wrong' }; vm.runInNewContext(raw + ';result=recipeTimerCompletion(' + step.step_number + ');', ctx); assert.equal(ctx.result, 'Done!');
    }
  }
  const ctx = { i: { slug: 'ordinary', steps: [{ step_number: 1, timer_label: 'Check ordinary' }] }, e: api }; vm.runInNewContext(raw + ';result=recipeTimerCompletion(1);', ctx); assert.equal(ctx.result, 'Done!');
});
test('actual community renderer and contribution controls do not borrow ratings or old-method claims', async () => {
  for (const slug of Object.keys(IDS)) { const r = projected(slug); assert.ok(api.isAttributedRecipe(r)); const nodes = {}, ctx = { i: { ...r, avg_rating: 5, review_count: 7 }, e: api, AfroKitchenEngine: api, d: { averageRating: 5, reviewCount: 7, reviews: [{}], cooksnaps: [{}] }, p: id => nodes[id] || (nodes[id] = { style: {} }), I: (a,b) => a + ':' + b + ';' };
    vm.runInNewContext(['communityMethodUnlinked','w','b','K','P','j','U'].map(n => actual(n)).join('\n') + ';operation=K();P();j();U();', ctx); await ctx.operation;
    assert.equal(ctx.w(), null); assert.equal(ctx.b(), 0); assert.equal(nodes['review-submit-btn'].disabled, true); assert.equal(nodes['cook-submit-btn'].disabled, true); assert.match(nodes['community-stats'].innerHTML, /Rating:Not linked/);
  }
});
test('actual public recipes API projects the two methods and denies false eligibility without writes', async () => {
  const text = read('netlify/functions/afrokitchen-recipes.js'), parents = Object.keys(IDS).map(source), calls = [];
  const ctx = { exports: {}, process: { env: { SUPABASE_AUTH_SERVICE_KEY: 'synthetic-local-only' } }, require: p => { assert.equal(p, '../../engines/src/afrokitchen-engine'); return api; }, fetch: async (url,opt) => { calls.push({url,opt}); return { ok:true, json:async () => url.includes('/recipes?') ? [...structuredClone(parents), {...parents[0],is_published:false}] : [] }; } };
  vm.runInNewContext(text,ctx); const response = await ctx.exports.handler({httpMethod:'GET',headers:{origin:'http://localhost'},queryStringParameters:{action:'list'}}), rows = JSON.parse(response.body);
  assert.equal(response.statusCode,200); assert.equal(rows.length,2);
  for (const r of rows) { assert.ok(api.isAttributedRecipe(r)); assert.deepEqual(r.ingredients,projected(r.slug).ingredients); assert.deepEqual(r.diet_tags,[]); assert.equal(r.avg_rating,null); }
  assert.ok(calls.every(x => !x.opt.method || x.opt.method === 'GET'));
});
test('saved image pairs have exact recipe identity, physical hashes and honest illustration provenance', () => {
  const ledger = JSON.parse(read('data/image-generation/kitchen-generated-2026-10-09.json'));
  const hashes = { 'ndizi-nyama-tz': ['fe7f2a92a94500d496d72fa0fd247cc73f7de2b60529ccffa684a49f9448776e','75b055875c2c8fad58f3896ba6cd038e2096ca993ba9a689fa033aec83d87f80'], 'latchiri-kossan-gn': ['914c1ffc605f5a7eeac20fff9784a7be261fb24c5b497519ed593744e0f73a0f','feb09002c6e8a0af71b70a6a218d0e38c2b500e4511ebd990b622d07eaf9bdcd'] };
  for (const slug of Object.keys(IDS)) { const r = projected(slug); assert.ok(api.isAttributedRecipe(r)); const row = ledger.images.find(x => x.slug === slug); assert.ok(row); assert.equal(row.recipe_id || row.expected_recipe_id, IDS[slug]); assert.equal(row.method_revision, r.method_revision); assert.match(row.provenance, /illustration/); assert.match(r.media[0].caption, /not a kitchen-tested photograph/);
    const main = row.variants.find(v => v.path === row.target), small = row.variants.find(v => v.width === 640);
    for (const [index, v] of [main, small].entries()) { const file=path.join(ROOT,v.path.slice(1)); assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hashes[slug][index]); assert.equal(v.sha256, hashes[slug][index]); assert.deepEqual(imageSize(file),index===0?{w:1200,h:800}:{w:640,h:427}); }
  }
});
