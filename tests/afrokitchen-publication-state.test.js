'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const { buildRecipeIndex } = require('../scripts/lib/afrokitchen-recipe-index');
const root = path.resolve(__dirname, '..');
const rows = [
  ['published-verified', true, true],
  ['published-unverified', true, false],
  ['unpublished-verified', false, true],
  ['unpublished-unverified', false, false]
].map(([slug, is_published, is_verified], index) => ({
  id: '00000000-0000-4000-8000-' + String(index + 1).padStart(12, '0'),
  slug, name: slug, description: 'Synthetic publication boundary fixture.',
  country_code: 'NG', country_name: 'Nigeria', region: 'West Africa', category: 'side',
  default_servings: 1, prep_time_minutes: 5, cook_time_minutes: 10, difficulty: 'easy',
  is_published, is_verified, is_featured: false, view_count: index, generated_in_wave: true,
  ingredients: [{ name: 'Synthetic ingredient', amount: 1, unit: 'portion', sort_order: 1 }],
  steps: [{ step_number: 1, title: 'Fixture step', instruction: 'Synthetic test content.' }]
}));
const expected = ['published-unverified', 'published-verified'];
const slugs = data => Array.from(data, row => row.slug).sort();
function client() {
  return {
    from(table) {
      let result = table === 'recipes' ? rows.map(row => ({ ...row }))
        : table === 'recipe_ingredients' ? rows.flatMap(row => row.ingredients.map(item => ({ ...item, recipe_id: row.id })))
        : table === 'recipe_steps' ? rows.flatMap(row => row.steps.map(item => ({ ...item, recipe_id: row.id }))) : [];
      let single = false;
      const query = {
        select() { return query; },
        eq(field, value) { result = result.filter(row => row[field] === value); return query; },
        order() { return query; },
        range(start, end) { result = result.slice(start, end + 1); return query; },
        limit(count) { result = result.slice(0, count); return query; },
        single() { single = true; return query; },
        then(resolve, reject) { return Promise.resolve({ data: single ? result[0] || null : result, error: single && !result.length ? new Error('No row') : null }).then(resolve, reject); }
      };
      return query;
    },
    rpc() { return Promise.resolve({ data: null, error: null }); }
  };
}
function browser() {
  const context = { window: { fetch: async () => ({ ok: false }), supabase: { createClient: client } }, console: { warn() {} }, Promise, Date };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'engines/src/afrokitchen-engine.js'), 'utf8'), context);
  return context.AfroKitchenEngine;
}
function api() {
  const filename = path.join(root, 'netlify/functions/afrokitchen-recipes.js');
  const context = { exports: {}, process: { env: { SUPABASE_ANON_KEY: 'synthetic-key' } }, URL, fetch: async raw => {
    const url = new URL(raw), table = url.pathname.split('/').at(-1);
    let result = table === 'recipes' ? rows.map(row => ({ ...row })) : [];
    for (const [key, value] of url.searchParams) {
      if (!value.startsWith('eq.')) continue;
      const expectedValue = value.slice(3);
      result = result.filter(row => String(row[key]) === expectedValue);
    }
    return { ok: true, json: async () => result };
  } };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  return params => context.exports.handler({ httpMethod: 'GET', headers: {}, queryStringParameters: params });
}

test('published index includes unverified public rows and excludes verified drafts', () => {
  const result = buildRecipeIndex({ recipes: rows });
  assert.deepEqual(slugs(result.recipes), expected);
});
test('legacy saved manifest remains readable but explicit unpublished always wins', () => {
  const legacy = { ...rows[0] }; delete legacy.is_published;
  assert.deepEqual(slugs(buildRecipeIndex({ recipes: [legacy, rows[2], { ...rows[3], is_published: undefined }] }).recipes), ['published-verified']);
});
test('server API list preserves publication without claiming verification', async () => {
  const result = await api()({ action: 'list' });
  assert.equal(result.statusCode, 200);
  const data = JSON.parse(result.body);
  assert.deepEqual(slugs(data), expected);
  assert.equal(data.find(row => row.slug === 'published-unverified').is_verified, false);
});
test('server API detail admits published-unverified and rejects both draft states and unknown', async () => {
  const call = api();
  const published = await call({ action: 'get', slug: 'published-unverified' });
  assert.equal(published.statusCode, 200);
  assert.equal(JSON.parse(published.body).is_verified, false);
  for (const slug of ['unpublished-verified', 'unpublished-unverified', 'unknown-fixture']) {
    assert.equal((await call({ action: 'get', slug })).statusCode, 404);
  }
});
test('browser live list uses publication when the saved index is unavailable', async () => {
  const data = await browser().fetchRecipes({});
  assert.deepEqual(slugs(data), expected);
  assert.equal(data.find(row => row.slug === 'published-unverified').is_verified, false);
});
test('browser live detail admits published-unverified and fails closed for drafts and unknown', async () => {
  const engine = browser();
  assert.equal((await engine.fetchRecipeBySlug('published-unverified')).is_verified, false);
  for (const slug of ['unpublished-verified', 'unpublished-unverified', 'unknown-fixture']) assert.equal(await engine.fetchRecipeBySlug(slug), null);
});
test('native manifest exporter selects public rows and counts verification separately', async () => {
  const filename = path.join(root, 'scripts/lib/afrokitchen-static.js');
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const normalRequire = instance.require.bind(instance);
  instance.require = name => name === '@supabase/supabase-js' ? { createClient: client } : normalRequire(name);
  instance._compile(fs.readFileSync(filename, 'utf8'), filename);
  const manifest = await instance.exports.buildManifest();
  assert.deepEqual(slugs(manifest.recipes), expected);
  assert.equal(manifest.source.published_recipe_count, 2);
  assert.equal(manifest.source.verified_recipe_count, 1);
  assert.equal(manifest.wave.recipe_count, 2);
  assert.equal(manifest.recipes.find(row => row.slug === 'published-unverified').is_verified, false);
});
