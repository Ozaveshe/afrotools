'use strict';

// Actual maintained owners with synthetic public records and local transport only.
// This proves source contracts, not provider persistence, food safety or native UI.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const ROOT = path.resolve(__dirname, '..');
const engine = require('../engines/src/afrokitchen-engine');
const indexOwner = require('../scripts/lib/afrokitchen-recipe-index');
const generator = require('../scripts/generate-afrokitchen-static-pages');
const staticOwner = require('../scripts/lib/afrokitchen-static');
const { inspectPendingMethodPage } = require('../scripts/audit-afrokitchen-indexability');
const plain = value => JSON.parse(JSON.stringify(value));
const targets = [
  ['ikivuguto-rw', 'f2850789-0ffd-41b3-bbaf-e3229132c9e6'],
];
const row = (slug, id) => ({ id, slug, name: slug, country_name: 'Synthetic country',
  generated_in_wave: true, is_published: true, is_verified: true,
  route_path: `/tools/afrokitchen/recipes/${slug}/`, route_url: `https://afrotools.com/tools/afrokitchen/recipes/${slug}/`,
  image_url: '/preserved-image.webp', view_count: 123, created_at: '2026-01-01',
  ingredients: [{ name: 'Unreviewed quantity', amount: 3 }], steps: [{ instruction: 'Unreviewed method', timer_seconds: 900 }],
  prep_time_minutes: 25, cook_time_minutes: 60, total_time_minutes: 85, default_servings: 6,
  calories: 500, protein_g: 30, carbs_g: 50, fat_g: 20, fiber_g: 8, reviews: [{ rating: 5 }], avg_rating: 5, review_count: 1,
  chef_notes: { readiness_cues: ['Unreviewed readiness'], technique_notes: ['Unreviewed technique'] }, diet_tags: ['vegetarian', 'dairy-free'], method_revision: 'legacy-unreviewed' });

for (const [slug, id] of targets) {
  test(`${slug}: pending projection is an object, immutable, idempotent and preserves identity/public flags/image/counters`, () => {
    const input = row(slug, id), before = plain(input), output = engine.projectAttributedRecipe(input);
    assert.ok(output && typeof output === 'object'); assert.deepEqual(input, before);
    assert.deepEqual(engine.projectAttributedRecipe(output), output);
    for (const key of ['id', 'slug', 'name', 'is_published', 'is_verified', 'image_url', 'view_count', 'created_at']) assert.deepEqual(output[key], before[key]);
    for (const key of ['prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','serving_unit','calories','protein_g','carbs_g','fat_g','fiber_g','method_revision','chef_notes','avg_rating','review_count']) assert.equal(output[key], null, key);
    for (const key of ['ingredients','steps','reviews','media']) assert.deepEqual(output[key], []);
    assert.equal(output.yield_status, 'not-recorded'); assert.equal(output.method_review_status, 'pending-source-method');
    assert.equal(output.diet_tags.includes('dairy-free'), slug === 'kunu-zaki-ng');
    if (['kisra-south-sudan-ss','maheu-zm'].includes(slug)) assert.deepEqual(output.diet_tags, []);
  });
  for (const [label, mutation] of [
    ['wrong UUID', value => { value.id = '11111111-1111-4111-8111-111111111111'; }],
    ['wrong slug', value => { value.slug = 'another-dish'; }],
    ['other method slug', value => { const other=targets.find(item => item[0] !== slug); value.slug=other ? other[0] : 'kunu-zaki-ng'; }]
  ]) test(`${slug}: ${label} is a real projection error`, () => {
    const input = row(slug, id); mutation(input);
    assert.throws(() => engine.projectAttributedRecipe(input), /identity mismatch/);
  });
  test(`${slug}: legacy markerless input cannot supply timing, servings, nutrition, schema, prices or print`, async () => {
    const input = row(slug, id);
    assert.equal(engine.isPendingRecipeMethod(input), true); assert.equal(engine.hasRecordedRecipeYield(input), false);
    assert.deepEqual(engine.getRecipeTiming(input), { prep: null, cook: null, total: null });
    assert.equal(engine.scaleNutrition(input, 7), null); assert.equal(engine.getStructuredData(input, 7), null);
    assert.equal(await engine.fetchIngredientPrices(id, 'NG'), null); assert.equal(engine.printRecipe(input, 7), false);
  });
  test(`${slug}: index retains informational record and never grants missing publication`, () => {
    const input = row(slug, id); const index = indexOwner.buildRecipeIndex({ recipes: [input] });
    assert.equal(index.recipes.length, 1); assert.deepEqual(index.recipes[0].ingredients, []);
    assert.equal(index.recipes[0].curated_detail.fields.default_servings, null);
    assert.equal(indexOwner.buildRecipeIndex({ recipes: [{ ...input, is_published: false }] }).recipes.length, 0);
    const unknown = { ...input }; delete unknown.is_published;
    assert.equal(indexOwner.buildRecipeIndex({ recipes: [unknown] }).recipes.length, 0);
  });
  test(`${slug}: genuine static owner emits an informational noindex page and auditor rejects resurrected content`, () => {
    const input = engine.projectAttributedRecipe(row(slug, id));
    const html = generator.buildRecipePageHtml(input, { recipes: [input] }, engine, staticOwner.loadRecipeImages(), { recipes: {} });
    assert.deepEqual(inspectPendingMethodPage(input, html), { state: 'pending-source-method', errors: [] });
    assert.match(html, /AI-generated/); assert.doesNotMatch(html, /See the dish before you cook/);
    assert.doesNotMatch(html, /"@type"\s*:\s*"(?:Recipe|HowTo)"|data-ak-cook-mode|Unreviewed method/);
    for (const changed of [html.replace('noindex, follow', 'index, follow'), html.replace('source_method_pending', 'missing_image'),
      html.replace('</head>', '<script type="application/ld+json">{"@type":"Recipe"}</script></head>'),
      html.replace('"ingredients":[]', '"ingredients":[{"name":"invented"}]'), html.replace('"calories":null', '"calories":50')]) {
      assert.equal(inspectPendingMethodPage(input, changed).state, 'invalid');
    }
  });
}

test('unrelated records and prototype names are not pending and are returned untouched', () => {
  for (const slug of ['ordinary-dish', '__proto__', 'constructor']) {
    const input = row(slug, '11111111-1111-4111-8111-111111111111');
    assert.equal(engine.isPendingRecipeMethod(input), false); assert.equal(engine.projectPendingRecipeMethod(input), input);
  }
});

// Reuse the actual existing synthetic publication fixture without executing its tests.
function publicationFixture() {
  const file = path.join(__dirname, 'afrokitchen-publication-boundary.test.js');
  const source = fs.readFileSync(file, 'utf8');
  const end = source.indexOf('for (const [name, file, event] of flows)');
  assert.ok(end > 0);
  const sandbox = { require, __dirname, Buffer, URL, AbortController, structuredClone };
  vm.runInNewContext(source.slice(0, end) + '\nglobalThis.fixtureOwner=fixture;', sandbox, { filename: file });
  return sandbox.fixtureOwner;
}
const fixtureOwner = publicationFixture();
for (const [slug, id] of targets) {
  for (const [name, file, method, body] of [
    ['cost', 'afrokitchen-costs.js', 'GET', null],
    ['community', 'afrokitchen-community.js', 'GET', null],
    ['review', 'afrokitchen-community.js', 'POST', { action: 'review', rating: 4 }],
    ['cooksnap', 'afrokitchen-community.js', 'POST', { action: 'cooksnap', photoDataUrl: 'data:image/webp;base64,AA==' }]
  ]) for (const [kind, parent, expected] of [
    ['eligible', [{ id, is_published: true, is_verified: true }], 409],
    ['absent', [], 404], ['dependency failure', {}, 503]
  ]) test(`${slug}: ${name} ${kind} preserves parent-first contract and no downstream side effects`, async () => {
    const fixture = fixtureOwner({ parent });
    const response = await fixture.load('netlify/functions/' + file).handler({ httpMethod: method,
      headers: { origin: 'https://afrotools.com' }, queryStringParameters: { recipe_id: id, recipeId: id, country: 'NG' },
      body: body ? JSON.stringify({ recipeId: id, ...body }) : undefined });
    assert.equal(response.statusCode, expected); assert.equal(fixture.calls.length, 1);
    assert.match(fixture.calls[0].url, /rest\/v1\/recipes\?/);
    if (expected === 409) assert.deepEqual(JSON.parse(response.body), { error: 'Recipe method review pending', code: 'METHOD_REVIEW_PENDING' });
  });
  test(`${slug}: API list/detail retain pending object and detail stops before child queries`, async () => {
    const input = row(slug, id), ordinary = row('ordinary-dish', '11111111-1111-4111-8111-111111111111');
    const f = fixtureOwner({ parent: [input, ordinary, { ...ordinary, is_verified: false }] });
    let response = await f.load('netlify/functions/afrokitchen-recipes.js').handler({ httpMethod: 'GET', headers: {}, queryStringParameters: { action: 'list' } });
    assert.equal(response.statusCode, 200); const list = JSON.parse(response.body); assert.equal(list.length, 2);
    assert.deepEqual(list.find(item => item.id === id).steps, []); assert.equal(list.find(item => item.id === id).chef_notes, null); assert.deepEqual(list.find(item => item.id === ordinary.id), ordinary);
    const g = fixtureOwner({ parent: [input] });
    response = await g.load('netlify/functions/afrokitchen-recipes.js').handler({ httpMethod: 'GET', headers: {}, queryStringParameters: { action: 'get', slug } });
    assert.equal(response.statusCode, 200); assert.equal(g.calls.length, 1); assert.deepEqual(JSON.parse(response.body).ingredients, []); assert.equal(JSON.parse(response.body).chef_notes, null);
  });
}

function declarations(source) {
  const found = new Map();
  function visit(node) { if (!node || typeof node !== 'object') return; if (node.type === 'FunctionDeclaration') found.set(node.id.name, source.slice(node.start, node.end));
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value); }
  visit(acorn.parse(source, { ecmaVersion: 'latest' })); return found;
}
test('actual dynamic public action guard blocks legacy pending actions but preserves ordinary this/arguments/results/errors', () => {
  const functions = declarations(fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/recipe-page.js'), 'utf8'));
  for (const [slug, id] of targets) {
    let calls = 0; const fixture = { i: row(slug, id), e: engine, p: () => null };
    vm.createContext(fixture); vm.runInContext(['pendingMethod','pendingMethodNotice','guardPendingActions'].map(name => functions.get(name)).join('\n') + '\nglobalThis.guard=guardPendingActions;', fixture);
    const action = function(value) { calls++; assert.equal(this.marker, 1); return value; };
    const api = fixture.guard(Object.fromEntries(['adjustServings','askAdvisor','copyShoppingList','cookingNext','cookingPrev','print','resetCookingTimer','resetTimerStep','shareIngredients','startCookingMode','submitCooksnap','submitReview','toggleCookingTimer','toggleTimer','updateCost'].map(name => [name, action])));
    for (const method of Object.values(api)) assert.equal(method.call({ marker: 1 }, 9), false);
    assert.equal(calls, 0); fixture.i = row('ordinary', '11111111-1111-4111-8111-111111111111');
    assert.equal(api.print.call({ marker: 1 }, 9), 9); assert.equal(calls, 1);
    const error = Error('original'); const throwing = fixture.guard({ print() { throw error; } });
    assert.throws(() => throwing.print(), value => value === error);
  }
});
// Prior four deny holds plus the three new exact source identities. Recognition only withholds planning.
const plannerYieldTargets = [
  ...targets,
  ['kunu-zaki-ng', '8a2bb743-87d9-462e-bc09-335e78f9584a'],
['maheu-zm', '626fd465-87e1-4f93-bca7-747decbf63d0'],
  ['kisra-south-sudan-ss', 'c0aced74-68d6-437d-b00b-abd1895605f0'],

  ['kapenta-stew-zm','76572d95-eb8e-4c78-bbb6-ea754f61c758'],
  ['ibihaza-rw','d7d7e305-3c5d-40db-9033-36843e102176'],
  ['mchemsho-tz','4caf4ed6-13ec-4fbb-8039-ce51a4201cfe']
];
test('actual planner predicates and shopping boundary reject markerless legacy IDs/slugs', () => {
  const html = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/index.html'), 'utf8');
  const functions = new Map(); for (const block of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!block[1].includes('function hasUnrecordedPlanYield')) continue;
    for (const pair of declarations(block[1])) functions.set(...pair);
  }
  const context = { AK: { scaleIngredients() { throw Error('must not scale'); } } }; vm.createContext(context);
  vm.runInContext(['hasUnrecordedPlanYield','recipeIngredientsByGroup'].map(name => functions.get(name)).join('\n'), context);
  for (const [slug, id] of plannerYieldTargets) for (const input of [row(slug,id), { id }, { slug },
      { ...row(slug,id), id: '11111111-1111-4111-8111-111111111111' },
      { ...row(slug,id), slug: 'unrelated-cache-slug' },
      { ...row(slug,id), id: plannerYieldTargets.find(other => other[0] !== slug)[1] }]) {
    const before = plain(input); assert.equal(context.hasUnrecordedPlanYield(input), true); assert.deepEqual(plain(context.recipeIngredientsByGroup(input, 7)), []); assert.deepEqual(input, before, 'deny-only recognition never edits identity or creates a UUID');
  }
  for (const unrelated of [null, {}, { id: 'other', slug: 'other' }, { id: '11111111-1111-4111-8111-111111111111', slug: 'unrelated-cache-slug' },
      { id: '8c0311ea-c7e3-4286-b535-33a75451becd', slug: 'octopus-curry-sc' }]) assert.equal(context.hasUnrecordedPlanYield(unrelated), false);
});

test('actual saved and locked plan recovery leaves typed choices, locks and current plan intact', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/index.html'), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(match => match[1].includes('function hasUnrecordedPlanYield'))[1];
  const functions = declarations(script);
  for (const [slug, id] of plannerYieldTargets) {
    const input = row(slug, id); input.category = 'main';
    const saved = { slugs: [slug], inputs: { servings: 9 }, lockedSlugs: [slug] }, original = plain(saved), messages = [];
    const context = { readSavedPlan: () => saved, mealPlannerRecipes: [input], planGenerationRevision: 0,
      currentPlanRecipes: ['preserved'], setPlanStatus: message => messages.push(message) };
    vm.createContext(context);
    vm.runInContext(['hasUnrecordedPlanYield','restoreSavedPlan','isPlanMeal','matchesPlan','fetchRecipeDetails','renderPlan','buildPlanText'].map(name => functions.get(name)).join('\n'), context);
    await context.restoreSavedPlan(); assert.deepEqual(saved, original); assert.match(messages.at(-1), /remains saved/);
    assert.equal(context.isPlanMeal(input), false); assert.equal(context.matchesPlan(input, {}), false);
    await assert.rejects(context.fetchRecipeDetails(input), /person-yield/);
    context.renderPlan([input], { servings: 9 }); assert.deepEqual(context.currentPlanRecipes, ['preserved']);
    assert.match(context.buildPlanText([input], { servings: 9 }), /Plan unavailable/);
  }
});

test('actual cached static rendering removes old method before activation without deleting saved controls', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/static-recipe-runtime.js'), 'utf8');
  const functions = declarations(source);
  for (const [slug, id] of targets) {
    const children = [], removed = []; let cleared = false;
    const save = { identity: 'save' }, status = { identity: 'status' }, robots = {};
    const root = { set textContent(value) { assert.equal(value, ''); cleared = true; }, appendChild(node) { children.push(node); } };
    const document = { querySelector(selector) { return selector === 'main' ? root : selector.includes('save-recipe') ? save : selector.includes('cookbook-status') ? status : robots; },
      createElement(tag) { return { tag, setAttribute() {} }; }, getElementById() { return null; },
      querySelectorAll() { return [{ remove() { removed.push('old schema'); } }]; } };
    const context = { n: row(slug,id), i: engine, e: {}, t: document }; vm.createContext(context);
    vm.runInContext(functions.get('showPendingMethod') + '\nshowPendingMethod();', context);
    assert.equal(cleared, true); assert.ok(children.includes(save)); assert.ok(children.includes(status)); assert.equal(removed.length, 1);
    assert.match(children.find(node => node.tag === 'img').src, new RegExp('/responsive/' + slug + '-640.webp$'));
    assert.equal(robots.content, 'noindex,follow'); assert.deepEqual(plain(context.e.__AK_STATIC_RECIPE.steps), []);
  }
  assert.match(source, /if\(pendingMethod\(\)\)showPendingMethod\(\);checkPublication\(\);/);
});

test('saved-manifest owner projects exact pending rows and summaries without altering unrelated recipe content', () => {
  const ordinary = row('ordinary-dish', '11111111-1111-4111-8111-111111111111'); ordinary.country_slug = 'synthetic';
  const recipes = [...targets.map(args => ({ ...row(...args), country_slug: 'synthetic' })), ordinary];
  const input = { recipes, countries: [{ recipes: plain(recipes) }], collections: [{ recipes: plain(recipes) }] }, before = plain(input);
  const output = generator.projectReviewedManifest(input, { recipes: {} }); assert.deepEqual(input, before);
  assert.deepEqual(generator.projectReviewedManifest(output, { recipes: {} }), output);
  for (const group of [output, ...output.countries, ...output.collections]) {
    for (const [slug] of targets) { const recipe = group.recipes.find(item => item.slug === slug); assert.equal(recipe.method_review_status, 'pending-source-method'); assert.deepEqual(recipe.steps, []); assert.equal(recipe.total_time_minutes, null); }
  }
  const unchanged = output.recipes.find(item => item.slug === ordinary.slug); delete unchanged.country_route_path; delete unchanged.country_route_url;
  assert.deepEqual(unchanged, ordinary);
});

test('pending UI responsive assets are actual owned local files for remaining exact holds', () => {
  for (const [slug] of targets) assert.ok(fs.statSync(path.join(ROOT, 'assets/img/kitchen/responsive', slug + '-640.webp')).size > 0);
  for (const file of ['recipe-page.js','static-recipe-runtime.js']) {
    const source = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen', file), 'utf8');
    assert.match(source, /\/assets\/img\/kitchen\/responsive\//);
  }
});

test('derived cuisine owner cannot synthesize chef advice, cooking menus or social method claims for every hold', () => {
  const intelligenceOwner = require('../scripts/lib/afrokitchen-cuisine-intelligence');
  const manifest = require('../tools/afrokitchen/seo-manifest.json');
  const recipes = targets.map(([slug]) => engine.projectPendingRecipeMethod(structuredClone(manifest.recipes.find(item => item.slug === slug))));
  const ordinary = structuredClone(manifest.recipes.find(item => item.slug === 'jollof-rice-ng')); recipes.push(ordinary);
  const rules = intelligenceOwner.loadCuisineRules();
  rules.menu_builder.menus = [{ slug: 'synthetic', name: 'Synthetic', recipe_slugs: recipes.map(item => item.slug) }];
  rules.social_showcase.recipe_slugs = recipes.map(item => item.slug);
  const result = intelligenceOwner.buildCuisineIntelligence({ ...manifest, recipes }, { rules, recipeImages: staticOwner.loadRecipeImages(), researchAudit: {} });
  for (const [slug] of targets) {
    const insight = result.recipes[slug];
    assert.equal(insight.quality.editorial_status, 'pending-source-method');
    assert.deepEqual(insight.chef_notes, { common_mistakes: [], readiness_cues: [], pantry_notes: [], technique_notes: [], serve_with: '' });
    assert.deepEqual(insight.menu_tags, []);
    assert.equal(result.menu_builder.menus.some(menu => menu.recipes.some(item => item.slug === slug)), false);
    assert.equal(result.social_showcase.recipes.some(item => item.slug === slug), false);
    const schema = generator.buildRecipeSchemas(recipes.find(item => item.slug === slug), engine, '', []);
    assert.equal(schema.recipeSchema, null); assert.deepEqual(schema.schemaBlockers, ['source_method_pending']);
  }
  assert.ok(result.menu_builder.menus[0].recipes.some(item => item.slug === ordinary.slug));
});

// Verbatim immutable S root/payload, with independent full-HTML/payload byte pins.
// Source harness only; genuine legacy HTML/native DOM qualification remains separate.
const LEGACY_S_FIXTURES = [
  {
    "slug": "kunu-zaki-ng",
    "source": "tools/afrokitchen/recipes/kunu-zaki-ng/index.html",
    "commit": "853cfcd88d1c9ad36cffe31b34a8fe28c22c51be",
    "htmlSha256": "215c74acde1687f2aff9a17b8e7077872a2aa9020f0d972e09bce4261e1ba643",
    "htmlBytes": 66309,
    "payloadText": "{\"slug\":\"kunu-zaki-ng\",\"name\":\"Kunu Zaki\",\"description\":\"Kunu Zaki is a drink with millet or sorghum, ginger, cloves, and sweet potato. Serve\",\"story\":\"Kunu Zaki is a practical Nigeria dish centered on millet or sorghum, ginger, cloves, and sweet potato. Serve it with cold with snacks, then adjust heat and seasoning to your table.\",\"default_servings\":8,\"serving_unit\":\"cups\",\"prep_time_minutes\":20,\"cook_time_minutes\":20,\"total_time_minutes\":40,\"country_name\":\"Nigeria\",\"country_code\":\"NG\",\"region\":\"West Africa\",\"difficulty\":\"medium\",\"category\":\"beverage\",\"nutrition_basis\":null,\"calories\":160,\"protein_g\":5,\"carbs_g\":29,\"fat_g\":3,\"fiber_g\":3,\"ingredients\":[{\"id\":\"f57ecc6e-c165-4d9e-ac39-e46d41cf9b0c\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"ingredient_id\":null,\"sort_order\":10,\"group_name\":\"Base\",\"amount\":2,\"unit\":\"cups\",\"name\":\"millet or sorghum\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:54.528902+00:00\"},{\"id\":\"25ef1c1c-fe01-40c7-9bf5-7e4c81e2cc5c\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"ingredient_id\":null,\"sort_order\":20,\"group_name\":\"Liquid\",\"amount\":6,\"unit\":\"cups\",\"name\":\"clean water\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:54.528902+00:00\"},{\"id\":\"4297c65c-cc2a-4d67-abe4-f0cc80e83cae\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"ingredient_id\":null,\"sort_order\":30,\"group_name\":\"Starter\",\"amount\":0.5,\"unit\":\"cup\",\"name\":\"ginger, cloves, and sweet potato\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:54.528902+00:00\"},{\"id\":\"18087536-f716-4792-bf83-ca8c08396e61\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"ingredient_id\":null,\"sort_order\":40,\"group_name\":\"Sweetener\",\"amount\":0.25,\"unit\":\"cup\",\"name\":\"sugar or honey\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:54.528902+00:00\"},{\"id\":\"aa88212b-e806-4a38-925a-73a6fb32ea7f\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"ingredient_id\":null,\"sort_order\":50,\"group_name\":\"Finish\",\"amount\":0.25,\"unit\":\"tsp\",\"name\":\"salt\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:54.528902+00:00\"}],\"steps\":[{\"id\":\"f66c846f-fa88-4989-87a8-80ea73e9599b\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"step_number\":1,\"title\":\"Cook or mix base\",\"instruction\":\"Cook or whisk millet or sorghum with clean water into a smooth light base.\",\"timer_seconds\":600,\"timer_label\":\"base\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:54.764272+00:00\"},{\"id\":\"2b6211ce-6ec0-4383-9a42-67a45b3c7a64\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"step_number\":2,\"title\":\"Cool safely\",\"instruction\":\"Cool until just warm so the starter is not killed.\",\"timer_seconds\":1200,\"timer_label\":\"cool\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:54.764272+00:00\"},{\"id\":\"b4b0eb48-d569-498e-bd75-e19e49681b01\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"step_number\":3,\"title\":\"Ferment\",\"instruction\":\"Stir in ginger, cloves, and sweet potato and ferment loosely covered until lightly sour.\",\"timer_seconds\":720,\"timer_label\":\"ferment\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:54.764272+00:00\"},{\"id\":\"0588077a-09f8-450a-87e5-e4f074bd7c6c\",\"recipe_id\":\"8a2bb743-87d9-462e-bc09-335e78f9584a\",\"step_number\":4,\"title\":\"Serve fresh\",\"instruction\":\"Sweeten or salt lightly, chill, and serve within a day.\",\"timer_seconds\":300,\"timer_label\":\"finish\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:54.764272+00:00\"}],\"gallery_images\":[],\"region_lens\":{\"slug\":\"national-table\",\"name\":\"Nigeria national table\",\"description\":\"A structured Nigeria dish in the AfroKitchen archive.\",\"confidence\":\"medium\",\"match_reason\":\"country-level fallback\"},\"chef_notes\":{\"common_mistakes\":[\"Rushing the base before the raw edge has cooked out.\",\"Adding all seasoning early and forgetting to adjust at the end.\",\"Cooking on heat that is too high once the dish should be steaming or simmering.\"],\"readiness_cues\":[\"The aroma should smell rounded rather than raw or sharp.\",\"Oil, sauce, broth, or steam should look settled and deliberate.\",\"The final texture should match the dish style before you plate it.\"],\"pantry_notes\":[\"palm oil\",\"crayfish\",\"iru or ogiri\",\"scotch bonnet\",\"melon seed\"],\"technique_notes\":[\"pepper base frying\",\"swallow pairing\",\"leafy soup building\",\"street grill seasoning\"],\"serve_with\":\"cold with snacks\"},\"image_status\":{\"status\":\"missing\",\"gallery_count\":0,\"hero_ready\":false,\"hero_src\":\"\",\"local_image_count\":0,\"sources\":[],\"missing_roles\":[\"hero\",\"serving\",\"ingredients\",\"process\",\"table\"],\"shots\":[{\"role\":\"hero\",\"label\":\"Finished dish hero\",\"filename\":\"kunu-zaki-ng.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kunu-zaki-ng/\",\"prompt\":\"Finished Kunu Zaki, beverage from Nigeria, plated finished dish in warm natural light, inspectable texture, no text, no logos.\"},{\"role\":\"serving\",\"label\":\"Serving detail\",\"filename\":\"kunu-zaki-ng-2.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kunu-zaki-ng/\",\"prompt\":\"Finished Kunu Zaki, beverage from Nigeria, closer serving angle showing texture, garnish, side dish, and sauce.\"},{\"role\":\"ingredients\",\"label\":\"Ingredient setup\",\"filename\":\"kunu-zaki-ng-3.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kunu-zaki-ng/\",\"prompt\":\"Finished Kunu Zaki, beverage from Nigeria, key ingredients arranged naturally before cooking, bright kitchen light.\"},{\"role\":\"process\",\"label\":\"Cooking process\",\"filename\":\"kunu-zaki-ng-4.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kunu-zaki-ng/\",\"prompt\":\"Finished Kunu Zaki, beverage from Nigeria, mid-cooking pot or pan moment that explains the method.\"},{\"role\":\"table\",\"label\":\"Table context\",\"filename\":\"kunu-zaki-ng-5.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kunu-zaki-ng/\",\"prompt\":\"Finished Kunu Zaki, beverage from Nigeria, dish on table with realistic accompaniments and serving utensils.\"}]}}",
    "payloadSha256": "afa86c07eca726d51a2402ce8caf203f24511181da51dcd92759c5f3ffbf9f21",
    "rootOpeningTag": "<div class=\"ak-page ak-static-page ak-visual-recipe\" id=\"ak-main-content\" role=\"main\" tabindex=\"-1\">",
    "rootSha256": "3f6a8de6229942c03bd51ca2e7d5ed96e11a9aee7a32864c1548dfff82b91fc0"
  },
  {
    "slug": "ikivuguto-rw",
    "source": "tools/afrokitchen/recipes/ikivuguto-rw/index.html",
    "commit": "853cfcd88d1c9ad36cffe31b34a8fe28c22c51be",
    "htmlSha256": "3835a3b06e6d16005a7943a65abac80943b943ae567acda2f2d24d917f2c2c19",
    "htmlBytes": 64297,
    "payloadText": "{\"slug\":\"ikivuguto-rw\",\"name\":\"Rwandan Ikivuguto\",\"description\":\"Rwandan Ikivuguto is a drink with milk, live culture starter. Serve\",\"story\":\"Rwandan Ikivuguto is a practical Rwanda dish centered on milk, live culture starter. Serve it with porridge or bread, then adjust heat and seasoning to your table.\",\"default_servings\":8,\"serving_unit\":\"cups\",\"prep_time_minutes\":20,\"cook_time_minutes\":20,\"total_time_minutes\":40,\"country_name\":\"Rwanda\",\"country_code\":\"RW\",\"region\":\"East Africa\",\"difficulty\":\"medium\",\"category\":\"beverage\",\"nutrition_basis\":null,\"calories\":160,\"protein_g\":5,\"carbs_g\":29,\"fat_g\":3,\"fiber_g\":3,\"ingredients\":[{\"id\":\"0c345801-0142-49bb-950e-0abde39f0c53\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"ingredient_id\":null,\"sort_order\":10,\"group_name\":\"Base\",\"amount\":2,\"unit\":\"cups\",\"name\":\"milk\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:44.260842+00:00\"},{\"id\":\"6f308c2b-bdc4-4560-b05a-f27c5b783674\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"ingredient_id\":null,\"sort_order\":20,\"group_name\":\"Liquid\",\"amount\":6,\"unit\":\"cups\",\"name\":\"clean water\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:44.260842+00:00\"},{\"id\":\"fbc663f9-23a2-48e5-8206-53bc16f5867c\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"ingredient_id\":null,\"sort_order\":30,\"group_name\":\"Starter\",\"amount\":0.5,\"unit\":\"cup\",\"name\":\"live culture starter\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:44.260842+00:00\"},{\"id\":\"206a24ef-93bf-43a3-941b-58bab1c0a73d\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"ingredient_id\":null,\"sort_order\":40,\"group_name\":\"Sweetener\",\"amount\":0.25,\"unit\":\"cup\",\"name\":\"sugar or honey\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:44.260842+00:00\"},{\"id\":\"1813dc30-a209-4d8e-ac22-32c58388e062\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"ingredient_id\":null,\"sort_order\":50,\"group_name\":\"Finish\",\"amount\":0.25,\"unit\":\"tsp\",\"name\":\"salt\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:44.260842+00:00\"}],\"steps\":[{\"id\":\"2c87c374-55b4-413f-82e9-f6fa64330863\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"step_number\":1,\"title\":\"Cook or mix base\",\"instruction\":\"Cook or whisk milk with clean water into a smooth light base.\",\"timer_seconds\":600,\"timer_label\":\"base\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:44.981998+00:00\"},{\"id\":\"51c2edf4-15b1-4703-b293-da253e9cdffc\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"step_number\":2,\"title\":\"Cool safely\",\"instruction\":\"Cool until just warm so the starter is not killed.\",\"timer_seconds\":1200,\"timer_label\":\"cool\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:44.981998+00:00\"},{\"id\":\"0d1e31bd-e0b2-4f31-bcde-c53be88e4009\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"step_number\":3,\"title\":\"Ferment\",\"instruction\":\"Stir in live culture starter and ferment loosely covered until lightly sour.\",\"timer_seconds\":720,\"timer_label\":\"ferment\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:44.981998+00:00\"},{\"id\":\"9fb1ce45-8cf8-4806-93c7-6ca1a4548a9b\",\"recipe_id\":\"f2850789-0ffd-41b3-bbaf-e3229132c9e6\",\"step_number\":4,\"title\":\"Serve fresh\",\"instruction\":\"Sweeten or salt lightly, chill, and serve within a day.\",\"timer_seconds\":300,\"timer_label\":\"finish\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:44.981998+00:00\"}],\"gallery_images\":[],\"region_lens\":{\"slug\":\"national-table\",\"name\":\"Rwanda national table\",\"description\":\"A structured Rwanda dish in the AfroKitchen archive.\",\"confidence\":\"medium\",\"match_reason\":\"country-level fallback\"},\"chef_notes\":{\"common_mistakes\":[\"Rushing the rest or fermentation period.\",\"Rushing the base before the raw edge has cooked out.\",\"Adding all seasoning early and forgetting to adjust at the end.\",\"Cooking on heat that is too high once the dish should be steaming or simmering.\"],\"readiness_cues\":[\"The bread or batter should smell pleasantly fermented, toasted, or nutty rather than floury.\",\"The aroma should smell rounded rather than raw or sharp.\",\"Oil, sauce, broth, or steam should look settled and deliberate.\",\"The final texture should match the dish style before you plate it.\"],\"pantry_notes\":[],\"technique_notes\":[],\"serve_with\":\"porridge or bread\"},\"image_status\":{\"status\":\"missing\",\"gallery_count\":0,\"hero_ready\":false,\"hero_src\":\"\",\"local_image_count\":0,\"sources\":[],\"missing_roles\":[\"hero\",\"serving\",\"ingredients\",\"process\",\"table\"],\"shots\":[{\"role\":\"hero\",\"label\":\"Finished dish hero\",\"filename\":\"ikivuguto-rw.webp\",\"route_path\":\"/tools/afrokitchen/recipes/ikivuguto-rw/\",\"prompt\":\"Finished Rwandan Ikivuguto, beverage from Rwanda, plated finished dish in warm natural light, inspectable texture, no text, no logos.\"},{\"role\":\"serving\",\"label\":\"Serving detail\",\"filename\":\"ikivuguto-rw-2.webp\",\"route_path\":\"/tools/afrokitchen/recipes/ikivuguto-rw/\",\"prompt\":\"Finished Rwandan Ikivuguto, beverage from Rwanda, closer serving angle showing texture, garnish, side dish, and sauce.\"},{\"role\":\"ingredients\",\"label\":\"Ingredient setup\",\"filename\":\"ikivuguto-rw-3.webp\",\"route_path\":\"/tools/afrokitchen/recipes/ikivuguto-rw/\",\"prompt\":\"Finished Rwandan Ikivuguto, beverage from Rwanda, key ingredients arranged naturally before cooking, bright kitchen light.\"},{\"role\":\"process\",\"label\":\"Cooking process\",\"filename\":\"ikivuguto-rw-4.webp\",\"route_path\":\"/tools/afrokitchen/recipes/ikivuguto-rw/\",\"prompt\":\"Finished Rwandan Ikivuguto, beverage from Rwanda, mid-cooking pot or pan moment that explains the method.\"},{\"role\":\"table\",\"label\":\"Table context\",\"filename\":\"ikivuguto-rw-5.webp\",\"route_path\":\"/tools/afrokitchen/recipes/ikivuguto-rw/\",\"prompt\":\"Finished Rwandan Ikivuguto, beverage from Rwanda, dish on table with realistic accompaniments and serving utensils.\"}]}}",
    "payloadSha256": "5462c3666661ad3577c3032ade0e4de3056f29a4c082a8616eab23681b2ea1d5",
    "rootOpeningTag": "<div class=\"ak-page ak-static-page ak-visual-recipe\" id=\"ak-main-content\" role=\"main\" tabindex=\"-1\">",
    "rootSha256": "3f6a8de6229942c03bd51ca2e7d5ed96e11a9aee7a32864c1548dfff82b91fc0"
  },
  {
    "slug": "kisra-south-sudan-ss",
    "source": "tools/afrokitchen/recipes/kisra-south-sudan-ss/index.html",
    "sourceCommit": "853cfcd88d1c9ad36cffe31b34a8fe28c22c51be",
    "htmlBytes": 67127,
    "htmlSha256": "172e7839cdec45b32d55e4fb8fd8a183ee08a986b0bebf3f7d0f8c8329e9f6cc",
    "payloadText": "{\"slug\":\"kisra-south-sudan-ss\",\"name\":\"South Sudanese Kisra\",\"description\":\"South Sudanese Kisra is a bread with sorghum flour, fermented batter. Serve\",\"story\":\"South Sudanese Kisra is a practical South Sudan dish centered on sorghum flour, fermented batter. Serve it with bamia or stew, then adjust heat and seasoning to your table.\",\"default_servings\":6,\"serving_unit\":\"servings\",\"prep_time_minutes\":50,\"cook_time_minutes\":30,\"total_time_minutes\":80,\"country_name\":\"South Sudan\",\"country_code\":\"SS\",\"region\":\"East Africa\",\"difficulty\":\"medium\",\"category\":\"bread\",\"nutrition_basis\":null,\"calories\":280,\"protein_g\":7,\"carbs_g\":52,\"fat_g\":5,\"fiber_g\":3,\"ingredients\":[{\"id\":\"c4040f21-6228-4b79-8df5-87b0623e430a\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":10,\"group_name\":\"Dough\",\"amount\":3,\"unit\":\"cups\",\"name\":\"sorghum flour\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"},{\"id\":\"15fe8330-8fa6-46ac-be6d-49fbddbfef04\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":20,\"group_name\":\"Dough\",\"amount\":1,\"unit\":\"tsp\",\"name\":\"salt\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"},{\"id\":\"4e7328bb-ad95-4e6e-b51f-358935a4a6da\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":30,\"group_name\":\"Dough\",\"amount\":1,\"unit\":\"tbsp\",\"name\":\"sugar\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"},{\"id\":\"a367ab02-92e3-4e54-a48d-21b7619a6535\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":40,\"group_name\":\"Dough\",\"amount\":1.25,\"unit\":\"cups\",\"name\":\"warm water or coconut milk\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"},{\"id\":\"e1d1baca-5f70-4a31-b492-65afb515b1f6\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":50,\"group_name\":\"Dough\",\"amount\":2,\"unit\":\"tbsp\",\"name\":\"fermented batter\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"},{\"id\":\"12c41a2a-eec4-406c-b3e2-1fb2b89f6afb\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"ingredient_id\":null,\"sort_order\":60,\"group_name\":\"Cooking\",\"amount\":1,\"unit\":\"tbsp\",\"name\":\"oil\",\"prep_note\":\"for pan or tray\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:01:57.207428+00:00\"}],\"steps\":[{\"id\":\"63b0b560-e564-4757-835c-c9c9b85c14e2\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"step_number\":1,\"title\":\"Mix dough\",\"instruction\":\"Mix sorghum flour, salt, liquid, and fat into a soft dough or batter.\",\"timer_seconds\":600,\"timer_label\":\"mix\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:57.51399+00:00\"},{\"id\":\"4cb64e59-3e2b-4972-8ae7-c743a6ba37b9\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"step_number\":2,\"title\":\"Rest\",\"instruction\":\"Rest until relaxed or lightly risen.\",\"timer_seconds\":1800,\"timer_label\":\"rest\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:57.51399+00:00\"},{\"id\":\"899bcf85-150e-4b54-a797-beec63f6c659\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"step_number\":3,\"title\":\"Cook\",\"instruction\":\"Cook on a hot pan, griddle, steamer, or oven until set and lightly browned.\",\"timer_seconds\":1500,\"timer_label\":\"cook\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:57.51399+00:00\"},{\"id\":\"dba95b2b-370f-45c9-8d22-faa29e9070ad\",\"recipe_id\":\"c0aced74-68d6-437d-b00b-abd1895605f0\",\"step_number\":4,\"title\":\"Serve\",\"instruction\":\"Serve warm with bamia or stew.\",\"timer_seconds\":300,\"timer_label\":\"serve\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:01:57.51399+00:00\"}],\"gallery_images\":[],\"region_lens\":{\"slug\":\"national-table\",\"name\":\"South Sudan national table\",\"description\":\"A structured South Sudan dish in the AfroKitchen archive.\",\"confidence\":\"medium\",\"match_reason\":\"country-level fallback\"},\"chef_notes\":{\"common_mistakes\":[\"Stopping the base before the pepper, onion, or spice edge has mellowed.\",\"Thinning the pot before the body of the soup or stew has developed.\",\"Rushing the rest or fermentation period.\",\"Rushing the base before the raw edge has cooked out.\"],\"readiness_cues\":[\"The sauce should coat the spoon and taste rounded, not watery or raw.\",\"The bread or batter should smell pleasantly fermented, toasted, or nutty rather than floury.\",\"The aroma should smell rounded rather than raw or sharp.\",\"Oil, sauce, broth, or steam should look settled and deliberate.\"],\"pantry_notes\":[],\"technique_notes\":[],\"serve_with\":\"bamia or stew\"},\"image_status\":{\"status\":\"missing\",\"gallery_count\":0,\"hero_ready\":false,\"hero_src\":\"\",\"local_image_count\":0,\"sources\":[],\"missing_roles\":[\"hero\",\"serving\",\"ingredients\",\"process\",\"table\"],\"shots\":[{\"role\":\"hero\",\"label\":\"Finished dish hero\",\"filename\":\"kisra-south-sudan-ss.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kisra-south-sudan-ss/\",\"prompt\":\"Finished South Sudanese Kisra, bread from South Sudan, plated finished dish in warm natural light, inspectable texture, no text, no logos.\"},{\"role\":\"serving\",\"label\":\"Serving detail\",\"filename\":\"kisra-south-sudan-ss-2.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kisra-south-sudan-ss/\",\"prompt\":\"Finished South Sudanese Kisra, bread from South Sudan, closer serving angle showing texture, garnish, side dish, and sauce.\"},{\"role\":\"ingredients\",\"label\":\"Ingredient setup\",\"filename\":\"kisra-south-sudan-ss-3.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kisra-south-sudan-ss/\",\"prompt\":\"Finished South Sudanese Kisra, bread from South Sudan, key ingredients arranged naturally before cooking, bright kitchen light.\"},{\"role\":\"process\",\"label\":\"Cooking process\",\"filename\":\"kisra-south-sudan-ss-4.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kisra-south-sudan-ss/\",\"prompt\":\"Finished South Sudanese Kisra, bread from South Sudan, mid-cooking pot or pan moment that explains the method.\"},{\"role\":\"table\",\"label\":\"Table context\",\"filename\":\"kisra-south-sudan-ss-5.webp\",\"route_path\":\"/tools/afrokitchen/recipes/kisra-south-sudan-ss/\",\"prompt\":\"Finished South Sudanese Kisra, bread from South Sudan, dish on table with realistic accompaniments and serving utensils.\"}]}}",
    "payloadSha256": "6a7402717998353beb84b99ed8406e1e8e0fadce84e8cf084d5832cc122ee612",
    "rootOpeningTag": "<div class=\"ak-page ak-static-page ak-visual-recipe\" id=\"ak-main-content\" role=\"main\" tabindex=\"-1\">",
    "rootSha256": "3f6a8de6229942c03bd51ca2e7d5ed96e11a9aee7a32864c1548dfff82b91fc0"
  },
  {
    "slug": "maheu-zm",
    "source": "tools/afrokitchen/recipes/maheu-zm/index.html",
    "sourceCommit": "853cfcd88d1c9ad36cffe31b34a8fe28c22c51be",
    "htmlBytes": 64291,
    "htmlSha256": "9c0c6635464cd55d7e37848ad7b6c82713f5d2d63841ac6422a16f7ede7c7b72",
    "payloadText": "{\"slug\":\"maheu-zm\",\"name\":\"Zambian Maheu\",\"description\":\"Zambian Maheu is a drink with maize meal, malted grain or sugar. Serve\",\"story\":\"Zambian Maheu is a practical Zambia dish centered on maize meal, malted grain or sugar. Serve it with chilled, then adjust heat and seasoning to your table.\",\"default_servings\":8,\"serving_unit\":\"cups\",\"prep_time_minutes\":20,\"cook_time_minutes\":20,\"total_time_minutes\":40,\"country_name\":\"Zambia\",\"country_code\":\"ZM\",\"region\":\"East Africa\",\"difficulty\":\"medium\",\"category\":\"beverage\",\"nutrition_basis\":null,\"calories\":160,\"protein_g\":5,\"carbs_g\":29,\"fat_g\":3,\"fiber_g\":3,\"ingredients\":[{\"id\":\"d91ded01-c8f5-4269-909d-b1e839db5191\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"ingredient_id\":null,\"sort_order\":10,\"group_name\":\"Base\",\"amount\":2,\"unit\":\"cups\",\"name\":\"maize meal\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:19.333429+00:00\"},{\"id\":\"f474b3c2-dc59-41d7-a7cc-65d29eb056b4\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"ingredient_id\":null,\"sort_order\":20,\"group_name\":\"Liquid\",\"amount\":6,\"unit\":\"cups\",\"name\":\"clean water\",\"prep_note\":null,\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:19.333429+00:00\"},{\"id\":\"dc2bd9a6-b0a4-4628-b4ad-9537310d005a\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"ingredient_id\":null,\"sort_order\":30,\"group_name\":\"Starter\",\"amount\":0.5,\"unit\":\"cup\",\"name\":\"malted grain or sugar\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:19.333429+00:00\"},{\"id\":\"54146678-ea52-48e6-bbc8-309f26881c4a\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"ingredient_id\":null,\"sort_order\":40,\"group_name\":\"Sweetener\",\"amount\":0.25,\"unit\":\"cup\",\"name\":\"sugar or honey\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:19.333429+00:00\"},{\"id\":\"d95d2fdd-9423-4aa9-8a9c-8ca687078434\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"ingredient_id\":null,\"sort_order\":50,\"group_name\":\"Finish\",\"amount\":0.25,\"unit\":\"tsp\",\"name\":\"salt\",\"prep_note\":\"optional\",\"is_optional\":false,\"substitution\":null,\"created_at\":\"2026-05-03T05:02:19.333429+00:00\"}],\"steps\":[{\"id\":\"41ccbe07-4103-446a-9b19-8072b787d069\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"step_number\":1,\"title\":\"Cook or mix base\",\"instruction\":\"Cook or whisk maize meal with clean water into a smooth light base.\",\"timer_seconds\":600,\"timer_label\":\"base\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:19.593169+00:00\"},{\"id\":\"0c268eb3-ac8d-40a7-ba8b-dd356afa7992\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"step_number\":2,\"title\":\"Cool safely\",\"instruction\":\"Cool until just warm so the starter is not killed.\",\"timer_seconds\":1200,\"timer_label\":\"cool\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:19.593169+00:00\"},{\"id\":\"1b0a2e01-6398-4641-be3d-aad85d3ea0cd\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"step_number\":3,\"title\":\"Ferment\",\"instruction\":\"Stir in malted grain or sugar and ferment loosely covered until lightly sour.\",\"timer_seconds\":720,\"timer_label\":\"ferment\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:19.593169+00:00\"},{\"id\":\"ebcbfe75-5793-45d2-9093-f29bc1bb10eb\",\"recipe_id\":\"626fd465-87e1-4f93-bca7-747decbf63d0\",\"step_number\":4,\"title\":\"Serve fresh\",\"instruction\":\"Sweeten or salt lightly, chill, and serve within a day.\",\"timer_seconds\":300,\"timer_label\":\"finish\",\"tip\":null,\"image_url\":null,\"created_at\":\"2026-05-03T05:02:19.593169+00:00\"}],\"gallery_images\":[],\"region_lens\":{\"slug\":\"national-table\",\"name\":\"Zambia national table\",\"description\":\"A structured Zambia dish in the AfroKitchen archive.\",\"confidence\":\"medium\",\"match_reason\":\"country-level fallback\"},\"chef_notes\":{\"common_mistakes\":[\"Rushing the rest or fermentation period.\",\"Rushing the base before the raw edge has cooked out.\",\"Adding all seasoning early and forgetting to adjust at the end.\",\"Cooking on heat that is too high once the dish should be steaming or simmering.\"],\"readiness_cues\":[\"The bread or batter should smell pleasantly fermented, toasted, or nutty rather than floury.\",\"The aroma should smell rounded rather than raw or sharp.\",\"Oil, sauce, broth, or steam should look settled and deliberate.\",\"The final texture should match the dish style before you plate it.\"],\"pantry_notes\":[],\"technique_notes\":[],\"serve_with\":\"chilled\"},\"image_status\":{\"status\":\"missing\",\"gallery_count\":0,\"hero_ready\":false,\"hero_src\":\"\",\"local_image_count\":0,\"sources\":[],\"missing_roles\":[\"hero\",\"serving\",\"ingredients\",\"process\",\"table\"],\"shots\":[{\"role\":\"hero\",\"label\":\"Finished dish hero\",\"filename\":\"maheu-zm.webp\",\"route_path\":\"/tools/afrokitchen/recipes/maheu-zm/\",\"prompt\":\"Finished Zambian Maheu, beverage from Zambia, plated finished dish in warm natural light, inspectable texture, no text, no logos.\"},{\"role\":\"serving\",\"label\":\"Serving detail\",\"filename\":\"maheu-zm-2.webp\",\"route_path\":\"/tools/afrokitchen/recipes/maheu-zm/\",\"prompt\":\"Finished Zambian Maheu, beverage from Zambia, closer serving angle showing texture, garnish, side dish, and sauce.\"},{\"role\":\"ingredients\",\"label\":\"Ingredient setup\",\"filename\":\"maheu-zm-3.webp\",\"route_path\":\"/tools/afrokitchen/recipes/maheu-zm/\",\"prompt\":\"Finished Zambian Maheu, beverage from Zambia, key ingredients arranged naturally before cooking, bright kitchen light.\"},{\"role\":\"process\",\"label\":\"Cooking process\",\"filename\":\"maheu-zm-4.webp\",\"route_path\":\"/tools/afrokitchen/recipes/maheu-zm/\",\"prompt\":\"Finished Zambian Maheu, beverage from Zambia, mid-cooking pot or pan moment that explains the method.\"},{\"role\":\"table\",\"label\":\"Table context\",\"filename\":\"maheu-zm-5.webp\",\"route_path\":\"/tools/afrokitchen/recipes/maheu-zm/\",\"prompt\":\"Finished Zambian Maheu, beverage from Zambia, dish on table with realistic accompaniments and serving utensils.\"}]}}",
    "payloadSha256": "ba8a0c6f2dbc0f3a83b380e5c5f3ffb52cbc7fa1c7c2ab27d6d854bc2d1502c0",
    "rootOpeningTag": "<div class=\"ak-page ak-static-page ak-visual-recipe\" id=\"ak-main-content\" role=\"main\" tabindex=\"-1\">",
    "rootSha256": "3f6a8de6229942c03bd51ca2e7d5ed96e11a9aee7a32864c1548dfff82b91fc0"
  }
];

test('dynamic controller retains the original strict directive prologue', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/recipe-page.js'), 'utf8');
  const ast = acorn.parse(source, { ecmaVersion: 'latest' });
  const fn = ast.body.find(node => node.type === 'VariableDeclaration').declarations[0].init.callee;
  assert.equal(fn.body.body[0].directive, 'use strict');
});

for (const fixture of LEGACY_S_FIXTURES) test(fixture.slug + ': genuine S DIV root and UUID-missing payload clear before identity hold without synthesis', () => {
  const crypto = require('node:crypto');
  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  assert.equal(sha(fixture.payloadText), fixture.payloadSha256);
  assert.equal(sha(fixture.rootOpeningTag), fixture.rootSha256);
  assert.match(fixture.rootOpeningTag, /^<div\b/); assert.match(fixture.rootOpeningTag, /id="ak-main-content"/);
  const original = JSON.parse(fixture.payloadText); assert.equal(Object.hasOwn(original, 'id'), false);
  assert.ok(original.steps.length > 0); assert.ok(original.chef_notes.readiness_cues.length > 0);
  const source = fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/static-recipe-runtime.js'), 'utf8');
  const fn = declarations(source).get('showPendingMethod');
  // Derive this source harness root from the pinned HTML, not the candidate's selectors.
  const tagName = fixture.rootOpeningTag.match(/^<([a-z]+)/)[1], id = fixture.rootOpeningTag.match(/\bid="([^"]+)"/)[1];
  for (const input of [original, { ...original, id: '11111111-1111-4111-8111-111111111111' }]) {
    const children = [], removed = [], root = { tagName, id, textContent: 'old method', appendChild(node) { children.push(node); } }, robots = {};
    const document = { querySelector(selector) { if (selector === 'main') return tagName === 'main' ? root : null; if (selector === 'meta[name="robots"]') return robots; return null; },
      getElementById(value) { return value === id ? root : null; }, createElement(tag) { return { tag, setAttribute() {} }; },
      querySelectorAll() { return [{ remove() { removed.push(true); } }]; } };
    const context = { n: plain(input), i: engine, e: {}, t: document, encodeURIComponent }; vm.createContext(context);
    vm.runInContext(fn + ';result=showPendingMethod();', context);
    assert.equal(context.result, false); assert.equal(root.textContent, ''); assert.equal(removed.length, 1);
    assert.equal(context.e.__AK_STATIC_RECIPE.publicationUnavailable, true);
    assert.equal(Object.hasOwn(context.e.__AK_STATIC_RECIPE, 'id'), false);
    assert.deepEqual(plain(context.e.__AK_STATIC_RECIPE.ingredients), []); assert.deepEqual(plain(context.e.__AK_STATIC_RECIPE.steps), []);
    assert.equal(context.e.__AK_STATIC_RECIPE.chef_notes, null); assert.equal(robots.content, 'noindex,follow');
    assert.match(children.find(node => node.tag === 'p').textContent, /cached page has no verifiable recipe identity/);
    assert.equal(children.some(node => node.tag === 'img'), false);
    assert.equal(children.find(node => node.tag === 'a').href, '/tools/afrokitchen/recipes/' + fixture.slug + '/');
  }
});

function inlineFunction(file, name) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const block of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!block[1].includes('function ' + name + '(')) continue;
    const result = declarations(block[1]).get(name); if (result) return result;
  }
  throw Error('Actual inline function not found: ' + file + ' ' + name);
}
for (const surface of ['featured','country','collection']) for (const [kind, input] of [
  ...targets.map(args => [args[0], engine.projectAttributedRecipe({ ...row(...args), is_featured: true, country_code: 'NG' })]),
  ['ordinary', { ...row('ordinary-dish','11111111-1111-4111-8111-111111111111'), country_code: 'NG' }]
]) test(surface + ': actual card renderer ' + kind + ' has truthful timing/yield/action text', async () => {
  const nodes = {}, makeNode = () => ({ innerHTML: '', textContent: '', style: {}, children: [], appendChild(node) { this.children.push(node); } });
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = makeNode()); }, createElement() { return makeNode(); }, title: '' };
  const AK = { fetchRecipes: async () => [plain(input)], fetchCollections: async () => [{ slug: 'synthetic', name: 'Synthetic', recipe_ids: [input.id] }],
    isPendingRecipeMethod: engine.isPendingRecipeMethod, isPublicationUnavailable: () => false, COUNTRIES: { NG: { flag: '', name: 'Nigeria' } } };
  const context = { document, AK, AKRoutes: { recipe: slug => '/tools/afrokitchen/recipes/' + slug + '/' },
    AKImages: { createCardSlotMarkup: () => '<span>Image</span>', createFeaturedSlotMarkup: () => '<span>Image</span>', hydrate() {} },
    code: 'NG', catSelect: { value: '' }, diffSelect: { value: '' }, country: { flag: '', name: 'Nigeria' }, slug: 'synthetic',
    categoryLabel: value => value, showPublicationState: () => false };
  vm.createContext(context);
  const file = 'tools/afrokitchen/' + (surface === 'featured' ? 'index.html' : surface + '.html'), name = surface === 'featured' ? 'loadFeatured' : 'load';
  vm.runInContext(inlineFunction(file, name) + ';operation=' + name + '();', context); await context.operation;
  const html = surface === 'featured' ? nodes['featured-recipe'].innerHTML : nodes['recipes-grid'].children[0].innerHTML;
  if (kind === 'ordinary') { assert.match(html, /85 min/); if (surface === 'featured') { assert.match(html, /Serves 6/); assert.match(html, /Cook this dish/); } }
  else { assert.match(html, surface === 'featured' ? /Time and yield not recorded/ : /Not recorded/); assert.doesNotMatch(html, /0 min|Serves null|Cook this dish/); if (surface === 'featured') assert.match(html, /View dish information/); else assert.match(html, /Source method pending/); }
});

const REVIEWED_SIX = ['mandazi-tanzania-tz','koba-mg','ibihaza-rw','kat-kat-banane-sc','ndizi-nyama-tz','latchiri-kossan-gn'];
function actualProfileOwner() {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/lib/afrokitchen-cuisine-intelligence.js'), 'utf8');
  const context = { recipeMethods: engine }; vm.createContext(context);
  vm.runInContext(declarations(source).get('curatedMethodProfile'), context); return context.curatedMethodProfile;
}
function reviewedPublicFixture() {
  // Synthetic eligibility fixture for actual owner functions, not current live evidence.
  const manifest = structuredClone(require('../tools/afrokitchen/seo-manifest.json'));
  manifest.recipes.forEach(recipe => { recipe.is_published = true; recipe.is_verified = true; });
  return manifest;
}
for (const slug of [...REVIEWED_SIX,'oleleh-sl','kapenta-stew-zm']) test(slug + ': actual reviewed profile owner admits exact maintained source without generic advice fallback', () => {
  const audit = require('../data/afrokitchen/recipe-research-audit.json').recipes;
  const projected = generator.projectReviewedManifest(reviewedPublicFixture(), audit);
  const recipe = projected.recipes.find(item => item.slug === slug), profile = actualProfileOwner()(recipe, audit);
  assert.equal(recipe.method_revision, audit[slug].method_revision); assert.ok(profile);
  if (REVIEWED_SIX.includes(slug)) {
    assert.deepEqual(plain(profile.chefNotes), { common_mistakes: [], readiness_cues: [], pantry_notes: [], technique_notes: [], serve_with: recipe.best_served_with || '' });
    assert.deepEqual(plain(profile.menuTags), []);
  } else { assert.ok(profile.chefNotes.readiness_cues.length > 0); }
});
for (const slug of REVIEWED_SIX) for (const mutation of ['missing-audit','false-curated','wrong-audit-ID','wrong-audit-revision','wrong-recipe-ID','wrong-recipe-revision','unpublished','unverified']) test(slug + ': reviewed profile rejects ' + mutation + ' instead of heuristic fallback', () => {
  const audit = structuredClone(require('../data/afrokitchen/recipe-research-audit.json').recipes);
  const recipe = generator.projectReviewedManifest(reviewedPublicFixture(), audit).recipes.find(item => item.slug === slug);
  if (mutation === 'missing-audit') delete audit[slug];
  if (mutation === 'false-curated') audit[slug].curated_method = false;
  if (mutation === 'wrong-audit-ID') audit[slug].expected_recipe_id = 'wrong';
  if (mutation === 'wrong-audit-revision') audit[slug].method_revision = 'wrong';
  if (mutation === 'wrong-recipe-ID') recipe.id = 'wrong';
  if (mutation === 'wrong-recipe-revision') recipe.method_revision = 'wrong';
  if (mutation === 'unpublished') recipe.is_published = false;
  if (mutation === 'unverified') recipe.is_verified = false;
  assert.throws(() => actualProfileOwner()(recipe, audit), /Attributed intelligence identity\/revision\/audit mismatch/);
});
test('reviewed profile retains ordinary null and exact pending empty-advice behavior', () => {
  const profile = actualProfileOwner(); assert.equal(profile({ slug: 'ordinary-dish' }, {}), null);
  for (const [slug, id] of targets) assert.deepEqual(plain(profile(row(slug,id), {}).chefNotes), { common_mistakes: [], readiness_cues: [], pantry_notes: [], technique_notes: [], serve_with: '' });
});
test('Oleleh exact reviewed manifest and summary projection preserves authority and six-person source yield', () => {
  const audit = require('../data/afrokitchen/recipe-research-audit.json').recipes, input = reviewedPublicFixture();
  const source = input.recipes.find(recipe => recipe.slug === 'oleleh-sl'), before = plain(source);
  input.countries = [{ recipes: [plain(source)] }]; input.collections = [{ recipes: [plain(source)] }];
  const result = generator.projectReviewedManifest(input, audit);
  for (const group of [result, ...result.countries, ...result.collections]) {
    const recipe = group.recipes.find(item => item.slug === 'oleleh-sl');
    assert.equal(recipe.id, before.id); assert.equal(recipe.is_published, before.is_published); assert.equal(recipe.is_verified, before.is_verified);
    assert.equal(recipe.method_revision, 'oleleh-isata-89959d1b'); assert.equal(recipe.default_servings, 6);
    assert.equal(recipe.prep_time_minutes, null); assert.equal(recipe.cook_time_minutes, 40); assert.equal(recipe.total_time_minutes, null);
  }
  const bad = structuredClone(input); bad.recipes.find(recipe => recipe.slug === 'oleleh-sl').id = 'wrong';
  assert.throws(() => generator.projectReviewedManifest(bad, audit), /Curated recipe identity mismatch/);
});


for (const [slug, id] of targets) test(slug + ': pending owner provides a responsive shared shell, navigation and honest save-only illustration', () => {
  const input = engine.projectPendingRecipeMethod(row(slug, id));
  const html = generator.buildPendingMethodPageHtml(input, staticOwner.loadRecipeImages());
  assert.match(html, new RegExp('data-ak-pending-method-view="' + id + '"'));
  assert.match(html, new RegExp('data-ak-pending-slug="' + slug + '"'));
  assert.match(html, /container--narrow ak-pending-shell/);
  assert.match(html, /<nav[^>]+aria-label="Breadcrumb"/);
  assert.match(html, /class="card" aria-labelledby="ak-pending-title"/);
  assert.match(html, /data-ak-pending-reason/);
  assert.match(html, /<button[^>]+class="btn btn-primary"[^>]+data-ak-save-recipe[^>]+aria-pressed="false"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /href="\/tools\/afrokitchen\/#browse-panel">Browse other dishes/);
  assert.match(html, /src="\/assets\/js\/components\/navbar\.min\.js/);
  assert.match(html, /src="\/assets\/js\/components\/footer\.min\.js/);
  assert.match(html, /<figcaption>AI-generated illustration; not a photograph or proof/);
  assert.match(html, /\.ak-pending-page figure img[^}]*width:100%/);
  assert.match(html, /\.ak-pending-page :is\(a,button\):focus-visible/);
  assert.doesNotMatch(html, /data-ak-cook-mode|data-ak-add-meal-plan|data-ak-download-recipe|data-ak-copy-recipe|"@type"\s*:\s*"(?:Recipe|HowTo)"/);
  assert.deepEqual(inspectPendingMethodPage(input, html), { state: 'pending-source-method', errors: [] });
});

for (const [slug, id] of targets) for (const variant of ['current', 'unmarked', 'wrong-marker-id', 'wrong-marker-slug', 'wrong-id', 'stale-review', 'old-ingredients', 'old-steps', 'old-method-controls', 'false-approval', 'old-chef-notes']) {
  test(slug + ': marked pending runtime ' + variant + ' preserves only current sanitized eligible layout', () => {
    const input = plain(engine.projectPendingRecipeMethod(row(slug, id)));
    if (variant === 'wrong-id') input.id = '11111111-1111-4111-8111-111111111111';
    if (variant === 'stale-review') input.method_review_revision = 'old-review';
    if (variant === 'old-ingredients') input.ingredients = [{ name: 'invented old ingredient', quantity: 4 }];
    if (variant === 'old-steps') input.steps = [{ instruction: 'invented old method' }];
    if (variant === 'false-approval') input.is_verified = false;
    if (variant === 'old-chef-notes') input.chef_notes = { readiness_cues: ['unreviewed cue'] };
    const children = [], removed = [], save = { identity: 'actual-save' }, status = {}, robots = {}; let cleared = false;
    const root = {
      textContent: 'approved informational layout',
      getAttribute(key) {
        if (variant === 'unmarked') return null;
        if (key === 'data-ak-pending-method-view') return variant === 'wrong-marker-id' ? 'other-id' : id;
        if (key === 'data-ak-pending-slug') return variant === 'wrong-marker-slug' ? 'other-slug' : slug;
        return null;
      },
      querySelector(selector) {
        if (selector === '[data-ak-pending-reason]') return { textContent: input.description };
        if (selector === 'button[data-ak-save-recipe]') return save;
        return variant === 'old-method-controls' ? { name: 'old cook control' } : null;
      },
      querySelectorAll(selector) { assert.equal(selector, 'button'); return [save]; },
      appendChild(node) { children.push(node); }
    };
    Object.defineProperty(root, 'textContent', { get() { return cleared ? '' : 'approved informational layout'; }, set(value) { assert.equal(value, ''); cleared = true; } });
    const document = {
      querySelector(selector) { return selector === 'main' ? root : selector === 'meta[name="robots"]' ? robots : selector.includes('save-recipe') ? save : status; },
      getElementById() { return null; }, createElement(tag) { return { tag, setAttribute() {} }; },
      querySelectorAll() { return [{ remove() { removed.push('schema'); } }]; }
    };
    const context = { n: input, i: engine, e: {}, t: document, encodeURIComponent }; vm.createContext(context);
    vm.runInContext(declarations(fs.readFileSync(path.join(ROOT, 'tools/afrokitchen/static-recipe-runtime.js'), 'utf8')).get('showPendingMethod') + ';result=showPendingMethod();', context);
    assert.equal(cleared, variant !== 'current');
    assert.equal(children.length === 0, variant === 'current');
    assert.equal(robots.content, 'noindex,follow'); assert.equal(removed.length, 1);
    assert.deepEqual(plain(context.e.__AK_STATIC_RECIPE.ingredients), []);
    assert.deepEqual(plain(context.e.__AK_STATIC_RECIPE.steps), []);
    if (variant === 'wrong-id') assert.equal(Object.hasOwn(context.e.__AK_STATIC_RECIPE, 'id'), false);
  });
}

test('Kisra current attributed revision alone may activate static cooking; stale/missing identity and revisions stay withheld',()=>{
 const source=fs.readFileSync(path.join(ROOT,'tools/afrokitchen/static-recipe-runtime.js'),'utf8'),functions=declarations(source),base=row('kisra-south-sudan-ss','c0aced74-68d6-437d-b00b-abd1895605f0'),current=engine.projectAttributedRecipe(base);
 assert.equal(engine.isPendingRecipeMethod(current),false);assert.equal(engine.isAttributedRecipe(current),true);
 for(const [input,expected] of [[current,false],[base,true],[{...current,method_revision:'stale'},true],[{...current,id:undefined},true],[{...current,slug:'wrong'},true],[{...current,is_verified:false},true],[row('maheu-zm','626fd465-87e1-4f93-bca7-747decbf63d0'),true]]){
  const context={n:input,i:engine};vm.runInNewContext(functions.get('pendingMethod')+';result=pendingMethod();',context);assert.equal(context.result,expected);
 }
});

test('Maheu current exact attributed method activates but all legacy/missing/wrong identities or revisions remain withheld',()=>{
 const source=fs.readFileSync(path.join(ROOT,'tools/afrokitchen/static-recipe-runtime.js'),'utf8'),functions=declarations(source),old=row('maheu-zm','626fd465-87e1-4f93-bca7-747decbf63d0'),current=engine.projectAttributedRecipe(old);assert.equal(engine.isPendingRecipeMethod(current),false);assert.equal(engine.isAttributedRecipe(current),true);
 for(const [n,expected] of [[current,false],[old,true],[{...current,id:undefined},true],[{...current,slug:'wrong'},true],[{...current,method_revision:'old'},true],[{...current,is_published:false},true]]){const ctx={n,i:engine};vm.runInNewContext(functions.get('pendingMethod')+';result=pendingMethod();',ctx);assert.equal(ctx.result,expected);}
});

test('Kunu current exact attributed method activates while legacy and wrong publication/UUID/revision remain withheld',()=>{
 const functions=declarations(fs.readFileSync(path.join(ROOT,'tools/afrokitchen/static-recipe-runtime.js'),'utf8')),old=row('kunu-zaki-ng','8a2bb743-87d9-462e-bc09-335e78f9584a'),current=engine.projectAttributedRecipe(old);assert.equal(engine.isPendingRecipeMethod(current),false);assert.equal(engine.isAttributedRecipe(current),true);
 for(const [n,expected]of [[current,false],[old,true],[{...current,id:undefined},true],[{...current,slug:'wrong'},true],[{...current,method_revision:'old'},true],[{...current,is_published:false},true],[{...current,is_verified:false},true]]){const ctx={n,i:engine};vm.runInNewContext(functions.get('pendingMethod')+';result=pendingMethod();',ctx);assert.equal(ctx.result,expected);}
});
