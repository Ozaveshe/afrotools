'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const sandbox = {
  __dirname: path.join(root, 'scripts'),
  require(id) { return id === '@supabase/supabase-js' ? { createClient() { throw new Error('Live client forbidden'); } } : require(id); },
  process: { argv: ['node', 'importer', '--help'], env: {}, exit() { throw new Error('Unexpected importer exit'); } },
  console: { log() {}, error() {} }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts/import-afrokitchen-expansion-batch.js'), 'utf8'), sandbox);
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/afrokitchen/recipe-expansion-batches/2026-04-28-wave-1.json'), 'utf8'));
function fakeDatabase(existing, failure) {
  let saved = existing ? { id: 'existing-id', slug: 'synthetic', is_published: true, ...existing } : null;
  const writes = [], cleanup = [];
  return {
    writes, cleanup, saved: () => saved,
    from(table) {
      let action = 'read', payload, filter;
      const query = {
        select() { return query; },
        eq(field, value) { filter = [field, value]; return query; },
        update(value) { action = 'update'; payload = value; return query; },
        insert(value) { action = 'insert'; payload = value; return query; },
        delete() { action = 'delete'; return query; },
        maybeSingle() { assert.equal(table, 'recipes'); assert.deepEqual(filter, ['slug', 'synthetic']); return Promise.resolve({ data: saved, error: failure === 'read' ? { message: 'read failed' } : null }); },
        single() {
          writes.push({ action, payload });
          if (failure === 'write') return Promise.resolve({ data: null, error: { message: 'write failed' } });
          if (action === 'update') { assert.deepEqual(filter, ['id', saved.id]); saved = { ...saved, ...payload }; }
          else { assert.equal(action, 'insert'); assert.equal(saved, null); saved = { id: 'new-id', is_published: false, ...payload }; }
          return Promise.resolve({ data: { id: saved.id, slug: saved.slug }, error: null });
        },
        then(resolve, reject) { if (action === 'delete') cleanup.push(table); return Promise.resolve({ data: null, error: null }).then(resolve, reject); }
      };
      return query;
    }
  };
}
for (const [name, existing, supplied, expected, verified] of [
  ['new rows default to draft', null, {}, false, false],
  ['new published rows need explicit intent', null, { is_published: true, is_verified: false }, true, false],
  ['omission retains an existing publication value', { is_published: true }, {}, true, false],
  ['omission retains an existing draft value', { is_published: false }, { is_verified: true }, false, true],
  ['explicit false unpublishes an existing row', { is_published: true }, { is_published: false }, false, false],
  ['explicit true publishes an existing draft', { is_published: false }, { is_published: true }, true, false]
]) {
  test('importer publication: ' + name, async () => {
    const db = fakeDatabase(existing);
    await sandbox.upsertRecipe(db, { ...batch.recipes[0], slug: 'synthetic', ...supplied });
    assert.equal(db.saved().is_published, expected);
    assert.equal(db.saved().is_verified, verified);
    assert.equal(db.writes[0].action, existing ? 'update' : 'insert');
    if (!Object.hasOwn(supplied, 'is_published')) assert(!Object.hasOwn(db.writes[0].payload, 'is_published'));
  });
}
for (const failure of ['read', 'write']) test('importer stops before child cleanup on ' + failure + ' failure', async () => {
  const db = fakeDatabase({ is_published: true }, failure);
  await assert.rejects(sandbox.upsertRecipe(db, { ...batch.recipes[0], slug: 'synthetic' }), /failed/);
  assert.equal(db.cleanup.length, 0);
  assert.equal(db.saved().is_published, true);
});
test('importer rejects malformed publication and verification flags before any writes', async () => {
  for (const field of ['is_published', 'is_verified']) for (const value of ['true', 1, null]) {
    const db = fakeDatabase(null);
    await assert.rejects(sandbox.upsertRecipe(db, { ...batch.recipes[0], slug: 'synthetic', [field]: value }), /boolean/);
    assert.equal(db.writes.length, 0);
    assert(sandbox.validateBatch({ recipes: [{ ...batch.recipes[0], [field]: value }] }).some(error => error.includes(field)));
  }
});
test('importer rejects placeholder fermentation without inventing a universal replacement time', () => {
  for (const timer of [0, 720, 86400]) {
    const recipe = structuredClone(batch.recipes[0]);
    recipe.steps[0] = { title: 'Ferment', instruction: 'Stir in a starter and ferment loosely covered until lightly sour.', timer_seconds: timer, timer_label: 'ferment' };
    assert(sandbox.validateBatch({ recipes: [recipe] }).some(error => error.includes('placeholder fermentation')));
  }
  const recipe = structuredClone(batch.recipes[0]);
  recipe.steps[0] = { title: 'Cook', instruction: 'Synthetic cooking checkpoint.', timer_seconds: 720, timer_label: 'simmer' };
  assert(!sandbox.validateBatch({ recipes: [recipe] }).some(error => error.includes('placeholder fermentation')));
  recipe.steps[0].timer_label = 'ferment';
  assert(sandbox.validateBatch({ recipes: [recipe] }).some(error => error.includes('placeholder fermentation')));
});
test('all nine reviewed corrections preserve explicit publication and withdrawn verification', () => {
  const corrections = require('../data/afrokitchen/recipe-method-overrides.json');
  const generated = require('../data/afrokitchen/recipe-expansion-batches/2026-05-03-gap-fill-wave-1.json');
  assert.equal(Object.keys(corrections).length, 9);
  for (const slug of Object.keys(corrections)) {
    const recipe = generated.recipes.find(row => row.slug === slug);
    assert.equal(sandbox.validateBatch({ recipes: [recipe] }).length, 0, slug);
    const payload = sandbox.recipePayload(recipe);
    assert.equal(payload.is_verified, false);
    assert.equal(payload.is_published, true);
  }
});
